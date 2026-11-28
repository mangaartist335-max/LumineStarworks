import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/playlist.dart';
import '../../state/library_providers.dart';
import '../../state/playlist_providers.dart';
import 'artwork.dart';

/// Asks for a playlist name. Returns null if cancelled.
Future<String?> askPlaylistName(
  BuildContext context, {
  String title = 'New playlist',
  String initialName = '',
  String confirmLabel = 'Create',
}) {
  return showDialog<String>(
    context: context,
    useRootNavigator: true,
    builder: (context) => _PlaylistNameDialog(
      title: title,
      initialName: initialName,
      confirmLabel: confirmLabel,
    ),
  );
}

class _PlaylistNameDialog extends StatefulWidget {
  const _PlaylistNameDialog({
    required this.title,
    required this.initialName,
    required this.confirmLabel,
  });

  final String title;
  final String initialName;
  final String confirmLabel;

  @override
  State<_PlaylistNameDialog> createState() => _PlaylistNameDialogState();
}

class _PlaylistNameDialogState extends State<_PlaylistNameDialog> {
  late final _controller = TextEditingController(text: widget.initialName);

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _submit() {
    final name = _controller.text.trim();
    Navigator.of(context).pop(name.isEmpty ? 'My playlist' : name);
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: Text(widget.title),
      content: TextField(
        controller: _controller,
        autofocus: true,
        maxLength: 60,
        textCapitalization: TextCapitalization.sentences,
        decoration: const InputDecoration(
          hintText: 'Give it a name',
          counterText: '',
        ),
        onSubmitted: (_) => _submit(),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(),
          style: TextButton.styleFrom(foregroundColor: AppColors.textSecondary),
          child: const Text('Cancel'),
        ),
        FilledButton(onPressed: _submit, child: Text(widget.confirmLabel)),
      ],
    );
  }
}

/// A simple yes/no confirmation.
Future<bool> confirmAction(
  BuildContext context, {
  required String title,
  required String message,
  required String confirmLabel,
}) async {
  final result = await showDialog<bool>(
    context: context,
    useRootNavigator: true,
    builder: (context) => AlertDialog(
      title: Text(title),
      content: Text(message),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(context).pop(false),
          style: TextButton.styleFrom(foregroundColor: AppColors.textSecondary),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: () => Navigator.of(context).pop(true),
          style: FilledButton.styleFrom(
            backgroundColor: AppColors.danger,
            foregroundColor: Colors.white,
          ),
          child: Text(confirmLabel),
        ),
      ],
    ),
  );
  return result ?? false;
}

/// Creates a playlist, optionally starting with [trackIds].
Future<Playlist?> createPlaylistFlow(
  BuildContext context,
  WidgetRef ref, {
  List<String> trackIds = const [],
}) async {
  final name = await askPlaylistName(context);
  if (name == null) return null;
  final playlist = await ref
      .read(playlistsProvider.notifier)
      .create(name, trackIds: trackIds);
  if (context.mounted) {
    ScaffoldMessenger.maybeOf(context)
        ?.showSnackBar(SnackBar(content: Text('Created "${playlist.name}"')));
  }
  return playlist;
}

/// Lets the user pick a playlist (or make a new one) for [trackIds].
Future<void> showAddToPlaylistSheet(
  BuildContext context,
  WidgetRef ref,
  List<String> trackIds,
) {
  return showModalBottomSheet<void>(
    context: context,
    useRootNavigator: true,
    isScrollControlled: true,
    builder: (sheetContext) =>
        _AddToPlaylistSheet(trackIds: trackIds, hostContext: context),
  );
}

class _AddToPlaylistSheet extends ConsumerWidget {
  const _AddToPlaylistSheet({
    required this.trackIds,
    required this.hostContext,
  });

  final List<String> trackIds;
  final BuildContext hostContext;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final playlists = ref.watch(playlistListProvider);
    final tracksById = ref.watch(tracksByIdProvider);
    final theme = Theme.of(context);

    void snack(String message) {
      if (hostContext.mounted) {
        ScaffoldMessenger.maybeOf(hostContext)
            ?.showSnackBar(SnackBar(content: Text(message)));
      }
    }

    return SafeArea(
      child: ConstrainedBox(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.sizeOf(context).height * 0.7,
        ),
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
              child: Text('Add to playlist', style: theme.textTheme.titleLarge),
            ),
            ListTile(
              contentPadding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.xl,
              ),
              leading: Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: AppColors.mintSoft,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Icon(Icons.add_rounded, color: AppColors.mint),
              ),
              title: const Text(
                'New playlist',
                style: TextStyle(fontWeight: FontWeight.w700),
              ),
              onTap: () async {
                Navigator.of(context).pop();
                await createPlaylistFlow(hostContext, ref, trackIds: trackIds);
              },
            ),
            Flexible(
              child: ListView(
                shrinkWrap: true,
                children: [
                  for (final playlist in playlists)
                    ListTile(
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.xl,
                      ),
                      leading: ArtworkImage(
                        path: playlist.trackIds
                            .map((id) => tracksById[id]?.artworkPath)
                            .nonNulls
                            .firstOrNull,
                        seed: playlist.name,
                        size: 48,
                        radius: 6,
                        icon: Icons.queue_music_rounded,
                      ),
                      title: Text(
                        playlist.name,
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      subtitle: Text(formatSongCount(playlist.length)),
                      onTap: () async {
                        Navigator.of(context).pop();
                        final added = await ref
                            .read(playlistsProvider.notifier)
                            .addTracks(playlist.id, trackIds);
                        snack(
                          added == 0
                              ? 'Already in "${playlist.name}"'
                              : 'Added to "${playlist.name}"',
                        );
                      },
                    ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
          ],
        ),
      ),
    );
  }
}
