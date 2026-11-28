import 'package:collection/collection.dart';
import 'package:moneybeats/models/collections.dart';
import 'package:moneybeats/models/track.dart';

/// How the song list can be ordered.
enum TrackSort {
  recentlyAdded('Recently added'),
  title('Title'),
  artist('Artist'),
  album('Album'),
  duration('Duration');

  const TrackSort(this.label);
  final String label;
}

/// Pure functions for searching, sorting and grouping the library.
///
/// They work on in-memory lists, which comfortably handles personal libraries
/// of several thousand songs and keeps this logic easy to test.
abstract final class LibraryQuery {
  static int _compareText(String a, String b) =>
      compareAsciiLowerCaseNatural(a, b);

  static List<Track> sort(Iterable<Track> tracks, TrackSort sort) {
    final list = tracks.toList();
    switch (sort) {
      case TrackSort.recentlyAdded:
        list.sort((a, b) {
          final byDate = b.dateAdded.compareTo(a.dateAdded);
          return byDate != 0 ? byDate : _compareText(a.title, b.title);
        });
      case TrackSort.title:
        list.sort((a, b) => _compareText(a.title, b.title));
      case TrackSort.artist:
        list.sort((a, b) {
          final byArtist = _compareText(a.displayArtist, b.displayArtist);
          if (byArtist != 0) return byArtist;
          final byAlbum = _compareText(a.displayAlbum, b.displayAlbum);
          return byAlbum != 0 ? byAlbum : _compareTrackOrder(a, b);
        });
      case TrackSort.album:
        list.sort((a, b) {
          final byAlbum = _compareText(a.displayAlbum, b.displayAlbum);
          return byAlbum != 0 ? byAlbum : _compareTrackOrder(a, b);
        });
      case TrackSort.duration:
        list.sort((a, b) {
          final byLength = a.duration.compareTo(b.duration);
          return byLength != 0 ? byLength : _compareText(a.title, b.title);
        });
    }
    return list;
  }

  static int _compareTrackOrder(Track a, Track b) {
    final an = a.trackNumber ?? 1 << 20;
    final bn = b.trackNumber ?? 1 << 20;
    if (an != bn) return an.compareTo(bn);
    return _compareText(a.title, b.title);
  }

  /// Case- and accent-insensitive search over title, artist and album.
  /// Every word of the query has to match somewhere.
  static List<Track> search(Iterable<Track> tracks, String query) {
    final terms = normalize(query)
        .split(' ')
        .where((t) => t.isNotEmpty)
        .toList();
    if (terms.isEmpty) return const [];
    final matches = <({Track track, int score})>[];
    for (final track in tracks) {
      final title = normalize(track.title);
      final haystack =
          '$title ${normalize(track.displayArtist)} '
          '${normalize(track.displayAlbum)} ${normalize(track.albumArtist ?? '')}';
      if (!terms.every(haystack.contains)) continue;
      // Rank: title prefix > title contains > elsewhere.
      final joined = terms.join(' ');
      final score = title.startsWith(joined)
          ? 0
          : title.contains(joined)
          ? 1
          : 2;
      matches.add((track: track, score: score));
    }
    matches.sort((a, b) {
      final byScore = a.score.compareTo(b.score);
      return byScore != 0
          ? byScore
          : _compareText(a.track.title, b.track.title);
    });
    return [for (final m in matches) m.track];
  }

  static List<Album> searchAlbums(Iterable<Album> albums, String query) {
    final terms = normalize(query)
        .split(' ')
        .where((t) => t.isNotEmpty)
        .toList();
    if (terms.isEmpty) return const [];
    return albums.where((album) {
      final haystack = '${normalize(album.title)} ${normalize(album.artist)}';
      return terms.every(haystack.contains);
    }).toList();
  }

  static List<Artist> searchArtists(Iterable<Artist> artists, String query) {
    final terms = normalize(query)
        .split(' ')
        .where((t) => t.isNotEmpty)
        .toList();
    if (terms.isEmpty) return const [];
    return artists
        .where((artist) => terms.every(normalize(artist.name).contains))
        .toList();
  }

  /// Groups tracks into albums, sorted by album title.
  static List<Album> albums(Iterable<Track> tracks) {
    final groups = groupBy(tracks, (Track t) => t.albumKey);
    final albums = groups.entries.map((entry) {
      final sorted = entry.value.sorted(_compareTrackOrder);
      return Album(
        key: entry.key,
        title: sorted.first.displayAlbum,
        artist: sorted.first.albumGroupArtist,
        tracks: sorted,
      );
    }).toList();
    albums.sort((a, b) => _compareText(a.title, b.title));
    return albums;
  }

  /// Groups tracks by artist, sorted by name.
  static List<Artist> artists(Iterable<Track> tracks) {
    final groups = groupBy(tracks, (Track t) => t.displayArtist.toLowerCase());
    final artists = groups.values.map((group) {
      final sorted = group.sorted((a, b) {
        final byAlbum = _compareText(a.displayAlbum, b.displayAlbum);
        return byAlbum != 0 ? byAlbum : _compareTrackOrder(a, b);
      });
      return Artist(
        name: sorted.first.displayArtist,
        tracks: sorted,
        albumCount: sorted.map((t) => t.albumKey).toSet().length,
      );
    }).toList();
    artists.sort((a, b) => _compareText(a.name, b.name));
    return artists;
  }

  static List<Track> recentlyPlayed(Iterable<Track> tracks, {int limit = 20}) {
    final played = tracks.where((t) => t.lastPlayedAt != null).toList()
      ..sort((a, b) => b.lastPlayedAt!.compareTo(a.lastPlayedAt!));
    return played.take(limit).toList();
  }

  static List<Track> recentlyAdded(Iterable<Track> tracks, {int limit = 20}) =>
      sort(tracks, TrackSort.recentlyAdded).take(limit).toList();

  static List<Track> favorites(Iterable<Track> tracks) {
    final liked = tracks.where((t) => t.isFavorite).toList()
      ..sort((a, b) {
        final at = a.favoritedAt ?? a.dateAdded;
        final bt = b.favoritedAt ?? b.dateAdded;
        return bt.compareTo(at);
      });
    return liked;
  }

  static final _accents = <String, String>{
    'à': 'a',
    'á': 'a',
    'â': 'a',
    'ã': 'a',
    'ä': 'a',
    'å': 'a',
    'ç': 'c',
    'è': 'e',
    'é': 'e',
    'ê': 'e',
    'ë': 'e',
    'ì': 'i',
    'í': 'i',
    'î': 'i',
    'ï': 'i',
    'ñ': 'n',
    'ò': 'o',
    'ó': 'o',
    'ô': 'o',
    'õ': 'o',
    'ö': 'o',
    'ø': 'o',
    'ù': 'u',
    'ú': 'u',
    'û': 'u',
    'ü': 'u',
    'ý': 'y',
    'ÿ': 'y',
  };

  /// Lower-cases, strips common accents and collapses punctuation to spaces.
  static String normalize(String input) {
    final buffer = StringBuffer();
    for (final char in input.toLowerCase().split('')) {
      buffer.write(_accents[char] ?? char);
    }
    return buffer
        .toString()
        .replaceAll(RegExp(r"[^\p{L}\p{N}]+", unicode: true), ' ')
        .trim();
  }
}
