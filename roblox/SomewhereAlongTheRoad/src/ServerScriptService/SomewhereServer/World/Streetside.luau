--!strict
-- Street furniture: the bus stop and spawn, streetlights, power lines, signs, parked cars, fences.

local Kit = require(script.Parent.Kit)
local Layout = require(script.Parent.Layout)
local Palette = require(script.Parent.Palette)
local Vehicles = require(script.Parent.Vehicles)

local Streetside = {}

local rgb = Color3.fromRGB

local function busStop(parent: Instance)
	local m = Kit.model(parent, "BusStop")
	local c = Layout.BusStop.Center
	local base = CFrame.new(c.X, 0.6, c.Z)
	local function L(x: number, y: number, z: number): CFrame
		return base * CFrame.new(x, y, z)
	end
	local frame = Palette.MetalDark
	-- Frame posts, roof, glass back and sides. Open toward the road (-Z).
	for _, x in { -6, 6 } do
		for _, z in { -2.6, 2.6 } do
			Kit.block(m, "Post", Vector3.new(0.4, 8.6, 0.4), L(x, 4.3, z), frame, Enum.Material.Metal)
		end
	end
	Kit.block(m, "Roof", Vector3.new(13.4, 0.4, 7.2), L(0, 8.8, 0) * CFrame.Angles(math.rad(4), 0, 0), rgb(70, 96, 120), Enum.Material.Metal)
	Kit.block(m, "BackGlass", Vector3.new(11.6, 6.4, 0.15), L(0, 4.8, 2.6), rgb(190, 210, 220), Enum.Material.Glass, { Transparency = 0.6, NoShadow = true })
	Kit.block(m, "BackRail", Vector3.new(12, 0.3, 0.3), L(0, 1.5, 2.6), frame, Enum.Material.Metal, { Decor = true })
	for _, x in { -6, 6 } do
		Kit.block(m, "SideGlass", Vector3.new(0.15, 6.4, 4.8), L(x, 4.8, 0), rgb(190, 210, 220), Enum.Material.Glass, { Transparency = 0.6, NoShadow = true })
	end
	local seat = Kit.bench(m, L(0, 0, 1.3), 8, Palette.WoodLight, frame)
	seat:SetAttribute("Sittable", true)
	seat:SetAttribute("Anchor", "BusBench")

	-- Timetable on the right side panel, guestbook on a little shelf.
	local timetable = Kit.block(m, "Timetable", Vector3.new(0.2, 2.6, 2), L(5.8, 4.6, 0), Palette.Cream, Enum.Material.SmoothPlastic)
	Kit.label(timetable, Enum.NormalId.Left, "ROUTE 9\nnext bus:\nsoon", { Font = Enum.Font.SpecialElite, TextColor = rgb(40, 40, 44), Padding = 6 })
	Kit.interact(timetable, "Read", { TextId = "timetable", ActionText = "Read", ObjectText = "Timetable" })
	Kit.block(m, "Shelf", Vector3.new(1.4, 0.2, 1.6), L(-5.1, 3.2, 1.6), Palette.WoodLight, Enum.Material.Wood, { NoShadow = true })
	local book = Kit.block(m, "Guestbook", Vector3.new(1, 0.25, 1.3), L(-5.1, 3.42, 1.6) * CFrame.Angles(0, math.rad(12), 0), rgb(120, 60, 50), Enum.Material.Leather)
	Kit.interact(book, "Read", { TextId = "guestbook", Discovery = "guestbook", ActionText = "Read", ObjectText = "Guestbook" })

	-- Route sign.
	Kit.post(m, "SignPole", 9, 0.3, Vector3.new(c.X - 8.5, 0.6, c.Z - 3.6), frame, Enum.Material.Metal)
	Kit.disc(m, "RouteSign", 0.2, 2.6, CFrame.new(c.X - 8.5, 8.4, c.Z - 3.6) * CFrame.Angles(math.rad(90), 0, 0), rgb(60, 110, 150), Enum.Material.SmoothPlastic)
	local plate = Kit.block(m, "RoutePlate", Vector3.new(1.8, 1.8, 0.1), CFrame.new(c.X - 8.5, 8.4, c.Z - 3.72), rgb(60, 110, 150), Enum.Material.SmoothPlastic, { Decor = true })
	Kit.label(plate, Enum.NormalId.Front, "9", { Font = Enum.Font.Oswald, TextColor = Palette.White, Padding = 2 })
	Kit.post(m, "TrashCan", 3, 2, Vector3.new(c.X + 8, 0.6, c.Z), rgb(70, 90, 76), Enum.Material.Metal)

	-- Where buses stop, and where travellers come from.
	Kit.anchor(m, "BusStopRoad", CFrame.new(c.X, 0.2, Layout.Road.LaneOffset) * CFrame.Angles(0, math.rad(-90), 0))
	Kit.anchor(m, "TravelerArrive", CFrame.new(-112, 3.6, 18))
	Kit.anchor(m, "BusStopCurb", CFrame.new(c.X + 2, 3.6, 19.5))
	Kit.anchor(m, "CrosswalkNorth", CFrame.new(-30, 3.6, -17))
	Kit.anchor(m, "CrosswalkSouth", CFrame.new(-30, 3.6, 17))

	-- Spawn: on the sidewalk next to the shelter, facing the store across the road.
	local spawn = Kit.block(parent, "SpawnLocation", Vector3.new(6, 0.2, 6), Layout.SpawnPoint, Palette.Concrete, Enum.Material.Concrete, {
		Class = "SpawnLocation",
		Transparency = 1,
		NoCollide = true,
		NoShadow = true,
	}) :: SpawnLocation
	spawn.Neutral = true
	spawn.Duration = 0
	spawn.AllowTeamChangeOnTouch = false
end

local function streetlight(parent: Instance, x: number, side: number)
	local m = Kit.model(parent, "Streetlight")
	local z = side * (Layout.Road.Width / 2 + 1.6)
	local base = Vector3.new(x, Layout.Sidewalk.Top, z)
	local metal = rgb(92, 98, 104)
	Kit.post(m, "Base", 1.2, 1.4, base, metal, Enum.Material.Metal, { NoShadow = true })
	Kit.post(m, "Pole", 17, 0.6, base, metal, Enum.Material.Metal)
	local armY = base.Y + 16.6
	Kit.block(m, "Arm", Vector3.new(0.35, 0.35, 6.4), CFrame.new(x, armY, z - side * 3), metal, Enum.Material.Metal, { NoShadow = true })
	Kit.block(m, "Head", Vector3.new(1.6, 0.6, 2.8), CFrame.new(x, armY - 0.1, z - side * 6.4), metal, Enum.Material.Metal, { NoShadow = true })
	local bulb = Kit.block(m, "Bulb", Vector3.new(1.2, 0.2, 2.2), CFrame.new(x, armY - 0.48, z - side * 6.4), rgb(255, 214, 160), Enum.Material.Neon, { Decor = true })
	Kit.light(bulb, "SpotLight", { Range = 38, Angle = 125, Brightness = 2.2, Color = Palette.StreetLight, Face = Enum.NormalId.Bottom })
	Kit.fixture(bulb, "Street", rgb(255, 214, 160), rgb(180, 180, 176), Enum.Material.Glass)
end

local function powerLines(parent: Instance)
	local folder = Kit.folder(parent, "PowerLines")
	local z = Layout.PowerPoleZ
	local spacing = Layout.PowerPoleSpacing
	local previous: { Attachment }? = nil
	local x = Layout.Bounds.MinX
	while x <= Layout.Bounds.MaxX do
		local pole = Kit.model(folder, "UtilityPole")
		Kit.post(pole, "Pole", 30, 1.1, Vector3.new(x, -1, z), Palette.WoodDark, Enum.Material.Wood)
		local arm = Kit.block(pole, "Crossarm", Vector3.new(0.5, 0.5, 8), CFrame.new(x, 27.6, z), Palette.WoodDark, Enum.Material.Wood, { NoShadow = true })
		local current = {}
		for _, dz in { -3.4, 0.9, 3.4 } do
			Kit.post(pole, "Insulator", 0.7, 0.35, Vector3.new(x, 27.85, z + dz), rgb(110, 140, 120), Enum.Material.Glass, { Decor = true })
			local att = Instance.new("Attachment")
			att.Name = "Wire"
			-- X axis points down so CurveSize makes the wire sag.
			att.CFrame = CFrame.fromMatrix(Vector3.new(0, 0.9, dz), Vector3.new(0, -1, 0), Vector3.new(1, 0, 0))
			att.Parent = arm
			table.insert(current, att)
		end
		if previous then
			for i, att in current do
				local beam = Instance.new("Beam")
				beam.Name = "Wire"
				beam.Attachment0 = previous[i]
				beam.Attachment1 = att
				beam.Width0 = 0.12
				beam.Width1 = 0.12
				beam.FaceCamera = true
				beam.Segments = 14
				beam.CurveSize0 = 4.6
				beam.CurveSize1 = -4.6
				beam.Color = ColorSequence.new(rgb(36, 36, 40))
				beam.LightInfluence = 1
				beam.Texture = ""
				beam.Parent = arm
			end
		end
		previous = current
		x += spacing
	end
end

local function signpost(parent: Instance, name: string, cf: CFrame, width: number, height: number, text: string, color: Color3, textColor: Color3, textId: string?)
	local m = Kit.model(parent, name)
	for _, s in { -1, 1 } do
		Kit.post(m, "Post", height + 3, 0.4, (cf * CFrame.new(s * (width / 2 - 0.6), 0, 0.25)).Position, Palette.WoodDark, Enum.Material.Wood)
	end
	local board = Kit.block(m, "Board", Vector3.new(width, height, 0.4), cf * CFrame.new(0, height / 2 + 3, 0), color, Enum.Material.Wood)
	Kit.label(board, Enum.NormalId.Front, text, { Font = Enum.Font.Merriweather, TextColor = textColor, Padding = 12 })
	if textId then
		Kit.interact(board, "Read", { TextId = textId, ActionText = "Read", ObjectText = "Sign", MaxDistance = 14 })
	end
	return board
end

local function fenceRun(parent: Instance, x0: number, x1: number, z: number)
	local x = x0
	while x <= x1 do
		Kit.block(parent, "FencePost", Vector3.new(0.6, 4, 0.6), CFrame.new(x, 1.6, z), Palette.WoodDark, Enum.Material.Wood, { NoShadow = true })
		x += 16
	end
	local length = x1 - x0
	local pieces = math.max(1, math.ceil(length / 64))
	for i = 0, pieces - 1 do
		local a = x0 + length * i / pieces
		local b = x0 + length * (i + 1) / pieces
		for _, y in { 1.6, 3 } do
			Kit.block(parent, "FenceRail", Vector3.new(b - a, 0.3, 0.2), CFrame.new((a + b) / 2, y, z), Palette.WoodLight, Enum.Material.Wood, { NoShadow = true })
		end
	end
end

function Streetside.build(parent: Instance, rng: Kit.Rng)
	local folder = Kit.folder(parent, "Streetside")
	busStop(folder)

	local lights = Kit.folder(folder, "Streetlights")
	for i, x in Layout.StreetlightsX do
		streetlight(lights, x, if i % 2 == 0 then -1 else 1)
	end
	powerLines(folder)

	-- Signs.
	signpost(
		folder,
		"WelcomeSign",
		CFrame.new(-236, 0, 22) * CFrame.Angles(0, math.rad(70), 0),
		12,
		5,
		"WELCOME TO HALFWAY\nPopulation: enough",
		rgb(64, 96, 80),
		Palette.Cream,
		"welcome_sign"
	)
	signpost(folder, "FarewellSign", CFrame.new(300, 0, -22) * CFrame.Angles(0, math.rad(110), 0), 10, 4, "HALFWAY\ncome back soon", rgb(64, 96, 80), Palette.Cream)
	signpost(
		folder,
		"TrailSign",
		CFrame.new(-120, 0, 17),
		6,
		2.6,
		"LOOKOUT TRAIL →",
		Palette.WoodLight,
		rgb(60, 40, 30),
		"trail_sign"
	)
	local speed = Kit.block(folder, "SpeedSign", Vector3.new(2.4, 3, 0.15), CFrame.new(-140, 7.5, -15.5) * CFrame.Angles(0, math.pi, 0), Palette.White, Enum.Material.SmoothPlastic)
	Kit.label(speed, Enum.NormalId.Front, "SPEED\nLIMIT\n25", { Font = Enum.Font.Highway, TextColor = Palette.Black, Padding = 4 })
	Kit.post(folder, "SpeedPole", 6.2, 0.25, Vector3.new(-140, 0, -15.4), Palette.Metal, Enum.Material.Metal, { NoShadow = true })

	-- Parked cars, so the place feels like people are around.
	local cars = Kit.folder(folder, "ParkedCars")
	Vehicles.car(cars, CFrame.new(-81.5, 0.25, -47), rgb(150, 60, 56))
	Vehicles.car(cars, CFrame.new(27, 0.25, 30) * CFrame.Angles(0, math.pi, 0), rgb(220, 214, 196))
	Vehicles.pickup(cars, CFrame.new(108, 0.3, -48), rgb(70, 96, 120))
	Vehicles.car(cars, CFrame.new(57, 0.25, 30) * CFrame.Angles(0, math.pi, 0), rgb(110, 140, 110))

	-- Fire hydrants.
	for _, p in { Vector3.new(-6, 0.55, -18.5), Vector3.new(84, 0.55, 18.5) } do
		Kit.post(folder, "Hydrant", 2.4, 1.1, p, rgb(200, 52, 48), Enum.Material.Metal)
		Kit.ball(folder, "HydrantCap", 1.1, p + Vector3.new(0, 2.4, 0), rgb(200, 52, 48), Enum.Material.Metal, { Decor = true })
	end

	-- Farm fences out past the edge of town.
	local fences = Kit.folder(folder, "Fences")
	fenceRun(fences, -520, -150, -34)
	fenceRun(fences, -520, -128, 30)
	fenceRun(fences, 214, 520, -34)
	fenceRun(fences, 214, 520, 30)

	-- Hay bales in the east field.
	for i = 0, 4 do
		local p = Vector3.new(300 + i * 22 + rng:range(-6, 6), 0, -70 - rng:range(0, 50))
		Kit.cylinder(folder, "HayRoll", 5, 5.6, CFrame.new(p + Vector3.new(0, 2.6, 0)) * CFrame.Angles(0, rng:range(0, math.pi), 0), rgb(214, 186, 108), Enum.Material.Grass)
	end

	-- Places for roadside surprises.
	local anchors = Kit.folder(folder, "Anchors")
	for _, cf in Layout.RoadsideSpots do
		Kit.anchor(anchors, "RoadsideSpot", cf)
	end
	for _, p in Layout.WoodsSpots do
		Kit.anchor(anchors, "WoodsSpot", CFrame.new(p))
	end
	-- Road ends, where vehicles appear and leave.
	Kit.anchor(anchors, "RoadWest", CFrame.new(Layout.Bounds.MinX - 30, 0.2, 0))
	Kit.anchor(anchors, "RoadEast", CFrame.new(Layout.Bounds.MaxX + 30, 0.2, 0))
	Kit.anchor(anchors, "StoreCurb", CFrame.new(-52, 0.2, -Layout.Road.LaneOffset) * CFrame.Angles(0, math.rad(90), 0))
end

return Streetside
