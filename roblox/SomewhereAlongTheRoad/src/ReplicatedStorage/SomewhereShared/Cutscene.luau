--!strict
-- The trailer, shot by shot. Press Play and it runs from top to bottom by itself, starring
-- your own avatar. Tap or click to jump ahead to the next scene.
--
-- Every shot moves the camera from `From` to `To` over `Duration` seconds.
--   Pos  = where the camera is,  Look = the point it aims at,  Fov = lens (smaller = more zoom)
-- Optional per shot:
--   Clock        time of day (0-24) set at the start of the shot
--   Weather      Clear, PartlyCloudy, Overcast, Drizzle, Fog or Storm (set instantly)
--   WeatherRamp  { Name, Seconds } to change weather during the shot
--   Mood         { Name = "Sunset" or "Rare", Value = 0..1, Seconds }
--   Event        { Id, Options, Lead } one of the ten events, staged for the camera.
--                Lead starts it that many seconds before the shot so it's ready on screen.
--   Cues         { { At = seconds, Do = "Flash" | "Say", ... } } little things on a timer
--   Track        { Model, Offset, Weight } keep the camera pointed at a moving thing
--   Captions     { { Text, From, To, Small } } words on screen
--   Title        { Text, Sub, From } the big title card
--   FadeIn / FadeOut  seconds of fade from / to black
--   Avatar       what your character does in this shot (leave it out and you're off camera):
--                  At    = CFrame on the ground where you stand, facing the way you look
--                  Walk  = { points } to stroll through, at Speed studs per second
--                  Sit   = a point next to the seat to sit on (bench, booth...)
--                  Emote = { At = seconds, Name = "Wave" | "Point" | "Laugh" | "Cheer" }
--
-- Tip: to grab a camera position in Studio, line up the editor camera and run this in the
-- Command Bar:  local c = workspace.CurrentCamera.CFrame print(c.Position, c.Position + c.LookVector * 30)

export type Key = { Pos: Vector3, Look: Vector3, Fov: number? }
export type Caption = { Text: string, From: number, To: number, Small: boolean? }
export type Cue = { At: number, Do: string, Npc: string?, Text: string?, Strength: number?, Seconds: number? }
export type Avatar = {
	At: CFrame,
	Walk: { Vector3 }?,
	Speed: number?,
	Sit: Vector3?,
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
	DefaultFov = 50,
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
		Name = "Morning mist",
		Duration = 12,
		Clock = 6.25,
		Weather = "Fog",
		FadeIn = 3,
		From = { Pos = V(330, 62, 60), Look = V(120, 10, 0), Fov = 60 },
		To = { Pos = V(170, 36, 28), Look = V(0, 8, 0), Fov = 58 },
		Captions = { { Text = "Somewhere along the road,", From = 3, To = 10.5 } },
	},
	{
		Name = "Welcome sign",
		Duration = 10,
		Clock = 7.8,
		Weather = "PartlyCloudy",
		From = { Pos = V(-268, 6, 13), Look = V(-236, 5.5, 22) },
		To = { Pos = V(-244, 7.5, 9), Look = V(-40, 9, 0) },
		Captions = {
			{ Text = "there's a little town called Halfway.", From = 1, To = 8.5 },
			{ Text = "Population: enough.", From = 4.5, To = 9, Small = true },
		},
		-- You walk into town along the shoulder, past the sign.
		Avatar = { At = stand(-258, 0, 15.5, -200, 15.5), Walk = { V(-205, 0, 16) }, Speed = 6 },
	},
	{
		Name = "Bus stop",
		Duration = 9,
		Clock = 8.4,
		Weather = "Clear",
		From = { Pos = V(-21, 4.2, 15), Look = V(-30, 3.6, 26.5) },
		To = { Pos = V(-37, 4.2, 15.5), Look = V(-30, 3.6, 26.5) },
		Captions = { { Text = "Nothing much happens here.", From = 2, To = 8 } },
		Avatar = { At = stand(-30, 0.6, 24, -30, 20), Sit = V(-30, 2.5, 27.3) },
	},
	{
		Name = "Halfway Mart",
		Duration = 7,
		Clock = 9.3,
		Weather = "Clear",
		From = { Pos = V(-50, 5.5, -26), Look = V(-50, 7.5, -62) },
		To = { Pos = V(-50, 5, -40), Look = V(-50, 8, -62) },
		Captions = { { Text = "Mostly.", From = 4, To = 7 } },
		-- The automatic doors open as you walk up, and you head inside.
		Avatar = { At = stand(-50, 0.25, -39, -50, -70), Walk = { V(-50, 0.6, -56), V(-50, 0.6, -68) }, Speed = 7 },
	},
	{
		Name = "The duck",
		Duration = 11,
		Clock = 11.2,
		Weather = "Clear",
		Event = { Id = "UnusualVehicle", Options = { Variant = "duck", StartX = -120, Speed = 20 } },
		From = { Pos = V(36, 3.2, 18.5), Look = V(-60, 7, 4), Fov = 55 },
		To = { Pos = V(33, 3.4, 18.5), Look = V(-60, 7, 4), Fov = 55 },
		Track = { Model = "Event_DuckTruck", Offset = V(0, 8, 0), Weight = 0.85 },
		Avatar = { At = stand(25, 0.55, 15.5, -60, 8), Emote = { At = 7.2, Name = "Wave" } },
	},
	{
		Name = "Gerald",
		Duration = 6,
		Clock = 12.1,
		Weather = "Clear",
		Event = { Id = "RoadsideObject", Options = { Kind = "gnome", Spot = CFrame.new(-6, 0.55, 19.5) } },
		From = { Pos = V(-1.5, 2.4, 20.6), Look = V(-9, 2.2, 12), Fov = 42 },
		To = { Pos = V(-2.4, 2.2, 20.4), Look = V(-9, 2.1, 12), Fov = 40 },
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
		From = { Pos = V(52, 2.8, -17), Look = V(40, 2.4, 16) },
		To = { Pos = V(50.5, 2.6, -15.5), Look = V(40, 2, 12) },
		FadeOut = 0.8,
		Avatar = { At = stand(45, 0.2, -11, 40, 10), Emote = { At = 4, Name = "Point" } },
	},
	{
		Name = "The trail",
		Duration = 9,
		Clock = 16.7,
		Weather = "Clear",
		FadeIn = 0.8,
		From = { Pos = V(-113, 4.4, 20), Look = V(-111, 4, 70) },
		To = { Pos = V(-111.5, 4.8, 58), Look = V(-106, 4, 100) },
		Captions = { { Text = "Take the trail sometime.", From = 2, To = 7.5 } },
		Avatar = { At = stand(-113, 0, 31, -114, 50), Walk = { V(-114, 0, 50), V(-109, 0, 75) }, Speed = 5.5 },
	},
	{
		Name = "The tiny door",
		Duration = 6,
		Clock = 16.9,
		Weather = "Clear",
		From = { Pos = V(-106, 1.9, 123.5), Look = V(-100.8, 1.2, 120), Fov = 42 },
		To = { Pos = V(-104, 1.5, 121.6), Look = V(-100.8, 1.1, 120), Fov = 40 },
	},
	{
		Name = "Wendell",
		Duration = 7,
		Clock = 17,
		Weather = "Clear",
		From = { Pos = V(-128, 3.5, 177.5), Look = V(-148, 4.2, 184) },
		To = { Pos = V(-131, 3.2, 179.5), Look = V(-148, 4, 184) },
		Cues = { { At = 1, Do = "Say", Npc = "Wendell", Text = "Haven't caught a fish in years. Best hobby I ever picked up.", Seconds = 5.5 } },
		-- Leaning on the rail next to Wendell.
		Avatar = { At = stand(-147.6, 1.1, 180.6, -140, 180.6) },
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
				FaceToward = V(-110, 4, 66),
			},
		},
		From = { Pos = V(-110, 4, 65), Look = V(-128, 3.5, 74), Fov = 45 },
		To = { Pos = V(-111.5, 4, 66.5), Look = V(-130, 3.5, 75), Fov = 45 },
		FadeOut = 0.8,
		Avatar = { At = stand(-117, 0, 71.5, -128, 74) },
	},
	{
		Name = "The lookout",
		Duration = 12,
		Clock = 17.75,
		Weather = "Clear",
		Mood = { Name = "Sunset", Value = 1, Seconds = 3 },
		FadeIn = 0.8,
		-- A slow rise from behind the bench: you, the sunset, and the town past the treetops.
		From = { Pos = V(-146, 34.6, 356), Look = V(-60, 12, -10), Fov = 55 },
		To = { Pos = V(-150, 40, 362), Look = V(-60, 12, -10), Fov = 52 },
		Captions = { { Text = "Stay for the sunset.", From = 3, To = 10 } },
		FadeOut = 0.8,
		Avatar = { At = stand(-150, 29.2, 345.5, -150, 330), Sit = V(-150, 30.8, 344) },
	},
	{
		Name = "Storm",
		Duration = 12,
		Clock = 18.6,
		Weather = "Overcast",
		WeatherRamp = { Name = "Storm", Seconds = 6 },
		FadeIn = 0.8,
		From = { Pos = V(-30, 24, -46), Look = V(40, 6, 24), Fov = 55 },
		To = { Pos = V(-14, 22, -38), Look = V(40, 6, 24), Fov = 55 },
		Cues = { { At = 5.5, Do = "Flash", Strength = 1 }, { At = 9.6, Do = "Flash", Strength = 0.7 } },
		Captions = { { Text = "Some days it rains.", From = 4, To = 10 } },
	},
	{
		Name = "Lights out",
		Duration = 11,
		Clock = 19.4,
		Weather = "Drizzle",
		Event = { Id = "PowerOutage", Options = { OffAfter = 2.5, Duration = 4.5 } },
		From = { Pos = V(40, 5.5, 6), Look = V(40, 13, 50) },
		To = { Pos = V(40, 5, 12), Look = V(40, 14, 50) },
		Captions = { { Text = "Some nights the lights take a little nap.", From = 3.5, To = 9 } },
		FadeOut = 0.8,
		-- In a window booth when the lights go out.
		Avatar = { At = stand(41, 0.6, 46.2, 30, 46.2), Sit = V(41, 1.6, 46.2) },
	},
	{
		Name = "Main street at night",
		Duration = 9,
		Clock = 21.6,
		Weather = "Clear",
		FadeIn = 0.8,
		From = { Pos = V(190, 6, -2), Look = V(60, 6, 0) },
		To = { Pos = V(112, 6, -4), Look = V(-40, 5, -8) },
		Ease = "Linear",
		Avatar = { At = stand(140, 0.55, -16.5, 70, -16.5), Walk = { V(75, 0.55, -16.5) }, Speed = 7 },
	},
	{
		Name = "Something rare",
		Duration = 13,
		Clock = 22.3,
		Weather = "Clear",
		Event = { Id = "RareOccurrence", Options = { Fast = true } },
		From = { Pos = V(-193, 4.5, 228), Look = V(-210, 4, 242), Fov = 48 },
		To = { Pos = V(-198.5, 4.2, 233), Look = V(-210, 4.5, 242), Fov = 46 },
		Captions = {
			{ Text = "And sometimes…", From = 1, To = 4.5 },
			{ Text = "…something you can't quite explain.", From = 6, To = 11.8 },
		},
		FadeOut = 1,
		Avatar = { At = stand(-201.5, 0, 239.5, -210, 242) },
	},
	{
		Name = "Title",
		Duration = 11,
		Clock = 6.35,
		Weather = "Fog",
		FadeIn = 1.5,
		From = { Pos = V(-38, 4.5, 13), Look = V(-30, 3.8, 26.5), Fov = 55 },
		To = { Pos = V(-34, 22, -10), Look = V(-29, 3, 28), Fov = 58 },
		Title = { Text = "Somewhere Along the Road", Sub = "Coming soon to Roblox", From = 2.5 },
		FadeOut = 3,
		-- Back on the bus stop bench, where it all started.
		Avatar = { At = stand(-30, 0.6, 24, -30, 20), Sit = V(-30, 2.5, 27.3) },
	},
} :: { Shot }

return Cutscene
