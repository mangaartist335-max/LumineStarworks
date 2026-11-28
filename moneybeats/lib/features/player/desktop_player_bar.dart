import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';
import 'package:moneybeats/core/constants/layout.dart';
import 'package:moneybeats/core/navigation.dart';
import 'package:moneybeats/core/theme/app_colors.dart';
import 'package:moneybeats/features/player/mini_player.dart';
import 'package:moneybeats/features/player/playback_providers.dart';
import 'package:moneybeats/features/player/player_controls.dart';
import 'package:moneybeats/widgets/artwork.dart';

/// The full-width player at the bottom of the desktop layout.
class DesktopPlayerBar extends ConsumerWidget {
  const DesktopPlayerBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final track = ref.watch(currentTrackProvider);
    final theme = Theme.of(context);

    return Container(
      height: 92,
      decoration: const BoxDecoration(
        color: AppColors.background,
        border: Border(top: BorderSide(color: AppColors.outline)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Row(
        children: [
          // Now playing.
          SizedBox(
            width: 300,
            child: track == null
                ? Text(
                    'Pick a song to start listening',
                    style: theme.textTheme.bodyMedium,
                  )
                : MouseRegion(
                    cursor: SystemMouseCursors.click,
                    child: GestureDetector(
                      onTap: () => AppNav.openNowPlaying(context),
                      child: Row(
                        children: [
                          Hero(
                            tag: nowPlayingArtworkHeroTag,
                            child: ArtworkImage(
                              path: track.artworkPath,
                              seed: track.displayAlbum,
                              size: 56,
                              radius: 6,
                            ),
                          ),
                          const SizedBox(width: AppSpacing.md),
                          Flexible(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  track.title,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: theme.textTheme.titleSmall,
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  track.displayArtist,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: theme.textTheme.bodySmall,
                                ),
                              ],
                            ),
                          ),
                          FavoriteButton(track: track, size: 20),
                        ],
                      ),
                    ),
                  ),
          ),
          // Transport.
          Expanded(
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 640),
                child: const Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        ShuffleButton(size: 20),
                        SizedBox(width: AppSpacing.sm),
                        SkipPreviousButton(size: 28),
                        SizedBox(width: AppSpacing.sm),
                        PlayPauseButton(size: 40),
                        SizedBox(width: AppSpacing.sm),
                        SkipNextButton(size: 28),
                        SizedBox(width: AppSpacing.sm),
                        RepeatButton(size: 20),
                      ],
                    ),
                    SeekBar(compact: true),
                  ],
                ),
              ),
            ),
          ),
          // Extras.
          SizedBox(
            width: 300,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                IconButton(
                  tooltip: 'Now playing and queue',
                  onPressed: track == null
                      ? null
                      : () => AppNav.openNowPlaying(context),
                  icon: const Icon(
                    Icons.queue_music_rounded,
                    color: AppColors.textSecondary,
                  ),
                ),
                const VolumeSlider(width: 120),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
