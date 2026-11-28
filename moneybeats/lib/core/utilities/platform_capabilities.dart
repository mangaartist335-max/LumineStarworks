import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb;

/// What the current platform can do. Centralised so features can be switched
/// on per platform without scattering `Platform.isX` checks around the app.
abstract final class PlatformCapabilities {
  static bool get isMobile => !kIsWeb && (Platform.isAndroid || Platform.isIOS);

  static bool get isDesktop =>
      !kIsWeb && (Platform.isWindows || Platform.isLinux || Platform.isMacOS);

  /// Lock-screen / notification media controls through just_audio_background.
  static bool get supportsBackgroundPlayback =>
      !kIsWeb && (Platform.isAndroid || Platform.isIOS || Platform.isMacOS);

  /// just_audio has no built-in backend on Windows and Linux; media_kit
  /// (libmpv) provides it there.
  static bool get usesMediaKitBackend =>
      !kIsWeb && (Platform.isWindows || Platform.isLinux);

  /// sqflite's native plugin covers Android, iOS and macOS. Windows and Linux
  /// use the FFI implementation.
  static bool get usesSqfliteFfi =>
      !kIsWeb && (Platform.isWindows || Platform.isLinux);

  /// Playback speed is supported by every just_audio backend we ship.
  static bool get supportsSpeed => !kIsWeb;

  /// Pitch shifting through just_audio itself (ExoPlayer). iOS's AVPlayer
  /// has no pitch control; desktop pitch is done in the libmpv filter chain.
  static bool get supportsNativePitch => !kIsWeb && Platform.isAndroid;

  /// A hardware-backed equaliser is available on Android
  /// (`AndroidEqualizer`). Other platforms will need a custom DSP stage.
  static bool get supportsEqualizer => !kIsWeb && Platform.isAndroid;
}
