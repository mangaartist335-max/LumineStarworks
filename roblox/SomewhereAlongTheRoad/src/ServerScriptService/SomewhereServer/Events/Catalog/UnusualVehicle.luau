--!strict
-- 2. Something unusual drives through town: an ice cream truck (it stops at the store),
--    a flatbed carrying a giant rubber duck, or a tractor hauling hay at walking pace.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Text = require(ReplicatedStorage:WaitForChild("SomewhereShared"):WaitForChild("Text"))
local EventContext = require(script.Parent.Parent.EventContext)
local Motion = require(script.Parent.Parent.Motion)
local Layout = require(script.Parent.Parent.Parent.World.Layout)
local Vehicles = require(script.Parent.Parent.Parent.World.Vehicles)

local EAST = CFrame.Angles(0, -math.pi / 2, 0)
local WEST = CFrame.Angles(0, math.pi / 2, 0)
local END_X = Layout.Road.MaxX - 20

local function lane(x: number, eastbound: boolean): Vector3
	return Vector3.new(x, Layout.Road.Top + 0.5, if eastbound then Layout.Road.LaneOffset else -Layout.Road.LaneOffset)
end

local function spawnVehicle(ctx: EventContext.Context, builder: (Instance, CFrame) -> Model, eastbound: boolean): Motion.Rig
	-- The cutscene can start a vehicle closer in (StartX) so it reaches the camera on cue.
	local startX = ctx.Options.StartX :: number?
	local start = lane(startX or (if eastbound then -END_X else END_X), eastbound)
	local cf = CFrame.new(start - Vector3.new(0, 0.5, 0)) * (if eastbound then EAST else WEST)
	local model = ctx:Track(builder(workspace, cf))
	model.Name = "Event_" .. model.Name
	return Motion.Rig(model)
end

local function driverHead(rig: Motion.Rig): BasePart?
	return rig.Model:FindFirstChild("DriverHead") :: BasePart?
end

local function say(ctx: EventContext.Context, rig: Motion.Rig, line: string)
	local head = driverHead(rig)
	if head then
		ctx.Systems.NPCs.Bubble(head, "Driver", line, 5)
	end
end

local function cancelled(ctx: EventContext.Context): () -> boolean
	return function()
		return ctx.Cancelled
	end
end

local function iceCream(ctx: EventContext.Context)
	local rig = spawnVehicle(ctx, Vehicles.iceCreamTruck, false)
	ctx:Sound("Engine", rig.Root, true, 0.3)
	local tune = ctx:Sound("IceCreamTune", rig.Root, true, 0.55)
	if not Motion.MoveTo(rig, lane(-30, false), 26, cancelled(ctx)) then
		return
	end
	if not Motion.MoveTo(rig, lane(-52, false), 7, cancelled(ctx)) then
		return
	end
	if not tune then
		ctx:Hint(Text.Hints.IceCreamTune, rig.Root.Position, 260)
	end
	say(ctx, rig, Text.Lines.IceCreamDriver)
	local window = rig.Model:FindFirstChild("ServingWindow") :: BasePart?
	if window then
		ctx.Systems.Interactions.Add(window, { ActionText = "Get ice cream", ObjectText = "Ice cream truck", MaxDistance = 14 }, function(player: Player)
			if ctx.Systems.Items.Give(player, "IceCream") then
				say(ctx, rig, Text.Lines.IceCreamGive)
				ctx.Systems.Discoveries.Award(player, "ice_cream_truck")
			else
				ctx.Systems.Interactions.Toast(player, Text.Lines.AlreadyHave)
			end
		end)
	end
	ctx:AwardNearby(function()
		return rig.Root.Position
	end, 26, "ice_cream_truck")
	if not ctx:Wait(ctx.Rng:NextNumber(50, 70)) then
		return
	end
	if window then
		local prompt = window:FindFirstChildOfClass("ProximityPrompt")
		if prompt then
			prompt:Destroy()
		end
	end
	Motion.MoveTo(rig, lane(-END_X, false), 24, cancelled(ctx))
end

local function duck(ctx: EventContext.Context)
	local rig = spawnVehicle(ctx, Vehicles.duckTruck, true)
	ctx:Sound("Engine", rig.Root, true, 0.35)
	ctx:AwardNearby(function()
		return rig.Root.Position
	end, 55, "big_duck")
	if not Motion.MoveTo(rig, lane(-60, true), (ctx.Options.Speed :: number?) or 20, cancelled(ctx)) then
		return
	end
	if not ctx:Sound("Horn", rig.Root, false, 0.6) then
		ctx:Hint(Text.Hints.Horn, rig.Root.Position, 240)
	end
	say(ctx, rig, Text.Lines.DuckDriver)
	Motion.MoveTo(rig, lane(END_X, true), (ctx.Options.Speed :: number?) or 20, cancelled(ctx))
end

local function tractor(ctx: EventContext.Context)
	local rig = spawnVehicle(ctx, Vehicles.tractorAndWagon, false)
	ctx:Sound("Tractor", rig.Root, true, 0.45)
	ctx:AwardNearby(function()
		return rig.Root.Position
	end, 42, "hay_wagon")
	if not Motion.MoveTo(rig, lane(40, false), 8, cancelled(ctx)) then
		return
	end
	say(ctx, rig, Text.Lines.TractorDriver)
	Motion.MoveTo(rig, lane(-END_X, false), 8, cancelled(ctx))
end

return {
	Id = "UnusualVehicle",
	Name = "Unusual vehicle",
	Resources = { "Road" },
	Cooldown = 600,
	Weight = 10,
	CanRun = function(systems: any): boolean
		local clock = systems.DayNight.GetClock()
		return clock > 7 and clock < 20.5
	end,
	Run = function(ctx: EventContext.Context)
		local variant = ctx.Options.Variant
		if variant == "duck" then
			return duck(ctx)
		elseif variant == "icecream" then
			return iceCream(ctx)
		elseif variant == "tractor" then
			return tractor(ctx)
		end
		local clock = ctx.Systems.DayNight.GetClock()
		local options = { tractor }
		if clock > 9.5 and clock < 19.5 then
			table.insert(options, iceCream)
			table.insert(options, iceCream)
		end
		table.insert(options, duck)
		ctx:Pick(options)(ctx)
	end,
}
