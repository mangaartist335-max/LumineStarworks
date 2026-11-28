import 'dart:async';
import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:just_audio_media_kit/just_audio_media_kit.dart';
import 'package:moneybeats/models/audio_effects.dart';
import 'package:moneybeats/services/platform_audio_processor.dart';

/// Windows and Linux: effects run in libmpv's audio filter chain (FFmpeg
/// filters), owned by MoneyBeats through a small hook in the vendored
/// just_audio_media_kit package.
class MpvAudioProcessor implements PlatformAudioProcessor {
  MpvAudioProcessor();

  static const _all = AudioEffectsCapabilities(
    engine: 'libmpv audio filters',
    speed: true,
    pitch: true,
    equalizer: true,
    equalizerBands: referenceEqBands,
    bass: true,
    bassUnit: BassUnit.decibels,
    reverb: true,
    reverbMix: true,
    reverbDecay: true,
    reverbRoomSize: true,
    reverbNote:
        'Desktop reverb is a multi-tap echo network, lighter than a '
        'studio reverb.',
    waveform: WaveformSource.frameEnvelope,
  );

  AudioEffectsCapabilities _capabilities = _all;
  final _capabilitiesController =
      StreamController<AudioEffectsCapabilities>.broadcast();
  String? _lastChain;

  @override
  AudioEffectsCapabilities get capabilities => _capabilities;

  @override
  Stream<AudioEffectsCapabilities> get capabilitiesStream =>
      _capabilitiesController.stream;

  @override
  bool get handlesPitch => true;

  @override
  Future<void> initialize() async {}

  @override
  Future<void> apply(AudioEffectSettings settings) async {
    final chain = MpvFilterChain.build(settings);
    if (chain == _lastChain) return;
    final ok = await JustAudioMediaKit.setAudioFilters(chain);
    if (ok) {
      _lastChain = chain;
    } else if (chain.isNotEmpty) {
      // This libmpv build lacks the FFmpeg filters we need.
      debugPrint('Audio filters rejected by libmpv: $chain');
      _capabilities = const AudioEffectsCapabilities(
        engine: 'libmpv (no FFmpeg audio filters)',
        speed: true,
        pitchNote: 'This libmpv build has no audio filters.',
        equalizerNote: 'This libmpv build has no audio filters.',
        bassNote: 'This libmpv build has no audio filters.',
        reverbNote: 'This libmpv build has no audio filters.',
      );
      _capabilitiesController.add(_capabilities);
    }
  }

  @override
  Future<void> dispose() async {
    await _capabilitiesController.close();
  }
}

/// Builds the libmpv `af` property for a set of effects.
abstract final class MpvFilterChain {
  /// Internal processing rate for the pitch stage.
  static const sampleRate = 48000;

  static String _n(double v, [int digits = 3]) {
    final s = v.toStringAsFixed(digits);
    return s.contains('.') ? s.replaceFirst(RegExp(r'\.?0+$'), '') : s;
  }

  /// The `af` value, or an empty string for untouched audio.
  static String build(AudioEffectSettings s) {
    final filters = <String>[];

    if (s.hasPitch) {
      // Resample to shift pitch, then time-stretch back to the same tempo.
      final p = s.pitchFactor;
      filters
        ..add('aresample=$sampleRate')
        ..add('asetrate=${(sampleRate * p).round()}')
        ..add('aresample=$sampleRate')
        ..add('atempo=${_n(1 / p, 6)}');
    }

    final headroom = EffectMath.headroomDb(s);
    if (headroom < -0.05) filters.add('volume=${_n(headroom, 2)}dB');

    if (s.hasEq) {
      for (var i = 0; i < referenceEqBands.length; i++) {
        final g = s.eqGains[i];
        if (g.abs() < 0.05) continue;
        filters.add(
          'equalizer=f=${referenceEqBands[i].round()}:t=o:w=1:g=${_n(g, 1)}',
        );
      }
    }

    if (s.hasBass) {
      filters.add('bass=g=${_n(s.bassBoostDb, 1)}:f=100:t=s:w=0.6');
    }

    if (s.hasReverb) filters.addAll(_reverb(s));

    if (s.hasEq || s.hasBass || s.hasReverb) {
      // Output protection: catch any peaks that remain.
      filters.add('alimiter=limit=0.95:level=0');
    }

    return filters.isEmpty ? '' : 'lavfi=[${filters.join(',')}]';
  }

  /// Two echo networks in series: early reflections, then a denser tail.
  /// Tap times scale with room size and decay; tap levels fall off so the
  /// sound drops by 60 dB over the decay time; the mix scales the wet level.
  static List<String> _reverb(AudioEffectSettings s) {
    const early = [0.11, 0.19, 0.27, 0.37, 0.48, 0.61];
    const late = [0.09, 0.17, 0.29, 0.41, 0.55, 0.71, 0.86, 1.0];
    final mix = s.reverbMix.clamp(0.0, 1.0);
    final decayMs = s.reverbDecay * 1000;
    final earlySpan = 25 + 70 * s.reverbRoomSize; // ms
    final lateSpan = (decayMs * 0.35).clamp(120.0, 1800.0);

    double level(double ms) => math.exp(-6.9 * ms / decayMs);

    String stage(List<double> ratios, double span, double wet) {
      final delays = [for (final r in ratios) span * r];
      final decays = [
        for (final d in delays) (level(d) * wet).clamp(0.001, 0.95),
      ];
      final sum = decays.fold<double>(0, (a, b) => a + b);
      final out = (1 / (1 + sum * 0.6)).clamp(0.3, 1.0);
      return 'aecho=1:${_n(out, 3)}:'
          '${delays.map((d) => _n(d, 1)).join('|')}:'
          '${decays.map((d) => _n(d, 3)).join('|')}';
    }

    return [
      stage(early, earlySpan, 0.55 * mix),
      stage(late, lateSpan, 0.45 * mix),
    ];
  }
}
