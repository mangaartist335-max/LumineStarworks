import 'package:sqflite/sqflite.dart';

import '../database/app_database.dart';

/// Stores listening activity locally.
///
/// Phase 1 records it only; the future rewards system will read from here.
/// No balances or earnings are calculated from this data yet.
class ListeningRepository {
  ListeningRepository(this._database);

  final AppDatabase _database;
  Database get _db => _database.db;

  Future<void> recordSession({
    required String trackId,
    required DateTime startedAt,
    required Duration listened,
    required bool completed,
  }) async {
    if (listened <= Duration.zero) return;
    await _db.insert('listening_sessions', {
      'track_id': trackId,
      'started_at': startedAt.millisecondsSinceEpoch,
      'listened_ms': listened.inMilliseconds,
      'completed': completed ? 1 : 0,
    });
  }

  /// Total time listened since [since].
  Future<Duration> totalListenedSince(DateTime since) async {
    final rows = await _db.rawQuery(
      'SELECT COALESCE(SUM(listened_ms), 0) AS total FROM listening_sessions WHERE started_at >= ?',
      [since.millisecondsSinceEpoch],
    );
    return Duration(milliseconds: (rows.first['total'] as num?)?.toInt() ?? 0);
  }
}
