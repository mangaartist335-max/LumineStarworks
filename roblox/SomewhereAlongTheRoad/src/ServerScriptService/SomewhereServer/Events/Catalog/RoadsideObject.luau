--!strict
-- 7. Something turns up on the shoulder while nobody's looking: Gerald the gnome, a red umbrella,
--    a suitcase full of snacks, a jar of sunflowers... It quietly disappears later, also unobserved.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Text = require(ReplicatedStorage:WaitForChild("SomewhereShared"):WaitForChild("Text"))
local EventContext = require(script.Parent.Parent.EventContext)
local Props = require(script.Parent.Parent.Parent.World.Props)

local BUILDERS: { [string]: (Instance, CFrame) -> Model } = {
	gnome = Props.gnome,
	umbrella = Props.umbrella,
	suitcase = function(parent, cf)
		return Props.suitcase(parent, cf)
	end,
	sunflowers = Props.sunflowerJar,
	books = Props.books,
	radio = Props.radio,
}

local KINDS = { "gnome", "umbrella", "suitcase", "sunflowers", "books", "radio" }

return {
	Id = "RoadsideObject",
	Name = "Something left by the road",
	Resources = { "Roadside" },
	Cooldown = 600,
	Weight = 8,
	Run = function(ctx: EventContext.Context)
		local S = ctx.Systems
		local o = ctx.Options
		local spotCF = o.Spot :: CFrame?
		if not spotCF then
			-- Pick a spot nobody is looking at right now.
			local spots = ctx:Anchors("RoadsideSpot")
			local free = {}
			for _, spot in spots do
				if ctx:NearestPlayerDistance(spot.Position) > 70 then
					table.insert(free, spot)
				end
			end
			if #free == 0 then
				if not ctx.Forced or #spots == 0 then
					return
				end
				free = spots
			end
			spotCF = ctx:Pick(free).CFrame
		end
		local placed = spotCF :: CFrame
		local kind = (o.Kind :: string?) or ctx:Pick(KINDS)
		local model = ctx:Track(BUILDERS[kind](workspace, placed))
		model.Name = "Event_" .. model.Name

		local target = model.PrimaryPart :: BasePart
		for _, d in model:GetChildren() do
			if d:IsA("BasePart") and d ~= target and d.Transparency < 1 then
				target = d
				break
			end
		end
		local body = (Text.RoadsideObjects :: any)[kind] :: string
		S.Interactions.Add(target, { ActionText = "Look closer", ObjectText = "By the road", MaxDistance = 10 }, function(player: Player)
			S.Net.Notify(player, { kind = "note", title = "By the road", body = body })
			S.Discoveries.Award(player, "lost_and_found", body)
		end)
		if kind == "radio" then
			ctx:Sound("Jukebox", target, true, 0.35)
		end

		if not ctx:Wait(ctx.Rng:NextNumber(300, 480)) then
			return
		end
		-- Leave the same way it arrived: when nobody's around.
		local giveUp = os.clock() + 150
		while os.clock() < giveUp and ctx:NearestPlayerDistance(placed.Position) < 60 do
			if not ctx:Wait(5) then
				return
			end
		end
	end,
}
