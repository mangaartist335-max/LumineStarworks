import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/track.dart';
import '../../state/core_providers.dart';
import '../../state/library_providers.dart';
import '../../state/playback_providers.dart';
import '../navigation.dart';
import 'artwork.dart';
import 'player_controls.dart';

/// Hero tag shared by the mini player, the desktop bar and Now Playing.
const nowPlayingArtworkHeroTag = 'now-playing-artwork';

/// The persistent player above the navigation bar on phones.
///
/// Tap or swipe up to open Now Playing; swipe sideways to change song.
class MiniPlayer extends ConsumerWidget {
  const MiniPlayer({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final track = ref.watch(currentTrackProvider);
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 280),
      switchInCurve: Curves.easeOutCubic,
      transitionBuilder: (child, animation) => SizeTransition(
        sizeFactor: animation,
        alignment: Alignment.bottomCenter,
        child: FadeTransition(opacity: animation, child: child),
      ),
      child: track == null
          ? const SizedBox(width: double.infinity, key: ValueKey('empty'))
          : _MiniPlayerBody(key: const ValueKey('player'), track: track),
    );
  }
}

class _MiniPlayerBody extends ConsumerWidget {
  const _MiniPlayerBody({super.key, required this.track});

  final Track track;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tint = tintFor(
      ref,
      artworkPath: track.artworkPath,
      seed: track.displayAlbum,
      lightness: 0.2,
    );
    final audio = ref.read(audioPlayerServiceProvider);
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.sm,
        0,
        AppSpacing.sm,
        AppSpacing.xs,
      ),
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => AppNav.openNowPlaying(context),
        onVerticalDragEnd: (details) {
          if ((details.primaryVelocity ?? 0) < -250) {
            AppNav.openNowPlaying(context);
          }
        },
        onHorizontalDragEnd: (details) {
          final velocity = details.primaryVelocity ?? 0;
          if (velocity < -300) audio.skipToNext();
          if (velocity > 300) audio.skipToPrevious();
        },
        child: Semantics(
          label:
              'Now playing: ${track.title} by ${track.displayArtist}. Tap to open the player.',
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 450),
            curve: Curves.easeOut,
            decoration: BoxDecoration(
              color: tint,
              borderRadius: BorderRadius.circular(AppRadius.md),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x55000000),
                  blurRadius: 18,
                  offset: Offset(0, 6),
                ),
              ],
            ),
            clipBehavior: Clip.antiAlias,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(8, 8, 4, 6),
                  child: Row(
                    children: [
                      Hero(
                        tag: nowPlayingArtworkHeroTag,
                        child: ArtworkImage(
                          path: track.artworkPath,
                          seed: track.displayAlbum,
                          size: 44,
                          radius: 6,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.md),
                      Expanded(
                        child: AnimatedSwitcher(
                          duration: const Duration(milliseconds: 250),
                          child: Column(
                            key: ValueKey(track.id),
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                track.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: theme.textTheme.titleSmall?.copyWith(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                track.displayArtist,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      FavoriteButton(track: track, size: 22),
                      const PlayPauseButton(filled: false, size: 46),
                    ],
                  ),
                ),
                const _MiniProgress(),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _MiniProgress extends ConsumerWidget {
  const _MiniProgress();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final position = ref.watch(positionStateProvider);
    final fallback = ref.watch(currentTrackProvider.select((t) => t?.duration));
    return Padding(
      padding: const EdgeInsets.fromLTRB(10, 0, 10, 2),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(2),
        child: LinearProgressIndicator(
          value: position.progressFor(fallback),
          minHeight: 2.5,
          color: AppColors.textPrimary,
          backgroundColor: Colors.white.withValues(alpha: 0.18),
        ),
      ),
    );
  }
}

/// Heart toggle for a song, with a little bounce.
class FavoriteButton extends ConsumerWidget {
  const FavoriteButton({super.key, required this.track, this.size = 24});

  final Track track;
  final double size;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final liked =
        ref.watch(tracksByIdProvider.select((m) => m[track.id]?.isFavorite)) ??
        track.isFavorite;
    return IconButton(
      tooltip: liked ? 'Remove from Liked songs' : 'Add to Liked songs',
      iconSize: size,
      onPressed: () => ref.read(libraryProvider.notifier).toggleFavorite(track),
      icon: AnimatedSwitcher(
        duration: const Duration(milliseconds: 220),
        transitionBuilder: (child, animation) => ScaleTransition(
          scale: Tween(begin: 0.6, end: 1.0).animate(
            CurvedAnimation(parent: animation, curve: Curves.elasticOut),
          ),
          child: child,
        ),
        child: Icon(
          liked ? Icons.favorite_rounded : Icons.favorite_border_rounded,
          key: ValueKey(liked),
          color: liked ? AppColors.mint : AppColors.textPrimary,
        ),
      ),
    );
  }
}
