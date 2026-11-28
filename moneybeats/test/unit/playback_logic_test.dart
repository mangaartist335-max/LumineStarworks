import 'dart:math';

import 'package:flutter_test/flutter_test.dart';
import 'package:moneybeats/core/utilities/formatters.dart';
import 'package:moneybeats/models/playback.dart';
import 'package:moneybeats/services/audio_service.dart';

import '../helpers/fakes.dart';

void main() {
  group('QueueShuffleOrder', () {
    int? current;
    late QueueShuffleOrder order;

    setUp(() {
      current = null;
      order = QueueShuffleOrder(currentIndex: () => current, random: Random(7));
    });

    test('initial insert keeps natural order', () {
      order.insert(0, 4);
      expect(order.indices, [0, 1, 2, 3]);
    });

    test(
      'shuffle keeps the chosen song first and contains everything once',
      () {
        order.insert(0, 10);
        order.shuffle(initialIndex: 6);
        expect(order.indices.first, 6);
        expect(order.indices.toSet(), Set.of(List.generate(10, (i) => i)));
      },
    );

    test('"play next" lands right after the current song', () {
      order.insert(0, 5);
      order.shuffle(initialIndex: 3);
      current = 3;
      final before = List.of(order.indices);
      order.insertMode = ShuffleInsertMode.afterCurrent;
      order.insert(
        4,
        2,
      ); // inserted into the queue at index 4 (after current 3)

      final pos = order.indices.indexOf(3);
      expect(order.indices.sublist(pos + 1, pos + 3), [4, 5]);
      // Previous items at index >= 4 shifted by 2.
      expect(order.indices.length, before.length + 2);
      expect(order.indices.toSet(), Set.of(List.generate(7, (i) => i)));
    });

    test('"add to queue" goes to the end of the shuffled order', () {
      order.insert(0, 3);
      order.shuffle(initialIndex: 1);
      current = 1;
      order.insertMode = ShuffleInsertMode.atEnd;
      order.insert(3, 1);
      expect(order.indices.last, 3);
    });

    test('removeRange drops and renumbers', () {
      order.insert(0, 5); // [0,1,2,3,4]
      order.removeRange(1, 3); // remove 1 and 2
      expect(order.indices, [0, 1, 2]);
    });
  });

  group('QueueState', () {
    final tracks = [makeTrack('a'), makeTrack('b'), makeTrack('c')];

    test('up next follows play order', () {
      final state = QueueState(
        tracks: tracks,
        currentIndex: 0,
        playOrder: const [0, 2, 1],
      );
      expect(state.currentTrack!.id, 'a');
      expect(state.upNext.map((t) => t.id), ['c', 'b']);
    });

    test('next and previous availability depends on repeat mode', () {
      final atEnd = QueueState(
        tracks: tracks,
        currentIndex: 2,
        playOrder: const [0, 1, 2],
      );
      expect(atEnd.hasNext, isFalse);
      expect(atEnd.hasPrevious, isTrue);
      expect(atEnd.copyWith(repeatMode: PlayerRepeatMode.all).hasNext, isTrue);

      final atStart = QueueState(
        tracks: tracks,
        currentIndex: 0,
        playOrder: const [0, 1, 2],
      );
      expect(atStart.hasPrevious, isFalse);
      expect(QueueState.empty.hasNext, isFalse);
      expect(QueueState.empty.currentTrack, isNull);
    });

    test('repeat cycles off, all, one', () {
      expect(PlayerRepeatMode.off.next, PlayerRepeatMode.all);
      expect(PlayerRepeatMode.all.next, PlayerRepeatMode.one);
      expect(PlayerRepeatMode.one.next, PlayerRepeatMode.off);
      expect(PlayerRepeatMode.fromName('one'), PlayerRepeatMode.one);
      expect(PlayerRepeatMode.fromName('nonsense'), PlayerRepeatMode.off);
    });
  });

  group('PlaybackStatus and PositionState', () {
    test('pause icon shows while playing, not after the queue completes', () {
      expect(
        const PlaybackStatus(
          playing: true,
          phase: PlaybackPhase.ready,
        ).showPause,
        isTrue,
      );
      expect(
        const PlaybackStatus(
          playing: true,
          phase: PlaybackPhase.completed,
        ).showPause,
        isFalse,
      );
      expect(
        const PlaybackStatus(
          playing: true,
          phase: PlaybackPhase.buffering,
        ).isBusy,
        isTrue,
      );
    });

    test('progress uses the engine duration, then the fallback', () {
      const p = PositionState(
        position: Duration(seconds: 30),
        duration: Duration(seconds: 120),
      );
      expect(p.progressFor(null), 0.25);
      const noDuration = PositionState(position: Duration(seconds: 30));
      expect(noDuration.progressFor(const Duration(seconds: 60)), 0.5);
      expect(noDuration.progressFor(null), 0);
    });
  });

  group('formatters', () {
    test('durations', () {
      expect(formatDuration(const Duration(seconds: 5)), '0:05');
      expect(formatDuration(const Duration(minutes: 3, seconds: 56)), '3:56');
      expect(
        formatDuration(const Duration(hours: 1, minutes: 2, seconds: 3)),
        '1:02:03',
      );
      expect(formatDuration(null), '0:00');
      expect(formatTotalLength(const Duration(minutes: 72)), '1 hr 12 min');
      expect(formatSongCount(1), '1 song');
      expect(formatSongCount(3), '3 songs');
    });

    test('greeting follows the clock', () {
      expect(greetingFor(DateTime(2026, 1, 1, 9)), 'Good morning');
      expect(greetingFor(DateTime(2026, 1, 1, 14)), 'Good afternoon');
      expect(greetingFor(DateTime(2026, 1, 1, 20)), 'Good evening');
    });
  });
}
