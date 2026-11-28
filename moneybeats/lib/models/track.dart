import 'package:flutter/foundation.dart';

/// A song in the user's library.
///
/// The database stores file locations relative to the app's media folders
/// (app containers move between installs on iOS). [filePath] and
/// [artworkPath] are resolved to absolute paths when a track is loaded.
@immutable
class Track {
  const Track({
    required this.id,
    required this.filePath,
    required this.originalFileName,
    required this.title,
    required this.duration,
    required this.contentHash,
    required this.dateAdded,
    this.artist,
    this.album,
    this.albumArtist,
    this.genre,
    this.trackNumber,
    this.year,
    this.artworkPath,
    this.fileSize = 0,
    this.lastPlayedAt,
    this.playCount = 0,
    this.isFavorite = false,
    this.favoritedAt,
  });

  static const unknownArtist = 'Unknown artist';
  static const unknownAlbum = 'Unknown album';

  final String id;

  /// Absolute path of the audio file inside app-managed storage.
  final String filePath;

  /// The file name the user imported, kept for display and debugging.
  final String originalFileName;

  final String title;
  final String? artist;
  final String? album;
  final String? albumArtist;
  final String? genre;
  final int? trackNumber;
  final int? year;
  final Duration duration;

  /// Absolute path of the extracted cover art, if the file had any.
  final String? artworkPath;

  final int fileSize;

  /// SHA-1 of the file contents, used to skip duplicate imports.
  final String contentHash;

  final DateTime dateAdded;
  final DateTime? lastPlayedAt;
  final int playCount;
  final bool isFavorite;
  final DateTime? favoritedAt;

  String get displayArtist =>
      (artist == null || artist!.trim().isEmpty) ? unknownArtist : artist!;

  String get displayAlbum =>
      (album == null || album!.trim().isEmpty) ? unknownAlbum : album!;

  /// The artist an album is filed under.
  String get albumGroupArtist =>
      (albumArtist != null && albumArtist!.trim().isNotEmpty)
      ? albumArtist!
      : displayArtist;

  /// Stable key used to group tracks into albums.
  String get albumKey =>
      '${displayAlbum.toLowerCase()}\u0000${albumGroupArtist.toLowerCase()}';

  bool get hasArtwork => artworkPath != null;

  Track copyWith({
    String? title,
    String? artist,
    String? album,
    Duration? duration,
    String? artworkPath,
    DateTime? lastPlayedAt,
    int? playCount,
    bool? isFavorite,
    DateTime? favoritedAt,
    bool clearFavoritedAt = false,
  }) {
    return Track(
      id: id,
      filePath: filePath,
      originalFileName: originalFileName,
      title: title ?? this.title,
      artist: artist ?? this.artist,
      album: album ?? this.album,
      albumArtist: albumArtist,
      genre: genre,
      trackNumber: trackNumber,
      year: year,
      duration: duration ?? this.duration,
      artworkPath: artworkPath ?? this.artworkPath,
      fileSize: fileSize,
      contentHash: contentHash,
      dateAdded: dateAdded,
      lastPlayedAt: lastPlayedAt ?? this.lastPlayedAt,
      playCount: playCount ?? this.playCount,
      isFavorite: isFavorite ?? this.isFavorite,
      favoritedAt: clearFavoritedAt ? null : (favoritedAt ?? this.favoritedAt),
    );
  }

  @override
  bool operator ==(Object other) =>
      other is Track &&
      other.id == id &&
      other.title == title &&
      other.artist == artist &&
      other.album == album &&
      other.duration == duration &&
      other.artworkPath == artworkPath &&
      other.lastPlayedAt == lastPlayedAt &&
      other.playCount == playCount &&
      other.isFavorite == isFavorite;

  @override
  int get hashCode => Object.hash(
    id,
    title,
    artist,
    album,
    duration,
    artworkPath,
    lastPlayedAt,
    playCount,
    isFavorite,
  );

  @override
  String toString() => 'Track($id, $title, $displayArtist)';
}
