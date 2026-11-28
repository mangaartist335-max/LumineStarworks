// MoneyBeats start-up and the root app widget.

import 'dart:async';
import 'dart:io';

import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';
import 'package:moneybeats/core/constants/app_constants.dart';
import 'package:moneybeats/core/providers.dart';
import 'package:moneybeats/core/theme/app_colors.dart';
import 'package:moneybeats/core/theme/app_theme.dart';
import 'package:moneybeats/core/utilities/platform_capabilities.dart';
import 'package:moneybeats/features/library/import_controller.dart';
import 'package:moneybeats/features/library/library_providers.dart';
import 'package:moneybeats/features/player/playback_coordinator.dart';
import 'package:moneybeats/repositories/app_database.dart';
import 'package:moneybeats/services/audio_service.dart';
import 'package:moneybeats/services/import_service.dart';
import 'package:moneybeats/services/storage_service.dart';
import 'package:moneybeats/widgets/app_shell.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';

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

  final storage = await StorageService.open();
  if (PlatformCapabilities.usesSqfliteFfi) sqfliteFfiInit();
  final factory = PlatformCapabilities.usesSqfliteFfi
      ? databaseFactoryFfi
      : databaseFactory;
  final database = await AppDatabase.open(factory, storage.databasePath);

  final audio = JustAudioPlayerService(session: session);

  final container = ProviderContainer(
    overrides: [
      appDatabaseProvider.overrideWithValue(database),
      storageServiceProvider.overrideWithValue(storage),
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

  if (AppConstants.seedDirectory.isNotEmpty) {
    unawaited(_seedLibrary(container, AppConstants.seedDirectory));
  }
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

class MoneyBeatsApp extends ConsumerWidget {
  const MoneyBeatsApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Starts session restore, listening tracking and library/queue syncing.
    ref.watch(playbackCoordinatorProvider);

    return MaterialApp(
      title: AppConstants.appName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark(),
      darkTheme: AppTheme.dark(),
      themeMode: ThemeMode.dark,
      home: const AppShell(),
    );
  }
}
