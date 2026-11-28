import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:moneybeats/core/providers.dart';
import 'package:moneybeats/models/collections.dart';
import 'package:moneybeats/models/library_query.dart';
import 'package:moneybeats/models/track.dart';

/// All tracks in the library, reloaded whenever the database changes.
class LibraryNotifier extends AsyncNotifier<List<Track>> {
  @override
  Future<List<Track>> build() async {
    final repository = ref.watch(trackRepositoryProvider);
    final subscription = repository.changes.listen((_) => unawaited(_reload()));
    ref.onDispose(subscription.cancel);
    return repository.getAll();
  }

  Future<void> _reload() async {
    final tracks = await ref.read(trackRepositoryProvider).getAll();
    if (ref.mounted) state = AsyncData(tracks);
  }

  Future<void> toggleFavorite(Track track) async {
    final current =
        state.value?.firstWhere((t) => t.id == track.id, orElse: () => track) ??
        track;
    await ref
        .read(trackRepositoryProvider)
        .setFavorite(track.id, !current.isFavorite);
  }

  /// Removes a song from the queue, the library and app storage.
  Future<void> deleteTrack(Track track) async {
    await ref.read(audioPlayerServiceProvider).removeTrackEverywhere(track.id);
    await ref.read(trackRepositoryProvider).delete(track.id);
  }
}

final libraryProvider = AsyncNotifierProvider<LibraryNotifier, List<Track>>(
  LibraryNotifier.new,
);

/// The library as a plain list (empty while loading).
final libraryTracksProvider = Provider<List<Track>>(
  (ref) => ref.watch(libraryProvider).value ?? const [],
);

final tracksByIdProvider = Provider<Map<String, Track>>(
  (ref) => {for (final t in ref.watch(libraryTracksProvider)) t.id: t},
);

final recentlyPlayedProvider = Provider<List<Track>>(
  (ref) =>
      LibraryQuery.recentlyPlayed(ref.watch(libraryTracksProvider), limit: 30),
);

final recentlyAddedProvider = Provider<List<Track>>(
  (ref) =>
      LibraryQuery.recentlyAdded(ref.watch(libraryTracksProvider), limit: 30),
);

final favoritesProvider = Provider<List<Track>>(
  (ref) => LibraryQuery.favorites(ref.watch(libraryTracksProvider)),
);

final albumsProvider = Provider<List<Album>>(
  (ref) => LibraryQuery.albums(ref.watch(libraryTracksProvider)),
);

final artistsProvider = Provider<List<Artist>>(
  (ref) => LibraryQuery.artists(ref.watch(libraryTracksProvider)),
);

final albumByKeyProvider = Provider.family<Album?, String>((ref, key) {
  for (final album in ref.watch(albumsProvider)) {
    if (album.key == key) return album;
  }
  return null;
});

final artistByNameProvider = Provider.family<Artist?, String>((ref, name) {
  final lower = name.toLowerCase();
  for (final artist in ref.watch(artistsProvider)) {
    if (artist.name.toLowerCase() == lower) return artist;
  }
  return null;
});

/// The chosen song sort order, remembered between launches.
class TrackSortNotifier extends Notifier<TrackSort> {
  @override
  TrackSort build() {
    unawaited(_load());
    return TrackSort.recentlyAdded;
  }

  Future<void> _load() async {
    final saved = await ref.read(settingsRepositoryProvider).getTrackSort();
    final match = TrackSort.values.where((s) => s.name == saved).firstOrNull;
    if (match != null && ref.mounted) state = match;
  }

  void set(TrackSort sort) {
    state = sort;
    unawaited(ref.read(settingsRepositoryProvider).setTrackSort(sort.name));
  }
}

final trackSortProvider = NotifierProvider<TrackSortNotifier, TrackSort>(
  TrackSortNotifier.new,
);

final sortedTracksProvider = Provider<List<Track>>(
  (ref) => LibraryQuery.sort(
    ref.watch(libraryTracksProvider),
    ref.watch(trackSortProvider),
  ),
);
