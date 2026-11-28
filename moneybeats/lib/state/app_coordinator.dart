import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/models/track.dart';
import '../services/audio/listening_tracker.dart';
import '../services/audio/playback_session_keeper.dart';
import 'core_providers.dart';
import 'library_providers.dart';

/// Connects the long-lived services once the app starts:
///
/// * restores the last playback session after the library loads,
/// * keeps queued tracks in sync with library edits (favourites, lengths),
/// * stores exact durations discovered by the audio engine,
/// * records listening activity and saves the session as you listen.
class AppCoordinator {
  AppCoordinator(this._ref);

  final Ref _ref;
  ListeningTracker? _tracker;
  PlaybackSessionKeeper? _keeper;
  StreamSubscription<Object?>? _durationSub;
  bool _restored = false;

  void start() {
    final player = _ref.read(audioPlayerServiceProvider);

    _tracker = ListeningTracker(
      player: player,
      tracks: _ref.read(trackRepositoryProvider),
      listening: _ref.read(listeningRepositoryProvider),
    )..start();

    final keeper = _keeper = PlaybackSessionKeeper(
      player: player,
      settings: _ref.read(settingsRepositoryProvider),
    );

    _durationSub = player.resolvedDurationStream.listen((resolved) {
      unawaited(
        _ref
            .read(trackRepositoryProvider)
            .updateDuration(resolved.trackId, resolved.duration)
            .catchError(
              (Object e) => debugPrint('Could not store duration: $e'),
            ),
      );
    });

    _ref.listen<AsyncValue<List<Track>>>(libraryProvider, (previous, next) {
      final tracks = next.value;
      if (tracks == null) return;
      player.updateTracks(tracks);
      if (!_restored) {
        _restored = true;
        unawaited(keeper.restore(tracks).whenComplete(keeper.start));
      }
    }, fireImmediately: true);
  }

  Future<void> dispose() async {
    _keeper?.stopTimers();
    await _durationSub?.cancel();
    await _tracker?.dispose();
    // The session is already saved on every queue change, on pause and every
    // few seconds while playing, so nothing needs writing here.
    await _keeper?.dispose();
  }
}

final appCoordinatorProvider = Provider<AppCoordinator>((ref) {
  final coordinator = AppCoordinator(ref)..start();
  ref.onDispose(coordinator.dispose);
  return coordinator;
});
