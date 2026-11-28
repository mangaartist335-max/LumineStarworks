// Importing music: the file picker, tag and artwork extraction, and the
// service that copies files into app storage and adds them to the library.

import 'dart:async';
import 'dart:io';
import 'dart:isolate';
import 'dart:typed_data';

import 'package:audio_metadata_reader/audio_metadata_reader.dart';
import 'package:crypto/crypto.dart';
import 'package:file_picker/file_picker.dart';
import 'package:moneybeats/core/constants/app_constants.dart';
import 'package:moneybeats/core/utilities/platform_capabilities.dart';
import 'package:moneybeats/models/track.dart';
import 'package:moneybeats/repositories/track_repository.dart';
import 'package:moneybeats/services/storage_service.dart';
import 'package:path/path.dart' as p;
import 'package:uuid/uuid.dart';

/// A file chosen for import, independent of where it came from.
abstract class ImportSource {
  String get name;

  /// Streams the file's bytes. Works for real paths and for Android
  /// `content://` URIs alike.
  Stream<List<int>> openRead();
}

/// An [ImportSource] backed by a file on disk.
class FileImportSource implements ImportSource {
  FileImportSource(this.file, {this._name});

  final File file;
  final String? _name;

  @override
  String get name => _name ?? file.uri.pathSegments.last;

  @override
  Stream<List<int>> openRead() => file.openRead();
}

/// Lets the user choose audio files with the native picker.
abstract class AudioFilePicker {
  /// Opens the picker. Returns an empty list when the user cancels.
  Future<List<ImportSource>> pickAudioFiles();

  /// Cleans up any temporary copies the picker made.
  Future<void> cleanUp();
}

class _PlatformFileSource implements ImportSource {
  _PlatformFileSource(this._file);
  final PlatformFile _file;

  @override
  String get name => _file.name;

  @override
  Stream<List<int>> openRead() {
    final path = _file.path;
    if (path != null) return File(path).openRead();
    return _file.readAsByteStream().map<List<int>>((Uint8List chunk) => chunk);
  }
}

/// The real picker, using `file_picker`.
class PlatformAudioFilePicker implements AudioFilePicker {
  const PlatformAudioFilePicker();

  @override
  Future<List<ImportSource>> pickAudioFiles() async {
    final files = await FilePicker.pickFiles(
      dialogTitle: 'Import music',
      type: FileType.custom,
      allowedExtensions: AppConstants.supportedAudioExtensions,
    );
    return [for (final file in files) _PlatformFileSource(file)];
  }

  @override
  Future<void> cleanUp() async {
    if (!PlatformCapabilities.isMobile) return;
    try {
      await FilePicker.clearTemporaryFiles();
    } catch (_) {
      // Temporary files are cleared by the OS eventually anyway.
    }
  }
}

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

/// Progress while a batch of files is being imported.
class ImportProgress {
  const ImportProgress({
    required this.completed,
    required this.total,
    this.currentName,
  });

  final int completed;
  final int total;
  final String? currentName;

  double get fraction => total == 0 ? 0 : completed / total;
}

/// A file that could not be imported, with a reason the user can read.
class ImportFailure {
  const ImportFailure(this.fileName, this.reason);
  final String fileName;
  final String reason;
}

class ImportResult {
  const ImportResult({
    this.imported = const [],
    this.duplicates = const [],
    this.failures = const [],
  });

  final List<Track> imported;
  final List<String> duplicates;
  final List<ImportFailure> failures;

  bool get isEmpty =>
      imported.isEmpty && duplicates.isEmpty && failures.isEmpty;

  /// A short summary for a snackbar.
  String get summary {
    final parts = <String>[];
    if (imported.isNotEmpty) {
      parts.add(
        imported.length == 1
            ? 'Added "${imported.first.title}"'
            : 'Added ${imported.length} songs',
      );
    }
    if (duplicates.isNotEmpty) {
      parts.add(
        duplicates.length == 1
            ? '1 was already in your library'
            : '${duplicates.length} were already in your library',
      );
    }
    if (failures.isNotEmpty) {
      parts.add(
        failures.length == 1
            ? "1 file couldn't be imported"
            : "${failures.length} files couldn't be imported",
      );
    }
    return parts.isEmpty ? 'Nothing to import' : parts.join(' · ');
  }
}

/// Thrown for files we refuse, with a user-facing message.
class ImportRejected implements Exception {
  const ImportRejected(this.message);
  final String message;
  @override
  String toString() => message;
}

/// Copies picked files into app storage, reads their tags and artwork, and
/// adds them to the library.
class MusicImportService {
  MusicImportService({
    required this._tracks,
    required this._storage,
    Uuid? uuid,
    DateTime Function()? clock,
  }) : _uuid = uuid ?? const Uuid(),
       _clock = clock ?? DateTime.now;

  final TrackRepository _tracks;
  final StorageService _storage;
  final Uuid _uuid;
  final DateTime Function() _clock;

  Future<ImportResult> importAll(
    List<ImportSource> sources, {
    void Function(ImportProgress progress)? onProgress,
  }) async {
    await _storage.ensureCreated();
    final imported = <Track>[];
    final duplicates = <String>[];
    final failures = <ImportFailure>[];

    for (var i = 0; i < sources.length; i++) {
      final source = sources[i];
      onProgress?.call(
        ImportProgress(
          completed: i,
          total: sources.length,
          currentName: source.name,
        ),
      );
      try {
        final track = await importOne(source);
        if (track == null) {
          duplicates.add(source.name);
        } else {
          imported.add(track);
        }
      } on ImportRejected catch (e) {
        failures.add(ImportFailure(source.name, e.message));
      } catch (e) {
        failures.add(
          ImportFailure(source.name, 'Something went wrong reading this file.'),
        );
      }
    }
    onProgress?.call(
      ImportProgress(completed: sources.length, total: sources.length),
    );
    return ImportResult(
      imported: imported,
      duplicates: duplicates,
      failures: failures,
    );
  }

  /// Imports a single file. Returns `null` when it is already in the library.
  Future<Track?> importOne(ImportSource source) async {
    final extension = p
        .extension(source.name)
        .replaceFirst('.', '')
        .toLowerCase();
    if (!AppConstants.supportedAudioExtensions.contains(extension)) {
      throw const ImportRejected('Only MP3 files are supported right now.');
    }

    final id = _uuid.v4();
    final tempFile = File(
      p.join(_storage.musicDir.path, '.importing-$id.$extension'),
    );
    File? finalFile;
    String? artworkPath;
    try {
      final copy = await _copyAndHash(source, tempFile);
      if (copy.size == 0) throw const ImportRejected('This file is empty.');
      if (!await _looksLikeMp3(tempFile)) {
        throw const ImportRejected("This doesn't look like a valid MP3 file.");
      }
      if (await _tracks.existsWithHash(copy.hash)) {
        await _storage.deleteQuietly(tempFile.path);
        return null;
      }

      finalFile = await tempFile.rename(_storage.musicPath('$id.$extension'));
      final meta = await MetadataExtractor.extract(
        finalFile.path,
        originalFileName: source.name,
      );

      final art = meta.artworkBytes;
      if (art != null && art.isNotEmpty) {
        artworkPath = _storage.artworkPath('$id.${meta.artworkExtension}');
        await File(artworkPath).writeAsBytes(art, flush: true);
      }

      final track = Track(
        id: id,
        filePath: finalFile.path,
        originalFileName: source.name,
        title: meta.title,
        artist: meta.artist,
        album: meta.album,
        albumArtist: meta.albumArtist,
        genre: meta.genre,
        trackNumber: meta.trackNumber,
        year: meta.year,
        duration: meta.duration,
        artworkPath: artworkPath,
        fileSize: copy.size,
        contentHash: copy.hash,
        dateAdded: _clock(),
      );
      await _tracks.insert(track);
      return track;
    } catch (_) {
      await _storage.deleteQuietly(tempFile.path);
      await _storage.deleteQuietly(finalFile?.path);
      await _storage.deleteQuietly(artworkPath);
      rethrow;
    }
  }

  Future<({String hash, int size})> _copyAndHash(
    ImportSource source,
    File target,
  ) async {
    final digestSink = _DigestSink();
    final hasher = sha1.startChunkedConversion(digestSink);
    final sink = target.openWrite();
    var size = 0;
    try {
      await for (final chunk in source.openRead()) {
        hasher.add(chunk);
        sink.add(chunk);
        size += chunk.length;
      }
    } finally {
      await sink.flush();
      await sink.close();
    }
    hasher.close();
    return (hash: digestSink.value.toString(), size: size);
  }

  /// Checks for an ID3v2 header or an MPEG audio frame sync near the start.
  Future<bool> _looksLikeMp3(File file) async {
    final raf = await file.open();
    try {
      final head = await raf.read(4096);
      if (head.length >= 3 &&
          head[0] == 0x49 &&
          head[1] == 0x44 &&
          head[2] == 0x33) {
        return true; // "ID3"
      }
      for (var i = 0; i + 1 < head.length; i++) {
        if (head[i] == 0xFF && (head[i + 1] & 0xE0) == 0xE0) return true;
      }
      return false;
    } finally {
      await raf.close();
    }
  }
}

class _DigestSink implements Sink<Digest> {
  late Digest value;
  @override
  void add(Digest data) => value = data;
  @override
  void close() {}
}
