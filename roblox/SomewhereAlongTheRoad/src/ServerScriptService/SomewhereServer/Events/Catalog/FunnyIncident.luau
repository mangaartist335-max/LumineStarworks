--!strict
-- 9. A small, harmless, funny moment with the locals:
--    Hollis's lawn mower makes a run for it, or a chicken crosses the road (Dot has questions).

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Text = require(ReplicatedStorage:WaitForChild("SomewhereShared"):WaitForChild("Text"))
local EventContext = require(script.Parent.Parent.EventContext)
local Motion = require(script.Parent.Parent.Motion)
local Props = require(script.Parent.Parent.Parent.World.Props)

local function cancelled(ctx: EventContext.Context): () -> boolean
	return function()
		return ctx.Cancelled
	end
end

local function mower(ctx: EventContext.Context)
	local S = ctx.Systems
	local home = ctx:Anchor("MowerHome")
	local hollis = S.NPCs.Get("Hollis")
	if not home then
		return
	end
	local model = ctx:Track(Props.mower(workspace, home))
	model.Name = "Event_Mower"
	local rig = Motion.Rig(model, true)
	ctx:Sound("Mower", rig.Root, true, 0.5)
	ctx:AwardNearby(function()
		return rig.Root.Position
	end, 45, "runaway_mower")

	if hollis and not hollis.Busy then
		hollis.Busy = true
		ctx:OnCleanup(function()
			hollis.Busy = false
			hollis:GoHome()
		end)
	else
		hollis = nil
	end

	-- The mower wanders off across the road, Hollis close behind.
	local start = home.Position
	local route = {
		start + Vector3.new(0, 0, -20),
		start + Vector3.new(-12, 0, -36),
		start + Vector3.new(-26, 0, -58),
		start + Vector3.new(-30, 0, -70),
	}
	if hollis then
		hollis:Say(Text.Lines.HollisMower)
		hollis.Humanoid.WalkSpeed = 7
		ctx:Spawn(function()
			while not ctx.Cancelled and model.Parent do
				local behind = rig.Root.Position - rig.Root.CFrame.LookVector * 4
				hollis.Humanoid:MoveTo(behind)
				hollis:Play("Walk", true)
				task.wait(0.3)
			end
		end)
	end
	for _, p in route do
		if not Motion.MoveTo(rig, p, 5.5, cancelled(ctx)) then
			return
		end
	end
	if not ctx:Wait(2.5) then
		return
	end
	if hollis then
		hollis.Humanoid.WalkSpeed = 9
		hollis:Say(Text.Lines.HollisMowerCaught)
	end
	if not ctx:Wait(3) then
		return
	end
	-- Walk it back home, slowly, with dignity.
	for i = #route - 1, 1, -1 do
		if not Motion.MoveTo(rig, route[i], 3.5, cancelled(ctx)) then
			return
		end
	end
	Motion.MoveTo(rig, start, 3.5, cancelled(ctx))
	ctx:Wait(2)
end

local function chicken(ctx: EventContext.Context)
	local S = ctx.Systems
	local o = ctx.Options
	local from = (o.From :: Vector3?) or Vector3.new(66, 0, 32)
	local cf = CFrame.lookAt(from, from + Vector3.new(0, 0, -1))
	local model = ctx:Track(Props.chicken(workspace, cf))
	model.Name = "Event_Chicken"
	local rig = Motion.Rig(model, true)
	ctx:Sound("Chicken", rig.Root, false, 0.6)
	ctx:AwardNearby(function()
		return rig.Root.Position
	end, 45, "chicken_crossing")

	local dot = S.NPCs.Get("Dot")
	local dotSpot = o.DotSpot :: CFrame?
	if dot and dotSpot then
		-- Staged: Dot is already out front, watching.
		dot.Busy = true
		ctx:OnCleanup(function()
			dot.Busy = false
			dot:GoHome()
		end)
		dot:Stand()
		dot.Model:PivotTo(dotSpot)
		task.delay((o.DotLineAt :: number?) or 2.5, function()
			if not ctx.Cancelled then
				dot:Say(Text.Lines.DotChicken, 5)
			end
		end)
	elseif dot and not dot.Busy then
		dot.Busy = true
		ctx:OnCleanup(function()
			dot.Busy = false
			dot:GoHome()
		end)
		ctx:Spawn(function()
			local inside = ctx:Anchor("DinerDoorInside")
			local outside = ctx:Anchor("DinerDoorOutside")
			local door = ctx:Find("DinerDoor") :: BasePart?
			if inside and outside then
				for _, name in { "DinerCounterEnd", "DinerFloorMid" } do
					local p = ctx:Anchor(name)
					if p then
						dot:WalkTo(p.Position, 10)
					end
				end
				dot:WalkTo(inside.Position, 14)
				if door then
					S.Interactions.SetDoor(door, true)
				end
				dot:WalkTo(outside.Position, 8)
				dot:Face(rig.Root.Position)
				task.wait(1)
				dot:Say(Text.Lines.DotChicken)
			end
		end)
	end

	-- Little hops, little pauses, all the way across.
	local to = o.To :: Vector3?
	if to then
		-- Staged: one steady trot to the far side.
		if not Motion.MoveTo(rig, to, (o.Speed :: number?) or 5, cancelled(ctx), 0.6) then
			return
		end
	else
		local waypoints = { Vector3.new(65, 0, 14), Vector3.new(63, 0, 2), Vector3.new(62, 0, -10), Vector3.new(60, 0, -22), Vector3.new(57, 0, -40) }
		for _, p in waypoints do
			if not Motion.MoveTo(rig, p, 3.2, cancelled(ctx), 0.6) then
				return
			end
			if not ctx:Wait(ctx.Rng:NextNumber(0.5, 2)) then
				return
			end
		end
	end
	if not ctx:Wait(6) then
		return
	end
	Motion.MoveTo(rig, Vector3.new(64, 0, -110), 4, cancelled(ctx), 0.6)
end

return {
	Id = "FunnyIncident",
	Name = "Funny moment with a local",
	Resources = { "Road", "Hollis", "Dot" },
	Cooldown = 900,
	Weight = 7,
	CanRun = function(systems: any): boolean
		local clock = systems.DayNight.GetClock()
		return clock > 8 and clock < 19
	end,
	Run = function(ctx: EventContext.Context)
		local variant = ctx.Options.Variant
		if variant == "chicken" then
			return chicken(ctx)
		elseif variant == "mower" then
			return mower(ctx)
		end
		if ctx.Systems.NPCs.Available("Hollis") and ctx.Rng:NextNumber() < 0.5 then
			mower(ctx)
		else
			chicken(ctx)
		end
	end,
}
