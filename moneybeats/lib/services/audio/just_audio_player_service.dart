import 'dart:async';
import 'dart:io';
import 'dart:math';

import 'package:audio_session/audio_session.dart';
import 'package:flutter/foundation.dart';
import 'package:just_audio/just_audio.dart';
import 'package:just_audio_background/just_audio_background.dart';
import 'package:rxdart/rxdart.dart';

import '../../core/platform/platform_capabilities.dart';
import '../../data/models/track.dart';
import 'audio_player_service.dart';
import 'playback_models.dart';
import 'queue_shuffle_order.dart';

/// [AudioPlayerService] backed by a single `just_audio` [AudioPlayer].
///
/// On Android and iOS, `just_audio_background` turns that player into a
/// background service with notification and lock-screen controls. On
/// Windows and Linux, `just_audio_media_kit` provides the backend.
class JustAudioPlayerService implements AudioPlayerService {
  JustAudioPlayerService({AudioSession? session, Random? random})
    : _random = random ?? Random() {
    _shuffleOrder = QueueShuffleOrder(
      currentIndex: () => _player.currentIndex,
      random: _random,
    );
    _player = AudioPlayer(
      shuffleOrder: _shuffleOrder,
      // Skip past a damaged file instead of stopping the whole queue.
      maxSkipsOnError: 3,
    );
    _wire(session);
  }

  late final AudioPlayer _player;
  late final QueueShuffleOrder _shuffleOrder;
  final Random _random;

  /// Restart the current track instead of going back if past this point.
  static const restartThreshold = Duration(seconds: 3);

  final Map<String, Track> _tracksById = {};
  String? _sourceLabel;

  final _status = BehaviorSubject<PlaybackStatus>.seeded(
    const PlaybackStatus(),
  );
  final _queue = BehaviorSubject<QueueState>.seeded(QueueState.empty);
  final _position = BehaviorSubject<PositionState>.seeded(PositionState.zero);
  final _volume = BehaviorSubject<double>.seeded(1.0);
  final _effects = BehaviorSubject<AudioEffects>.seeded(AudioEffects.neutral);
  final _errors = StreamController<PlaybackError>.broadcast();
  final _resolvedDurations = StreamController<ResolvedDuration>.broadcast();
  final _subscriptions = <StreamSubscription<Object?>>[];

  void _wire(AudioSession? session) {
    _subscriptions
      ..add(
        _player.playerStateStream.listen((state) {
          _status.add(
            PlaybackStatus(
              playing: state.playing,
              phase: _mapPhase(state.processingState),
            ),
          );
        }),
      )
      ..add(_player.sequenceStateStream.listen(_onSequenceState))
      ..add(
        Rx.combineLatest3<Duration, Duration, Duration?, PositionState>(
          _player.positionStream,
          _player.bufferedPositionStream,
          _player.durationStream,
          (position, buffered, duration) => PositionState(
            position: position,
            bufferedPosition: buffered,
            duration: duration,
          ),
        ).distinct().listen(_position.add),
      )
      ..add(_player.volumeStream.listen(_volume.add))
      ..add(_player.durationStream.listen(_onDuration))
      ..add(
        _player.errorStream.listen((error) {
          final track = _queue.value.currentTrack;
          _errors.add(
            PlaybackError(
              track == null
                  ? "That song couldn't be played."
                  : "Couldn't play “${track.title}”. The file may be damaged.",
              trackId: track?.id,
            ),
          );
        }),
      );

    if (session != null) {
      // Pause when headphones are unplugged.
      _subscriptions.add(
        session.becomingNoisyEventStream.listen((_) => pause()),
      );
    }
  }

  static PlaybackPhase _mapPhase(ProcessingState state) => switch (state) {
    ProcessingState.idle => PlaybackPhase.idle,
    ProcessingState.loading => PlaybackPhase.loading,
    ProcessingState.buffering => PlaybackPhase.buffering,
    ProcessingState.ready => PlaybackPhase.ready,
    ProcessingState.completed => PlaybackPhase.completed,
  };

  static LoopMode _toLoopMode(PlayerRepeatMode mode) => switch (mode) {
    PlayerRepeatMode.off => LoopMode.off,
    PlayerRepeatMode.all => LoopMode.all,
    PlayerRepeatMode.one => LoopMode.one,
  };

  static PlayerRepeatMode _fromLoopMode(LoopMode mode) => switch (mode) {
    LoopMode.off => PlayerRepeatMode.off,
    LoopMode.all => PlayerRepeatMode.all,
    LoopMode.one => PlayerRepeatMode.one,
  };

  void _onSequenceState(SequenceState state) {
    final tracks = <Track>[];
    for (final source in state.sequence) {
      final track = _trackFor(source);
      if (track != null) tracks.add(track);
    }
    final playOrder =
        state.shuffleModeEnabled && state.shuffleIndices.length == tracks.length
        ? List<int>.of(state.shuffleIndices)
        : List<int>.generate(tracks.length, (i) => i);
    _queue.add(
      QueueState(
        tracks: tracks,
        currentIndex: tracks.isEmpty ? null : state.currentIndex,
        playOrder: playOrder,
        shuffleEnabled: state.shuffleModeEnabled,
        repeatMode: _fromLoopMode(state.loopMode),
        sourceLabel: _sourceLabel,
      ),
    );
  }

  Track? _trackFor(IndexedAudioSource source) {
    final tag = source.tag;
    if (tag is MediaItem) return _tracksById[tag.id];
    return null;
  }

  void _onDuration(Duration? duration) {
    if (duration == null || duration <= Duration.zero) return;
    final track = _queue.value.currentTrack;
    if (track == null) return;
    final diff = (duration - track.duration).abs();
    if (diff > const Duration(milliseconds: 1000)) {
      _tracksById[track.id] = track.copyWith(duration: duration);
      _resolvedDurations.add(ResolvedDuration(track.id, duration));
      _onSequenceState(_player.sequenceState);
    }
  }

  AudioSource _sourceFor(Track track) {
    return AudioSource.file(
      track.filePath,
      tag: MediaItem(
        id: track.id,
        title: track.title,
        artist: track.displayArtist,
        album: track.displayAlbum,
        duration: track.duration > Duration.zero ? track.duration : null,
        artUri: track.artworkPath == null ? null : Uri.file(track.artworkPath!),
      ),
    );
  }

  /// Drops tracks whose files have gone missing and reports them.
  List<Track> _playable(List<Track> tracks) {
    final playable = <Track>[];
    var missing = 0;
    for (final track in tracks) {
      if (File(track.filePath).existsSync()) {
        playable.add(track);
        _tracksById[track.id] = track;
      } else {
        missing++;
      }
    }
    if (missing > 0) {
      _errors.add(
        PlaybackError(
          missing == 1
              ? 'One song is missing from storage and was skipped.'
              : '$missing songs are missing from storage and were skipped.',
        ),
      );
    }
    return playable;
  }

  Future<void> _guard(Future<void> Function() action) async {
    try {
      await action();
    } on PlayerInterruptedException {
      // A newer request replaced this one, which is expected.
    } on PlayerException catch (e) {
      debugPrint('Playback error: ${e.code} ${e.message}');
      _errors.add(
        PlaybackError("That song couldn't be played. (${e.message ?? e.code})"),
      );
    } catch (e) {
      debugPrint('Playback error: $e');
      _errors.add(const PlaybackError('Something went wrong with playback.'));
    }
  }

  void _startPlayback() {
    unawaited(
      _player.play().catchError((Object e) {
        debugPrint('play() failed: $e');
      }),
    );
  }

  // ---------------------------------------------------------------- state

  @override
  PlaybackStatus get status => _status.value;
  @override
  Stream<PlaybackStatus> get statusStream => _status.stream;

  @override
  QueueState get queue => _queue.value;
  @override
  Stream<QueueState> get queueStream => _queue.stream;

  @override
  PositionState get positionState => _position.value;
  @override
  Stream<PositionState> get positionStream => _position.stream;

  @override
  double get volume => _volume.value;
  @override
  Stream<double> get volumeStream => _volume.stream;

  @override
  AudioEffects get effects => _effects.value;
  @override
  Stream<AudioEffects> get effectsStream => _effects.stream;

  @override
  Stream<PlaybackError> get errorStream => _errors.stream;
  @override
  Stream<ResolvedDuration> get resolvedDurationStream =>
      _resolvedDurations.stream;

  // ------------------------------------------------------------- starting

  @override
  Future<void> playTracks(
    List<Track> tracks, {
    int startIndex = 0,
    bool shuffle = false,
    String? sourceLabel,
  }) async {
    final requested = tracks.isEmpty
        ? 0
        : startIndex.clamp(0, tracks.length - 1).toInt();
    final startTrackId = tracks.isEmpty ? null : tracks[requested].id;
    final playable = _playable(tracks);
    if (playable.isEmpty) return;
    var start = playable.indexWhere((t) => t.id == startTrackId);
    if (start < 0) start = 0;
    if (shuffle) start = _random.nextInt(playable.length);
    _sourceLabel = sourceLabel;

    await _guard(() async {
      if (shuffle && !_player.shuffleModeEnabled) {
        await _player.setShuffleModeEnabled(true);
      }
      _shuffleOrder.insertMode = ShuffleInsertMode.atEnd;
      await _player.setAudioSources(
        [for (final t in playable) _sourceFor(t)],
        initialIndex: start,
        initialPosition: Duration.zero,
        shuffleOrder: _shuffleOrder,
        preload: false,
      );
      // Shuffle the rest of the queue around the chosen first song.
      if (_player.shuffleModeEnabled) await _player.shuffle();
      _startPlayback();
    });
  }

  @override
  Future<void> loadQueue(
    List<Track> tracks, {
    int startIndex = 0,
    Duration position = Duration.zero,
  }) async {
    final requestedId = tracks.isEmpty
        ? null
        : tracks[startIndex.clamp(0, tracks.length - 1)].id;
    final playable = _playable(tracks);
    if (playable.isEmpty) return;
    var start = playable.indexWhere((t) => t.id == requestedId);
    if (start < 0) {
      start = 0;
      position = Duration.zero;
    }
    await _guard(() async {
      _shuffleOrder.insertMode = ShuffleInsertMode.atEnd;
      await _player.setAudioSources(
        [for (final t in playable) _sourceFor(t)],
        initialIndex: start,
        initialPosition: position,
        shuffleOrder: _shuffleOrder,
        preload: false,
      );
      if (_player.shuffleModeEnabled) await _player.shuffle();
    });
  }

  // ------------------------------------------------------------ transport

  @override
  Future<void> play() async {
    if (_queue.value.isEmpty) return;
    await _guard(() async {
      if (_player.processingState == ProcessingState.completed) {
        // The queue finished: start again from the top.
        final order = _queue.value.playOrder;
        await _player.seek(
          Duration.zero,
          index: order.isEmpty ? 0 : order.first,
        );
      }
      _startPlayback();
    });
  }

  @override
  Future<void> pause() => _guard(_player.pause);

  @override
  Future<void> togglePlayPause() {
    if (_status.value.showPause) return pause();
    return play();
  }

  @override
  Future<void> seek(Duration position) => _guard(() async {
    final total =
        _position.value.duration ?? _queue.value.currentTrack?.duration;
    var target = position < Duration.zero ? Duration.zero : position;
    if (total != null && total > Duration.zero && target > total) {
      target = total;
    }
    await _player.seek(target);
  });

  int? _relativeIndex(int offset) {
    final queue = _queue.value;
    final current = queue.currentIndex;
    final order = queue.playOrder;
    if (current == null || order.isEmpty) return null;
    final pos = order.indexOf(current);
    if (pos < 0) return null;
    final target = pos + offset;
    if (target >= 0 && target < order.length) return order[target];
    if (queue.repeatMode == PlayerRepeatMode.off) return null;
    return order[(target % order.length + order.length) % order.length];
  }

  @override
  Future<void> skipToNext() => _guard(() async {
    final next = _relativeIndex(1);
    if (next == null) return;
    await _player.seek(Duration.zero, index: next);
    if (!_player.playing) _startPlayback();
  });

  @override
  Future<void> skipToPrevious() => _guard(() async {
    final previous = _relativeIndex(-1);
    if (previous == null || _player.position > restartThreshold) {
      await _player.seek(Duration.zero);
    } else {
      await _player.seek(Duration.zero, index: previous);
    }
    if (!_player.playing) _startPlayback();
  });

  @override
  Future<void> skipToQueueIndex(int index) => _guard(() async {
    if (index < 0 || index >= _queue.value.tracks.length) return;
    await _player.seek(Duration.zero, index: index);
    if (!_player.playing) _startPlayback();
  });

  // ---------------------------------------------------------------- modes

  @override
  Future<void> setShuffleEnabled(bool enabled) => _guard(() async {
    await _player.setShuffleModeEnabled(enabled);
    // Keep the current song first and shuffle everything else.
    if (enabled) await _player.shuffle();
  });

  @override
  Future<void> toggleShuffle() =>
      setShuffleEnabled(!_player.shuffleModeEnabled);

  @override
  Future<void> setRepeatMode(PlayerRepeatMode mode) =>
      _guard(() => _player.setLoopMode(_toLoopMode(mode)));

  @override
  Future<void> cycleRepeatMode() => setRepeatMode(_queue.value.repeatMode.next);

  @override
  Future<void> setVolume(double volume) =>
      _guard(() => _player.setVolume(volume.clamp(0.0, 1.0)));

  // --------------------------------------------------------- queue editing

  @override
  Future<void> addToQueue(List<Track> tracks) => _guard(() async {
    final playable = _playable(tracks);
    if (playable.isEmpty) return;
    if (_queue.value.isEmpty) {
      await loadQueue(playable);
      return;
    }
    _shuffleOrder.insertMode = ShuffleInsertMode.atEnd;
    await _player.addAudioSources([for (final t in playable) _sourceFor(t)]);
  });

  @override
  Future<void> playNext(List<Track> tracks) => _guard(() async {
    final playable = _playable(tracks);
    if (playable.isEmpty) return;
    final current = _player.currentIndex;
    if (_queue.value.isEmpty || current == null) {
      await loadQueue(playable);
      return;
    }
    _shuffleOrder.insertMode = ShuffleInsertMode.afterCurrent;
    try {
      await _player.insertAudioSources(current + 1, [
        for (final t in playable) _sourceFor(t),
      ]);
    } finally {
      _shuffleOrder.insertMode = ShuffleInsertMode.atEnd;
    }
  });

  @override
  Future<void> removeFromQueue(int index) => _guard(() async {
    if (index < 0 || index >= _player.audioSources.length) return;
    if (_player.audioSources.length == 1) {
      await _player.stop();
      await _player.clearAudioSources();
      _sourceLabel = null;
      return;
    }
    await _player.removeAudioSourceAt(index);
  });

  @override
  Future<void> moveInQueue(int from, int to) => _guard(() async {
    final length = _player.audioSources.length;
    if (from < 0 || from >= length || to < 0 || to >= length || from == to) {
      return;
    }
    _shuffleOrder.insertMode = ShuffleInsertMode.atEnd;
    await _player.moveAudioSource(from, to);
  });

  @override
  Future<void> removeTrackEverywhere(String trackId) async {
    final indices = <int>[];
    final tracks = _queue.value.tracks;
    for (var i = 0; i < tracks.length; i++) {
      if (tracks[i].id == trackId) indices.add(i);
    }
    for (final index in indices.reversed) {
      await removeFromQueue(index);
    }
    _tracksById.remove(trackId);
  }

  @override
  void updateTracks(List<Track> tracks) {
    var changed = false;
    for (final track in tracks) {
      final existing = _tracksById[track.id];
      if (existing != null && existing != track) {
        _tracksById[track.id] = track;
        changed = true;
      }
    }
    if (changed) _onSequenceState(_player.sequenceState);
  }

  // -------------------------------------------------------------- effects

  @override
  Future<void> setSpeed(double speed) => _guard(() async {
    final value = speed.clamp(0.5, 2.0);
    await _player.setSpeed(value);
    _effects.add(_effects.value.copyWith(speed: value));
  });

  @override
  Future<void> setPitch(double pitch) => _guard(() async {
    if (!PlatformCapabilities.supportsPitch) return;
    final value = pitch.clamp(0.5, 2.0);
    await _player.setPitch(value);
    _effects.add(_effects.value.copyWith(pitch: value));
  });

  @override
  Future<void> dispose() async {
    for (final sub in _subscriptions) {
      await sub.cancel();
    }
    await _player.dispose();
    await _status.close();
    await _queue.close();
    await _position.close();
    await _volume.close();
    await _effects.close();
    await _errors.close();
    await _resolvedDurations.close();
  }
}
