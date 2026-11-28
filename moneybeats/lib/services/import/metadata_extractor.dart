import 'dart:io';
import 'dart:isolate';
import 'dart:typed_data';

import 'package:audio_metadata_reader/audio_metadata_reader.dart';
import 'package:path/path.dart' as p;

/// Tag data read from an audio file.
class ExtractedMetadata {
  const ExtractedMetadata({
    required this.title,
    this.artist,
    this.album,
    this.albumArtist,
    this.genre,
    this.trackNumber,
    this.year,
    this.duration = Duration.zero,
    this.artworkBytes,
    this.artworkMimeType,
  });

  final String title;
  final String? artist;
  final String? album;
  final String? albumArtist;
  final String? genre;
  final int? trackNumber;
  final int? year;
  final Duration duration;
  final Uint8List? artworkBytes;
  final String? artworkMimeType;

  /// File extension (without the dot) that matches the artwork's format.
  String get artworkExtension {
    final mime = artworkMimeType?.toLowerCase() ?? '';
    if (mime.contains('png')) return 'png';
    if (mime.contains('webp')) return 'webp';
    final bytes = artworkBytes;
    if (bytes != null &&
        bytes.length > 4 &&
        bytes[0] == 0x89 &&
        bytes[1] == 0x50) {
      return 'png';
    }
    return 'jpg';
  }
}

/// Reads titles, artists, albums, durations and embedded artwork.
abstract final class MetadataExtractor {
  /// Parses [path] on a background isolate so large files never stall the UI.
  static Future<ExtractedMetadata> extract(
    String path, {
    required String originalFileName,
  }) {
    return Isolate.run(
      () => extractSync(path, originalFileName: originalFileName),
    );
  }

  /// Synchronous variant, used by [extract] and directly in tests.
  static ExtractedMetadata extractSync(
    String path, {
    required String originalFileName,
  }) {
    final fallback = fromFileName(originalFileName);
    AudioMetadata? tags;
    try {
      tags = readMetadata(File(path), getImage: true);
    } catch (_) {
      // Untagged or unusual files still import; we fall back to the file name.
      tags = null;
    }
    if (tags == null) return fallback;

    final picture = _pickCover(tags.pictures);
    return ExtractedMetadata(
      title: _clean(tags.title) ?? fallback.title,
      artist: _clean(tags.artist) ?? fallback.artist,
      album: _clean(tags.album),
      albumArtist: _clean(tags.albumArtist),
      genre: tags.genres.map(_clean).whereType<String>().firstOrNull,
      trackNumber: (tags.trackNumber != null && tags.trackNumber! > 0)
          ? tags.trackNumber
          : null,
      // Some taggers store a missing year as 0.
      year: (tags.year?.year ?? 0) > 0 ? tags.year!.year : null,
      duration: tags.duration ?? Duration.zero,
      artworkBytes: picture?.bytes,
      artworkMimeType: picture?.mimetype,
    );
  }

  static Picture? _pickCover(List<Picture> pictures) {
    if (pictures.isEmpty) return null;
    final front = pictures.where(
      (pic) => pic.pictureType == PictureType.coverFront,
    );
    final chosen = front.isNotEmpty ? front.first : pictures.first;
    return chosen.bytes.isEmpty ? null : chosen;
  }

  /// Builds metadata from a file name such as `Artist - Song Title.mp3`.
  static ExtractedMetadata fromFileName(String fileName) {
    var base = p.basenameWithoutExtension(fileName).replaceAll('_', ' ').trim();
    base = base.replaceAll(RegExp(r'\s+'), ' ');
    // Drop a leading track number like "01 - " or "07. ".
    base = base.replaceFirst(RegExp(r'^\d{1,3}\s*[-.]\s+'), '');
    final parts = base.split(' - ');
    if (parts.length >= 2 && parts.first.trim().isNotEmpty) {
      return ExtractedMetadata(
        title: parts.sublist(1).join(' - ').trim(),
        artist: parts.first.trim(),
      );
    }
    return ExtractedMetadata(title: base.isEmpty ? 'Untitled' : base);
  }

  static String? _clean(String? value) {
    if (value == null) return null;
    final cleaned = value.replaceAll('\u0000', '').trim();
    return cleaned.isEmpty ? null : cleaned;
  }
}
