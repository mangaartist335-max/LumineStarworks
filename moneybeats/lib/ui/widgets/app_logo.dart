import 'package:material_ui/material_ui.dart';

import '../../core/theme/app_colors.dart';

/// The MoneyBeats mark: a row of waveform bars in mint.
class AppLogoMark extends StatelessWidget {
  const AppLogoMark({super.key, this.size = 28, this.color = AppColors.mint});

  final double size;
  final Color color;

  static const _heights = [0.35, 0.7, 1.0, 0.55, 0.85, 0.4];

  @override
  Widget build(BuildContext context) {
    final barWidth = size / (_heights.length * 1.8);
    return SizedBox(
      width: size,
      height: size,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          for (final h in _heights)
            Container(
              width: barWidth,
              height: size * h,
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(barWidth),
              ),
            ),
        ],
      ),
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
