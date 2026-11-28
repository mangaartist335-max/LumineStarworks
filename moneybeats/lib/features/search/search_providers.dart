import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:moneybeats/features/library/library_providers.dart';
import 'package:moneybeats/models/collections.dart';
import 'package:moneybeats/models/library_query.dart';
import 'package:moneybeats/models/track.dart';

/// The text in the search box.
class SearchQueryNotifier extends Notifier<String> {
  @override
  String build() => '';

  void set(String query) => state = query;
}

final searchQueryProvider = NotifierProvider<SearchQueryNotifier, String>(
  SearchQueryNotifier.new,
);

class SearchResults {
  const SearchResults({
    this.tracks = const [],
    this.albums = const [],
    this.artists = const [],
  });
  final List<Track> tracks;
  final List<Album> albums;
  final List<Artist> artists;
  bool get isEmpty => tracks.isEmpty && albums.isEmpty && artists.isEmpty;
}

final searchResultsProvider = Provider<SearchResults>((ref) {
  final query = ref.watch(searchQueryProvider);
  if (query.trim().isEmpty) return const SearchResults();
  return SearchResults(
    tracks: LibraryQuery.search(ref.watch(libraryTracksProvider), query),
    albums: LibraryQuery.searchAlbums(ref.watch(albumsProvider), query),
    artists: LibraryQuery.searchArtists(ref.watch(artistsProvider), query),
  );
});
