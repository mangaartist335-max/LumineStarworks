import 'dart:async';
import 'dart:io';

import 'package:moneybeats/data/models/track.dart';
import 'package:moneybeats/services/audio/audio_player_service.dart';
import 'package:moneybeats/services/audio/playback_models.dart';
import 'package:moneybeats/services/import/audio_file_picker.dart';
import 'package:rxdart/rxdart.dart';

/// Builds a [Track] with sensible defaults for tests.
Track makeTrack(
  String id, {
  String? title,
  String? artist = 'Test Artist',
  String? album = 'Test Album',
  int? trackNumber,
  Duration duration = const Duration(minutes: 3),
  DateTime? dateAdded,
  DateTime? lastPlayedAt,
  bool isFavorite = false,
  DateTime? favoritedAt,
  String? filePath,
}) {
  return Track(
    id: id,
    filePath: filePath ?? '/music/$id.mp3',
    originalFileName: '$id.mp3',
    title: title ?? 'Song $id',
    artist: artist,
    album: album,
    trackNumber: trackNumber,
    duration: duration,
    contentHash: 'hash-$id',
    dateAdded: dateAdded ?? DateTime(2026, 1, 1),
    lastPlayedAt: lastPlayedAt,
    isFavorite: isFavorite,
    favoritedAt: favoritedAt,
  );
}

/// An in-memory [AudioPlayerService] that records calls and models the
/// queue well enough for UI and state tests.
class FakeAudioPlayerService implements AudioPlayerService {
  final calls = <String>[];

  final _status = BehaviorSubject<PlaybackStatus>.seeded(
    const PlaybackStatus(),
  );
  final _queue = BehaviorSubject<QueueState>.seeded(QueueState.empty);
  final _position = BehaviorSubject<PositionState>.seeded(PositionState.zero);
  final _volume = BehaviorSubject<double>.seeded(1.0);
  final _effects = BehaviorSubject<AudioEffects>.seeded(AudioEffects.neutral);
  final _errors = StreamController<PlaybackError>.broadcast();
  final _resolved = StreamController<ResolvedDuration>.broadcast();

  List<Track> _tracks = [];
  int? _index;
  bool _shuffle = false;
  PlayerRepeatMode _repeat = PlayerRepeatMode.off;
  String? _label;

  void _emitQueue() {
    _queue.add(
      QueueState(
        tracks: List.unmodifiable(_tracks),
        currentIndex: _tracks.isEmpty ? null : _index,
        playOrder: List.generate(_tracks.length, (i) => i),
        shuffleEnabled: _shuffle,
        repeatMode: _repeat,
        sourceLabel: _label,
      ),
    );
  }

  /// Simulates the engine reporting progress.
  void emitPosition(Duration position, {Duration? duration}) =>
      _position.add(PositionState(position: position, duration: duration));

  void emitStatus(PlaybackStatus status) => _status.add(status);

  void emitError(String message) => _errors.add(PlaybackError(message));

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
  Stream<ResolvedDuration> get resolvedDurationStream => _resolved.stream;

  @override
  Future<void> playTracks(
    List<Track> tracks, {
    int startIndex = 0,
    bool shuffle = false,
    String? sourceLabel,
  }) async {
    calls.add('playTracks:$startIndex:${shuffle ? 'shuffle' : 'ordered'}');
    _tracks = List.of(tracks);
    _index = startIndex;
    _label = sourceLabel;
    if (shuffle) _shuffle = true;
    _emitQueue();
    _status.add(
      const PlaybackStatus(playing: true, phase: PlaybackPhase.ready),
    );
  }

  @override
  Future<void> loadQueue(
    List<Track> tracks, {
    int startIndex = 0,
    Duration position = Duration.zero,
  }) async {
    calls.add('loadQueue:$startIndex:${position.inMilliseconds}');
    _tracks = List.of(tracks);
    _index = startIndex;
    _emitQueue();
    _position.add(PositionState(position: position));
  }

  @override
  Future<void> play() async {
    calls.add('play');
    _status.add(
      const PlaybackStatus(playing: true, phase: PlaybackPhase.ready),
    );
  }

  @override
  Future<void> pause() async {
    calls.add('pause');
    _status.add(
      const PlaybackStatus(playing: false, phase: PlaybackPhase.ready),
    );
  }

  @override
  Future<void> togglePlayPause() => status.showPause ? pause() : play();

  @override
  Future<void> seek(Duration position) async {
    calls.add('seek:${position.inMilliseconds}');
    _position.add(
      PositionState(position: position, duration: _position.value.duration),
    );
  }

  @override
  Future<void> skipToNext() async {
    calls.add('next');
    if (_index != null && _index! < _tracks.length - 1) {
      _index = _index! + 1;
      _emitQueue();
    }
  }

  @override
  Future<void> skipToPrevious() async {
    calls.add('previous');
    if (_index != null && _index! > 0) {
      _index = _index! - 1;
      _emitQueue();
    }
  }

  @override
  Future<void> skipToQueueIndex(int index) async {
    calls.add('jump:$index');
    _index = index;
    _emitQueue();
  }

  @override
  Future<void> setShuffleEnabled(bool enabled) async {
    calls.add('shuffle:$enabled');
    _shuffle = enabled;
    _emitQueue();
  }

  @override
  Future<void> toggleShuffle() => setShuffleEnabled(!_shuffle);

  @override
  Future<void> setRepeatMode(PlayerRepeatMode mode) async {
    calls.add('repeat:${mode.name}');
    _repeat = mode;
    _emitQueue();
  }

  @override
  Future<void> cycleRepeatMode() => setRepeatMode(_repeat.next);

  @override
  Future<void> setVolume(double volume) async {
    calls.add('volume:${volume.toStringAsFixed(2)}');
    _volume.add(volume);
  }

  @override
  Future<void> addToQueue(List<Track> tracks) async {
    calls.add('addToQueue:${tracks.length}');
    _tracks = [..._tracks, ...tracks];
    _index ??= 0;
    _emitQueue();
  }

  @override
  Future<void> playNext(List<Track> tracks) async {
    calls.add('playNext:${tracks.length}');
    final at = (_index ?? -1) + 1;
    _tracks = [..._tracks]..insertAll(at, tracks);
    _index ??= 0;
    _emitQueue();
  }

  @override
  Future<void> removeFromQueue(int index) async {
    calls.add('remove:$index');
    _tracks = [..._tracks]..removeAt(index);
    if (_tracks.isEmpty) _index = null;
    _emitQueue();
  }

  @override
  Future<void> moveInQueue(int from, int to) async {
    calls.add('move:$from:$to');
    final list = [..._tracks];
    final item = list.removeAt(from);
    list.insert(to, item);
    _tracks = list;
    _emitQueue();
  }

  @override
  Future<void> removeTrackEverywhere(String trackId) async {
    calls.add('removeEverywhere:$trackId');
    _tracks = _tracks.where((t) => t.id != trackId).toList();
    if (_tracks.isEmpty) _index = null;
    _emitQueue();
  }

  @override
  void updateTracks(List<Track> tracks) {}

  @override
  Future<void> setSpeed(double speed) async =>
      _effects.add(_effects.value.copyWith(speed: speed));

  @override
  Future<void> setPitch(double pitch) async =>
      _effects.add(_effects.value.copyWith(pitch: pitch));

  @override
  Future<void> dispose() async {
    await _status.close();
    await _queue.close();
    await _position.close();
    await _volume.close();
    await _effects.close();
    await _errors.close();
    await _resolved.close();
  }
}

/// A picker that returns preset files instead of opening a dialog.
class FakeAudioFilePicker implements AudioFilePicker {
  FakeAudioFilePicker([this.files = const []]);

  List<File> files;
  int cleanUps = 0;

  @override
  Future<List<ImportSource>> pickAudioFiles() async => [
    for (final f in files) FileImportSource(f),
  ];

  @override
  Future<void> cleanUp() async => cleanUps++;
}

/// Absolute path of a file in test/fixtures.
String fixturePath(String name) =>
    '${Directory.current.path}/test/fixtures/$name';
