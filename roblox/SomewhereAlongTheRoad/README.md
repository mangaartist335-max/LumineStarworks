# Somewhere Along the Road

A small, quiet roadside town in Roblox. You step off at the bus stop and wander: a convenience
store, a diner with pie, a few houses, a trail into the woods, a creek, a hill with the best view
in the county. Now and then the town does something unexpected. Some days, nothing happens at all.

**Version 0.3: an interactive cutscene starring your avatar.** Press Play and a 2:42 trailer
runs by itself. Your own Roblox character is the main character: you walk into town past the
welcome sign, wait at the bus stop, wave at the duck truck, sit at the lookout for the sunset,
and end up back on the bus stop bench. The camera films it all across 17 shots with captions and
a title card, and the events happen on cue. **Tap or click to jump to the next scene.** Your
controls and the Roblox buttons are switched off, so the screen is ready to record.

The explorable version is still in there. Set `Config.Mode = "Game"` to walk around yourself.

---

## The trailer, shot by shot

| # | Shot | Time | What happens | On screen |
|---|------|------|--------------|-----------|
| 1 | Morning mist | 0:00 | Aerial push over the fields toward town | *Somewhere along the road,* |
| 2 | Welcome sign | 0:12 | You walk past the Halfway sign toward town | *there's a little town called Halfway.* / Population: enough. |
| 3 | Bus stop | 0:22 | You wait on the bus stop bench | *Nothing much happens here.* |
| 4 | Halfway Mart | 0:31 | You walk up, the automatic doors open, and you head inside | *Mostly.* |
| 5 | The duck | 0:38 | The giant rubber duck truck rolls past and you wave. The driver yells "Don't ask!" | |
| 6 | Gerald | 0:49 | Gerald the gnome watching the road | |
| 7 | Why it crossed | 0:55 | A chicken crosses the road and you point at it. Dot: "I'm not even going to ask." | |
| 8 | The trail | 1:04 | You stroll down the dirt trail at golden hour | *Take the trail sometime.* |
| 9 | The tiny door | 1:13 | Close-up of the door in the old oak | |
| 10 | Wendell | 1:19 | You lean on the bridge rail next to Wendell while he fishes | |
| 11 | The deer | 1:26 | A deer looks up at you, then trots off | |
| 12 | The lookout | 1:34 | You sit on the lookout bench at sunset, the town far below | *Stay for the sunset.* |
| 13 | Storm | 1:46 | Clouds roll in, rain, lightning | *Some days it rains.* |
| 14 | Lights out | 1:58 | You're in a diner booth when the lights flicker off and back on | *Some nights the lights take a little nap.* |
| 15 | Main street at night | 2:09 | You walk home under the streetlights | |
| 16 | Something rare | 2:18 | You find fireflies and a glowing stone in the clearing | *And sometimes…* / *…something you can't quite explain.* |
| 17 | Title | 2:31 | Back on the bus stop bench, the camera rises over the road | **Somewhere Along the Road** / Coming soon to Roblox |

Every shot, line of text, timing and avatar move lives in
`src/ReplicatedStorage/SomewhereShared/Cutscene.luau`. Change the words, swap the order, delete
shots, or add your own. Settings at the top of that file:

| Setting | What it does |
|---|---|
| `StarAvatar = true` | Your character stars. Set `false` for scenery only. |
| `TapToSkip = true` | A tap or click jumps to the next scene. |
| `WaitForTap = false` | Set `true` to make every scene wait for a tap before moving on. |
| `TapHint = true` | A small "tap to skip ahead" note shows during the first shot. Set `false` for recording. |
| `Letterbox = true` | Cinematic black bars. |

**To grab a camera position for a new shot:** line up Studio's editor camera, then run this in
the Command Bar. It prints a `Pos` and a `Look` you can paste into a shot.

```lua
local c = workspace.CurrentCamera.CFrame print(c.Position, c.Position + c.LookVector * 30)
```

### Recording it

- **In Studio:** press Play. The trailer starts after a couple of seconds of black. Click to skip
  ahead, or press **R** to roll it again from the top. The Output window shows "Cutscene mode"
  when the right version is running.
- **For the cleanest video:** publish the place (File → Publish to Roblox, and keep it private),
  open it in the Roblox app, go full screen, and record with Xbox Game Bar (**Win + Alt + R**) or
  OBS. Studio's own window has panels around the game view, so the Roblox app gives a cleaner
  frame.
- The letterbox bars, captions and title are drawn by the game. For a clean take, set
  `TapHint = false` and don't click while recording.

---

## What's been checked, and what hasn't

Checked here:

- All 49 scripts compile, and they type-check with **zero errors** in strict mode against the
  full Roblox API definitions (luau-lsp).
- Every cutscene camera was checked against the built town: none of the 17 shots starts inside
  a wall or a tree, and nothing solid blocks its subject. Your avatar's marks were checked the
  same way: never inside anything, never hidden behind a wall, always inside the letterboxed
  picture. This check also caught a pane of glass that had been placed across the store's front
  door in the first version. It's fixed. `tools/check_shots.py` runs the check,
  and `dist/shot_map.png` shows where each shot sits.
- The real world-builder code runs offline (with Lune) and builds the town: about 3,000 parts,
  26 lights, 30 things to interact with, 20 seats, and 602 terrain fills.
- An automatic check confirms every note, discovery, item and route marker the scripts
  look for actually exists in the town.
- The Command Bar bootstrap gets a dry run against an empty place, where it installs all 46
  scripts and builds the same 3,000 parts.
- The first version was opened in Studio and ran: the terrain, buildings, grass, power lines and
  interface all loaded.

**Not checked yet:** the avatar cutscene hasn't been played in Studio. Camera moves, NPC
walking, vehicles, rain and lighting run on Roblox's physics and renderer, and those only exist
inside Studio. Expect a
few small things to need tuning on the first run, like an NPC standing a little too high, or a
light that's too bright. The game hasn't been published anywhere.

---

## Getting it into Studio (on a computer)

### Option A: open the place file (easiest)

1. Download `dist/SomewhereAlongTheRoad_Cutscene.rbxl` from this folder on GitHub (click the file,
   then the download button). The old `SomewhereAlongTheRoad.rbxl` is the first version. Delete it
   so it can't be opened by mistake.
2. Open Roblox Studio, then **File → Open from File…** and pick it.
3. Press **Play** (F5). The terrain (grass, creek, hill, trail) fills in when the game starts, then
   the trailer begins.

To see the terrain in edit mode too, paste this one line into **View → Command Bar** and press
Enter, then save:

```lua
local B = require(game.ServerScriptService.SomewhereServer.World.Builder) B.BuildTerrain(workspace.Terrain) B.TintTerrain(workspace.Terrain)
```

### Option B: build it from the Command Bar

1. Open a new **Baseplate** in Studio and delete the `Baseplate` part.
2. Open `dist/Bootstrap_CommandBar.lua`, select all, and copy it.
3. In Studio, **View → Command Bar**, paste, and press Enter. It takes a few seconds.
4. Look for "Somewhere Along the Road is installed" in the Output, then press **Play**.

The bootstrap is long (about 280 KB). If the Command Bar has trouble with a paste that size,
use Option A.

---

## Playing it as a game (`Config.Mode = "Game"`)

- You spawn at the bus stop, facing the Halfway Mart across the road.
- **Walk** with the stick or WASD. **Run** with Shift, or the Run button on a phone.
- **Interact** by tapping the prompt, or pressing E. You can read notes, take a coffee, pet
  the cat, ring the bell, open doors, and sit on any bench.
- The goal is light on purpose: **find three interesting things.** Tap the line in the top-left
  to open your journal. There are six fixed places to find, plus more that only turn up during
  events.

### The ten events

The director picks events at random, with gaps of a few minutes between them. Each in-game day
rolls a mood: **Quiet** (0–1 events), **Ordinary** (2–4) or **Lively** (4–6). Events that need
the same thing (the road, the weather, the store) never run at the same time, and nothing
repeats back to back.

| # | Event | What happens |
|---|-------|--------------|
| 1 | Sudden rainstorm | Dark sky, heavy rain, distant lightning, then a drizzle |
| 2 | Unusual vehicle | Ice cream truck (stops at the store), a giant rubber duck, or a hay wagon |
| 3 | Store closes | Marv tapes a note to the door and goes to the diner for pie |
| 4 | Stranger at the bus stop | A traveler waits, chats, then catches the Route 9 bus |
| 5 | Power outage | Lights flicker and go out for half a minute |
| 6 | Noise in the woods | Go look: a deer, an owl, or a raccoon with a sandwich |
| 7 | Something by the road | Gerald the gnome, a suitcase of snacks, sunflowers… |
| 8 | Golden sunset | The sky goes gold. Stand still and watch it for a bit |
| 9 | Funny moment | Hollis's mower runs away, or a chicken crosses the road |
| 10 | Rare occurrence | At night: fireflies, a glowing stone, a compass that points home |

---

## Director tools (game mode)

In Studio (or as the game's owner once it's published), a **🎬 Director** button sits in the
top-right corner. From there you can:

- trigger any event right away
- set the time (dawn, golden hour, night…), freeze time, or speed it up
- choose the weather (clear, fog, storm…)
- jump to landmarks (lookout, bridge, clearing, diner…)
- **hide all the UI** for clean footage. Tap the top-right corner to bring it back, or press H
  on a keyboard.
- turn on a soft depth-of-field effect

On a computer, **Shift+P** opens Roblox's built-in free camera, which is good for slow pans.

Good shots to try: golden hour from the lookout bench, the duck truck passing the diner, a storm
at night with the streetlights on, and the rare event in the clearing.

---

## Adding sound (optional)

No audio ships with the game, because no sound ID could be checked from here. Every sound
slot is blank in `src/ReplicatedStorage/SomewhereShared/Config.luau`, and the game plays fine
without them. Events that you'd normally *hear* show a soft one-line hint instead.

To add a sound: in Studio, open **Toolbox → Audio**, find a track uploaded by **Roblox** (for
example "birds", "rain", "crickets" or "diner"), right-click it, choose **Copy Asset ID**, and
paste it into the slot as `"rbxassetid://123456"`.

---

## Changing things

| Want to change… | Edit |
|---|---|
| Cutscene or game, day length, walk speed, how often events happen | `src/ReplicatedStorage/SomewhereShared/Config.luau` |
| The trailer's shots, captions and timing | `src/ReplicatedStorage/SomewhereShared/Cutscene.luau` |
| Any words: notes, dialogue, discoveries | `src/ReplicatedStorage/SomewhereShared/Text.luau` |
| Where buildings and landmarks sit | `src/ServerScriptService/SomewhereServer/World/Layout.luau` |
| Colours | `src/ServerScriptService/SomewhereServer/World/Palette.luau` |
| An event | `src/ServerScriptService/SomewhereServer/Events/Catalog/` |

You can also move things around directly in Studio. The town is saved in the place, and the
scripts find things by their markers, not by position. Moving an invisible `Anchor` part (for
example `RoadsideSpot` or `WoodsSpot`) moves where an event happens.

### How the code is organised

```
src/
  ReplicatedStorage/SomewhereShared/   Config, Text and Cutscene (shared by server and players)
  ServerScriptService/SomewhereServer/
    init.server.luau                   starts everything
    World/                             builds the town (Kit, Layout, Store, Diner, Houses…)
    Systems/                           day/night, weather, lights, NPCs, the cutscene timeline…
    Events/                            the event director, helpers, and Catalog/ (the 10 events)
  StarterPlayer/StarterPlayerScripts/SomewhereClient/
                                       Cinematic (the cutscene camera), rain, ambience, game UI
tools/
  build.luau        builds dist/ (place file, bootstrap) and runs the checks
  render_map.py     draws dist/map_overview.png and dist/map_town.png
  check_shots.py    checks every cutscene camera and draws dist/shot_map.png
default.project.json                   for Rojo users
```

### Rebuilding the outputs

With [Lune](https://github.com/lune-org/lune) installed, run from this folder:

```
lune run tools/build.luau
python3 tools/render_map.py
python3 tools/check_shots.py
```

---

## Status by phase

| Phase | Status |
|---|---|
| 1. Town, roads, buildings, spawn | Done |
| 2. Interiors and interactions | Done: store, diner, Hollis's house |
| 3. Day/night, weather, ambience | Done (sounds are blank slots for now) |
| 4. Random events | Done: all ten |
| 5. NPCs, polish, mobile | Four residents and phone-sized UI are in |
| Trailer cutscene | Done: 17 shots, 2:42, starring your avatar, tap to skip ahead. Tuning after the first watch in Studio |

Ideas for later: saving discoveries between visits (DataStore), more houses to step inside,
a radio station in the diner, and a proper bus timetable.
