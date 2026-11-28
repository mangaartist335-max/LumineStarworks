import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:material_ui/material_ui.dart';
import 'package:moneybeats/core/providers.dart';
import 'package:moneybeats/features/studio/studio_controls.dart';
import 'package:moneybeats/features/studio/studio_screen.dart';
import 'package:moneybeats/main.dart';
import 'package:moneybeats/models/audio_effects.dart';
import 'package:moneybeats/services/platform_audio_processor.dart';

import '../helpers/fakes.dart';
import '../helpers/test_env.dart';

class _Studio {
  _Studio(this.audio, this.processor);
  final FakeAudioPlayerService audio;
  final PlatformAudioProcessor processor;
}

/// Starts the app with a song playing and opens the Audio Studio from
/// Now Playing. The window is tall so the whole Studio is laid out at once.
Future<_Studio> _openStudio(
  WidgetTester tester, {
  required PlatformAudioProcessor processor,
}) async {
  final tracks = [makeTrack('a', title: 'Alpha Song', artist: 'Ari')];
  final env = (await tester.runAsync(() async {
    final env = await TestEnv.create(noIsolate: true);
    for (final t in tracks) {
      await env.tracks.insert(t);
    }
    return env;
  }))!;
  addTearDown(() async => tester.runAsync(env.dispose));
  tester.view.physicalSize = const Size(420, 3200);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(tester.view.reset);

  final audio = FakeAudioPlayerService();
  await tester.pumpWidget(
    ProviderScope(
      retry: (_, _) => null,
      overrides: [
        appDatabaseProvider.overrideWithValue(env.database),
        storageServiceProvider.overrideWithValue(env.storage),
        audioPlayerServiceProvider.overrideWithValue(audio),
        audioFilePickerProvider.overrideWithValue(FakeAudioFilePicker()),
        platformAudioProcessorProvider.overrideWithValue(processor),
      ],
      child: const MoneyBeatsApp(),
    ),
  );
  await _settle(tester);
  await audio.playTracks(tracks);
  await _settle(tester);

  await tester.tap(find.text('Ari').last); // mini player → Now Playing
  await _settle(tester, 8);
  await tester.tap(find.byTooltip('Audio Studio'));
  await _settle(tester, 8);
  expect(find.byType(StudioScreen), findsOneWidget);
  return _Studio(audio, processor);
}

/// Pumps frames and lets the effects service's real database work finish.
Future<void> _settle(WidgetTester tester, [int frames = 6]) async {
  for (var i = 0; i < frames; i++) {
    await tester.runAsync(
      () => Future<void>.delayed(const Duration(milliseconds: 10)),
    );
    await tester.pump(const Duration(milliseconds: 100));
  }
}

void studioTest(String description, Future<void> Function(WidgetTester) body) {
  testWidgets(description, (tester) async {
    await body(tester);
    await tester.pumpWidget(const SizedBox());
    // Let the final listening-session write finish before the database closes.
    await _settle(tester, 5);
  });
}

Finder _preset(String name) =>
    find.bySemanticsLabel(RegExp('^${RegExp.escape(name)} preset'));

void main() {
  studioTest('presets, compare and restore drive the real engine calls', (
    tester,
  ) async {
    final s = await _openStudio(tester, processor: FakeAudioProcessor());
    final fake = s.processor as FakeAudioProcessor;
    expect(find.text('Audio Studio'), findsWidgets);
    expect(find.text('Alpha Song'), findsWidgets);
    for (final p in BuiltInPresets.all) {
      expect(_preset(p.name), findsOneWidget, reason: p.name);
    }

    await tester.tap(_preset('Nightcore'));
    await _settle(tester);
    expect(s.audio.speed, 1.25);
    expect(s.audio.pitch, closeTo(pitchFactorForSemitones(3), 1e-9));
    expect(find.text('Preset: Nightcore'), findsOneWidget);

    await tester.tap(find.text('Original').first); // the compare toggle
    await _settle(tester);
    expect(s.audio.speed, 1.0);
    expect(fake.applied.last.isOriginal, isTrue);
    expect(find.textContaining('untouched song'), findsOneWidget);

    await tester.tap(find.text('Studio sound'));
    await _settle(tester);
    expect(s.audio.speed, 1.25);

    await tester.tap(
      find.widgetWithText(OutlinedButton, 'Restore original sound'),
    );
    await _settle(tester);
    expect(s.audio.speed, 1.0);
    expect(s.audio.pitch, 1.0);
    expect(find.text('Preset: Original'), findsOneWidget);
  });

  studioTest('fine buttons step the pitch and every control is offered', (
    tester,
  ) async {
    final s = await _openStudio(tester, processor: FakeAudioProcessor());
    expect(find.byType(UnsupportedNote), findsNothing);
    expect(find.text('Equaliser'), findsWidgets);
    expect(find.text('Reverb'), findsWidgets);

    await tester.tap(find.byTooltip('Increase Pitch shift'));
    await _settle(tester);
    expect(s.audio.pitch, closeTo(pitchFactorForSemitones(0.1), 1e-9));
    expect(find.text('Custom sound'), findsOneWidget);
  });

  studioTest('unsupported effects say so instead of pretending', (
    tester,
  ) async {
    await _openStudio(tester, processor: SpeedOnlyAudioProcessor());
    expect(find.byType(UnsupportedNote), findsWidgets);
    expect(find.byTooltip('Increase Pitch shift'), findsNothing);
    expect(find.byTooltip('Increase Playback speed'), findsOneWidget);
    expect(find.textContaining('Processing: AVPlayer'), findsOneWidget);
  });
}
