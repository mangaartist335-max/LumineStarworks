import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';
import 'package:moneybeats/core/providers.dart';
import 'package:moneybeats/core/theme/app_colors.dart';
import 'package:moneybeats/features/player/playback_providers.dart';
import 'package:moneybeats/features/studio/studio_providers.dart';
import 'package:moneybeats/models/track.dart';

/// The current song's real waveform. The played part glows in the
/// MoneyBeats blue gradient; tap or drag to seek.
class WaveformView extends ConsumerStatefulWidget {
  const WaveformView({super.key, required this.track, this.height = 96});

  final Track track;
  final double height;

  @override
  ConsumerState<WaveformView> createState() => _WaveformViewState();
}

class _WaveformViewState extends ConsumerState<WaveformView> {
  double? _dragFraction;

  Duration _total() {
    final position = ref.read(positionStateProvider);
    return position.duration ?? widget.track.duration;
  }

  void _seekTo(double fraction) {
    final total = _total();
    if (total <= Duration.zero) return;
    ref.read(audioPlayerServiceProvider).seek(total * fraction.clamp(0.0, 1.0));
  }

  @override
  Widget build(BuildContext context) {
    final waveform = ref.watch(waveformProvider(widget.track.id));
    final position = ref.watch(positionStateProvider);
    final progress =
        _dragFraction ?? position.progressFor(widget.track.duration);

    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        double fractionAt(Offset local) => (local.dx / width).clamp(0.0, 1.0);
        return Semantics(
          label: 'Waveform. Tap to seek.',
          slider: true,
          value: '${(progress * 100).round()}%',
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTapUp: (d) => _seekTo(fractionAt(d.localPosition)),
            onHorizontalDragStart: (d) =>
                setState(() => _dragFraction = fractionAt(d.localPosition)),
            onHorizontalDragUpdate: (d) =>
                setState(() => _dragFraction = fractionAt(d.localPosition)),
            onHorizontalDragEnd: (_) {
              final f = _dragFraction;
              setState(() => _dragFraction = null);
              if (f != null) _seekTo(f);
            },
            child: SizedBox(
              height: widget.height,
              width: double.infinity,
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                child: waveform.when(
                  data: (data) => data == null
                      ? _ProgressFallback(progress: progress)
                      : SizedBox.expand(
                          key: ValueKey(widget.track.id),
                          child: CustomPaint(
                            painter: _WaveformPainter(data.peaks, progress),
                          ),
                        ),
                  loading: () => const _LoadingBars(),
                  error: (_, _) => _ProgressFallback(progress: progress),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

class _WaveformPainter extends CustomPainter {
  _WaveformPainter(this.peaks, this.progress);

  final List<double> peaks;
  final double progress;

  @override
  void paint(Canvas canvas, Size size) {
    if (peaks.isEmpty) return;
    // About one bar per 6 px, each the loudest of the peaks it covers.
    final target = (size.width / 6).floor().clamp(8, peaks.length);
    final bars = List<double>.filled(target, 0);
    for (var i = 0; i < peaks.length; i++) {
      final b = (i * target) ~/ peaks.length;
      if (peaks[i] > bars[b]) bars[b] = peaks[i];
    }
    final n = bars.length;
    final slot = size.width / n;
    final barWidth = (slot * 0.55).clamp(1.5, 5.0);
    final mid = size.height / 2;
    final played = Paint()
      ..shader = const LinearGradient(colors: AppColors.brandGradient)
          .createShader(Offset.zero & size);
    final rest = Paint()..color = Colors.white.withValues(alpha: 0.16);
    for (var i = 0; i < n; i++) {
      final h = (bars[i] * size.height * 0.96).clamp(3.0, size.height);
      final x = i * slot + (slot - barWidth) / 2;
      final rect = RRect.fromRectAndRadius(
        Rect.fromLTWH(x, mid - h / 2, barWidth, h),
        Radius.circular(barWidth / 2),
      );
      canvas.drawRRect(rect, (i + 0.5) / n <= progress ? played : rest);
    }
  }

  @override
  bool shouldRepaint(_WaveformPainter old) =>
      old.progress != progress || !identical(old.peaks, peaks);
}

/// Calm, static placeholder while the waveform is analysed (no fake data).
class _LoadingBars extends StatelessWidget {
  const _LoadingBars();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        height: 2,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.14),
          borderRadius: BorderRadius.circular(1),
        ),
      ),
    );
  }
}

/// Lightweight fallback when no waveform can be extracted.
class _ProgressFallback extends StatelessWidget {
  const _ProgressFallback({required this.progress});

  final double progress;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: ClipRRect(
        borderRadius: BorderRadius.circular(3),
        child: LinearProgressIndicator(
          value: progress,
          minHeight: 6,
          color: AppColors.primary,
          backgroundColor: Colors.white.withValues(alpha: 0.14),
        ),
      ),
    );
  }
}
