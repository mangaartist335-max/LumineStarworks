import 'package:material_ui/material_ui.dart';
import 'package:moneybeats/core/constants/layout.dart';
import 'package:moneybeats/core/theme/app_colors.dart';
import 'package:moneybeats/widgets/artwork.dart';
import 'package:moneybeats/widgets/pressable.dart';

/// A square artwork card with a title and subtitle, for carousels and grids.
class MediaCard extends StatelessWidget {
  const MediaCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.artworkPath,
    required this.seed,
    required this.onTap,
    this.onLongPress,
    this.width = 148,
    this.icon = Icons.music_note_rounded,
    this.circular = false,
  });

  final String title;
  final String subtitle;
  final String? artworkPath;
  final String seed;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;
  final double? width;
  final IconData icon;
  final bool circular;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final content = Column(
      crossAxisAlignment: circular
          ? CrossAxisAlignment.center
          : CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        LayoutBuilder(
          builder: (context, constraints) {
            final side = constraints.maxWidth.isFinite
                ? constraints.maxWidth
                : (width ?? 148);
            return ArtworkImage(
              path: artworkPath,
              seed: seed,
              size: side,
              radius: circular ? side / 2 : AppRadius.md,
              icon: icon,
            );
          },
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(
          title,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          textAlign: circular ? TextAlign.center : TextAlign.start,
          style: theme.textTheme.titleSmall?.copyWith(
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          subtitle,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          textAlign: circular ? TextAlign.center : TextAlign.start,
          style: theme.textTheme.bodySmall,
        ),
      ],
    );
    return Pressable(
      onTap: onTap,
      onLongPress: onLongPress,
      semanticLabel: '$title, $subtitle',
      child: width == null ? content : SizedBox(width: width, child: content),
    );
  }
}

/// A horizontal row of [MediaCard]s.
class MediaCarousel extends StatelessWidget {
  const MediaCarousel({
    super.key,
    required this.itemCount,
    required this.itemBuilder,
    this.height = 206,
  });

  final int itemCount;
  final Widget Function(BuildContext context, int index) itemBuilder;
  final double height;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.gutter),
        itemCount: itemCount,
        separatorBuilder: (_, _) => const SizedBox(width: AppSpacing.lg),
        itemBuilder: itemBuilder,
      ),
    );
  }
}

/// A compact two-column shortcut tile, as on the Home screen.
class QuickTile extends StatelessWidget {
  const QuickTile({
    super.key,
    required this.label,
    required this.onTap,
    this.icon,
    this.iconColor = Colors.white,
    this.iconBackground,
    this.artworkPath,
    this.seed,
  });

  final String label;
  final VoidCallback onTap;
  final IconData? icon;
  final Color iconColor;
  final Color? iconBackground;
  final String? artworkPath;
  final String? seed;

  @override
  Widget build(BuildContext context) {
    return Pressable(
      onTap: onTap,
      scale: 0.97,
      semanticLabel: label,
      child: Container(
        height: 60,
        decoration: BoxDecoration(
          color: AppColors.surfaceHigh.withValues(alpha: 0.75),
          borderRadius: BorderRadius.circular(AppRadius.sm),
        ),
        clipBehavior: Clip.antiAlias,
        child: Row(
          children: [
            if (icon != null)
              Container(
                width: 60,
                height: 60,
                color: iconBackground ?? AppColors.mintSoft,
                child: Icon(icon, color: iconColor, size: 26),
              )
            else
              ArtworkImage(
                path: artworkPath,
                seed: seed ?? label,
                size: 60,
                radius: 0,
              ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Text(
                label,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 13.5,
                ),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
          ],
        ),
      ),
    );
  }
}
