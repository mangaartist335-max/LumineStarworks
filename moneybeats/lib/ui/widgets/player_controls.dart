import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../services/audio/playback_models.dart';
import '../../state/core_providers.dart';
import '../../state/playback_providers.dart';

/// Play / pause with an animated icon and a loading ring while buffering.
class PlayPauseButton extends ConsumerStatefulWidget {
  const PlayPauseButton({
    super.key,
    this.size = 64,
    this.filled = true,
    this.color,
  });

  final double size;
  final bool filled;
  final Color? color;

  @override
  ConsumerState<PlayPauseButton> createState() => _PlayPauseButtonState();
}

class _PlayPauseButtonState extends ConsumerState<PlayPauseButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _icon = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 220),
  );

  @override
  void dispose() {
    _icon.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final status = ref.watch(playbackStatusProvider);
    final hasQueue = ref.watch(queueStateProvider.select((q) => !q.isEmpty));
    final showPause = status.showPause;
    if (showPause) {
      _icon.forward();
    } else {
      _icon.reverse();
    }

    final foreground = widget.filled
        ? AppColors.onMint
        : (widget.color ?? AppColors.textPrimary);
    final icon = AnimatedIcon(
      icon: AnimatedIcons.play_pause,
      progress: _icon,
      size: widget.size * (widget.filled ? 0.48 : 0.62),
      color: foreground,
      semanticLabel: showPause ? 'Pause' : 'Play',
    );

    final busy = status.isBusy && status.playing;
    final onTap = hasQueue
        ? () => ref.read(audioPlayerServiceProvider).togglePlayPause()
        : null;

    if (!widget.filled) {
      return IconButton(
        onPressed: onTap,
        iconSize: widget.size * 0.62,
        tooltip: showPause ? 'Pause' : 'Play',
        icon: busy
            ? SizedBox.square(
                dimension: widget.size * 0.45,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: foreground,
                ),
              )
            : icon,
      );
    }

    return SizedBox.square(
      dimension: widget.size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          Material(
            color: widget.color ?? AppColors.mint,
            shape: const CircleBorder(),
            elevation: 8,
            shadowColor: AppColors.mint.withValues(alpha: 0.35),
            child: InkWell(
              customBorder: const CircleBorder(),
              onTap: onTap,
              child: SizedBox.square(
                dimension: widget.size,
                child: Center(child: icon),
              ),
            ),
          ),
          if (busy)
            IgnorePointer(
              child: SizedBox.square(
                dimension: widget.size + 6,
                child: const CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: AppColors.mint,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class SkipPreviousButton extends ConsumerWidget {
  const SkipPreviousButton({super.key, this.size = 36});
  final double size;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hasQueue = ref.watch(queueStateProvider.select((q) => !q.isEmpty));
    return IconButton(
      tooltip: 'Previous',
      iconSize: size,
      onPressed: hasQueue
          ? () => ref.read(audioPlayerServiceProvider).skipToPrevious()
          : null,
      icon: const Icon(Icons.skip_previous_rounded),
    );
  }
}

class SkipNextButton extends ConsumerWidget {
  const SkipNextButton({super.key, this.size = 36});
  final double size;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hasNext = ref.watch(queueStateProvider.select((q) => q.hasNext));
    return IconButton(
      tooltip: 'Next',
      iconSize: size,
      onPressed: hasNext
          ? () => ref.read(audioPlayerServiceProvider).skipToNext()
          : null,
      icon: const Icon(Icons.skip_next_rounded),
    );
  }
}

class ShuffleButton extends ConsumerWidget {
  const ShuffleButton({super.key, this.size = 24});
  final double size;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final enabled = ref.watch(
      queueStateProvider.select((q) => q.shuffleEnabled),
    );
    return _ModeButton(
      active: enabled,
      tooltip: enabled ? 'Shuffle on' : 'Shuffle off',
      icon: Icons.shuffle_rounded,
      size: size,
      onPressed: () => ref.read(audioPlayerServiceProvider).toggleShuffle(),
    );
  }
}

class RepeatButton extends ConsumerWidget {
  const RepeatButton({super.key, this.size = 24});
  final double size;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mode = ref.watch(queueStateProvider.select((q) => q.repeatMode));
    return _ModeButton(
      active: mode != PlayerRepeatMode.off,
      tooltip: switch (mode) {
        PlayerRepeatMode.off => 'Repeat off',
        PlayerRepeatMode.all => 'Repeat all',
        PlayerRepeatMode.one => 'Repeat one',
      },
      icon: mode == PlayerRepeatMode.one
          ? Icons.repeat_one_rounded
          : Icons.repeat_rounded,
      size: size,
      onPressed: () => ref.read(audioPlayerServiceProvider).cycleRepeatMode(),
    );
  }
}

class _ModeButton extends StatelessWidget {
  const _ModeButton({
    required this.active,
    required this.tooltip,
    required this.icon,
    required this.size,
    required this.onPressed,
  });

  final bool active;
  final String tooltip;
  final IconData icon;
  final double size;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: tooltip,
      iconSize: size,
      onPressed: onPressed,
      icon: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 180),
            child: Icon(
              icon,
              key: ValueKey('$icon$active'),
              color: active ? AppColors.mint : AppColors.textSecondary,
            ),
          ),
          AnimatedOpacity(
            opacity: active ? 1 : 0,
            duration: const Duration(milliseconds: 180),
            child: Container(
              width: 4,
              height: 4,
              margin: const EdgeInsets.only(top: 2),
              decoration: const BoxDecoration(
                color: AppColors.mint,
                shape: BoxShape.circle,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Seek bar with elapsed and total time. Dragging previews the position and
/// seeks when released.
class SeekBar extends ConsumerStatefulWidget {
  const SeekBar({super.key, this.compact = false});

  /// Desktop player bar layout: times beside the slider.
  final bool compact;

  @override
  ConsumerState<SeekBar> createState() => _SeekBarState();
}

class _SeekBarState extends ConsumerState<SeekBar> {
  double? _dragValue;

  @override
  Widget build(BuildContext context) {
    final position = ref.watch(positionStateProvider);
    final track = ref.watch(currentTrackProvider);
    final total = position.duration ?? track?.duration ?? Duration.zero;
    final totalMs = total.inMilliseconds.toDouble();
    final positionMs = position.position.inMilliseconds
        .clamp(0, totalMs > 0 ? totalMs : 0)
        .toDouble();
    final value = _dragValue ?? positionMs;
    final enabled = track != null && totalMs > 0;

    final slider = SliderTheme(
      data: SliderTheme.of(context).copyWith(
        trackHeight: widget.compact ? 3 : 4,
        thumbShape: RoundSliderThumbShape(
          enabledThumbRadius: _dragValue != null ? 8 : 6,
        ),
      ),
      child: Slider(
        value: enabled ? value.clamp(0, totalMs) : 0,
        max: enabled ? totalMs : 1,
        onChangeStart: enabled ? (v) => setState(() => _dragValue = v) : null,
        onChanged: enabled ? (v) => setState(() => _dragValue = v) : null,
        onChangeEnd: enabled
            ? (v) {
                ref
                    .read(audioPlayerServiceProvider)
                    .seek(Duration(milliseconds: v.round()));
                setState(() => _dragValue = null);
              }
            : null,
        semanticFormatterCallback: (v) =>
            formatDuration(Duration(milliseconds: v.round())),
      ),
    );

    final timeStyle = Theme.of(context).textTheme.bodySmall?.copyWith(
      fontFeatures: const [FontFeature.tabularFigures()],
      color: AppColors.textSecondary,
    );
    final elapsed = Text(
      formatDuration(Duration(milliseconds: value.round())),
      style: timeStyle,
    );
    final length = Text(formatDuration(total), style: timeStyle);

    if (widget.compact) {
      return Row(
        children: [
          SizedBox(
            width: 44,
            child: Align(alignment: Alignment.centerRight, child: elapsed),
          ),
          Expanded(child: slider),
          SizedBox(width: 44, child: length),
        ],
      );
    }

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 0),
          child: SizedBox(height: 28, child: slider),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 22),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [elapsed, length],
          ),
        ),
      ],
    );
  }
}

/// App volume (0-100%), remembered between launches.
class VolumeSlider extends ConsumerWidget {
  const VolumeSlider({super.key, this.width});

  final double? width;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final volume = ref.watch(volumeProvider);
    final audio = ref.read(audioPlayerServiceProvider);
    final icon = volume <= 0.001
        ? Icons.volume_off_rounded
        : volume < 0.5
        ? Icons.volume_down_rounded
        : Icons.volume_up_rounded;
    final slider = SliderTheme(
      data: SliderTheme.of(context).copyWith(trackHeight: 3),
      child: Slider(
        value: volume.clamp(0.0, 1.0),
        onChanged: (v) => audio.setVolume(v),
        semanticFormatterCallback: (v) => 'Volume ${(v * 100).round()}%',
      ),
    );
    return Row(
      mainAxisSize: width == null ? MainAxisSize.max : MainAxisSize.min,
      children: [
        IconButton(
          tooltip: volume <= 0.001 ? 'Unmute' : 'Mute',
          icon: Icon(icon, color: AppColors.textSecondary, size: 22),
          onPressed: () => audio.setVolume(volume <= 0.001 ? 0.8 : 0),
        ),
        if (width == null)
          Expanded(child: slider)
        else
          SizedBox(width: width, child: slider),
      ],
    );
  }
}
