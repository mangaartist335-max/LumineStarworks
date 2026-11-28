import 'dart:io';
import 'dart:math' as math;
import 'dart:ui' as ui;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_theme.dart';

/// Cover art with a generated gradient fallback for songs without artwork.
class ArtworkImage extends StatelessWidget {
  const ArtworkImage({
    super.key,
    required this.path,
    required this.seed,
    this.size,
    this.radius = AppRadius.sm,
    this.icon = Icons.music_note_rounded,
    this.shadow = false,
  });

  /// Absolute path to an image file, or null.
  final String? path;

  /// Picks the fallback gradient (use the album or song title).
  final String seed;

  /// Square size. When null the artwork fills its parent.
  final double? size;
  final double radius;
  final IconData icon;
  final bool shadow;

  @override
  Widget build(BuildContext context) {
    final placeholder = ArtworkPlaceholder(seed: seed, icon: icon);
    Widget image = placeholder;
    final file = path;
    if (file != null) {
      final dpr = MediaQuery.maybeDevicePixelRatioOf(context) ?? 2.0;
      final cacheSize = size == null ? null : (size! * dpr).round();
      image = Image.file(
        File(file),
        fit: BoxFit.cover,
        cacheWidth: cacheSize,
        gaplessPlayback: true,
        filterQuality: FilterQuality.medium,
        errorBuilder: (_, _, _) => placeholder,
      );
    }

    final clipped = ClipRRect(
      borderRadius: BorderRadius.circular(radius),
      child: image,
    );

    final decorated = shadow
        ? DecoratedBox(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(radius),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x66000000),
                  blurRadius: 32,
                  offset: Offset(0, 16),
                ),
              ],
            ),
            child: clipped,
          )
        : clipped;

    if (size != null) {
      return SizedBox.square(dimension: size, child: decorated);
    }
    return AspectRatio(aspectRatio: 1, child: decorated);
  }
}

/// A soft two-tone gradient with a centred icon.
class ArtworkPlaceholder extends StatelessWidget {
  const ArtworkPlaceholder({
    super.key,
    required this.seed,
    this.icon = Icons.music_note_rounded,
  });

  final String seed;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final colors = AppColors.gradientFor(seed);
    return DecoratedBox(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: colors,
        ),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final side = math.min(constraints.maxWidth, constraints.maxHeight);
          return Center(
            child: Icon(
              icon,
              size: side.isFinite ? side * 0.42 : 40,
              color: Colors.white.withValues(alpha: 0.85),
            ),
          );
        },
      ),
    );
  }
}

/// The dominant colour of a piece of artwork, used to tint the player.
final artworkColorProvider = FutureProvider.family<Color?, String>((
  ref,
  path,
) async {
  try {
    final bytes = await File(path).readAsBytes();
    final codec = await ui.instantiateImageCodec(
      bytes,
      targetWidth: 24,
      targetHeight: 24,
    );
    final frame = await codec.getNextFrame();
    final data = await frame.image.toByteData(
      format: ui.ImageByteFormat.rawRgba,
    );
    frame.image.dispose();
    codec.dispose();
    if (data == null) return null;
    return dominantColor(data.buffer.asUint8List());
  } catch (_) {
    return null;
  }
});

/// Averages RGBA pixels, weighting colourful mid-tones over greys, blacks and
/// whites so the result feels like the artwork's main hue.
Color? dominantColor(List<int> rgba) {
  double r = 0, g = 0, b = 0, total = 0;
  for (var i = 0; i + 3 < rgba.length; i += 4) {
    if (rgba[i + 3] < 128) continue;
    final pr = rgba[i] / 255, pg = rgba[i + 1] / 255, pb = rgba[i + 2] / 255;
    final maxC = math.max(pr, math.max(pg, pb));
    final minC = math.min(pr, math.min(pg, pb));
    final lightness = (maxC + minC) / 2;
    final saturation = maxC == minC
        ? 0.0
        : (maxC - minC) / (1 - (2 * lightness - 1).abs());
    final weight =
        0.05 + saturation * (1 - (lightness - 0.5).abs() * 1.6).clamp(0.0, 1.0);
    r += pr * weight;
    g += pg * weight;
    b += pb * weight;
    total += weight;
  }
  if (total == 0) return null;
  return Color.fromARGB(
    255,
    (r / total * 255).round(),
    (g / total * 255).round(),
    (b / total * 255).round(),
  );
}

/// Turns any colour into a rich, dark tint that keeps white text readable.
Color playerTint(Color color, {double lightness = 0.26}) {
  final hsl = HSLColor.fromColor(color);
  return hsl
      .withSaturation(hsl.saturation.clamp(0.25, 0.65))
      .withLightness(lightness)
      .toColor();
}

/// The tint for a track: its artwork colour, or its placeholder gradient.
Color tintFor(
  WidgetRef ref, {
  required String? artworkPath,
  required String seed,
  double lightness = 0.26,
}) {
  Color? base;
  if (artworkPath != null) {
    base = ref.watch(artworkColorProvider(artworkPath)).value;
  }
  base ??= AppColors.gradientFor(seed).first;
  return playerTint(base, lightness: lightness);
}
