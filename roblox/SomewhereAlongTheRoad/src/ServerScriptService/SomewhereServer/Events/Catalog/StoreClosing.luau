--!strict
-- 3. The store closes for a bit. Marv tapes a note to the door and wanders over to the diner.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Text = require(ReplicatedStorage:WaitForChild("SomewhereShared"):WaitForChild("Text"))
local EventContext = require(script.Parent.Parent.EventContext)

return {
	Id = "StoreClosing",
	Name = "Store closes unexpectedly",
	Resources = { "Store", "Marv" },
	Cooldown = 1200,
	Weight = 7,
	CanRun = function(systems: any): boolean
		local clock = systems.DayNight.GetClock()
		return systems.Store.IsOpen() and clock > 7 and clock < 22
	end,
	Run = function(ctx: EventContext.Context)
		local S = ctx.Systems
		local note = ctx:Pick(Text.ClosedNotes)
		local marv = S.NPCs.Get("Marv")
		local dinerDoor = ctx:Find("DinerDoor") :: BasePart?

		local function point(name: string): Vector3?
			local cf = ctx:Anchor(name)
			return cf and cf.Position
		end

		ctx:OnCleanup(function()
			S.Store.SetOpen(true)
			if marv and marv.Model.Parent then
				marv.Busy = false
				marv:GoHome()
			end
		end)

		-- Reading the note on the door counts as a discovery.
		local sign = S.Store.DoorSign()
		if sign then
			local prompt = S.Interactions.Add(sign, { ActionText = "Read note", ObjectText = "Store door", MaxDistance = 10 }, function(player: Player)
				S.Net.Notify(player, { kind = "note", title = "Taped to the door", body = note })
				S.Discoveries.Award(player, "back_in_fifteen")
			end)
			ctx:Track(prompt)
		end

		if marv then
			marv.Busy = true
			marv:Say(Text.Lines.MarvLeaving)
			if not ctx:Wait(3) then
				return
			end
			local route = { point("StoreBehindCounter"), point("StoreAisle"), point("StoreDoorInside"), point("StoreDoorOutside") }
			for _, p in route do
				if p and not ctx.Cancelled then
					marv:WalkTo(p, 12)
				end
			end
		end
		S.Store.SetOpen(false, note)

		if marv and not ctx.Cancelled then
			for _, name in { "CrosswalkNorth", "CrosswalkSouth", "DinerDoorOutside" } do
				local p = point(name)
				if p and not ctx.Cancelled then
					marv:WalkTo(p, 25)
				end
			end
			if dinerDoor and not ctx.Cancelled then
				S.Interactions.SetDoor(dinerDoor, true)
				task.wait(0.8)
				local inside = point("DinerDoorInside")
				if inside then
					marv:WalkTo(inside, 8)
				end
				local stool = ctx:Anchors("DinerStool")[1]
				if stool and stool:IsA("Seat") and not stool.Occupant then
					marv:WalkTo(stool.Position, 10)
					marv:SitOn(stool)
				end
				local dot = S.NPCs.Get("Dot")
				if dot and not dot.Busy then
					task.delay(2, function()
						if not ctx.Cancelled then
							dot:Say("The usual, Marv?")
						end
					end)
				end
			end
		end

		if not ctx:Wait(ctx.Rng:NextNumber(120, 220)) then
			return
		end

		if marv and marv.Model.Parent then
			marv:Stand()
			for _, name in { "DinerDoorInside", "DinerDoorOutside", "CrosswalkSouth", "CrosswalkNorth", "StoreDoorOutside" } do
				local p = point(name)
				if p and not ctx.Cancelled then
					if name == "DinerDoorOutside" and dinerDoor then
						S.Interactions.SetDoor(dinerDoor, true)
					end
					marv:WalkTo(p, 25)
				end
			end
		end
		if ctx.Cancelled then
			return
		end
		S.Store.SetOpen(true)
		if marv and marv.Model.Parent then
			for _, name in { "StoreDoorInside", "StoreAisle", "StoreBehindCounter" } do
				local p = point(name)
				if p and not ctx.Cancelled then
					marv:WalkTo(p, 12)
				end
			end
			marv:GoHome()
			marv:Say(Text.Lines.MarvBack)
		end
	end,
}
