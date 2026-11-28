import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';
import 'package:moneybeats/core/constants/layout.dart';
import 'package:moneybeats/core/navigation.dart';
import 'package:moneybeats/core/providers.dart';
import 'package:moneybeats/core/theme/app_colors.dart';
import 'package:moneybeats/core/utilities/formatters.dart';
import 'package:moneybeats/features/library/collection_screen.dart';
import 'package:moneybeats/features/library/import_actions.dart';
import 'package:moneybeats/features/library/import_controller.dart';
import 'package:moneybeats/features/library/library_providers.dart';
import 'package:moneybeats/features/library/playlist_dialogs.dart';
import 'package:moneybeats/features/library/playlist_providers.dart';
import 'package:moneybeats/models/track.dart';
import 'package:moneybeats/widgets/app_logo.dart';
import 'package:moneybeats/widgets/common.dart';
import 'package:moneybeats/widgets/media_card.dart';
import 'package:moneybeats/widgets/track_actions_sheet.dart';

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
        iconBackground: AppColors.electric,
        onTap: () => open(const CollectionRef.likedSongs()),
      ),
      QuickTile(
        label: 'Recently played',
        icon: Icons.history_rounded,
        iconBackground: const Color(0xFF24406B),
        onTap: () => open(const CollectionRef.recentlyPlayed()),
      ),
      QuickTile(
        label: 'Recently added',
        icon: Icons.auto_awesome_rounded,
        iconBackground: const Color(0xFF1B5E8C),
        onTap: () => open(const CollectionRef.recentlyAdded()),
      ),
      QuickTile(
        label: importing ? 'Importing…' : 'Import music',
        icon: Icons.add_rounded,
        iconBackground: const Color(0xFF33415C),
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
            colors: [Color(0xFF14336E), AppColors.backgroundSecondary],
          ),
          border: Border.all(color: AppColors.ice.withValues(alpha: 0.25)),
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
                        color: AppColors.onPrimary,
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
