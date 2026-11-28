import 'package:flutter_test/flutter_test.dart';
import 'package:moneybeats/data/models/library_query.dart';

import '../helpers/fakes.dart';

void main() {
  final tracks = [
    makeTrack(
      '1',
      title: 'zebra Crossing',
      artist: 'Beta',
      album: 'B Side',
      trackNumber: 2,
      duration: const Duration(minutes: 4),
      dateAdded: DateTime(2026, 1, 3),
    ),
    makeTrack(
      '2',
      title: 'Apple Tree',
      artist: 'alpha',
      album: 'A Side',
      trackNumber: 1,
      duration: const Duration(minutes: 2),
      dateAdded: DateTime(2026, 1, 1),
    ),
    makeTrack(
      '3',
      title: 'Café Noir',
      artist: 'Beta',
      album: 'B Side',
      trackNumber: 1,
      duration: const Duration(minutes: 3),
      dateAdded: DateTime(2026, 1, 2),
    ),
    makeTrack(
      '4',
      title: 'Track 10',
      artist: null,
      album: null,
      dateAdded: DateTime(2026, 1, 4),
    ),
    makeTrack(
      '5',
      title: 'Track 9',
      artist: null,
      album: null,
      dateAdded: DateTime(2026, 1, 5),
    ),
  ];

  group('sort', () {
    test('recently added puts newest first', () {
      final ids = LibraryQuery.sort(
        tracks,
        TrackSort.recentlyAdded,
      ).map((t) => t.id);
      expect(ids, ['5', '4', '1', '3', '2']);
    });

    test('title is case-insensitive and natural (9 before 10)', () {
      final titles = LibraryQuery.sort(
        tracks,
        TrackSort.title,
      ).map((t) => t.title);
      expect(titles, [
        'Apple Tree',
        'Café Noir',
        'Track 9',
        'Track 10',
        'zebra Crossing',
      ]);
    });

    test('artist groups by artist, then album and track number', () {
      final ids = LibraryQuery.sort(
        tracks,
        TrackSort.artist,
      ).map((t) => t.id).toList();
      expect(ids.sublist(0, 3), ['2', '3', '1']);
    });

    test('duration sorts shortest first', () {
      final ids = LibraryQuery.sort(
        tracks,
        TrackSort.duration,
      ).map((t) => t.id).toList();
      expect(ids.first, '2');
      expect(ids.last, '1');
    });
  });

  group('search', () {
    test('matches title, artist and album, case and accent insensitive', () {
      expect(LibraryQuery.search(tracks, 'cafe').map((t) => t.id), ['3']);
      expect(LibraryQuery.search(tracks, 'BETA').map((t) => t.id).toSet(), {
        '1',
        '3',
      });
      expect(LibraryQuery.search(tracks, 'alpha').map((t) => t.id), ['2']);
      expect(
        LibraryQuery.search(tracks, 'a side').first.id,
        '2',
        reason: 'A Side sorts first',
      );
    });

    test('every word must match', () {
      expect(LibraryQuery.search(tracks, 'beta noir').map((t) => t.id), ['3']);
      expect(LibraryQuery.search(tracks, 'beta apple'), isEmpty);
    });

    test('ranks title prefix matches first', () {
      final results = LibraryQuery.search([
        makeTrack('a', title: 'The Track', artist: 'Someone'),
        makeTrack('b', title: 'Track Star', artist: 'Someone'),
        makeTrack('c', title: 'Other', artist: 'Track Club'),
      ], 'track');
      expect(results.map((t) => t.id), ['b', 'a', 'c']);
    });

    test('blank query returns nothing', () {
      expect(LibraryQuery.search(tracks, '   '), isEmpty);
    });
  });

  group('grouping', () {
    test('albums group by album and album artist, sorted by track number', () {
      final albums = LibraryQuery.albums(tracks);
      final bSide = albums.firstWhere((a) => a.title == 'B Side');
      expect(bSide.tracks.map((t) => t.id), ['3', '1']);
      expect(bSide.artist, 'Beta');
      expect(albums.map((a) => a.title), contains('Unknown album'));
    });

    test('artists are case-insensitive and count albums', () {
      final artists = LibraryQuery.artists(tracks);
      final beta = artists.firstWhere((a) => a.name == 'Beta');
      expect(beta.tracks, hasLength(2));
      expect(beta.albumCount, 1);
      expect(artists.map((a) => a.name), contains('Unknown artist'));
    });
  });

  test('recently played orders by last play and skips unplayed songs', () {
    final played = LibraryQuery.recentlyPlayed([
      makeTrack('x', lastPlayedAt: DateTime(2026, 2, 1)),
      makeTrack('y'),
      makeTrack('z', lastPlayedAt: DateTime(2026, 3, 1)),
    ]);
    expect(played.map((t) => t.id), ['z', 'x']);
  });

  test('favorites show most recently liked first', () {
    final liked = LibraryQuery.favorites([
      makeTrack('x', isFavorite: true, favoritedAt: DateTime(2026, 2, 1)),
      makeTrack('y'),
      makeTrack('z', isFavorite: true, favoritedAt: DateTime(2026, 3, 1)),
    ]);
    expect(liked.map((t) => t.id), ['z', 'x']);
  });

  test('normalize strips accents and punctuation', () {
    expect(
      LibraryQuery.normalize("Beyoncé's  Café-Noir!"),
      'beyonce s cafe noir',
    );
  });
}
