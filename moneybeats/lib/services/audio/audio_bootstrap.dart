import 'package:audio_session/audio_session.dart';
import 'package:flutter/foundation.dart';
import 'package:just_audio_background/just_audio_background.dart';
import 'package:just_audio_media_kit/just_audio_media_kit.dart';

import '../../core/platform/platform_capabilities.dart';
import '../../core/theme/app_colors.dart';

/// Prepares the platform audio stack. Must run once, before the
/// [JustAudioPlayerService] (and so the `AudioPlayer`) is created.
abstract final class AudioBootstrap {
  static Future<AudioSession?> initialize() async {
    if (PlatformCapabilities.usesMediaKitBackend) {
      // libmpv-based backend for Windows and Linux.
      JustAudioMediaKit.title = 'MoneyBeats';
      JustAudioMediaKit.ensureInitialized(linux: true, windows: true);
    }

    if (PlatformCapabilities.supportsBackgroundPlayback) {
      // Notification, lock-screen and headset controls on Android and iOS.
      await JustAudioBackground.init(
        androidNotificationChannelId: 'com.moneybeats.moneybeats.playback',
        androidNotificationChannelName: 'Music playback',
        androidNotificationChannelDescription:
            'Playback controls for MoneyBeats',
        androidNotificationOngoing: true,
        notificationColor: AppColors.mint,
        androidNotificationIcon: 'drawable/ic_stat_moneybeats',
        artDownscaleWidth: 512,
        artDownscaleHeight: 512,
      );
    }

    try {
      final session = await AudioSession.instance;
      await session.configure(const AudioSessionConfiguration.music());
      return session;
    } catch (e) {
      debugPrint('Audio session unavailable: $e');
      return null;
    }
  }
}
