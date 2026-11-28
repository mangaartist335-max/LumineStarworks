import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/database/app_database.dart';
import '../data/repositories/listening_repository.dart';
import '../data/repositories/playlist_repository.dart';
import '../data/repositories/settings_repository.dart';
import '../data/repositories/track_repository.dart';
import '../data/storage/media_storage.dart';
import '../services/audio/audio_player_service.dart';
import '../services/import/audio_file_picker.dart';
import '../services/import/music_import_service.dart';

// Root dependencies. These are created during start-up (see main.dart) and
// injected with ProviderScope overrides, which also makes them easy to fake
// in tests.

final appDatabaseProvider = Provider<AppDatabase>(
  (ref) => throw UnimplementedError('appDatabaseProvider must be overridden'),
);

final mediaStorageProvider = Provider<MediaStorage>(
  (ref) => throw UnimplementedError('mediaStorageProvider must be overridden'),
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
    ref.watch(mediaStorageProvider),
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
    storage: ref.watch(mediaStorageProvider),
  ),
);
