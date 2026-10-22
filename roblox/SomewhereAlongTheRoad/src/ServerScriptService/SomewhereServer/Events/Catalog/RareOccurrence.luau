--!strict
-- 10. Something rare and gentle, on a clear night: the streetlights blink in a wave toward the
--     trail, fireflies gather in the clearing, the old standing stone glows softly, and a small
--     brass compass is waiting on a rock. Nobody can explain it. It's lovely anyway.

local TweenService = game:GetService("TweenService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("SomewhereShared")
local Config = require(Shared:WaitForChild("Config"))
local Text = require(Shared:WaitForChild("Text"))
local EventContext = require(script.Parent.Parent.EventContext)
local Props = require(script.Parent.Parent.Parent.World.Props)

local SOFT = Color3.fromRGB(176, 255, 214)

local function fade(inst: Instance, props: { [string]: any }, seconds: number)
	TweenService:Create(inst, TweenInfo.new(seconds, Enum.EasingStyle.Sine), props):Play()
end

return {
	Id = "RareOccurrence",
	Name = "Rare unexplained occurrence",
	Resources = { "Woods", "Sky", "Rare" },
	Cooldown = 2400,
	Rare = true,
	Weight = function(systems: any): number
		local clock = systems.DayNight.GetClock()
		local w = systems.Weather.Get()
		return if (clock > 20.5 or clock < 4) and w.Storm < 0.2 then 2.5 else 0
	end,
	Run = function(ctx: EventContext.Context)
		local S = ctx.Systems
		if ctx.Forced then
			local clock = S.DayNight.GetClock()
			if clock > 4 and clock < 20.5 then
				S.DayNight.SetClock(21.3)
			end
		end
		-- The cutscene asks for a quicker build-up so it fits in one shot.
		local pace = if ctx.Options.Fast then 0.3 else 1
		local center = ctx:Anchor("ClearingCenter")
		if not center then
			return
		end
		local glyphs = {}
		for _, d in (S.Town :: Instance):GetDescendants() do
			if d:IsA("BasePart") and d:GetAttribute("RareGlow") then
				table.insert(glyphs, d)
			end
		end

		S.DayNight.SetMood("Rare", 1, 12)
		ctx:OnCleanup(function()
			S.DayNight.SetMood("Rare", 0, 15)
			for _, g in glyphs do
				fade(g, { Transparency = 1 }, 6)
			end
		end)

		-- The streetlights blink in a wave, rolling west toward the trail.
		task.spawn(S.Lights.Wave, "Street", 0.3)

		-- A soft light and fireflies in the clearing.
		local holder = Instance.new("Part")
		holder.Name = "Event_Glow"
		holder.Anchored = true
		holder.CanCollide = false
		holder.CanQuery = false
		holder.CanTouch = false
		holder.Transparency = 1
		holder.Size = Vector3.new(30, 6, 30)
		holder.CFrame = center * CFrame.new(0, 4, 0)
		holder.Parent = workspace
		ctx:Track(holder)
		local light = Instance.new("PointLight")
		light.Color = SOFT
		light.Range = 44
		light.Brightness = 0
		light.Shadows = false
		light.Parent = holder
		fade(light, { Brightness = 1.4 }, 10 * pace)
		local flies = Instance.new("ParticleEmitter")
		flies.Texture = Config.Textures.Sparkle
		flies.Color = ColorSequence.new(Color3.fromRGB(230, 255, 150), SOFT)
		flies.LightEmission = 1
		flies.LightInfluence = 0
		flies.Size = NumberSequence.new({ NumberSequenceKeypoint.new(0, 0), NumberSequenceKeypoint.new(0.2, 0.35), NumberSequenceKeypoint.new(0.8, 0.3), NumberSequenceKeypoint.new(1, 0) })
		flies.Lifetime = NumberRange.new(4, 7)
		flies.Speed = NumberRange.new(0.5, 1.6)
		flies.SpreadAngle = Vector2.new(180, 180)
		flies.RotSpeed = NumberRange.new(-30, 30)
		flies.Acceleration = Vector3.new(0, 0.25, 0)
		flies.Rate = 26
		flies.Parent = holder
		for _, g in glyphs do
			fade(g, { Transparency = 0.15 }, 12 * pace)
		end

		if not ctx:Sound("SoftHum", holder, true, 0.4) then
			ctx:Hint(Text.Hints.RareHum)
		end

		-- The compass, waiting on a flat rock by the stone.
		local spot = center * CFrame.new(3.2, 0, -3.4)
		local rock = ctx:Track(Instance.new("Part"))
		rock.Name = "Event_CompassRock"
		rock.Anchored = true
		rock.Size = Vector3.new(2.6, 1.2, 2.2)
		rock.CFrame = spot * CFrame.new(0, 0.5, 0)
		rock.Color = Color3.fromRGB(128, 130, 126)
		rock.Material = Enum.Material.Slate
		rock.Parent = workspace
		local compass = ctx:Track(Props.compass(workspace, spot * CFrame.new(0, 1.1, 0)))
		compass.Name = "Event_Compass"
		local case = compass:FindFirstChild("Case") :: BasePart?
		if case then
			S.Interactions.Add(case, { ActionText = "Pick up", ObjectText = "A small compass", MaxDistance = 8 }, function(player: Player)
				S.Interactions.Note(player, "the_compass")
				S.Discoveries.Award(player, "the_compass")
			end)
		end

		ctx:Wait(ctx.Rng:NextNumber(200, 300))
		fade(light, { Brightness = 0 }, 8)
		flies.Rate = 0
		ctx:Wait(8)
	end,
}
