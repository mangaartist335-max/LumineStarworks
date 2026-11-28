import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';
import '../../services/import/music_import_service.dart';
import '../../state/import_controller.dart';

/// Opens the native picker, imports the chosen MP3s and reports the result.
Future<void> startImport(BuildContext context, WidgetRef ref) async {
  final messenger = ScaffoldMessenger.maybeOf(context);
  try {
    final result = await ref
        .read(importControllerProvider.notifier)
        .pickAndImport();
    if (result == null) return;
    messenger?.hideCurrentSnackBar();
    messenger?.showSnackBar(
      SnackBar(
        content: Text(result.summary),
        duration: const Duration(seconds: 4),
        action: result.failures.isEmpty || !context.mounted
            ? null
            : SnackBarAction(
                label: 'Details',
                onPressed: () => _showFailures(context, result.failures),
              ),
      ),
    );
  } catch (e) {
    debugPrint('Import failed: $e');
    messenger?.showSnackBar(
      const SnackBar(
        content: Text("The file picker couldn't be opened. Please try again."),
      ),
    );
  }
}

void _showFailures(BuildContext context, List<ImportFailure> failures) {
  if (!context.mounted) return;
  showDialog<void>(
    context: context,
    useRootNavigator: true,
    builder: (context) => AlertDialog(
      title: const Text('Some files were skipped'),
      content: SizedBox(
        width: 360,
        child: ListView(
          shrinkWrap: true,
          children: [
            for (final failure in failures)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      failure.fileName,
                      style: const TextStyle(fontWeight: FontWeight.w700),
                    ),
                    Text(
                      failure.reason,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
      actions: [
        FilledButton(
          onPressed: () => Navigator.of(context).pop(),
          child: const Text('OK'),
        ),
      ],
    ),
  );
}

/// A slim progress banner shown while files are being imported.
class ImportProgressBanner extends ConsumerWidget {
  const ImportProgressBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(importControllerProvider);
    final progress = state.progress;
    return AnimatedSize(
      duration: const Duration(milliseconds: 220),
      curve: Curves.easeOutCubic,
      child: !state.importing || progress == null
          ? const SizedBox(width: double.infinity)
          : Container(
              margin: const EdgeInsets.fromLTRB(
                AppSpacing.sm,
                0,
                AppSpacing.sm,
                AppSpacing.sm,
              ),
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg,
                AppSpacing.md,
                AppSpacing.lg,
                AppSpacing.md,
              ),
              decoration: BoxDecoration(
                color: AppColors.surfaceHigh,
                borderRadius: BorderRadius.circular(AppRadius.md),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.download_rounded,
                        size: 18,
                        color: AppColors.mint,
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: Text(
                          'Importing ${progress.completed + 1 > progress.total ? progress.total : progress.completed + 1} of ${progress.total}'
                          '${progress.currentName == null ? '' : ' · ${progress.currentName}'}',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.sm),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: progress.fraction,
                      minHeight: 4,
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
