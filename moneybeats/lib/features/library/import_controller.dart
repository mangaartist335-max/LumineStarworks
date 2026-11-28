import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:moneybeats/core/providers.dart';
import 'package:moneybeats/services/import_service.dart';

@immutable
class ImportState {
  const ImportState({this.importing = false, this.progress, this.lastResult});

  final bool importing;
  final ImportProgress? progress;
  final ImportResult? lastResult;
}

/// Runs imports and exposes their progress to the UI.
class ImportController extends Notifier<ImportState> {
  @override
  ImportState build() => const ImportState();

  /// Opens the native picker and imports what the user selects.
  /// Returns `null` if the user cancelled or an import is already running.
  Future<ImportResult?> pickAndImport() async {
    if (state.importing) return null;
    final picker = ref.read(audioFilePickerProvider);
    final sources = await picker.pickAudioFiles();
    if (sources.isEmpty) return null;
    try {
      return await importSources(sources);
    } finally {
      await picker.cleanUp();
    }
  }

  /// Imports files that were already chosen (also used for drag and drop
  /// and development seeding).
  Future<ImportResult> importSources(List<ImportSource> sources) async {
    state = ImportState(
      importing: true,
      progress: ImportProgress(completed: 0, total: sources.length),
    );
    try {
      final result = await ref
          .read(musicImportServiceProvider)
          .importAll(
            sources,
            onProgress: (progress) {
              if (ref.mounted) {
                state = ImportState(importing: true, progress: progress);
              }
            },
          );
      if (ref.mounted) state = ImportState(lastResult: result);
      return result;
    } catch (_) {
      if (ref.mounted) state = const ImportState();
      rethrow;
    }
  }
}

final importControllerProvider =
    NotifierProvider<ImportController, ImportState>(ImportController.new);
