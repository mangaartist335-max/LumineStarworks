import 'package:material_ui/material_ui.dart';

/// MoneyBeats colour tokens.
///
/// A premium dark palette with a mint-green accent. Keep every colour used by
/// the UI here so the visual identity stays consistent and easy to tune.
abstract final class AppColors {
  // Surfaces, from deepest to most raised.
  static const background = Color(0xFF101112);
  static const surface = Color(0xFF17181A);
  static const surfaceRaised = Color(0xFF1F2022);
  static const surfaceHigh = Color(0xFF2A2B2E);
  static const outline = Color(0xFF33353A);

  // Brand accent.
  static const mint = Color(0xFF40E8AE);
  static const mintDeep = Color(0xFF1FB985);
  static const mintSoft = Color(0x2640E8AE); // 15% mint, for tinted surfaces
  static const onMint = Color(0xFF06231A);

  // Text.
  static const textPrimary = Color(0xFFF4F4F4);
  static const textSecondary = Color(0xFFB4B8BD);
  static const textMuted = Color(0xFF7D8288);

  // Future rewards system.
  static const rewardsGold = Color(0xFFD9B65B);

  // Feedback.
  static const danger = Color(0xFFFF6B6B);

  /// Gradient pairs used for generated artwork when a track has none.
  static const artworkGradients = <List<Color>>[
    [Color(0xFF40E8AE), Color(0xFF0F5C63)],
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
