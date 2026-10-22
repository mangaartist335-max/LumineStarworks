--!strict
-- 6. Something is rustling in the woods. Go and look: it's a deer, an owl, or a raccoon
--    with a sandwich. Never anything to worry about.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("SomewhereShared")
local Config = require(Shared:WaitForChild("Config"))
local Text = require(Shared:WaitForChild("Text"))
local EventContext = require(script.Parent.Parent.EventContext)
local Motion = require(script.Parent.Parent.Motion)
local Props = require(script.Parent.Parent.Parent.World.Props)

local LEAF = ColorSequence.new(Color3.fromRGB(120, 150, 80), Color3.fromRGB(170, 140, 70))

local function rustle(ctx: EventContext.Context, at: Vector3): ParticleEmitter
	local holder = Instance.new("Part")
	holder.Name = "Event_Rustle"
	holder.Anchored = true
	holder.CanCollide = false
	holder.CanQuery = false
	holder.CanTouch = false
	holder.Transparency = 1
	holder.Size = Vector3.new(6, 1, 6)
	holder.CFrame = CFrame.new(at + Vector3.new(0, 4, 0))
	holder.Parent = workspace
	ctx:Track(holder)
	local leaves = Instance.new("ParticleEmitter")
	leaves.Texture = Config.Textures.RainStreak
	leaves.Color = LEAF
	leaves.Size = NumberSequence.new(0.35)
	leaves.Lifetime = NumberRange.new(1.4, 2.4)
	leaves.Speed = NumberRange.new(4, 9)
	leaves.SpreadAngle = Vector2.new(60, 60)
	leaves.Acceleration = Vector3.new(0, -6, 0)
	leaves.RotSpeed = NumberRange.new(-180, 180)
	leaves.Rate = 0
	leaves.Parent = holder
	return leaves
end

return {
	Id = "WoodsNoise",
	Name = "Mysterious noise in the woods",
	Resources = { "Woods" },
	Cooldown = 700,
	Weight = 8,
	Run = function(ctx: EventContext.Context)
		local S = ctx.Systems
		local spots = ctx:Anchors("WoodsSpot")
		if #spots == 0 then
			return
		end
		local spot = ctx:Pick(spots).CFrame
		local clock = S.DayNight.GetClock()
		local night = clock >= 19.5 or clock < 6
		local kinds = if night then { "owl", "owl", "raccoon" } else { "deer", "deer", "raccoon" }
		local kind = ctx:Pick(kinds)
		local facing = spot * CFrame.Angles(0, ctx.Rng:NextNumber(0, math.pi * 2), 0)

		local model: Model
		if kind == "owl" then
			-- Perch on the nearest tree, just under its leaves.
			local perch = facing * CFrame.new(0, 9, 0)
			local best = 45
			for _, d in (S.Town :: Instance):GetDescendants() do
				if d.Name == "Trunk" and d:IsA("BasePart") then
					local p = d.CFrame.Position
					local dist = (Vector3.new(p.X, 0, p.Z) - Vector3.new(spot.Position.X, 0, spot.Position.Z)).Magnitude
					if dist < best then
						best = dist
						local top = p.Y + d.Size.X / 2
						perch = CFrame.new(p.X + d.Size.Y / 2 + 1.6, top - 3.6, p.Z)
					end
				end
			end
			model = Props.owl(workspace, perch)
		elseif kind == "deer" then
			model = Props.deer(workspace, facing)
		else
			model = Props.raccoon(workspace, facing)
		end
		model.Name = "Event_" .. model.Name
		ctx:Track(model)
		local rig = Motion.Rig(model, kind ~= "owl")
		Motion.Place(rig, (model.PrimaryPart :: BasePart).CFrame)

		local leaves = rustle(ctx, spot.Position)
		local slot = if kind == "owl" then "Owl" else "Rustle"
		local sound = ctx:Sound(slot, rig.Root, kind ~= "owl", 0.8)
		if not sound then
			ctx:Hint(Text.Hints.WoodsNoise, spot.Position, 170)
		end

		local revealed = false
		local deadline = os.clock() + ctx.Rng:NextNumber(200, 260)
		local nextBurst = 0
		while not ctx.Cancelled and os.clock() < deadline do
			if os.clock() >= nextBurst and not revealed then
				leaves:Emit(ctx.Rng:NextInteger(6, 12))
				if kind == "owl" and sound then
					sound:Play()
				end
				nextBurst = os.clock() + ctx.Rng:NextNumber(3, 7)
			end
			if not revealed and ctx:NearestPlayerDistance(rig.Root.Position) < 24 then
				revealed = true
				S.Discoveries.AwardNear(rig.Root.Position, 30, "woods_" .. kind)
				deadline = math.min(deadline, os.clock() + 20)
				-- Look at the visitor, then go about its business.
				local positions = ctx:PlayerPositions()
				if positions[1] then
					Motion.Face(rig, positions[1])
				end
				if kind ~= "owl" then
					ctx:Spawn(function()
						task.wait(2.5)
						local away = rig.Root.Position + (rig.Root.Position - (positions[1] or rig.Root.Position)).Unit * 40
						Motion.MoveTo(rig, away, if kind == "deer" then 11 else 5, function()
							return ctx.Cancelled
						end)
					end)
				end
			elseif revealed then
				S.Discoveries.AwardNear(rig.Root.Position, 30, "woods_" .. kind)
			end
			task.wait(0.5)
		end
	end,
}
