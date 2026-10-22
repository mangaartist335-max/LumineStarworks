--!strict
-- The main road, its paint, sidewalks, lots, driveways and the crosswalk by the bus stop.

local Kit = require(script.Parent.Kit)
local Layout = require(script.Parent.Layout)
local Palette = require(script.Parent.Palette)

local Roads = {}

local function slab(parent: Instance, name: string, minX: number, maxX: number, minZ: number, maxZ: number, top: number, color: Color3, material: Enum.Material): BasePart
	local thickness = top + 1.2
	return Kit.block(
		parent,
		name,
		Vector3.new(maxX - minX, thickness, maxZ - minZ),
		CFrame.new((minX + maxX) / 2, top - thickness / 2, (minZ + maxZ) / 2),
		color,
		material,
		{ NoShadow = true }
	)
end

local function paint(parent: Instance, size: Vector3, x: number, z: number, top: number, color: Color3, yaw: number?)
	Kit.block(parent, "Paint", Vector3.new(size.X, 0.04, size.Z), CFrame.new(x, top + 0.02, z) * CFrame.Angles(0, yaw or 0, 0), color, Enum.Material.SmoothPlastic, {
		Decor = true,
	})
end

function Roads.build(parent: Instance)
	local folder = Kit.folder(parent, "Roads")
	local road = Layout.Road
	local half = road.Width / 2

	local asphalt = slab(folder, "MainRoad", road.MinX, road.MaxX, -half, half, road.Top, Palette.Asphalt, Enum.Material.Asphalt)
	asphalt:SetAttribute("WetRoad", true)

	-- Yellow dashes down the middle, solid white edge lines.
	local x = road.MinX + 4
	while x < road.MaxX - 10 do
		paint(folder, Vector3.new(10, 0, 0.45), x + 5, 0, road.Top, Palette.RoadYellow)
		x += 22
	end
	paint(folder, Vector3.new(road.MaxX - road.MinX, 0, 0.4), 0, -half + 1.2, road.Top, Palette.RoadWhite)
	paint(folder, Vector3.new(road.MaxX - road.MinX, 0, 0.4), 0, half - 1.2, road.Top, Palette.RoadWhite)

	-- Crosswalk from the bus stop to the store.
	for i = 0, 7 do
		paint(folder, Vector3.new(8, 0, 1.6), -30, -11 + i * 3.15, road.Top, Palette.RoadWhite)
	end

	-- Sidewalks through town.
	local sw = Layout.Sidewalk
	slab(folder, "Sidewalk", sw.MinX, sw.MaxX, -half - sw.Width, -half, sw.Top, Palette.Concrete, Enum.Material.Concrete)
	slab(folder, "Sidewalk", sw.MinX, sw.MaxX, half, half + sw.Width, sw.Top, Palette.Concrete, Enum.Material.Concrete)
	for _, edge in { -half - 0.3, half + 0.3 } do
		Kit.block(
			folder,
			"Curb",
			Vector3.new(sw.MaxX - sw.MinX, 0.12, 0.6),
			CFrame.new((sw.MinX + sw.MaxX) / 2, sw.Top + 0.02, edge),
			Palette.Curb,
			Enum.Material.Concrete,
			{ Decor = true }
		)
	end

	-- Halfway Mart parking lot.
	local lot = Layout.ParkingLot
	slab(folder, "ParkingLot", lot.MinX, lot.MaxX, lot.MinZ, lot.MaxZ, 0.25, Palette.LotAsphalt, Enum.Material.Asphalt)
	for i = 0, 8 do
		paint(folder, Vector3.new(0.4, 0, 17), -98 + i * 11, -48.5, 0.25, Palette.RoadWhite)
	end
	for i = 0, 7 do
		Kit.block(
			folder,
			"WheelStop",
			Vector3.new(6, 0.5, 0.8),
			CFrame.new(-92.5 + i * 11, 0.5, -55.4),
			Palette.Concrete,
			Enum.Material.Concrete,
			{ NoShadow = true }
		)
	end
	slab(folder, "StoreApron", -74, -26, -62, -57, 0.6, Palette.Concrete, Enum.Material.Concrete)

	-- Diner lot.
	local dl = Layout.DinerLot
	slab(folder, "DinerLot", dl.MinX, dl.MaxX, dl.MinZ, dl.MaxZ, 0.25, Palette.LotAsphalt, Enum.Material.Asphalt)
	for i = 0, 6 do
		paint(folder, Vector3.new(0.4, 0, 13), 72 + i * 10 - 60, 29.5, 0.25, Palette.RoadWhite)
	end
	slab(folder, "DinerApron", 12, 68, 38, 42, 0.6, Palette.Concrete, Enum.Material.Concrete)

	-- Bus stop pad.
	slab(folder, "BusStopPad", -42, -18, 21, 32, 0.6, Palette.Concrete, Enum.Material.Concrete)

	-- Driveways and front walks for the houses.
	for _, house in Layout.Houses do
		local p = house.Origin.Position
		local north = p.Z < 0
		local front = if north then p.Z + house.Depth / 2 else p.Z - house.Depth / 2
		local sidewalkEdge = if north then -half - sw.Width else half + sw.Width
		local driveX = p.X + house.Width / 2 + 5
		local z0, z1 = math.min(front, sidewalkEdge), math.max(front, sidewalkEdge)
		local farEnd = if north then z0 - 14 else z1 + 14
		slab(folder, "Driveway", driveX - 4.5, driveX + 4.5, math.min(z0, farEnd), math.max(z1, farEnd), 0.3, Palette.Driveway, Enum.Material.Concrete)
		local walkZ0 = if north then front + 7 else sidewalkEdge
		local walkZ1 = if north then sidewalkEdge else front - 7
		slab(folder, "FrontWalk", p.X - 1.6, p.X + 1.6, math.min(walkZ0, walkZ1), math.max(walkZ0, walkZ1), 0.3, Palette.Concrete, Enum.Material.Concrete)
	end
end

return Roads
