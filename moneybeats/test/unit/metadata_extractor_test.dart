import 'package:flutter_test/flutter_test.dart';
import 'package:moneybeats/services/import_service.dart';

import '../helpers/fakes.dart';

void main() {
  group('extractSync with real MP3 files', () {
    test('reads ID3 tags and embedded JPEG artwork', () {
      final meta = MetadataExtractor.extractSync(
        fixturePath('tagged_with_art.mp3'),
        originalFileName: 'tagged_with_art.mp3',
      );
      expect(meta.title, 'Midnight Drive');
      expect(meta.artist, 'Neon Coast');
      expect(meta.album, 'City Lights');
      expect(meta.trackNumber, 2);
      expect(meta.year, 2024);
      expect(meta.genre, 'Synthwave');
      expect(meta.duration.inMilliseconds, closeTo(3030, 150));
      expect(meta.artworkBytes, isNotNull);
      expect(meta.artworkBytes!.length, greaterThan(1000));
      expect(meta.artworkExtension, 'jpg');
    });

    test('reads PNG artwork', () {
      final meta = MetadataExtractor.extractSync(
        fixturePath('tagged_png_art.mp3'),
        originalFileName: 'tagged_png_art.mp3',
      );
      expect(meta.title, 'Aurora');
      expect(meta.artworkExtension, 'png');
    });

    test('untagged files fall back to the file name', () {
      final meta = MetadataExtractor.extractSync(
        fixturePath('Sunny Hills - Morning Walk.mp3'),
        originalFileName: 'Sunny Hills - Morning Walk.mp3',
      );
      expect(meta.title, 'Morning Walk');
      expect(meta.artist, 'Sunny Hills');
      expect(meta.album, isNull);
      expect(meta.artworkBytes, isNull);
      expect(meta.duration.inMilliseconds, closeTo(2037, 200));
    });

    test('runs on a background isolate', () async {
      final meta = await MetadataExtractor.extract(
        fixturePath('tagged_with_art.mp3'),
        originalFileName: 'tagged_with_art.mp3',
      );
      expect(meta.title, 'Midnight Drive');
    });
  });

  group('fromFileName', () {
    test('splits "Artist - Title"', () {
      final meta = MetadataExtractor.fromFileName(
        'Neon Coast - Midnight Drive.mp3',
      );
      expect(meta.artist, 'Neon Coast');
      expect(meta.title, 'Midnight Drive');
    });

    test('drops leading track numbers and underscores', () {
      final meta = MetadataExtractor.fromFileName('07 - my_favourite_song.mp3');
      expect(meta.title, 'my favourite song');
      expect(meta.artist, isNull);
    });

    test('keeps extra dashes in the title', () {
      final meta = MetadataExtractor.fromFileName('Band - Song - Live.mp3');
      expect(meta.artist, 'Band');
      expect(meta.title, 'Song - Live');
    });
  });
}
