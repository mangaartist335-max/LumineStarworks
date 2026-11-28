/// Formats a duration as `m:ss`, or `h:mm:ss` when it is an hour or longer.
String formatDuration(Duration? duration) {
  if (duration == null || duration.isNegative) return '0:00';
  final hours = duration.inHours;
  final minutes = duration.inMinutes.remainder(60);
  final seconds = duration.inSeconds.remainder(60).toString().padLeft(2, '0');
  if (hours > 0) {
    return '$hours:${minutes.toString().padLeft(2, '0')}:$seconds';
  }
  return '$minutes:$seconds';
}

/// A friendly total length, e.g. `42 min` or `1 hr 12 min`.
String formatTotalLength(Duration duration) {
  final hours = duration.inHours;
  final minutes = duration.inMinutes.remainder(60);
  if (hours > 0) return '$hours hr $minutes min';
  if (duration.inMinutes > 0) return '${duration.inMinutes} min';
  return '${duration.inSeconds} sec';
}

/// `1 song` / `12 songs`.
String formatSongCount(int count) => count == 1 ? '1 song' : '$count songs';

/// A greeting that matches the time of day.
String greetingFor(DateTime now) {
  final hour = now.hour;
  if (hour < 5) return 'Good night';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}
