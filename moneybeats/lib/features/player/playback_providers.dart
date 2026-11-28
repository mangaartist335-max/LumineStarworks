import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:moneybeats/core/providers.dart';
import 'package:moneybeats/features/library/library_providers.dart';
import 'package:moneybeats/models/playback.dart';
import 'package:moneybeats/models/track.dart';

final _statusStreamProvider = StreamProvider<PlaybackStatus>(
  (ref) => ref.watch(audioPlayerServiceProvider).statusStream,
);

final _queueStreamProvider = StreamProvider<QueueState>(
  (ref) => ref.watch(audioPlayerServiceProvider).queueStream,
);

final _positionStreamProvider = StreamProvider<PositionState>(
  (ref) => ref.watch(audioPlayerServiceProvider).positionStream,
);

final _volumeStreamProvider = StreamProvider<double>(
  (ref) => ref.watch(audioPlayerServiceProvider).volumeStream,
);

/// Playing / paused / loading.
final playbackStatusProvider = Provider<PlaybackStatus>((ref) {
  return ref.watch(_statusStreamProvider).value ??
      ref.read(audioPlayerServiceProvider).status;
});

/// The queue, current index, shuffle and repeat state.
final queueStateProvider = Provider<QueueState>((ref) {
  return ref.watch(_queueStreamProvider).value ??
      ref.read(audioPlayerServiceProvider).queue;
});

/// Position updates. Only widgets that show progress should watch this.
final positionStateProvider = Provider<PositionState>((ref) {
  return ref.watch(_positionStreamProvider).value ??
      ref.read(audioPlayerServiceProvider).positionState;
});

final volumeProvider = Provider<double>((ref) {
  return ref.watch(_volumeStreamProvider).value ??
      ref.read(audioPlayerServiceProvider).volume;
});

/// The current song, with up-to-date library data (e.g. favourite state).
final currentTrackProvider = Provider<Track?>((ref) {
  final queued = ref.watch(queueStateProvider.select((q) => q.currentTrack));
  if (queued == null) return null;
  return ref.watch(tracksByIdProvider.select((map) => map[queued.id])) ??
      queued;
});

final currentTrackIdProvider = Provider<String?>(
  (ref) => ref.watch(queueStateProvider.select((q) => q.currentTrack?.id)),
);

/// Errors from the audio engine, for snackbars.
final playbackErrorsProvider = StreamProvider<PlaybackError>(
  (ref) => ref.watch(audioPlayerServiceProvider).errorStream,
);
