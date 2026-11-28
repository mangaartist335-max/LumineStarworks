// The audio engine: the AudioPlayerService interface used by the whole app,
// platform audio setup, the just_audio implementation, and the shuffle order
// that keeps "Play next" predictable.

import 'dart:async';
import 'dart:io';
import 'dart:math';

import 'package:audio_session/audio_session.dart';
import 'package:flutter/foundation.dart';
import 'package:just_audio/just_audio.dart';
import 'package:just_audio_background/just_audio_background.dart';
import 'package:just_audio_media_kit/just_audio_media_kit.dart';
import 'package:moneybeats/core/constants/app_constants.dart';
import 'package:moneybeats/core/theme/app_colors.dart';
import 'package:moneybeats/core/utilities/platform_capabilities.dart';
import 'package:moneybeats/models/playback.dart';
import 'package:moneybeats/models/track.dart';
import 'package:rxdart/rxdart.dart';

/// The single audio engine used across the whole app.
///
/// UI and state code depend on this interface only, which keeps the engine
/// swappable (and fakeable in tests) and gives the future Studio features
/// (pitch, speed, equaliser) one place to plug in.
abstract class AudioPlayerService {
  // State.
  PlaybackStatus get status;
  Stream<PlaybackStatus> get statusStream;

  QueueState get queue;
  Stream<QueueState> get queueStream;

  PositionState get positionState;
  Stream<PositionState> get positionStream;

  double get volume;
  Stream<double> get volumeStream;

  /// Android: the audio session that native effects attach to (null
  /// elsewhere, or before audio has loaded).
  Stream<int?> get audioSessionIdStream;

  /// Playback lifecycle events (start, pause, resume, stop, track change,
  /// speed change, seek, completion). Groundwork for verified listening.
  Stream<PlaybackLifecycleEvent> get lifecycleStream;

  Stream<PlaybackError> get errorStream;
  Stream<ResolvedDuration> get resolvedDurationStream;

  // Starting playback.

  /// Replaces the queue with [tracks] and starts playing [startIndex].
  /// With [shuffle], playback starts on a random track in shuffled order.
  Future<void> playTracks(
    List<Track> tracks, {
    int startIndex = 0,
    bool shuffle = false,
    String? sourceLabel,
  });

  /// Loads a queue without starting playback (used to restore a session).
  Future<void> loadQueue(
    List<Track> tracks, {
    int startIndex = 0,
    Duration position = Duration.zero,
  });

  // Transport.
  Future<void> play();
  Future<void> pause();
  Future<void> togglePlayPause();
  Future<void> seek(Duration position);
  Future<void> skipToNext();

  /// Restarts the current track if it has played for more than a few
  /// seconds, otherwise goes to the previous one.
  Future<void> skipToPrevious();
  Future<void> skipToQueueIndex(int index);

  // Modes.
  Future<void> setShuffleEnabled(bool enabled);
  Future<void> toggleShuffle();
  Future<void> setRepeatMode(PlayerRepeatMode mode);
  Future<void> cycleRepeatMode();
  Future<void> setVolume(double volume);

  // Queue editing.
  Future<void> addToQueue(List<Track> tracks);
  Future<void> playNext(List<Track> tracks);
  Future<void> removeFromQueue(int index);
  Future<void> moveInQueue(int from, int to);

  /// Removes every queue entry for [trackId] (e.g. after it is deleted).
  Future<void> removeTrackEverywhere(String trackId);

  /// Refreshes the stored metadata for tracks already in the queue.
  void updateTracks(List<Track> tracks);

  // Effects (ready for the Studio phase).
  /// Playback rate (0.5-2.0). Pitch is preserved.
  Future<void> setSpeed(double speed);

  /// Pitch factor (`2^(semitones/12)`), independent of speed. Only works where
  /// the player supports pitch (Android); the desktop Studio uses filters.
  Future<void> setPitch(double pitch);

  /// Attenuation on top of the user's volume, so effect boosts have headroom
  /// without moving the volume slider. 1.0 is none.
  Future<void> setEffectsGain(double gain);

  Future<void> dispose();
}

/// Prepares the platform audio stack. Must run once, before the
/// [JustAudioPlayerService] (and so the `AudioPlayer`) is created.
abstract final class AudioBootstrap {
  static Future<AudioSession?> initialize() async {
    if (PlatformCapabilities.usesMediaKitBackend) {
      // libmpv-based backend for Windows and Linux.
      JustAudioMediaKit.title = 'MoneyBeats';
      // MoneyBeats owns libmpv's audio filter chain (Studio effects), so turn
      // off media_kit's own pitch trick, which would overwrite it. Speed still
      // keeps pitch through mpv's built-in tempo correction.
      JustAudioMediaKit.pitch = false;
      JustAudioMediaKit.ensureInitialized(linux: true, windows: true);
    }

    if (PlatformCapabilities.supportsBackgroundPlayback) {
      // Notification, lock-screen and headset controls on Android and iOS.
      await JustAudioBackground.init(
        androidNotificationChannelId: AppConstants.notificationChannelId,
        androidNotificationChannelName: AppConstants.notificationChannelName,
        androidNotificationChannelDescription:
            AppConstants.notificationChannelDescription,
        androidNotificationOngoing: true,
        notificationColor: AppColors.primary,
        androidNotificationIcon: AppConstants.notificationIcon,
        artDownscaleWidth: 512,
        artDownscaleHeight: 512,
      );
    }

    try {
      final session = await AudioSession.instance;
      await session.configure(const AudioSessionConfiguration.music());
      return session;
    } catch (e) {
      debugPrint('Audio session unavailable: $e');
      return null;
    }
  }
}

/// [AudioPlayerService] backed by a single `just_audio` [AudioPlayer].
///
/// On Android and iOS, `just_audio_background` turns that player into a
/// background service with notification and lock-screen controls. On
/// Windows and Linux, `just_audio_media_kit` provides the backend.
///
/// Shuffle: Android and iOS use the engine's native shuffle order. The
/// desktop backend can't take a custom order (it reshuffles its own playlist,
/// which would desynchronise queue indices), so there the service shuffles
/// by physically reordering the queue and restores the order afterwards.
class JustAudioPlayerService implements AudioPlayerService {
  JustAudioPlayerService({
    AudioSession? session,
    Random? random,
    bool? nativeShuffle,
    AudioPipeline? audioPipeline,
  }) : _random = random ?? Random(),
       _nativeShuffle =
           nativeShuffle ?? !PlatformCapabilities.usesMediaKitBackend {
    _shuffleOrder = QueueShuffleOrder(
      currentIndex: () => _player.currentIndex,
      random: _random,
    );
    _player = AudioPlayer(
      shuffleOrder: _shuffleOrder,
      // Skip past a damaged file instead of stopping the whole queue.
      maxSkipsOnError: 3,
      // Android: the equaliser lives in the player's audio pipeline.
      audioPipeline: audioPipeline,
    );
    _wire(session);
  }

  late final AudioPlayer _player;
  late final QueueShuffleOrder _shuffleOrder;
  final Random _random;

  /// Whether the backend supports custom shuffle orders.
  final bool _nativeShuffle;

  /// Queue-reordering shuffle state (backends without native shuffle).
  bool _softShuffle = false;
  List<AudioSource> _orderBeforeShuffle = const [];

  bool get _shuffleOn =>
      _nativeShuffle ? _player.shuffleModeEnabled : _softShuffle;

  /// Restart the current track instead of going back if past this point.
  static const restartThreshold = AppConstants.restartThreshold;

  final Map<String, Track> _tracksById = {};
  String? _sourceLabel;

  final _status = BehaviorSubject<PlaybackStatus>.seeded(
    const PlaybackStatus(),
  );
  final _queue = BehaviorSubject<QueueState>.seeded(QueueState.empty);
  final _position = BehaviorSubject<PositionState>.seeded(PositionState.zero);
  final _volume = BehaviorSubject<double>.seeded(1.0);
  final _lifecycle = StreamController<PlaybackLifecycleEvent>.broadcast();
  double _userVolume = 1.0;
  double _effectsGain = 1.0;

  // Lifecycle tracking.
  String? _currentTrackId;
  bool _wasActuallyPlaying = false;
  bool _startedCurrentTrack = false;
  bool _userChangedTrack = false;
  final _errors = StreamController<PlaybackError>.broadcast();
  final _resolvedDurations = StreamController<ResolvedDuration>.broadcast();
  final _subscriptions = <StreamSubscription<Object?>>[];

  void _wire(AudioSession? session) {
    _subscriptions
      ..add(
        _player.playerStateStream.listen((state) {
          final status = PlaybackStatus(
            playing: state.playing,
            phase: _mapPhase(state.processingState),
          );
          _status.add(status);
          _onStatusForLifecycle(status);
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
      ..add(_player.durationStream.listen(_onDuration))
      ..add(
        _player.errorStream.listen((error) {
          final track = _queue.value.currentTrack;
          _errors.add(
            PlaybackError(
              track == null
                  ? "That song couldn't be played."
                  : "Couldn't play “${track.title}”. Check the file or your audio output.",
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
    final nativeShuffled =
        _nativeShuffle &&
        state.shuffleModeEnabled &&
        state.shuffleIndices.length == tracks.length;
    final playOrder = nativeShuffled
        ? List<int>.of(state.shuffleIndices)
        : List<int>.generate(tracks.length, (i) => i);
    _queue.add(
      QueueState(
        tracks: tracks,
        currentIndex: tracks.isEmpty ? null : state.currentIndex,
        playOrder: playOrder,
        shuffleEnabled: _nativeShuffle
            ? state.shuffleModeEnabled
            : _softShuffle,
        repeatMode: _fromLoopMode(state.loopMode),
        sourceLabel: _sourceLabel,
      ),
    );
    _onTrackForLifecycle(_queue.value.currentTrack?.id);
  }

  void _emit(PlaybackLifecycleType type, {String? trackId}) {
    if (_lifecycle.isClosed) return;
    _lifecycle.add(
      PlaybackLifecycleEvent(
        type: type,
        at: DateTime.now(),
        trackId: trackId ?? _currentTrackId,
        position: _player.position,
        speed: _player.speed,
      ),
    );
  }

  void _onStatusForLifecycle(PlaybackStatus status) {
    final playing = status.isActuallyPlaying;
    if (status.phase == PlaybackPhase.completed && _wasActuallyPlaying) {
      _wasActuallyPlaying = false;
      _emit(PlaybackLifecycleType.trackCompleted);
      _emit(PlaybackLifecycleType.queueCompleted);
      _startedCurrentTrack = false;
      return;
    }
    if (playing && !_wasActuallyPlaying) {
      _emit(
        _startedCurrentTrack
            ? PlaybackLifecycleType.resumed
            : PlaybackLifecycleType.started,
      );
      _startedCurrentTrack = true;
    } else if (!playing &&
        _wasActuallyPlaying &&
        !status.playing &&
        status.phase != PlaybackPhase.completed) {
      _emit(PlaybackLifecycleType.paused);
    }
    if (!status.isBusy) _wasActuallyPlaying = playing;
  }

  void _onTrackForLifecycle(String? trackId) {
    if (trackId == _currentTrackId) return;
    final previous = _currentTrackId;
    if (previous != null && trackId != null && !_userChangedTrack) {
      // Nobody skipped: the previous song played to its end.
      _emit(PlaybackLifecycleType.trackCompleted, trackId: previous);
    }
    _userChangedTrack = false;
    _currentTrackId = trackId;
    if (trackId == null) {
      if (previous != null) {
        _emit(PlaybackLifecycleType.stopped, trackId: previous);
      }
      _startedCurrentTrack = false;
      return;
    }
    _emit(PlaybackLifecycleType.trackChanged);
    _startedCurrentTrack = false;
    if (_status.value.isActuallyPlaying) {
      _emit(PlaybackLifecycleType.started);
      _startedCurrentTrack = true;
    }
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
  Stream<int?> get audioSessionIdStream => _player.androidAudioSessionIdStream;
  @override
  Stream<PlaybackLifecycleEvent> get lifecycleStream => _lifecycle.stream;

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
    _userChangedTrack = true;
    final sources = [for (final t in playable) _sourceFor(t)];

    await _guard(() async {
      if (!_nativeShuffle) {
        if (shuffle) _softShuffle = true;
        var ordered = sources;
        var initial = start;
        if (_softShuffle) {
          // The chosen song first, the rest shuffled after it.
          _orderBeforeShuffle = List.of(sources);
          ordered = _shuffledAround(sources, start);
          initial = 0;
        }
        await _player.setAudioSources(
          ordered,
          initialIndex: initial,
          initialPosition: Duration.zero,
          preload: false,
        );
        _startPlayback();
        return;
      }

      if (shuffle && !_player.shuffleModeEnabled) {
        await _player.setShuffleModeEnabled(true);
      }
      _shuffleOrder.insertMode = ShuffleInsertMode.atEnd;
      await _player.setAudioSources(
        sources,
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

  /// [sources] with the item at [first] moved to the front and the rest
  /// shuffled.
  List<AudioSource> _shuffledAround(List<AudioSource> sources, int first) {
    final rest = [
      for (var i = 0; i < sources.length; i++)
        if (i != first) sources[i],
    ]..shuffle(_random);
    return [sources[first], ...rest];
  }

  /// Puts the live queue in [target] order (desktop shuffle). The desktop
  /// backend can't move the playing entry reliably, so the queue is rebuilt
  /// and the current song resumes from the same position.
  Future<void> _reorderQueue(List<AudioSource> target) async {
    final index = _player.currentIndex;
    final sources = _player.audioSources;
    if (index == null || index >= sources.length) return;
    final current = sources[index];
    final wasPlaying = _player.playing;
    final position = _player.position;
    final newIndex = target.indexWhere((s) => identical(s, current));
    await _player.setAudioSources(
      target,
      initialIndex: newIndex < 0 ? 0 : newIndex,
      initialPosition: position,
      preload: wasPlaying,
    );
    if (wasPlaying) _startPlayback();
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
      final sources = [for (final t in playable) _sourceFor(t)];
      if (!_nativeShuffle) {
        // A restored queue is already in the order it was being played.
        _orderBeforeShuffle = List.of(sources);
        await _player.setAudioSources(
          sources,
          initialIndex: start,
          initialPosition: position,
          preload: false,
        );
        return;
      }
      _shuffleOrder.insertMode = ShuffleInsertMode.atEnd;
      await _player.setAudioSources(
        sources,
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
    _emit(PlaybackLifecycleType.seeked);
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
    _userChangedTrack = true;
    await _player.seek(Duration.zero, index: next);
    if (!_player.playing) _startPlayback();
  });

  @override
  Future<void> skipToPrevious() => _guard(() async {
    final previous = _relativeIndex(-1);
    if (previous == null || _player.position > restartThreshold) {
      await _player.seek(Duration.zero);
    } else {
      _userChangedTrack = true;
      await _player.seek(Duration.zero, index: previous);
    }
    if (!_player.playing) _startPlayback();
  });

  @override
  Future<void> skipToQueueIndex(int index) => _guard(() async {
    if (index < 0 || index >= _queue.value.tracks.length) return;
    _userChangedTrack = index != _queue.value.currentIndex;
    await _player.seek(Duration.zero, index: index);
    if (!_player.playing) _startPlayback();
  });

  // ---------------------------------------------------------------- modes

  @override
  Future<void> setShuffleEnabled(bool enabled) => _guard(() async {
    if (_nativeShuffle) {
      await _player.setShuffleModeEnabled(enabled);
      // Keep the current song first and shuffle everything else.
      if (enabled) await _player.shuffle();
      return;
    }
    if (enabled == _softShuffle) return;
    final sources = List<AudioSource>.of(_player.audioSources);
    final current = _player.currentIndex;
    if (enabled) {
      _orderBeforeShuffle = sources;
      _softShuffle = true;
      if (sources.length > 1 && current != null) {
        await _reorderQueue(_shuffledAround(sources, current));
      }
    } else {
      _softShuffle = false;
      // Restore the original order; songs added while shuffled go last.
      final original = [
        for (final s in _orderBeforeShuffle)
          if (sources.any((x) => identical(x, s))) s,
      ];
      final added = [
        for (final s in sources)
          if (!original.any((x) => identical(x, s))) s,
      ];
      await _reorderQueue([...original, ...added]);
    }
    _onSequenceState(_player.sequenceState);
  });

  @override
  Future<void> toggleShuffle() => setShuffleEnabled(!_shuffleOn);

  @override
  Future<void> setRepeatMode(PlayerRepeatMode mode) =>
      _guard(() => _player.setLoopMode(_toLoopMode(mode)));

  @override
  Future<void> cycleRepeatMode() => setRepeatMode(_queue.value.repeatMode.next);

  @override
  Future<void> setVolume(double volume) => _guard(() async {
    _userVolume = volume.clamp(0.0, 1.0);
    _volume.add(_userVolume);
    await _player.setVolume(_userVolume * _effectsGain);
  });

  @override
  Future<void> setEffectsGain(double gain) => _guard(() async {
    _effectsGain = gain.clamp(0.0, 1.0);
    await _player.setVolume(_userVolume * _effectsGain);
  });

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
    final value = speed.clamp(0.5, 2.0).toDouble();
    if ((value - _player.speed).abs() < 0.0001) return;
    await _player.setSpeed(value);
    _emit(PlaybackLifecycleType.speedChanged);
  });

  @override
  Future<void> setPitch(double pitch) => _guard(() async {
    if (!PlatformCapabilities.supportsNativePitch) return;
    final value = pitch.clamp(0.5, 2.0).toDouble();
    if ((value - _player.pitch).abs() < 0.0001) return;
    await _player.setPitch(value);
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
    await _lifecycle.close();
    await _errors.close();
    await _resolvedDurations.close();
  }
}

/// How newly inserted queue items are placed in the shuffled order.
enum ShuffleInsertMode {
  /// Right after the current item ("Play next").
  afterCurrent,

  /// At the end of the shuffled order ("Add to queue").
  atEnd,
}

/// A [ShuffleOrder] that keeps "Play next" and "Add to queue" predictable
/// while shuffle is on. The default order scatters new items randomly.
class QueueShuffleOrder extends ShuffleOrder {
  QueueShuffleOrder({required this.currentIndex, Random? random})
    : _random = random ?? Random();

  /// Reads the player's current queue index.
  final int? Function() currentIndex;
  final Random _random;

  ShuffleInsertMode insertMode = ShuffleInsertMode.atEnd;

  @override
  final List<int> indices = <int>[];

  @override
  void shuffle({int? initialIndex}) {
    if (indices.length <= 1) return;
    indices.shuffle(_random);
    if (initialIndex == null) return;
    final swapPos = indices.indexOf(initialIndex);
    if (swapPos <= 0) return;
    indices[swapPos] = indices[0];
    indices[0] = initialIndex;
  }

  @override
  void insert(int index, int count) {
    if (count <= 0) return;
    // `currentIndex` still refers to the pre-insert queue at this point.
    final current = currentIndex();
    for (var i = 0; i < indices.length; i++) {
      if (indices[i] >= index) indices[i] += count;
    }
    final newIndices = List<int>.generate(count, (i) => index + i);
    if (insertMode == ShuffleInsertMode.afterCurrent && current != null) {
      final shiftedCurrent = current >= index ? current + count : current;
      final pos = indices.indexOf(shiftedCurrent);
      indices.insertAll(pos < 0 ? indices.length : pos + 1, newIndices);
    } else {
      indices.addAll(newIndices);
    }
  }

  @override
  void removeRange(int start, int end) {
    final count = end - start;
    if (count <= 0) return;
    indices.removeWhere((i) => i >= start && i < end);
    for (var i = 0; i < indices.length; i++) {
      if (indices[i] >= end) indices[i] -= count;
    }
  }

  @override
  void clear() => indices.clear();
}
