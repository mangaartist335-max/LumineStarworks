import 'dart:io';

import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';

/// App-managed folders for imported music, extracted artwork and the
/// database. Everything MoneyBeats needs lives under [root], so imported
/// songs survive restarts and do not depend on where the user picked them.
class MediaStorage {
  MediaStorage(this.root);

  final Directory root;

  Directory get musicDir => Directory(p.join(root.path, 'music'));
  Directory get artworkDir => Directory(p.join(root.path, 'artwork'));
  String get databasePath => p.join(root.path, 'moneybeats.db');

  /// Opens the platform's private application-support folder.
  ///
  /// Windows uses `%LOCALAPPDATA%` rather than the roaming profile so large
  /// music files are not synced across machines.
  static Future<MediaStorage> open() async {
    Directory base;
    final localAppData = Platform.isWindows
        ? Platform.environment['LOCALAPPDATA']
        : null;
    if (localAppData != null && localAppData.isNotEmpty) {
      base = Directory(p.join(localAppData, 'MoneyBeats'));
    } else {
      base = await getApplicationSupportDirectory();
    }
    final storage = MediaStorage(base);
    await storage.ensureCreated();
    return storage;
  }

  Future<void> ensureCreated() async {
    await musicDir.create(recursive: true);
    await artworkDir.create(recursive: true);
  }

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
