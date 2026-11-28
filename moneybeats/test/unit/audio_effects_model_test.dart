import 'dart:convert';
import 'dart:math' as math;

import 'package:flutter_test/flutter_test.dart';
import 'package:moneybeats/models/audio_effects.dart';
import 'package:moneybeats/services/mpv_audio_processor.dart';
import 'package:moneybeats/services/platform_audio_processor.dart';

void main() {
  group('semitone conversion', () {
    test('pitchFactor = 2^(semitones/12)', () {
      expect(pitchFactorForSemitones(0), 1.0);
      expect(pitchFactorForSemitones(12), closeTo(2.0, 1e-12));
      expect(pitchFactorForSemitones(-12), closeTo(0.5, 1e-12));
      expect(pitchFactorForSemitones(2), closeTo(1.122462, 1e-6));
      expect(pitchFactorForSemitones(-3), closeTo(0.840896, 1e-6));
    });

    test('round-trips', () {
      for (final st in [-12.0, -2.5, 0.1, 3.0, 7.3, 12.0]) {
        expect(
          semitonesForPitchFactor(pitchFactorForSemitones(st)),
          closeTo(st, 1e-9),
        );
      }
    });
  });

  group('parameter validation', () {
    test('clamps every value to its range and snaps to its step', () {
      const wild = AudioEffectSettings(
        pitchSemitones: 30,
        speed: 0.123,
        eqGains: [99, -99, 3.33333],
        bassBoostDb: -4,
        reverbMix: 1.7,
        reverbDecay: 50,
        reverbRoomSize: -1,
      );
      final v = wild.validated();
      expect(v.pitchSemitones, 12);
      expect(v.speed, 0.5);
      expect(v.eqGains, hasLength(10));
      expect(v.eqGains.take(3), [12, -12, 3.3]);
      expect(v.eqGains.skip(3), everyElement(0));
      expect(v.bassBoostDb, 0);
      expect(v.reverbMix, 1);
      expect(v.reverbDecay, EffectLimits.reverbDecayMax);
      expect(v.reverbRoomSize, 0);
    });

    test('speed snaps to 0.05 and pitch to 0.1 semitones', () {
      const s = AudioEffectSettings(speed: 1.234, pitchSemitones: 2.46);
      expect(s.validated().speed, 1.25);
      expect(s.validated().pitchSemitones, 2.5);
    });

    test('NaN never gets through', () {
      final v = const AudioEffectSettings(
        speed: double.nan,
        pitchSemitones: double.nan,
      ).validated();
      expect(v.speed.isNaN, isFalse);
      expect(v.pitchSemitones.isNaN, isFalse);
    });
  });

  group('serialisation', () {
    test('settings survive JSON round trips', () {
      final s = AudioEffectSettings(
        pitchSemitones: -2,
        speed: 0.85,
        eqGains: const [1, 2, 3, 4, 5, -1, -2, -3, -4, -5],
        eqPresetId: 'custom',
        bassBoostDb: 3,
        reverbType: ReverbType.cathedral,
        reverbMix: 0.25,
        reverbDecay: 5.5,
        reverbRoomSize: 1,
      ).validated();
      final restored = AudioEffectSettings.fromJson(
        jsonDecode(jsonEncode(s.toJson())),
      );
      expect(restored, s);
    });

    test('old or partial data falls back to safe defaults', () {
      expect(AudioEffectSettings.fromJson(null), AudioEffectSettings.original);
      expect(
        AudioEffectSettings.fromJson('garbage'),
        AudioEffectSettings.original,
      );
      final partial = AudioEffectSettings.fromJson({
        'speed': 1.5,
        'reverbType': 'nope',
      });
      expect(partial.speed, 1.5);
      expect(partial.reverbType, ReverbType.largeRoom);
      expect(partial.eqGains, hasLength(10));
    });
  });

  group('built-in presets', () {
    test('match the specified values', () {
      AudioEffectSettings s(String id) =>
          BuiltInPresets.byId('builtin.$id')!.settings;
      expect(s('original').isOriginal, isTrue);
      expect((s('nightcore').pitchSemitones, s('nightcore').speed), (3, 1.25));
      expect((s('slowed').pitchSemitones, s('slowed').speed), (-2, 0.85));
      final sr = s('slowed_reverb');
      expect(
        (sr.pitchSemitones, sr.speed, sr.bassBoostDb, sr.reverbMix),
        (-2, 0.85, 3, 0.25),
      );
      expect(s('bass_boosted').bassBoostDb, 10);
      final deep = s('deep_atmosphere');
      expect(
        (deep.pitchSemitones, deep.speed, deep.bassBoostDb, deep.reverbMix),
        (-3, 0.9, 4, 0.6),
      );
      final cine = s('cinematic');
      expect(
        (cine.pitchSemitones, cine.speed, cine.bassBoostDb, cine.reverbMix),
        (0, 0.95, 5, 0.35),
      );
    });

    test('ten EQ presets over ten bands', () {
      expect(EqPreset.all.map((p) => p.label), [
        'Flat',
        'Pop',
        'Rock',
        'Electronic',
        'Hip-Hop',
        'Jazz',
        'Classical',
        'Vocal',
        'Acoustic',
        'Cinematic',
      ]);
      for (final p in EqPreset.all) {
        expect(p.gains, hasLength(10));
        expect(p.gains.every((g) => g.abs() <= 12), isTrue);
      }
    });
  });

  group('effect maths', () {
    test('EQ gains interpolate on a log-frequency axis', () {
      const gains = <double>[0, 6, 0, 0, 0, 0, 0, 0, 0, 12];
      expect(EffectMath.eqGainAt(gains, 64), 6);
      expect(EffectMath.eqGainAt(gains, 20), 0); // below first band
      expect(EffectMath.eqGainAt(gains, 20000), 12); // above last band
      // Halfway between 32 and 64 Hz in octaves (~45.25 Hz) is halfway in gain.
      expect(EffectMath.eqGainAt(gains, 32 * math.sqrt2), closeTo(3, 1e-9));
    });

    test('maps onto a device with five bands and clamps to its limits', () {
      final mapped = EffectMath.mapEqToBands(
        const [12, 12, 12, 12, 12, 12, 12, 12, 12, 12],
        const [60, 230, 910, 3600, 14000],
        minDb: -15,
        maxDb: 10,
      );
      expect(mapped, everyElement(10));
    });

    test('bass boost becomes a low shelf on the lowest bands', () {
      final mapped = EffectMath.mapEqToBands(
        AudioEffectSettings.original.eqGains,
        const [60, 230, 910, 3600, 14000],
        minDb: -15,
        maxDb: 15,
        bassBoostDb: 10,
      );
      expect(mapped[0], 10);
      expect(mapped[1], inExclusiveRange(0, 10));
      expect(mapped.skip(2), everyElement(0));
    });

    test('Android BassBoost strength and reverb parameters', () {
      expect(EffectMath.bassStrength(0), 0);
      expect(EffectMath.bassStrength(6), 500);
      expect(EffectMath.bassStrength(12), 1000);
      expect(EffectMath.bassStrength(40), 1000);

      final off = EffectMath.androidReverbParameters(
        AudioEffectSettings.original,
      );
      expect(off['roomLevel'], -9000);
      final hall = EffectMath.androidReverbParameters(
        const AudioEffectSettings(
          reverbType: ReverbType.concertHall,
          reverbMix: 1,
          reverbDecay: 2.4,
          reverbRoomSize: 0.75,
        ),
      );
      expect(hall['decayTimeMs'], 2400);
      expect(hall['roomLevel'], 0);
      expect(hall['density'], 750);
      expect(hall['reverbLevel'], inInclusiveRange(-9000, 2000));
    });

    test('headroom grows with boosts and is zero without them', () {
      expect(EffectMath.headroomDb(AudioEffectSettings.original), 0);
      expect(EffectMath.headroomGain(AudioEffectSettings.original), 1);
      final boosted = EffectMath.headroomDb(
        const AudioEffectSettings(bassBoostDb: 10),
      );
      expect(boosted, lessThan(-5));
      expect(boosted, greaterThanOrEqualTo(-9));
    });
  });

  group('desktop filter chain', () {
    test('untouched audio has no filters', () {
      expect(MpvFilterChain.build(AudioEffectSettings.original), '');
    });

    test('pitch resamples then time-stretches back to the same tempo', () {
      final chain = MpvFilterChain.build(
        const AudioEffectSettings(pitchSemitones: 12),
      );
      expect(chain, startsWith('lavfi=['));
      expect(chain, contains('asetrate=96000'));
      expect(chain, contains('atempo=0.5'));
      expect(
        chain,
        isNot(contains('alimiter')),
        reason: 'no boost, no limiter',
      );
    });

    test('EQ, bass and reverb add filters plus headroom and a limiter', () {
      final chain = MpvFilterChain.build(
        const AudioEffectSettings(
          eqGains: [0, 0, 0, 0, 0, 0, 0, 6, 0, 0],
          bassBoostDb: 6,
          reverbMix: 0.5,
        ),
      );
      expect(chain, contains('equalizer=f=4000:t=o:w=1:g=6'));
      expect(chain, contains('bass=g=6'));
      expect(chain, contains('aecho='));
      expect(chain, contains('volume=-'));
      expect(chain, endsWith('alimiter=limit=0.95:level=0]'));
    });

    test('speed is not part of the chain (the player keeps pitch itself)', () {
      expect(MpvFilterChain.build(const AudioEffectSettings(speed: 1.5)), '');
    });
  });

  group('capabilities', () {
    test('speed-only platforms report what is missing', () async {
      final processor = SpeedOnlyAudioProcessor();
      final caps = processor.capabilities;
      expect(caps.speed, isTrue);
      expect(caps.pitch || caps.equalizer || caps.bass || caps.reverb, isFalse);
      expect(caps.pitchNote, isNotNull);
      expect(processor.handlesPitch, isFalse);
    });

    test('desktop exposes the ten reference bands and owns pitch', () {
      final processor = MpvAudioProcessor();
      expect(processor.capabilities.equalizerBands, referenceEqBands);
      expect(processor.capabilities.bassUnit, BassUnit.decibels);
      expect(processor.handlesPitch, isTrue);
    });
  });
}
