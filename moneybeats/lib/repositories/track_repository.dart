import 'package:moneybeats/models/track.dart';
import 'package:moneybeats/repositories/app_database.dart';
import 'package:moneybeats/services/storage_service.dart';
import 'package:sqflite/sqflite.dart';

/// Reads and writes library tracks.
class TrackRepository {
  TrackRepository(this._database, this._storage);

  final AppDatabase _database;
  final StorageService _storage;

  Database get _db => _database.db;

  Stream<DataChange> get changes =>
      _database.changes.where((c) => c == DataChange.tracks);

  Future<List<Track>> getAll() async {
    final rows = await _db.query(
      'tracks',
      orderBy: 'date_added DESC, rowid DESC',
    );
    return rows.map(_fromRow).toList();
  }

  Future<Track?> getById(String id) async {
    final rows = await _db.query(
      'tracks',
      where: 'id = ?',
      whereArgs: [id],
      limit: 1,
    );
    return rows.isEmpty ? null : _fromRow(rows.first);
  }

  Future<bool> existsWithHash(String contentHash) async {
    final rows = await _db.query(
      'tracks',
      columns: ['id'],
      where: 'content_hash = ?',
      whereArgs: [contentHash],
      limit: 1,
    );
    return rows.isNotEmpty;
  }

  Future<void> insert(Track track) async {
    await _db.insert('tracks', _toRow(track));
    _database.notify(DataChange.tracks);
  }

  Future<void> setFavorite(String id, bool favorite) async {
    await _db.update(
      'tracks',
      {
        'is_favorite': favorite ? 1 : 0,
        'favorited_at': favorite ? DateTime.now().millisecondsSinceEpoch : null,
      },
      where: 'id = ?',
      whereArgs: [id],
    );
    _database.notify(DataChange.tracks);
  }

  /// Records that a track started playing.
  Future<void> markPlayed(String id, DateTime at) async {
    await _db.rawUpdate(
      'UPDATE tracks SET last_played_at = ?, play_count = play_count + 1 WHERE id = ?',
      [at.millisecondsSinceEpoch, id],
    );
    _database.notify(DataChange.tracks);
  }

  /// Stores the exact duration reported by the audio engine, which can be
  /// more accurate than the tag estimate for variable-bitrate files.
  Future<void> updateDuration(String id, Duration duration) async {
    await _db.update(
      'tracks',
      {'duration_ms': duration.inMilliseconds},
      where: 'id = ?',
      whereArgs: [id],
    );
    _database.notify(DataChange.tracks);
  }

  /// Removes a track from the library and deletes its files from app storage.
  Future<void> delete(String id) async {
    final track = await getById(id);
    if (track == null) return;
    await _db.delete('tracks', where: 'id = ?', whereArgs: [id]);
    await _storage.deleteQuietly(track.filePath);
    await _storage.deleteQuietly(track.artworkPath);
    await _storage.deleteQuietly(_storage.waveformPath(id));
    _database.notify(DataChange.tracks);
    // Playlist membership is removed by the foreign key cascade.
    _database.notify(DataChange.playlists);
  }

  Track _fromRow(Map<String, Object?> row) {
    final artwork = row['artwork_file_name'] as String?;
    final lastPlayed = row['last_played_at'] as int?;
    final favoritedAt = row['favorited_at'] as int?;
    return Track(
      id: row['id']! as String,
      filePath: _storage.musicPath(row['file_name']! as String),
      originalFileName: row['original_file_name']! as String,
      title: row['title']! as String,
      artist: row['artist'] as String?,
      album: row['album'] as String?,
      albumArtist: row['album_artist'] as String?,
      genre: row['genre'] as String?,
      trackNumber: row['track_number'] as int?,
      year: row['year'] as int?,
      duration: Duration(milliseconds: row['duration_ms']! as int),
      artworkPath: artwork == null ? null : _storage.artworkPath(artwork),
      fileSize: row['file_size']! as int,
      contentHash: row['content_hash']! as String,
      dateAdded: DateTime.fromMillisecondsSinceEpoch(row['date_added']! as int),
      lastPlayedAt: lastPlayed == null
          ? null
          : DateTime.fromMillisecondsSinceEpoch(lastPlayed),
      playCount: row['play_count']! as int,
      isFavorite: (row['is_favorite']! as int) == 1,
      favoritedAt: favoritedAt == null
          ? null
          : DateTime.fromMillisecondsSinceEpoch(favoritedAt),
    );
  }

  Map<String, Object?> _toRow(Track track) => {
    'id': track.id,
    'file_name': _storage.relativeName(track.filePath),
    'original_file_name': track.originalFileName,
    'title': track.title,
    'artist': track.artist,
    'album': track.album,
    'album_artist': track.albumArtist,
    'genre': track.genre,
    'track_number': track.trackNumber,
    'year': track.year,
    'duration_ms': track.duration.inMilliseconds,
    'artwork_file_name': track.artworkPath == null
        ? null
        : _storage.relativeName(track.artworkPath!),
    'file_size': track.fileSize,
    'content_hash': track.contentHash,
    'date_added': track.dateAdded.millisecondsSinceEpoch,
    'last_played_at': track.lastPlayedAt?.millisecondsSinceEpoch,
    'play_count': track.playCount,
    'is_favorite': track.isFavorite ? 1 : 0,
    'favorited_at': track.favoritedAt?.millisecondsSinceEpoch,
  };
}
