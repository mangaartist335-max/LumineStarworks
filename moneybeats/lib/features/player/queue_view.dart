import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';
import 'package:moneybeats/core/constants/layout.dart';
import 'package:moneybeats/core/providers.dart';
import 'package:moneybeats/core/theme/app_colors.dart';
import 'package:moneybeats/core/utilities/formatters.dart';
import 'package:moneybeats/features/player/playback_providers.dart';
import 'package:moneybeats/models/track.dart';
import 'package:moneybeats/widgets/artwork.dart';
import 'package:moneybeats/widgets/equalizer_bars.dart';

/// The playback queue: what's playing now and what comes next.
/// Drag to reorder (when shuffle is off), swipe to remove, tap to jump.
class QueueView extends ConsumerWidget {
  const QueueView({
    super.key,
    this.scrollController,
    this.padding = EdgeInsets.zero,
  });

  final ScrollController? scrollController;
  final EdgeInsets padding;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final queue = ref.watch(queueStateProvider);
    final isPlaying = ref.watch(
      playbackStatusProvider.select((s) => s.showPause),
    );
    final audio = ref.read(audioPlayerServiceProvider);
    final theme = Theme.of(context);
    final current = queue.currentTrack;
    final upNext = queue.upNextIndices;

    if (current == null) {
      return Center(
        child: Text('Your queue is empty', style: theme.textTheme.bodyMedium),
      );
    }

    Widget header(String text) => Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.gutter,
        AppSpacing.lg,
        AppSpacing.gutter,
        AppSpacing.sm,
      ),
      child: Text(text, style: theme.textTheme.titleMedium),
    );

    return CustomScrollView(
      controller: scrollController,
      slivers: [
        SliverPadding(padding: EdgeInsets.only(top: padding.top)),
        SliverToBoxAdapter(child: header('Now playing')),
        SliverToBoxAdapter(
          child: _QueueRow(
            track: current,
            highlight: true,
            leading: EqualizerBars(animating: isPlaying, size: 16),
          ),
        ),
        SliverToBoxAdapter(
          child: Row(
            children: [
              Expanded(
                child: header(
                  queue.shuffleEnabled ? 'Next up (shuffled)' : 'Next up',
                ),
              ),
              if (upNext.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(
                    right: AppSpacing.gutter,
                    top: AppSpacing.sm,
                  ),
                  child: Text(
                    formatSongCount(upNext.length),
                    style: theme.textTheme.bodySmall,
                  ),
                ),
            ],
          ),
        ),
        if (upNext.isEmpty)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.gutter,
                vertical: AppSpacing.md,
              ),
              child: Text(
                'Nothing else queued. Add songs with "Add to queue".',
                style: theme.textTheme.bodySmall,
              ),
            ),
          )
        else
          SliverReorderableList(
            itemCount: upNext.length,
            onReorderItem: (oldIndex, newIndex) {
              final from = upNext[oldIndex];
              final to = upNext[newIndex];
              audio.moveInQueue(from, to);
            },
            itemBuilder: (context, i) {
              final queueIndex = upNext[i];
              final track = queue.tracks[queueIndex];
              return Dismissible(
                key: ValueKey('queue-$queueIndex-${track.id}'),
                direction: DismissDirection.endToStart,
                background: Container(
                  color: AppColors.danger.withValues(alpha: 0.25),
                  alignment: Alignment.centerRight,
                  padding: const EdgeInsets.only(right: AppSpacing.xl),
                  child: const Icon(
                    Icons.remove_circle_outline_rounded,
                    color: AppColors.danger,
                  ),
                ),
                onDismissed: (_) => audio.removeFromQueue(queueIndex),
                child: Material(
                  type: MaterialType.transparency,
                  child: _QueueRow(
                    track: track,
                    onTap: () => audio.skipToQueueIndex(queueIndex),
                    trailing: queue.shuffleEnabled
                        ? null
                        : ReorderableDragStartListener(
                            index: i,
                            child: const Padding(
                              padding: EdgeInsets.all(AppSpacing.sm),
                              child: Icon(
                                Icons.drag_handle_rounded,
                                color: AppColors.textMuted,
                              ),
                            ),
                          ),
                  ),
                ),
              );
            },
          ),
        SliverPadding(
          padding: EdgeInsets.only(bottom: padding.bottom + AppSpacing.xl),
        ),
      ],
    );
  }
}

class _QueueRow extends StatelessWidget {
  const _QueueRow({
    required this.track,
    this.onTap,
    this.trailing,
    this.leading,
    this.highlight = false,
  });

  final Track track;
  final VoidCallback? onTap;
  final Widget? trailing;
  final Widget? leading;
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.gutter,
          vertical: 6,
        ),
        child: Row(
          children: [
            ArtworkImage(
              path: track.artworkPath,
              seed: track.displayAlbum,
              size: 44,
              radius: 6,
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
                    style: theme.textTheme.titleSmall?.copyWith(
                      color: highlight ? AppColors.primary : AppColors.textPrimary,
                    ),
                  ),
                  Text(
                    track.displayArtist,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            if (leading != null)
              Padding(
                padding: const EdgeInsets.all(AppSpacing.sm),
                child: leading,
              ),
            ?trailing,
          ],
        ),
      ),
    );
  }
}
