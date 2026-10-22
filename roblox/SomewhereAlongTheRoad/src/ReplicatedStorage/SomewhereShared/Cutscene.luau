--!strict
-- The trailer, shot by shot, seen through your own eyes. Press Play and it runs from top to
-- bottom by itself. Tap or click to jump ahead to the next scene.
--
-- First person: the camera sits at your avatar's eyes (your body is hidden from you).
-- Each shot says where you are and what you do (Avatar), and where you look (From.Look -> To.Look).
--   Look = the point you're looking at,  Fov = how wide you see (smaller = more zoom)
-- Optional per shot:
--   Clock        time of day (0-24) set at the start of the shot
--   Weather      Clear, PartlyCloudy, Overcast, Drizzle, Fog or Storm (set instantly)
--   WeatherRamp  { Name, Seconds } to change weather during the shot
--   Mood         { Name = "Sunset" or "Rare", Value = 0..1, Seconds }
--   Event        { Id, Options, Lead } one of the ten events, staged for the camera.
--                Lead starts it that many seconds before the shot so it's ready on screen.
--   Cues         { { At = seconds, Do = "Flash" | "Say", ... } } little things on a timer
--   Track        { Model, Offset, Weight } turn your head to follow a moving thing
--   Captions     { { Text, From, To, Small } } words on screen
--   Title        { Text, Sub, From } the big title card
--   FadeIn / FadeOut  seconds of fade from / to black
--   Avatar       what you do in this shot:
--                  At     = CFrame on the ground where you start, facing the way you're headed
--                  Walk   = { points } to stroll through, at Speed studs per second
--                  Sit    = a point next to the seat to sit on (bench, booth...)
--                  Crouch = true to crouch down (for looking at small things)
--   From.Pos / To.Pos  only used for a shot without an Avatar (a free-floating camera)
--
-- Tip: to find a spot to look at, click a part in Studio and copy its Position.

export type Key = { Pos: Vector3?, Look: Vector3, Fov: number? }
export type Caption = { Text: string, From: number, To: number, Small: boolean? }
export type Cue = { At: number, Do: string, Npc: string?, Text: string?, Strength: number?, Seconds: number? }
export type Avatar = {
	At: CFrame,
	Walk: { Vector3 }?,
	Speed: number?,
	Sit: Vector3?,
	Crouch: boolean?,
	Emote: { At: number, Name: string }?,
}
export type Shot = {
	Name: string,
	Duration: number,
	From: Key,
	To: Key,
	Ease: string?,
	Clock: number?,
	Weather: string?,
	WeatherRamp: { Name: string, Seconds: number }?,
	Mood: { Name: string, Value: number, Seconds: number }?,
	Event: { Id: string, Options: { [string]: any }?, Lead: number? }?,
	Cues: { Cue }?,
	Track: { Model: string, Offset: Vector3?, Weight: number? }?,
	Captions: { Caption }?,
	Title: { Text: string, Sub: string?, From: number }?,
	FadeIn: number?,
	FadeOut: number?,
	Avatar: Avatar?,
}

local V = Vector3.new

-- Stand at `x, y, z` facing toward `tx, tz` (a point on the same level).
local function stand(x: number, y: number, z: number, tx: number, tz: number): CFrame
	return CFrame.lookAt(V(x, y, z), V(tx, y, tz))
end

local Cutscene = {}

Cutscene.Settings = {
	StartDelay = 2, -- seconds of black before the first shot, once your screen is ready
	Letterbox = true, -- cinematic black bars
	LetterboxRatio = 2.39,
	FirstPerson = true, -- see through your avatar's eyes (false: the camera follows behind you)
	PovFov = 66, -- how wide you see in first person, unless a shot says otherwise
	DefaultFov = 50, -- for shots without an Avatar
	EyeHeight = 4.7, -- studs above the ground when standing
	CrouchDrop = 1.9, -- how much lower you are when crouching
	HeadSway = 1, -- gentle handheld feel (0 = perfectly steady)
	Loop = false, -- play again after the end card
	LoopDelay = 6,
	HideCursor = true,
	StarAvatar = true, -- your own Roblox character walks through the scenes
	TapToSkip = true, -- a tap or click jumps to the next scene
	WaitForTap = false, -- true: every scene waits for a tap before moving on
	TapHint = true, -- a small "tap to continue" note on the black bar (turn off for recording)
}

Cutscene.Shots = {
	{
		Name = "Morning walk",
		Duration = 12,
		Clock = 6.3,
		Weather = "Fog",
		FadeIn = 3,
		-- Walking the shoulder of the road at dawn, toward a town you can't see yet.
		Avatar = { At = stand(-330, 0, 14.4, -200, 14.4), Walk = { V(-268, 0, 14.4) }, Speed = 5.2 },
		From = { Look = V(-230, 4.5, 14) },
		To = { Look = V(-180, 4.3, 11) },
		Captions = { { Text = "Somewhere along the road,", From = 3, To = 10.5 } },
	},
	{
		Name = "Welcome sign",
		Duration = 9,
		Clock = 7.2,
		Weather = "PartlyCloudy",
		Avatar = { At = stand(-262, 0, 14.4, -200, 14.4), Walk = { V(-214, 0, 14.6) }, Speed = 5.4 },
		From = { Look = V(-236, 5.4, 22) },
		To = { Look = V(-120, 6, 4) },
		Captions = {
			{ Text = "there's a little town called Halfway.", From = 1, To = 8.3 },
			{ Text = "Population: enough.", From = 4.5, To = 8.8, Small = true },
		},
	},
	{
		Name = "Bus stop",
		Duration = 9,
		Clock = 8.4,
		Weather = "Clear",
		-- Sitting on the bench, looking across the road at the store.
		Avatar = { At = stand(-30, 0.6, 24, -30, 18), Sit = V(-30, 2.5, 27.3) },
		From = { Look = V(-70, 4, -20) },
		To = { Look = V(-44, 7, -62) },
		Captions = { { Text = "Nothing much happens here.", From = 2, To = 8 } },
	},
	{
		Name = "Halfway Mart",
		Duration = 8,
		Clock = 9.3,
		Weather = "Clear",
		-- Up to the doors, they slide open, and in you go.
		Avatar = { At = stand(-50, 0.25, -38, -50, -70), Walk = { V(-50, 0.6, -57), V(-50, 0.6, -70), V(-56, 0.6, -76) }, Speed = 6 },
		From = { Look = V(-50, 7, -62) },
		To = { Look = V(-44, 4.5, -90) },
		Captions = { { Text = "Mostly.", From = 4.5, To = 8 } },
	},
	{
		Name = "The duck",
		Duration = 11,
		Clock = 11.2,
		Weather = "Clear",
		Event = { Id = "UnusualVehicle", Options = { Variant = "duck", StartX = -120, Speed = 20 } },
		-- On the sidewalk as it rolls past. Your head follows it.
		Avatar = { At = stand(25, 0.55, 15.5, -60, 8) },
		From = { Look = V(-60, 6, 6) },
		To = { Look = V(-60, 6, 6) },
		Track = { Model = "Event_DuckTruck", Offset = V(0, 7, 0), Weight = 0.9 },
	},
	{
		Name = "Gerald",
		Duration = 6,
		Clock = 12.1,
		Weather = "Clear",
		Event = { Id = "RoadsideObject", Options = { Kind = "gnome", Spot = CFrame.new(-6, 0.55, 19.5) } },
		-- Crouching down to say hello.
		Avatar = { At = stand(-6, 0.55, 14.4, -6, 19.5), Crouch = true },
		From = { Look = V(-6, 1.4, 19.5), Fov = 55 },
		To = { Look = V(-6, 2, 19.5), Fov = 52 },
	},
	{
		Name = "Why it crossed",
		Duration = 9.5,
		Clock = 13.2,
		Weather = "Clear",
		Event = {
			Id = "FunnyIncident",
			Options = {
				Variant = "chicken",
				From = V(40, 0, 27),
				To = V(40, 0, -36),
				Speed = 5.5,
				DotSpot = CFrame.new(40, 3.6, 39.2),
				DotLineAt = 3.2,
			},
		},
		Avatar = { At = stand(46, 0.2, -10, 40, 20) },
		From = { Look = V(41, 3.5, 22) },
		To = { Look = V(40, 2, 6) },
		Track = { Model = "Event_Chicken", Offset = V(0, 1, 0), Weight = 0.55 },
		FadeOut = 0.8,
	},
	{
		Name = "The trail",
		Duration = 9,
		Clock = 16.7,
		Weather = "Clear",
		FadeIn = 0.8,
		Avatar = { At = stand(-113, 0, 22, -114, 50), Walk = { V(-114, 0, 50), V(-109, 0, 72) }, Speed = 5.6 },
		From = { Look = V(-115, 4.5, 95) },
		To = { Look = V(-103, 4, 135) },
		Captions = { { Text = "Take the trail sometime.", From = 2, To = 7.5 } },
	},
	{
		Name = "The tiny door",
		Duration = 7,
		Clock = 16.9,
		Weather = "Clear",
		-- Crouching closer to the old oak to see what that little door is.
		Avatar = { At = stand(-109, 0, 121, -100, 120), Walk = { V(-104.8, 0, 120.5) }, Speed = 1.6, Crouch = true },
		From = { Look = V(-98, 7, 120), Fov = 58 },
		To = { Look = V(-100.8, 0.9, 120), Fov = 52 },
	},
	{
		Name = "Wendell",
		Duration = 7,
		Clock = 17,
		Weather = "Clear",
		-- On the bridge next to Wendell, then gazing downstream.
		Avatar = { At = stand(-147.6, 1.1, 180.6, -140, 180.6) },
		From = { Look = V(-147.8, 5.4, 184) },
		To = { Look = V(-128, 3, 187) },
		Cues = { { At = 1, Do = "Say", Npc = "Wendell", Text = "Haven't caught a fish in years. Best hobby I ever picked up.", Seconds = 5.5 } },
	},
	{
		Name = "The deer",
		Duration = 8,
		Clock = 17.2,
		Weather = "Clear",
		Event = {
			Id = "WoodsNoise",
			Options = {
				Kind = "deer",
				Spot = CFrame.lookAt(V(-128, 0, 74), V(-110, 0, 66)),
				RevealAfter = 2.5,
				LeaveAfter = 2,
				FaceToward = V(-110.5, 4.7, 66),
			},
		},
		Avatar = { At = stand(-110.5, 0, 66, -128, 74) },
		From = { Look = V(-128, 3.5, 74), Fov = 58 },
		To = { Look = V(-130, 3.5, 75), Fov = 58 },
		Track = { Model = "Event_Deer", Offset = V(0, 4, 0), Weight = 0.8 },
		FadeOut = 0.8,
	},
	{
		Name = "The lookout",
		Duration = 12,
		Clock = 17.75,
		Weather = "Clear",
		Mood = { Name = "Sunset", Value = 1, Seconds = 3 },
		FadeIn = 0.8,
		-- On the bench at the top of the hill, looking down the slope and out over the town.
		Avatar = { At = stand(-150, 29.2, 345.5, -150, 330), Sit = V(-150, 30.8, 344) },
		From = { Look = V(-128, 20, 290), Fov = 62 },
		To = { Look = V(-60, 10, -10), Fov = 60 },
		Captions = { { Text = "Stay for the sunset.", From = 3, To = 10 } },
		FadeOut = 0.8,
	},
	{
		Name = "Storm",
		Duration = 12,
		Clock = 18.6,
		Weather = "Overcast",
		WeatherRamp = { Name = "Storm", Seconds = 6 },
		FadeIn = 0.8,
		-- Out in the store's parking lot, looking up as the sky turns.
		Avatar = { At = stand(-46, 0.25, -50, -40, 0) },
		From = { Look = V(-10, 40, 30) },
		To = { Look = V(10, 8, 20) },
		Cues = { { At = 5.5, Do = "Flash", Strength = 1 }, { At = 9.6, Do = "Flash", Strength = 0.7 } },
		Captions = { { Text = "Some days it rains.", From = 4, To = 10 } },
	},
	{
		Name = "Lights out",
		Duration = 11,
		Clock = 19.4,
		Weather = "Drizzle",
		Event = { Id = "PowerOutage", Options = { OffAfter = 2.5, Duration = 4.5 } },
		-- In a window booth at the diner when the lights go out.
		Avatar = { At = stand(41, 0.6, 46.2, 30, 46.2), Sit = V(41, 1.6, 46.2) },
		From = { Look = V(20, 8, 52) },
		To = { Look = V(42, 8, 64) },
		Captions = { { Text = "Some nights the lights take a little nap.", From = 3.5, To = 9 } },
		FadeOut = 0.8,
	},
	{
		Name = "Main street at night",
		Duration = 9,
		Clock = 21.6,
		Weather = "Clear",
		FadeIn = 0.8,
		-- Walking home under the streetlights.
		Avatar = { At = stand(140, 0.55, -16.5, 70, -16.5), Walk = { V(80, 0.55, -16.5) }, Speed = 6.5 },
		From = { Look = V(60, 6, -12) },
		To = { Look = V(-10, 5, -6) },
	},
	{
		Name = "Something rare",
		Duration = 13,
		Clock = 22.3,
		Weather = "Clear",
		Event = { Id = "RareOccurrence", Options = { Fast = true } },
		-- Stepping slowly into the clearing toward the glow.
		Avatar = { At = stand(-186, 0, 232.5, -210, 242), Walk = { V(-200.5, 0, 238.2) }, Speed = 1.5 },
		From = { Look = V(-210, 4.5, 242), Fov = 60 },
		To = { Look = V(-206.6, 1.2, 238.7), Fov = 56 },
		Captions = {
			{ Text = "And sometimes…", From = 1, To = 4.5 },
			{ Text = "…something you can't quite explain.", From = 6, To = 11.8 },
		},
		FadeOut = 1,
	},
	{
		Name = "Title",
		Duration = 11,
		Clock = 6.35,
		Weather = "Fog",
		FadeIn = 1.5,
		-- Back on the bus stop bench at dawn, where it all started.
		Avatar = { At = stand(-30, 0.6, 24, -30, 18), Sit = V(-30, 2.5, 27.3) },
		From = { Look = V(-30, 4, -20) },
		To = { Look = V(-38, 9, -70) },
		Title = { Text = "Somewhere Along the Road", Sub = "Coming soon to Roblox", From = 2.5 },
		FadeOut = 3,
	},
} :: { Shot }

return Cutscene
