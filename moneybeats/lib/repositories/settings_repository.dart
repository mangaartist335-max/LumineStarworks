import 'dart:convert';

import 'package:moneybeats/repositories/app_database.dart';
import 'package:sqflite/sqflite.dart';

/// The playback session that is restored when the app starts again.
class SavedPlaybackSession {
  const SavedPlaybackSession({
    required this.trackIds,
    required this.index,
    required this.position,
  });

  final List<String> trackIds;
  final int index;
  final Duration position;

  Map<String, Object> toJson() => {
    'trackIds': trackIds,
    'index': index,
    'positionMs': position.inMilliseconds,
  };

  static SavedPlaybackSession? fromJson(Object? json) {
    if (json is! Map) return null;
    final ids = json['trackIds'];
    if (ids is! List) return null;
    return SavedPlaybackSession(
      trackIds: ids.whereType<String>().toList(),
      index: (json['index'] as num?)?.toInt() ?? 0,
      position: Duration(
        milliseconds: (json['positionMs'] as num?)?.toInt() ?? 0,
      ),
    );
  }
}

/// Small key-value store for preferences and playback state.
class SettingsRepository {
  SettingsRepository(this._database);

  final AppDatabase _database;
  Database get _db => _database.db;

  static const _volumeKey = 'playback.volume';
  static const _shuffleKey = 'playback.shuffle';
  static const _repeatKey = 'playback.repeat';
  static const _sessionKey = 'playback.session';
  static const _trackSortKey = 'library.sort';

  Future<String?> getString(String key) async {
    final rows = await _db.query(
      'settings',
      columns: ['value'],
      where: 'key = ?',
      whereArgs: [key],
      limit: 1,
    );
    return rows.isEmpty ? null : rows.first['value'] as String?;
  }

  Future<void> setString(String key, String value) => _db.insert('settings', {
    'key': key,
    'value': value,
  }, conflictAlgorithm: ConflictAlgorithm.replace);

  Future<double?> getVolume() async =>
      double.tryParse(await getString(_volumeKey) ?? '');
  Future<void> setVolume(double volume) =>
      setString(_volumeKey, volume.toStringAsFixed(3));

  Future<bool> getShuffle() async => (await getString(_shuffleKey)) == 'true';
  Future<void> setShuffle(bool enabled) => setString(_shuffleKey, '$enabled');

  Future<String?> getRepeatMode() => getString(_repeatKey);
  Future<void> setRepeatMode(String mode) => setString(_repeatKey, mode);

  Future<String?> getTrackSort() => getString(_trackSortKey);
  Future<void> setTrackSort(String sort) => setString(_trackSortKey, sort);

  Future<SavedPlaybackSession?> getSession() async {
    final raw = await getString(_sessionKey);
    if (raw == null) return null;
    try {
      return SavedPlaybackSession.fromJson(jsonDecode(raw));
    } on FormatException {
      return null;
    }
  }

  Future<void> setSession(SavedPlaybackSession session) =>
      setString(_sessionKey, jsonEncode(session.toJson()));
}
