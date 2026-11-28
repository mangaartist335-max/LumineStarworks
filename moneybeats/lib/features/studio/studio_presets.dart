import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';
import 'package:moneybeats/core/constants/layout.dart';
import 'package:moneybeats/core/providers.dart';
import 'package:moneybeats/core/theme/app_colors.dart';
import 'package:moneybeats/features/library/playlist_dialogs.dart';
import 'package:moneybeats/features/player/playback_providers.dart';
import 'package:moneybeats/features/studio/studio_providers.dart';
import 'package:moneybeats/models/audio_effects.dart';
import 'package:moneybeats/widgets/pressable.dart';
import 'package:moneybeats/widgets/track_actions_sheet.dart';

/// The preset cards: built-in sounds first, then the user's own.
class PresetGrid extends ConsumerWidget {
  const PresetGrid({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final presets = ref.watch(audioPresetListProvider);
    final state = ref.watch(audioEffectsStateProvider);
    final effects = ref.read(audioEffectsServiceProvider);

    return LayoutBuilder(
      builder: (context, constraints) {
        final columns = (constraints.maxWidth / 180).floor().clamp(2, 4);
        const spacing = AppSpacing.md;
        final width =
            (constraints.maxWidth - spacing * (columns - 1)) / columns;
        return Wrap(
          spacing: spacing,
          runSpacing: spacing,
          children: [
            for (final preset in presets)
              SizedBox(
                width: width,
                child: _PresetCard(
                  preset: preset,
                  selected: state.activePresetId == preset.id,
                  isDefault: state.defaultPresetId == preset.id,
                  isTrackPreset: state.trackPresetId == preset.id,
                  onTap: () => effects.applyPreset(preset),
                  onMore: () => showPresetActions(context, ref, preset),
                ),
              ),
          ],
        );
      },
    );
  }
}

class _PresetCard extends StatelessWidget {
  const _PresetCard({
    required this.preset,
    required this.selected,
    required this.isDefault,
    required this.isTrackPreset,
    required this.onTap,
    required this.onMore,
  });

  final AudioPreset preset;
  final bool selected;
  final bool isDefault;
  final bool isTrackPreset;
  final VoidCallback onTap;
  final VoidCallback onMore;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final badges = [
      if (isTrackPreset) 'This song',
      if (isDefault) 'Default',
      if (!preset.isBuiltIn) 'Custom',
    ];
    return Pressable(
      onTap: onTap,
      onLongPress: onMore,
      scale: 0.97,
      semanticLabel: '${preset.name} preset${selected ? ', selected' : ''}',
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        constraints: const BoxConstraints(minHeight: 64),
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.md,
          AppSpacing.sm,
          0,
          AppSpacing.sm,
        ),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFF16305F) : AppColors.surfaceRaised,
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(
            color: selected ? AppColors.primary : AppColors.outline,
            width: selected ? 1.5 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(
              selected ? Icons.check_circle_rounded : Icons.graphic_eq_rounded,
              size: 20,
              color: selected ? AppColors.ice : AppColors.textSecondary,
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    preset.name,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.titleSmall?.copyWith(
                      color: AppColors.textPrimary,
                    ),
                  ),
                  if (badges.isNotEmpty)
                    Text(
                      badges.join(' · '),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: AppColors.ice,
                      ),
                    ),
                ],
              ),
            ),
            IconButton(
              tooltip: '${preset.name} options',
              visualDensity: VisualDensity.compact,
              iconSize: 18,
              onPressed: onMore,
              icon: const Icon(
                Icons.more_vert_rounded,
                color: AppColors.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Asks for a preset name. Returns null if cancelled.
Future<String?> askPresetName(
  BuildContext context, {
  required String title,
  String initial = '',
  String confirmLabel = 'Save',
}) {
  final controller = TextEditingController(text: initial);
  return showDialog<String>(
    context: context,
    useRootNavigator: true,
    builder: (context) {
      void submit() {
        final name = controller.text.trim();
        Navigator.of(context).pop(name.isEmpty ? 'My sound' : name);
      }

      return AlertDialog(
        title: Text(title),
        content: TextField(
          controller: controller,
          autofocus: true,
          maxLength: 40,
          textCapitalization: TextCapitalization.sentences,
          decoration: const InputDecoration(
            hintText: 'Name your sound',
            counterText: '',
          ),
          onSubmitted: (_) => submit(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            style: TextButton.styleFrom(
              foregroundColor: AppColors.textSecondary,
            ),
            child: const Text('Cancel'),
          ),
          FilledButton(onPressed: submit, child: Text(confirmLabel)),
        ],
      );
    },
  ).whenComplete(controller.dispose);
}

/// Saves the current Studio settings as a new preset.
Future<void> saveCurrentAsPreset(BuildContext context, WidgetRef ref) async {
  final name = await askPresetName(context, title: 'Save preset');
  if (name == null) return;
  final preset = await ref.read(audioEffectsServiceProvider).saveAsPreset(name);
  if (context.mounted) showSnack(context, 'Saved "${preset.name}"');
}

/// Everything you can do with a preset.
Future<void> showPresetActions(
  BuildContext context,
  WidgetRef ref,
  AudioPreset preset,
) {
  return showModalBottomSheet<void>(
    context: context,
    useRootNavigator: true,
    isScrollControlled: true,
    builder: (sheetContext) =>
        _PresetActionsSheet(preset: preset, hostContext: context),
  );
}

class _PresetActionsSheet extends ConsumerWidget {
  const _PresetActionsSheet({required this.preset, required this.hostContext});

  final AudioPreset preset;
  final BuildContext hostContext;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final effects = ref.read(audioEffectsServiceProvider);
    final state = ref.watch(audioEffectsStateProvider);
    final track = ref.watch(currentTrackProvider);
    final theme = Theme.of(context);
    final isDefault = state.defaultPresetId == preset.id;
    final isTrackPreset = state.trackPresetId == preset.id;

    void close() => Navigator.of(context).pop();
    void snack(String message) {
      if (hostContext.mounted) showSnack(hostContext, message);
    }

    Widget action(
      IconData icon,
      String label,
      VoidCallback onTap, {
      Color? color,
      String? subtitle,
    }) => ListTile(
      leading: Icon(icon, color: color ?? AppColors.textSecondary),
      title: Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
      subtitle: subtitle == null ? null : Text(subtitle),
      contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
      onTap: onTap,
    );

    return SafeArea(
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.xl,
                0,
                AppSpacing.xl,
                AppSpacing.md,
              ),
              child: Text(preset.name, style: theme.textTheme.titleLarge),
            ),
            action(Icons.play_circle_outline_rounded, 'Apply now', () {
              close();
              effects.applyPreset(preset);
            }),
            if (track != null)
              action(
                isTrackPreset
                    ? Icons.music_off_rounded
                    : Icons.music_note_rounded,
                isTrackPreset
                    ? 'Stop using for this song'
                    : 'Use for this song',
                () async {
                  close();
                  await effects.assignPresetToCurrentTrack(
                    isTrackPreset ? null : preset,
                  );
                  snack(
                    isTrackPreset
                        ? '"${track.title}" uses your global sound again'
                        : '"${track.title}" will always play with ${preset.name}',
                  );
                },
                subtitle: track.title,
              ),
            action(
              isDefault ? Icons.star_rounded : Icons.star_outline_rounded,
              isDefault ? 'Remove as default sound' : 'Set as default sound',
              () async {
                close();
                await effects.setDefaultPreset(isDefault ? null : preset);
                snack(
                  isDefault
                      ? 'No default sound'
                      : '${preset.name} is your default sound',
                );
              },
              color: isDefault ? AppColors.rewardsGold : null,
              subtitle: 'Used every time MoneyBeats starts',
            ),
            action(
              Icons.library_music_outlined,
              'Apply to all songs',
              () async {
                close();
                await effects.applyPresetToAllTracks(preset);
                snack('${preset.name} now plays on every song');
              },
              subtitle: 'Clears song-specific presets',
            ),
            action(Icons.copy_rounded, 'Duplicate', () async {
              close();
              final copy = await effects.duplicatePreset(preset.id);
              if (copy != null) snack('Created "${copy.name}"');
            }),
            if (!preset.isBuiltIn) ...[
              action(
                Icons.save_outlined,
                'Update with current sound',
                () async {
                  close();
                  await effects.updatePresetFromCurrent(preset.id);
                  snack('Updated "${preset.name}"');
                },
              ),
              action(Icons.edit_outlined, 'Rename', () async {
                close();
                final name = await askPresetName(
                  hostContext,
                  title: 'Rename preset',
                  initial: preset.name,
                );
                if (name != null) await effects.renamePreset(preset.id, name);
              }),
              action(Icons.delete_outline_rounded, 'Delete', () async {
                close();
                final ok = await confirmAction(
                  hostContext,
                  title: 'Delete "${preset.name}"?',
                  message:
                      'Songs using this preset go back to your global sound.',
                  confirmLabel: 'Delete',
                );
                if (ok) await effects.deletePreset(preset.id);
              }, color: AppColors.danger),
            ],
            const SizedBox(height: AppSpacing.sm),
          ],
        ),
      ),
    );
  }
}
