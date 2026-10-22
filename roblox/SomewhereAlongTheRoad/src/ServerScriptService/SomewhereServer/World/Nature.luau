--!strict
-- Woods, fields and the special places out there: the old oak, the clearing,
-- the creek bridge, the lookout and the sunflower truck.

local Kit = require(script.Parent.Kit)
local Layout = require(script.Parent.Layout)
local Palette = require(script.Parent.Palette)
local Ground = require(script.Parent.Ground)
local Vehicles = require(script.Parent.Vehicles)

local Nature = {}

local rgb = Color3.fromRGB
local FOLIAGE = { NoCollide = true, NoQuery = true }

local function distToSegment(p: Vector2, a: Vector2, b: Vector2): number
	local ab = b - a
	local t = math.clamp((p - a):Dot(ab) / math.max(ab:Dot(ab), 1e-6), 0, 1)
	return (p - (a + ab * t)).Magnitude
end

local function distToPolyline(p: Vector2, points: { Vector3 }): number
	local best = math.huge
	for i = 1, #points - 1 do
		local a = Vector2.new(points[i].X, points[i].Z)
		local b = Vector2.new(points[i + 1].X, points[i + 1].Z)
		best = math.min(best, distToSegment(p, a, b))
	end
	return best
end

local LOOKOUT_VIEW = (Vector2.new(-20, -10) - Vector2.new(Layout.Lookout.X, Layout.Lookout.Z)).Unit

-- Is this spot free for a tree of the given radius?
local function treeAllowed(x: number, z: number, radius: number): boolean
	local p = Vector2.new(x, z)
	-- Road corridor, the whole way.
	if math.abs(z) < 22 + radius then
		return false
	end
	-- Town blocks.
	if x > -112 - radius and x < 204 + radius and z > -104 - radius and z < 84 + radius then
		return false
	end
	-- Power line corridor.
	if math.abs(z - Layout.PowerPoleZ) < 6 + radius then
		return false
	end
	-- Trail, clearing, creek, bridge.
	if distToPolyline(p, Layout.TrailPoints) < 7 + radius or distToPolyline(p, Layout.ClearingSpur) < 5 + radius then
		return false
	end
	local c = Layout.Clearing
	if (p - Vector2.new(c.Center.X, c.Center.Z)).Magnitude < c.Radius + 4 + radius then
		return false
	end
	if x > Layout.Creek.MinX - 10 and x < Layout.Creek.MaxX + 30 and math.abs(z - Ground.creekZ(x)) < Layout.Creek.Width / 2 + 4 + radius then
		return false
	end
	-- Keep the hilltop open and the view from the lookout clear.
	local look = Vector2.new(Layout.Lookout.X, Layout.Lookout.Z)
	local toTree = p - look
	if toTree.Magnitude < 34 + radius then
		return false
	end
	if toTree.Magnitude < 330 and toTree.Unit:Dot(LOOKOUT_VIEW) > math.cos(math.rad(16)) then
		return false
	end
	-- The sunflower field and the hay field.
	if x > 196 and x < 290 and z > -140 and z < -46 then
		return false
	end
	if x > 280 and x < 410 and z > -136 and z < -50 then
		return false
	end
	return true
end

function Nature.deciduous(parent: Instance, base: Vector3, scale: number, rng: Kit.Rng)
	local m = Kit.model(parent, "Tree")
	local trunkH = rng:range(9, 13) * scale
	local y = base.Y - 1
	Kit.post(m, "Trunk", trunkH + 1, 1.7 * scale, Vector3.new(base.X, y, base.Z), Palette.Bark, Enum.Material.Wood)
	local top = Vector3.new(base.X, y + trunkH + 1, base.Z)
	local main = rng:range(12, 16) * scale
	Kit.ball(m, "Leaves", main, top + Vector3.new(0, main * 0.25, 0), Kit.pick(rng, Palette.Leaves), Enum.Material.LeafyGrass, FOLIAGE)
	for _ = 1, 2 do
		local a = rng:range(0, math.pi * 2)
		local d = main * 0.38
		local size = main * rng:range(0.6, 0.78)
		Kit.ball(m, "Leaves", size, top + Vector3.new(math.cos(a) * d, rng:range(-1, 2) * scale, math.sin(a) * d), Kit.pick(rng, Palette.Leaves), Enum.Material.LeafyGrass, FOLIAGE)
	end
	return m
end

function Nature.pine(parent: Instance, base: Vector3, scale: number, rng: Kit.Rng)
	local m = Kit.model(parent, "Pine")
	local trunkH = 5 * scale
	local y = base.Y - 1
	Kit.post(m, "Trunk", trunkH + 1, 1.3 * scale, Vector3.new(base.X, y, base.Z), Palette.BarkDark, Enum.Material.Wood)
	local color = Kit.pick(rng, Palette.Pines)
	local sizes = { 13, 10.5, 7.6, 4.4 }
	for i, d in sizes do
		local tierY = y + trunkH + (i - 1) * 3.6 * scale + 1.8 * scale
		Kit.disc(m, "Needles", 3.4 * scale, d * scale, CFrame.new(base.X, tierY, base.Z) * CFrame.Angles(0, rng:range(0, 3), 0), color, Enum.Material.LeafyGrass, FOLIAGE)
	end
	return m
end

-- Distant trees: one trunk, one canopy. Cheap, and they read fine through the haze.
local function farTree(parent: Instance, base: Vector3, scale: number, rng: Kit.Rng)
	local m = Kit.model(parent, "FarTree")
	local trunkH = rng:range(10, 14) * scale
	Kit.post(m, "Trunk", trunkH, 2 * scale, Vector3.new(base.X, base.Y - 1, base.Z), Palette.Bark, Enum.Material.Wood)
	local d = rng:range(15, 20) * scale
	Kit.ball(m, "Leaves", d, Vector3.new(base.X, base.Y + trunkH + d * 0.2, base.Z), Kit.pick(rng, Palette.Leaves), Enum.Material.LeafyGrass, FOLIAGE)
end

local function rock(parent: Instance, p: Vector3, size: number, rng: Kit.Rng)
	Kit.block(
		parent,
		"Rock",
		Vector3.new(size, size * rng:range(0.5, 0.8), size * rng:range(0.7, 1)),
		CFrame.new(p) * CFrame.Angles(rng:range(-0.3, 0.3), rng:range(0, 3), rng:range(-0.3, 0.3)),
		Kit.pick(rng, Palette.Rock),
		Enum.Material.Rock
	)
end

local function bush(parent: Instance, p: Vector3, size: number, rng: Kit.Rng)
	Kit.ball(parent, "Bush", size, p + Vector3.new(0, size * 0.15, 0), Kit.pick(rng, Palette.Bush), Enum.Material.LeafyGrass, FOLIAGE)
end

local function flowers(parent: Instance, center: Vector3, count: number, spread: number, rng: Kit.Rng)
	for _ = 1, count do
		local a = rng:range(0, math.pi * 2)
		local r = rng:range(0, spread)
		local p = center + Vector3.new(math.cos(a) * r, 0.5, math.sin(a) * r)
		Kit.ball(parent, "Flower", rng:range(0.6, 1), p, Kit.pick(rng, Palette.Flowers), Enum.Material.SmoothPlastic, { Decor = true })
	end
end

local function oldOak(parent: Instance, rng: Kit.Rng)
	local m = Kit.model(parent, "OldOak")
	local p = Layout.OldOak
	Kit.post(m, "Trunk", 19, 5.6, p + Vector3.new(0, -1, 0), rgb(102, 80, 60), Enum.Material.Wood)
	for i = 0, 3 do
		local a = i * math.pi / 2 + 0.4
		Kit.wedge(
			m,
			"Root",
			Vector3.new(1.6, 2.4, 3.2),
			CFrame.new(p + Vector3.new(math.cos(a) * 3.6, 0.9, math.sin(a) * 3.6)) * CFrame.Angles(0, -a - math.pi / 2, 0),
			rgb(96, 74, 56),
			Enum.Material.Wood
		)
	end
	local top = p + Vector3.new(0, 18, 0)
	Kit.ball(m, "Leaves", 24, top + Vector3.new(0, 4, 0), Palette.Leaves[1], Enum.Material.LeafyGrass, FOLIAGE)
	Kit.ball(m, "Leaves", 17, top + Vector3.new(8, 1, 3), Palette.Leaves[2], Enum.Material.LeafyGrass, FOLIAGE)
	Kit.ball(m, "Leaves", 16, top + Vector3.new(-7, 2, -5), Palette.Leaves[4], Enum.Material.LeafyGrass, FOLIAGE)
	Kit.ball(m, "Leaves", 14, top + Vector3.new(-2, 0, 8), Palette.Leaves[3], Enum.Material.LeafyGrass, FOLIAGE)

	-- The tiny door faces the trail (west).
	local face = CFrame.new(p) * CFrame.Angles(0, math.rad(90), 0) * CFrame.new(0, 0, -2.75)
	local door = Kit.block(m, "TinyDoor", Vector3.new(1.3, 2, 0.3), face * CFrame.new(0, 1, 0), rgb(170, 70, 50), Enum.Material.Wood)
	Kit.interact(door, "Read", { TextId = "tiny_door", Discovery = "tiny_door", ActionText = "Look closer", ObjectText = "A tiny door", MaxDistance = 8 })
	Kit.ball(m, "TinyKnob", 0.18, (face * CFrame.new(0.4, 1, -0.2)).Position, rgb(220, 190, 90), Enum.Material.Metal, { Decor = true })
	Kit.block(m, "TinyMat", Vector3.new(1.4, 0.05, 0.7), face * CFrame.new(0, 0.03, -0.6), rgb(170, 140, 90), Enum.Material.Fabric, { Decor = true })
	Kit.disc(m, "TinyWindow", 0.2, 0.6, face * CFrame.new(0, 3, -0.05) * CFrame.Angles(math.rad(90), 0, 0), rgb(255, 214, 140), Enum.Material.Neon, { Decor = true })
	for i = 0, 1 do
		local mp = (face * CFrame.new(1.4 + i * 0.6, 0, -0.8 - i * 0.4)).Position
		Kit.post(m, "MushroomStem", 0.5, 0.2, mp, rgb(240, 236, 226), Enum.Material.SmoothPlastic, { Decor = true })
		Kit.disc(m, "MushroomCap", 0.2, 0.6, CFrame.new(mp + Vector3.new(0, 0.55, 0)), rgb(200, 60, 50), Enum.Material.SmoothPlastic, { Decor = true })
	end
	flowers(m, p + Vector3.new(-5, 0, 0), 6, 3, rng)
end

local function clearing(parent: Instance, rng: Kit.Rng)
	local m = Kit.model(parent, "Clearing")
	local c = Layout.Clearing.Center
	local stoneCF = CFrame.new(c + Vector3.new(0, 3.2, 0)) * CFrame.Angles(math.rad(4), math.rad(25), math.rad(-3))
	Kit.block(m, "StandingStone", Vector3.new(3.4, 8, 2.2), stoneCF, rgb(128, 130, 126), Enum.Material.Slate)
	-- Faint carved lines that only show during something rare.
	for i = 0, 2 do
		local glyph = Kit.block(m, "Glyph", Vector3.new(1.8 - i * 0.4, 0.2, 0.08), stoneCF * CFrame.new(0, 1.6 - i * 1.3, -1.12), rgb(170, 240, 210), Enum.Material.Neon, {
			Decor = true,
			Transparency = 1,
		})
		glyph:SetAttribute("RareGlow", true)
	end
	for i = 0, 7 do
		local a = i / 8 * math.pi * 2
		rock(m, c + Vector3.new(math.cos(a) * 10, 0.2, math.sin(a) * 10), rng:range(1.2, 2), rng)
	end
	Kit.cylinder(m, "Log", 9, 1.8, CFrame.new(c + Vector3.new(-6, 0.7, 14)) * CFrame.Angles(0, math.rad(20), 0), Palette.Bark, Enum.Material.Wood)
	flowers(m, c, 14, 16, rng)
	Kit.anchor(m, "ClearingCenter", CFrame.new(c + Vector3.new(0, 0.2, 0)))
end

local function bridge(parent: Instance)
	local m = Kit.model(parent, "FootBridge")
	local b = Layout.Bridge
	local deckY = 1.1
	local cf = CFrame.new(b.X, deckY, b.Z)
	Kit.block(m, "Deck", Vector3.new(b.Width, 0.5, b.Length), cf * CFrame.new(0, -0.25, 0), Palette.WoodLight, Enum.Material.WoodPlanks)
	for _, s in { -1, 1 } do
		Kit.block(m, "Beam", Vector3.new(0.8, 1, b.Length + 2), cf * CFrame.new(s * (b.Width / 2 - 0.6), -1, 0), Palette.WoodDark, Enum.Material.Wood)
		Kit.block(m, "Rail", Vector3.new(0.3, 0.3, b.Length), cf * CFrame.new(s * (b.Width / 2 - 0.15), 3.2, 0), Palette.WoodDark, Enum.Material.Wood, { NoShadow = true })
		for z = -b.Length / 2 + 1, b.Length / 2 - 1, 4 do
			Kit.block(m, "RailPost", Vector3.new(0.4, 3.3, 0.4), cf * CFrame.new(s * (b.Width / 2 - 0.15), 1.6, z), Palette.WoodDark, Enum.Material.Wood, { NoShadow = true })
		end
	end
	for _, s in { -1, 1 } do
		Kit.wedge(
			m,
			"Ramp",
			Vector3.new(b.Width, deckY, 3),
			CFrame.new(b.X, deckY / 2, b.Z + s * (b.Length / 2 + 1.5)) * CFrame.Angles(0, if s > 0 then math.pi else 0, 0),
			Palette.WoodLight,
			Enum.Material.WoodPlanks
		)
	end
	Kit.anchor(m, "NPC_Wendell", CFrame.new(b.X + 2.2, deckY + 3, b.Z + 2) * CFrame.Angles(0, math.rad(-90), 0))
	m:SetAttribute("AmbientSound", "Creek")
	local deck = m:FindFirstChild("Deck")
	if deck then
		deck:SetAttribute("AmbientSound", "Creek")
	end
end

local function lookout(parent: Instance, rng: Kit.Rng)
	local m = Kit.model(parent, "Lookout")
	local p = Layout.Lookout
	local h = Ground.hillHeight(p.X, p.Z)
	local seat = Kit.bench(m, CFrame.new(p.X, h - 0.3, p.Z), 7, Palette.WoodLight, Palette.MetalDark)
	seat:SetAttribute("Sittable", true)
	Kit.post(m, "PlaquePost", 3, 0.5, Vector3.new(p.X + 4.8, h - 0.5, p.Z - 1.4), Palette.WoodDark, Enum.Material.Wood)
	local plaque = Kit.block(m, "Plaque", Vector3.new(1.6, 1.1, 0.2), CFrame.new(p.X + 4.8, h + 2.7, p.Z - 1.6) * CFrame.Angles(math.rad(-30), 0, 0), rgb(196, 160, 80), Enum.Material.Metal)
	Kit.interact(plaque, "Read", { TextId = "lookout", Discovery = "lookout", ActionText = "Read plaque", ObjectText = "Plaque" })
	local treeBase = Vector3.new(p.X - 14, Ground.hillHeight(p.X - 14, p.Z + 10), p.Z + 10)
	Nature.deciduous(m, treeBase, 1.25, rng)
	flowers(m, Vector3.new(p.X, h, p.Z + 4), 10, 9, rng)
end

local function sunflowerTruck(parent: Instance, rng: Kit.Rng)
	local cf = Layout.SunflowerTruck
	local truck = Vehicles.pickup(parent, cf * CFrame.new(0, -0.3, 0), rgb(110, 160, 150), true)
	truck.Name = "SunflowerTruck"
	local bed = truck:FindFirstChild("BedFloor") :: BasePart?
	if bed then
		Kit.interact(bed, "Read", { TextId = "sunflower_truck", Discovery = "sunflower_truck", ActionText = "Look closer", ObjectText = "Old pickup" })
	end
	Kit.block(truck, "Soil", Vector3.new(5.2, 0.6, 6.4), cf * CFrame.new(0, 2.6, 4.3), rgb(84, 60, 44), Enum.Material.Ground, { Decor = true })
	for i = 0, 6 do
		local base = (cf * CFrame.new(-1.8 + (i % 3) * 1.8, 2.8, 2.2 + math.floor(i / 3) * 2.2 + rng:range(-0.3, 0.3))).Position
		local height = rng:range(4, 6.5)
		Kit.post(truck, "Stem", height, 0.3, base, rgb(90, 140, 60), Enum.Material.SmoothPlastic, { Decor = true })
		local head = CFrame.new(base + Vector3.new(0, height, 0)) * CFrame.Angles(math.rad(65), math.rad(rng:range(-20, 20)), 0)
		Kit.disc(truck, "Petals", 0.25, 2.6, head, rgb(250, 204, 50), Enum.Material.SmoothPlastic, { Decor = true })
		Kit.disc(truck, "Seeds", 0.3, 1.2, head * CFrame.new(0, 0.08, 0), rgb(96, 64, 40), Enum.Material.SmoothPlastic, { Decor = true })
	end
	flowers(parent, cf.Position, 18, 14, rng)
end

function Nature.build(parent: Instance, rng: Kit.Rng)
	local folder = Kit.folder(parent, "Nature")
	local trees = Kit.folder(folder, "Trees")
	local details = Kit.folder(folder, "Details")

	local cell = 30
	local b = Layout.Bounds
	local x = b.MinX + cell / 2
	while x < b.MaxX + 40 do
		local z = b.MinZ + cell / 2
		while z < b.MaxZ + 40 do
			local px = x + rng:range(-10, 10)
			local pz = z + rng:range(-10, 10)
			local fromTown = Vector2.new(px - 20, pz).Magnitude
			local density: number
			local nearTrail = distToPolyline(Vector2.new(px, pz), Layout.TrailPoints) < 110
			if pz > 84 then
				density = if nearTrail then 0.86 elseif fromTown < 380 then 0.6 else 0.4
			elseif pz < -104 then
				density = if fromTown < 340 then 0.5 else 0.36
			else
				density = 0.07 -- open fields along the road
			end
			local roll = rng:next()
			local kindRoll = rng:next()
			local scale = rng:range(0.85, 1.25)
			local h = Ground.hillHeight(px, pz)
			if roll < density and treeAllowed(px, pz, 6 * scale) then
				local base = Vector3.new(px, h, pz)
				if fromTown > 420 then
					farTree(trees, base, scale * 1.15, rng)
				elseif kindRoll < 0.34 then
					Nature.pine(trees, base, scale, rng)
				else
					Nature.deciduous(trees, base, scale, rng)
				end
			elseif roll < density + 0.1 and treeAllowed(px, pz, 2) and fromTown < 400 then
				bush(details, Vector3.new(px, h, pz), rng:range(3, 5.5), rng)
				if rng:chance(0.3) then
					rock(details, Vector3.new(px + 3, h + 0.2, pz - 2), rng:range(1.5, 3.2), rng)
				end
			end
			z += cell
		end
		x += cell
	end

	-- A few yard and street trees in town, placed by hand.
	for _, p in { Vector3.new(-6, 0, -76), Vector3.new(66, 0, -86), Vector3.new(120, 0, -88), Vector3.new(86, 0, 74), Vector3.new(140, 0, 80), Vector3.new(190, 0, 70), Vector3.new(-48, 0, 46), Vector3.new(-80, 0, 40) } do
		Nature.deciduous(trees, p, rng:range(0.9, 1.15), rng)
	end
	-- Fallen logs and rocks along the trail.
	Kit.cylinder(details, "Log", 10, 2, CFrame.new(-128, 0.9, 92) * CFrame.Angles(0, math.rad(70), 0), Palette.Bark, Enum.Material.Wood)
	Kit.cylinder(details, "Log", 8, 1.6, CFrame.new(-170, 0.7 + Ground.hillHeight(-170, 270), 270) * CFrame.Angles(0, math.rad(-20), 0), Palette.Bark, Enum.Material.Wood)
	for i = 1, 10 do
		local pt = Layout.TrailPoints[(i % (#Layout.TrailPoints - 1)) + 1]
		local side = if i % 2 == 0 then 1 else -1
		local p = pt + Vector3.new(side * rng:range(6, 9), 0, rng:range(-4, 4))
		rock(details, Vector3.new(p.X, Ground.hillHeight(p.X, p.Z) + 0.3, p.Z), rng:range(1.2, 2.8), rng)
	end
	-- Creek-side stones.
	for i = 0, 18 do
		local cx = -420 + i * 30 + rng:range(-8, 8)
		local cz = Ground.creekZ(cx) + (if i % 2 == 0 then 1 else -1) * (Layout.Creek.Width / 2 + 1.5)
		rock(details, Vector3.new(cx, 0.2, cz), rng:range(1.4, 3), rng)
	end

	oldOak(folder, rng)
	clearing(folder, rng)
	bridge(folder)
	lookout(folder, rng)
	sunflowerTruck(folder, rng)
end

return Nature
