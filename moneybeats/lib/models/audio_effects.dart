import 'dart:math' as math;

import 'package:flutter/foundation.dart';

/// Converts semitones to the frequency ratio used by pitch shifters:
/// `pitchFactor = 2^(semitones / 12)`.
double pitchFactorForSemitones(double semitones) =>
    math.pow(2, semitones / 12).toDouble();

/// The inverse of [pitchFactorForSemitones].
double semitonesForPitchFactor(double factor) =>
    12 * math.log(factor) / math.ln2;

/// Limits and steps for every Studio parameter.
abstract final class EffectLimits {
  static const pitchMin = -12.0;
  static const pitchMax = 12.0;

  /// Fine pitch adjustment, in semitones.
  static const pitchStep = 0.1;

  static const speedMin = 0.5;
  static const speedMax = 2.0;
  static const speedStep = 0.05;

  static const eqGainMin = -12.0;
  static const eqGainMax = 12.0;

  static const bassMin = 0.0;
  static const bassMax = 12.0;

  static const reverbDecayMin = 0.2; // seconds
  static const reverbDecayMax = 8.0;
}

/// The ten reference equaliser bands, in Hz. Presets and saved settings use
/// these; each platform maps them onto the bands it really has.
const referenceEqBands = <double>[
  32,
  64,
  125,
  250,
  500,
  1000,
  2000,
  4000,
  8000,
  16000,
];

String formatFrequency(double hz) {
  if (hz >= 1000) {
    final k = hz / 1000;
    return k == k.roundToDouble()
        ? '${k.round()}k'
        : '${k.toStringAsFixed(1)}k';
  }
  return '${hz.round()}';
}

/// Reverb spaces, each with its own default decay and size.
enum ReverbType {
  smallRoom('Small Room', 0.6, 0.25),
  largeRoom('Large Room', 1.4, 0.55),
  concertHall('Concert Hall', 2.4, 0.75),
  ambientSpace('Ambient Space', 3.6, 0.65),
  cathedral('Cathedral', 5.5, 1.0);

  const ReverbType(this.label, this.defaultDecay, this.defaultRoomSize);

  final String label;

  /// Seconds.
  final double defaultDecay;

  /// 0 (small) to 1 (vast).
  final double defaultRoomSize;

  static ReverbType fromName(String? name) => ReverbType.values.firstWhere(
    (t) => t.name == name,
    orElse: () => ReverbType.largeRoom,
  );
}

/// A named equaliser curve over the ten [referenceEqBands].
@immutable
class EqPreset {
  const EqPreset(this.id, this.label, this.gains);

  final String id;
  final String label;
  final List<double> gains;

  static const flat = EqPreset('flat', 'Flat', [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

  static const all = <EqPreset>[
    flat,
    EqPreset('pop', 'Pop', [-1.5, -1, 0, 2, 4, 4, 2, 0, -1, -1.5]),
    EqPreset('rock', 'Rock', [5, 4, 3, 1, -1, -1, 1, 3, 4, 5]),
    EqPreset('electronic', 'Electronic', [5, 4, 1, 0, -2, 1, 0, 1, 4, 5]),
    EqPreset('hiphop', 'Hip-Hop', [6, 5, 2, 3, -1, -1, 1, 0, 2, 3]),
    EqPreset('jazz', 'Jazz', [3, 2, 1, 2, -1, -1, 0, 1, 2, 3]),
    EqPreset('classical', 'Classical', [4, 3, 2, 1, -1, -1, 0, 2, 3, 4]),
    EqPreset('vocal', 'Vocal', [-2, -3, -2, 1, 3, 4, 4, 3, 1, 0]),
    EqPreset('acoustic', 'Acoustic', [4, 3, 2, 1, 1, 1, 2, 3, 3, 2]),
    EqPreset('cinematic', 'Cinematic', [5, 4, 2, 0, -1, 0, 1, 2, 3, 3]),
  ];

  static EqPreset? byId(String? id) {
    for (final p in all) {
      if (p.id == id) return p;
    }
    return null;
  }
}

/// Every adjustable Studio parameter. Stored separately from the audio file:
/// effects are applied while playing and never change the imported MP3.
@immutable
class AudioEffectSettings {
  const AudioEffectSettings({
    this.pitchSemitones = 0,
    this.speed = 1.0,
    this.eqGains = const [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    this.eqPresetId = 'flat',
    this.bassBoostDb = 0,
    this.reverbType = ReverbType.largeRoom,
    this.reverbMix = 0,
    this.reverbDecay = 1.4,
    this.reverbRoomSize = 0.55,
  });

  /// Untouched playback.
  static const original = AudioEffectSettings();

  final double pitchSemitones;
  final double speed;

  /// Gains in dB for the ten [referenceEqBands].
  final List<double> eqGains;

  /// The EQ preset the gains came from, or `custom`.
  final String eqPresetId;

  final double bassBoostDb;
  final ReverbType reverbType;

  /// Wet/dry mix: 0 is dry (off), 1 is fully wet.
  final double reverbMix;

  /// Seconds.
  final double reverbDecay;

  /// 0 to 1.
  final double reverbRoomSize;

  double get pitchFactor => pitchFactorForSemitones(pitchSemitones);

  bool get hasPitch => pitchSemitones.abs() >= 0.05;
  bool get hasSpeed => (speed - 1.0).abs() >= 0.001;
  bool get hasEq => eqGains.any((g) => g.abs() >= 0.05);
  bool get hasBass => bassBoostDb >= 0.05;
  bool get hasReverb => reverbMix >= 0.005;

  bool get isOriginal =>
      !hasPitch && !hasSpeed && !hasEq && !hasBass && !hasReverb;

  /// The loudest boost any stage adds, used for headroom management.
  double get maxBoostDb {
    final eqPeak = eqGains.fold<double>(0, (m, g) => math.max(m, g));
    return math.max(eqPeak + (hasBass ? bassBoostDb * 0.5 : 0), bassBoostDb);
  }

  /// Clamps and rounds every value to its allowed range and step.
  AudioEffectSettings validated() {
    double snap(double v, double step) => (v / step).round() * step;
    double clamp(double v, double lo, double hi) =>
        v.isNaN ? lo : v.clamp(lo, hi).toDouble();
    final gains = List<double>.generate(referenceEqBands.length, (i) {
      final g = i < eqGains.length ? eqGains[i] : 0.0;
      return double.parse(
        clamp(
          g,
          EffectLimits.eqGainMin,
          EffectLimits.eqGainMax,
        ).toStringAsFixed(1),
      );
    });
    return AudioEffectSettings(
      pitchSemitones: double.parse(
        snap(
          clamp(pitchSemitones, EffectLimits.pitchMin, EffectLimits.pitchMax),
          EffectLimits.pitchStep,
        ).toStringAsFixed(1),
      ),
      speed: double.parse(
        snap(
          clamp(speed, EffectLimits.speedMin, EffectLimits.speedMax),
          EffectLimits.speedStep,
        ).toStringAsFixed(2),
      ),
      eqGains: gains,
      eqPresetId: eqPresetId,
      bassBoostDb: double.parse(
        clamp(
          bassBoostDb,
          EffectLimits.bassMin,
          EffectLimits.bassMax,
        ).toStringAsFixed(1),
      ),
      reverbType: reverbType,
      reverbMix: double.parse(clamp(reverbMix, 0, 1).toStringAsFixed(2)),
      reverbDecay: double.parse(
        clamp(
          reverbDecay,
          EffectLimits.reverbDecayMin,
          EffectLimits.reverbDecayMax,
        ).toStringAsFixed(2),
      ),
      reverbRoomSize: double.parse(
        clamp(reverbRoomSize, 0, 1).toStringAsFixed(2),
      ),
    );
  }

  AudioEffectSettings copyWith({
    double? pitchSemitones,
    double? speed,
    List<double>? eqGains,
    String? eqPresetId,
    double? bassBoostDb,
    ReverbType? reverbType,
    double? reverbMix,
    double? reverbDecay,
    double? reverbRoomSize,
  }) {
    return AudioEffectSettings(
      pitchSemitones: pitchSemitones ?? this.pitchSemitones,
      speed: speed ?? this.speed,
      eqGains: eqGains ?? this.eqGains,
      eqPresetId: eqPresetId ?? this.eqPresetId,
      bassBoostDb: bassBoostDb ?? this.bassBoostDb,
      reverbType: reverbType ?? this.reverbType,
      reverbMix: reverbMix ?? this.reverbMix,
      reverbDecay: reverbDecay ?? this.reverbDecay,
      reverbRoomSize: reverbRoomSize ?? this.reverbRoomSize,
    );
  }

  Map<String, Object> toJson() => {
    'pitch': pitchSemitones,
    'speed': speed,
    'eq': eqGains,
    'eqPreset': eqPresetId,
    'bass': bassBoostDb,
    'reverbType': reverbType.name,
    'reverbMix': reverbMix,
    'reverbDecay': reverbDecay,
    'reverbRoomSize': reverbRoomSize,
  };

  /// Reads settings saved by any version, filling gaps with defaults and
  /// clamping out-of-range values.
  static AudioEffectSettings fromJson(Object? json) {
    if (json is! Map) return original;
    double num0(Object? v, double fallback) =>
        v is num ? v.toDouble() : fallback;
    final eq = json['eq'];
    final type = ReverbType.fromName(json['reverbType'] as String?);
    return AudioEffectSettings(
      pitchSemitones: num0(json['pitch'], 0),
      speed: num0(json['speed'], 1),
      eqGains: eq is List ? [for (final g in eq) num0(g, 0)] : original.eqGains,
      eqPresetId: json['eqPreset'] is String
          ? json['eqPreset'] as String
          : 'flat',
      bassBoostDb: num0(json['bass'], 0),
      reverbType: type,
      reverbMix: num0(json['reverbMix'], 0),
      reverbDecay: num0(json['reverbDecay'], type.defaultDecay),
      reverbRoomSize: num0(json['reverbRoomSize'], type.defaultRoomSize),
    ).validated();
  }

  @override
  bool operator ==(Object other) =>
      other is AudioEffectSettings &&
      other.pitchSemitones == pitchSemitones &&
      other.speed == speed &&
      listEquals(other.eqGains, eqGains) &&
      other.eqPresetId == eqPresetId &&
      other.bassBoostDb == bassBoostDb &&
      other.reverbType == reverbType &&
      other.reverbMix == reverbMix &&
      other.reverbDecay == reverbDecay &&
      other.reverbRoomSize == reverbRoomSize;

  @override
  int get hashCode => Object.hash(
    pitchSemitones,
    speed,
    Object.hashAll(eqGains),
    eqPresetId,
    bassBoostDb,
    reverbType,
    reverbMix,
    reverbDecay,
    reverbRoomSize,
  );

  @override
  String toString() => 'AudioEffectSettings(${toJson()})';
}

/// A saved sound profile, built in or made by the user.
@immutable
class AudioPreset {
  const AudioPreset({
    required this.id,
    required this.name,
    required this.settings,
    required this.createdAt,
    required this.updatedAt,
    this.isBuiltIn = false,
  });

  final String id;
  final String name;
  final AudioEffectSettings settings;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool isBuiltIn;

  AudioPreset copyWith({
    String? name,
    AudioEffectSettings? settings,
    DateTime? updatedAt,
  }) {
    return AudioPreset(
      id: id,
      name: name ?? this.name,
      settings: settings ?? this.settings,
      createdAt: createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      isBuiltIn: isBuiltIn,
    );
  }

  @override
  bool operator ==(Object other) =>
      other is AudioPreset &&
      other.id == id &&
      other.name == name &&
      other.settings == settings &&
      other.updatedAt == updatedAt;

  @override
  int get hashCode => Object.hash(id, name, settings, updatedAt);
}

/// The presets that ship with MoneyBeats. Values are tunable defaults.
abstract final class BuiltInPresets {
  static final _epoch = DateTime.utc(2026, 1, 1);

  static AudioPreset _preset(String id, String name, AudioEffectSettings s) =>
      AudioPreset(
        id: 'builtin.$id',
        name: name,
        settings: s.validated(),
        createdAt: _epoch,
        updatedAt: _epoch,
        isBuiltIn: true,
      );

  static final original = _preset(
    'original',
    'Original',
    AudioEffectSettings.original,
  );

  static final all = <AudioPreset>[
    original,
    _preset(
      'nightcore',
      'Nightcore',
      const AudioEffectSettings(pitchSemitones: 3, speed: 1.25),
    ),
    _preset(
      'slowed',
      'Slowed',
      const AudioEffectSettings(pitchSemitones: -2, speed: 0.85),
    ),
    _preset(
      'slowed_reverb',
      'Slowed + Reverb',
      AudioEffectSettings(
        pitchSemitones: -2,
        speed: 0.85,
        bassBoostDb: 3,
        reverbType: ReverbType.largeRoom,
        reverbMix: 0.25,
        reverbDecay: ReverbType.largeRoom.defaultDecay,
        reverbRoomSize: ReverbType.largeRoom.defaultRoomSize,
      ),
    ),
    _preset(
      'bass_boosted',
      'Bass Boosted',
      const AudioEffectSettings(bassBoostDb: 10),
    ),
    _preset(
      'deep_atmosphere',
      'Deep Atmosphere',
      AudioEffectSettings(
        pitchSemitones: -3,
        speed: 0.9,
        bassBoostDb: 4,
        reverbType: ReverbType.ambientSpace,
        reverbMix: 0.6,
        reverbDecay: ReverbType.ambientSpace.defaultDecay,
        reverbRoomSize: ReverbType.ambientSpace.defaultRoomSize,
      ),
    ),
    _preset(
      'cinematic',
      'Cinematic',
      AudioEffectSettings(
        speed: 0.95,
        bassBoostDb: 5,
        reverbType: ReverbType.concertHall,
        reverbMix: 0.35,
        reverbDecay: ReverbType.concertHall.defaultDecay,
        reverbRoomSize: ReverbType.concertHall.defaultRoomSize,
      ),
    ),
  ];

  static AudioPreset? byId(String? id) {
    for (final p in all) {
      if (p.id == id) return p;
    }
    return null;
  }
}

/// How a platform implements bass enhancement.
enum BassUnit {
  /// A low-shelf filter measured in dB.
  decibels,

  /// Android's BassBoost effect, which uses a 0-100% strength.
  strength,
}

/// Where the waveform comes from on this platform.
enum WaveformSource {
  /// Decoded PCM peaks.
  pcm,

  /// Loudness estimated from the MP3 frames' gain values (no decoding).
  frameEnvelope,
}

/// What the current device's audio engine can really do. The Studio only
/// shows controls that change the sound.
@immutable
class AudioEffectsCapabilities {
  const AudioEffectsCapabilities({
    required this.engine,
    this.speed = false,
    this.pitch = false,
    this.pitchNote,
    this.equalizer = false,
    this.equalizerBands = const [],
    this.equalizerMinDb = EffectLimits.eqGainMin,
    this.equalizerMaxDb = EffectLimits.eqGainMax,
    this.equalizerPending = false,
    this.equalizerNote,
    this.bass = false,
    this.bassUnit = BassUnit.decibels,
    this.bassNote,
    this.reverb = false,
    this.reverbMix = false,
    this.reverbDecay = false,
    this.reverbRoomSize = false,
    this.reverbNote,
    this.waveform = WaveformSource.frameEnvelope,
  });

  /// A short description of the processing engine.
  final String engine;

  final bool speed;
  final bool pitch;
  final String? pitchNote;

  final bool equalizer;

  /// Centre frequencies of the bands the engine really has.
  final List<double> equalizerBands;
  final double equalizerMinDb;
  final double equalizerMaxDb;

  /// Android reports its bands once audio has loaded.
  final bool equalizerPending;
  final String? equalizerNote;

  final bool bass;
  final BassUnit bassUnit;
  final String? bassNote;

  final bool reverb;
  final bool reverbMix;
  final bool reverbDecay;
  final bool reverbRoomSize;
  final String? reverbNote;

  final WaveformSource waveform;

  /// Speed only (what every just_audio backend supports).
  static const speedOnly = AudioEffectsCapabilities(
    engine: 'Platform player',
    speed: true,
    pitchNote: 'Pitch shifting is not available on this platform yet.',
    equalizerNote: 'The equaliser is not available on this platform yet.',
    bassNote: 'Bass boost is not available on this platform yet.',
    reverbNote: 'Reverb is not available on this platform yet.',
  );

  AudioEffectsCapabilities copyWith({
    bool? equalizer,
    List<double>? equalizerBands,
    double? equalizerMinDb,
    double? equalizerMaxDb,
    bool? equalizerPending,
    String? equalizerNote,
    bool? bass,
    BassUnit? bassUnit,
    String? bassNote,
    bool? reverb,
    bool? reverbMix,
    bool? reverbDecay,
    bool? reverbRoomSize,
    String? reverbNote,
    bool? pitch,
    String? pitchNote,
  }) {
    return AudioEffectsCapabilities(
      engine: engine,
      speed: speed,
      pitch: pitch ?? this.pitch,
      pitchNote: pitchNote ?? this.pitchNote,
      equalizer: equalizer ?? this.equalizer,
      equalizerBands: equalizerBands ?? this.equalizerBands,
      equalizerMinDb: equalizerMinDb ?? this.equalizerMinDb,
      equalizerMaxDb: equalizerMaxDb ?? this.equalizerMaxDb,
      equalizerPending: equalizerPending ?? this.equalizerPending,
      equalizerNote: equalizerNote ?? this.equalizerNote,
      bass: bass ?? this.bass,
      bassUnit: bassUnit ?? this.bassUnit,
      bassNote: bassNote ?? this.bassNote,
      reverb: reverb ?? this.reverb,
      reverbMix: reverbMix ?? this.reverbMix,
      reverbDecay: reverbDecay ?? this.reverbDecay,
      reverbRoomSize: reverbRoomSize ?? this.reverbRoomSize,
      reverbNote: reverbNote ?? this.reverbNote,
      waveform: waveform,
    );
  }

  @override
  bool operator ==(Object other) =>
      other is AudioEffectsCapabilities &&
      other.engine == engine &&
      other.speed == speed &&
      other.pitch == pitch &&
      other.equalizer == equalizer &&
      listEquals(other.equalizerBands, equalizerBands) &&
      other.equalizerMinDb == equalizerMinDb &&
      other.equalizerMaxDb == equalizerMaxDb &&
      other.equalizerPending == equalizerPending &&
      other.bass == bass &&
      other.bassUnit == bassUnit &&
      other.reverb == reverb &&
      other.reverbMix == reverbMix &&
      other.reverbDecay == reverbDecay &&
      other.reverbRoomSize == reverbRoomSize &&
      other.waveform == waveform;

  @override
  int get hashCode => Object.hash(
    engine,
    speed,
    pitch,
    equalizer,
    Object.hashAll(equalizerBands),
    equalizerMinDb,
    equalizerMaxDb,
    equalizerPending,
    bass,
    bassUnit,
    reverb,
    reverbMix,
    reverbDecay,
    reverbRoomSize,
    waveform,
  );
}

/// The Studio's runtime state: one source of truth for effects.
@immutable
class AudioEffectsState {
  const AudioEffectsState({
    this.settings = AudioEffectSettings.original,
    this.activePresetId = 'builtin.original',
    this.compareOriginal = false,
    this.capabilities = AudioEffectsCapabilities.speedOnly,
    this.trackPresetId,
    this.defaultPresetId,
  });

  /// What the user has dialled in.
  final AudioEffectSettings settings;

  /// The preset these settings came from, or null once edited.
  final String? activePresetId;

  /// A/B comparison: when true the original sound plays, settings are kept.
  final bool compareOriginal;

  final AudioEffectsCapabilities capabilities;

  /// The preset assigned to the current track, if any.
  final String? trackPresetId;

  /// The startup sound profile, if the user picked one.
  final String? defaultPresetId;

  /// What actually reaches the speakers.
  AudioEffectSettings get applied =>
      compareOriginal ? AudioEffectSettings.original : settings;

  AudioEffectsState copyWith({
    AudioEffectSettings? settings,
    String? activePresetId,
    bool clearActivePreset = false,
    bool? compareOriginal,
    AudioEffectsCapabilities? capabilities,
    String? trackPresetId,
    bool clearTrackPreset = false,
    String? defaultPresetId,
    bool clearDefaultPreset = false,
  }) {
    return AudioEffectsState(
      settings: settings ?? this.settings,
      activePresetId: clearActivePreset
          ? null
          : (activePresetId ?? this.activePresetId),
      compareOriginal: compareOriginal ?? this.compareOriginal,
      capabilities: capabilities ?? this.capabilities,
      trackPresetId: clearTrackPreset
          ? null
          : (trackPresetId ?? this.trackPresetId),
      defaultPresetId: clearDefaultPreset
          ? null
          : (defaultPresetId ?? this.defaultPresetId),
    );
  }

  @override
  bool operator ==(Object other) =>
      other is AudioEffectsState &&
      other.settings == settings &&
      other.activePresetId == activePresetId &&
      other.compareOriginal == compareOriginal &&
      other.capabilities == capabilities &&
      other.trackPresetId == trackPresetId &&
      other.defaultPresetId == defaultPresetId;

  @override
  int get hashCode => Object.hash(
    settings,
    activePresetId,
    compareOriginal,
    capabilities,
    trackPresetId,
    defaultPresetId,
  );
}
