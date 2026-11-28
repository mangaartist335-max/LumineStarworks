import 'package:flutter/foundation.dart';

/// A user-made playlist. [trackIds] is in playback order.
@immutable
class Playlist {
  const Playlist({
    required this.id,
    required this.name,
    required this.createdAt,
    required this.updatedAt,
    this.trackIds = const [],
  });

  final String id;
  final String name;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<String> trackIds;

  int get length => trackIds.length;

  Playlist copyWith({
    String? name,
    DateTime? updatedAt,
    List<String>? trackIds,
  }) {
    return Playlist(
      id: id,
      name: name ?? this.name,
      createdAt: createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      trackIds: trackIds ?? this.trackIds,
    );
  }

  @override
  bool operator ==(Object other) =>
      other is Playlist &&
      other.id == id &&
      other.name == name &&
      other.updatedAt == updatedAt &&
      listEquals(other.trackIds, trackIds);

  @override
  int get hashCode =>
      Object.hash(id, name, updatedAt, Object.hashAll(trackIds));
}
