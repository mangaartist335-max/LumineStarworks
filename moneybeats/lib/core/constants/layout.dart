// Spacing, corner radius and breakpoint tokens shared by every screen.

/// Spacing and radius tokens.
abstract final class AppSpacing {
  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 12.0;
  static const lg = 16.0;
  static const xl = 24.0;
  static const xxl = 32.0;

  /// Horizontal page gutter on phones.
  static const gutter = 16.0;
}

abstract final class AppRadius {
  static const sm = 8.0;
  static const md = 12.0;
  static const lg = 18.0;
  static const xl = 28.0;
}

/// Breakpoints for the responsive shell.
abstract final class AppBreakpoints {
  /// At or above this width the app switches to the desktop layout
  /// (sidebar navigation and a full-width player bar).
  static const desktop = 840.0;
}
