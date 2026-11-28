import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:moneybeats/repositories/app_database.dart';
import 'package:moneybeats/repositories/audio_preset_repository.dart';
import 'package:moneybeats/repositories/listening_repository.dart';
import 'package:moneybeats/repositories/playlist_repository.dart';
import 'package:moneybeats/repositories/settings_repository.dart';
import 'package:moneybeats/repositories/track_repository.dart';
import 'package:moneybeats/services/audio_effects_service.dart';
import 'package:moneybeats/services/audio_service.dart';
import 'package:moneybeats/services/import_service.dart';
import 'package:moneybeats/services/platform_audio_processor.dart';
import 'package:moneybeats/services/storage_service.dart';
import 'package:moneybeats/services/waveform_service.dart';

// Root dependencies. These are created during start-up (see main.dart) and
// injected with ProviderScope overrides, which also makes them easy to fake
// in tests.

final appDatabaseProvider = Provider<AppDatabase>(
  (ref) => throw UnimplementedError('appDatabaseProvider must be overridden'),
);

final storageServiceProvider = Provider<StorageService>(
  (ref) =>
      throw UnimplementedError('storageServiceProvider must be overridden'),
);

/// The one audio engine for the whole app.
final audioPlayerServiceProvider = Provider<AudioPlayerService>(
  (ref) =>
      throw UnimplementedError('audioPlayerServiceProvider must be overridden'),
);

final audioFilePickerProvider = Provider<AudioFilePicker>(
  (ref) => const PlatformAudioFilePicker(),
);

// Repositories and services.

final trackRepositoryProvider = Provider<TrackRepository>(
  (ref) => TrackRepository(
    ref.watch(appDatabaseProvider),
    ref.watch(storageServiceProvider),
  ),
);

final playlistRepositoryProvider = Provider<PlaylistRepository>(
  (ref) => PlaylistRepository(ref.watch(appDatabaseProvider)),
);

final settingsRepositoryProvider = Provider<SettingsRepository>(
  (ref) => SettingsRepository(ref.watch(appDatabaseProvider)),
);

final listeningRepositoryProvider = Provider<ListeningRepository>(
  (ref) => ListeningRepository(ref.watch(appDatabaseProvider)),
);

final musicImportServiceProvider = Provider<MusicImportService>(
  (ref) => MusicImportService(
    tracks: ref.watch(trackRepositoryProvider),
    storage: ref.watch(storageServiceProvider),
  ),
);

// Audio Studio.

/// The platform's effects processor (Android effects, libmpv filters, or
/// speed-only). Overridden in main.dart per platform.
final platformAudioProcessorProvider = Provider<PlatformAudioProcessor>(
  (ref) => SpeedOnlyAudioProcessor(engine: 'Default'),
);

final audioPresetRepositoryProvider = Provider<AudioPresetRepository>(
  (ref) => AudioPresetRepository(
    ref.watch(appDatabaseProvider),
    ref.watch(settingsRepositoryProvider),
  ),
);

/// The single owner of effect settings. Starts (and restores saved
/// settings) as soon as it is first read.
final audioEffectsServiceProvider = Provider<AudioEffectsService>((ref) {
  final service = AudioEffectsService(
    player: ref.watch(audioPlayerServiceProvider),
    processor: ref.watch(platformAudioProcessorProvider),
    presets: ref.watch(audioPresetRepositoryProvider),
  );
  unawaited(service.initialize());
  ref.onDispose(() {
    service.stopTimers();
    unawaited(service.dispose());
  });
  return service;
});

/// Waveform extraction and caching. Overridden in main.dart so phones use
/// decoded PCM; the default reads MP3 frames (works everywhere, incl. tests).
final waveformServiceProvider = Provider<WaveformService>(
  (ref) => WaveformService(
    storage: ref.watch(storageServiceProvider),
    primary: const Mp3EnvelopeExtractor(),
  ),
);
