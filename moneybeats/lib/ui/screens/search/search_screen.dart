import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/formatters.dart';
import '../../../state/core_providers.dart';
import '../../../state/library_providers.dart';
import '../../navigation.dart';
import '../../widgets/artwork.dart';
import '../../widgets/common.dart';
import '../../widgets/pressable.dart';
import '../../widgets/track_tile.dart';
import '../collection/collection_screen.dart';
import '../library/library_screen.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  late final _controller = TextEditingController(
    text: ref.read(searchQueryProvider),
  );

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final query = ref.watch(searchQueryProvider);
    final results = ref.watch(searchResultsProvider);
    final hasLibrary = ref.watch(libraryTracksProvider).isNotEmpty;
    final audio = ref.read(audioPlayerServiceProvider);
    final theme = Theme.of(context);

    void open(CollectionRef c) => AppNav.openCollection(context, ref, c);

    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: CustomScrollView(
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.gutter,
                  AppSpacing.lg,
                  AppSpacing.gutter,
                  AppSpacing.md,
                ),
                child: Text('Search', style: theme.textTheme.headlineSmall),
              ),
            ),
            SliverPersistentHeader(
              pinned: true,
              delegate: _SearchFieldHeader(
                child: Container(
                  color: AppColors.background,
                  alignment: Alignment.center,
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.gutter,
                    AppSpacing.xs,
                    AppSpacing.gutter,
                    AppSpacing.sm,
                  ),
                  child: TextField(
                    controller: _controller,
                    onChanged: ref.read(searchQueryProvider.notifier).set,
                    textInputAction: TextInputAction.search,
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w600,
                    ),
                    decoration: InputDecoration(
                      hintText: 'Songs, artists or albums',
                      prefixIcon: const Icon(Icons.search_rounded),
                      suffixIcon: query.isEmpty
                          ? null
                          : IconButton(
                              tooltip: 'Clear',
                              icon: const Icon(Icons.close_rounded),
                              onPressed: () {
                                _controller.clear();
                                ref.read(searchQueryProvider.notifier).set('');
                              },
                            ),
                    ),
                  ),
                ),
              ),
            ),
            if (query.trim().isEmpty)
              ..._browse(context, open, hasLibrary)
            else if (results.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: EmptyState(
                  icon: Icons.search_off_rounded,
                  title: 'No matches for "$query"',
                  message:
                      'Check the spelling, or try an artist or album name.',
                ),
              )
            else ...[
              if (results.tracks.isNotEmpty) ...[
                const SliverToBoxAdapter(child: SectionHeader(title: 'Songs')),
                SliverList.builder(
                  itemCount: results.tracks.length.clamp(0, 50),
                  itemBuilder: (context, i) => TrackTile(
                    track: results.tracks[i],
                    onTap: () => audio.playTracks(
                      results.tracks,
                      startIndex: i,
                      sourceLabel: 'Search · $query',
                    ),
                  ),
                ),
              ],
              if (results.artists.isNotEmpty) ...[
                const SliverToBoxAdapter(
                  child: SectionHeader(title: 'Artists'),
                ),
                SliverList.builder(
                  itemCount: results.artists.length,
                  itemBuilder: (context, i) {
                    final artist = results.artists[i];
                    return ListTile(
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.gutter,
                      ),
                      leading: ArtworkImage(
                        path: artist.artworkPath,
                        seed: artist.name,
                        size: 48,
                        radius: 24,
                        icon: Icons.person_rounded,
                      ),
                      title: Text(
                        artist.name,
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      subtitle: Text(
                        'Artist · ${formatSongCount(artist.tracks.length)}',
                      ),
                      onTap: () => open(CollectionRef.artist(artist.name)),
                    );
                  },
                ),
              ],
              if (results.albums.isNotEmpty) ...[
                const SliverToBoxAdapter(child: SectionHeader(title: 'Albums')),
                SliverList.builder(
                  itemCount: results.albums.length,
                  itemBuilder: (context, i) {
                    final album = results.albums[i];
                    return ListTile(
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.gutter,
                      ),
                      leading: ArtworkImage(
                        path: album.artworkPath,
                        seed: album.title,
                        size: 48,
                        radius: 6,
                      ),
                      title: Text(
                        album.title,
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      subtitle: Text('Album · ${album.artist}'),
                      onTap: () => open(CollectionRef.album(album.key)),
                    );
                  },
                ),
              ],
              const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.xxl)),
            ],
          ],
        ),
      ),
    );
  }

  List<Widget> _browse(
    BuildContext context,
    void Function(CollectionRef) open,
    bool hasLibrary,
  ) {
    final shell = ref.read(shellControllerProvider);
    void openLibrary(LibraryFilter filter) {
      ref.read(libraryFilterProvider.notifier).set(filter);
      shell.selectTab(AppTab.library);
    }

    final tiles = <(String, IconData, List<Color>, VoidCallback)>[
      (
        'All songs',
        Icons.library_music_rounded,
        const [Color(0xFF1FB985), Color(0xFF0E5A47)],
        () => open(const CollectionRef.allSongs()),
      ),
      (
        'Liked songs',
        Icons.favorite_rounded,
        const [Color(0xFF7C5CFF), Color(0xFF3A2896)],
        () => open(const CollectionRef.likedSongs()),
      ),
      (
        'Albums',
        Icons.album_rounded,
        const [Color(0xFFFF8A4C), Color(0xFFA2304A)],
        () => openLibrary(LibraryFilter.albums),
      ),
      (
        'Artists',
        Icons.mic_external_on_rounded,
        const [Color(0xFF3BA7FF), Color(0xFF1A4D99)],
        () => openLibrary(LibraryFilter.artists),
      ),
      (
        'Recently added',
        Icons.auto_awesome_rounded,
        const [Color(0xFFFF5FA2), Color(0xFF7A2A8C)],
        () => open(const CollectionRef.recentlyAdded()),
      ),
      (
        'Recently played',
        Icons.history_rounded,
        const [Color(0xFFD9B65B), Color(0xFF8A5A1A)],
        () => open(const CollectionRef.recentlyPlayed()),
      ),
    ];

    return [
      SliverToBoxAdapter(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.gutter,
            AppSpacing.lg,
            AppSpacing.gutter,
            AppSpacing.md,
          ),
          child: Text(
            hasLibrary
                ? 'Browse your library'
                : 'Import music to start searching',
            style: Theme.of(context).textTheme.titleMedium,
          ),
        ),
      ),
      SliverPadding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.gutter),
        sliver: SliverGrid(
          gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
            maxCrossAxisExtent: 240,
            mainAxisSpacing: AppSpacing.md,
            crossAxisSpacing: AppSpacing.md,
            childAspectRatio: 1.7,
          ),
          delegate: SliverChildListDelegate([
            for (final (label, icon, colors, onTap) in tiles)
              Pressable(
                onTap: onTap,
                semanticLabel: label,
                child: Container(
                  padding: const EdgeInsets.all(AppSpacing.md),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(AppRadius.md),
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: colors,
                    ),
                  ),
                  child: Stack(
                    children: [
                      Text(
                        label,
                        style: const TextStyle(
                          fontWeight: FontWeight.w800,
                          fontSize: 16,
                        ),
                      ),
                      Align(
                        alignment: Alignment.bottomRight,
                        child: Transform.rotate(
                          angle: 0.35,
                          child: Icon(
                            icon,
                            size: 44,
                            color: Colors.white.withValues(alpha: 0.85),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ]),
        ),
      ),
      const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.xxl)),
    ];
  }
}

class _SearchFieldHeader extends SliverPersistentHeaderDelegate {
  _SearchFieldHeader({required this.child});

  final Widget child;

  @override
  double get minExtent => 64;
  @override
  double get maxExtent => 64;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) => SizedBox.expand(child: child);

  @override
  bool shouldRebuild(_SearchFieldHeader oldDelegate) =>
      oldDelegate.child != child;
}
