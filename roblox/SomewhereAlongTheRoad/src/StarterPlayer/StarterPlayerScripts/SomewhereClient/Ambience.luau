--!strict
-- Background sound: birds by day, crickets at night, wind, rain (muffled indoors), the store's
-- fridge hum, diner chatter, the creek. Every layer is optional: an empty slot (see Sounds) is
-- simply skipped, so the town is just quieter until you add the audio.

local Lighting = game:GetService("Lighting")
local Players = game:GetService("Players")
local SoundService = game:GetService("SoundService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("SomewhereShared")
local Config = require(Shared:WaitForChild("Config"))
local Sounds = require(Shared:WaitForChild("Sounds"))

local Ambience = {}

local state: Folder
local layers: { [string]: Sound } = {}
local spots: { { sound: Sound, slot: string } } = {}
local indoor = false
local fromCamera = false
local rayParams = RaycastParams.new()
rayParams.FilterType = Enum.RaycastFilterType.Exclude

local function smooth(a: number, b: number, x: number): number
	local t = math.clamp((x - a) / (b - a), 0, 1)
	return t * t * (3 - 2 * t)
end

local function layer(slot: string): Sound?
	local s = Sounds.Make(slot, SoundService, { Name = "Ambience_" .. slot, Looped = true, Volume = 0 })
	if not s then
		return nil
	end
	s:Play()
	layers[slot] = s
	return s
end

function Ambience.IsIndoors(): boolean
	return indoor
end

local function updateIndoor()
	local camera = workspace.CurrentCamera
	local character = Players.LocalPlayer.Character
	rayParams.FilterDescendantsInstances = if character then { character } else {}
	local head = if character and not fromCamera then character:FindFirstChild("Head") else nil
	local origin = if head and head:IsA("BasePart") then head.Position else camera.CFrame.Position
	indoor = workspace:Raycast(origin, Vector3.new(0, 60, 0), rayParams) ~= nil
end

local function attachSpots(town: Instance)
	for _, d in town:GetDescendants() do
		local slot = d:GetAttribute("AmbientSound")
		if typeof(slot) == "string" and d:IsA("BasePart") and slot ~= "Jukebox" then
			local s = Sounds.Make(slot, d, { Name = "Ambient_" .. slot, Looped = true, Volume = 0 })
			if s then
				s.RollOffMode = Enum.RollOffMode.InverseTapered
				s.RollOffMinDistance = 8
				s.RollOffMaxDistance = 60
				s:Play()
				table.insert(spots, { sound = s, slot = slot })
			end
		end
	end
end

function Ambience.Thunder(strength: number)
	-- The rumble arrives a moment after the flash (later and softer when it's further away).
	task.delay(1 + (1 - strength) * 3, function()
		local s = Sounds.Make("Thunder", SoundService, { Volume = 0.5 + strength * 0.4 })
		if not s then
			return
		end
		s:Play()
		s.Ended:Once(function()
			s:Destroy()
		end)
	end)
end

-- `useCamera`: judge "indoors" from the camera, not the character (the cutscene uses this).
function Ambience.Init(useCamera: boolean?)
	fromCamera = useCamera == true
	state = ReplicatedStorage:WaitForChild("SomewhereState") :: Folder
	for _, slot in { "DayBirds", "NightCrickets", "Wind", "Rain" } do
		layer(slot)
	end
	task.spawn(function()
		local town = workspace:WaitForChild(Config.World.FolderName, 30)
		if town then
			attachSpots(town)
		end
	end)

	task.spawn(function()
		while true do
			updateIndoor()
			local clock = Lighting.ClockTime
			local day = smooth(5.2, 6.6, clock) * (1 - smooth(18.6, 19.8, clock))
			local rain = (state:GetAttribute("Rain") :: number?) or 0
			local wind = (state:GetAttribute("Wind") :: number?) or 0.2
			local inside = if indoor then 0.35 else 1
			local targets = {
				DayBirds = day * (1 - rain) * 0.45 * inside,
				NightCrickets = (1 - day) * (1 - rain) * 0.4 * inside,
				Wind = (0.06 + 0.35 * wind) * inside,
				Rain = 0.8 * rain * (if indoor then 0.4 else 1),
			}
			for slot, s in layers do
				local target = (targets :: any)[slot] or 0
				s.Volume += (target - s.Volume) * 0.25
			end
			local power = state:GetAttribute("PowerOn") == true
			local storeOpen = state:GetAttribute("StoreOpen") == true
			for _, spot in spots do
				local target = 0.5
				if spot.slot == "StoreHum" then
					target = if power and storeOpen then 0.35 else 0
				elseif spot.slot == "DinerChatter" then
					-- A little hush when the lights go out, then everyone carries on.
					target = if clock > 6 and clock < 22 then (if power then 0.4 else 0.25) else 0
				end
				spot.sound.Volume += (target - spot.sound.Volume) * 0.3
			end
			task.wait(0.25)
		end
	end)
end

return Ambience
