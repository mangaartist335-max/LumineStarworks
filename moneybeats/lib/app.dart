import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import 'core/theme/app_theme.dart';
import 'state/app_coordinator.dart';
import 'ui/shell/app_shell.dart';

class MoneyBeatsApp extends ConsumerWidget {
  const MoneyBeatsApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Starts session restore, listening tracking and library/queue syncing.
    ref.watch(appCoordinatorProvider);

    return MaterialApp(
      title: 'MoneyBeats',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark(),
      darkTheme: AppTheme.dark(),
      themeMode: ThemeMode.dark,
      home: const AppShell(),
    );
  }
}
