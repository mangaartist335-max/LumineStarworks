import 'dart:async';

import 'package:sqflite/sqflite.dart';

/// Which part of the data changed. Repositories broadcast these so state
/// providers know when to reload.
enum DataChange { tracks, playlists }

/// Owns the SQLite connection, the schema and its migrations.
class AppDatabase {
  AppDatabase._(this.db);

  final Database db;
  final _changes = StreamController<DataChange>.broadcast();

  static const schemaVersion = 1;

  Stream<DataChange> get changes => _changes.stream;

  void notify(DataChange change) {
    if (!_changes.isClosed) _changes.add(change);
  }

  /// Opens (and creates or migrates) the database at [path] using [factory].
  ///
  /// Pass `inMemoryDatabasePath` as [path] in tests.
  static Future<AppDatabase> open(DatabaseFactory factory, String path) async {
    final db = await factory.openDatabase(
      path,
      options: OpenDatabaseOptions(
        version: schemaVersion,
        onConfigure: (db) async {
          await db.execute('PRAGMA foreign_keys = ON');
        },
        onCreate: (db, version) async {
          final batch = db.batch();
          _createSchema(batch);
          await batch.commit(noResult: true);
        },
        onUpgrade: (db, from, to) async {
          // Future schema versions add their migration steps here, e.g.
          // if (from < 2) { ... }
        },
      ),
    );
    return AppDatabase._(db);
  }

  static void _createSchema(Batch batch) {
    batch.execute('''
      CREATE TABLE tracks (
        id TEXT PRIMARY KEY,
        file_name TEXT NOT NULL,
        original_file_name TEXT NOT NULL,
        title TEXT NOT NULL,
        artist TEXT,
        album TEXT,
        album_artist TEXT,
        genre TEXT,
        track_number INTEGER,
        year INTEGER,
        duration_ms INTEGER NOT NULL DEFAULT 0,
        artwork_file_name TEXT,
        file_size INTEGER NOT NULL DEFAULT 0,
        content_hash TEXT NOT NULL UNIQUE,
        date_added INTEGER NOT NULL,
        last_played_at INTEGER,
        play_count INTEGER NOT NULL DEFAULT 0,
        is_favorite INTEGER NOT NULL DEFAULT 0,
        favorited_at INTEGER
      )
    ''');
    batch.execute(
      'CREATE INDEX idx_tracks_last_played ON tracks(last_played_at)',
    );
    batch.execute('CREATE INDEX idx_tracks_date_added ON tracks(date_added)');

    batch.execute('''
      CREATE TABLE playlists (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    ''');
    batch.execute('''
      CREATE TABLE playlist_tracks (
        playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
        track_id TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        added_at INTEGER NOT NULL,
        PRIMARY KEY (playlist_id, track_id)
      )
    ''');
    batch.execute(
      'CREATE INDEX idx_playlist_tracks_order ON playlist_tracks(playlist_id, position)',
    );

    // One row per continuous stretch of listening. This is the foundation for
    // the future rewards system; Phase 1 only records it locally.
    batch.execute('''
      CREATE TABLE listening_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        track_id TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
        started_at INTEGER NOT NULL,
        listened_ms INTEGER NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0
      )
    ''');
    batch.execute(
      'CREATE INDEX idx_listening_started ON listening_sessions(started_at)',
    );

    batch.execute('''
      CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    ''');
  }

  Future<void> close() async {
    await _changes.close();
    await db.close();
  }
}
