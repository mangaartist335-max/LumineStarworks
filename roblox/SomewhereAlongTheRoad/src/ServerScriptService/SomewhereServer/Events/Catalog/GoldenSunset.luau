--!strict
-- 8. A quiet, beautiful sunset. The sky clears and goes gold and pink. Hollis sits on his porch.
--    Anyone who stands still for a little while to watch it gets a small discovery.

local Players = game:GetService("Players")

local EventContext = require(script.Parent.Parent.EventContext)

local STILL_SECONDS = 8

return {
	Id = "GoldenSunset",
	Name = "A quiet, beautiful sunset",
	Resources = { "Weather", "Sky", "Hollis" },
	Cooldown = 1300,
	Weight = function(systems: any): number
		local clock = systems.DayNight.GetClock()
		local w = systems.Weather.Get()
		return if clock > 16.6 and clock < 17.5 and w.Storm < 0.3 then 14 else 0
	end,
	Run = function(ctx: EventContext.Context)
		local S = ctx.Systems
		if ctx.Forced then
			local clock = S.DayNight.GetClock()
			if clock < 16.6 or clock > 18.2 then
				S.DayNight.SetClock(17.05)
			end
		end
		local clear = S.Weather.Override("Clear", 35)
		S.DayNight.SetMood("Sunset", 1, 35)
		ctx:OnCleanup(function()
			S.Weather.Release(clear)
			S.DayNight.SetMood("Sunset", 0, 25)
		end)

		-- Hollis takes a seat on his porch to watch.
		local hollis = S.NPCs.Get("Hollis")
		local porchSeat: Seat? = nil
		local house = ctx:Find("House_S1")
		if house then
			for _, d in house:GetDescendants() do
				if d:IsA("Seat") and d.Name == "BenchSeat" then
					porchSeat = d
				end
			end
		end
		if hollis and not hollis.Busy and porchSeat and not porchSeat.Occupant then
			hollis.Busy = true
			ctx:OnCleanup(function()
				hollis.Busy = false
				hollis:GoHome()
			end)
			ctx:Spawn(function()
				hollis:WalkTo(porchSeat.Position + porchSeat.CFrame.LookVector * 3, 20)
				hollis:WalkTo(porchSeat.Position, 6)
				hollis:SitOn(porchSeat)
			end)
		end

		-- Stand still and watch.
		local lastPos: { [Player]: Vector3 } = {}
		local stillFor: { [Player]: number } = {}
		while not ctx.Cancelled and S.DayNight.GetClock() < 18.9 and S.DayNight.GetClock() > 12 do
			for _, player in Players:GetPlayers() do
				local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart") :: BasePart?
				if root then
					local before = lastPos[player]
					if before and (root.Position - before).Magnitude < 1.2 then
						stillFor[player] = (stillFor[player] or 0) + 1
						if stillFor[player] >= STILL_SECONDS then
							S.Discoveries.Award(player, "quiet_sunset")
						end
					else
						stillFor[player] = 0
					end
					lastPos[player] = root.Position
				end
			end
			if not ctx:Wait(1) then
				return
			end
		end
		S.DayNight.SetMood("Sunset", 0, 40)
		ctx:Wait(20)
	end,
}
