import 'package:media_kit/media_kit.dart';

Future<void> setProperty(Player player, String key, dynamic value) async {
  if (player.platform is! NativePlayer) return;
  await (player.platform as NativePlayer).setProperty(key, value);
}

/// MoneyBeats addition: reads an mpv property (null where unavailable).
Future<String?> getProperty(Player player, String key) async {
  if (player.platform is! NativePlayer) return null;
  return (player.platform as NativePlayer).getProperty(key);
}
