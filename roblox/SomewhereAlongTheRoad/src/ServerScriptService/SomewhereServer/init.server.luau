--!strict
-- Somewhere Along the Road: server entry point.
-- Builds whatever part of the town is missing, then starts the systems in order.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("SomewhereShared"):WaitForChild("Config"))
local cutscene = Config.Mode == "Cutscene"

-- In cutscene mode nobody gets a character: the camera is the only one on set.
-- This has to happen before anyone joins, so it's the very first thing we do.
Players.CharacterAutoLoads = not cutscene

local World = script:WaitForChild("World")
local Systems = script:WaitForChild("Systems")
local Events = script:WaitForChild("Events")

local Builder = require(World:WaitForChild("Builder"))
Builder.EnsureBuilt()

local ctx = {
	Town = workspace:WaitForChild(Config.World.FolderName),
	Net = require(Systems.Net),
	DayNight = require(Systems.DayNight),
	Weather = require(Systems.Weather),
	Lights = require(Systems.Lights),
	Store = require(Systems.StoreService),
	Discoveries = require(Systems.Discoveries),
	Items = require(Systems.Items),
	Interactions = require(Systems.Interactions),
	NPCs = require(Systems.NPCs),
	Spawning = require(Systems.Spawning),
	Director = require(Systems.Director),
	Events = require(Events.EventDirector),
}

ctx.Net.Init()
ctx.Weather.Init(ctx)
ctx.DayNight.Init(ctx)
ctx.Lights.Init(ctx)
ctx.Store.Init(ctx)
ctx.Discoveries.Init(ctx)
ctx.Items.Init(ctx)
ctx.Interactions.Init(ctx)
ctx.Spawning.Init(ctx)
ctx.NPCs.Init(ctx)
ctx.Events.Init(ctx)
ctx.Director.Init(ctx)

if cutscene then
	ctx.Events.SetAuto(false)
	require(Systems.CutsceneDirector).Init(ctx)
end

print(`[Somewhere] {Config.GameName} v{Config.Version} is running. Have a nice walk.`)
