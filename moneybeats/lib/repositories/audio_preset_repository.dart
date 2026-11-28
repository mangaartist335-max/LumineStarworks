import 'dart:convert';

import 'package:moneybeats/models/audio_effects.dart';
import 'package:moneybeats/repositories/app_database.dart';
import 'package:moneybeats/repositories/settings_repository.dart';
import 'package:sqflite/sqflite.dart';
import 'package:uuid/uuid.dart';

/// The Studio settings saved between launches.
class SavedEffectsState {
  const SavedEffectsState({required this.settings, this.activePresetId});

  final AudioEffectSettings settings;
  final String? activePresetId;
}

/// Stores user-made sound presets, per-track preset choices, the default
/// sound profile and the current Studio settings.
class AudioPresetRepository {
  AudioPresetRepository(this._database, this._settings, {Uuid? uuid})
    : _uuid = uuid ?? const Uuid();

  final AppDatabase _database;
  final SettingsRepository _settings;
  final Uuid _uuid;

  static const _defaultKey = 'effects.defaultPreset';
  static const _stateKey = 'effects.state';

  Database get _db => _database.db;

  Stream<DataChange> get changes =>
      _database.changes.where((c) => c == DataChange.presets);

  /// Built-in presets first, then the user's own, oldest first.
  Future<List<AudioPreset>> getAll() async => [
    ...BuiltInPresets.all,
    ...await getCustom(),
  ];

  Future<List<AudioPreset>> getCustom() async {
    final rows = await _db.query('audio_presets', orderBy: 'created_at ASC');
    return rows.map(_fromRow).toList();
  }

  Future<AudioPreset?> getById(String id) async {
    final builtIn = BuiltInPresets.byId(id);
    if (builtIn != null) return builtIn;
    final rows = await _db.query(
      'audio_presets',
      where: 'id = ?',
      whereArgs: [id],
      limit: 1,
    );
    return rows.isEmpty ? null : _fromRow(rows.first);
  }

  Future<AudioPreset> create(String name, AudioEffectSettings settings) async {
    final now = DateTime.now();
    final preset = AudioPreset(
      id: _uuid.v4(),
      name: _cleanName(name),
      settings: settings.validated(),
      createdAt: now,
      updatedAt: now,
    );
    await _db.insert('audio_presets', _toRow(preset));
    _database.notify(DataChange.presets);
    return preset;
  }

  /// Updates a custom preset's name and/or settings. Built-ins can't change.
  Future<AudioPreset?> update(
    String id, {
    String? name,
    AudioEffectSettings? settings,
  }) async {
    final existing = await getById(id);
    if (existing == null || existing.isBuiltIn) return null;
    final updated = existing.copyWith(
      name: name == null ? null : _cleanName(name),
      settings: settings?.validated(),
      updatedAt: DateTime.now(),
    );
    await _db.update(
      'audio_presets',
      _toRow(updated),
      where: 'id = ?',
      whereArgs: [id],
    );
    _database.notify(DataChange.presets);
    return updated;
  }

  Future<AudioPreset?> rename(String id, String name) => update(id, name: name);

  /// Copies any preset (built-in included) into a new custom preset.
  Future<AudioPreset?> duplicate(String id, {String? name}) async {
    final source = await getById(id);
    if (source == null) return null;
    return create(name ?? '${source.name} copy', source.settings);
  }

  /// Deletes a custom preset, and any song assignments or default that used it.
  Future<void> delete(String id) async {
    if (BuiltInPresets.byId(id) != null) return;
    await _db.transaction((txn) async {
      await txn.delete('audio_presets', where: 'id = ?', whereArgs: [id]);
      await txn.delete(
        'track_audio_presets',
        where: 'preset_id = ?',
        whereArgs: [id],
      );
    });
    if (await getDefaultPresetId() == id) await setDefaultPresetId(null);
    _database.notify(DataChange.presets);
  }

  // Default sound profile ---------------------------------------------------

  Future<String?> getDefaultPresetId() => _settings.getString(_defaultKey);

  Future<void> setDefaultPresetId(String? id) async {
    if (id == null) {
      await _db.delete('settings', where: 'key = ?', whereArgs: [_defaultKey]);
    } else {
      await _settings.setString(_defaultKey, id);
    }
    _database.notify(DataChange.presets);
  }

  // Per-track presets -------------------------------------------------------

  Future<Map<String, String>> getTrackAssignments() async {
    final rows = await _db.query('track_audio_presets');
    return {
      for (final r in rows) r['track_id']! as String: r['preset_id']! as String,
    };
  }

  Future<String?> getTrackPreset(String trackId) async {
    final rows = await _db.query(
      'track_audio_presets',
      where: 'track_id = ?',
      whereArgs: [trackId],
      limit: 1,
    );
    return rows.isEmpty ? null : rows.first['preset_id'] as String?;
  }

  /// Assigns [presetId] to a song, or clears its assignment when null.
  Future<void> assignToTrack(String trackId, String? presetId) async {
    if (presetId == null) {
      await _db.delete(
        'track_audio_presets',
        where: 'track_id = ?',
        whereArgs: [trackId],
      );
    } else {
      await _db.insert('track_audio_presets', {
        'track_id': trackId,
        'preset_id': presetId,
        'assigned_at': DateTime.now().millisecondsSinceEpoch,
      }, conflictAlgorithm: ConflictAlgorithm.replace);
    }
    _database.notify(DataChange.presets);
  }

  /// Removes every per-song assignment so one sound applies to all songs.
  Future<void> clearTrackAssignments() async {
    await _db.delete('track_audio_presets');
    _database.notify(DataChange.presets);
  }

  // Current Studio settings --------------------------------------------------

  Future<SavedEffectsState?> loadState() async {
    final raw = await _settings.getString(_stateKey);
    if (raw == null) return null;
    try {
      final json = jsonDecode(raw);
      if (json is! Map) return null;
      return SavedEffectsState(
        settings: AudioEffectSettings.fromJson(json['settings']),
        activePresetId: json['preset'] as String?,
      );
    } on FormatException {
      return null;
    }
  }

  Future<void> saveState(
    AudioEffectSettings settings,
    String? activePresetId,
  ) => _settings.setString(
    _stateKey,
    jsonEncode({'settings': settings.toJson(), 'preset': activePresetId}),
  );

  AudioPreset _fromRow(Map<String, Object?> row) {
    AudioEffectSettings settings;
    try {
      settings = AudioEffectSettings.fromJson(
        jsonDecode(row['settings']! as String),
      );
    } on FormatException {
      settings = AudioEffectSettings.original;
    }
    return AudioPreset(
      id: row['id']! as String,
      name: row['name']! as String,
      settings: settings,
      createdAt: DateTime.fromMillisecondsSinceEpoch(row['created_at']! as int),
      updatedAt: DateTime.fromMillisecondsSinceEpoch(row['updated_at']! as int),
    );
  }

  Map<String, Object?> _toRow(AudioPreset p) => {
    'id': p.id,
    'name': p.name,
    'settings': jsonEncode(p.settings.toJson()),
    'created_at': p.createdAt.millisecondsSinceEpoch,
    'updated_at': p.updatedAt.millisecondsSinceEpoch,
  };

  String _cleanName(String name) {
    final trimmed = name.trim();
    if (trimmed.isEmpty) return 'My sound';
    return trimmed.length > 40 ? trimmed.substring(0, 40) : trimmed;
  }
}
