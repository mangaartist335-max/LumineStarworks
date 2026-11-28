import 'dart:async';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:just_audio/just_audio.dart' show AndroidEqualizer;
import 'package:moneybeats/models/audio_effects.dart';
import 'package:moneybeats/models/track.dart';
import 'package:moneybeats/repositories/app_database.dart';
import 'package:moneybeats/repositories/audio_preset_repository.dart';
import 'package:moneybeats/repositories/track_repository.dart';
import 'package:moneybeats/services/android_audio_processor.dart';
import 'package:moneybeats/services/audio_effects_service.dart';
import 'package:moneybeats/services/import_service.dart';
import 'package:moneybeats/services/listening_tracker.dart';
import 'package:moneybeats/services/platform_audio_processor.dart';
import 'package:moneybeats/services/waveform_service.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';

import '../helpers/fakes.dart';
import '../helpers/test_env.dart';

Future<void> settle() => Future<void>.delayed(const Duration(milliseconds: 30));

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late TestEnv env;
  late AudioPresetRepository presets;

  setUp(() async {
    env = await TestEnv.create();
    presets = AudioPresetRepository(env.database, env.settings);
  });
  tearDown(() async => env.dispose());

  group('AudioPresetRepository', () {
    test(
      'create, rename, duplicate, update and delete custom presets',
      () async {
        final a = await presets.create(
          '  Late night  ',
          const AudioEffectSettings(speed: 0.9),
        );
        expect(a.name, 'Late night');
        expect(a.isBuiltIn, isFalse);

        final renamed = await presets.rename(a.id, 'Late drive');
        expect(renamed!.name, 'Late drive');
        expect(renamed.updatedAt.isBefore(a.createdAt), isFalse);

        final copy = await presets.duplicate(a.id);
        expect(copy!.name, 'Late drive copy');
        expect(copy.settings, a.settings);

        final builtInCopy = await presets.duplicate('builtin.nightcore');
        expect(builtInCopy!.settings.pitchSemitones, 3);
        expect(builtInCopy.isBuiltIn, isFalse);

        await presets.update(
          a.id,
          settings: const AudioEffectSettings(speed: 1.1),
        );
        expect((await presets.getById(a.id))!.settings.speed, 1.1);

        final all = await presets.getAll();
        expect(
          all.take(BuiltInPresets.all.length).every((p) => p.isBuiltIn),
          isTrue,
        );
        expect(all.where((p) => !p.isBuiltIn), hasLength(3));

        await presets.delete(a.id);
        expect(await presets.getById(a.id), isNull);
      },
    );

    test('built-in presets cannot be changed or deleted', () async {
      expect(await presets.rename('builtin.original', 'Nope'), isNull);
      await presets.delete('builtin.original');
      expect(await presets.getById('builtin.original'), isNotNull);
    });

    test('per-track presets, default profile and clearing', () async {
      final track = (await env.importer.importOne(_fixture('tone_440.mp3')))!;
      final mine = await presets.create(
        'Mine',
        const AudioEffectSettings(bassBoostDb: 4),
      );

      await presets.assignToTrack(track.id, mine.id);
      expect(await presets.getTrackPreset(track.id), mine.id);
      await presets.setDefaultPresetId(mine.id);
      expect(await presets.getDefaultPresetId(), mine.id);

      // Deleting the preset removes its assignments and default.
      await presets.delete(mine.id);
      expect(await presets.getTrackPreset(track.id), isNull);
      expect(await presets.getDefaultPresetId(), isNull);

      await presets.assignToTrack(track.id, 'builtin.slowed');
      await presets.clearTrackAssignments();
      expect(await presets.getTrackAssignments(), isEmpty);
    });

    test('assignments disappear with the song', () async {
      final track = (await env.importer.importOne(_fixture('tone_440.mp3')))!;
      await presets.assignToTrack(track.id, 'builtin.nightcore');
      await env.tracks.delete(track.id);
      expect(await presets.getTrackAssignments(), isEmpty);
    });

    test('current settings persist', () async {
      const s = AudioEffectSettings(pitchSemitones: -2, reverbMix: 0.3);
      await presets.saveState(s.validated(), null);
      final loaded = await presets.loadState();
      expect(loaded!.settings, s.validated());
      expect(loaded.activePresetId, isNull);
    });
  });

  test('upgrading a Phase 1 (v1) database keeps the library', () async {
    final path = '${env.tempDir.path}/v1.db';
    final v1 = await databaseFactoryFfi.openDatabase(
      path,
      options: OpenDatabaseOptions(
        version: 1,
        onCreate: (db, _) async {
          await db.execute(
            'CREATE TABLE tracks (id TEXT PRIMARY KEY, file_name TEXT NOT NULL, '
            'original_file_name TEXT NOT NULL, title TEXT NOT NULL, artist TEXT, album TEXT, '
            'album_artist TEXT, genre TEXT, track_number INTEGER, year INTEGER, '
            'duration_ms INTEGER NOT NULL DEFAULT 0, artwork_file_name TEXT, '
            'file_size INTEGER NOT NULL DEFAULT 0, content_hash TEXT NOT NULL UNIQUE, '
            'date_added INTEGER NOT NULL, last_played_at INTEGER, '
            'play_count INTEGER NOT NULL DEFAULT 0, is_favorite INTEGER NOT NULL DEFAULT 0, '
            'favorited_at INTEGER)',
          );
          await db.execute(
            'CREATE TABLE listening_sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, '
            'track_id TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE, '
            'started_at INTEGER NOT NULL, listened_ms INTEGER NOT NULL, '
            'completed INTEGER NOT NULL DEFAULT 0)',
          );
          await db.execute(
            'CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)',
          );
          await db.insert('tracks', {
            'id': 'kept',
            'file_name': 'kept.mp3',
            'original_file_name': 'kept.mp3',
            'title': 'Kept Song',
            'content_hash': 'h',
            'date_added': 1,
          });
          await db.insert('settings', {
            'key': 'playback.volume',
            'value': '0.5',
          });
        },
      ),
    );
    await v1.close();

    final upgraded = await AppDatabase.open(databaseFactoryFfi, path);
    final tracks = await TrackRepository(upgraded, env.storage).getAll();
    expect(tracks.single.title, 'Kept Song');
    final volume = await upgraded.db.query(
      'settings',
      where: "key = 'playback.volume'",
    );
    expect(volume.single['value'], '0.5');
    // New Phase 2 tables and column exist.
    await upgraded.db.insert('audio_presets', {
      'id': 'p',
      'name': 'P',
      'settings': '{}',
      'created_at': 1,
      'updated_at': 1,
    });
    await upgraded.db.insert('listening_sessions', {
      'track_id': 'kept',
      'started_at': 1,
      'listened_ms': 1000,
      'media_ms': 850,
    });
    expect(await upgraded.db.getVersion(), AppDatabase.schemaVersion);
    await upgraded.close();
  });

  group('AudioEffectsService', () {
    late FakeAudioPlayerService player;
    late FakeAudioProcessor processor;
    late AudioEffectsService effects;

    Future<AudioEffectsService> start({
      AudioEffectsCapabilities caps = allEffectsCapabilities,
    }) async {
      processor = FakeAudioProcessor(caps: caps);
      final service = AudioEffectsService(
        player: player,
        processor: processor,
        presets: presets,
      );
      await service.initialize();
      await service.flush();
      return service;
    }

    Future<Track> addTrack(String id) async {
      final track = makeTrack(id);
      await env.tracks.insert(track);
      return track;
    }

    setUp(() async {
      player = FakeAudioPlayerService();
      effects = await start();
    });

    tearDown(() async {
      await effects.dispose();
      await player.dispose();
    });

    test('settings reach the engine: speed and pitch on the player, the rest on the processor', () async {
      effects.setSpeed(1.25);
      effects.setPitch(3);
      effects.setBassBoost(6);
      await effects.flush();
      expect(player.speed, 1.25);
      expect(player.pitch, closeTo(pitchFactorForSemitones(3), 1e-9));
      expect(processor.applied.last.bassBoostDb, 6);
      expect(player.effectsGain, lessThan(1), reason: 'headroom for the boost');
      expect(effects.state.activePresetId, isNull, reason: 'edited = custom');
    });

    test('rapid changes coalesce to the latest value', () async {
      for (var i = 1; i <= 20; i++) {
        effects.setSpeed(0.5 + i * 0.05);
      }
      await effects.flush();
      expect(player.speed, 1.5);
      expect(processor.applied.length, lessThan(20));
    });

    test('compare plays the original and keeps the settings', () async {
      effects.applyPreset(BuiltInPresets.byId('builtin.nightcore')!);
      await effects.flush();
      expect(player.speed, 1.25);

      effects.setCompareOriginal(true);
      await effects.flush();
      expect(player.speed, 1.0);
      expect(player.pitch, 1.0);
      expect(processor.applied.last.isOriginal, isTrue);
      expect(effects.state.settings.speed, 1.25, reason: 'settings kept');

      effects.setCompareOriginal(false);
      await effects.flush();
      expect(player.speed, 1.25);
    });

    test('restoring the original sound resets everything', () async {
      effects.applyPreset(BuiltInPresets.byId('builtin.deep_atmosphere')!);
      effects.resetAll();
      await effects.flush();
      expect(effects.state.settings.isOriginal, isTrue);
      expect(effects.state.activePresetId, 'builtin.original');
      expect(player.speed, 1.0);
      expect(processor.applied.last.isOriginal, isTrue);
    });

    test('effects the device cannot apply are never sent', () async {
      await effects.dispose();
      effects = await start(caps: SpeedOnlyAudioProcessor().capabilities);
      effects.setPitch(5);
      effects.setBassBoost(10);
      effects.setReverbMix(0.5);
      await effects.flush();
      expect(player.pitch, 1.0);
      expect(processor.applied.last.pitchSemitones, 0);
      expect(processor.applied.last.bassBoostDb, 0);
      expect(processor.applied.last.reverbMix, 0);
      expect(
        effects.state.settings.pitchSemitones,
        5,
        reason: 'kept for capable devices',
      );
    });

    test('capability changes are picked up live', () async {
      processor.setCapabilities(SpeedOnlyAudioProcessor().capabilities);
      await settle();
      expect(effects.state.capabilities.equalizer, isFalse);
    });

    test('settings survive a restart', () async {
      effects.setPitch(-2);
      effects.setReverbMix(0.4);
      await effects.persistNow();
      await effects.dispose();

      effects = await start();
      expect(effects.state.settings.pitchSemitones, -2);
      expect(effects.state.settings.reverbMix, 0.4);
      expect(player.pitch, closeTo(pitchFactorForSemitones(-2), 1e-9));
    });

    test('the default sound profile is used at startup', () async {
      final mine = await effects.saveAsPreset('Mine');
      await effects.setDefaultPreset(BuiltInPresets.byId('builtin.cinematic'));
      effects.setSpeed(1.5); // a later tweak...
      await effects.persistNow();
      await effects.dispose();

      effects = await start();
      expect(effects.state.activePresetId, 'builtin.cinematic');
      expect(effects.state.settings.speed, 0.95);
      expect(effects.state.defaultPresetId, 'builtin.cinematic');
      expect(mine.isBuiltIn, isFalse);
    });

    test('a song preset applies while that song plays, then the global sound returns', () async {
      final a = await addTrack('a'), b = await addTrack('b');
      final c = await addTrack('c');
      effects.setSpeed(1.1); // global sound
      await effects.flush();

      await player.playTracks([a, b, c]);
      await settle();
      await effects.assignPresetToTrack(
        'b',
        BuiltInPresets.byId('builtin.nightcore'),
      );

      await player.skipToNext(); // -> b
      await settle();
      await effects.flush();
      expect(effects.state.trackPresetId, 'builtin.nightcore');
      expect(player.speed, 1.25);

      await player.skipToNext(); // -> c
      await settle();
      await effects.flush();
      expect(effects.state.trackPresetId, isNull);
      expect(player.speed, 1.1);
    });

    test('apply to all songs clears song presets', () async {
      await player.playTracks([await addTrack('a')]);
      await settle();
      await effects.assignPresetToCurrentTrack(
        BuiltInPresets.byId('builtin.slowed'),
      );
      expect(await presets.getTrackAssignments(), isNotEmpty);

      await effects.applyPresetToAllTracks(
        BuiltInPresets.byId('builtin.bass_boosted')!,
      );
      expect(await presets.getTrackAssignments(), isEmpty);
      expect(effects.state.settings.bassBoostDb, 10);
      expect(effects.state.trackPresetId, isNull);
    });

    test('saving a preset selects it; editing makes it custom again', () async {
      effects.setSpeed(0.8);
      final saved = await effects.saveAsPreset('Slow drive');
      expect(effects.state.activePresetId, saved.id);
      expect((await presets.getById(saved.id))!.settings.speed, 0.8);
      effects.setSpeed(0.9);
      expect(effects.state.activePresetId, isNull);
    });

    test('device-band EQ edits land exactly on the requested value', () async {
      effects.setEqGainAtFrequency(910, 6);
      expect(
        EffectMath.eqGainAt(effects.state.settings.eqGains, 910),
        closeTo(6, 0.15),
      );
      expect(effects.state.settings.eqPresetId, 'custom');
    });
  });

  group('Android capability detection', () {
    const channel = MethodChannel(AndroidAudioProcessor.channelName);
    final calls = <MethodCall>[];

    setUp(calls.clear);
    tearDown(() {
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
          .setMockMethodCallHandler(channel, null);
    });

    test(
      'native bass boost and reverb are detected and attached to the session',
      () async {
        TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
            .setMockMethodCallHandler(channel, (call) async {
              calls.add(call);
              return switch (call.method) {
                'capabilities' => {
                  'bassBoost': true,
                  'environmentalReverb': true,
                },
                'attach' => {'bassBoost': true, 'environmentalReverb': true},
                _ => null,
              };
            });
        final sessions = StreamController<int?>();
        final processor = AndroidAudioProcessor(
          equalizer: AndroidEqualizer(),
          audioSessionIds: sessions.stream,
        );
        await processor.initialize();
        expect(processor.capabilities.pitch, isTrue);
        expect(processor.capabilities.bass, isTrue);
        expect(processor.capabilities.bassUnit, BassUnit.strength);
        expect(processor.capabilities.reverb, isTrue);
        expect(
          processor.capabilities.equalizerPending,
          isTrue,
          reason: 'bands are reported once audio loads',
        );

        sessions.add(42);
        await settle();
        expect(
          calls.any(
            (c) => c.method == 'attach' && c.arguments['sessionId'] == 42,
          ),
          isTrue,
        );

        await processor.apply(
          const AudioEffectSettings(bassBoostDb: 6, reverbMix: 0.5),
        );
        final bass = calls.lastWhere((c) => c.method == 'setBassBoost');
        expect(bass.arguments['strength'], 500);
        final reverb = calls.lastWhere((c) => c.method == 'setReverb');
        expect(reverb.arguments['enabled'], isTrue);
        expect(reverb.arguments['decayTimeMs'], isA<int>());
        await sessions.close();
      },
    );

    test('devices without the effects get honest notes', () async {
      TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
          .setMockMethodCallHandler(
            channel,
            (call) async => {'bassBoost': false, 'environmentalReverb': false},
          );
      final processor = AndroidAudioProcessor(
        equalizer: AndroidEqualizer(),
        audioSessionIds: const Stream.empty(),
      );
      await processor.initialize();
      expect(processor.capabilities.reverb, isFalse);
      expect(processor.capabilities.reverbNote, contains('no reverb'));
      expect(
        processor.capabilities.bass,
        isFalse,
        reason: 'no BassBoost and no EQ yet',
      );
    });
  });

  group('waveforms', () {
    test('MP3 frame loudness follows the real audio', () {
      final bursts = WaveformMath.bucketMax(
        Mp3Envelope.granuleLevels(
          File(fixturePath('tone_bursts.mp3')).readAsBytesSync(),
        ),
        60,
      );
      final sorted = List<double>.of(bursts)..sort();
      final loud = sorted[(sorted.length * 0.9).floor()];
      final quiet = sorted[(sorted.length * 0.1).floor()];
      expect(
        quiet,
        lessThan(loud * 0.1),
        reason: 'gaps between bursts are quiet',
      );

      final steady = WaveformMath.normalise(
        WaveformMath.bucketMax(
          Mp3Envelope.granuleLevels(
            File(fixturePath('tone_440.mp3')).readAsBytesSync(),
          ),
          60,
        ),
      );
      final middle = steady.sublist(5, 55);
      final spread =
          middle.reduce((a, b) => a > b ? a : b) -
          middle.reduce((a, b) => a < b ? a : b);
      expect(spread, lessThan(0.35), reason: 'a steady tone looks steady');
    });

    test('normalise ignores a single loud spike', () {
      final values = [10.0, ...List.filled(99, 1.0)];
      final n = WaveformMath.normalise(values);
      expect(n.first, 1);
      expect(n[50], 1, reason: 'the 97th percentile is the reference');
    });

    test('extracts once, caches to disk and reloads from the cache', () async {
      var calls = 0;
      final extractor = _CountingExtractor(() => calls++);
      final service = WaveformService(
        storage: env.storage,
        primary: extractor,
        buckets: 32,
      );
      final path = fixturePath('tone_bursts.mp3');

      final results = await Future.wait([
        service.load('t1', path),
        service.load('t1', path),
      ]);
      expect(results.every((r) => r != null && r.peaks.length == 32), isTrue);
      expect(calls, 1, reason: 'concurrent loads share one extraction');
      expect(File(env.storage.waveformPath('t1')).existsSync(), isTrue);

      final fresh = WaveformService(
        storage: env.storage,
        primary: extractor,
        buckets: 32,
      );
      final cached = await fresh.load('t1', path);
      expect(cached!.peaks, hasLength(32));
      for (var i = 0; i < 32; i++) {
        expect(cached.peaks[i], closeTo(results.first!.peaks[i], 0.001));
      }
      expect(calls, 1, reason: 'second app run reads the cache');
    });
  });

  test(
    'listening tracker records media time separately from real time',
    () async {
      final player = FakeAudioPlayerService();
      final track = (await env.importer.importOne(_fixture('tone_440.mp3')))!;
      var now = DateTime(2026, 6, 1, 12);
      final tracker = ListeningTracker(
        player: player,
        tracks: env.tracks,
        listening: env.listening,
        clock: () => now,
      )..start();

      await player.playTracks([track]);
      await settle();
      // 4 s of real time at 1.5x covers 6 s of the song, in small steps.
      for (var ms = 0; ms <= 6000; ms += 500) {
        player.emitPosition(Duration(milliseconds: ms));
        await settle();
      }
      player.emitPosition(const Duration(seconds: 40)); // a seek: not listening
      await settle();
      now = now.add(const Duration(seconds: 4));
      await player.pause();
      await settle();

      expect(
        await env.listening.totalListenedSince(DateTime(2026)),
        const Duration(seconds: 4),
      );
      expect(
        await env.listening.totalMediaSince(DateTime(2026)),
        const Duration(seconds: 6),
      );
      await tracker.dispose();
      await player.dispose();
    },
  );
}

class _CountingExtractor implements WaveformExtractor {
  _CountingExtractor(this.onExtract);
  final void Function() onExtract;

  @override
  WaveformSource get source => WaveformSource.frameEnvelope;

  @override
  Future<List<double>?> extract(
    String audioPath, {
    required int buckets,
  }) async {
    onExtract();
    await Future<void>.delayed(const Duration(milliseconds: 20));
    return const Mp3EnvelopeExtractor().extract(audioPath, buckets: buckets);
  }
}

FileImportSource _fixture(String name) =>
    FileImportSource(File(fixturePath(name)));
