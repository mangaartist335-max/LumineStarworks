import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';
import 'package:moneybeats/core/constants/layout.dart';
import 'package:moneybeats/core/navigation.dart';
import 'package:moneybeats/core/providers.dart';
import 'package:moneybeats/core/theme/app_colors.dart';
import 'package:moneybeats/core/utilities/formatters.dart';
import 'package:moneybeats/features/player/playback_providers.dart';
import 'package:moneybeats/features/player/player_controls.dart';
import 'package:moneybeats/features/studio/studio_controls.dart';
import 'package:moneybeats/features/studio/studio_presets.dart';
import 'package:moneybeats/features/studio/studio_providers.dart';
import 'package:moneybeats/models/audio_effects.dart';
import 'package:moneybeats/models/track.dart';
import 'package:moneybeats/widgets/artwork.dart';
import 'package:moneybeats/widgets/waveform_view.dart';

/// MoneyBeats Studio: shape the sound of the song that's playing, live.
class StudioScreen extends ConsumerWidget {
  const StudioScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final track = ref.watch(currentTrackProvider);
    final state = ref.watch(audioEffectsStateProvider);
    final caps = state.capabilities;
    final effects = ref.read(audioEffectsServiceProvider);
    final theme = Theme.of(context);
    final width = MediaQuery.sizeOf(context).width;
    final wide = width >= 1000;

    final header = Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.gutter,
        AppSpacing.lg,
        AppSpacing.sm,
        AppSpacing.md,
      ),
      child: Row(
        children: [
          if (Navigator.of(context).canPop()) const BackButton(),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Audio Studio', style: theme.textTheme.headlineSmall),
                Text('MoneyBeats', style: theme.textTheme.bodyMedium),
              ],
            ),
          ),
          IconButton(
            tooltip: 'Save as preset',
            onPressed: () => saveCurrentAsPreset(context, ref),
            icon: const Icon(Icons.bookmark_add_outlined),
          ),
          IconButton(
            tooltip: 'Restore original sound',
            onPressed: state.settings.isOriginal ? null : effects.resetAll,
            icon: const Icon(Icons.restart_alt_rounded),
          ),
        ],
      ),
    );

    final nowPlaying = track == null
        ? const _NothingPlaying()
        : _NowPlayingCard(track: track);

    final trackBanner = state.trackPresetId == null || track == null
        ? null
        : _TrackPresetBanner(trackTitle: track.title);

    final presets = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(
              child: Text('Sound presets', style: theme.textTheme.titleLarge),
            ),
            TextButton.icon(
              onPressed: () => saveCurrentAsPreset(context, ref),
              icon: const Icon(Icons.add_rounded, size: 18),
              label: const Text('Save'),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.sm),
        const PresetGrid(),
      ],
    );

    final mainControls = StudioCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (caps.pitch)
            EffectSlider(
              label: 'Pitch shift',
              icon: Icons.music_note_rounded,
              value: state.settings.pitchSemitones,
              min: EffectLimits.pitchMin,
              max: EffectLimits.pitchMax,
              step: EffectLimits.pitchStep,
              fineStep: EffectLimits.pitchStep,
              neutral: 0,
              format: StudioFormat.pitch,
              onChanged: effects.setPitch,
            )
          else
            UnsupportedNote(
              title: 'Pitch shift',
              message: caps.pitchNote ?? 'Not available on this device.',
            ),
          const SizedBox(height: AppSpacing.sm),
          if (caps.speed)
            EffectSlider(
              label: 'Playback speed',
              icon: Icons.speed_rounded,
              value: state.settings.speed,
              min: EffectLimits.speedMin,
              max: EffectLimits.speedMax,
              step: EffectLimits.speedStep,
              neutral: 1,
              format: StudioFormat.speed,
              onChanged: effects.setSpeed,
            ),
          const SizedBox(height: AppSpacing.sm),
          if (caps.bass)
            EffectSlider(
              label: 'Bass boost',
              icon: Icons.graphic_eq_rounded,
              value: state.settings.bassBoostDb,
              min: EffectLimits.bassMin,
              max: EffectLimits.bassMax,
              step: 0.5,
              fineStep: 1,
              neutral: 0,
              format: (v) => StudioFormat.bass(v, caps.bassUnit),
              onChanged: effects.setBassBoost,
            )
          else
            UnsupportedNote(
              title: 'Bass boost',
              message: caps.bassNote ?? 'Not available on this device.',
            ),
        ],
      ),
    );

    const reverb = StudioCard(child: ReverbPanel());
    const equalizer = StudioCard(child: EqualizerPanel());

    final actions = Wrap(
      spacing: AppSpacing.md,
      runSpacing: AppSpacing.md,
      alignment: WrapAlignment.center,
      children: [
        FilledButton.icon(
          onPressed: () => saveCurrentAsPreset(context, ref),
          icon: const Icon(Icons.bookmark_add_rounded),
          label: const Text('Save as preset'),
        ),
        OutlinedButton.icon(
          onPressed: state.settings.isOriginal ? null : effects.resetAll,
          icon: const Icon(Icons.restart_alt_rounded),
          label: const Text('Restore original sound'),
        ),
      ],
    );

    final footer = Text(
      'Processing: ${caps.engine}. Effects play live and never change your '
      'imported files.',
      textAlign: TextAlign.center,
      style: theme.textTheme.bodySmall,
    );

    const gap = SizedBox(height: AppSpacing.lg);
    final left = <Widget>[
      nowPlaying,
      gap,
      const _CompareToggle(),
      if (trackBanner != null) ...[gap, trackBanner],
      gap,
      presets,
    ];
    final right = <Widget>[
      mainControls,
      gap,
      reverb,
      gap,
      equalizer,
      gap,
      actions,
      gap,
      footer,
      const SizedBox(height: AppSpacing.xxl),
    ];

    const padding = EdgeInsets.symmetric(horizontal: AppSpacing.gutter);
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            header,
            Expanded(
              child: wide
                  ? Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(
                          width: 440,
                          child: ListView(padding: padding, children: left),
                        ),
                        Expanded(
                          child: ListView(padding: padding, children: right),
                        ),
                      ],
                    )
                  : ListView(
                      padding: padding,
                      children: [...left, gap, ...right],
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NowPlayingCard extends ConsumerWidget {
  const _NowPlayingCard({required this.track});

  final Track track;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final compare = ref.watch(
      audioEffectsStateProvider.select((s) => s.compareOriginal),
    );
    final tint = tintFor(
      ref,
      artworkPath: track.artworkPath,
      seed: track.displayAlbum,
      lightness: 0.18,
    );
    return AnimatedContainer(
      duration: const Duration(milliseconds: 500),
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppRadius.lg),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [tint, AppColors.backgroundSecondary],
        ),
        border: Border.all(color: AppColors.outline.withValues(alpha: 0.6)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          WaveformView(track: track, height: 96),
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              ArtworkImage(
                path: track.artworkPath,
                seed: track.displayAlbum,
                size: 48,
                radius: 8,
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      track.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.titleMedium,
                    ),
                    Text(
                      '${track.displayArtist} · Local MP3',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              Tooltip(
                message: compare
                    ? 'Playing the original sound'
                    : 'Playing your Studio sound',
                child: Icon(
                  Icons.headphones_rounded,
                  color: compare ? AppColors.textSecondary : AppColors.ice,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          const _TimeRow(),
          const SizedBox(height: AppSpacing.xs),
          const Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SkipPreviousButton(size: 32),
              SizedBox(width: AppSpacing.lg),
              PlayPauseButton(size: 56),
              SizedBox(width: AppSpacing.lg),
              SkipNextButton(size: 32),
            ],
          ),
        ],
      ),
    );
  }
}

class _TimeRow extends ConsumerWidget {
  const _TimeRow();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final position = ref.watch(positionStateProvider);
    final track = ref.watch(currentTrackProvider);
    final style = Theme.of(context).textTheme.bodySmall
        ?.copyWith(fontFeatures: const [FontFeature.tabularFigures()]);
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(formatDuration(position.position), style: style),
        Text(
          formatDuration(position.duration ?? track?.duration),
          style: style,
        ),
      ],
    );
  }
}

class _NothingPlaying extends ConsumerWidget {
  const _NothingPlaying();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    return StudioCard(
      padding: const EdgeInsets.all(AppSpacing.xl),
      child: Column(
        children: [
          const Icon(
            Icons.graphic_eq_rounded,
            size: 40,
            color: AppColors.primary,
          ),
          const SizedBox(height: AppSpacing.md),
          Text(
            'Play a song to shape its sound',
            style: theme.textTheme.titleMedium,
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            'Pick a preset or fine-tune pitch, speed, bass, reverb and the '
            'equaliser while you listen.',
            textAlign: TextAlign.center,
            style: theme.textTheme.bodyMedium,
          ),
          const SizedBox(height: AppSpacing.lg),
          FilledButton.icon(
            onPressed: () =>
                ref.read(shellControllerProvider).selectTab(AppTab.library),
            icon: const Icon(Icons.library_music_rounded),
            label: const Text('Open your library'),
          ),
        ],
      ),
    );
  }
}

/// A/B switch between the Studio sound and the untouched original.
class _CompareToggle extends ConsumerWidget {
  const _CompareToggle();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(audioEffectsStateProvider);
    final effects = ref.read(audioEffectsServiceProvider);
    final presetName = ref.watch(presetNameProvider(state.activePresetId));
    final theme = Theme.of(context);

    Widget segment(String label, bool active, VoidCallback onTap) => Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
          decoration: BoxDecoration(
            color: active ? AppColors.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(100),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontWeight: FontWeight.w800,
              color: active ? AppColors.onPrimary : AppColors.textSecondary,
            ),
          ),
        ),
      ),
    );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Semantics(
          label: 'Compare with the original sound',
          toggled: state.compareOriginal,
          child: Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: AppColors.surfaceRaised,
              borderRadius: BorderRadius.circular(100),
              border: Border.all(color: AppColors.outline),
            ),
            child: Row(
              children: [
                segment(
                  'Studio sound',
                  !state.compareOriginal,
                  () => effects.setCompareOriginal(false),
                ),
                segment(
                  'Original',
                  state.compareOriginal,
                  () => effects.setCompareOriginal(true),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          state.compareOriginal
              ? 'Comparing: you\'re hearing the untouched song. Your settings are kept.'
              : (presetName == null ? 'Custom sound' : 'Preset: $presetName'),
          textAlign: TextAlign.center,
          style: theme.textTheme.bodySmall,
        ),
      ],
    );
  }
}

class _TrackPresetBanner extends ConsumerWidget {
  const _TrackPresetBanner({required this.trackTitle});

  final String trackTitle;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(audioEffectsStateProvider);
    final name =
        ref.watch(presetNameProvider(state.trackPresetId)) ?? 'a preset';
    return Container(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        AppSpacing.sm,
        AppSpacing.sm,
        AppSpacing.sm,
      ),
      decoration: BoxDecoration(
        color: AppColors.primarySoft,
        borderRadius: BorderRadius.circular(AppRadius.md),
      ),
      child: Row(
        children: [
          const Icon(Icons.push_pin_rounded, size: 18, color: AppColors.ice),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              '"$trackTitle" always plays with $name. Changes here are just for now.',
              style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
            ),
          ),
          TextButton(
            onPressed: () => ref
                .read(audioEffectsServiceProvider)
                .assignPresetToCurrentTrack(null),
            child: const Text('Remove'),
          ),
        ],
      ),
    );
  }
}
