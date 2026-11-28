import 'package:flutter/foundation.dart';
import 'package:moneybeats/models/track.dart';

/// Repeat behaviour, independent of the audio engine's own types.
enum PlayerRepeatMode {
  off,
  all,
  one;

  PlayerRepeatMode get next => switch (this) {
    PlayerRepeatMode.off => PlayerRepeatMode.all,
    PlayerRepeatMode.all => PlayerRepeatMode.one,
    PlayerRepeatMode.one => PlayerRepeatMode.off,
  };

  static PlayerRepeatMode fromName(String? name) => PlayerRepeatMode.values
      .firstWhere((m) => m.name == name, orElse: () => PlayerRepeatMode.off);
}

/// Where the engine is in loading and playing the current item.
enum PlaybackPhase { idle, loading, buffering, ready, completed }

@immutable
class PlaybackStatus {
  const PlaybackStatus({this.playing = false, this.phase = PlaybackPhase.idle});

  /// Whether playback is requested. Use [isActuallyPlaying] for the speaker.
  final bool playing;
  final PlaybackPhase phase;

  bool get isBusy =>
      phase == PlaybackPhase.loading || phase == PlaybackPhase.buffering;
  bool get isActuallyPlaying => playing && phase == PlaybackPhase.ready;

  /// The play/pause button should show "pause".
  bool get showPause => playing && phase != PlaybackPhase.completed;

  @override
  bool operator ==(Object other) =>
      other is PlaybackStatus &&
      other.playing == playing &&
      other.phase == phase;

  @override
  int get hashCode => Object.hash(playing, phase);
}

/// The playback queue as the UI sees it.
@immutable
class QueueState {
  const QueueState({
    this.tracks = const [],
    this.currentIndex,
    this.playOrder = const [],
    this.shuffleEnabled = false,
    this.repeatMode = PlayerRepeatMode.off,
    this.sourceLabel,
  });

  static const empty = QueueState();

  /// Tracks in queue order (the order they were added).
  final List<Track> tracks;

  /// Index into [tracks] of the current item.
  final int? currentIndex;

  /// The order items will actually play in. Equals `0..n-1` unless shuffled.
  final List<int> playOrder;

  final bool shuffleEnabled;
  final PlayerRepeatMode repeatMode;

  /// Where playback started from, e.g. an album or playlist name.
  final String? sourceLabel;

  bool get isEmpty => tracks.isEmpty;

  Track? get currentTrack {
    final index = currentIndex;
    if (index == null || index < 0 || index >= tracks.length) return null;
    return tracks[index];
  }

  int get _positionInOrder {
    final index = currentIndex;
    if (index == null) return -1;
    return playOrder.indexOf(index);
  }

  /// Queue indices that will play after the current one, in play order.
  List<int> get upNextIndices {
    final pos = _positionInOrder;
    if (pos < 0) return const [];
    return playOrder.sublist(pos + 1);
  }

  List<Track> get upNext => [for (final i in upNextIndices) tracks[i]];

  bool get hasNext =>
      tracks.isNotEmpty &&
      (repeatMode != PlayerRepeatMode.off ||
          _positionInOrder < playOrder.length - 1);

  bool get hasPrevious =>
      tracks.isNotEmpty &&
      (repeatMode != PlayerRepeatMode.off || _positionInOrder > 0);

  QueueState copyWith({
    List<Track>? tracks,
    int? currentIndex,
    List<int>? playOrder,
    bool? shuffleEnabled,
    PlayerRepeatMode? repeatMode,
    String? sourceLabel,
  }) {
    return QueueState(
      tracks: tracks ?? this.tracks,
      currentIndex: currentIndex ?? this.currentIndex,
      playOrder: playOrder ?? this.playOrder,
      shuffleEnabled: shuffleEnabled ?? this.shuffleEnabled,
      repeatMode: repeatMode ?? this.repeatMode,
      sourceLabel: sourceLabel ?? this.sourceLabel,
    );
  }

  @override
  bool operator ==(Object other) =>
      other is QueueState &&
      listEquals(other.tracks, tracks) &&
      other.currentIndex == currentIndex &&
      listEquals(other.playOrder, playOrder) &&
      other.shuffleEnabled == shuffleEnabled &&
      other.repeatMode == repeatMode &&
      other.sourceLabel == sourceLabel;

  @override
  int get hashCode => Object.hash(
    Object.hashAll(tracks),
    currentIndex,
    Object.hashAll(playOrder),
    shuffleEnabled,
    repeatMode,
    sourceLabel,
  );
}

/// Position information, updated many times per second while playing.
@immutable
class PositionState {
  const PositionState({
    this.position = Duration.zero,
    this.bufferedPosition = Duration.zero,
    this.duration,
  });

  static const zero = PositionState();

  final Duration position;
  final Duration bufferedPosition;

  /// The real length reported by the decoder, once known.
  final Duration? duration;

  /// Progress between 0 and 1.
  double progressFor(Duration? fallbackDuration) {
    final total = duration ?? fallbackDuration;
    if (total == null || total.inMilliseconds <= 0) return 0;
    return (position.inMilliseconds / total.inMilliseconds).clamp(0.0, 1.0);
  }

  @override
  bool operator ==(Object other) =>
      other is PositionState &&
      other.position == position &&
      other.bufferedPosition == bufferedPosition &&
      other.duration == duration;

  @override
  int get hashCode => Object.hash(position, bufferedPosition, duration);
}

/// Audio effect settings. Phase 1 keeps them neutral; the Studio phase will
/// expose controls for them. The engine already applies speed and pitch.
@immutable
class AudioEffects {
  const AudioEffects({
    this.speed = 1.0,
    this.pitch = 1.0,
    this.bassBoostDb = 0.0,
    this.equalizerEnabled = false,
  });

  static const neutral = AudioEffects();

  /// Playback rate, 1.0 is normal.
  final double speed;

  /// Pitch multiplier, 1.0 is the original key. 2^(semitones/12).
  final double pitch;

  /// Reserved for the Studio phase.
  final double bassBoostDb;
  final bool equalizerEnabled;

  AudioEffects copyWith({
    double? speed,
    double? pitch,
    double? bassBoostDb,
    bool? equalizerEnabled,
  }) {
    return AudioEffects(
      speed: speed ?? this.speed,
      pitch: pitch ?? this.pitch,
      bassBoostDb: bassBoostDb ?? this.bassBoostDb,
      equalizerEnabled: equalizerEnabled ?? this.equalizerEnabled,
    );
  }

  @override
  bool operator ==(Object other) =>
      other is AudioEffects &&
      other.speed == speed &&
      other.pitch == pitch &&
      other.bassBoostDb == bassBoostDb &&
      other.equalizerEnabled == equalizerEnabled;

  @override
  int get hashCode => Object.hash(speed, pitch, bassBoostDb, equalizerEnabled);
}

/// A playback problem worth telling the user about.
@immutable
class PlaybackError {
  const PlaybackError(this.message, {this.trackId});
  final String message;
  final String? trackId;
}

/// The engine discovered a track's exact length.
@immutable
class ResolvedDuration {
  const ResolvedDuration(this.trackId, this.duration);
  final String trackId;
  final Duration duration;
}
