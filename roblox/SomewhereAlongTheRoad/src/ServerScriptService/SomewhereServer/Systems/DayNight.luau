--!strict
-- The clock, and the light that comes with it. Each step it blends the time-of-day look,
-- then layers weather and any "mood" (a golden sunset, something rare) on top.

local Lighting = game:GetService("Lighting")
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("SomewhereShared"):WaitForChild("Config"))

local DayNight = {}

local rgb = Color3.fromRGB

type Look = {
	Ambient: Color3,
	Outdoor: Color3,
	Brightness: number,
	Exposure: number,
	AtmColor: Color3,
	Decay: Color3,
	Haze: number,
	Glare: number,
	Density: number,
	Tint: Color3,
	Saturation: number,
	Rays: number,
}

local KEYS: { { h: number, look: Look } } = {
	{ h = 0, look = { Ambient = rgb(34, 38, 56), Outdoor = rgb(56, 62, 92), Brightness = 0.6, Exposure = -0.1, AtmColor = rgb(64, 74, 104), Decay = rgb(40, 46, 74), Haze = 1.4, Glare = 0, Density = 0.33, Tint = rgb(206, 214, 255), Saturation = -0.08, Rays = 0 } },
	{ h = 4.6, look = { Ambient = rgb(40, 42, 60), Outdoor = rgb(66, 68, 98), Brightness = 0.7, Exposure = -0.1, AtmColor = rgb(80, 82, 116), Decay = rgb(56, 54, 86), Haze = 1.6, Glare = 0, Density = 0.34, Tint = rgb(214, 214, 250), Saturation = -0.06, Rays = 0 } },
	{ h = 6.0, look = { Ambient = rgb(92, 78, 82), Outdoor = rgb(132, 110, 112), Brightness = 1.6, Exposure = 0, AtmColor = rgb(255, 192, 160), Decay = rgb(150, 104, 120), Haze = 2.2, Glare = 1.1, Density = 0.37, Tint = rgb(255, 234, 218), Saturation = 0.04, Rays = 0.08 } },
	{ h = 7.6, look = { Ambient = rgb(104, 104, 110), Outdoor = rgb(132, 132, 138), Brightness = 2.4, Exposure = 0, AtmColor = rgb(204, 216, 234), Decay = rgb(112, 124, 150), Haze = 1.2, Glare = 0.4, Density = 0.3, Tint = rgb(255, 250, 244), Saturation = 0.06, Rays = 0.05 } },
	{ h = 12, look = { Ambient = rgb(110, 110, 116), Outdoor = rgb(138, 138, 144), Brightness = 3, Exposure = 0, AtmColor = rgb(200, 212, 228), Decay = rgb(106, 114, 130), Haze = 0.9, Glare = 0.2, Density = 0.28, Tint = rgb(255, 254, 250), Saturation = 0.06, Rays = 0.03 } },
	{ h = 16.4, look = { Ambient = rgb(114, 106, 98), Outdoor = rgb(146, 134, 120), Brightness = 2.6, Exposure = 0, AtmColor = rgb(232, 206, 176), Decay = rgb(124, 104, 92), Haze = 1.4, Glare = 0.6, Density = 0.3, Tint = rgb(255, 244, 228), Saturation = 0.08, Rays = 0.06 } },
	{ h = 18.0, look = { Ambient = rgb(118, 88, 82), Outdoor = rgb(156, 112, 100), Brightness = 1.8, Exposure = 0, AtmColor = rgb(255, 172, 124), Decay = rgb(152, 92, 110), Haze = 2.4, Glare = 1.5, Density = 0.35, Tint = rgb(255, 224, 204), Saturation = 0.1, Rays = 0.12 } },
	{ h = 19.3, look = { Ambient = rgb(60, 56, 84), Outdoor = rgb(86, 78, 114), Brightness = 1.0, Exposure = -0.05, AtmColor = rgb(122, 102, 152), Decay = rgb(62, 52, 92), Haze = 1.8, Glare = 0.3, Density = 0.36, Tint = rgb(226, 220, 255), Saturation = 0, Rays = 0.02 } },
	{ h = 21, look = { Ambient = rgb(34, 38, 56), Outdoor = rgb(56, 62, 92), Brightness = 0.6, Exposure = -0.1, AtmColor = rgb(64, 74, 104), Decay = rgb(40, 46, 74), Haze = 1.4, Glare = 0, Density = 0.33, Tint = rgb(206, 214, 255), Saturation = -0.08, Rays = 0 } },
	{ h = 24, look = { Ambient = rgb(34, 38, 56), Outdoor = rgb(56, 62, 92), Brightness = 0.6, Exposure = -0.1, AtmColor = rgb(64, 74, 104), Decay = rgb(40, 46, 74), Haze = 1.4, Glare = 0, Density = 0.33, Tint = rgb(206, 214, 255), Saturation = -0.08, Rays = 0 } },
}

local ctx: any
local clock = Config.Time.StartClockTime
local timeScale = 1
local day = 1
local moods: { [string]: number } = {}
local moodTargets: { [string]: { target: number, rate: number } } = {}
local newDayCallbacks: { (number) -> () } = {}
local apply: () -> ()

local function lookAt(h: number): Look
	for i = 1, #KEYS - 1 do
		local a, b = KEYS[i], KEYS[i + 1]
		if h >= a.h and h <= b.h then
			local t = (h - a.h) / (b.h - a.h)
			t = t * t * (3 - 2 * t)
			local out = {}
			for key, va in a.look :: any do
				local vb = (b.look :: any)[key]
				if typeof(va) == "Color3" then
					out[key] = (va :: Color3):Lerp(vb, t)
				else
					out[key] = va + (vb - va) * t
				end
			end
			return out :: any
		end
	end
	return KEYS[1].look
end

function DayNight.GetClock(): number
	return clock
end

function DayNight.SetClock(h: number)
	clock = h % 24
	Lighting.ClockTime = clock
	if ctx then
		apply()
	end
end

function DayNight.SetTimeScale(scale: number)
	timeScale = math.max(0, scale)
end

function DayNight.GetTimeScale(): number
	return timeScale
end

function DayNight.GetDay(): number
	return day
end

function DayNight.IsNight(): boolean
	return clock >= 19.0 or clock < 5.9
end

function DayNight.IsDark(): boolean
	return clock >= 18.4 or clock < 6.3
end

-- A mood fades to `target` (0..1) over `seconds`. Used by the sunset and rare events.
function DayNight.SetMood(name: string, target: number, seconds: number?)
	moods[name] = moods[name] or 0
	moodTargets[name] = { target = target, rate = 1 / math.max(seconds or 20, 0.5) }
end

-- Drops every mood at once (the cutscene uses this between shots).
function DayNight.ResetMoods()
	for name in moods do
		moods[name] = 0
	end
	table.clear(moodTargets)
end

function DayNight.OnNewDay(callback: (number) -> ())
	table.insert(newDayCallbacks, callback)
end

function apply()
	local look = lookAt(clock)
	local w = ctx.Weather.Get()
	local sunset = moods.Sunset or 0
	local rare = moods.Rare or 0
	local gray = rgb(150, 154, 162)

	local dim = 1 - 0.3 * w.Cloud - 0.35 * w.Storm
	Lighting.Brightness = look.Brightness * dim
	Lighting.ExposureCompensation = look.Exposure - 0.15 * w.Storm
	Lighting.Ambient = look.Ambient:Lerp(look.Ambient:Lerp(gray, 0.3), w.Storm)
	Lighting.OutdoorAmbient = look.Outdoor:Lerp(look.Outdoor:Lerp(gray, 0.4), w.Storm * 0.8)

	local atm = Lighting:FindFirstChildOfClass("Atmosphere")
	if atm then
		local wet = math.max(w.Rain, w.Fog)
		atm.Density = look.Density + 0.08 * w.Rain + 0.16 * w.Fog + 0.06 * w.Storm
		atm.Haze = look.Haze + 1.2 * w.Fog + 0.8 * w.Rain + 1.2 * sunset
		atm.Glare = (look.Glare + 1.4 * sunset) * (1 - w.Cloud * 0.8)
		atm.Color = look.AtmColor:Lerp(rgb(176, 182, 192), wet * 0.7):Lerp(rgb(255, 158, 120), sunset * 0.55):Lerp(rgb(150, 196, 190), rare * 0.35)
		atm.Decay = look.Decay:Lerp(rgb(110, 114, 124), wet * 0.6):Lerp(rgb(170, 90, 120), sunset * 0.5)
	end
	local grade = Lighting:FindFirstChild("Grade") :: ColorCorrectionEffect?
	if grade then
		grade.TintColor = look.Tint:Lerp(rgb(255, 216, 192), sunset * 0.6):Lerp(rgb(214, 255, 238), rare * 0.4)
		grade.Saturation = look.Saturation - 0.14 * w.Rain + 0.08 * sunset
	end
	local rays = Lighting:FindFirstChild("SunRays") :: SunRaysEffect?
	if rays then
		rays.Intensity = (look.Rays + 0.12 * sunset) * (1 - w.Cloud * 0.9)
	end
	local bloom = Lighting:FindFirstChild("Bloom") :: BloomEffect?
	if bloom then
		bloom.Intensity = 0.6 + 0.3 * sunset + 0.4 * rare
	end
	local clouds = workspace.Terrain:FindFirstChildOfClass("Clouds")
	if clouds then
		clouds.Cover = 0.42 + 0.53 * w.Cloud
		clouds.Density = 0.5 + 0.38 * w.Storm
		clouds.Color = rgb(255, 255, 255):Lerp(rgb(118, 122, 130), w.Storm):Lerp(rgb(255, 196, 176), sunset * 0.6)
	end
end

function DayNight.Init(context: any)
	ctx = context
	Lighting.ClockTime = clock
	local hoursPerSecond = 24 / (Config.Time.DayLengthMinutes * 60)
	local acc = 0
	RunService.Heartbeat:Connect(function(dt: number)
		local speed = if DayNight.IsNight() then Config.Time.NightSpeedMultiplier else 1
		local before = clock
		clock += dt * hoursPerSecond * speed * timeScale
		if clock >= 24 then
			clock -= 24
		end
		if clock < before and before - clock > 12 then
			day += 1
			for _, cb in newDayCallbacks do
				task.spawn(cb, day)
			end
		end
		Lighting.ClockTime = clock

		for name, m in moodTargets do
			local cur = moods[name] or 0
			local delta = m.target - cur
			local step = dt * m.rate
			if math.abs(delta) <= step then
				moods[name] = m.target
			else
				moods[name] = cur + math.sign(delta) * step
			end
		end

		acc += dt
		if acc >= 0.2 then
			acc = 0
			apply()
		end
	end)
	apply()
end

return DayNight
