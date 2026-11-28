import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:moneybeats/repositories/app_database.dart';
import 'package:moneybeats/repositories/listening_repository.dart';
import 'package:moneybeats/repositories/playlist_repository.dart';
import 'package:moneybeats/repositories/settings_repository.dart';
import 'package:moneybeats/repositories/track_repository.dart';
import 'package:moneybeats/services/audio_service.dart';
import 'package:moneybeats/services/import_service.dart';
import 'package:moneybeats/services/storage_service.dart';

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
