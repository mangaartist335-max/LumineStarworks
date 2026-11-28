// Verifies that Studio effects really change the sound, on the desktop
// (libmpv) engine: plays generated test tones, records the actual audio
// output from PulseAudio and measures it.
//
// Needs a PulseAudio sink to record from (`parec`). Run with:
//   flutter test integration_test/studio_audio_test.dart -d linux \
//     --dart-define=MB_FIXTURES=$PWD/test/fixtures \
//     --dart-define=MB_MONITOR=<sink>.monitor
import 'dart:io';
import 'dart:math' as math;
import 'dart:typed_data';

import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:moneybeats/models/audio_effects.dart';
import 'package:moneybeats/models/track.dart';
import 'package:moneybeats/repositories/app_database.dart';
import 'package:moneybeats/repositories/audio_preset_repository.dart';
import 'package:moneybeats/repositories/settings_repository.dart';
import 'package:moneybeats/repositories/track_repository.dart';
import 'package:moneybeats/services/audio_effects_service.dart';
import 'package:moneybeats/services/audio_service.dart';
import 'package:moneybeats/services/import_service.dart';
import 'package:moneybeats/services/mpv_audio_processor.dart';
import 'package:moneybeats/services/storage_service.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';

const _fixturesDefine = String.fromEnvironment('MB_FIXTURES');
const _monitor = String.fromEnvironment(
  'MB_MONITOR',
  defaultValue: 'moneybeats_null.monitor',
);
const _rate = 48000;

String get _fixtures => _fixturesDefine.isNotEmpty
    ? _fixturesDefine
    : '${Directory.current.path}/test/fixtures';

/// Records mono 16-bit PCM from the PulseAudio monitor.
Future<Float64List> record(Duration length) async {
  final process = await Process.start('parec', [
    '-d',
    _monitor,
    '--format=s16le',
    '--rate=$_rate',
    '--channels=1',
    '--raw',
    '--latency-msec=20',
  ]);
  final bytes = BytesBuilder();
  final sub = process.stdout.listen(bytes.add);
  await Future<void>.delayed(length);
  process.kill();
  await sub.cancel();
  final data = bytes.takeBytes();
  final view = ByteData.sublistView(Uint8List.fromList(data));
  return Float64List.fromList([
    for (var i = 0; i + 1 < data.length; i += 2)
      view.getInt16(i, Endian.little) / 32768.0,
  ]);
}

/// Signal power at [frequency] (Goertzel algorithm).
double power(Float64List x, double frequency) {
  final w = 2 * math.pi * frequency / _rate;
  final coeff = 2 * math.cos(w);
  var s1 = 0.0, s2 = 0.0;
  for (final v in x) {
    final s0 = v + coeff * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  return (s1 * s1 + s2 * s2 - coeff * s1 * s2) / (x.length * x.length);
}

/// The strongest frequency between [lo] and [hi] Hz.
double dominant(Float64List x, double lo, double hi) {
  var best = lo, bestPower = -1.0;
  for (var f = lo; f <= hi; f += 1) {
    final p = power(x, f);
    if (p > bestPower) {
      bestPower = p;
      best = f;
    }
  }
  return best;
}

double db(double ratio) => 10 * math.log(ratio) / math.ln10;

double rms(Float64List x) =>
    math.sqrt(x.fold<double>(0, (a, v) => a + v * v) / math.max(1, x.length));

/// The middle part of a recording (skips start-up and filter changes).
Float64List middle(Float64List x, {double from = 0.35, double to = 0.95}) =>
    Float64List.sublistView(x, (x.length * from).round(), (x.length * to).round());

/// Energy left in the gaps between bursts relative to the bursts, in dB.
/// Dry audio is silent between bursts; reverb fills the gaps with a tail.
/// Alignment-free: compares the quietest half of 5 ms windows with the
/// loudest 30%.
double gapLevelDb(Float64List x) {
  const window = _rate ~/ 200;
  final env = <double>[
    for (var i = 0; i + window <= x.length; i += window)
      rms(Float64List.sublistView(x, i, i + window)),
  ]..sort();
  final quiet = env.sublist(0, env.length ~/ 2);
  final loud = env.sublist((env.length * 0.7).round());
  final quietLevel = quiet.fold<double>(0, (a, b) => a + b) / quiet.length;
  final loudLevel = loud[loud.length ~/ 2];
  return 20 * math.log(math.max(quietLevel, 1e-6) / loudLevel) / math.ln10;
}

/// Median time between burst onsets (rises through half the peak level).
double burstPeriodMs(Float64List x) {
  const window = _rate ~/ 200; // 5 ms
  final env = <double>[
    for (var i = 0; i + window <= x.length; i += window)
      rms(Float64List.sublistView(x, i, i + window)),
  ];
  final peak = env.fold<double>(0, math.max);
  final onsets = <int>[];
  for (var i = 1; i < env.length; i++) {
    if (env[i - 1] < peak * 0.5 && env[i] >= peak * 0.5) onsets.add(i);
  }
  final gaps = [
    for (var i = 1; i < onsets.length; i++) (onsets[i] - onsets[i - 1]) * 5.0,
  ]..sort();
  return gaps.isEmpty ? 0 : gaps[gaps.length ~/ 2];
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  late Directory tempDir;
  late AppDatabase database;
  late JustAudioPlayerService audio;
  late AudioEffectsService effects;
  late MpvAudioProcessor processor;
  late Map<String, Track> tracks;

  setUpAll(() async {
    final session = await AudioBootstrap.initialize();
    tempDir = await Directory.systemTemp.createTemp('moneybeats_studio_');
    final storage = StorageService(tempDir);
    await storage.ensureCreated();
    sqfliteFfiInit();
    database = await AppDatabase.open(databaseFactoryFfi, storage.databasePath);
    final trackRepo = TrackRepository(database, storage);
    final importer = MusicImportService(tracks: trackRepo, storage: storage);
    final result = await importer.importAll([
      for (final name in ['tone_440.mp3', 'two_tone.mp3', 'tone_bursts.mp3'])
        FileImportSource(File('$_fixtures/$name')),
    ]);
    expect(result.failures, isEmpty, reason: result.summary);
    tracks = {for (final t in result.imported) t.title: t};

    audio = JustAudioPlayerService(session: session);
    processor = MpvAudioProcessor();
    effects = AudioEffectsService(
      player: audio,
      processor: processor,
      presets: AudioPresetRepository(database, SettingsRepository(database)),
    );
    await effects.initialize();
  });

  tearDownAll(() async {
    await audio.pause();
    await effects.dispose();
    await audio.dispose();
    await database.close();
    await tempDir.delete(recursive: true);
  });

  Future<Float64List> playAndRecord(
    String title,
    AudioEffectSettings settings, {
    Duration length = const Duration(milliseconds: 2600),
  }) async {
    effects.applyPreset(
      AudioPreset(
        id: 'test',
        name: 'test',
        settings: settings.validated(),
        createdAt: DateTime(2026),
        updatedAt: DateTime(2026),
      ),
    );
    await effects.flush();
    await audio.playTracks([tracks[title]!]);
    await Future<void>.delayed(const Duration(milliseconds: 500));
    final samples = await record(length);
    await audio.pause();
    expect(
      processor.capabilities.equalizer,
      isTrue,
      reason: 'libmpv rejected the filter chain: ${MpvFilterChain.build(settings)}',
    );
    return samples;
  }

  testWidgets('pitch, speed, EQ, bass and reverb change the real output', (
    tester,
  ) async {
    final report = _Report();

    // Baseline: the 440 Hz tone comes out at 440 Hz.
    final base = middle(await playAndRecord('Tone 440', AudioEffectSettings.original));
    expect(rms(base), greaterThan(0.01), reason: 'nothing was recorded');
    final baseFreq = dominant(base, 300, 1000);
    report.writeln('original: ${baseFreq.toStringAsFixed(0)} Hz');
    expect(baseFreq, closeTo(440, 4));

    // Pitch +2 st -> 493.9 Hz; -12 st -> 220 Hz.
    final up2 = middle(
      await playAndRecord('Tone 440', const AudioEffectSettings(pitchSemitones: 2)),
    );
    final up2Freq = dominant(up2, 300, 1000);
    report.writeln('pitch +2 st: ${up2Freq.toStringAsFixed(1)} Hz (expected 493.9)');
    expect(up2Freq, closeTo(440 * pitchFactorForSemitones(2), 5));

    final down12 = middle(
      await playAndRecord('Tone 440', const AudioEffectSettings(pitchSemitones: -12)),
    );
    final down12Freq = dominant(down12, 150, 1000);
    report.writeln('pitch -12 st: ${down12Freq.toStringAsFixed(1)} Hz (expected 220)');
    expect(down12Freq, closeTo(220, 4));

    // Speed 1.5x keeps the pitch at 440 Hz and plays faster.
    final fast = middle(
      await playAndRecord('Tone 440', const AudioEffectSettings(speed: 1.5)),
    );
    final fastFreq = dominant(fast, 300, 1000);
    report.writeln('speed 1.5x: ${fastFreq.toStringAsFixed(1)} Hz (pitch kept)');
    expect(fastFreq, closeTo(440, 5));

    // Speed measured from the audio: the burst file has one burst per second.
    final burstsNormal = await playAndRecord(
      'Tone Bursts',
      AudioEffectSettings.original,
      length: const Duration(milliseconds: 3600),
    );
    final burstsFast = await playAndRecord(
      'Tone Bursts',
      const AudioEffectSettings(speed: 1.5),
      length: const Duration(milliseconds: 3600),
    );
    final normalPeriod = burstPeriodMs(burstsNormal);
    final fastPeriod = burstPeriodMs(burstsFast);
    report.writeln('burst spacing: ${normalPeriod.toStringAsFixed(0)} ms at 1.0x, '
        '${fastPeriod.toStringAsFixed(0)} ms at 1.5x (expected 1000 / 667)');
    expect(normalPeriod, closeTo(1000, 40));
    expect(fastPeriod, closeTo(1000 / 1.5, 40));

    // Speed and pitch together: 0.85x and -2 st -> 392 Hz.
    final slowed = middle(
      await playAndRecord(
        'Tone 440',
        const AudioEffectSettings(speed: 0.85, pitchSemitones: -2),
      ),
    );
    final slowedFreq = dominant(slowed, 300, 1000);
    report.writeln('slowed (0.85x, -2 st): ${slowedFreq.toStringAsFixed(1)} Hz (expected 392)');
    expect(slowedFreq, closeTo(440 * pitchFactorForSemitones(-2), 5));

    // EQ: cut 125 Hz band, boost 4 kHz band -> treble/bass ratio rises.
    final twoBase = middle(await playAndRecord('Two Tone', AudioEffectSettings.original));
    final baseRatio = power(twoBase, 3000) / power(twoBase, 100);
    final eq = middle(
      await playAndRecord(
        'Two Tone',
        const AudioEffectSettings(eqGains: [-12, -12, -12, 0, 0, 0, 6, 12, 6, 0]),
      ),
    );
    final eqRatio = power(eq, 3000) / power(eq, 100);
    final eqChange = db(eqRatio / baseRatio);
    report.writeln('EQ treble vs bass: +${eqChange.toStringAsFixed(1)} dB');
    expect(eqChange, greaterThan(15));

    // Bass boost +12 dB -> bass/treble ratio rises.
    final bass = middle(
      await playAndRecord('Two Tone', const AudioEffectSettings(bassBoostDb: 12)),
    );
    final bassChange = db((power(bass, 100) / power(bass, 3000)) / (1 / baseRatio));
    report.writeln('bass boost +12 dB: bass vs treble +${bassChange.toStringAsFixed(1)} dB');
    expect(bassChange, greaterThan(8));

    // Headroom/limiter: big boosts never clip.
    final peak = eq.fold<double>(0, (m, v) => math.max(m, v.abs()));
    report.writeln('peak with EQ boost: ${(peak * 100).toStringAsFixed(0)}% of full scale');
    expect(peak, lessThan(0.99));

    // Reverb: burst tails get much longer.
    final dry = await playAndRecord(
      'Tone Bursts',
      AudioEffectSettings.original,
      length: const Duration(milliseconds: 3200),
    );
    final wet = await playAndRecord(
      'Tone Bursts',
      AudioEffectSettings(
        reverbType: ReverbType.concertHall,
        reverbMix: 0.8,
        reverbDecay: 2.4,
        reverbRoomSize: 0.75,
      ),
      length: const Duration(milliseconds: 3200),
    );
    final dryGap = gapLevelDb(dry), wetGap = gapLevelDb(wet);
    final loudness = db(rms(wet) * rms(wet) / (rms(dry) * rms(dry)));
    report.writeln('reverb: level between bursts ${dryGap.toStringAsFixed(0)} dB dry, '
        '${wetGap.toStringAsFixed(0)} dB wet; overall loudness '
        '${loudness.toStringAsFixed(1)} dB vs dry');
    expect(wetGap, greaterThan(dryGap + 20));
    expect(wetGap, greaterThan(-35));
    // A pure tone through echoes comb-filters; music loses less.
    expect(loudness, greaterThan(-12));

    // Compare original: settings kept, original sound plays.
    effects.applyPreset(
      AudioPreset(
        id: 'cmp',
        name: 'cmp',
        settings: const AudioEffectSettings(pitchSemitones: 5),
        createdAt: DateTime(2026),
        updatedAt: DateTime(2026),
      ),
    );
    effects.setCompareOriginal(true);
    await effects.flush();
    await audio.playTracks([tracks['Tone 440']!]);
    await Future<void>.delayed(const Duration(milliseconds: 500));
    final compared = middle(await record(const Duration(milliseconds: 2400)));
    await audio.pause();
    final comparedFreq = dominant(compared, 300, 1000);
    report.writeln('compare original (pitch +5 kept): ${comparedFreq.toStringAsFixed(1)} Hz');
    expect(comparedFreq, closeTo(440, 4));
    expect(effects.state.settings.pitchSemitones, 5);

    report.writeln('ALL STUDIO AUDIO CHECKS PASSED');
  });
}

/// Prints each measurement as it is taken.
class _Report {
  void writeln(String line) {
    // ignore: avoid_print
    print('STUDIO AUDIO: $line');
  }
}
