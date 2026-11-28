import 'dart:io';

import 'package:moneybeats/repositories/app_database.dart';
import 'package:moneybeats/repositories/listening_repository.dart';
import 'package:moneybeats/repositories/playlist_repository.dart';
import 'package:moneybeats/repositories/settings_repository.dart';
import 'package:moneybeats/repositories/track_repository.dart';
import 'package:moneybeats/services/import_service.dart';
import 'package:moneybeats/services/storage_service.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';

/// A throwaway database and media folder for one test.
class TestEnv {
  TestEnv._(this.database, this.storage, this.tempDir);

  final AppDatabase database;
  final StorageService storage;
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
    final storage = StorageService(tempDir);
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
