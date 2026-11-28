import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../data/models/track.dart';
import '../../../state/core_providers.dart';
import '../../../state/import_controller.dart';
import '../../../state/library_providers.dart';
import '../../../state/playlist_providers.dart';
import '../../navigation.dart';
import '../../widgets/app_logo.dart';
import '../../widgets/common.dart';
import '../../widgets/import_actions.dart';
import '../../widgets/media_card.dart';
import '../../widgets/playlist_dialogs.dart';
import '../../widgets/track_actions_sheet.dart';
import '../collection/collection_screen.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final library = ref.watch(libraryProvider);
    final tracks = library.value ?? const <Track>[];
    final recentlyPlayed = ref.watch(recentlyPlayedProvider);
    final recentlyAdded = ref.watch(recentlyAddedProvider);
    final favorites = ref.watch(favoritesProvider);
    final playlists = ref.watch(playlistListProvider);
    final tracksById = ref.watch(tracksByIdProvider);
    final importing = ref.watch(
      importControllerProvider.select((s) => s.importing),
    );
    final audio = ref.read(audioPlayerServiceProvider);
    final isDesktop =
        MediaQuery.sizeOf(context).width >= AppBreakpoints.desktop;
    final theme = Theme.of(context);

    void open(CollectionRef collection) =>
        AppNav.openCollection(context, ref, collection);

    Widget trackCarousel(List<Track> list, String label) => MediaCarousel(
      itemCount: list.length,
      itemBuilder: (context, i) {
        final t = list[i];
        return MediaCard(
          title: t.title,
          subtitle: t.displayArtist,
          artworkPath: t.artworkPath,
          seed: t.displayAlbum,
          onTap: () =>
              audio.playTracks(list, startIndex: i, sourceLabel: label),
          onLongPress: () => showTrackActions(context, ref, t),
        );
      },
    );

    final quickTiles = <Widget>[
      QuickTile(
        label: 'Liked songs',
        icon: Icons.favorite_rounded,
        iconBackground: const Color(0xFF5B3FD1),
        onTap: () => open(const CollectionRef.likedSongs()),
      ),
      QuickTile(
        label: 'Recently played',
        icon: Icons.history_rounded,
        iconBackground: const Color(0xFF2D4A5C),
        onTap: () => open(const CollectionRef.recentlyPlayed()),
      ),
      QuickTile(
        label: 'Recently added',
        icon: Icons.new_releases_rounded,
        iconBackground: const Color(0xFF1E6B57),
        onTap: () => open(const CollectionRef.recentlyAdded()),
      ),
      QuickTile(
        label: importing ? 'Importing…' : 'Import music',
        icon: Icons.add_rounded,
        iconBackground: const Color(0xFF6B4E2E),
        onTap: () => startImport(context, ref),
      ),
      for (final playlist in playlists.take(isDesktop ? 4 : 2))
        QuickTile(
          label: playlist.name,
          artworkPath: playlist.trackIds
              .map((id) => tracksById[id]?.artworkPath)
              .nonNulls
              .firstOrNull,
          seed: playlist.name,
          onTap: () => open(CollectionRef.playlist(playlist.id)),
        ),
    ];

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverSafeArea(
            bottom: false,
            sliver: SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.gutter,
                  AppSpacing.lg,
                  AppSpacing.sm,
                  AppSpacing.sm,
                ),
                child: Row(
                  children: [
                    if (!isDesktop) ...[
                      const AppLogoMark(size: 24),
                      const SizedBox(width: AppSpacing.md),
                    ],
                    Expanded(
                      child: Text(
                        greetingFor(DateTime.now()),
                        style: theme.textTheme.headlineSmall,
                      ),
                    ),
                    IconButton(
                      tooltip: 'Import music',
                      onPressed: () => startImport(context, ref),
                      icon: const Icon(Icons.add_circle_outline_rounded),
                    ),
                  ],
                ),
              ),
            ),
          ),
          if (library.isLoading && tracks.isEmpty)
            const SliverFillRemaining(
              child: Center(child: CircularProgressIndicator()),
            )
          else if (tracks.isEmpty)
            SliverToBoxAdapter(child: _WelcomeCard(importing: importing))
          else ...[
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.gutter,
                AppSpacing.md,
                AppSpacing.gutter,
                0,
              ),
              sliver: SliverGrid.count(
                crossAxisCount: isDesktop ? 4 : 2,
                mainAxisSpacing: AppSpacing.sm,
                crossAxisSpacing: AppSpacing.sm,
                childAspectRatio: isDesktop ? 4.2 : 2.9,
                children: quickTiles,
              ),
            ),
            if (recentlyPlayed.isNotEmpty) ...[
              SliverToBoxAdapter(
                child: SectionHeader(
                  title: 'Jump back in',
                  actionLabel: 'See all',
                  onAction: () => open(const CollectionRef.recentlyPlayed()),
                ),
              ),
              SliverToBoxAdapter(
                child: trackCarousel(
                  recentlyPlayed,
                  'Collection · Recently played',
                ),
              ),
            ],
            SliverToBoxAdapter(
              child: SectionHeader(
                title: 'Recently added',
                actionLabel: 'See all',
                onAction: () => open(const CollectionRef.recentlyAdded()),
              ),
            ),
            SliverToBoxAdapter(
              child: trackCarousel(
                recentlyAdded,
                'Collection · Recently added',
              ),
            ),
            if (favorites.isNotEmpty) ...[
              SliverToBoxAdapter(
                child: SectionHeader(
                  title: 'Your favorites',
                  actionLabel: 'See all',
                  onAction: () => open(const CollectionRef.likedSongs()),
                ),
              ),
              SliverToBoxAdapter(
                child: trackCarousel(favorites, 'Playlist · Liked songs'),
              ),
            ],
            const SliverToBoxAdapter(
              child: SectionHeader(title: 'Your playlists'),
            ),
            SliverToBoxAdapter(
              child: MediaCarousel(
                itemCount: playlists.length + 1,
                itemBuilder: (context, i) {
                  if (i == playlists.length) {
                    return MediaCard(
                      title: 'New playlist',
                      subtitle: 'Make it yours',
                      artworkPath: null,
                      seed: 'new-playlist',
                      icon: Icons.add_rounded,
                      onTap: () async {
                        final playlist = await createPlaylistFlow(context, ref);
                        if (playlist != null && context.mounted) {
                          open(CollectionRef.playlist(playlist.id));
                        }
                      },
                    );
                  }
                  final playlist = playlists[i];
                  return MediaCard(
                    title: playlist.name,
                    subtitle: 'Playlist · ${formatSongCount(playlist.length)}',
                    artworkPath: playlist.trackIds
                        .map((id) => tracksById[id]?.artworkPath)
                        .nonNulls
                        .firstOrNull,
                    seed: playlist.name,
                    icon: Icons.queue_music_rounded,
                    onTap: () => open(CollectionRef.playlist(playlist.id)),
                  );
                },
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.xxl)),
          ],
        ],
      ),
    );
  }
}

class _WelcomeCard extends ConsumerWidget {
  const _WelcomeCard({required this.importing});

  final bool importing;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.gutter),
      child: Container(
        padding: const EdgeInsets.all(AppSpacing.xl),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(AppRadius.lg),
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF14523F), Color(0xFF15191B)],
          ),
          border: Border.all(color: AppColors.mint.withValues(alpha: 0.25)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const AppLogoMark(size: 40),
            const SizedBox(height: AppSpacing.xl),
            Text(
              'Your music, beautifully offline',
              style: theme.textTheme.headlineSmall,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Import MP3s from your device. MoneyBeats keeps its own copy, reads the song details '
              'and artwork, and plays them anytime, no internet needed.',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: AppColors.textSecondary,
                height: 1.45,
              ),
            ),
            const SizedBox(height: AppSpacing.xl),
            FilledButton.icon(
              onPressed: importing ? null : () => startImport(context, ref),
              icon: importing
                  ? const SizedBox.square(
                      dimension: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppColors.onMint,
                      ),
                    )
                  : const Icon(Icons.library_add_rounded),
              label: Text(importing ? 'Importing…' : 'Import music'),
            ),
          ],
        ),
      ),
    );
  }
}
