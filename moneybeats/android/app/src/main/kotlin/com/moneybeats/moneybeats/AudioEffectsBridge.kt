package com.moneybeats.moneybeats

import android.media.audiofx.AudioEffect
import android.media.audiofx.BassBoost
import android.media.audiofx.EnvironmentalReverb
import android.util.Log
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel

/**
 * Bass boost and reverb for the MoneyBeats Audio Studio.
 *
 * Both effects are attached to the player's audio session (ExoPlayer, through
 * just_audio), so they process exactly what MoneyBeats plays, in real time,
 * without touching the imported files. The equaliser is handled separately by
 * just_audio's AndroidEqualizer on the same session.
 *
 * Lives in an object (not the Activity) so effects survive while music keeps
 * playing in the background.
 */
object AudioEffectsBridge : MethodChannel.MethodCallHandler {
    const val CHANNEL = "moneybeats/audio_effects"
    private const val TAG = "MoneyBeatsEffects"

    private var sessionId = 0
    private var bassBoost: BassBoost? = null
    private var reverb: EnvironmentalReverb? = null

    override fun onMethodCall(call: MethodCall, result: MethodChannel.Result) {
        try {
            when (call.method) {
                "capabilities" -> result.success(
                    mapOf(
                        "bassBoost" to hasEffect(AudioEffect.EFFECT_TYPE_BASS_BOOST),
                        "environmentalReverb" to hasEffect(AudioEffect.EFFECT_TYPE_ENV_REVERB),
                    )
                )
                "attach" -> result.success(attach(call.argument<Int>("sessionId") ?: 0))
                "setBassBoost" -> {
                    setBassBoost(call.argument<Int>("strength") ?: 0)
                    result.success(null)
                }
                "setReverb" -> {
                    setReverb(call)
                    result.success(null)
                }
                "release" -> {
                    release()
                    result.success(null)
                }
                else -> result.notImplemented()
            }
        } catch (e: Exception) {
            Log.w(TAG, "${call.method} failed", e)
            result.error("audio_effects", e.message, null)
        }
    }

    private fun hasEffect(type: java.util.UUID): Boolean = try {
        AudioEffect.queryEffects()?.any { it.type == type } ?: false
    } catch (e: Exception) {
        false
    }

    /** Creates the effects on [newSession]. Reports which ones work. */
    private fun attach(newSession: Int): Map<String, Boolean> {
        if (newSession != sessionId) {
            release()
            sessionId = newSession
        }
        if (sessionId <= 0) return mapOf("bassBoost" to false, "environmentalReverb" to false)

        if (bassBoost == null) {
            bassBoost = try {
                BassBoost(0, sessionId).takeIf { it.strengthSupported }
                    .also { if (it == null) Log.i(TAG, "BassBoost strength not supported") }
            } catch (e: Exception) {
                Log.i(TAG, "BassBoost unavailable", e)
                null
            }
        }
        if (reverb == null) {
            reverb = try {
                EnvironmentalReverb(0, sessionId).apply { enabled = false }
            } catch (e: Exception) {
                Log.i(TAG, "EnvironmentalReverb unavailable", e)
                null
            }
        }
        return mapOf(
            "bassBoost" to (bassBoost != null),
            "environmentalReverb" to (reverb != null),
        )
    }

    private fun setBassBoost(strength: Int) {
        val effect = bassBoost ?: return
        val value = strength.coerceIn(0, 1000)
        if (value <= 0) {
            effect.enabled = false
        } else {
            effect.setStrength(value.toShort())
            effect.enabled = true
        }
    }

    private fun setReverb(call: MethodCall) {
        val effect = reverb ?: return
        val enabled = call.argument<Boolean>("enabled") ?: false
        if (!enabled) {
            effect.enabled = false
            return
        }
        // Each parameter is optional on some implementations; apply what works.
        fun trySet(name: String, block: () -> Unit) {
            try {
                block()
            } catch (e: Exception) {
                Log.d(TAG, "Reverb $name not supported: ${e.message}")
            }
        }
        call.argument<Int>("decayTimeMs")?.let { v -> trySet("decayTime") { effect.decayTime = v } }
        call.argument<Int>("decayHfRatio")?.let { v -> trySet("decayHFRatio") { effect.decayHFRatio = v.toShort() } }
        call.argument<Int>("roomLevel")?.let { v -> trySet("roomLevel") { effect.roomLevel = v.toShort() } }
        call.argument<Int>("roomHfLevel")?.let { v -> trySet("roomHFLevel") { effect.roomHFLevel = v.toShort() } }
        call.argument<Int>("reverbLevel")?.let { v -> trySet("reverbLevel") { effect.reverbLevel = v.toShort() } }
        call.argument<Int>("density")?.let { v -> trySet("density") { effect.density = v.toShort() } }
        call.argument<Int>("diffusion")?.let { v -> trySet("diffusion") { effect.diffusion = v.toShort() } }
        effect.enabled = true
    }

    private fun release() {
        try {
            bassBoost?.release()
        } catch (_: Exception) {
        }
        try {
            reverb?.release()
        } catch (_: Exception) {
        }
        bassBoost = null
        reverb = null
        sessionId = 0
    }
}
