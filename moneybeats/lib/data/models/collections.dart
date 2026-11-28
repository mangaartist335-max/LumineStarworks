import 'package:flutter/foundation.dart';

import 'track.dart';

/// An album, derived from the tracks in the library.
@immutable
class Album {
  const Album({
    required this.key,
    required this.title,
    required this.artist,
    required this.tracks,
  });

  final String key;
  final String title;
  final String artist;

  /// Sorted by track number, then title.
  final List<Track> tracks;

  String? get artworkPath => tracks
      .firstWhere((t) => t.hasArtwork, orElse: () => tracks.first)
      .artworkPath;

  int? get year => tracks.map((t) => t.year).whereType<int>().firstOrNull;

  Duration get totalDuration =>
      tracks.fold(Duration.zero, (sum, t) => sum + t.duration);
}

/// An artist, derived from the tracks in the library.
@immutable
class Artist {
  const Artist({
    required this.name,
    required this.tracks,
    required this.albumCount,
  });

  final String name;
  final List<Track> tracks;
  final int albumCount;

  String? get artworkPath =>
      tracks.where((t) => t.hasArtwork).map((t) => t.artworkPath).firstOrNull;
}
