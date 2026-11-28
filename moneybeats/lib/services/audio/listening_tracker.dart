import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../data/repositories/listening_repository.dart';
import '../../data/repositories/track_repository.dart';
import 'audio_player_service.dart';
import 'playback_models.dart';

/// Watches the player and records real listening time.
///
/// * Marks a track as played (recently played, play count) once it actually
///   starts producing sound.
/// * Records continuous listening stretches to [ListeningRepository]. Only
///   time spent actually playing counts; paused, buffering or seeking time is
///   excluded. This is the data the future rewards system will build on.
class ListeningTracker {
  ListeningTracker({
    required this._player,
    required this._tracks,
    required this._listening,
    DateTime Function()? clock,
  }) : _clock = clock ?? DateTime.now;

  final AudioPlayerService _player;
  final TrackRepository _tracks;
  final ListeningRepository _listening;
  final DateTime Function() _clock;

  final _subscriptions = <StreamSubscription<Object?>>[];

  String? _trackId;
  bool _countedPlay = false;
  bool _playing = false;
  DateTime? _sessionStart;
  DateTime? _runningSince;
  Duration _accumulated = Duration.zero;
  PositionState _lastPosition = PositionState.zero;
  Duration? _lastKnownDuration;

  void start() {
    _subscriptions
      ..add(
        _player.queueStream.listen(
          (queue) =>
              _onTrack(queue.currentTrack?.id, queue.currentTrack?.duration),
        ),
      )
      ..add(_player.statusStream.listen(_onStatus))
      ..add(_player.positionStream.listen((p) => _lastPosition = p));
  }

  void _onTrack(String? trackId, Duration? duration) {
    if (trackId == _trackId) {
      _lastKnownDuration = duration ?? _lastKnownDuration;
      return;
    }
    _flush();
    _trackId = trackId;
    _lastKnownDuration = duration;
    _countedPlay = false;
    if (_playing) _resume();
    _maybeCountPlay();
  }

  void _onStatus(PlaybackStatus status) {
    final playing = status.isActuallyPlaying;
    if (playing == _playing) return;
    _playing = playing;
    if (playing) {
      _resume();
      _maybeCountPlay();
    } else {
      _pauseClock();
      // A pause ends the continuous stretch.
      if (status.phase != PlaybackPhase.buffering &&
          status.phase != PlaybackPhase.loading) {
        _flush();
      }
    }
  }

  void _resume() {
    if (_trackId == null) return;
    _sessionStart ??= _clock();
    _runningSince ??= _clock();
  }

  void _pauseClock() {
    final since = _runningSince;
    if (since != null) {
      _accumulated += _clock().difference(since);
      _runningSince = null;
    }
  }

  void _maybeCountPlay() {
    final id = _trackId;
    if (id == null || _countedPlay || !_playing) return;
    _countedPlay = true;
    unawaited(
      _tracks.markPlayed(id, _clock()).catchError((Object e) {
        debugPrint('Could not record play: $e');
      }),
    );
  }

  void _flush() {
    _pauseClock();
    final id = _trackId;
    final start = _sessionStart;
    final listened = _accumulated;
    _sessionStart = null;
    _accumulated = Duration.zero;
    if (id == null || start == null || listened < const Duration(seconds: 1)) {
      return;
    }
    final total = _lastPosition.duration ?? _lastKnownDuration;
    final completed =
        total != null &&
        total > Duration.zero &&
        _lastPosition.position.inMilliseconds >= total.inMilliseconds * 0.9;
    unawaited(
      _listening
          .recordSession(
            trackId: id,
            startedAt: start,
            listened: listened,
            completed: completed,
          )
          .catchError((Object e) {
            debugPrint('Could not record listening session: $e');
          }),
    );
  }

  Future<void> dispose() async {
    _flush();
    for (final sub in _subscriptions) {
      await sub.cancel();
    }
  }
}
