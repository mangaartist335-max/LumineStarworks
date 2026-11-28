import 'dart:async';
import 'dart:io';

import 'package:crypto/crypto.dart';
import 'package:path/path.dart' as p;
import 'package:uuid/uuid.dart';

import '../../data/models/track.dart';
import '../../data/repositories/track_repository.dart';
import '../../data/storage/media_storage.dart';
import 'audio_file_picker.dart';
import 'metadata_extractor.dart';

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
  final MediaStorage _storage;
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
    if (!supportedAudioExtensions.contains(extension)) {
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
