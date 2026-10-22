# Somewhere Along the Road

A small, quiet roadside town in Roblox. You step off at the bus stop and wander: a convenience
store, a diner with pie, a few houses, a trail into the woods, a creek, a hill with the best view
in the county. Now and then the town does something unexpected. Some days, nothing happens at all.

**Version 0.4: a first-person cutscene, with sound.** Press Play and a 2:43 trailer runs by
itself, seen through your own avatar's eyes. You walk into town along the road at dawn, sit at
the bus stop, stroll through the store's sliding doors, crouch down to say hi to Gerald the
gnome, watch the duck truck roll past, sit at the lookout for the sunset, and end up back on the
bus stop bench. There are 17 scenes with captions and a title card, and the events happen on cue.
**Tap or click to jump to the next scene.** Your controls and the Roblox buttons are switched
off, so the screen is ready to record.

**It comes with its own sound pack.** The `audio/` folder has 22 original sounds: birds, crickets,
wind, rain, thunder, the creek, the store's fridge hum, diner chatter, a duck-truck honk, a little
jukebox tune and more. All of them are made from scratch by `tools/make_sounds.py`, so they're
yours to use. Roblox only plays audio that's been uploaded to Roblox, so there's one quick step
for you: see [Adding the sounds](#adding-the-sounds).

The explorable version is still in there. Set `Config.Mode = "Game"` to walk around yourself.

---

## The trailer, scene by scene

| # | Scene | Time | What you see (and hear) | On screen |
|---|------|------|--------------|-----------|
| 1 | Morning walk | 0:00 | Walking the shoulder of the road at dawn, in the mist. Birds, a soft breeze, your footsteps | *Somewhere along the road,* |
| 2 | Welcome sign | 0:12 | Walking past the Halfway sign, looking ahead to town | *there's a little town called Halfway.* / Population: enough. |
| 3 | Bus stop | 0:21 | Sitting on the bench, looking across the road at the store | *Nothing much happens here.* |
| 4 | Halfway Mart | 0:30 | Walking up, the doors slide open with a chime, and in you go to the fridge hum | *Mostly.* |
| 5 | The duck | 0:38 | The giant rubber duck truck rolls past and honks. Your head turns to follow it | |
| 6 | Gerald | 0:49 | Crouching down to say hello to Gerald the gnome | |
| 7 | Why it crossed | 0:55 | A chicken crosses the road. Dot: "I'm not even going to ask." | |
| 8 | The trail | 1:04 | Strolling down the dirt trail at golden hour | *Take the trail sometime.* |
| 9 | The tiny door | 1:13 | Crouching closer to the little door in the old oak | |
| 10 | Wendell | 1:20 | On the bridge next to Wendell while he fishes, the creek babbling below | |
| 11 | The deer | 1:27 | Something rustles in the trees. A deer looks up at you, then trots off | |
| 12 | The lookout | 1:35 | Sitting on the lookout bench at sunset, the town far below | *Stay for the sunset.* |
| 13 | Storm | 1:47 | In the store's parking lot, looking up as the storm rolls in. Rain and thunder | *Some days it rains.* |
| 14 | Lights out | 1:59 | In a diner booth, everyone chatting, when the lights take a little nap | *Some nights the lights take a little nap.* |
| 15 | Main street at night | 2:10 | Walking home under the streetlights, crickets singing | |
| 16 | Something rare | 2:19 | Stepping slowly into the clearing toward the glow, with a soft shimmering hum | *And sometimes…* / *…something you can't quite explain.* |
| 17 | Title | 2:32 | Back on the bus stop bench, where it all started | **Somewhere Along the Road** / Coming soon to Roblox |

Every shot, line of text, timing and avatar move lives in
`src/ReplicatedStorage/SomewhereShared/Cutscene.luau`. Change the words, swap the order, delete
shots, or add your own. Settings at the top of that file:

| Setting | What it does |
|---|---|
| `FirstPerson = true` | See through your avatar's eyes. Set `false` and the camera follows just behind you instead. |
| `PovFov = 66` | How wide you see in first person. |
| `HeadSway = 1` | A gentle handheld feel. `0` keeps the view perfectly steady. |
| `StarAvatar = true` | Your character stars. Set `false` for scenery only. |
| `TapToSkip = true` | A tap or click jumps to the next scene. |
| `WaitForTap = false` | Set `true` to make every scene wait for a tap before moving on. |
| `TapHint = true` | A small "tap to skip ahead" note shows during the first shot. Set `false` for recording. |
| `Letterbox = true` | Cinematic black bars. |

Each scene says where you stand (`Avatar.At`), where you walk, sit or crouch, and where you
look (`From.Look` turning to `To.Look`). **To find a point to look at:** click any part in Studio
and copy its Position. Or line up Studio's editor camera and run this in the Command Bar, which
prints where the camera is and a point 30 studs in front of it.

```lua
local c = workspace.CurrentCamera.CFrame print(c.Position, c.Position + c.LookVector * 30)
```

### Recording it

- **In Studio:** press Play. The trailer starts after a couple of seconds of black. Click to skip
  ahead, or press **R** to roll it again from the top. The Output window shows "First-person
  cutscene (v0.4.0)" when the right version is running.
- **For the cleanest video:** publish the place (File → Publish to Roblox, and keep it private),
  open it in the Roblox app, go full screen, and record with Xbox Game Bar (**Win + Alt + R**) or
  OBS. Studio's own window has panels around the game view, so the Roblox app gives a cleaner
  frame.
- The letterbox bars, captions and title are drawn by the game. For a clean take, set
  `TapHint = false` and don't click while recording.

---

## What's been checked, and what hasn't

Checked here:

- All 50 scripts compile, and they type-check with **zero errors** in strict mode against the
  full Roblox API definitions (luau-lsp).
- Every scene was checked from your avatar's eyes against the built town, at standing,
  walking, sitting and crouching eye heights. Your eyes are never inside a wall or a tree,
  nothing solid sits between you and what the scene looks at, and none of your walks bump into
  anything. `tools/check_shots.py` runs the check, and `dist/shot_map.png` shows where you are
  in each scene. The check found two things, and both are fixed. The welcome sign's edge stuck
  out over the walking path. And the store's "OPEN" sign would have floated in the doorway
  when the doors slid open, so now it slides along with the door.
- The sound pack: all 22 files are built from scratch. Every loop joins up seamlessly with no
  click at the loop point, and keeps its exact length after encoding. Levels are set so nothing
  clips. I couldn't listen to them here, so they were checked by measurement and by looking at
  their spectrograms (`audio/spectrograms.png`).
- The real world-builder code runs offline (with Lune) and builds the town: about 3,000 parts,
  26 lights, 30 things to interact with, 20 seats, and 603 terrain fills.
- An automatic check confirms every note, discovery, item, route marker and sound slot the
  scripts look for actually exists.
- The Command Bar bootstrap gets a dry run against an empty place. It installs all 50 scripts,
  builds the same 3,000 parts and sets up the 22 sound slots.
- The first version was opened in Studio and ran: the terrain, buildings, grass, power lines and
  interface all loaded.

**Not checked yet:** the first-person version hasn't been played in Studio, and the sounds
haven't been heard in game. Camera moves, NPC walking, vehicles, rain and lighting run on
Roblox's physics and renderer, and those only exist inside Studio. Expect a few small things to
tune on the first run, like the eye height for a very tall or very short avatar, or one sound
a bit louder than the rest. The game hasn't been published anywhere.

---

## Getting it into Studio (on a computer)

### Option A: open the place file (easiest)

1. Download `dist/SomewhereAlongTheRoad_FirstPerson.rbxl` from this folder on GitHub (click the
   file, then the download button). If you have older copies (`SomewhereAlongTheRoad.rbxl` or
   `SomewhereAlongTheRoad_Cutscene.rbxl`), delete them so they can't be opened by mistake.
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

The bootstrap is long (about 320 KB). If the Command Bar has trouble with a paste that size,
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

## Adding the sounds

Roblox can only play audio that's been uploaded to Roblox, so this is the one step that needs
you. The game plays fine without it, just quieter.

1. **Upload the files.** In Studio, open the **Asset Manager** (on the View tab, or the Window
   menu in newer Studio), click **Bulk Import**, and pick the `.ogg` files in this project's
   `audio/` folder. You can also upload them at create.roblox.com, under Creations →
   Development Items → Audio. Roblox reviews each upload, which usually takes a few minutes.
2. **Put each one in its slot.** In the Explorer, open **SoundService → SomewhereSounds**. There's
   a Sound for every slot, named the same as its file. Click one (say `Wind`), then in Properties
   click **SoundId** and pick your uploaded `Wind` from the list. Do the same for the others.
   (If you'd rather paste ids, `Config.Sounds` in `Config.luau` takes them too. A plain number
   like `123456` works.)
3. **Press Play.** Your footsteps are Roblox's own built-in character sounds, so you'll hear
   yourself walking without uploading anything.

**If you can only upload a few:** Roblox limits how many audio files an account can upload
each month (accounts without ID verification get fewer, around 10 a month last time I checked).
These ten cover the whole trailer, so start with them: `DayBirds`, `Wind`, `NightCrickets`,
`Rain`, `Thunder`, `Creek`, `StoreHum`, `DinerChatter`, `Horn`, `SoftHum`. Next most useful:
`Engine`, `StoreChime`, `Chicken`, `Rustle`. The rest (`CounterBell`, `Door`, `Jukebox`,
`IceCreamTune`, `Owl`, `Tractor`, `Mower`, `Sip`) are mostly heard while exploring in game mode.

**If a slot has its id but stays silent:** audio you upload plays in places you own. Publish
the place to your account (File → Publish to Roblox; it can stay private) and try again.

**Want to change a sound?** Each one is a short recipe in `tools/make_sounds.py` (needs numpy
and ffmpeg). Run `python3 tools/make_sounds.py` to remake them all, or
`python3 tools/make_sounds.py Wind Rain` for just those. The files are `.ogg` on purpose: MP3
adds a tiny gap at the start, which makes loops click.

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
  ReplicatedStorage/SomewhereShared/   Config, Text, Cutscene and Sounds (shared by server and players)
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
  check_shots.py    checks every scene from your avatar's eyes and draws dist/shot_map.png
  make_sounds.py    makes the sound pack in audio/
audio/              the 22 original sounds, ready to upload (plus spectrograms.png)
default.project.json                   for Rojo users
```

### Rebuilding the outputs

With [Lune](https://github.com/lune-org/lune) installed, run from this folder:

```
python3 tools/make_sounds.py
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
| 3. Day/night, weather, ambience | Done, with an original 22-sound pack (needs uploading, see above) |
| 4. Random events | Done: all ten |
| 5. NPCs, polish, mobile | Four residents and phone-sized UI are in |
| Trailer cutscene | Done: 17 scenes, 2:43, first person through your avatar's eyes, tap to skip ahead. Tuning after the first watch in Studio |

Ideas for later: saving discoveries between visits (DataStore), more houses to step inside,
a radio station in the diner, and a proper bus timetable.
