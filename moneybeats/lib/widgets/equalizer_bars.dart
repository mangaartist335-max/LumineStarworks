import 'dart:math' as math;

import 'package:material_ui/material_ui.dart';
import 'package:moneybeats/core/theme/app_colors.dart';

/// Small animated bars that show which song is playing.
class EqualizerBars extends StatefulWidget {
  const EqualizerBars({
    super.key,
    this.animating = true,
    this.color = AppColors.mint,
    this.size = 16,
  });

  final bool animating;
  final Color color;
  final double size;

  @override
  State<EqualizerBars> createState() => _EqualizerBarsState();
}

class _EqualizerBarsState extends State<EqualizerBars>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1200),
  );

  @override
  void initState() {
    super.initState();
    if (widget.animating) _controller.repeat();
  }

  @override
  void didUpdateWidget(EqualizerBars oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.animating && !_controller.isAnimating) {
      _controller.repeat();
    } else if (!widget.animating && _controller.isAnimating) {
      _controller.stop();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox.square(
      dimension: widget.size,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) => CustomPaint(
          painter: _BarsPainter(
            _controller.value,
            widget.color,
            widget.animating,
          ),
        ),
      ),
    );
  }
}

class _BarsPainter extends CustomPainter {
  _BarsPainter(this.t, this.color, this.animating);

  final double t;
  final Color color;
  final bool animating;

  static const _phases = [0.0, 0.35, 0.7, 0.15];

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = color;
    const bars = 4;
    final gap = size.width * 0.12;
    final barWidth = (size.width - gap * (bars - 1)) / bars;
    for (var i = 0; i < bars; i++) {
      final wave = animating
          ? (math.sin((t + _phases[i]) * 2 * math.pi) + 1) / 2
          : 0.3;
      final height = size.height * (0.25 + 0.75 * wave);
      final left = i * (barWidth + gap);
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(left, size.height - height, barWidth, height),
          Radius.circular(barWidth / 2),
        ),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(_BarsPainter old) =>
      old.t != t || old.animating != animating || old.color != color;
}
