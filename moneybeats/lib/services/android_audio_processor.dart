import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';
import 'package:just_audio/just_audio.dart';
import 'package:moneybeats/models/audio_effects.dart';
import 'package:moneybeats/services/platform_audio_processor.dart';

/// Android: effects bound to the player's audio session.
///
/// * Equaliser: just_audio's [AndroidEqualizer] (android.media.audiofx.Equalizer)
///   in the player's audio pipeline, using the bands the device reports.
/// * Bass boost and reverb: android.media.audiofx.BassBoost and
///   EnvironmentalReverb, created natively (MainActivity.kt) on the same
///   audio session.
/// * Pitch and speed: the player (ExoPlayer), independent of each other.
class AndroidAudioProcessor implements PlatformAudioProcessor {
  AndroidAudioProcessor({
    required this.equalizer,
    required Stream<int?> audioSessionIds,
    MethodChannel? channel,
  }) : _sessionIds = audioSessionIds,
       _channel = channel ?? const MethodChannel(channelName);

  static const channelName = 'moneybeats/audio_effects';

  final AndroidEqualizer equalizer;
  final Stream<int?> _sessionIds;
  final MethodChannel _channel;

  AudioEffectsCapabilities _capabilities = const AudioEffectsCapabilities(
    engine: 'ExoPlayer + Android audio effects',
    speed: true,
    pitch: true,
    equalizerPending: true,
    equalizerNote: 'Play a song to load your device\'s equaliser bands.',
    bassNote: 'Checking bass boost support…',
    reverbNote: 'Checking reverb support…',
    waveform: WaveformSource.pcm,
  );
  final _capabilitiesController =
      StreamController<AudioEffectsCapabilities>.broadcast();
  StreamSubscription<int?>? _sessionSub;
  int? _sessionId;
  AndroidEqualizerParameters? _eq;
  bool _nativeBass = false;
  bool _nativeReverb = false;
  AudioEffectSettings _last = AudioEffectSettings.original;

  @override
  AudioEffectsCapabilities get capabilities => _capabilities;

  @override
  Stream<AudioEffectsCapabilities> get capabilitiesStream =>
      _capabilitiesController.stream;

  @override
  bool get handlesPitch => false;

  void _update(AudioEffectsCapabilities caps) {
    _capabilities = caps;
    if (!_capabilitiesController.isClosed) _capabilitiesController.add(caps);
  }

  @override
  Future<void> initialize() async {
    // Which native effects does this device ship?
    try {
      final result = await _channel.invokeMapMethod<String, Object?>(
        'capabilities',
      );
      _nativeBass = result?['bassBoost'] == true;
      _nativeReverb = result?['environmentalReverb'] == true;
    } catch (e) {
      debugPrint('Audio effects bridge unavailable: $e');
    }
    _publishNative();

    _sessionSub = _sessionIds.listen((id) {
      if (id == null || id == _sessionId || id <= 0) return;
      _sessionId = id;
      unawaited(_attach(id));
    });

    // The equaliser reports its bands once the player has loaded audio.
    unawaited(
      equalizer.parameters
          .then((params) {
            _eq = params;
            _update(
              _capabilities.copyWith(
                equalizer: params.bands.isNotEmpty,
                equalizerPending: false,
                equalizerBands: [
                  for (final b in params.bands) b.centerFrequency,
                ],
                equalizerMinDb: params.minDecibels,
                equalizerMaxDb: params.maxDecibels,
                equalizerNote: params.bands.isEmpty
                    ? 'This device has no equaliser.'
                    : null,
              ),
            );
            _publishNative();
            unawaited(apply(_last));
          })
          .catchError((Object e) {
            debugPrint('Equaliser unavailable: $e');
            _update(
              _capabilities.copyWith(
                equalizer: false,
                equalizerPending: false,
                equalizerNote: 'This device has no equaliser.',
              ),
            );
          }),
    );
  }

  void _publishNative() {
    final eqReady = _eq != null && _eq!.bands.isNotEmpty;
    final bassAvailable = _nativeBass || eqReady;
    _update(
      _capabilities.copyWith(
        bass: bassAvailable,
        bassUnit: _nativeBass ? BassUnit.strength : BassUnit.decibels,
        bassNote: bassAvailable
            ? null
            : (_eq == null
                  ? 'Play a song to check bass boost support.'
                  : 'This device has no bass boost.'),
        reverb: _nativeReverb,
        reverbMix: _nativeReverb,
        reverbDecay: _nativeReverb,
        reverbRoomSize: _nativeReverb,
        reverbNote: _nativeReverb ? null : 'This device has no reverb effect.',
      ),
    );
  }

  Future<void> _attach(int sessionId) async {
    try {
      final result = await _channel.invokeMapMethod<String, Object?>('attach', {
        'sessionId': sessionId,
      });
      _nativeBass = result?['bassBoost'] == true;
      _nativeReverb = result?['environmentalReverb'] == true;
    } catch (e) {
      debugPrint('Could not attach audio effects: $e');
      _nativeBass = false;
      _nativeReverb = false;
    }
    _publishNative();
    await apply(_last);
  }

  @override
  Future<void> apply(AudioEffectSettings settings) async {
    _last = settings;
    final params = _eq;

    // Bass: native BassBoost when available, otherwise a low shelf on the EQ.
    final bassViaEq = !_nativeBass;
    if (params != null && params.bands.isNotEmpty) {
      final gains = EffectMath.mapEqToBands(
        settings.eqGains,
        [for (final b in params.bands) b.centerFrequency],
        minDb: params.minDecibels,
        maxDb: params.maxDecibels,
        bassBoostDb: bassViaEq ? settings.bassBoostDb : 0,
      );
      final active = gains.any((g) => g.abs() >= 0.05);
      try {
        for (var i = 0; i < params.bands.length; i++) {
          await params.bands[i].setGain(gains[i]);
        }
        if (equalizer.enabled != active) await equalizer.setEnabled(active);
      } catch (e) {
        debugPrint('Equaliser update failed: $e');
      }
    }

    if (_sessionId == null) return;
    try {
      if (_nativeBass) {
        await _channel.invokeMethod('setBassBoost', {
          'strength': EffectMath.bassStrength(settings.bassBoostDb),
        });
      }
      if (_nativeReverb) {
        await _channel.invokeMethod('setReverb', {
          'enabled': settings.hasReverb,
          ...EffectMath.androidReverbParameters(settings),
        });
      }
    } catch (e) {
      debugPrint('Native effect update failed: $e');
    }
  }

  @override
  Future<void> dispose() async {
    await _sessionSub?.cancel();
    try {
      await _channel.invokeMethod('release');
    } catch (_) {}
    await _capabilitiesController.close();
  }
}
