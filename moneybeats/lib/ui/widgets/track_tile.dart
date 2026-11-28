import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/track.dart';
import '../../state/playback_providers.dart';
import 'artwork.dart';
import 'equalizer_bars.dart';
import 'track_actions_sheet.dart';

/// A song row: artwork, title, artist and a menu.
class TrackTile extends ConsumerWidget {
  const TrackTile({
    super.key,
    required this.track,
    required this.onTap,
    this.showArtwork = true,
    this.leadingNumber,
    this.playlistId,
    this.trailing,
    this.showDuration = true,
  });

  final Track track;
  final VoidCallback onTap;
  final bool showArtwork;

  /// Shows a track number instead of artwork (album pages).
  final int? leadingNumber;

  /// When set, the menu offers "Remove from this playlist".
  final String? playlistId;
  final Widget? trailing;
  final bool showDuration;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isCurrent = ref.watch(currentTrackIdProvider) == track.id;
    final isPlaying =
        isCurrent &&
        ref.watch(playbackStatusProvider.select((s) => s.showPause));
    final theme = Theme.of(context);

    Widget leading;
    if (leadingNumber != null) {
      leading = SizedBox(
        width: 32,
        child: Center(
          child: isCurrent
              ? EqualizerBars(animating: isPlaying, size: 14)
              : Text('$leadingNumber', style: theme.textTheme.bodyMedium),
        ),
      );
    } else if (showArtwork) {
      leading = Stack(
        alignment: Alignment.center,
        children: [
          ArtworkImage(
            path: track.artworkPath,
            seed: track.displayAlbum,
            size: 48,
            radius: 6,
          ),
          if (isCurrent)
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.45),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Center(
                child: EqualizerBars(animating: isPlaying, size: 16),
              ),
            ),
        ],
      );
    } else {
      leading = const SizedBox.shrink();
    }

    final subtitle = [
      track.displayArtist,
      if (showDuration && track.duration > Duration.zero)
        formatDuration(track.duration),
    ].join(' · ');

    return InkWell(
      onTap: onTap,
      onLongPress: () =>
          showTrackActions(context, ref, track, playlistId: playlistId),
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.gutter,
          vertical: 7,
        ),
        child: Row(
          children: [
            leading,
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    track.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontSize: 15,
                      color: isCurrent ? AppColors.mint : AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Row(
                    children: [
                      if (track.isFavorite) ...[
                        const Icon(
                          Icons.favorite_rounded,
                          size: 13,
                          color: AppColors.mint,
                        ),
                        const SizedBox(width: 4),
                      ],
                      Expanded(
                        child: Text(
                          subtitle,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: theme.textTheme.bodySmall?.copyWith(
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            ?trailing,
            IconButton(
              tooltip: 'More options',
              icon: const Icon(
                Icons.more_vert_rounded,
                color: AppColors.textSecondary,
              ),
              onPressed: () =>
                  showTrackActions(context, ref, track, playlistId: playlistId),
            ),
          ],
        ),
      ),
    );
  }
}
