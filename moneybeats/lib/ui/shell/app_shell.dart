import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../services/audio/playback_models.dart';
import '../../state/core_providers.dart';
import '../../state/library_providers.dart';
import '../../state/playback_providers.dart';
import '../../state/playlist_providers.dart';
import '../navigation.dart';
import '../screens/collection/collection_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/library/library_screen.dart';
import '../screens/search/search_screen.dart';
import '../screens/wallet/wallet_screen.dart';
import '../widgets/app_logo.dart';
import '../widgets/artwork.dart';
import '../widgets/desktop_player_bar.dart';
import '../widgets/import_actions.dart';
import '../widgets/mini_player.dart';
import '../widgets/playlist_dialogs.dart';

/// The app frame: tab content, the persistent player and navigation.
///
/// Phones get a bottom navigation bar with the mini player above it.
/// Wide windows (desktop, tablets) get a sidebar and a full-width player bar.
class AppShell extends ConsumerStatefulWidget {
  const AppShell({super.key});

  @override
  ConsumerState<AppShell> createState() => _AppShellState();
}

class _AppShellState extends ConsumerState<AppShell>
    with SingleTickerProviderStateMixin {
  late final AnimationController _fade = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 220),
    value: 1,
  );
  AppTab? _lastTab;

  @override
  void dispose() {
    _fade.dispose();
    super.dispose();
  }

  static Widget _rootPage(AppTab tab) => switch (tab) {
    AppTab.home => const HomeScreen(),
    AppTab.search => const SearchScreen(),
    AppTab.library => const LibraryScreen(),
    AppTab.wallet => const WalletScreen(),
  };

  @override
  Widget build(BuildContext context) {
    final shell = ref.watch(shellControllerProvider);

    ref.listen<AsyncValue<PlaybackError>>(playbackErrorsProvider, (
      previous,
      next,
    ) {
      final error = next.value;
      if (error == null) return;
      ScaffoldMessenger.maybeOf(context)
        ?..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text(error.message)));
    });

    return ListenableBuilder(
      listenable: shell,
      builder: (context, _) {
        if (_lastTab != shell.tab) {
          _lastTab = shell.tab;
          _fade.forward(from: 0.35);
        }
        final tabs = FadeTransition(
          opacity: _fade,
          child: IndexedStack(
            index: shell.tab.index,
            children: [
              for (final tab in AppTab.values)
                HeroControllerScope.none(
                  child: Navigator(
                    key: shell.navigatorKeys[tab],
                    onGenerateRoute: (settings) => MaterialPageRoute<void>(
                      settings: settings,
                      builder: (_) => _rootPage(tab),
                    ),
                  ),
                ),
            ],
          ),
        );

        final wide = MediaQuery.sizeOf(context).width >= AppBreakpoints.desktop;

        return PopScope(
          canPop: false,
          onPopInvokedWithResult: (didPop, _) {
            if (didPop) return;
            if (!shell.handleBack()) SystemNavigator.pop();
          },
          child: _PlaybackShortcuts(
            child: wide
                ? _DesktopFrame(shell: shell, tabs: tabs)
                : _PhoneFrame(shell: shell, tabs: tabs),
          ),
        );
      },
    );
  }
}

class _PhoneFrame extends StatelessWidget {
  const _PhoneFrame({required this.shell, required this.tabs});

  final ShellController shell;
  final Widget tabs;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: tabs,
      bottomNavigationBar: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const ImportProgressBanner(),
          const MiniPlayer(),
          NavigationBar(
            selectedIndex: shell.tab.index,
            onDestinationSelected: (i) => shell.selectTab(AppTab.values[i]),
            destinations: [
              for (final tab in AppTab.values)
                NavigationDestination(
                  icon: Icon(tab.icon),
                  selectedIcon: Icon(tab.selectedIcon),
                  label: tab.label,
                ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DesktopFrame extends StatelessWidget {
  const _DesktopFrame({required this.shell, required this.tabs});

  final ShellController shell;
  final Widget tabs;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          Expanded(
            child: Row(
              children: [
                _Sidebar(shell: shell),
                const VerticalDivider(width: 1),
                Expanded(
                  child: Column(
                    children: [
                      Expanded(child: tabs),
                      const ImportProgressBanner(),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const DesktopPlayerBar(),
        ],
      ),
    );
  }
}

class _Sidebar extends ConsumerWidget {
  const _Sidebar({required this.shell});

  final ShellController shell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final playlists = ref.watch(playlistListProvider);
    final tracksById = ref.watch(tracksByIdProvider);
    final favorites = ref.watch(favoritesProvider);
    final theme = Theme.of(context);

    void open(CollectionRef c) => AppNav.openCollection(context, ref, c);

    return SizedBox(
      width: 260,
      child: Material(
        color: AppColors.background,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(
                AppSpacing.xl,
                AppSpacing.xl,
                AppSpacing.xl,
                AppSpacing.lg,
              ),
              child: Align(
                alignment: Alignment.centerLeft,
                child: AppLogo(size: 24),
              ),
            ),
            for (final tab in AppTab.values)
              _SidebarItem(
                icon: shell.tab == tab ? tab.selectedIcon : tab.icon,
                label: tab.label,
                selected: shell.tab == tab,
                onTap: () => shell.selectTab(tab),
              ),
            const Padding(
              padding: EdgeInsets.symmetric(
                vertical: AppSpacing.md,
                horizontal: AppSpacing.lg,
              ),
              child: Divider(),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.xl,
                0,
                AppSpacing.sm,
                AppSpacing.xs,
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text('Playlists', style: theme.textTheme.titleSmall),
                  ),
                  IconButton(
                    tooltip: 'New playlist',
                    iconSize: 20,
                    onPressed: () async {
                      final playlist = await createPlaylistFlow(context, ref);
                      if (playlist != null && context.mounted) {
                        open(CollectionRef.playlist(playlist.id));
                      }
                    },
                    icon: const Icon(
                      Icons.add_rounded,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  IconButton(
                    tooltip: 'Import music',
                    iconSize: 20,
                    onPressed: () => startImport(context, ref),
                    icon: const Icon(
                      Icons.library_add_rounded,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
                children: [
                  _SidebarPlaylist(
                    leading: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(4),
                        gradient: const LinearGradient(
                          colors: [Color(0xFF7C5CFF), Color(0xFF40E8AE)],
                        ),
                      ),
                      child: const Icon(Icons.favorite_rounded, size: 18),
                    ),
                    title: 'Liked songs',
                    subtitle: '${favorites.length} songs',
                    onTap: () => open(const CollectionRef.likedSongs()),
                  ),
                  for (final playlist in playlists)
                    _SidebarPlaylist(
                      leading: ArtworkImage(
                        path: playlist.trackIds
                            .map((id) => tracksById[id]?.artworkPath)
                            .nonNulls
                            .firstOrNull,
                        seed: playlist.name,
                        size: 40,
                        radius: 4,
                        icon: Icons.queue_music_rounded,
                      ),
                      title: playlist.name,
                      subtitle: '${playlist.length} songs',
                      onTap: () => open(CollectionRef.playlist(playlist.id)),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SidebarItem extends StatelessWidget {
  const _SidebarItem({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: 2,
      ),
      child: Material(
        color: selected ? AppColors.surfaceHigh : Colors.transparent,
        borderRadius: BorderRadius.circular(AppRadius.sm),
        child: InkWell(
          borderRadius: BorderRadius.circular(AppRadius.sm),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg,
              vertical: AppSpacing.md,
            ),
            child: Row(
              children: [
                Icon(
                  icon,
                  color: selected ? AppColors.mint : AppColors.textSecondary,
                ),
                const SizedBox(width: AppSpacing.lg),
                Text(
                  label,
                  style: TextStyle(
                    fontWeight: selected ? FontWeight.w800 : FontWeight.w600,
                    color: selected
                        ? AppColors.textPrimary
                        : AppColors.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _SidebarPlaylist extends StatelessWidget {
  const _SidebarPlaylist({
    required this.leading,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  final Widget leading;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      dense: true,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.sm),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
      leading: leading,
      title: Text(
        title,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(fontWeight: FontWeight.w600),
      ),
      subtitle: Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
      onTap: onTap,
    );
  }
}

/// Keyboard and media-key shortcuts for playback.
class _PlaybackShortcuts extends ConsumerWidget {
  const _PlaybackShortcuts({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final audio = ref.read(audioPlayerServiceProvider);
    return CallbackShortcuts(
      bindings: {
        const SingleActivator(LogicalKeyboardKey.mediaPlayPause):
            audio.togglePlayPause,
        const SingleActivator(LogicalKeyboardKey.mediaTrackNext):
            audio.skipToNext,
        const SingleActivator(LogicalKeyboardKey.mediaTrackPrevious):
            audio.skipToPrevious,
        const SingleActivator(LogicalKeyboardKey.arrowRight, control: true):
            audio.skipToNext,
        const SingleActivator(LogicalKeyboardKey.arrowLeft, control: true):
            audio.skipToPrevious,
        const SingleActivator(LogicalKeyboardKey.space, control: true):
            audio.togglePlayPause,
      },
      child: Focus(autofocus: true, child: child),
    );
  }
}
