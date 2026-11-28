import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';
import 'package:moneybeats/app.dart';
import 'package:moneybeats/data/models/track.dart';
import 'package:moneybeats/state/core_providers.dart';
import 'package:moneybeats/state/import_controller.dart';
import 'package:moneybeats/ui/screens/now_playing/now_playing_screen.dart';

import '../helpers/fakes.dart';
import '../helpers/test_env.dart';

class _Harness {
  _Harness(this.env, this.audio, this.picker);
  final TestEnv env;
  final FakeAudioPlayerService audio;
  final FakeAudioFilePicker picker;

  late ProviderContainer container;
}

Future<_Harness> _pumpApp(
  WidgetTester tester, {
  Size size = const Size(420, 900),
  List<Track> seed = const [],
}) async {
  final env = (await tester.runAsync(() async {
    final env = await TestEnv.create(noIsolate: true);
    // Seed before the app starts so test I/O never races the app's queries.
    for (final t in seed) {
      await env.tracks.insert(t);
    }
    return env;
  }))!;
  final audio = FakeAudioPlayerService();
  final picker = FakeAudioFilePicker([
    File(fixturePath('tagged_with_art.mp3')),
    File(fixturePath('Sunny Hills - Morning Walk.mp3')),
  ]);
  addTearDown(() async {
    await tester.runAsync(env.dispose);
  });

  tester.view.physicalSize = size;
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.reset);

  final harness = _Harness(env, audio, picker);
  await tester.pumpWidget(
    ProviderScope(
      retry: (_, _) => null,
      overrides: [
        appDatabaseProvider.overrideWithValue(env.database),
        mediaStorageProvider.overrideWithValue(env.storage),
        audioPlayerServiceProvider.overrideWithValue(audio),
        audioFilePickerProvider.overrideWithValue(picker),
      ],
      child: const MoneyBeatsApp(),
    ),
  );
  harness.container = ProviderScope.containerOf(
    tester.element(find.byType(MoneyBeatsApp)),
  );
  await _settle(tester);
  return harness;
}

/// Pumps a few frames. (Not pumpAndSettle: the playing indicator animates forever.)
Future<void> _settle(WidgetTester tester, [int frames = 6]) async {
  for (var i = 0; i < frames; i++) {
    await tester.pump(const Duration(milliseconds: 100));
  }
}

/// Lets real file I/O (and isolates) progress while also pumping frames,
/// until [done] returns true.
Future<void> _pumpUntil(
  WidgetTester tester,
  bool Function() done, {
  int maxRounds = 200,
}) async {
  for (var i = 0; i < maxRounds && !done(); i++) {
    await tester.runAsync(
      () => Future<void>.delayed(const Duration(milliseconds: 20)),
    );
    await tester.pump(const Duration(milliseconds: 50));
  }
}

/// Runs a widget test, then unmounts the app and lets its final database
/// write (saving the playback session) finish inside the fake clock.
void appTest(
  String description,
  Future<void> Function(WidgetTester tester) body,
) {
  testWidgets(description, (tester) async {
    await body(tester);
    await tester.pumpWidget(const SizedBox());
    for (var i = 0; i < 5; i++) {
      await tester.pump(const Duration(milliseconds: 200));
    }
  });
}

void main() {
  appTest('empty library welcomes the user with an import button', (
    tester,
  ) async {
    await _pumpApp(tester);
    expect(find.text('Your music, beautifully offline'), findsOneWidget);
    expect(find.widgetWithText(FilledButton, 'Import music'), findsOneWidget);
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Wallet'), findsOneWidget);
  });

  appTest('importing real MP3s through the picker fills the library', (
    tester,
  ) async {
    final h = await _pumpApp(tester);

    // Tap the real Import button; the fake picker returns two fixture MP3s.
    await tester.tap(find.widgetWithText(FilledButton, 'Import music'));
    await _pumpUntil(
      tester,
      () => h.container.read(importControllerProvider).lastResult != null,
    );
    final result = h.container.read(importControllerProvider).lastResult!;
    expect(result.imported, hasLength(2));
    expect(h.picker.cleanUps, 1);
    // Let the library reload from the database.
    await _pumpUntil(
      tester,
      () => find.text('Midnight Drive').evaluate().isNotEmpty,
    );
    await _settle(tester);

    // Home now shows the recently added songs with their real tag data.
    expect(find.text('Recently added'), findsWidgets);
    expect(find.text('Midnight Drive'), findsWidgets);
    expect(find.text('Morning Walk'), findsWidgets);

    // Library tab lists them; tapping one starts playback at that song.
    await tester.tap(find.text('Library'));
    await _settle(tester);
    expect(find.text('Your Library'), findsOneWidget);
    await tester.tap(find.text('Midnight Drive').last);
    await _settle(tester);
    expect(h.audio.calls.where((c) => c.startsWith('playTracks:')), isNotEmpty);
    expect(h.audio.queue.currentTrack!.title, 'Midnight Drive');
  });

  appTest('wallet shows a zero balance and a coming-soon message', (
    tester,
  ) async {
    await _pumpApp(tester);
    await tester.tap(find.text('Wallet'));
    await _settle(tester);
    expect(find.byKey(const Key('wallet-balance')), findsOneWidget);
    expect(find.text(r'$0.00'), findsOneWidget);
    expect(find.text('Rewards coming soon'), findsOneWidget);
  });

  appTest('mini player and Now Playing controls drive the audio engine', (
    tester,
  ) async {
    final tracks = [
      makeTrack('a', title: 'Alpha Song', artist: 'Ari'),
      makeTrack('b', title: 'Beta Song', artist: 'Bo'),
      makeTrack('c', title: 'Gamma Song', artist: 'Cy'),
    ];
    final h = await _pumpApp(tester, seed: tracks);
    await h.audio.playTracks(tracks, sourceLabel: 'Album · Test');
    await _settle(tester);

    // Mini player appears with the current song.
    expect(find.text('Alpha Song'), findsWidgets);
    await tester.tap(find.byTooltip('Pause'));
    await _settle(tester);
    expect(h.audio.calls.last, 'pause');

    // Open Now Playing.
    await tester.tap(find.text('Ari').last);
    await _settle(tester, 8);
    expect(find.byType(NowPlayingScreen), findsOneWidget);
    expect(find.text('PLAYING FROM ALBUM'), findsOneWidget);

    await tester.tap(find.byTooltip('Next').last);
    await _settle(tester);
    expect(h.audio.calls.last, 'next');
    expect(find.text('Beta Song'), findsWidgets);

    await tester.tap(find.byTooltip('Previous').last);
    await _settle(tester);
    expect(h.audio.calls.last, 'previous');

    await tester.tap(find.byTooltip('Shuffle off').last);
    await _settle(tester);
    expect(h.audio.calls.last, 'shuffle:true');

    await tester.tap(find.byTooltip('Repeat off').last);
    await _settle(tester);
    expect(h.audio.calls.last, 'repeat:all');

    await tester.tap(find.byTooltip('Mute').last);
    await _settle(tester);
    expect(h.audio.calls.last, 'volume:0.00');

    // Seeking: tap the middle of the seek bar.
    h.audio.emitPosition(
      const Duration(seconds: 10),
      duration: const Duration(minutes: 3),
    );
    await _settle(tester);
    final seekBar = find.byType(Slider).first;
    await tester.tap(seekBar);
    await _settle(tester);
    expect(h.audio.calls.last, startsWith('seek:'));
    final seekMs = int.parse(h.audio.calls.last.split(':').last);
    expect(seekMs, inInclusiveRange(60000, 120000));

    // Queue sheet.
    await tester.tap(find.byTooltip('Queue'));
    await _settle(tester, 8);
    expect(find.text('Now playing'), findsOneWidget);
    expect(find.text('Next up (shuffled)'), findsOneWidget);
  });

  appTest('playlists can be created from the library', (tester) async {
    // Wider phone: the test font makes every chip much wider than Manrope.
    final h = await _pumpApp(
      tester,
      size: const Size(760, 900),
      seed: [makeTrack('a', title: 'Alpha Song')],
    );

    await tester.tap(find.text('Library'));
    await _settle(tester);
    await tester.ensureVisible(find.widgetWithText(ChoiceChip, 'Playlists'));
    await tester.tap(find.widgetWithText(ChoiceChip, 'Playlists'));
    await _settle(tester);
    await tester.tap(find.text('New playlist'));
    await _settle(tester);
    await tester.enterText(find.byType(TextField), 'Sunday Morning');
    await tester.tap(find.widgetWithText(FilledButton, 'Create'));
    await _settle(tester, 10);

    expect(find.text('Sunday Morning'), findsWidgets);
    final saved = await tester.runAsync(() => h.env.playlists.getAll());
    expect(saved!.single.name, 'Sunday Morning');
  });

  appTest('search finds songs by artist', (tester) async {
    await _pumpApp(
      tester,
      seed: [
        makeTrack('a', title: 'Ocean Eyes', artist: 'Blue Lagoon'),
        makeTrack('b', title: 'Desert Road', artist: 'Sandy'),
      ],
    );
    await tester.tap(find.text('Search'));
    await _settle(tester);
    expect(find.text('Browse your library'), findsOneWidget);

    await tester.enterText(find.byType(TextField), 'lagoon');
    await _settle(tester);
    expect(find.text('Ocean Eyes'), findsOneWidget);
    expect(find.text('Desert Road'), findsNothing);
  });

  appTest('desktop layout uses a sidebar and a full-width player bar', (
    tester,
  ) async {
    await _pumpApp(tester, size: const Size(1280, 800));
    expect(find.text('MoneyBeats'), findsOneWidget);
    expect(find.text('Pick a song to start listening'), findsOneWidget);
    expect(find.byType(NavigationBar), findsNothing);
    expect(find.text('Playlists'), findsOneWidget);
  });
}
