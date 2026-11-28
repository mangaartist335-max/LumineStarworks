import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';
import 'package:moneybeats/core/constants/layout.dart';
import 'package:moneybeats/core/navigation.dart';
import 'package:moneybeats/core/providers.dart';
import 'package:moneybeats/core/theme/app_colors.dart';
import 'package:moneybeats/features/library/collection_screen.dart';
import 'package:moneybeats/features/library/library_providers.dart';
import 'package:moneybeats/features/library/playlist_dialogs.dart';
import 'package:moneybeats/features/library/playlist_providers.dart';
import 'package:moneybeats/models/track.dart';
import 'package:moneybeats/widgets/artwork.dart';

void showSnack(BuildContext context, String message) {
  ScaffoldMessenger.maybeOf(context)
    ?..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(content: Text(message), duration: const Duration(seconds: 3)),
    );
}

/// The long-press / "more" menu for a song.
Future<void> showTrackActions(
  BuildContext context,
  WidgetRef ref,
  Track track, {
  String? playlistId,
}) {
  return showModalBottomSheet<void>(
    context: context,
    useRootNavigator: true,
    isScrollControlled: true,
    builder: (sheetContext) => _TrackActionsSheet(
      track: track,
      playlistId: playlistId,
      hostContext: context,
    ),
  );
}

class _TrackActionsSheet extends ConsumerWidget {
  const _TrackActionsSheet({
    required this.track,
    required this.hostContext,
    this.playlistId,
  });

  final Track track;
  final String? playlistId;

  /// The context that opened the sheet, still mounted after it closes.
  final BuildContext hostContext;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final live =
        ref.watch(tracksByIdProvider.select((m) => m[track.id])) ?? track;
    final audio = ref.read(audioPlayerServiceProvider);
    final theme = Theme.of(context);

    void close() => Navigator.of(context).pop();

    return SafeArea(
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.xl,
                0,
                AppSpacing.xl,
                AppSpacing.md,
              ),
              child: Row(
                children: [
                  ArtworkImage(
                    path: live.artworkPath,
                    seed: live.displayAlbum,
                    size: 56,
                    radius: 8,
                  ),
                  const SizedBox(width: AppSpacing.lg),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          live.title,
                          style: theme.textTheme.titleMedium,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          live.displayArtist,
                          style: theme.textTheme.bodyMedium,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const Divider(),
            _Action(
              icon: live.isFavorite
                  ? Icons.favorite_rounded
                  : Icons.favorite_border_rounded,
              iconColor: live.isFavorite ? AppColors.mint : null,
              label: live.isFavorite
                  ? 'Remove from Liked songs'
                  : 'Add to Liked songs',
              onTap: () {
                close();
                ref.read(libraryProvider.notifier).toggleFavorite(live);
              },
            ),
            _Action(
              icon: Icons.queue_play_next_rounded,
              label: 'Play next',
              onTap: () {
                close();
                audio.playNext([live]);
                showSnack(hostContext, 'Playing next');
              },
            ),
            _Action(
              icon: Icons.queue_music_rounded,
              label: 'Add to queue',
              onTap: () {
                close();
                audio.addToQueue([live]);
                showSnack(hostContext, 'Added to queue');
              },
            ),
            _Action(
              icon: Icons.playlist_add_rounded,
              label: 'Add to playlist',
              onTap: () {
                close();
                showAddToPlaylistSheet(hostContext, ref, [live.id]);
              },
            ),
            if (playlistId != null)
              _Action(
                icon: Icons.remove_circle_outline_rounded,
                label: 'Remove from this playlist',
                onTap: () {
                  close();
                  ref
                      .read(playlistsProvider.notifier)
                      .removeTrack(playlistId!, live.id);
                },
              ),
            _Action(
              icon: Icons.album_rounded,
              label: 'Go to album',
              onTap: () {
                close();
                AppNav.openCollection(
                  hostContext,
                  ref,
                  CollectionRef.album(live.albumKey),
                );
              },
            ),
            _Action(
              icon: Icons.person_rounded,
              label: 'Go to artist',
              onTap: () {
                close();
                AppNav.openCollection(
                  hostContext,
                  ref,
                  CollectionRef.artist(live.displayArtist),
                );
              },
            ),
            _Action(
              icon: Icons.delete_outline_rounded,
              iconColor: AppColors.danger,
              label: 'Remove from library',
              onTap: () async {
                close();
                final confirmed = await confirmAction(
                  hostContext,
                  title: 'Remove this song?',
                  message:
                      '"${live.title}" will be removed from your library and from MoneyBeats storage. '
                      'The original file you imported is not touched.',
                  confirmLabel: 'Remove',
                );
                if (confirmed) {
                  await ref.read(libraryProvider.notifier).deleteTrack(live);
                  if (hostContext.mounted) {
                    showSnack(hostContext, 'Removed "${live.title}"');
                  }
                }
              },
            ),
            const SizedBox(height: AppSpacing.sm),
          ],
        ),
      ),
    );
  }
}

class _Action extends StatelessWidget {
  const _Action({
    required this.icon,
    required this.label,
    required this.onTap,
    this.iconColor,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? iconColor;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: iconColor ?? AppColors.textSecondary),
      title: Text(label, style: const TextStyle(fontWeight: FontWeight.w600)),
      contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
      onTap: onTap,
    );
  }
}
