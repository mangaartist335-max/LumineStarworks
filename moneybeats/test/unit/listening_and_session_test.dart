import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:moneybeats/data/repositories/settings_repository.dart';
import 'package:moneybeats/services/audio/listening_tracker.dart';
import 'package:moneybeats/services/audio/playback_models.dart';
import 'package:moneybeats/services/audio/playback_session_keeper.dart';
import 'package:moneybeats/services/import/audio_file_picker.dart';

import '../helpers/fakes.dart';
import '../helpers/test_env.dart';

Future<void> settle() => Future<void>.delayed(const Duration(milliseconds: 20));

void main() {
  late TestEnv env;
  late FakeAudioPlayerService player;

  setUp(() async {
    env = await TestEnv.create();
    player = FakeAudioPlayerService();
  });

  tearDown(() async {
    await player.dispose();
    await env.dispose();
  });

  Future<List<String>> importAll() async {
    final ids = <String>[];
    for (final name in ['tagged_with_art.mp3', 'tagged_png_art.mp3']) {
      ids.add(
        (await env.importer.importOne(
          FileImportSource(File(fixturePath(name))),
        ))!.id,
      );
    }
    return ids;
  }

  test(
    'ListeningTracker counts plays and records only time actually played',
    () async {
      final ids = await importAll();
      final tracks = await env.tracks.getAll();
      var now = DateTime(2026, 6, 1, 12, 0, 0);
      final tracker = ListeningTracker(
        player: player,
        tracks: env.tracks,
        listening: env.listening,
        clock: () => now,
      )..start();

      final ordered = [
        for (final id in ids) tracks.firstWhere((t) => t.id == id),
      ];
      await player.playTracks(ordered); // status: playing + ready
      await settle();

      // Recently played / play count is recorded as soon as sound starts.
      expect((await env.tracks.getById(ids[0]))!.playCount, 1);
      expect((await env.tracks.getById(ids[0]))!.lastPlayedAt, now);

      // 40 seconds of playback, then pause.
      now = now.add(const Duration(seconds: 40));
      await player.pause();
      await settle();

      // Paused time does not count.
      now = now.add(const Duration(minutes: 5));
      await player.play();
      await settle();
      now = now.add(const Duration(seconds: 20));

      // Changing track closes the session for the first song.
      await player.skipToNext();
      await settle();

      expect(
        await env.listening.totalListenedSince(DateTime(2026, 6, 1)),
        const Duration(seconds: 60),
      );
      expect((await env.tracks.getById(ids[1]))!.playCount, 1);

      await tracker.dispose();
    },
  );

  test(
    'PlaybackSessionKeeper restores the queue, position and preferences',
    () async {
      final ids = await importAll();
      final library = await env.tracks.getAll();
      await env.settings.setVolume(0.35);
      await env.settings.setRepeatMode('one');
      await env.settings.setShuffle(true);
      await env.settings.setSession(
        SavedPlaybackSession(
          trackIds: [ids[0], 'deleted-song', ids[1]],
          index: 2,
          position: const Duration(seconds: 12),
        ),
      );

      final keeper = PlaybackSessionKeeper(
        player: player,
        settings: env.settings,
      );
      await keeper.restore(library);

      expect(player.volume, closeTo(0.35, 0.001));
      expect(player.queue.repeatMode, PlayerRepeatMode.one);
      expect(player.queue.shuffleEnabled, isTrue);
      // The missing song is skipped, and the index follows the right track.
      expect(player.queue.tracks.map((t) => t.id), [ids[0], ids[1]]);
      expect(player.queue.currentTrack!.id, ids[1]);
      expect(player.calls, contains('loadQueue:1:12000'));
      expect(
        player.status.playing,
        isFalse,
        reason: 'restoring never auto-plays',
      );
      await keeper.dispose();
    },
  );

  test('PlaybackSessionKeeper saves the session as you listen', () async {
    final ids = await importAll();
    final library = await env.tracks.getAll();
    final keeper = PlaybackSessionKeeper(player: player, settings: env.settings)
      ..start();

    await player.playTracks(
      library.where((t) => ids.contains(t.id)).toList(),
      startIndex: 1,
    );
    player.emitPosition(const Duration(seconds: 7));
    await player.pause();
    await Future<void>.delayed(const Duration(milliseconds: 800)); // debounce

    final session = (await env.settings.getSession())!;
    expect(session.trackIds, hasLength(2));
    expect(session.index, 1);
    expect(session.position, const Duration(seconds: 7));
    await keeper.dispose();
  });
}
