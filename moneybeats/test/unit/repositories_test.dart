import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:moneybeats/data/database/app_database.dart';
import 'package:moneybeats/data/repositories/settings_repository.dart';
import 'package:moneybeats/data/repositories/track_repository.dart';
import 'package:moneybeats/services/import/audio_file_picker.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';

import '../helpers/fakes.dart';
import '../helpers/test_env.dart';

void main() {
  late TestEnv env;

  setUp(() async => env = await TestEnv.create());
  tearDown(() async => env.dispose());

  Future<String> importFixture(String name) async {
    final track = await env.importer.importOne(
      FileImportSource(File(fixturePath(name))),
    );
    return track!.id;
  }

  group('TrackRepository', () {
    test('favorites, plays and durations are saved', () async {
      final id = await importFixture('tagged_with_art.mp3');

      await env.tracks.setFavorite(id, true);
      await env.tracks.markPlayed(id, DateTime(2026, 5, 1, 12));
      await env.tracks.markPlayed(id, DateTime(2026, 5, 1, 13));
      await env.tracks.updateDuration(id, const Duration(milliseconds: 3030));

      final track = (await env.tracks.getById(id))!;
      expect(track.isFavorite, isTrue);
      expect(track.favoritedAt, isNotNull);
      expect(track.playCount, 2);
      expect(track.lastPlayedAt, DateTime(2026, 5, 1, 13));
      expect(track.duration, const Duration(milliseconds: 3030));

      await env.tracks.setFavorite(id, false);
      expect((await env.tracks.getById(id))!.isFavorite, isFalse);
    });

    test('broadcasts changes', () async {
      final changes = <DataChange>[];
      final sub = env.tracks.changes.listen(changes.add);
      await importFixture('tagged_with_art.mp3');
      await Future<void>.delayed(Duration.zero);
      expect(changes, contains(DataChange.tracks));
      await sub.cancel();
    });

    test('delete removes the row, the files and playlist entries', () async {
      final id = await importFixture('tagged_with_art.mp3');
      final track = (await env.tracks.getById(id))!;
      final playlist = await env.playlists.create('Mix', trackIds: [id]);

      await env.tracks.delete(id);

      expect(await env.tracks.getById(id), isNull);
      expect(File(track.filePath).existsSync(), isFalse);
      expect(File(track.artworkPath!).existsSync(), isFalse);
      final reloaded = (await env.playlists.getAll()).firstWhere(
        (p) => p.id == playlist.id,
      );
      expect(reloaded.trackIds, isEmpty);
    });
  });

  group('PlaylistRepository', () {
    test(
      'create, add (without duplicates), remove, reorder, rename, delete',
      () async {
        final a = await importFixture('tagged_with_art.mp3');
        final b = await importFixture('tagged_png_art.mp3');
        final c = await importFixture('Sunny Hills - Morning Walk.mp3');

        final playlist = await env.playlists.create(
          '  Road trip  ',
          trackIds: [a],
        );
        expect(playlist.name, 'Road trip');

        expect(await env.playlists.addTracks(playlist.id, [b, a, c]), 2);
        var saved = (await env.playlists.getAll()).single;
        expect(saved.trackIds, [a, b, c]);

        await env.playlists.reorder(playlist.id, [c, a, b]);
        saved = (await env.playlists.getAll()).single;
        expect(saved.trackIds, [c, a, b]);

        await env.playlists.removeTrack(playlist.id, a);
        saved = (await env.playlists.getAll()).single;
        expect(saved.trackIds, [c, b]);

        await env.playlists.rename(playlist.id, 'Summer');
        expect((await env.playlists.getAll()).single.name, 'Summer');

        await env.playlists.delete(playlist.id);
        expect(await env.playlists.getAll(), isEmpty);
        expect(
          await env.tracks.getAll(),
          hasLength(3),
          reason: 'songs stay in the library',
        );
      },
    );

    test('empty names get a friendly default', () async {
      final playlist = await env.playlists.create('   ');
      expect(playlist.name, 'My playlist');
    });
  });

  group('SettingsRepository', () {
    test('stores preferences and the playback session', () async {
      await env.settings.setVolume(0.42);
      await env.settings.setShuffle(true);
      await env.settings.setRepeatMode('all');
      await env.settings.setSession(
        const SavedPlaybackSession(
          trackIds: ['a', 'b'],
          index: 1,
          position: Duration(seconds: 42),
        ),
      );

      expect(await env.settings.getVolume(), closeTo(0.42, 0.001));
      expect(await env.settings.getShuffle(), isTrue);
      expect(await env.settings.getRepeatMode(), 'all');
      final session = (await env.settings.getSession())!;
      expect(session.trackIds, ['a', 'b']);
      expect(session.index, 1);
      expect(session.position, const Duration(seconds: 42));
    });
  });

  test('listening sessions add up', () async {
    final id = await importFixture('tagged_with_art.mp3');
    await env.listening.recordSession(
      trackId: id,
      startedAt: DateTime(2026, 5, 1, 10),
      listened: const Duration(seconds: 90),
      completed: false,
    );
    await env.listening.recordSession(
      trackId: id,
      startedAt: DateTime(2026, 5, 2, 10),
      listened: const Duration(seconds: 30),
      completed: true,
    );
    await env.listening.recordSession(
      trackId: id,
      startedAt: DateTime(2026, 5, 2, 11),
      listened: Duration.zero,
      completed: false,
    );
    expect(
      await env.listening.totalListenedSince(DateTime(2026, 5, 1)),
      const Duration(seconds: 120),
    );
    expect(
      await env.listening.totalListenedSince(DateTime(2026, 5, 2)),
      const Duration(seconds: 30),
    );
  });

  test('the library survives closing and reopening the app', () async {
    // Use a real database file, like the app does.
    final dbPath = '${env.tempDir.path}/persist.db';
    final first = await AppDatabase.open(databaseFactoryFfi, dbPath);
    final repo = TrackRepository(first, env.storage);
    await repo.insert(
      makeTrack('kept', filePath: env.storage.musicPath('kept.mp3')),
    );
    await first.close();

    final second = await AppDatabase.open(databaseFactoryFfi, dbPath);
    final reopened = await TrackRepository(second, env.storage).getAll();
    expect(reopened.single.id, 'kept');
    expect(reopened.single.filePath, env.storage.musicPath('kept.mp3'));
    await second.close();
  });
}
