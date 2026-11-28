// On-device tests with the real audio engine and real MP3 files.
//
// Run on a desktop or phone, for example:
//   flutter test integration_test -d linux
//   flutter test integration_test -d <android-device-id> \
//     --dart-define=MB_FIXTURES=/sdcard/Download/moneybeats_fixtures
//
// MB_FIXTURES points at a folder containing the MP3s from test/fixtures.
import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:material_ui/material_ui.dart';
import 'package:moneybeats/core/providers.dart';
import 'package:moneybeats/core/utilities/platform_capabilities.dart';
import 'package:moneybeats/features/player/now_playing_screen.dart';
import 'package:moneybeats/main.dart';
import 'package:moneybeats/models/playback.dart';
import 'package:moneybeats/models/track.dart';
import 'package:moneybeats/repositories/app_database.dart';
import 'package:moneybeats/repositories/track_repository.dart';
import 'package:moneybeats/services/audio_service.dart';
import 'package:moneybeats/services/import_service.dart';
import 'package:moneybeats/services/storage_service.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';

const _fixturesDefine = String.fromEnvironment('MB_FIXTURES');

String get _fixturesDir => _fixturesDefine.isNotEmpty
    ? _fixturesDefine
    : '${Directory.current.path}/test/fixtures';

Future<void> _waitFor(
  String what,
  bool Function() condition, {
  Duration timeout = const Duration(seconds: 10),
}) async {
  final deadline = DateTime.now().add(timeout);
  while (!condition()) {
    if (DateTime.now().isAfter(deadline)) {
      fail('Timed out waiting for: $what');
    }
    await Future<void>.delayed(const Duration(milliseconds: 50));
  }
}

void main() {
  final binding = IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  // Let real time pass between frames so audio plays naturally.
  binding.framePolicy = LiveTestWidgetsFlutterBindingFramePolicy.fullyLive;

  late Directory tempDir;
  late StorageService storage;
  late AppDatabase database;
  late JustAudioPlayerService audio;
  late List<Track> tracks;

  setUpAll(() async {
    final session = await AudioBootstrap.initialize();
    tempDir = await Directory.systemTemp.createTemp('moneybeats_it_');
    storage = StorageService(tempDir);
    await storage.ensureCreated();
    if (PlatformCapabilities.usesSqfliteFfi) sqfliteFfiInit();
    final factory = PlatformCapabilities.usesSqfliteFfi
        ? databaseFactoryFfi
        : databaseFactory;
    database = await AppDatabase.open(factory, storage.databasePath);

    // Import through the real pipeline: copy, hash, tags, artwork, SQLite.
    final importer = MusicImportService(
      tracks: TrackRepository(database, storage),
      storage: storage,
    );
    final result = await importer.importAll([
      for (final name in const [
        'tagged_with_art.mp3',
        'tagged_png_art.mp3',
        'Sunny Hills - Morning Walk.mp3',
      ])
        FileImportSource(File('$_fixturesDir/$name')),
    ]);
    expect(result.failures, isEmpty, reason: result.summary);
    final byTitle = {for (final t in result.imported) t.title: t};
    tracks = [
      byTitle['Midnight Drive']!,
      byTitle['Aurora']!,
      byTitle['Morning Walk']!,
    ];

    audio = JustAudioPlayerService(session: session);
  });

  tearDownAll(() async {
    await audio.dispose();
    await database.close();
    await tempDir.delete(recursive: true);
  });

  testWidgets('every playback control works with real imported MP3s', (
    tester,
  ) async {
    final errors = <String>[];
    final errorSub = audio.errorStream.listen((e) => errors.add(e.message));
    final events = <PlaybackLifecycleEvent>[];
    final lifecycleSub = audio.lifecycleStream.listen(events.add);

    // Play.
    await audio.playTracks(tracks, sourceLabel: 'Test · Real files');
    await _waitFor('playback starts', () => audio.status.isActuallyPlaying);
    expect(audio.queue.currentTrack!.id, tracks[0].id);
    await _waitFor(
      'position advances',
      () => audio.positionState.position > const Duration(milliseconds: 400),
    );

    // Accurate duration from the decoder (fixture is 3.03 s).
    await _waitFor(
      'duration known',
      () => audio.positionState.duration != null,
    );
    expect(audio.positionState.duration!.inMilliseconds, closeTo(3030, 150));

    // Pause holds the position.
    await audio.pause();
    await _waitFor('paused', () => !audio.status.playing);
    final pausedAt = audio.positionState.position;
    await Future<void>.delayed(const Duration(milliseconds: 600));
    expect(
      (audio.positionState.position - pausedAt).inMilliseconds.abs(),
      lessThan(120),
    );

    // Seek while paused, then resume.
    await audio.seek(const Duration(milliseconds: 1500));
    await _waitFor(
      'seeked to 1.5 s',
      () => (audio.positionState.position.inMilliseconds - 1500).abs() < 250,
    );
    await audio.play();
    await _waitFor('resumed', () => audio.status.isActuallyPlaying);

    // Next / previous / jump.
    await audio.skipToNext();
    await _waitFor(
      'moved to track 2',
      () => audio.queue.currentTrack?.id == tracks[1].id,
    );
    await audio.skipToPrevious();
    await _waitFor(
      'back to track 1',
      () => audio.queue.currentTrack?.id == tracks[0].id,
    );
    await audio.skipToQueueIndex(2);
    await _waitFor(
      'jumped to track 3',
      () => audio.queue.currentTrack?.id == tracks[2].id,
    );

    // Previous restarts the song when past the threshold... (track 3 is 2 s,
    // so use the rule from the start instead: at 0 s it goes back).
    await audio.skipToPrevious();
    await _waitFor(
      'previous from track 3',
      () => audio.queue.currentTrack?.id == tracks[1].id,
    );

    // Shuffle: the current song keeps playing, everything stays queued,
    // and turning shuffle off restores the original order.
    final beforeShuffle = [for (final t in audio.queue.tracks) t.id];
    final playingId = audio.queue.currentTrack!.id;
    await audio.setShuffleEnabled(true);
    await _waitFor('shuffle on', () => audio.queue.shuffleEnabled);
    expect(audio.queue.currentTrack!.id, playingId);
    expect({
      audio.queue.currentTrack!.id,
      ...audio.queue.upNext.map((t) => t.id),
    }, beforeShuffle.toSet());
    expect(audio.status.playing, isTrue, reason: 'shuffling never stops music');
    await audio.setShuffleEnabled(false);
    await _waitFor('shuffle off', () => !audio.queue.shuffleEnabled);
    expect([for (final t in audio.queue.tracks) t.id], beforeShuffle);
    expect(audio.queue.currentTrack!.id, playingId);

    // Repeat cycles off -> all -> one -> off.
    await audio.cycleRepeatMode();
    await _waitFor(
      'repeat all',
      () => audio.queue.repeatMode == PlayerRepeatMode.all,
    );
    await audio.cycleRepeatMode();
    await _waitFor(
      'repeat one',
      () => audio.queue.repeatMode == PlayerRepeatMode.one,
    );

    // Repeat one: the song starts again instead of advancing.
    final repeatedId = audio.queue.currentTrack!.id;
    final eventsBeforeLoop = events.length;
    await audio.seek(
      (audio.positionState.duration ?? const Duration(seconds: 2)) -
          const Duration(milliseconds: 300),
    );
    await Future<void>.delayed(const Duration(milliseconds: 1200));
    expect(audio.queue.currentTrack!.id, repeatedId);
    expect(
      audio.positionState.position,
      lessThan(const Duration(milliseconds: 1500)),
    );
    expect(
      events
          .skip(eventsBeforeLoop)
          .where((e) => e.type == PlaybackLifecycleType.trackCompleted)
          .map((e) => e.trackId),
      [repeatedId],
      reason: 'a repeat-one loop counts as finishing the song once',
    );

    await audio.cycleRepeatMode();
    await _waitFor(
      'repeat off',
      () => audio.queue.repeatMode == PlayerRepeatMode.off,
    );

    // Volume.
    await audio.setVolume(0.3);
    await _waitFor('volume 0.3', () => (audio.volume - 0.3).abs() < 0.001);
    await audio.setVolume(1.0);

    // Songs advance on their own when they finish.
    await audio.skipToQueueIndex(0);
    await _waitFor(
      'on track 1',
      () => audio.queue.currentTrack?.id == tracks[0].id,
    );
    await audio.seek(const Duration(milliseconds: 2700));
    await _waitFor(
      'auto-advance to track 2',
      () => audio.queue.currentTrack?.id == tracks[1].id,
    );

    // Queue editing: play next, add to queue, move, remove.
    await audio.playNext([tracks[2]]);
    await _waitFor('play next inserted', () => audio.queue.tracks.length == 4);
    expect(audio.queue.tracks[audio.queue.currentIndex! + 1].id, tracks[2].id);
    await audio.addToQueue([tracks[0]]);
    await _waitFor('added to queue', () => audio.queue.tracks.length == 5);
    expect(audio.queue.tracks.last.id, tracks[0].id);
    await audio.moveInQueue(4, 2);
    await _waitFor('moved', () => audio.queue.tracks[2].id == tracks[0].id);
    await audio.removeFromQueue(4);
    await _waitFor('removed', () => audio.queue.tracks.length == 4);

    // Reaching the end with repeat off completes, and play starts over.
    await audio.skipToQueueIndex(audio.queue.tracks.length - 1);
    await _waitFor(
      'on last track',
      () => audio.queue.currentIndex == audio.queue.tracks.length - 1,
    );
    await audio.seek(
      (audio.positionState.duration ?? const Duration(seconds: 2)) -
          const Duration(milliseconds: 200),
    );
    await _waitFor(
      'queue completes',
      () => audio.status.phase == PlaybackPhase.completed,
    );
    await audio.play();
    await _waitFor(
      'restarted from the top',
      () => audio.queue.currentIndex == 0,
    );
    await _waitFor('playing again', () => audio.status.isActuallyPlaying);

    // Speed is a lifecycle event too (media time vs. real time).
    await audio.setSpeed(1.5);
    await audio.setSpeed(1.0);
    await audio.pause();
    await _waitFor(
      'paused event',
      () => events.last.type == PlaybackLifecycleType.paused,
    );

    // Clearing the queue stops playback.
    for (final t in tracks) {
      await audio.removeTrackEverywhere(t.id);
    }
    await _waitFor('queue cleared', () => audio.queue.tracks.isEmpty);
    await _waitFor(
      'stopped event',
      () => events.any((e) => e.type == PlaybackLifecycleType.stopped),
    );

    // Every lifecycle event fired from the real engine.
    final names = {for (var i = 0; i < tracks.length; i++) tracks[i].id: 't$i'};
    final timeline = events
        .map((e) => '${e.type.name}:${names[e.trackId]}')
        .join(' ');
    final types = events.map((e) => e.type).toSet();
    expect(types, containsAll(PlaybackLifecycleType.values), reason: timeline);
    final firstStart = events.firstWhere(
      (e) => e.type == PlaybackLifecycleType.started,
    );
    expect(firstStart.trackId, tracks[0].id);
    // Auto-advance: track 1 completes, then track 2 changes in and starts.
    final advance = events.indexWhere(
      (e) =>
          e.type == PlaybackLifecycleType.trackCompleted &&
          e.trackId == tracks[0].id,
    );
    expect(advance, isNot(-1), reason: 'auto-advance completes the song');
    expect(events[advance + 1].type, PlaybackLifecycleType.trackChanged);
    expect(events[advance + 1].trackId, tracks[1].id);
    // Queue edits (shuffle rebuilds, removals) never count as finishing.
    final completions = events
        .where((e) => e.type == PlaybackLifecycleType.trackCompleted)
        .length;
    expect(
      completions,
      3,
      reason: 'repeat-one loop, auto-advance, queue end: $timeline',
    );
    // Skipping while playing starts the next song.
    expect(
      events.where((e) => e.type == PlaybackLifecycleType.started).length,
      greaterThan(4),
    );
    expect(
      events
          .where((e) => e.type == PlaybackLifecycleType.speedChanged)
          .first
          .speed,
      1.5,
    );

    expect(errors, isEmpty);
    await errorSub.cancel();
    await lifecycleSub.cancel();
  });

  testWidgets('the full app plays imported music from the library', (
    tester,
  ) async {
    await audio.pause();
    await tester.pumpWidget(
      ProviderScope(
        retry: (_, _) => null,
        overrides: [
          appDatabaseProvider.overrideWithValue(database),
          storageServiceProvider.overrideWithValue(storage),
          audioPlayerServiceProvider.overrideWithValue(audio),
        ],
        child: const MoneyBeatsApp(),
      ),
    );
    await tester.pump(const Duration(seconds: 1));

    await tester.tap(find.text('Library').first);
    await tester.pump(const Duration(milliseconds: 600));
    await tester.tap(find.text('Aurora').last);
    await tester.pump(const Duration(milliseconds: 300));

    await _waitFor('Aurora is playing', () {
      return audio.queue.currentTrack?.title == 'Aurora' &&
          audio.status.isActuallyPlaying;
    });
    await tester.pump(const Duration(milliseconds: 500));

    // Open Now Playing from the player and use its controls.
    await tester.tap(find.text('Polar Echo').last);
    await tester.pump(const Duration(milliseconds: 800));
    expect(find.byType(NowPlayingScreen), findsOneWidget);

    // Repeat all, so Next always has somewhere to go whatever the order.
    await audio.setRepeatMode(PlayerRepeatMode.all);
    final before = audio.queue.currentTrack!.id;
    await tester.tap(find.byTooltip('Next').last);
    await _waitFor('next song', () => audio.queue.currentTrack!.id != before);
    await tester.pump(const Duration(milliseconds: 500));

    await tester.tap(find.byTooltip('Pause').last);
    await _waitFor('paused from the UI', () => !audio.status.playing);
    await tester.pump(const Duration(milliseconds: 300));
    await tester.tap(find.byTooltip('Play').last);
    await _waitFor('playing from the UI', () => audio.status.isActuallyPlaying);
    await tester.pump(const Duration(milliseconds: 300));

    await audio.pause();
    await audio.setRepeatMode(PlayerRepeatMode.off);
    await tester.pump(const Duration(milliseconds: 300));
    await tester.pumpWidget(const SizedBox());
  });
}
