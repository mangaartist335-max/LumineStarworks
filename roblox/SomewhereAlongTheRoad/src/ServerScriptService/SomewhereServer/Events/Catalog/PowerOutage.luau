--!strict
-- 5. A brief power outage. Everything electric flickers, goes quiet, then hums back to life.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Text = require(ReplicatedStorage:WaitForChild("SomewhereShared"):WaitForChild("Text"))
local EventContext = require(script.Parent.Parent.EventContext)

local function nearSomeone(ctx: EventContext.Context, npcName: string, radius: number): any
	local npc = ctx.Systems.NPCs.Get(npcName)
	if npc and not npc.Busy and ctx:NearestPlayerDistance(npc.Root.Position) < radius then
		return npc
	end
	return nil
end

return {
	Id = "PowerOutage",
	Name = "Brief power outage",
	Resources = { "Power" },
	Cooldown = 1500,
	Weight = function(systems: any): number
		-- Far more noticeable (and more likely) after dark.
		return if systems.DayNight.IsDark() then 9 else 3
	end,
	Run = function(ctx: EventContext.Context)
		local S = ctx.Systems
		ctx:OnCleanup(function()
			S.Net.Set("PowerOn", true)
		end)
		S.Lights.Flicker(1.6)
		S.Net.Set("PowerOn", false)
		local marv = nearSomeone(ctx, "Marv", 40)
		if marv then
			marv:Say(Text.Lines.MarvOutage)
		end
		local dot = nearSomeone(ctx, "Dot", 40)
		if dot then
			task.delay(2.5, function()
				dot:Say(Text.Lines.DotOutage)
			end)
		end
		if not ctx:Wait(ctx.Rng:NextNumber(25, 55)) then
			return
		end
		S.Net.Set("PowerOn", true)
		S.Lights.Flicker(1.2)
		marv = nearSomeone(ctx, "Marv", 40)
		if marv then
			marv:Say(Text.Lines.MarvPowerBack)
		end
	end,
}
