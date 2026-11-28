/// App-wide constants.
abstract final class AppConstants {
  static const appName = 'MoneyBeats';

  /// File extensions MoneyBeats imports. MP3 is the Phase 1 format.
  static const supportedAudioExtensions = ['mp3'];

  // Android playback notification.
  static const notificationChannelId = 'com.moneybeats.moneybeats.playback';
  static const notificationChannelName = 'Music playback';
  static const notificationChannelDescription =
      'Playback controls for MoneyBeats';
  static const notificationIcon = 'drawable/ic_stat_moneybeats';

  // App-managed storage.
  static const databaseFileName = 'moneybeats.db';
  static const musicFolderName = 'music';
  static const artworkFolderName = 'artwork';
  static const waveformFolderName = 'waveforms';

  /// Number of bars in a waveform.
  static const waveformBuckets = 180;

  /// "Previous" restarts the current song once it has played this long.
  static const restartThreshold = Duration(seconds: 3);

  /// Development: `--dart-define=MONEYBEATS_SEED_DIR=/path` imports every MP3
  /// in that folder on first launch.
  static const seedDirectory = String.fromEnvironment('MONEYBEATS_SEED_DIR');
}
