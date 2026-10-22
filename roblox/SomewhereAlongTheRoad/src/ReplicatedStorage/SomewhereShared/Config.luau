--!strict
-- Somewhere Along the Road: every tunable number lives here.
-- Change values, press Play, see what happens. Nothing else needs editing.

local Config = {}

Config.GameName = "Somewhere Along the Road"
Config.Version = "0.1.0"

Config.World = {
	Seed = 20261022, -- same seed = same trees, same town, every time
	FolderName = "SomewhereTown",
	TerrainMarker = "SomewhereTerrainBuilt",
}

Config.Time = {
	DayLengthMinutes = 24, -- one in-game hour per real minute
	NightSpeedMultiplier = 1.6, -- nights drift by a little faster
	StartClockTime = 15.25, -- servers open on a warm afternoon
	Latitude = 38,
}

Config.Player = {
	WalkSpeed = 12, -- a relaxed stroll
	RunSpeed = 20,
	CameraMaxZoom = 42,
}

Config.Objective = {
	Goal = 3,
}

Config.Events = {
	Enabled = true,
	FirstEventDelay = { 100, 170 }, -- seconds after the server starts
	Gap = { 140, 320 }, -- seconds between event attempts (scaled by the day's mood)
	MaxConcurrent = 2,
	-- Each in-game day rolls a mood. Some days nothing much happens, and that's the point.
	DayProfiles = {
		{ Name = "Quiet", Weight = 25, Budget = { 0, 1 }, GapScale = 1.6 },
		{ Name = "Ordinary", Weight = 55, Budget = { 2, 4 }, GapScale = 1.0 },
		{ Name = "Lively", Weight = 20, Budget = { 4, 6 }, GapScale = 0.7 },
	},
}

-- Optional audio. Every slot is blank on purpose: no unverified assets ship with the game.
-- To add sound: Studio > Toolbox > Audio, pick a track uploaded by "Roblox",
-- right-click > Copy Asset ID, and paste it here as "rbxassetid://123456".
-- Empty slots are simply skipped, and the game still plays fine.
Config.Sounds = {
	DayBirds = "",
	NightCrickets = "",
	Wind = "",
	Rain = "",
	Thunder = "",
	Creek = "",
	StoreHum = "",
	StoreChime = "",
	DinerChatter = "",
	Jukebox = "",
	CounterBell = "",
	Door = "",
	IceCreamTune = "",
	Horn = "",
	Engine = "",
	Tractor = "",
	Rustle = "",
	Owl = "",
	Chicken = "",
	Mower = "",
	SoftHum = "",
	Sip = "",
}

-- Default Roblox R15 animations (owned by Roblox, usable in every experience).
Config.Animations = {
	Idle = "rbxassetid://507766388",
	Walk = "rbxassetid://507777826",
	Run = "rbxassetid://507767714",
	Sit = "rbxassetid://2506281703",
	Wave = "rbxassetid://507770239",
	Point = "rbxassetid://507770453",
	Laugh = "rbxassetid://507770818",
	Cheer = "rbxassetid://507770677",
}

-- Built-in client textures (shipped with Roblox itself).
Config.Textures = {
	RainStreak = "rbxasset://textures/particles/SquareParticle.png",
	Sparkle = "rbxasset://textures/particles/sparkles_main.dds",
	Smoke = "rbxasset://textures/particles/smoke_main.dds",
}

-- Trailer / director tools. In Studio they're always on.
-- In a published game, the owner gets them, plus anyone listed here.
Config.Director = {
	AllowInStudio = true,
	AllowCreator = true,
	UserIds = {} :: { number },
}

-- Soft one-line hints for events that would normally be heard, not seen.
-- Only shown when the matching sound slot above is empty.
Config.SubtleHints = true

return Config
