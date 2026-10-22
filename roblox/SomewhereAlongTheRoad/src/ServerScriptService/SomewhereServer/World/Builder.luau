--!strict
-- Builds the whole town. Used three ways:
--   * the offline place builder (tools/build.luau) bakes the parts into the .rbxl file,
--   * the Command Bar bootstrap builds everything in Studio edit mode,
--   * the server calls EnsureBuilt() at startup, which only builds what's missing.

local Config = require(game:GetService("ReplicatedStorage"):WaitForChild("SomewhereShared"):WaitForChild("Config"))
local Kit = require(script.Parent.Kit)
local Ground = require(script.Parent.Ground)
local Roads = require(script.Parent.Roads)
local Store = require(script.Parent.Store)
local Diner = require(script.Parent.Diner)
local Houses = require(script.Parent.Houses)
local Streetside = require(script.Parent.Streetside)
local Nature = require(script.Parent.Nature)

local Builder = {}

local rgb = Color3.fromRGB

function Builder.Build(): Folder
	local existing = workspace:FindFirstChild(Config.World.FolderName)
	if existing then
		existing:Destroy()
	end
	local root = Instance.new("Folder")
	root.Name = Config.World.FolderName
	local seed = Config.World.Seed
	-- Each district gets its own random stream so editing one never reshuffles the others.
	Roads.build(root)
	Store.build(root, Kit.rng(seed + 1))
	Diner.build(root, Kit.rng(seed + 2))
	Houses.build(root, Kit.rng(seed + 3))
	Streetside.build(root, Kit.rng(seed + 4))
	Nature.build(root, Kit.rng(seed + 5))
	Ground.buildBounds(root, Kit)
	root.Parent = workspace
	return root
end

function Builder.BuildTerrain(terrain: any)
	Ground.buildTerrain(terrain)
	if typeof(terrain) == "Instance" then
		terrain:SetAttribute(Config.World.TerrainMarker, true)
	end
end

local function ensure(parent: Instance, className: string, name: string): Instance
	local found = parent:FindFirstChild(name)
	if found and found.ClassName == className then
		return found
	end
	local inst = Instance.new(className :: any)
	inst.Name = name
	inst.Parent = parent
	return inst
end

-- Sky, atmosphere and post effects. DayNight animates these; this just makes sure they exist.
function Builder.SetupLighting(lighting: Lighting, terrain: Terrain?)
	-- Not settable from game scripts at runtime; fine in Studio, the command bar and the offline build.
	pcall(function()
		(lighting :: any).Technology = Enum.Technology.Future
	end)
	lighting.GeographicLatitude = Config.Time.Latitude
	lighting.ClockTime = Config.Time.StartClockTime
	lighting.GlobalShadows = true
	lighting.Brightness = 2.6
	lighting.EnvironmentDiffuseScale = 0.6
	lighting.EnvironmentSpecularScale = 0.5
	lighting.ShadowSoftness = 0.25

	local atmosphere = ensure(lighting, "Atmosphere", "Atmosphere") :: Atmosphere
	atmosphere.Density = 0.3
	atmosphere.Offset = 0.12
	atmosphere.Color = rgb(206, 214, 226)
	atmosphere.Decay = rgb(112, 118, 132)
	atmosphere.Glare = 0.2
	atmosphere.Haze = 1.1

	local sky = ensure(lighting, "Sky", "Sky") :: Sky
	sky.SunAngularSize = 14
	sky.MoonAngularSize = 9
	sky.StarCount = 3000

	local bloom = ensure(lighting, "BloomEffect", "Bloom") :: BloomEffect
	bloom.Intensity = 0.6
	bloom.Size = 28
	bloom.Threshold = 1.6

	local grade = ensure(lighting, "ColorCorrectionEffect", "Grade") :: ColorCorrectionEffect
	grade.Saturation = 0.06
	grade.Contrast = 0.06
	grade.Brightness = 0
	grade.TintColor = rgb(255, 250, 244)

	local rays = ensure(lighting, "SunRaysEffect", "SunRays") :: SunRaysEffect
	rays.Intensity = 0.04
	rays.Spread = 0.6

	local dof = ensure(lighting, "DepthOfFieldEffect", "TrailerFocus") :: DepthOfFieldEffect
	dof.Enabled = false
	dof.FarIntensity = 0.25
	dof.FocusDistance = 40
	dof.InFocusRadius = 60
	dof.NearIntensity = 0

	if terrain then
		local clouds = ensure(terrain, "Clouds", "Clouds") :: Clouds
		clouds.Cover = 0.55
		clouds.Density = 0.55
		clouds.Color = rgb(255, 255, 255)
		pcall(function()
			(terrain :: any).Decoration = true
		end)
		terrain.WaterColor = rgb(62, 104, 96)
		terrain.WaterTransparency = 0.55
		terrain.WaterReflectance = 0.35
		terrain.WaterWaveSize = 0.05
		terrain.WaterWaveSpeed = 4
	end
end

-- Terrain material colours can only be set from a live engine (not the offline builder).
function Builder.TintTerrain(terrain: Terrain)
	terrain:SetMaterialColor(Enum.Material.Grass, rgb(106, 136, 74))
	terrain:SetMaterialColor(Enum.Material.LeafyGrass, rgb(96, 124, 66))
	terrain:SetMaterialColor(Enum.Material.Ground, rgb(122, 98, 74))
	terrain:SetMaterialColor(Enum.Material.Mud, rgb(88, 72, 58))
	terrain:SetMaterialColor(Enum.Material.Asphalt, rgb(70, 70, 72))
	terrain:SetMaterialColor(Enum.Material.Pavement, rgb(150, 146, 140))
	terrain:SetMaterialColor(Enum.Material.Concrete, rgb(150, 146, 140))
end

-- Called by the server on startup: only builds what's missing, so Studio edits survive.
-- SoundService.SomewhereSounds: one empty Sound per slot, ready for your uploaded audio.
function Builder.SetupSounds()
	local Sounds = require(game:GetService("ReplicatedStorage"):WaitForChild("SomewhereShared"):WaitForChild("Sounds"))
	Sounds.EnsureSlots()
end

function Builder.EnsureBuilt()
	if not workspace:FindFirstChild(Config.World.FolderName) then
		Builder.Build()
	end
	local terrain = workspace.Terrain
	if not terrain:GetAttribute(Config.World.TerrainMarker) then
		Builder.BuildTerrain(terrain)
	end
	Builder.TintTerrain(terrain)
	Builder.SetupLighting(game:GetService("Lighting"), terrain)
	Builder.SetupSounds()
end

return Builder
