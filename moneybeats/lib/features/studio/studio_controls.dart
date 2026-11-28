import 'dart:math' as math;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:material_ui/material_ui.dart';
import 'package:moneybeats/core/constants/layout.dart';
import 'package:moneybeats/core/providers.dart';
import 'package:moneybeats/core/theme/app_colors.dart';
import 'package:moneybeats/features/studio/studio_providers.dart';
import 'package:moneybeats/models/audio_effects.dart';
import 'package:moneybeats/services/platform_audio_processor.dart';

/// A rounded card that groups related controls.
class StudioCard extends StatelessWidget {
  const StudioCard({super.key, required this.child, this.padding});

  final Widget child;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: padding ?? const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: AppColors.surfaceRaised,
        borderRadius: BorderRadius.circular(AppRadius.lg),
        border: Border.all(color: AppColors.outline.withValues(alpha: 0.6)),
      ),
      child: child,
    );
  }
}

/// A short explanation shown instead of a control the device can't apply.
class UnsupportedNote extends StatelessWidget {
  const UnsupportedNote({
    super.key,
    required this.title,
    required this.message,
  });

  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(
          Icons.info_outline_rounded,
          size: 18,
          color: AppColors.textMuted,
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Text.rich(
            TextSpan(
              children: [
                TextSpan(
                  text: '$title  ',
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    color: AppColors.textSecondary,
                  ),
                ),
                TextSpan(text: message),
              ],
            ),
            style: theme.textTheme.bodySmall,
          ),
        ),
      ],
    );
  }
}

/// A labelled slider with its value, fine -/+ steps and tap-to-reset.
class EffectSlider extends StatelessWidget {
  const EffectSlider({
    super.key,
    required this.label,
    required this.value,
    required this.min,
    required this.max,
    required this.step,
    required this.format,
    required this.onChanged,
    required this.neutral,
    this.fineStep,
    this.icon,
  });

  final String label;
  final double value;
  final double min;
  final double max;

  /// Slider resolution.
  final double step;

  /// Size of the -/+ buttons (defaults to [step]).
  final double? fineStep;
  final String Function(double v) format;
  final ValueChanged<double> onChanged;

  /// The "off" value restored by tapping the readout.
  final double neutral;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final changed = (value - neutral).abs() > step / 2;
    final fine = fineStep ?? step;
    final divisions = ((max - min) / step).round();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            if (icon != null) ...[
              Icon(icon, size: 18, color: AppColors.textSecondary),
              const SizedBox(width: AppSpacing.sm),
            ],
            Expanded(
              child: Text(
                label,
                style: theme.textTheme.titleSmall?.copyWith(
                  color: AppColors.textPrimary,
                ),
              ),
            ),
            Tooltip(
              message: 'Tap to reset',
              child: InkWell(
                borderRadius: BorderRadius.circular(8),
                onTap: changed ? () => onChanged(neutral) : null,
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 6,
                    vertical: 2,
                  ),
                  child: AnimatedDefaultTextStyle(
                    duration: const Duration(milliseconds: 160),
                    style: theme.textTheme.titleSmall!.copyWith(
                      color: changed ? AppColors.ice : AppColors.textSecondary,
                      fontFeatures: const [FontFeature.tabularFigures()],
                    ),
                    child: Text(format(value)),
                  ),
                ),
              ),
            ),
          ],
        ),
        Row(
          children: [
            _StepButton(
              icon: Icons.remove_rounded,
              tooltip: 'Decrease $label',
              onPressed: value > min + 1e-9
                  ? () => onChanged(math.max(min, value - fine))
                  : null,
            ),
            Expanded(
              child: SliderTheme(
                data: SliderTheme.of(context).copyWith(
                  activeTrackColor: AppColors.primary,
                  thumbColor: Colors.white,
                  tickMarkShape: SliderTickMarkShape.noTickMark,
                ),
                child: Slider(
                  value: value.clamp(min, max),
                  min: min,
                  max: max,
                  divisions: divisions,
                  onChanged: onChanged,
                  semanticFormatterCallback: format,
                ),
              ),
            ),
            _StepButton(
              icon: Icons.add_rounded,
              tooltip: 'Increase $label',
              onPressed: value < max - 1e-9
                  ? () => onChanged(math.min(max, value + fine))
                  : null,
            ),
          ],
        ),
      ],
    );
  }
}

class _StepButton extends StatelessWidget {
  const _StepButton({
    required this.icon,
    required this.tooltip,
    this.onPressed,
  });

  final IconData icon;
  final String tooltip;
  final VoidCallback? onPressed;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      tooltip: tooltip,
      visualDensity: VisualDensity.compact,
      iconSize: 18,
      onPressed: onPressed,
      icon: Icon(
        icon,
        color: onPressed == null
            ? AppColors.textMuted
            : AppColors.textSecondary,
      ),
    );
  }
}

// --------------------------------------------------------------- equaliser

/// Equaliser presets, a frequency-response curve and one slider per band the
/// device really has.
class EqualizerPanel extends ConsumerWidget {
  const EqualizerPanel({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(audioEffectsStateProvider);
    final caps = state.capabilities;
    final settings = state.settings;
    final effects = ref.read(audioEffectsServiceProvider);
    final theme = Theme.of(context);

    if (caps.equalizerPending) {
      return UnsupportedNote(
        title: 'Equaliser',
        message: caps.equalizerNote ?? 'Loading equaliser…',
      );
    }
    if (!caps.equalizer) {
      return UnsupportedNote(
        title: 'Equaliser',
        message: caps.equalizerNote ?? 'Not available on this device.',
      );
    }

    final bands = caps.equalizerBands;
    final usesReference = _sameBands(bands, referenceEqBands);
    final minDb = math.max(caps.equalizerMinDb, EffectLimits.eqGainMin);
    final maxDb = math.min(caps.equalizerMaxDb, EffectLimits.eqGainMax);
    double gainFor(int i) => usesReference
        ? settings.eqGains[i]
        : EffectMath.eqGainAt(settings.eqGains, bands[i]);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(
              child: Text('Equaliser', style: theme.textTheme.titleMedium),
            ),
            Text(
              usesReference
                  ? '${bands.length} bands'
                  : '${bands.length} device bands',
              style: theme.textTheme.bodySmall,
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        SizedBox(
          height: 40,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              for (final preset in EqPreset.all)
                Padding(
                  padding: const EdgeInsets.only(right: AppSpacing.sm),
                  child: ChoiceChip(
                    label: Text(preset.label),
                    selected: settings.eqPresetId == preset.id,
                    onSelected: (_) => effects.applyEqPreset(preset),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.lg),
        SizedBox(
          height: 120,
          child: CustomPaint(
            painter: _ResponseCurvePainter(
              gains: settings.eqGains,
              bassDb: caps.bass ? settings.bassBoostDb : 0,
              bands: bands,
              range: math.max(maxDb.abs(), minDb.abs()),
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        LayoutBuilder(
          builder: (context, constraints) {
            final bandWidth = math.max(
              32.0,
              constraints.maxWidth / bands.length,
            );
            final row = Row(
              children: [
                for (var i = 0; i < bands.length; i++)
                  SizedBox(
                    width: bandWidth,
                    child: _BandSlider(
                      frequency: bands[i],
                      gain: gainFor(i).clamp(minDb, maxDb),
                      min: minDb,
                      max: maxDb,
                      onChanged: (db) => usesReference
                          ? effects.setEqGain(i, db)
                          : effects.setEqGainAtFrequency(bands[i], db),
                    ),
                  ),
              ],
            );
            return bandWidth * bands.length > constraints.maxWidth + 1
                ? SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: row,
                  )
                : row;
          },
        ),
      ],
    );
  }

  static bool _sameBands(List<double> a, List<double> b) {
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; i++) {
      if ((a[i] - b[i]).abs() > 1) return false;
    }
    return true;
  }
}

class _BandSlider extends StatelessWidget {
  const _BandSlider({
    required this.frequency,
    required this.gain,
    required this.min,
    required this.max,
    required this.onChanged,
  });

  final double frequency;
  final double gain;
  final double min;
  final double max;
  final ValueChanged<double> onChanged;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final label = '${formatFrequency(frequency)}Hz';
    return Column(
      children: [
        Text(
          gain.abs() < 0.05
              ? '0'
              : '${gain > 0 ? '+' : ''}${gain.toStringAsFixed(gain.abs() >= 10 ? 0 : 1)}',
          style: theme.textTheme.labelSmall?.copyWith(
            color: gain.abs() < 0.05 ? AppColors.textMuted : AppColors.ice,
            fontFeatures: const [FontFeature.tabularFigures()],
          ),
        ),
        SizedBox(
          height: 150,
          child: RotatedBox(
            quarterTurns: 3,
            child: SliderTheme(
              data: SliderTheme.of(context).copyWith(
                trackHeight: 3,
                activeTrackColor: AppColors.primary,
                tickMarkShape: SliderTickMarkShape.noTickMark,
                thumbShape: const RoundSliderThumbShape(enabledThumbRadius: 7),
              ),
              child: Slider(
                value: gain,
                min: min,
                max: max,
                divisions: ((max - min) * 2).round(),
                onChanged: onChanged,
                semanticFormatterCallback: (v) =>
                    '$label ${v.toStringAsFixed(1)} dB',
              ),
            ),
          ),
        ),
        Text(formatFrequency(frequency), style: theme.textTheme.labelSmall),
      ],
    );
  }
}

/// The combined response of the equaliser and bass shelf on a log axis.
class _ResponseCurvePainter extends CustomPainter {
  _ResponseCurvePainter({
    required this.gains,
    required this.bassDb,
    required this.bands,
    required this.range,
  });

  final List<double> gains;
  final double bassDb;
  final List<double> bands;
  final double range;

  static const _fMin = 20.0, _fMax = 20000.0;

  double _x(double f, double width) =>
      width * (math.log(f / _fMin) / math.log(_fMax / _fMin));

  @override
  void paint(Canvas canvas, Size size) {
    final midY = size.height / 2;
    final scale = (size.height / 2 - 6) / math.max(range, 1);

    // Grid: 0 dB line and band markers.
    final grid = Paint()
      ..color = AppColors.outline
      ..strokeWidth = 1;
    canvas.drawLine(Offset(0, midY), Offset(size.width, midY), grid);
    for (final f in bands) {
      final x = _x(f, size.width);
      canvas.drawLine(
        Offset(x, 4),
        Offset(x, size.height - 4),
        grid..color = AppColors.outline.withValues(alpha: 0.4),
      );
    }

    final path = Path();
    final fill = Path()..moveTo(0, midY);
    const steps = 120;
    for (var i = 0; i <= steps; i++) {
      final f = _fMin * math.pow(_fMax / _fMin, i / steps);
      final db =
          EffectMath.eqGainAt(gains, f) + bassDb * EffectMath.lowShelfWeight(f);
      final x = size.width * i / steps;
      final y = midY - db.clamp(-range, range) * scale;
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
      fill.lineTo(x, y);
    }
    fill
      ..lineTo(size.width, midY)
      ..close();

    canvas.drawPath(
      fill,
      Paint()
        ..shader = LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            AppColors.primary.withValues(alpha: 0.35),
            AppColors.primary.withValues(alpha: 0.02),
          ],
        ).createShader(Offset.zero & size),
    );
    canvas.drawPath(
      path,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.5
        ..strokeCap = StrokeCap.round
        ..shader = const LinearGradient(colors: AppColors.brandGradient)
            .createShader(Offset.zero & size),
    );
  }

  @override
  bool shouldRepaint(_ResponseCurvePainter old) =>
      old.bassDb != bassDb ||
      old.range != range ||
      !_listEq(old.gains, gains) ||
      !_listEq(old.bands, bands);

  static bool _listEq(List<double> a, List<double> b) {
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; i++) {
      if (a[i] != b[i]) return false;
    }
    return true;
  }
}

// ------------------------------------------------------------------ reverb

/// Reverb space, wet/dry mix, and decay / room size where supported.
class ReverbPanel extends ConsumerWidget {
  const ReverbPanel({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(audioEffectsStateProvider);
    final caps = state.capabilities;
    final s = state.settings;
    final effects = ref.read(audioEffectsServiceProvider);
    final theme = Theme.of(context);

    if (!caps.reverb) {
      return UnsupportedNote(
        title: 'Reverb',
        message: caps.reverbNote ?? 'Not available on this device.',
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('Reverb', style: theme.textTheme.titleMedium),
        const SizedBox(height: AppSpacing.md),
        Wrap(
          spacing: AppSpacing.sm,
          runSpacing: AppSpacing.sm,
          children: [
            for (final type in ReverbType.values)
              ChoiceChip(
                label: Text(type.label),
                selected: s.hasReverb && s.reverbType == type,
                onSelected: (_) => effects.setReverbType(type),
              ),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        if (caps.reverbMix)
          EffectSlider(
            label: 'Reverb intensity',
            icon: Icons.blur_on_rounded,
            value: s.reverbMix,
            min: 0,
            max: 1,
            step: 0.01,
            fineStep: 0.05,
            neutral: 0,
            format: (v) => v < 0.005 ? 'Off' : '${(v * 100).round()}%',
            onChanged: effects.setReverbMix,
          ),
        if (caps.reverbDecay && s.hasReverb)
          EffectSlider(
            label: 'Decay time',
            icon: Icons.timelapse_rounded,
            value: s.reverbDecay,
            min: EffectLimits.reverbDecayMin,
            max: EffectLimits.reverbDecayMax,
            step: 0.1,
            neutral: s.reverbType.defaultDecay,
            format: (v) => '${v.toStringAsFixed(1)} s',
            onChanged: effects.setReverbDecay,
          ),
        if (caps.reverbRoomSize && s.hasReverb)
          EffectSlider(
            label: 'Room size',
            icon: Icons.crop_free_rounded,
            value: s.reverbRoomSize,
            min: 0,
            max: 1,
            step: 0.01,
            fineStep: 0.05,
            neutral: s.reverbType.defaultRoomSize,
            format: (v) => '${(v * 100).round()}%',
            onChanged: effects.setReverbRoomSize,
          ),
        if (caps.reverbNote != null) ...[
          const SizedBox(height: AppSpacing.xs),
          Text(caps.reverbNote!, style: theme.textTheme.bodySmall),
        ],
      ],
    );
  }
}

/// Formats for the main sliders.
abstract final class StudioFormat {
  static String pitch(double st) {
    if (st.abs() < 0.05) return '0 st';
    final text = st == st.roundToDouble()
        ? st.toStringAsFixed(0)
        : st.toStringAsFixed(1);
    return '${st > 0 ? '+' : ''}$text st';
  }

  static String speed(double x) => '${x.toStringAsFixed(2)}×';

  static String bass(double db, BassUnit unit) {
    if (db < 0.05) return 'Off';
    return unit == BassUnit.strength
        ? '${(db / EffectLimits.bassMax * 100).round()}%'
        : '+${db.toStringAsFixed(db == db.roundToDouble() ? 0 : 1)} dB';
  }
}
