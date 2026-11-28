package com.moneybeats.moneybeats

import com.ryanheise.audioservice.AudioServiceActivity

// AudioServiceActivity keeps the Flutter engine shared with the background
// playback service, so music continues and the lock-screen controls work.
class MainActivity : AudioServiceActivity()
