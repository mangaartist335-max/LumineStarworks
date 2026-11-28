// App-managed storage for imported music, artwork and the database.

import 'dart:io';

import 'package:moneybeats/core/constants/app_constants.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

/// App-managed folders for imported music, extracted artwork and the
/// database. Everything MoneyBeats needs lives under [root], so imported
/// songs survive restarts and do not depend on where the user picked them.
class StorageService {
  StorageService(this.root);

  final Directory root;

  Directory get musicDir =>
      Directory(p.join(root.path, AppConstants.musicFolderName));
  Directory get artworkDir =>
      Directory(p.join(root.path, AppConstants.artworkFolderName));

  /// Cached waveform data (safe to delete; regenerated on demand).
  Directory get waveformDir =>
      Directory(p.join(root.path, AppConstants.waveformFolderName));
  String get databasePath => p.join(root.path, AppConstants.databaseFileName);

  /// Opens the platform's private application-support folder.
  ///
  /// Windows uses `%LOCALAPPDATA%` rather than the roaming profile so large
  /// music files are not synced across machines.
  static Future<StorageService> open() async {
    Directory base;
    final localAppData = Platform.isWindows
        ? Platform.environment['LOCALAPPDATA']
        : null;
    if (localAppData != null && localAppData.isNotEmpty) {
      base = Directory(p.join(localAppData, 'MoneyBeats'));
    } else {
      base = await getApplicationSupportDirectory();
    }
    final storage = StorageService(base);
    await storage.ensureCreated();
    return storage;
  }

  Future<void> ensureCreated() async {
    await musicDir.create(recursive: true);
    await artworkDir.create(recursive: true);
    await waveformDir.create(recursive: true);
  }

  String waveformPath(String trackId) =>
      p.join(waveformDir.path, '$trackId.json');

  /// Absolute path for a file name stored in the database.
  String musicPath(String fileName) => p.join(musicDir.path, fileName);

  String artworkPath(String fileName) => p.join(artworkDir.path, fileName);

  /// The file name to store in the database for an absolute path.
  String relativeName(String absolutePath) => p.basename(absolutePath);

  Future<void> deleteQuietly(String? absolutePath) async {
    if (absolutePath == null) return;
    try {
      final file = File(absolutePath);
      if (await file.exists()) await file.delete();
    } on FileSystemException {
      // Nothing useful to do; the database row is what matters.
    }
  }
}
