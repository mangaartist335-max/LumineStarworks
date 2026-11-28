import 'package:material_ui/material_ui.dart';

/// MoneyBeats colour tokens.
///
/// A premium dark palette with a blue brand colour that matches the logo.
/// Keep every colour used by the UI here so the identity stays consistent.
abstract final class AppColors {
  // Surfaces, from deepest to most raised.
  static const background = Color(0xFF0C0E14);
  static const backgroundSecondary = Color(0xFF121722);
  static const surface = Color(0xFF151B27);
  static const surfaceRaised = Color(0xFF1B2230);
  static const surfaceHigh = Color(0xFF252E3F);
  static const outline = Color(0xFF2C3546);

  // Brand blues.
  static const primary = Color(0xFF3478F6);
  static const electric = Color(0xFF2563EB);
  static const ice = Color(0xFF67C8FF);
  static const primarySoft = Color(0x293478F6); // 16% primary, for tinted surfaces
  static const onPrimary = Color(0xFFFFFFFF);

  /// The signature MoneyBeats gradient (logo, waveform, highlights).
  static const brandGradient = [electric, primary, ice];

  // Text.
  static const textPrimary = Color(0xFFF5F7FA);
  static const textSecondary = Color(0xFF929BAA);
  static const textMuted = Color(0xFF6B7485);

  // Future rewards system.
  static const rewardsGold = Color(0xFFD9B65B);

  // Feedback.
  static const danger = Color(0xFFFF6B6B);

  /// Gradient pairs used for generated artwork when a track has none.
  static const artworkGradients = <List<Color>>[
    [Color(0xFF67C8FF), Color(0xFF123A73)],
    [Color(0xFF7C5CFF), Color(0xFF2A1B6B)],
    [Color(0xFFFF8A4C), Color(0xFF8C1D40)],
    [Color(0xFF3BA7FF), Color(0xFF123A73)],
    [Color(0xFFFF5FA2), Color(0xFF5B1E7A)],
    [Color(0xFFD9B65B), Color(0xFF7A4A12)],
    [Color(0xFF54D2D2), Color(0xFF1C3F7A)],
    [Color(0xFFB8E86B), Color(0xFF285E3A)],
  ];

  /// Picks a stable gradient for any seed string (title, album, playlist...).
  static List<Color> gradientFor(String seed) {
    var hash = 0;
    for (final unit in seed.codeUnits) {
      hash = (hash * 31 + unit) & 0x7fffffff;
    }
    return artworkGradients[hash % artworkGradients.length];
  }
}
