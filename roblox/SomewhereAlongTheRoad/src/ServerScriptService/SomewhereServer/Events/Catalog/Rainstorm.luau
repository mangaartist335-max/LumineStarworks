--!strict
-- 1. A sudden rainstorm: the sky goes dark, it pours for a few minutes, then eases off.

local EventContext = require(script.Parent.Parent.EventContext)

return {
	Id = "Rainstorm",
	Name = "Sudden rainstorm",
	Resources = { "Weather" },
	Cooldown = 900,
	Weight = function(systems: any): number
		local w = systems.Weather.Get()
		return if w.Rain > 0.3 then 0 else 9
	end,
	Run = function(ctx: EventContext.Context)
		local Weather = ctx.Systems.Weather
		local storm = Weather.Override("Storm", 25)
		ctx:OnCleanup(function()
			Weather.Release(storm)
		end)
		if not ctx:Wait(ctx.Rng:NextNumber(130, 220)) then
			return
		end
		-- Easing off: a drizzle for a little while before the sky decides what's next.
		local drizzle = Weather.Override("Drizzle", 30)
		ctx:OnCleanup(function()
			Weather.Release(drizzle)
		end)
		Weather.Release(storm)
		ctx:Wait(ctx.Rng:NextNumber(40, 70))
	end,
}
