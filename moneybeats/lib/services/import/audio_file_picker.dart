import 'dart:io';
import 'dart:typed_data';

import 'package:file_picker/file_picker.dart';

import '../../core/platform/platform_capabilities.dart';

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

/// File extensions MoneyBeats imports. MP3 is the Phase 1 format.
const supportedAudioExtensions = ['mp3'];

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
      allowedExtensions: supportedAudioExtensions,
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
