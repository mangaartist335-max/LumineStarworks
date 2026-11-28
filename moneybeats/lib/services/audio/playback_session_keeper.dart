import 'dart:async';

import 'package:flutter/foundation.dart';

import '../../data/models/track.dart';
import '../../data/repositories/settings_repository.dart';
import 'audio_player_service.dart';
import 'playback_models.dart';

/// Saves the queue, position, volume, shuffle and repeat settings, and
/// restores them on the next launch so the user can pick up where they left
/// off.
class PlaybackSessionKeeper {
  PlaybackSessionKeeper({required this._player, required this._settings});

  final AudioPlayerService _player;
  final SettingsRepository _settings;
  final _subscriptions = <StreamSubscription<Object?>>[];
  Timer? _saveDebounce;
  Timer? _positionTimer;
  bool _restoring = false;

  /// Restores preferences and the last queue (paused).
  Future<void> restore(List<Track> library) async {
    _restoring = true;
    try {
      final volume = await _settings.getVolume();
      if (volume != null) await _player.setVolume(volume);
      await _player.setRepeatMode(
        PlayerRepeatMode.fromName(await _settings.getRepeatMode()),
      );
      final shuffle = await _settings.getShuffle();
      if (shuffle) await _player.setShuffleEnabled(true);

      final session = await _settings.getSession();
      if (session == null || session.trackIds.isEmpty) return;
      final byId = {for (final t in library) t.id: t};
      final tracks = <Track>[];
      var index = 0;
      for (var i = 0; i < session.trackIds.length; i++) {
        final track = byId[session.trackIds[i]];
        if (track == null) continue;
        if (i == session.index) index = tracks.length;
        tracks.add(track);
      }
      if (tracks.isEmpty) return;
      await _player.loadQueue(
        tracks,
        startIndex: index,
        position: session.position,
      );
    } catch (e) {
      debugPrint('Could not restore the last session: $e');
    } finally {
      _restoring = false;
    }
  }

  void start() {
    _subscriptions
      ..add(
        _player.queueStream
            .distinct((a, b) {
              return listEquals(
                    a.tracks.map((t) => t.id).toList(),
                    b.tracks.map((t) => t.id).toList(),
                  ) &&
                  a.currentIndex == b.currentIndex &&
                  a.shuffleEnabled == b.shuffleEnabled &&
                  a.repeatMode == b.repeatMode;
            })
            .listen((queue) {
              if (_restoring) return;
              unawaited(_settings.setShuffle(queue.shuffleEnabled));
              unawaited(_settings.setRepeatMode(queue.repeatMode.name));
              _scheduleSave();
            }),
      )
      ..add(
        _player.volumeStream.distinct().listen((volume) {
          if (!_restoring) unawaited(_settings.setVolume(volume));
        }),
      )
      ..add(
        _player.statusStream.listen((status) {
          if (status.isActuallyPlaying) {
            _positionTimer ??= Timer.periodic(
              const Duration(seconds: 10),
              (_) => saveNow(),
            );
          } else {
            _positionTimer?.cancel();
            _positionTimer = null;
            if (!_restoring) _scheduleSave();
          }
        }),
      );
  }

  void _scheduleSave() {
    _saveDebounce?.cancel();
    _saveDebounce = Timer(const Duration(milliseconds: 600), saveNow);
  }

  Future<void> saveNow() async {
    final queue = _player.queue;
    try {
      await _settings.setSession(
        SavedPlaybackSession(
          trackIds: [for (final t in queue.tracks) t.id],
          index: queue.currentIndex ?? 0,
          position: _player.positionState.position,
        ),
      );
    } catch (e) {
      debugPrint('Could not save the playback session: $e');
    }
  }

  /// Stops pending timers immediately (synchronously).
  void stopTimers() {
    _saveDebounce?.cancel();
    _saveDebounce = null;
    _positionTimer?.cancel();
    _positionTimer = null;
  }

  Future<void> dispose() async {
    stopTimers();
    for (final sub in _subscriptions) {
      await sub.cancel();
    }
  }
}
