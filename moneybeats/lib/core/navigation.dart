import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';
import 'package:moneybeats/features/library/collection_screen.dart';
import 'package:moneybeats/features/player/now_playing_screen.dart';

/// The main sections of the app.
enum AppTab {
  home('Home', Icons.home_outlined, Icons.home_rounded),
  search('Search', Icons.search_rounded, Icons.manage_search_rounded),
  library('Library', Icons.library_music_outlined, Icons.library_music_rounded),
  studio('Studio', Icons.tune_rounded, Icons.graphic_eq_rounded),
  wallet(
    'Wallet',
    Icons.account_balance_wallet_outlined,
    Icons.account_balance_wallet_rounded,
  );

  const AppTab(this.label, this.icon, this.selectedIcon);
  final String label;
  final IconData icon;
  final IconData selectedIcon;
}

/// Owns one navigator per tab so detail pages keep the mini player and the
/// navigation bar visible, and each tab remembers where you were.
class ShellController extends ChangeNotifier {
  AppTab _tab = AppTab.home;
  final Map<AppTab, GlobalKey<NavigatorState>> navigatorKeys = {
    for (final tab in AppTab.values)
      tab: GlobalKey<NavigatorState>(debugLabel: tab.name),
  };

  AppTab get tab => _tab;

  NavigatorState? get currentNavigator => navigatorKeys[_tab]?.currentState;

  /// Switches tab; tapping the active tab again returns to its first page.
  void selectTab(AppTab tab) {
    if (tab == _tab) {
      currentNavigator?.popUntil((route) => route.isFirst);
      return;
    }
    _tab = tab;
    notifyListeners();
  }

  Future<T?> push<T>(Route<T> route) async => currentNavigator?.push(route);

  /// Handles the system back button. Returns true if it was consumed.
  bool handleBack() {
    final navigator = currentNavigator;
    if (navigator != null && navigator.canPop()) {
      navigator.pop();
      return true;
    }
    if (_tab != AppTab.home) {
      selectTab(AppTab.home);
      return true;
    }
    return false;
  }
}

final shellControllerProvider = Provider<ShellController>((ref) {
  final controller = ShellController();
  ref.onDispose(controller.dispose);
  return controller;
});

/// Navigation helpers used across the UI.
abstract final class AppNav {
  /// Opens a collection in the current tab. If called from Now Playing, that
  /// screen is closed first.
  static void openCollection(
    BuildContext context,
    WidgetRef ref,
    CollectionRef collection,
  ) {
    final rootNavigator = Navigator.of(context, rootNavigator: true);
    rootNavigator.popUntil((route) => route.isFirst);
    ref
        .read(shellControllerProvider)
        .push(
          MaterialPageRoute<void>(
            builder: (_) => CollectionScreen(collection: collection),
          ),
        );
  }

  /// Opens the Audio Studio tab (closing Now Playing if it is open).
  static void openStudio(BuildContext context, WidgetRef ref) {
    Navigator.of(
      context,
      rootNavigator: true,
    ).popUntil((route) => route.isFirst);
    final shell = ref.read(shellControllerProvider);
    if (shell.tab != AppTab.studio) shell.selectTab(AppTab.studio);
    shell.currentNavigator?.popUntil((route) => route.isFirst);
  }

  static Future<void> openNowPlaying(BuildContext context) {
    return Navigator.of(context, rootNavigator: true).push(NowPlayingRoute());
  }
}
