--!strict
-- Terrain: grass, the hill, the creek, the dirt trail, and paved ground under roads and lots.
-- `terrain` is workspace.Terrain in a live game (the offline builder passes a recorder instead).

local Layout = require(script.Parent.Layout)

local Ground = {}

function Ground.hillHeight(x: number, z: number): number
	local hill = Layout.Hill
	local dx, dz = x - hill.Center.X, z - hill.Center.Z
	local d2 = dx * dx + dz * dz
	local r2 = hill.Radius * hill.Radius
	if d2 >= r2 then
		return 0
	end
	return hill.Height * (1 - d2 / r2)
end

function Ground.creekZ(x: number): number
	local creek = Layout.Creek
	return creek.Z + creek.Amplitude * math.sin((x - Layout.Bridge.X) / creek.Wavelength)
end

-- Paints a strip between two points (on flat ground or following the hill).
local function strip(terrain: any, a: Vector3, b: Vector3, width: number, material: Enum.Material)
	local delta = b - a
	local length = delta.Magnitude
	local steps = math.max(1, math.ceil(length / 4))
	local yaw = math.atan2(-delta.X, -delta.Z)
	for i = 0, steps - 1 do
		local t = (i + 0.5) / steps
		local p = a + delta * t
		local h = Ground.hillHeight(p.X, p.Z)
		terrain:FillBlock(CFrame.new(p.X, h - 1.5, p.Z) * CFrame.Angles(0, yaw, 0), Vector3.new(width, 3, length / steps + 2), material)
	end
end

local function pave(terrain: any, minX: number, maxX: number, minZ: number, maxZ: number, material: Enum.Material)
	terrain:FillBlock(
		CFrame.new((minX + maxX) / 2, -1.5, (minZ + maxZ) / 2),
		Vector3.new(maxX - minX, 3, maxZ - minZ),
		material
	)
end

function Ground.buildTerrain(terrain: any)
	local g = Layout.Ground
	-- Base: rolling grass everywhere.
	terrain:FillBlock(
		CFrame.new((g.MinX + g.MaxX) / 2, -g.Depth / 2, (g.MinZ + g.MaxZ) / 2),
		Vector3.new(g.MaxX - g.MinX, g.Depth, g.MaxZ - g.MinZ),
		Enum.Material.Grass
	)

	-- The lookout hill: stacked slices of a gentle dome.
	local hill = Layout.Hill
	for h = 2, hill.Height, 2 do
		local r = hill.Radius * math.sqrt(math.max(0, 1 - h / hill.Height))
		if r > 2 then
			terrain:FillCylinder(CFrame.new(hill.Center.X, h - 1, hill.Center.Z), 2, r, Enum.Material.Grass)
		end
	end

	-- Paved ground under the road, lots and buildings, so grass blades don't poke through.
	local road = Layout.Road
	pave(terrain, road.MinX, road.MaxX, -road.Width / 2 - 1, road.Width / 2 + 1, Enum.Material.Asphalt)
	local sw = Layout.Sidewalk
	pave(terrain, sw.MinX, sw.MaxX, -road.Width / 2 - sw.Width, road.Width / 2 + sw.Width, Enum.Material.Pavement)
	local lot = Layout.ParkingLot
	pave(terrain, lot.MinX, lot.MaxX, lot.MinZ, -18, Enum.Material.Asphalt)
	pave(terrain, -76, -24, -98, -60, Enum.Material.Concrete)
	local dl = Layout.DinerLot
	pave(terrain, dl.MinX, dl.MaxX, 18, dl.MaxZ, Enum.Material.Asphalt)
	pave(terrain, 12, 68, 40, 72, Enum.Material.Concrete)
	pave(terrain, -42, -18, 20, 32, Enum.Material.Pavement)
	for _, house in Layout.Houses do
		local p = house.Origin.Position
		pave(terrain, p.X - house.Width / 2 - 1, p.X + house.Width / 2 + 1, p.Z - house.Depth / 2 - 1, p.Z + house.Depth / 2 + 1, Enum.Material.Concrete)
	end

	-- The creek: muddy banks, a carved channel, then water.
	local creek = Layout.Creek
	local x = creek.MinX
	while x < creek.MaxX do
		local x2 = math.min(creek.MaxX, x + 6)
		local a = Vector3.new(x, 0, Ground.creekZ(x))
		local b = Vector3.new(x2, 0, Ground.creekZ(x2))
		local mid = (a + b) / 2
		local yaw = math.atan2(-(b - a).X, -(b - a).Z)
		local rot = CFrame.new(mid.X, 0, mid.Z) * CFrame.Angles(0, yaw, 0)
		terrain:FillBlock(rot * CFrame.new(0, -1.5, 0), Vector3.new(creek.Width + 8, 3, 8), Enum.Material.Ground)
		terrain:FillBlock(rot * CFrame.new(0, -creek.Depth / 2, 0), Vector3.new(creek.Width, creek.Depth, 8), Enum.Material.Air)
		terrain:FillBlock(rot * CFrame.new(0, -creek.Depth - 1, 0), Vector3.new(creek.Width + 2, 2, 8), Enum.Material.Mud)
		terrain:FillBlock(rot * CFrame.new(0, -(creek.Depth + 1.4) / 2, 0), Vector3.new(creek.Width - 1, creek.Depth - 1.4, 8), Enum.Material.Water)
		x = x2
	end
	-- A small pond where the creek ends to the east.
	local pondCenter = Vector3.new(creek.MaxX + 6, 0, Ground.creekZ(creek.MaxX))
	terrain:FillCylinder(CFrame.new(pondCenter.X, -1.5, pondCenter.Z), 3, 20, Enum.Material.Ground)
	terrain:FillCylinder(CFrame.new(pondCenter.X, -creek.Depth / 2, pondCenter.Z), creek.Depth, 16, Enum.Material.Air)
	terrain:FillCylinder(CFrame.new(pondCenter.X, -(creek.Depth + 1.4) / 2, pondCenter.Z), creek.Depth - 1.4, 15, Enum.Material.Water)

	-- The clearing: soft leafy ground.
	local clearing = Layout.Clearing
	terrain:FillCylinder(CFrame.new(clearing.Center.X, -1.5, clearing.Center.Z), 3, clearing.Radius, Enum.Material.LeafyGrass)

	-- The trail, painted last so it runs over everything else.
	local pts = Layout.TrailPoints
	for i = 1, #pts - 1 do
		strip(terrain, pts[i], pts[i + 1], 7, Enum.Material.Ground)
	end
	local spur = Layout.ClearingSpur
	for i = 1, #spur - 1 do
		strip(terrain, spur[i], spur[i + 1], 5, Enum.Material.Ground)
	end

	-- Re-carve the creek under the bridge so the trail strip doesn't dam it.
	local br = Layout.Bridge
	terrain:FillBlock(CFrame.new(br.X, -creek.Depth / 2, br.Z), Vector3.new(10, creek.Depth, creek.Width), Enum.Material.Air)
	terrain:FillBlock(CFrame.new(br.X, -(creek.Depth + 1.4) / 2, br.Z), Vector3.new(10, creek.Depth - 1.4, creek.Width - 1), Enum.Material.Water)
end

-- Invisible walls at the edge of the playable area.
function Ground.buildBounds(parent: Instance, Kit: any)
	local b = Layout.Bounds
	local h = 200
	local thick = 4
	local cx, cz = (b.MinX + b.MaxX) / 2, (b.MinZ + b.MaxZ) / 2
	local sx, sz = b.MaxX - b.MinX, b.MaxZ - b.MinZ
	local function wall(cf: CFrame, size: Vector3)
		local p = Kit.block(parent, "Boundary", size, cf, Color3.new(1, 1, 1), Enum.Material.SmoothPlastic, { Transparency = 1, NoShadow = true })
		p.CanQuery = false
	end
	wall(CFrame.new(cx, h / 2, b.MinZ), Vector3.new(sx, h, thick))
	wall(CFrame.new(cx, h / 2, b.MaxZ), Vector3.new(sx, h, thick))
	wall(CFrame.new(b.MinX, h / 2, cz), Vector3.new(thick, h, sz))
	wall(CFrame.new(b.MaxX, h / 2, cz), Vector3.new(thick, h, sz))
end

return Ground
