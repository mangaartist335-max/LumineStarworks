// Platform audio processing for the Studio: the interface, the pure mapping
// functions shared by implementations, and the fallback for platforms without
// native effects. Implementations live in android_audio_processor.dart and
// mpv_audio_processor.dart.

import 'dart:math' as math;

import 'package:moneybeats/models/audio_effects.dart';

/// Applies equaliser, bass and reverb (and pitch, where the processor owns
/// it) to the audio that is playing. Speed is always applied by the player.
abstract class PlatformAudioProcessor {
  /// What this device can really do. Can change at runtime, for example when
  /// Android reports its equaliser bands after audio loads.
  AudioEffectsCapabilities get capabilities;
  Stream<AudioEffectsCapabilities> get capabilitiesStream;

  /// True when this processor applies pitch itself (desktop filter chain).
  /// Otherwise pitch goes through the player (Android).
  bool get handlesPitch;

  Future<void> initialize();

  /// Applies [settings]. Only effects listed in [capabilities] are applied.
  Future<void> apply(AudioEffectSettings settings);

  Future<void> dispose();
}

/// Speed only: platforms whose player has no effect pipeline (iOS today).
class SpeedOnlyAudioProcessor implements PlatformAudioProcessor {
  SpeedOnlyAudioProcessor({String engine = 'AVPlayer'})
    : _capabilities = AudioEffectsCapabilities(
        engine: engine,
        speed: true,
        pitchNote: AudioEffectsCapabilities.speedOnly.pitchNote,
        equalizerNote: AudioEffectsCapabilities.speedOnly.equalizerNote,
        bassNote: AudioEffectsCapabilities.speedOnly.bassNote,
        reverbNote: AudioEffectsCapabilities.speedOnly.reverbNote,
        waveform: WaveformSource.pcm,
      );

  final AudioEffectsCapabilities _capabilities;

  @override
  AudioEffectsCapabilities get capabilities => _capabilities;

  @override
  Stream<AudioEffectsCapabilities> get capabilitiesStream =>
      Stream.value(_capabilities);

  @override
  bool get handlesPitch => false;

  @override
  Future<void> initialize() async {}

  @override
  Future<void> apply(AudioEffectSettings settings) async {}

  @override
  Future<void> dispose() async {}
}

/// Pure functions that translate Studio settings into engine parameters.
abstract final class EffectMath {
  /// Gain for [frequency] from the ten reference band gains, interpolated on a
  /// logarithmic frequency axis (how equalisers are perceived).
  static double eqGainAt(List<double> referenceGains, double frequency) {
    final bands = referenceEqBands;
    if (frequency <= bands.first) return referenceGains.first;
    if (frequency >= bands.last) return referenceGains.last;
    final x = math.log(frequency) / math.ln2;
    for (var i = 0; i < bands.length - 1; i++) {
      final lo = bands[i], hi = bands[i + 1];
      if (frequency >= lo && frequency <= hi) {
        final x0 = math.log(lo) / math.ln2, x1 = math.log(hi) / math.ln2;
        final t = (x - x0) / (x1 - x0);
        return referenceGains[i] +
            (referenceGains[i + 1] - referenceGains[i]) * t;
      }
    }
    return 0;
  }

  /// Gains for an engine's own bands, clamped to its limits.
  static List<double> mapEqToBands(
    List<double> referenceGains,
    List<double> bandCenters, {
    required double minDb,
    required double maxDb,
    double bassBoostDb = 0,
  }) {
    return [
      for (final f in bandCenters)
        (eqGainAt(referenceGains, f) + bassBoostDb * lowShelfWeight(f))
            .clamp(minDb, maxDb)
            .toDouble(),
    ];
  }

  /// How much a low-shelf bass boost (corner 160 Hz) affects a band:
  /// 1 well below the corner, fading to 0 an octave and a half above it.
  static double lowShelfWeight(double frequency) {
    const corner = 160.0;
    if (frequency <= corner) return 1;
    final octaves = math.log(frequency / corner) / math.ln2;
    return (1 - octaves / 1.5).clamp(0.0, 1.0);
  }

  /// Output attenuation (dB, negative) that keeps boosts from clipping.
  static double headroomDb(AudioEffectSettings s) =>
      -math.min(s.maxBoostDb * 0.6, 9.0);

  /// Linear volume factor for [headroomDb].
  static double headroomGain(AudioEffectSettings s) =>
      math.pow(10, headroomDb(s) / 20).toDouble();

  /// Android BassBoost strength (0-1000) for a target in dB (0-12).
  static int bassStrength(double db) =>
      (db / EffectLimits.bassMax * 1000).round().clamp(0, 1000);

  /// Android EnvironmentalReverb parameters (millibels / per mille / ms).
  static Map<String, int> androidReverbParameters(AudioEffectSettings s) {
    final mix = s.reverbMix.clamp(0.0, 1.0);
    // 20*log10(mix) dB in millibels; silent at mix 0.
    final wetMb = mix <= 0.001
        ? -9000
        : (2000 * math.log(mix) / math.ln10).round().clamp(-9000, 0);
    final (roomHf, decayHf, diffusion, lateBoost) = switch (s.reverbType) {
      ReverbType.smallRoom => (-600, 900, 800, -300),
      ReverbType.largeRoom => (-500, 830, 900, 0),
      ReverbType.concertHall => (-400, 700, 1000, 200),
      ReverbType.ambientSpace => (-300, 1000, 1000, 300),
      ReverbType.cathedral => (-500, 600, 1000, 400),
    };
    return {
      'decayTimeMs': (s.reverbDecay * 1000).round().clamp(100, 20000),
      'decayHfRatio': decayHf,
      'roomLevel': wetMb,
      'roomHfLevel': roomHf,
      'reverbLevel': (wetMb + lateBoost).clamp(-9000, 2000),
      'density': (s.reverbRoomSize * 1000).round().clamp(0, 1000),
      'diffusion': diffusion,
    };
  }
}
