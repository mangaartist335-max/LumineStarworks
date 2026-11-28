import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:moneybeats/services/import/audio_file_picker.dart';
import 'package:moneybeats/services/import/music_import_service.dart';

import '../helpers/fakes.dart';
import '../helpers/test_env.dart';

void main() {
  late TestEnv env;

  setUp(() async => env = await TestEnv.create());
  tearDown(() async => env.dispose());

  ImportSource fixture(String name) =>
      FileImportSource(File(fixturePath(name)));

  Future<List<String>> storedFiles(Directory dir) async =>
      (await dir.list().toList()).map((e) => e.uri.pathSegments.last).toList();

  test('imports MP3s into app storage with tags and artwork', () async {
    final progress = <String>[];
    final result = await env.importer.importAll([
      fixture('tagged_with_art.mp3'),
      fixture('Sunny Hills - Morning Walk.mp3'),
    ], onProgress: (p) => progress.add('${p.completed}/${p.total}'));

    expect(result.imported, hasLength(2));
    expect(result.failures, isEmpty);
    expect(progress, ['0/2', '1/2', '2/2']);

    final tagged = result.imported.firstWhere(
      (t) => t.title == 'Midnight Drive',
    );
    expect(tagged.artist, 'Neon Coast');
    expect(tagged.album, 'City Lights');
    expect(tagged.duration.inMilliseconds, greaterThan(2800));
    expect(tagged.filePath, startsWith(env.storage.musicDir.path));
    expect(File(tagged.filePath).existsSync(), isTrue);
    expect(
      File(tagged.filePath).lengthSync(),
      File(fixturePath('tagged_with_art.mp3')).lengthSync(),
    );
    expect(tagged.artworkPath, isNotNull);
    expect(File(tagged.artworkPath!).existsSync(), isTrue);

    final untagged = result.imported.firstWhere(
      (t) => t.title == 'Morning Walk',
    );
    expect(untagged.artist, 'Sunny Hills');
    expect(untagged.artworkPath, isNull);

    // Persisted to the database.
    final all = await env.tracks.getAll();
    expect(all.map((t) => t.title).toSet(), {'Midnight Drive', 'Morning Walk'});

    // No temporary files left behind.
    expect(
      (await storedFiles(env.storage.musicDir))
          .where((n) => n.startsWith('.importing')),
      isEmpty,
    );
  });

  test(
    'skips duplicates by content, even with a different file name',
    () async {
      await env.importer.importAll([fixture('tagged_with_art.mp3')]);

      final copy = File('${env.tempDir.path}/renamed copy.mp3');
      await File(fixturePath('tagged_with_art.mp3')).copy(copy.path);
      final result = await env.importer.importAll([FileImportSource(copy)]);

      expect(result.imported, isEmpty);
      expect(result.duplicates, ['renamed copy.mp3']);
      expect(await env.tracks.getAll(), hasLength(1));
      expect(await storedFiles(env.storage.musicDir), hasLength(1));
      expect(result.summary, contains('already in your library'));
    },
  );

  test('rejects files that are not MP3 audio and cleans up', () async {
    final result = await env.importer.importAll([fixture('not_really.mp3')]);
    expect(result.imported, isEmpty);
    expect(
      result.failures.single.reason,
      contains("doesn't look like a valid MP3"),
    );
    expect(await storedFiles(env.storage.musicDir), isEmpty);
    expect(await env.tracks.getAll(), isEmpty);
  });

  test('rejects unsupported extensions', () async {
    final wav = File('${env.tempDir.path}/song.wav')
      ..writeAsBytesSync([1, 2, 3]);
    final result = await env.importer.importAll([FileImportSource(wav)]);
    expect(result.failures.single.reason, contains('Only MP3'));
  });

  test('one bad file does not stop the rest of the batch', () async {
    final result = await env.importer.importAll([
      fixture('not_really.mp3'),
      fixture('tagged_png_art.mp3'),
    ]);
    expect(result.imported.single.title, 'Aurora');
    expect(result.failures, hasLength(1));
    expect(result.summary, "Added \"Aurora\" · 1 file couldn't be imported");
  });

  test('summary reads naturally', () {
    expect(const ImportResult().summary, 'Nothing to import');
    expect(
      ImportResult(
        imported: [makeTrack('1'), makeTrack('2')],
        duplicates: const ['a'],
      ).summary,
      'Added 2 songs · 1 was already in your library',
    );
  });
}
