import '../../data/models/track.dart';
import 'playback_models.dart';

/// The single audio engine used across the whole app.
///
/// UI and state code depend on this interface only, which keeps the engine
/// swappable (and fakeable in tests) and gives the future Studio features
/// (pitch, speed, equaliser) one place to plug in.
abstract class AudioPlayerService {
  // State.
  PlaybackStatus get status;
  Stream<PlaybackStatus> get statusStream;

  QueueState get queue;
  Stream<QueueState> get queueStream;

  PositionState get positionState;
  Stream<PositionState> get positionStream;

  double get volume;
  Stream<double> get volumeStream;

  AudioEffects get effects;
  Stream<AudioEffects> get effectsStream;

  Stream<PlaybackError> get errorStream;
  Stream<ResolvedDuration> get resolvedDurationStream;

  // Starting playback.

  /// Replaces the queue with [tracks] and starts playing [startIndex].
  /// With [shuffle], playback starts on a random track in shuffled order.
  Future<void> playTracks(
    List<Track> tracks, {
    int startIndex = 0,
    bool shuffle = false,
    String? sourceLabel,
  });

  /// Loads a queue without starting playback (used to restore a session).
  Future<void> loadQueue(
    List<Track> tracks, {
    int startIndex = 0,
    Duration position = Duration.zero,
  });

  // Transport.
  Future<void> play();
  Future<void> pause();
  Future<void> togglePlayPause();
  Future<void> seek(Duration position);
  Future<void> skipToNext();

  /// Restarts the current track if it has played for more than a few
  /// seconds, otherwise goes to the previous one.
  Future<void> skipToPrevious();
  Future<void> skipToQueueIndex(int index);

  // Modes.
  Future<void> setShuffleEnabled(bool enabled);
  Future<void> toggleShuffle();
  Future<void> setRepeatMode(PlayerRepeatMode mode);
  Future<void> cycleRepeatMode();
  Future<void> setVolume(double volume);

  // Queue editing.
  Future<void> addToQueue(List<Track> tracks);
  Future<void> playNext(List<Track> tracks);
  Future<void> removeFromQueue(int index);
  Future<void> moveInQueue(int from, int to);

  /// Removes every queue entry for [trackId] (e.g. after it is deleted).
  Future<void> removeTrackEverywhere(String trackId);

  /// Refreshes the stored metadata for tracks already in the queue.
  void updateTracks(List<Track> tracks);

  // Effects (ready for the Studio phase).
  Future<void> setSpeed(double speed);
  Future<void> setPitch(double pitch);

  Future<void> dispose();
}
