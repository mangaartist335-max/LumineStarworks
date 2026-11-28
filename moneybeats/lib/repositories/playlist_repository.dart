import 'package:moneybeats/models/playlist.dart';
import 'package:moneybeats/repositories/app_database.dart';
import 'package:sqflite/sqflite.dart';
import 'package:uuid/uuid.dart';

/// Creates, edits and orders playlists.
class PlaylistRepository {
  PlaylistRepository(this._database, {Uuid? uuid})
    : _uuid = uuid ?? const Uuid();

  final AppDatabase _database;
  final Uuid _uuid;

  Database get _db => _database.db;

  Stream<DataChange> get changes =>
      _database.changes.where((c) => c == DataChange.playlists);

  Future<List<Playlist>> getAll() async {
    final rows = await _db.query('playlists', orderBy: 'updated_at DESC');
    final entries = await _db.query(
      'playlist_tracks',
      orderBy: 'playlist_id, position',
    );
    final byPlaylist = <String, List<String>>{};
    for (final entry in entries) {
      byPlaylist
          .putIfAbsent(entry['playlist_id']! as String, () => [])
          .add(entry['track_id']! as String);
    }
    return [
      for (final row in rows)
        Playlist(
          id: row['id']! as String,
          name: row['name']! as String,
          createdAt: DateTime.fromMillisecondsSinceEpoch(
            row['created_at']! as int,
          ),
          updatedAt: DateTime.fromMillisecondsSinceEpoch(
            row['updated_at']! as int,
          ),
          trackIds: byPlaylist[row['id']] ?? const [],
        ),
    ];
  }

  Future<Playlist> create(
    String name, {
    List<String> trackIds = const [],
  }) async {
    final now = DateTime.now();
    final playlist = Playlist(
      id: _uuid.v4(),
      name: _cleanName(name),
      createdAt: now,
      updatedAt: now,
    );
    await _db.transaction((txn) async {
      await txn.insert('playlists', {
        'id': playlist.id,
        'name': playlist.name,
        'created_at': now.millisecondsSinceEpoch,
        'updated_at': now.millisecondsSinceEpoch,
      });
      await _appendInTxn(txn, playlist.id, trackIds, now);
    });
    _database.notify(DataChange.playlists);
    return playlist.copyWith(trackIds: trackIds.toSet().toList());
  }

  Future<void> rename(String playlistId, String name) async {
    await _db.update(
      'playlists',
      {
        'name': _cleanName(name),
        'updated_at': DateTime.now().millisecondsSinceEpoch,
      },
      where: 'id = ?',
      whereArgs: [playlistId],
    );
    _database.notify(DataChange.playlists);
  }

  Future<void> delete(String playlistId) async {
    await _db.delete('playlists', where: 'id = ?', whereArgs: [playlistId]);
    _database.notify(DataChange.playlists);
  }

  /// Appends tracks, skipping any already in the playlist.
  /// Returns how many were actually added.
  Future<int> addTracks(String playlistId, List<String> trackIds) async {
    final now = DateTime.now();
    final added = await _db.transaction((txn) async {
      final count = await _appendInTxn(txn, playlistId, trackIds, now);
      await _touch(txn, playlistId, now);
      return count;
    });
    _database.notify(DataChange.playlists);
    return added;
  }

  Future<void> removeTrack(String playlistId, String trackId) async {
    await _db.transaction((txn) async {
      await txn.delete(
        'playlist_tracks',
        where: 'playlist_id = ? AND track_id = ?',
        whereArgs: [playlistId, trackId],
      );
      await _touch(txn, playlistId, DateTime.now());
    });
    _database.notify(DataChange.playlists);
  }

  /// Saves a new order. [orderedTrackIds] must contain the playlist's tracks.
  Future<void> reorder(String playlistId, List<String> orderedTrackIds) async {
    await _db.transaction((txn) async {
      final batch = txn.batch();
      for (var i = 0; i < orderedTrackIds.length; i++) {
        batch.update(
          'playlist_tracks',
          {'position': i},
          where: 'playlist_id = ? AND track_id = ?',
          whereArgs: [playlistId, orderedTrackIds[i]],
        );
      }
      await batch.commit(noResult: true);
      await _touch(txn, playlistId, DateTime.now());
    });
    _database.notify(DataChange.playlists);
  }

  Future<int> _appendInTxn(
    Transaction txn,
    String playlistId,
    List<String> trackIds,
    DateTime now,
  ) async {
    if (trackIds.isEmpty) return 0;
    final existing = await txn.query(
      'playlist_tracks',
      columns: ['track_id', 'position'],
      where: 'playlist_id = ?',
      whereArgs: [playlistId],
    );
    final present = existing.map((r) => r['track_id']! as String).toSet();
    var nextPosition = existing.isEmpty
        ? 0
        : existing
                  .map((r) => r['position']! as int)
                  .reduce((a, b) => a > b ? a : b) +
              1;
    var added = 0;
    for (final trackId in trackIds) {
      if (!present.add(trackId)) continue;
      await txn.insert('playlist_tracks', {
        'playlist_id': playlistId,
        'track_id': trackId,
        'position': nextPosition++,
        'added_at': now.millisecondsSinceEpoch,
      });
      added++;
    }
    return added;
  }

  Future<void> _touch(Transaction txn, String playlistId, DateTime now) =>
      txn.update(
        'playlists',
        {'updated_at': now.millisecondsSinceEpoch},
        where: 'id = ?',
        whereArgs: [playlistId],
      );

  String _cleanName(String name) {
    final trimmed = name.trim();
    return trimmed.isEmpty ? 'My playlist' : trimmed;
  }
}
