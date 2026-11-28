# MoneyBeats: notes for coding agents

This is a Flutter app (not the repository's Next.js app). Read `README.md` for the
architecture. A few things differ from older Flutter knowledge:

- **Flutter 3.50 / Dart 3.14.** Material lives in `package:material_ui/material_ui.dart`
  and Cupertino in `package:cupertino_ui/cupertino_ui.dart`;
  `package:flutter/material.dart` is deprecated. Flutter also defines its own
  `RepeatMode`, which is why the app's enum is `PlayerRepeatMode`.
- Dart 3.14 allows private named parameters (`required this._player`, called as
  `player:`); `dart fix` applies them.
- **Riverpod 3:** `AsyncValue.value` is nullable, providers retry failures by default
  (the app turns that off in `main.dart`), and `StateProvider`/`ChangeNotifierProvider`
  are legacy.
- **file_picker 13:** static `FilePicker.pickFiles(...)` returning `List<PlatformFile>`;
  picked files may be `content://` URIs, so read them with `readAsByteStream()`.
- **just_audio 0.10:** playlists use `setAudioSources` / `addAudioSources` /
  `moveAudioSource`; `ConcatenatingAudioSource` is deprecated. `await player.play()`
  completes only when playback stops, so don't await it.

Before finishing a change: `flutter analyze` and `flutter test` must be clean.
UI code talks to `AudioPlayerService`, never to `just_audio` directly.
