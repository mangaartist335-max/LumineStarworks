// Waveforms from the real audio: decoded PCM peaks on Android/iOS
// (just_waveform), or the MP3 frames' own loudness data elsewhere. Results
// are cached on disk so each song is analysed once.

import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:isolate';
import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:just_waveform/just_waveform.dart';
import 'package:moneybeats/core/constants/app_constants.dart';
import 'package:moneybeats/models/audio_effects.dart';
import 'package:moneybeats/services/storage_service.dart';

/// Normalised waveform bars (0-1) for one song.
@immutable
class WaveformData {
  const WaveformData({required this.peaks, required this.source});

  final List<double> peaks;
  final WaveformSource source;

  Map<String, Object> toJson() => {
    'v': 1,
    'source': source.name,
    'peaks': [for (final p in peaks) double.parse(p.toStringAsFixed(3))],
  };

  static WaveformData? fromJson(Object? json) {
    if (json is! Map || json['peaks'] is! List) return null;
    final source = WaveformSource.values.firstWhere(
      (s) => s.name == json['source'],
      orElse: () => WaveformSource.frameEnvelope,
    );
    return WaveformData(
      peaks: [for (final p in json['peaks'] as List) (p as num).toDouble()],
      source: source,
    );
  }
}

/// Turns an audio file into waveform bars.
abstract class WaveformExtractor {
  WaveformSource get source;

  Future<List<double>?> extract(String audioPath, {required int buckets});
}

/// Decoded-PCM peaks through just_waveform (Android MediaCodec, iOS
/// AVAssetReader). Runs natively, off the UI thread.
class PcmWaveformExtractor implements WaveformExtractor {
  PcmWaveformExtractor(this.tempDir);

  final Directory tempDir;

  @override
  WaveformSource get source => WaveformSource.pcm;

  @override
  Future<List<double>?> extract(
    String audioPath, {
    required int buckets,
  }) async {
    final out = File(
      '${tempDir.path}/.wave-${DateTime.now().microsecondsSinceEpoch}.tmp',
    );
    try {
      Waveform? waveform;
      await for (final progress in JustWaveform.extract(
        audioInFile: File(audioPath),
        waveOutFile: out,
        zoom: const WaveformZoom.pixelsPerSecond(20),
      )) {
        if (progress.waveform != null) waveform = progress.waveform;
      }
      final wave = waveform;
      if (wave == null || wave.length == 0) return null;
      final is8Bit = (wave.flags & 1) == 1;
      final full = is8Bit ? 128.0 : 32768.0;
      final pixels = [
        for (var i = 0; i < wave.length; i++)
          math.max(wave.getPixelMax(i).abs(), wave.getPixelMin(i).abs()) / full,
      ];
      return WaveformMath.normalise(WaveformMath.bucketMax(pixels, buckets));
    } finally {
      if (await out.exists()) await out.delete();
    }
  }
}

/// Pure-Dart loudness envelope from MP3 frame side information: each
/// granule's global gain (the quantiser step the encoder chose for the real
/// audio) and spectral extent. No decoding needed; works on every platform.
class Mp3EnvelopeExtractor implements WaveformExtractor {
  const Mp3EnvelopeExtractor();

  @override
  WaveformSource get source => WaveformSource.frameEnvelope;

  @override
  Future<List<double>?> extract(String audioPath, {required int buckets}) {
    return Isolate.run(() {
      final bytes = File(audioPath).readAsBytesSync();
      final levels = Mp3Envelope.granuleLevels(bytes);
      if (levels.isEmpty) return null;
      return WaveformMath.normalise(WaveformMath.bucketMax(levels, buckets));
    });
  }
}

/// Loads cached waveforms or extracts new ones.
class WaveformService {
  WaveformService({
    required this._storage,
    required this._primary,
    this._fallback,
    this.buckets = AppConstants.waveformBuckets,
  });

  final StorageService _storage;
  final WaveformExtractor _primary;
  final WaveformExtractor? _fallback;
  final int buckets;

  final _memory = <String, WaveformData>{};
  final _inFlight = <String, Future<WaveformData?>>{};

  Future<WaveformData?> load(String trackId, String audioPath) {
    final cached = _memory[trackId];
    if (cached != null) return SynchronousFuture(cached);
    return _inFlight[trackId] ??= _load(
      trackId,
      audioPath,
    ).whenComplete(() => _inFlight.remove(trackId));
  }

  Future<WaveformData?> _load(String trackId, String audioPath) async {
    final cacheFile = File(_storage.waveformPath(trackId));
    try {
      if (await cacheFile.exists()) {
        final data = WaveformData.fromJson(
          jsonDecode(await cacheFile.readAsString()),
        );
        if (data != null && data.peaks.isNotEmpty) {
          return _memory[trackId] = data;
        }
      }
    } catch (_) {
      // Corrupt cache: regenerate below.
    }

    WaveformData? data;
    for (final extractor in [_primary, ?_fallback]) {
      try {
        final peaks = await extractor.extract(audioPath, buckets: buckets);
        if (peaks != null && peaks.isNotEmpty) {
          data = WaveformData(peaks: peaks, source: extractor.source);
          break;
        }
      } catch (e) {
        debugPrint('Waveform extraction (${extractor.source.name}) failed: $e');
      }
    }
    if (data == null) return null;
    _memory[trackId] = data;
    try {
      await cacheFile.parent.create(recursive: true);
      await cacheFile.writeAsString(jsonEncode(data.toJson()));
    } catch (e) {
      debugPrint('Could not cache waveform: $e');
    }
    return data;
  }

  void forget(String trackId) => _memory.remove(trackId);
}

abstract final class WaveformMath {
  /// Reduces [values] to [buckets] bars, keeping each bar's peak.
  static List<double> bucketMax(List<double> values, int buckets) {
    if (values.isEmpty) return const [];
    if (values.length <= buckets) return List<double>.of(values);
    final out = List<double>.filled(buckets, 0);
    for (var i = 0; i < values.length; i++) {
      final b = (i * buckets) ~/ values.length;
      if (values[i] > out[b]) out[b] = values[i];
    }
    return out;
  }

  /// Scales so the loudest bar is 1, with a small floor so quiet parts
  /// stay visible.
  static List<double> normalise(List<double> values) {
    final peak = values.fold<double>(0, math.max);
    if (peak <= 0) return [for (final _ in values) 0.04];
    return [for (final v in values) (0.04 + 0.96 * v / peak).clamp(0.0, 1.0)];
  }
}

/// MP3 frame parsing for [Mp3EnvelopeExtractor].
abstract final class Mp3Envelope {
  static const _bitratesV1 = [
    0,
    32,
    40,
    48,
    56,
    64,
    80,
    96,
    112,
    128,
    160,
    192,
    224,
    256,
    320,
  ];
  static const _bitratesV2 = [
    0,
    8,
    16,
    24,
    32,
    40,
    48,
    56,
    64,
    80,
    96,
    112,
    128,
    144,
    160,
  ];
  static const _rates = {
    3: [44100, 48000, 32000], // MPEG-1
    2: [22050, 24000, 16000], // MPEG-2
    0: [11025, 12000, 8000], // MPEG-2.5
  };

  /// One loudness value (linear amplitude estimate) per granule, in order.
  static List<double> granuleLevels(Uint8List b) {
    final levels = <double>[];
    var i = _skipId3(b);
    while (i + 4 <= b.length) {
      if (b[i] != 0xFF || (b[i + 1] & 0xE0) != 0xE0) {
        i++;
        continue;
      }
      final version = (b[i + 1] >> 3) & 3; // 3 = MPEG-1, 2 = MPEG-2, 0 = 2.5
      final layer = (b[i + 1] >> 1) & 3; // 1 = Layer III
      final protected = (b[i + 1] & 1) == 0;
      final bitrateIndex = (b[i + 2] >> 4) & 0xF;
      final rateIndex = (b[i + 2] >> 2) & 3;
      final padding = (b[i + 2] >> 1) & 1;
      final mono = ((b[i + 3] >> 6) & 3) == 3;
      if (version == 1 ||
          layer != 1 ||
          bitrateIndex == 0 ||
          bitrateIndex == 15 ||
          rateIndex == 3) {
        i++;
        continue;
      }
      final mpeg1 = version == 3;
      final bitrate = (mpeg1 ? _bitratesV1 : _bitratesV2)[bitrateIndex] * 1000;
      final rate = _rates[version]![rateIndex];
      final frameLength = (mpeg1 ? 144 : 72) * bitrate ~/ rate + padding;
      if (frameLength < 21 || i + frameLength > b.length) break;

      final reader = _Bits(b, i + 4 + (protected ? 2 : 0));
      final channels = mono ? 1 : 2;
      final granules = mpeg1 ? 2 : 1;
      if (mpeg1) {
        reader.skip(9 + (mono ? 5 : 3) + 4 * channels);
      } else {
        reader.skip(8 + (mono ? 1 : 2));
      }
      for (var g = 0; g < granules; g++) {
        var level = 0.0;
        for (var c = 0; c < channels; c++) {
          reader.skip(12); // part2_3_length
          final bigValues = reader.read(9);
          final globalGain = reader.read(8);
          reader.skip(mpeg1 ? 4 + 1 + 22 + 3 : 9 + 1 + 22 + 2);
          if (bigValues > 0) {
            // Quantiser step = 2^((gain - 210) / 4); more spectral lines
            // carrying data means a fuller, louder signal.
            final step = math.pow(2, (globalGain - 210) / 4).toDouble();
            final extent = math.sqrt(bigValues / 288);
            level = math.max(level, step * extent);
          }
        }
        levels.add(level);
      }
      i += frameLength;
    }
    // Compress the dynamic range a little so the shape reads well.
    return [for (final l in levels) l <= 0 ? 0.0 : math.pow(l, 0.6).toDouble()];
  }

  static int _skipId3(Uint8List b) {
    if (b.length >= 10 && b[0] == 0x49 && b[1] == 0x44 && b[2] == 0x33) {
      final size =
          (b[6] & 0x7F) << 21 |
          (b[7] & 0x7F) << 14 |
          (b[8] & 0x7F) << 7 |
          (b[9] & 0x7F);
      return 10 + size;
    }
    return 0;
  }
}

class _Bits {
  _Bits(this._b, int byteOffset) : _pos = byteOffset * 8;

  final Uint8List _b;
  int _pos;

  void skip(int bits) => _pos += bits;

  int read(int bits) {
    var value = 0;
    for (var k = 0; k < bits; k++) {
      final byte = _pos >> 3;
      final bit = byte < _b.length ? (_b[byte] >> (7 - (_pos & 7))) & 1 : 0;
      value = (value << 1) | bit;
      _pos++;
    }
    return value;
  }
}
