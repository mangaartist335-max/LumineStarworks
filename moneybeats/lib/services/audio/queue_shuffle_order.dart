import 'dart:math';

import 'package:just_audio/just_audio.dart';

/// How newly inserted queue items are placed in the shuffled order.
enum ShuffleInsertMode {
  /// Right after the current item ("Play next").
  afterCurrent,

  /// At the end of the shuffled order ("Add to queue").
  atEnd,
}

/// A [ShuffleOrder] that keeps "Play next" and "Add to queue" predictable
/// while shuffle is on. The default order scatters new items randomly.
class QueueShuffleOrder extends ShuffleOrder {
  QueueShuffleOrder({required this.currentIndex, Random? random})
    : _random = random ?? Random();

  /// Reads the player's current queue index.
  final int? Function() currentIndex;
  final Random _random;

  ShuffleInsertMode insertMode = ShuffleInsertMode.atEnd;

  @override
  final List<int> indices = <int>[];

  @override
  void shuffle({int? initialIndex}) {
    if (indices.length <= 1) return;
    indices.shuffle(_random);
    if (initialIndex == null) return;
    final swapPos = indices.indexOf(initialIndex);
    if (swapPos <= 0) return;
    indices[swapPos] = indices[0];
    indices[0] = initialIndex;
  }

  @override
  void insert(int index, int count) {
    if (count <= 0) return;
    // `currentIndex` still refers to the pre-insert queue at this point.
    final current = currentIndex();
    for (var i = 0; i < indices.length; i++) {
      if (indices[i] >= index) indices[i] += count;
    }
    final newIndices = List<int>.generate(count, (i) => index + i);
    if (insertMode == ShuffleInsertMode.afterCurrent && current != null) {
      final shiftedCurrent = current >= index ? current + count : current;
      final pos = indices.indexOf(shiftedCurrent);
      indices.insertAll(pos < 0 ? indices.length : pos + 1, newIndices);
    } else {
      indices.addAll(newIndices);
    }
  }

  @override
  void removeRange(int start, int end) {
    final count = end - start;
    if (count <= 0) return;
    indices.removeWhere((i) => i >= start && i < end);
    for (var i = 0; i < indices.length; i++) {
      if (indices[i] >= end) indices[i] -= count;
    }
  }

  @override
  void clear() => indices.clear();
}
