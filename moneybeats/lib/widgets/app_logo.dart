import 'package:material_ui/material_ui.dart';
import 'package:moneybeats/core/theme/app_colors.dart';

/// The MoneyBeats mark: the "M" ribbon over waveform bars.
///
/// [size] is the height; the mark is about 2.3 times as wide. The image is
/// generated from `branding/moneybeats_logo_source.webp` by
/// `branding/generate_icons.py`.
class AppLogoMark extends StatelessWidget {
  const AppLogoMark({super.key, this.size = 28});

  final double size;

  static const asset = 'assets/brand/moneybeats_logo.png';

  /// Width divided by height of the trimmed logo.
  static const aspectRatio = 1314 / 571;

  @override
  Widget build(BuildContext context) {
    final width = size * aspectRatio;
    final dpr = MediaQuery.maybeDevicePixelRatioOf(context) ?? 2.0;
    return Image.asset(
      asset,
      height: size,
      width: width,
      fit: BoxFit.contain,
      cacheWidth: (width * dpr).round(),
      filterQuality: FilterQuality.medium,
      semanticLabel: 'MoneyBeats',
      excludeFromSemantics: false,
    );
  }
}

/// Logo mark plus the wordmark.
class AppLogo extends StatelessWidget {
  const AppLogo({super.key, this.size = 26});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        AppLogoMark(size: size),
        SizedBox(width: size * 0.4),
        Flexible(
          child: Text(
            'MoneyBeats',
            maxLines: 1,
            overflow: TextOverflow.fade,
            softWrap: false,
            style: TextStyle(
              fontSize: size * 0.85,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.5,
              color: AppColors.textPrimary,
            ),
          ),
        ),
      ],
    );
  }
}
