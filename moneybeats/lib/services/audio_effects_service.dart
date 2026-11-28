import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:moneybeats/models/audio_effects.dart';
import 'package:moneybeats/repositories/audio_preset_repository.dart';
import 'package:moneybeats/services/audio_service.dart';
import 'package:moneybeats/services/mpv_audio_processor.dart';
import 'package:moneybeats/services/platform_audio_processor.dart';
import 'package:rxdart/rxdart.dart';

/// Owns the Studio's effect settings and applies them to the one audio
/// engine. The single source of truth for effects: the UI reads its state
/// and calls its methods; nothing else talks to the processors.
///
/// Sound selection rules:
/// * The **global sound** applies to every song without its own preset and
///   is remembered between launches.
/// * A **song preset** overrides it while that song plays. Edits made during
///   such a song are temporary; the next song goes back to the global sound.
/// * The **default sound profile**, if set, becomes the global sound every
///   time the app starts.
class AudioEffectsService {
  AudioEffectsService({
    required this._player,
    required PlatformAudioProcessor processor,
    required this._presets,
  }) : _processor = processor,
       _state = BehaviorSubject.seeded(
         AudioEffectsState(capabilities: processor.capabilities),
       );

  final AudioPlayerService _player;
  final PlatformAudioProcessor _processor;
  final AudioPresetRepository _presets;
  final BehaviorSubject<AudioEffectsState> _state;
  final _subscriptions = <StreamSubscription<Object?>>[];

  AudioEffectSettings _global = AudioEffectSettings.original;
  String? _globalPresetId = BuiltInPresets.original.id;
  Map<String, String> _assignments = {};
  String? _currentTrackId;

  bool _applying = false;
  bool _dirty = false;
  Completer<void>? _applyDone;
  Timer? _persistTimer;
  bool _initialized = false;

  AudioEffectsState get state => _state.value;
  Stream<AudioEffectsState> get stateStream => _state.stream;

  void _emit(AudioEffectsState next) {
    if (!_state.isClosed && next != _state.value) _state.add(next);
  }

  Future<void> initialize() async {
    if (_initialized) return;
    _initialized = true;
    try {
      await _processor.initialize();
    } catch (e) {
      debugPrint('Audio processor failed to start: $e');
    }
    _subscriptions.add(
      _processor.capabilitiesStream.listen((caps) {
        _emit(state.copyWith(capabilities: caps));
        _scheduleApply();
      }),
    );

    final defaultId = await _presets.getDefaultPresetId();
    final defaultPreset = defaultId == null
        ? null
        : await _presets.getById(defaultId);
    if (defaultPreset != null) {
      _global = defaultPreset.settings;
      _globalPresetId = defaultPreset.id;
    } else {
      final saved = await _presets.loadState();
      if (saved != null) {
        _global = saved.settings;
        _globalPresetId = saved.activePresetId;
      }
    }
    _assignments = await _presets.getTrackAssignments();

    _emit(
      state.copyWith(
        capabilities: _processor.capabilities,
        settings: _global,
        activePresetId: _globalPresetId,
        clearActivePreset: _globalPresetId == null,
        defaultPresetId: defaultPreset?.id,
        clearDefaultPreset: defaultPreset == null,
      ),
    );

    _subscriptions
      ..add(
        _player.queueStream
            .map((q) => q.currentTrack?.id)
            .distinct()
            .listen((id) => unawaited(_onTrack(id))),
      )
      ..add(_presets.changes.listen((_) => unawaited(_onPresetsChanged())));

    _scheduleApply();
  }

  // ------------------------------------------------------------ track rules

  Future<void> _onTrack(String? trackId) async {
    _currentTrackId = trackId;
    final assigned = trackId == null ? null : _assignments[trackId];
    if (assigned != null) {
      AudioPreset? preset;
      try {
        preset = await _presets.getById(assigned);
      } catch (e) {
        debugPrint('Could not load the song preset: $e');
      }
      if (_state.isClosed) return;
      if (preset != null && _currentTrackId == trackId) {
        _emit(
          state.copyWith(
            settings: preset.settings,
            activePresetId: preset.id,
            trackPresetId: preset.id,
          ),
        );
        _scheduleApply();
        return;
      }
    }
    if (state.trackPresetId != null) {
      // Leaving a song with its own preset: back to the global sound.
      _emit(
        state.copyWith(
          settings: _global,
          activePresetId: _globalPresetId,
          clearActivePreset: _globalPresetId == null,
          clearTrackPreset: true,
        ),
      );
      _scheduleApply();
    }
  }

  Future<void> _onPresetsChanged() async {
    final String? defaultId;
    final bool stillExists;
    final active = state.activePresetId;
    try {
      _assignments = await _presets.getTrackAssignments();
      defaultId = await _presets.getDefaultPresetId();
      stillExists = active == null || await _presets.getById(active) != null;
    } catch (e) {
      // Usually the app shutting down mid-refresh; the next change retries.
      if (!_state.isClosed) debugPrint('Could not refresh presets: $e');
      return;
    }
    if (_state.isClosed) return;
    _emit(
      state.copyWith(
        defaultPresetId: defaultId,
        clearDefaultPreset: defaultId == null,
        clearActivePreset: !stillExists,
      ),
    );
    if (!stillExists && _globalPresetId == active) _globalPresetId = null;
    await _onTrack(_currentTrackId);
  }

  // ---------------------------------------------------------------- editing

  /// Applies a change to the current settings (validated). Edits detach the
  /// settings from their preset unless they still match it exactly.
  void _edit(AudioEffectSettings Function(AudioEffectSettings s) change) {
    final next = change(state.settings).validated();
    final presetId = _matchingPresetId(next);
    _emit(
      state.copyWith(
        settings: next,
        activePresetId: presetId,
        clearActivePreset: presetId == null,
        compareOriginal: false,
      ),
    );
    if (state.trackPresetId == null) {
      _global = next;
      _globalPresetId = presetId;
      _schedulePersist();
    }
    _scheduleApply();
  }

  String? _matchingPresetId(AudioEffectSettings settings) {
    final active = state.activePresetId;
    if (active == null) return null;
    final builtIn = BuiltInPresets.byId(active);
    if (builtIn != null) return builtIn.settings == settings ? active : null;
    return null; // Custom presets: edits mean "modified".
  }

  void setPitch(double semitones) =>
      _edit((s) => s.copyWith(pitchSemitones: semitones));

  void setSpeed(double speed) => _edit((s) => s.copyWith(speed: speed));

  void setEqGain(int band, double db) => _edit((s) {
    final gains = List<double>.of(s.eqGains);
    if (band < 0 || band >= gains.length) return s;
    gains[band] = db;
    return s.copyWith(eqGains: gains, eqPresetId: 'custom');
  });

  /// Sets the gain at a device band frequency (Android's bands differ from
  /// the ten reference bands). Nearby reference bands move together so the
  /// curve at [frequency] lands exactly on [db].
  void setEqGainAtFrequency(double frequency, double db) => _edit((s) {
    final gains = List<double>.of(s.eqGains);
    final delta = db - EffectMath.eqGainAt(gains, frequency);
    final weights = [
      for (final f in referenceEqBands)
        (1 - (math.log(f / frequency) / math.ln2).abs() / 1.5).clamp(0.0, 1.0),
    ];
    final atFrequency = EffectMath.eqGainAt(weights, frequency);
    if (atFrequency <= 0) return s;
    for (var i = 0; i < gains.length; i++) {
      gains[i] += delta * weights[i] / atFrequency;
    }
    return s.copyWith(eqGains: gains, eqPresetId: 'custom');
  });

  void applyEqPreset(EqPreset preset) =>
      _edit((s) => s.copyWith(eqGains: preset.gains, eqPresetId: preset.id));

  void setBassBoost(double db) => _edit((s) => s.copyWith(bassBoostDb: db));

  void setReverbType(ReverbType type) => _edit(
    (s) => s.copyWith(
      reverbType: type,
      reverbDecay: type.defaultDecay,
      reverbRoomSize: type.defaultRoomSize,
      // Picking a space should be audible straight away.
      reverbMix: s.hasReverb ? s.reverbMix : 0.3,
    ),
  );

  void setReverbMix(double mix) => _edit((s) => s.copyWith(reverbMix: mix));

  void setReverbDecay(double seconds) =>
      _edit((s) => s.copyWith(reverbDecay: seconds));

  void setReverbRoomSize(double size) =>
      _edit((s) => s.copyWith(reverbRoomSize: size));

  /// Loads a preset's settings.
  void applyPreset(AudioPreset preset) {
    _emit(
      state.copyWith(
        settings: preset.settings,
        activePresetId: preset.id,
        compareOriginal: false,
      ),
    );
    if (state.trackPresetId == null) {
      _global = preset.settings;
      _globalPresetId = preset.id;
      _schedulePersist();
    }
    _scheduleApply();
  }

  /// A/B comparison: hear the untouched song without losing your settings.
  void setCompareOriginal(bool original) {
    _emit(state.copyWith(compareOriginal: original));
    _scheduleApply();
  }

  void toggleCompare() => setCompareOriginal(!state.compareOriginal);

  /// Back to the original sound (pitch 0, speed 1, flat EQ, no bass/reverb).
  void resetAll() => applyPreset(BuiltInPresets.original);

  // ----------------------------------------------------- preset management

  /// Saves the current settings as a new preset and selects it.
  Future<AudioPreset> saveAsPreset(String name) async {
    final preset = await _presets.create(name, state.settings);
    _emit(state.copyWith(activePresetId: preset.id));
    if (state.trackPresetId == null) {
      _globalPresetId = preset.id;
      _schedulePersist();
    }
    return preset;
  }

  /// Overwrites a custom preset with the current settings.
  Future<void> updatePresetFromCurrent(String presetId) async {
    final updated = await _presets.update(presetId, settings: state.settings);
    if (updated != null) _emit(state.copyWith(activePresetId: presetId));
  }

  Future<void> renamePreset(String id, String name) =>
      _presets.rename(id, name);

  Future<AudioPreset?> duplicatePreset(String id) => _presets.duplicate(id);

  Future<void> deletePreset(String id) => _presets.delete(id);

  /// Makes [preset] the startup sound and the global sound right now.
  Future<void> setDefaultPreset(AudioPreset? preset) async {
    await _presets.setDefaultPresetId(preset?.id);
    if (preset != null && state.trackPresetId == null) applyPreset(preset);
  }

  /// Gives the current song its own preset (or removes it with null).
  Future<void> assignPresetToCurrentTrack(AudioPreset? preset) async {
    final trackId = _currentTrackId;
    if (trackId == null) return;
    await assignPresetToTrack(trackId, preset);
  }

  Future<void> assignPresetToTrack(String trackId, AudioPreset? preset) async {
    await _presets.assignToTrack(trackId, preset?.id);
    _assignments = await _presets.getTrackAssignments();
    if (trackId == _currentTrackId) {
      if (preset != null) {
        _emit(
          state.copyWith(
            settings: preset.settings,
            activePresetId: preset.id,
            trackPresetId: preset.id,
            compareOriginal: false,
          ),
        );
        _scheduleApply();
      } else {
        await _onTrack(trackId);
      }
    }
  }

  /// One sound everywhere: clears every song preset and applies [preset] as
  /// the global sound.
  Future<void> applyPresetToAllTracks(AudioPreset preset) async {
    await _presets.clearTrackAssignments();
    _assignments = {};
    _emit(state.copyWith(clearTrackPreset: true));
    applyPreset(preset);
  }

  // --------------------------------------------------------------- engine

  void _scheduleApply() {
    _dirty = true;
    if (!_applying) unawaited(_runApply());
  }

  /// Completes once every pending change has reached the engine.
  Future<void> flush() async {
    if (!_applying && !_dirty) return;
    _applyDone ??= Completer<void>();
    await _applyDone!.future;
  }

  /// Applies settings one batch at a time; rapid slider moves coalesce into
  /// the latest value instead of queueing up.
  Future<void> _runApply() async {
    _applying = true;
    try {
      while (_dirty) {
        _dirty = false;
        final s = state.applied;
        final caps = state.capabilities;
        await _player.setSpeed(caps.speed ? s.speed : 1.0);
        if (!_processor.handlesPitch) {
          await _player.setPitch(caps.pitch ? s.pitchFactor : 1.0);
        }
        await _processor.apply(_supportedOnly(s, caps));
        // Desktop filters include their own headroom stage.
        final gain = _processor is MpvAudioProcessor
            ? 1.0
            : EffectMath.headroomGain(_supportedOnly(s, caps));
        await _player.setEffectsGain(gain);
      }
    } catch (e) {
      debugPrint('Applying audio effects failed: $e');
    } finally {
      _applying = false;
      final done = _applyDone;
      _applyDone = null;
      done?.complete();
    }
  }

  /// Drops settings the engine can't apply, so nothing pretends to work.
  static AudioEffectSettings _supportedOnly(
    AudioEffectSettings s,
    AudioEffectsCapabilities caps,
  ) {
    return s.copyWith(
      pitchSemitones: caps.pitch ? s.pitchSemitones : 0,
      speed: caps.speed ? s.speed : 1,
      eqGains: caps.equalizer
          ? s.eqGains
          : AudioEffectSettings.original.eqGains,
      bassBoostDb: caps.bass ? s.bassBoostDb : 0,
      reverbMix: caps.reverb ? s.reverbMix : 0,
    );
  }

  void _schedulePersist() {
    _persistTimer?.cancel();
    _persistTimer = Timer(const Duration(milliseconds: 400), () {
      unawaited(
        _presets
            .saveState(_global, _globalPresetId)
            .catchError((Object e) => debugPrint('Could not save effects: $e')),
      );
    });
  }

  /// Writes pending settings now (used on shutdown and in tests).
  Future<void> persistNow() async {
    _persistTimer?.cancel();
    await _presets.saveState(_global, _globalPresetId);
  }

  void stopTimers() => _persistTimer?.cancel();

  Future<void> dispose() async {
    stopTimers();
    for (final sub in _subscriptions) {
      await sub.cancel();
    }
    await _processor.dispose();
    await _state.close();
  }
}
