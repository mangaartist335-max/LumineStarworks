import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:moneybeats/core/providers.dart';
import 'package:moneybeats/features/library/library_providers.dart';
import 'package:moneybeats/models/playlist.dart';
import 'package:moneybeats/models/track.dart';

class PlaylistsNotifier extends AsyncNotifier<List<Playlist>> {
  @override
  Future<List<Playlist>> build() async {
    final repository = ref.watch(playlistRepositoryProvider);
    final subscription = repository.changes.listen((_) => unawaited(_reload()));
    ref.onDispose(subscription.cancel);
    return repository.getAll();
  }

  Future<void> _reload() async {
    final playlists = await ref.read(playlistRepositoryProvider).getAll();
    if (ref.mounted) state = AsyncData(playlists);
  }

  Future<Playlist> create(String name, {List<String> trackIds = const []}) =>
      ref.read(playlistRepositoryProvider).create(name, trackIds: trackIds);

  Future<void> rename(String id, String name) =>
      ref.read(playlistRepositoryProvider).rename(id, name);

  Future<void> delete(String id) =>
      ref.read(playlistRepositoryProvider).delete(id);

  Future<int> addTracks(String id, List<String> trackIds) =>
      ref.read(playlistRepositoryProvider).addTracks(id, trackIds);

  Future<void> removeTrack(String id, String trackId) =>
      ref.read(playlistRepositoryProvider).removeTrack(id, trackId);

  Future<void> reorder(String id, List<String> trackIds) async {
    // Update immediately so the list doesn't jump back while saving.
    final current = state.value;
    if (current != null) {
      state = AsyncData([
        for (final p in current)
          p.id == id ? p.copyWith(trackIds: trackIds) : p,
      ]);
    }
    await ref.read(playlistRepositoryProvider).reorder(id, trackIds);
  }
}

final playlistsProvider =
    AsyncNotifierProvider<PlaylistsNotifier, List<Playlist>>(
      PlaylistsNotifier.new,
    );

final playlistListProvider = Provider<List<Playlist>>(
  (ref) => ref.watch(playlistsProvider).value ?? const [],
);

final playlistByIdProvider = Provider.family<Playlist?, String>((ref, id) {
  for (final playlist in ref.watch(playlistListProvider)) {
    if (playlist.id == id) return playlist;
  }
  return null;
});

/// A playlist's songs, in order, resolved against the library.
final playlistTracksProvider = Provider.family<List<Track>, String>((ref, id) {
  final playlist = ref.watch(playlistByIdProvider(id));
  if (playlist == null) return const [];
  final byId = ref.watch(tracksByIdProvider);
  return [for (final trackId in playlist.trackIds) ?byId[trackId]];
});
