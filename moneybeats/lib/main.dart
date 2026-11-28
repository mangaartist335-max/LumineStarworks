import 'dart:async';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';

import 'app.dart';
import 'core/platform/platform_capabilities.dart';
import 'core/theme/app_colors.dart';
import 'data/database/app_database.dart';
import 'data/storage/media_storage.dart';
import 'services/audio/audio_bootstrap.dart';
import 'services/audio/just_audio_player_service.dart';
import 'services/import/audio_file_picker.dart';
import 'state/core_providers.dart';
import 'state/import_controller.dart';
import 'state/library_providers.dart';

/// Development helper: `--dart-define=MONEYBEATS_SEED_DIR=/path/to/mp3s`
/// imports every MP3 in that folder on first launch, through the normal
/// import pipeline. Handy for emulators and desktop testing.
const _seedDir = String.fromEnvironment('MONEYBEATS_SEED_DIR');

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Color(0x00000000),
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: AppColors.background,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );

  final session = await AudioBootstrap.initialize();

  final storage = await MediaStorage.open();
  if (PlatformCapabilities.usesSqfliteFfi) sqfliteFfiInit();
  final factory = PlatformCapabilities.usesSqfliteFfi
      ? databaseFactoryFfi
      : databaseFactory;
  final database = await AppDatabase.open(factory, storage.databasePath);

  final audio = JustAudioPlayerService(session: session);

  final container = ProviderContainer(
    overrides: [
      appDatabaseProvider.overrideWithValue(database),
      mediaStorageProvider.overrideWithValue(storage),
      audioPlayerServiceProvider.overrideWithValue(audio),
    ],
    // Surface errors instead of silently retrying.
    retry: (retryCount, error) => null,
  );

  runApp(
    UncontrolledProviderScope(
      container: container,
      child: const MoneyBeatsApp(),
    ),
  );

  if (_seedDir.isNotEmpty) unawaited(_seedLibrary(container, _seedDir));
}

Future<void> _seedLibrary(ProviderContainer container, String path) async {
  try {
    final existing = await container.read(libraryProvider.future);
    if (existing.isNotEmpty) return;
    final dir = Directory(path);
    if (!await dir.exists()) return;
    final files = await dir
        .list()
        .where((e) => e is File && e.path.toLowerCase().endsWith('.mp3'))
        .cast<File>()
        .toList();
    files.sort((a, b) => a.path.compareTo(b.path));
    final result = await container
        .read(importControllerProvider.notifier)
        .importSources([for (final f in files) FileImportSource(f)]);
    debugPrint('Seeded library: ${result.summary}');
  } catch (e) {
    debugPrint('Seeding failed: $e');
  }
}
