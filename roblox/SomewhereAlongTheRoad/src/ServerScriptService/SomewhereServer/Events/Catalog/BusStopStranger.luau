--!strict
-- 4. A traveler walks in off the trail and waits at the bus stop. Eventually the Route 9 bus
--    shows up, they climb aboard, and the bus carries on east.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Text = require(ReplicatedStorage:WaitForChild("SomewhereShared"):WaitForChild("Text"))
local EventContext = require(script.Parent.Parent.EventContext)
local Motion = require(script.Parent.Parent.Motion)
local Layout = require(script.Parent.Parent.Parent.World.Layout)
local Vehicles = require(script.Parent.Parent.Parent.World.Vehicles)
local Props = require(script.Parent.Parent.Parent.World.Props)

local rgb = Color3.fromRGB

local LOOKS = {
	{ Skin = rgb(236, 196, 166), Shirt = rgb(150, 110, 80), Pants = rgb(60, 60, 70), Hat = "Fedora", HatColor = rgb(90, 74, 60) },
	{ Skin = rgb(140, 96, 70), Shirt = rgb(200, 120, 90), Pants = rgb(70, 80, 100), Hat = "Bucket", HatColor = rgb(220, 200, 150) },
	{ Skin = rgb(250, 214, 190), Shirt = rgb(110, 140, 170), Pants = rgb(90, 80, 70), Hat = "Cap", HatColor = rgb(170, 60, 50) },
}

return {
	Id = "BusStopStranger",
	Name = "Stranger at the bus stop",
	Resources = { "BusStop", "Road" },
	Cooldown = 900,
	Weight = 8,
	CanRun = function(systems: any): boolean
		local clock = systems.DayNight.GetClock()
		return clock > 7 and clock < 21
	end,
	Run = function(ctx: EventContext.Context)
		local S = ctx.Systems
		local arrive = ctx:Anchor("TravelerArrive")
		local curb = ctx:Anchor("BusStopCurb")
		local bench = ctx:Anchors("BusBench")[1]
		local stop = ctx:Anchor("BusStopRoad")
		if not (arrive and curb and bench and stop) then
			return
		end

		local look = ctx:Pick(LOOKS)
		local traveler = S.NPCs.Spawn({
			Name = "Traveler",
			CFrame = arrive * CFrame.Angles(0, math.rad(-90), 0),
			Skin = look.Skin,
			Shirt = look.Shirt,
			Pants = look.Pants,
			LongSleeves = true,
			Hat = look.Hat,
			HatColor = look.HatColor,
			Talk = false,
		})
		if not traveler then
			return
		end
		ctx:OnCleanup(function()
			traveler:Destroy()
		end)

		-- Talking to them counts as a discovery.
		local index = 0
		S.Interactions.Add(traveler.Root, { ActionText = "Talk", ObjectText = "Traveler", MaxDistance = 9 }, function(player: Player)
			index = index % #Text.NPC.Traveler + 1
			traveler:Say(Text.NPC.Traveler[index])
			S.Discoveries.Award(player, "traveler")
		end)

		traveler:WalkTo(curb.Position, 30)
		if ctx.Cancelled then
			return
		end
		local suitcase = ctx:Track(Props.suitcase(workspace, bench.CFrame * CFrame.new(4.9, -1.9, 0.3) * CFrame.Angles(0, math.rad(80), 0), rgb(120, 80, 60)))
		if bench:IsA("Seat") and not bench.Occupant then
			traveler:WalkTo(bench.Position, 6)
			traveler:SitOn(bench)
		end

		if not ctx:Wait(ctx.Rng:NextNumber(150, 240)) then
			return
		end

		-- Here comes the bus.
		local start = Vector3.new(-(Layout.Road.MaxX - 20), Layout.Road.Top, Layout.Road.LaneOffset)
		local busModel = ctx:Track(Vehicles.bus(workspace, CFrame.new(start) * CFrame.Angles(0, -math.pi / 2, 0)))
		busModel.Name = "Event_Bus"
		local bus = Motion.Rig(busModel)
		local function stopped(): boolean
			return ctx.Cancelled
		end
		ctx:Sound("Engine", bus.Root, true, 0.35)
		-- Line the bus door (12.6 studs ahead of its centre) up with the curb.
		local stopPos = Vector3.new(curb.Position.X - 12.6, Layout.Road.Top + 0.5, Layout.Road.LaneOffset)
		if not Motion.MoveTo(bus, stopPos - Vector3.new(60, 0, 0), 26, stopped) then
			return
		end
		if not Motion.MoveTo(bus, stopPos, 9, stopped) then
			return
		end

		traveler:Stand()
		traveler:Say(Text.Lines.TravelerBus, 4)
		traveler:WalkTo(Vector3.new(curb.Position.X, curb.Position.Y, Layout.Road.Width / 2 + 1.5), 8)
		if not ctx:Wait(1.5) then
			return
		end
		traveler:Destroy()
		suitcase:Destroy()
		if not ctx:Wait(3) then
			return
		end
		Motion.MoveTo(bus, Vector3.new(Layout.Road.MaxX - 20, Layout.Road.Top + 0.5, Layout.Road.LaneOffset), 24, stopped)
	end,
}
