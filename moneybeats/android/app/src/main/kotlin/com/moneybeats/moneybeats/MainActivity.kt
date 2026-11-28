package com.moneybeats.moneybeats

import com.ryanheise.audioservice.AudioServiceActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel

// AudioServiceActivity keeps the Flutter engine shared with the background
// playback service, so music continues and the lock-screen controls work.
class MainActivity : AudioServiceActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        // Native bass boost and reverb for the Audio Studio.
        MethodChannel(
            flutterEngine.dartExecutor.binaryMessenger,
            AudioEffectsBridge.CHANNEL,
        ).setMethodCallHandler(AudioEffectsBridge)
    }
}
