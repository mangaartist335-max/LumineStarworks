import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:moneybeats/core/providers.dart';
import 'package:moneybeats/features/library/library_providers.dart';
import 'package:moneybeats/models/audio_effects.dart';
import 'package:moneybeats/services/waveform_service.dart';

final _effectsStreamProvider = StreamProvider<AudioEffectsState>(
  (ref) => ref.watch(audioEffectsServiceProvider).stateStream,
);

/// The Studio's state: settings, active preset, compare mode, capabilities.
final audioEffectsStateProvider = Provider<AudioEffectsState>((ref) {
  return ref.watch(_effectsStreamProvider).value ??
      ref.read(audioEffectsServiceProvider).state;
});

/// Built-in and custom presets, refreshed when they change.
class AudioPresetsNotifier extends AsyncNotifier<List<AudioPreset>> {
  @override
  Future<List<AudioPreset>> build() async {
    final repository = ref.watch(audioPresetRepositoryProvider);
    final sub = repository.changes.listen((_) => unawaited(_reload()));
    ref.onDispose(sub.cancel);
    return repository.getAll();
  }

  Future<void> _reload() async {
    final presets = await ref.read(audioPresetRepositoryProvider).getAll();
    if (ref.mounted) state = AsyncData(presets);
  }
}

final audioPresetsProvider =
    AsyncNotifierProvider<AudioPresetsNotifier, List<AudioPreset>>(
      AudioPresetsNotifier.new,
    );

final audioPresetListProvider = Provider<List<AudioPreset>>(
  (ref) => ref.watch(audioPresetsProvider).value ?? BuiltInPresets.all,
);

/// The name of a preset id (built-in or custom), if it still exists.
final presetNameProvider = Provider.family<String?, String?>((ref, id) {
  if (id == null) return null;
  for (final p in ref.watch(audioPresetListProvider)) {
    if (p.id == id) return p.name;
  }
  return null;
});

/// Waveform bars for a track, extracted once and cached on disk.
final waveformProvider = FutureProvider.family<WaveformData?, String>((
  ref,
  trackId,
) async {
  final track = ref.read(tracksByIdProvider)[trackId];
  if (track == null) return null;
  return ref.read(waveformServiceProvider).load(track.id, track.filePath);
});
