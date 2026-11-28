import 'dart:io';

import 'package:moneybeats/data/database/app_database.dart';
import 'package:moneybeats/data/repositories/listening_repository.dart';
import 'package:moneybeats/data/repositories/playlist_repository.dart';
import 'package:moneybeats/data/repositories/settings_repository.dart';
import 'package:moneybeats/data/repositories/track_repository.dart';
import 'package:moneybeats/data/storage/media_storage.dart';
import 'package:moneybeats/services/import/music_import_service.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';

/// A throwaway database and media folder for one test.
class TestEnv {
  TestEnv._(this.database, this.storage, this.tempDir);

  final AppDatabase database;
  final MediaStorage storage;
  final Directory tempDir;

  late final tracks = TrackRepository(database, storage);
  late final playlists = PlaylistRepository(database);
  late final settings = SettingsRepository(database);
  late final listening = ListeningRepository(database);
  late final importer = MusicImportService(tracks: tracks, storage: storage);

  /// [noIsolate] runs SQLite on the test isolate, which widget tests need
  /// (their fake clock can't wait for a background isolate).
  static Future<TestEnv> create({
    bool noIsolate = false,
    String? databasePath,
  }) async {
    sqfliteFfiInit();
    final tempDir = await Directory.systemTemp.createTemp('moneybeats_test_');
    final storage = MediaStorage(tempDir);
    await storage.ensureCreated();
    final factory = noIsolate
        ? databaseFactoryFfiNoIsolate
        : databaseFactoryFfi;
    final database = await AppDatabase.open(
      factory,
      databasePath ?? inMemoryDatabasePath,
    );
    return TestEnv._(database, storage, tempDir);
  }

  Future<void> dispose() async {
    await database.close();
    if (await tempDir.exists()) await tempDir.delete(recursive: true);
  }
}
