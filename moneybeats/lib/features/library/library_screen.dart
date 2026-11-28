import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';
import 'package:moneybeats/core/constants/layout.dart';
import 'package:moneybeats/core/navigation.dart';
import 'package:moneybeats/core/providers.dart';
import 'package:moneybeats/core/theme/app_colors.dart';
import 'package:moneybeats/core/utilities/formatters.dart';
import 'package:moneybeats/features/library/collection_screen.dart';
import 'package:moneybeats/features/library/import_actions.dart';
import 'package:moneybeats/features/library/library_providers.dart';
import 'package:moneybeats/features/library/playlist_dialogs.dart';
import 'package:moneybeats/features/library/playlist_providers.dart';
import 'package:moneybeats/models/library_query.dart';
import 'package:moneybeats/widgets/artwork.dart';
import 'package:moneybeats/widgets/common.dart';
import 'package:moneybeats/widgets/media_card.dart';
import 'package:moneybeats/widgets/track_tile.dart';

enum LibraryFilter {
  songs('Songs'),
  albums('Albums'),
  artists('Artists'),
  playlists('Playlists');

  const LibraryFilter(this.label);
  final String label;
}

class LibraryFilterNotifier extends Notifier<LibraryFilter> {
  @override
  LibraryFilter build() => LibraryFilter.songs;
  void set(LibraryFilter filter) => state = filter;
}

final libraryFilterProvider =
    NotifierProvider<LibraryFilterNotifier, LibraryFilter>(
      LibraryFilterNotifier.new,
    );

class LibraryScreen extends ConsumerWidget {
  const LibraryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filter = ref.watch(libraryFilterProvider);
    final library = ref.watch(libraryProvider);
    final isEmpty = (library.value ?? const []).isEmpty;
    final theme = Theme.of(context);

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.gutter,
                AppSpacing.lg,
                AppSpacing.sm,
                AppSpacing.sm,
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'Your Library',
                      style: theme.textTheme.headlineSmall,
                    ),
                  ),
                  IconButton(
                    tooltip: 'New playlist',
                    onPressed: () => createPlaylistFlow(context, ref),
                    icon: const Icon(Icons.playlist_add_rounded),
                  ),
                  IconButton(
                    tooltip: 'Import music',
                    onPressed: () => startImport(context, ref),
                    icon: const Icon(Icons.add_circle_outline_rounded),
                  ),
                ],
              ),
            ),
            SizedBox(
              height: 44,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.gutter,
                ),
                children: [
                  for (final f in LibraryFilter.values)
                    Padding(
                      padding: const EdgeInsets.only(right: AppSpacing.sm),
                      child: ChoiceChip(
                        label: Text(f.label),
                        selected: f == filter,
                        onSelected: (_) =>
                            ref.read(libraryFilterProvider.notifier).set(f),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Expanded(
              child: library.isLoading && isEmpty
                  ? const Center(child: CircularProgressIndicator())
                  : isEmpty && filter != LibraryFilter.playlists
                  ? EmptyState(
                      icon: Icons.library_music_rounded,
                      title: 'Your library is empty',
                      message: 'Import MP3 files from your device and they will appear here.',
                      actionLabel: 'Import music',
                      actionIcon: Icons.library_add_rounded,
                      onAction: () => startImport(context, ref),
                    )
                  : AnimatedSwitcher(
                      duration: const Duration(milliseconds: 200),
                      child: switch (filter) {
                        LibraryFilter.songs => const _SongsView(
                          key: ValueKey('songs'),
                        ),
                        LibraryFilter.albums => const _AlbumsView(
                          key: ValueKey('albums'),
                        ),
                        LibraryFilter.artists => const _ArtistsView(
                          key: ValueKey('artists'),
                        ),
                        LibraryFilter.playlists => const _PlaylistsView(
                          key: ValueKey('playlists'),
                        ),
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SongsView extends ConsumerWidget {
  const _SongsView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tracks = ref.watch(sortedTracksProvider);
    final sort = ref.watch(trackSortProvider);
    final audio = ref.read(audioPlayerServiceProvider);
    final theme = Theme.of(context);
    final label = 'Library · All songs';

    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(
              AppSpacing.gutter,
              0,
              AppSpacing.sm,
              AppSpacing.xs,
            ),
            child: Row(
              children: [
                Flexible(
                  child: PopupMenuButton<TrackSort>(
                    tooltip: 'Sort songs',
                    initialValue: sort,
                    onSelected: ref.read(trackSortProvider.notifier).set,
                    itemBuilder: (context) => [
                      for (final option in TrackSort.values)
                        PopupMenuItem(
                          value: option,
                          child: Row(
                            children: [
                              Expanded(child: Text(option.label)),
                              if (option == sort)
                                const Icon(
                                  Icons.check_rounded,
                                  color: AppColors.primary,
                                  size: 18,
                                ),
                            ],
                          ),
                        ),
                    ],
                    child: Padding(
                      padding: const EdgeInsets.symmetric(
                        vertical: AppSpacing.sm,
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.swap_vert_rounded,
                            size: 18,
                            color: AppColors.textSecondary,
                          ),
                          const SizedBox(width: AppSpacing.xs),
                          Flexible(
                            child: Text(
                              sort.label,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: theme.textTheme.labelLarge,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Text(
                    formatSongCount(tracks.length),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.bodySmall,
                  ),
                ),
                IconButton(
                  tooltip: 'Shuffle all',
                  onPressed: () => audio.playTracks(
                    tracks,
                    shuffle: true,
                    sourceLabel: label,
                  ),
                  icon: const Icon(
                    Icons.shuffle_rounded,
                    color: AppColors.textSecondary,
                  ),
                ),
                BigPlayButton(
                  size: 44,
                  onPressed: () => audio.playTracks(tracks, sourceLabel: label),
                ),
              ],
            ),
          ),
        ),
        SliverList.builder(
          itemCount: tracks.length,
          itemBuilder: (context, i) => TrackTile(
            track: tracks[i],
            onTap: () =>
                audio.playTracks(tracks, startIndex: i, sourceLabel: label),
          ),
        ),
        const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.xl)),
      ],
    );
  }
}

class _AlbumsView extends ConsumerWidget {
  const _AlbumsView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final albums = ref.watch(albumsProvider);
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.gutter,
        AppSpacing.sm,
        AppSpacing.gutter,
        AppSpacing.xl,
      ),
      gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
        maxCrossAxisExtent: 200,
        mainAxisSpacing: AppSpacing.lg,
        crossAxisSpacing: AppSpacing.lg,
        childAspectRatio: 0.76,
      ),
      itemCount: albums.length,
      itemBuilder: (context, i) {
        final album = albums[i];
        return MediaCard(
          width: null,
          title: album.title,
          subtitle: album.artist,
          artworkPath: album.artworkPath,
          seed: album.title,
          icon: Icons.album_rounded,
          onTap: () => AppNav.openCollection(
            context,
            ref,
            CollectionRef.album(album.key),
          ),
        );
      },
    );
  }
}

class _ArtistsView extends ConsumerWidget {
  const _ArtistsView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final artists = ref.watch(artistsProvider);
    return ListView.builder(
      padding: const EdgeInsets.only(bottom: AppSpacing.xl),
      itemCount: artists.length,
      itemBuilder: (context, i) {
        final artist = artists[i];
        return ListTile(
          contentPadding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.gutter,
            vertical: 2,
          ),
          leading: ArtworkImage(
            path: artist.artworkPath,
            seed: artist.name,
            size: 56,
            radius: 28,
            icon: Icons.person_rounded,
          ),
          title: Text(
            artist.name,
            style: const TextStyle(fontWeight: FontWeight.w700),
          ),
          subtitle: Text(formatSongCount(artist.tracks.length)),
          onTap: () => AppNav.openCollection(
            context,
            ref,
            CollectionRef.artist(artist.name),
          ),
        );
      },
    );
  }
}

class _PlaylistsView extends ConsumerWidget {
  const _PlaylistsView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final playlists = ref.watch(playlistListProvider);
    final favorites = ref.watch(favoritesProvider);
    final tracksById = ref.watch(tracksByIdProvider);

    Widget tile({
      required Widget leading,
      required String title,
      required String subtitle,
      required VoidCallback onTap,
    }) => ListTile(
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.gutter,
        vertical: 2,
      ),
      leading: leading,
      title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
      subtitle: Text(subtitle),
      onTap: onTap,
    );

    return ListView(
      padding: const EdgeInsets.only(bottom: AppSpacing.xl),
      children: [
        tile(
          leading: Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(6),
              gradient: const LinearGradient(
                colors: [AppColors.electric, AppColors.ice],
              ),
            ),
            child: const Icon(Icons.favorite_rounded, color: Colors.white),
          ),
          title: 'Liked songs',
          subtitle: 'Playlist · ${formatSongCount(favorites.length)}',
          onTap: () => AppNav.openCollection(
            context,
            ref,
            const CollectionRef.likedSongs(),
          ),
        ),
        tile(
          leading: Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: AppColors.surfaceHigh,
              borderRadius: BorderRadius.circular(6),
            ),
            child: const Icon(Icons.add_rounded, color: AppColors.primary),
          ),
          title: 'New playlist',
          subtitle: 'Collect your favourites in one place',
          onTap: () async {
            final playlist = await createPlaylistFlow(context, ref);
            if (playlist != null && context.mounted) {
              AppNav.openCollection(
                context,
                ref,
                CollectionRef.playlist(playlist.id),
              );
            }
          },
        ),
        for (final playlist in playlists)
          tile(
            leading: ArtworkImage(
              path: playlist.trackIds
                  .map((id) => tracksById[id]?.artworkPath)
                  .nonNulls
                  .firstOrNull,
              seed: playlist.name,
              size: 56,
              radius: 6,
              icon: Icons.queue_music_rounded,
            ),
            title: playlist.name,
            subtitle: 'Playlist · ${formatSongCount(playlist.length)}',
            onTap: () => AppNav.openCollection(
              context,
              ref,
              CollectionRef.playlist(playlist.id),
            ),
          ),
      ],
    );
  }
}
