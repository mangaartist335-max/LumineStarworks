--!strict
-- Modest one-storey houses with porches. One of them (Hollis's yellow house) is open to visit.
-- Local space: x along the front, z from the front door (-) to the back wall (+).

local Kit = require(script.Parent.Kit)
local Layout = require(script.Parent.Layout)
local Palette = require(script.Parent.Palette)

local Houses = {}

local rgb = Color3.fromRGB
local FLOOR = 1.8
local WALL_H = 10

local function buildInterior(model: Model, origin: CFrame, spec: Layout.HouseSpec, rng: Kit.Rng)
	local W, D = spec.Width, spec.Depth
	local function L(x: number, y: number, z: number): CFrame
		return origin * CFrame.new(x, FLOOR + y, z)
	end
	local group = "HouseInterior_" .. spec.Id

	Kit.block(model, "Floor", Vector3.new(W - 2, 0.2, D - 2), L(0, 0.1, 0), rgb(150, 110, 78), Enum.Material.WoodPlanks, { NoShadow = true }):SetAttribute(
		"InteriorOf",
		spec.Id
	)
	Kit.block(model, "Rug", Vector3.new(9, 0.06, 7), L(-2, 0.23, 1), rgb(160, 70, 60), Enum.Material.Fabric, { Decor = true })

	-- Couch facing the TV on the left wall.
	local couchCF = L(1.5, 0, 1) * CFrame.Angles(0, math.rad(90), 0)
	local seat = Kit.block(model, "Couch", Vector3.new(7, 1.8, 2.6), couchCF * CFrame.new(0, 1.1, 0), rgb(96, 120, 140), Enum.Material.Fabric, { Class = "Seat" })
	seat:SetAttribute("Sittable", true)
	Kit.block(model, "CouchBack", Vector3.new(7, 2.4, 0.9), couchCF * CFrame.new(0, 2.4, 1.6), rgb(86, 110, 130), Enum.Material.Fabric)
	for _, s in { -1, 1 } do
		Kit.block(model, "CouchArm", Vector3.new(0.9, 1.8, 3.2), couchCF * CFrame.new(s * 3.9, 1.5, 0.2), rgb(86, 110, 130), Enum.Material.Fabric)
	end
	-- The cat, asleep, of course.
	local catCF = couchCF * CFrame.new(-2, 2.35, -0.2)
	local cat = Kit.block(model, "Cat", Vector3.new(1.8, 0.9, 1.1), catCF, rgb(232, 150, 80), Enum.Material.Fabric, { NoCollide = true })
	Kit.ball(model, "CatHead", 0.9, (catCF * CFrame.new(1.05, 0.15, 0)).Position, rgb(232, 150, 80), Enum.Material.Fabric, { Decor = true })
	Kit.wedge(model, "CatEar", Vector3.new(0.1, 0.35, 0.25), catCF * CFrame.new(1.15, 0.65, 0.2), rgb(214, 130, 70), Enum.Material.Fabric, { Decor = true })
	Kit.wedge(model, "CatEar", Vector3.new(0.1, 0.35, 0.25), catCF * CFrame.new(1.15, 0.65, -0.2), rgb(214, 130, 70), Enum.Material.Fabric, { Decor = true })
	Kit.block(model, "CatTail", Vector3.new(1.4, 0.25, 0.25), catCF * CFrame.new(-0.8, -0.3, 0.6) * CFrame.Angles(0, math.rad(30), 0), rgb(214, 130, 70), Enum.Material.Fabric, {
		Decor = true,
	})
	Kit.interact(cat, "Pet", { ActionText = "Pet the cat", ObjectText = "Biscuit" })

	-- TV and stand.
	Kit.block(model, "TVStand", Vector3.new(1.8, 2, 5), L(-W / 2 + 2.2, 1, 1), rgb(110, 84, 62), Enum.Material.Wood)
	local tv = Kit.block(model, "TV", Vector3.new(1, 2.6, 4), L(-W / 2 + 2.2, 3.4, 1), Palette.Black, Enum.Material.SmoothPlastic)
	Kit.label(tv, Enum.NormalId.Right, "today: pie", { Font = Enum.Font.Kalam, TextColor = rgb(255, 236, 200), Background = rgb(70, 110, 140), Glow = true, Padding = 6 })
	Kit.interact(tv, "Read", { TextId = "house_tv", ActionText = "Watch", ObjectText = "TV" })

	-- Bookshelf.
	Kit.block(model, "Bookshelf", Vector3.new(5, 7, 1.4), L(-6, 3.5, D / 2 - 1.8), rgb(110, 84, 62), Enum.Material.Wood)
	local bookColors = { rgb(160, 60, 50), rgb(60, 90, 140), rgb(220, 196, 120), rgb(70, 120, 80), rgb(200, 200, 190) }
	for _, y in { 1.4, 3.6, 5.8 } do
		local x = -8.2
		while x < -4 do
			local w = rng:range(0.3, 0.6)
			local h = rng:range(1.1, 1.6)
			Kit.block(model, "Book", Vector3.new(w - 0.05, h, 1), L(x + w / 2, y + h / 2 - 0.4, D / 2 - 2.3), Kit.pick(rng, bookColors), Enum.Material.SmoothPlastic, { Decor = true })
			x += w
		end
	end

	-- Kitchen corner.
	Kit.block(model, "KitchenCounter", Vector3.new(8, 3.4, 2.4), L(W / 2 - 6, 1.7, D / 2 - 2.2), rgb(236, 232, 220), Enum.Material.SmoothPlastic)
	Kit.block(model, "CounterTop", Vector3.new(8.2, 0.3, 2.6), L(W / 2 - 6, 3.5, D / 2 - 2.2), rgb(120, 110, 100), Enum.Material.Granite, { NoShadow = true })
	local fridgeX = W / 2 - 2.5
	local fridge = Kit.block(model, "Fridge", Vector3.new(3, 7.2, 2.6), L(fridgeX, 3.6, D / 2 - 5.6), rgb(232, 236, 238), Enum.Material.SmoothPlastic)
	Kit.interact(fridge, "Read", { TextId = "fridge_drawings", ActionText = "Look", ObjectText = "Fridge" })
	for i = 0, 2 do
		Kit.block(model, "Drawing", Vector3.new(0.05, 1, 0.8), L(fridgeX - 1.53, 4.6 - i * 0.2, D / 2 - 6.4 + i * 0.8), Kit.pick(rng, bookColors), Enum.Material.SmoothPlastic, {
			Decor = true,
		})
	end

	-- Floor lamp and the wall switch by the door.
	Kit.post(model, "LampPole", 5.6, 0.25, L(4.5, 0, D / 2 - 2).Position, Palette.MetalDark, Enum.Material.Metal, { NoShadow = true })
	local shade = Kit.block(model, "LampShade", Vector3.new(1.6, 1.3, 1.6), L(4.5, 6.2, D / 2 - 2), rgb(255, 226, 180), Enum.Material.Neon, { Decor = true })
	Kit.light(shade, "PointLight", { Range = 18, Brightness = 1, Color = Palette.WarmLight, Shadows = true })
	Kit.fixture(shade, group, rgb(255, 226, 180), rgb(220, 206, 186), Enum.Material.Fabric)
	local switch = Kit.block(model, "LightSwitch", Vector3.new(0.4, 0.6, 0.15), L(-W * 0.12 + 2.6, 4.4, -D / 2 + 1.1), Palette.White, Enum.Material.SmoothPlastic, { NoCollide = true })
	Kit.interact(switch, "Switch", { Group = group, ActionText = "Flip switch", ObjectText = "Light switch" })
end

function Houses.buildOne(parent: Instance, spec: Layout.HouseSpec, rng: Kit.Rng, lockedIndex: number)
	local W, D = spec.Width, spec.Depth
	local t = 0.8
	local model = Kit.model(parent, "House_" .. spec.Id)
	model:SetAttribute("Building", "House")
	model:SetAttribute("HouseId", spec.Id)
	local base = spec.Origin
	local origin = base * CFrame.new(0, FLOOR, 0)
	local function L(x: number, y: number, z: number): CFrame
		return origin * CFrame.new(x, y, z)
	end

	Kit.block(model, "Foundation", Vector3.new(W + 0.6, FLOOR, D + 0.6), base * CFrame.new(0, FLOOR / 2, 0), rgb(150, 146, 140), Enum.Material.Concrete)

	local doorAt = -W * 0.12
	local curtain = if spec.Open then nil else spec.Curtain
	local winOpts = { Frame = spec.Trim, Curtain = curtain, LightGroup = if spec.Open then nil else "HouseWindow", Extra = { House = spec.Id } }

	local front = Kit.wall(model, "Siding", origin, Vector3.new(-W / 2, 0, -D / 2 + t / 2), Vector3.new(W / 2, 0, -D / 2 + t / 2), WALL_H, t, spec.Siding, Enum.Material.WoodPlanks, {
		{ At = -W * 0.36, Width = 4, Bottom = 3, Top = 7.6 },
		{ At = doorAt, Width = 3.6, Bottom = 0, Top = 7.4 },
		{ At = W * 0.24, Width = 6, Bottom = 3, Top = 7.6 },
	})
	Kit.window(model, front[1], 4, 4.6, t, winOpts)
	Kit.window(model, front[3], 6, 4.6, t, winOpts)
	local right = Kit.wall(model, "Siding", origin, Vector3.new(W / 2 - t / 2, 0, -D / 2 + t), Vector3.new(W / 2 - t / 2, 0, D / 2 - t), WALL_H, t, spec.Siding, Enum.Material.WoodPlanks, {
		{ At = 0, Width = 4, Bottom = 3, Top = 7.6 },
	})
	Kit.window(model, right[1], 4, 4.6, t, winOpts)
	local back = Kit.wall(model, "Siding", origin, Vector3.new(W / 2, 0, D / 2 - t / 2), Vector3.new(-W / 2, 0, D / 2 - t / 2), WALL_H, t, spec.Siding, Enum.Material.WoodPlanks, {
		{ At = 0, Width = 5, Bottom = 3, Top = 7.6 },
	})
	Kit.window(model, back[1], 5, 4.6, t, winOpts)
	local left = Kit.wall(model, "Siding", origin, Vector3.new(-W / 2 + t / 2, 0, D / 2 - t), Vector3.new(-W / 2 + t / 2, 0, -D / 2 + t), WALL_H, t, spec.Siding, Enum.Material.WoodPlanks, {
		{ At = 0, Width = 4, Bottom = 3, Top = 7.6 },
	})
	Kit.window(model, left[1], 4, 4.6, t, winOpts)

	-- Corner boards.
	for _, cx in { -W / 2, W / 2 } do
		for _, cz in { -D / 2, D / 2 } do
			Kit.block(model, "Corner", Vector3.new(0.9, WALL_H, 0.9), L(cx, WALL_H / 2, cz), spec.Trim, Enum.Material.Wood, { NoShadow = true })
		end
	end

	Kit.gableRoof(model, origin, W, D, WALL_H, 6, 1.4, spec.Siding, Enum.Material.WoodPlanks, spec.Roof, Enum.Material.RoofShingles)
	Kit.block(model, "Fascia", Vector3.new(W + 2.8, 0.6, 0.4), L(0, WALL_H + 0.1, -D / 2 - 1.3), spec.Trim, Enum.Material.Wood, { Decor = true })
	Kit.block(model, "Fascia", Vector3.new(W + 2.8, 0.6, 0.4), L(0, WALL_H + 0.1, D / 2 + 1.3), spec.Trim, Enum.Material.Wood, { Decor = true })
	if spec.Chimney then
		Kit.block(model, "Chimney", Vector3.new(2.4, 9, 2.4), L(W / 2 - 3.5, WALL_H + 4, D / 4), rgb(150, 92, 72), Enum.Material.Brick)
	end

	-- Front door.
	local door = Kit.block(model, "FrontDoor", Vector3.new(3.6, 7.4, 0.3), front[2], spec.Door, Enum.Material.Wood)
	Kit.ball(model, "Knob", 0.35, (front[2] * CFrame.new(-1.3, -0.2, -0.25)).Position, Palette.Chrome, Enum.Material.Metal, { Decor = true })
	Kit.block(model, "DoorTrim", Vector3.new(4.6, 0.5, 0.4), front[2] * CFrame.new(0, 3.95, -0.3), spec.Trim, Enum.Material.Wood, { Decor = true })
	if spec.Open then
		Kit.interact(door, "Door", { HingeSide = 1, OpenAngle = 95, ActionText = "Open", ObjectText = "Front door" })
	else
		Kit.interact(door, "Door", { HingeSide = 1, Locked = true, LockedIndex = lockedIndex, ActionText = "Knock", ObjectText = "Front door" })
	end

	-- Porch, steps, posts, porch roof and the porch light.
	local pw = math.min(W * 0.6, 14)
	local pDepth = 6
	Kit.block(model, "Porch", Vector3.new(pw, FLOOR - 0.1, pDepth), base * CFrame.new(doorAt, (FLOOR - 0.1) / 2, -D / 2 - pDepth / 2), Palette.WoodLight, Enum.Material.WoodPlanks)
	Kit.block(model, "Step", Vector3.new(4, 1.2, 1.4), base * CFrame.new(doorAt, 0.6, -D / 2 - pDepth - 0.7), Palette.WoodLight, Enum.Material.WoodPlanks)
	Kit.block(model, "Step", Vector3.new(4, 0.6, 1.4), base * CFrame.new(doorAt, 0.3, -D / 2 - pDepth - 2.1), Palette.WoodLight, Enum.Material.WoodPlanks)
	for _, s in { -1, 1 } do
		Kit.block(model, "PorchPost", Vector3.new(0.6, 8.2, 0.6), L(doorAt + s * (pw / 2 - 0.4), 4.1, -D / 2 - pDepth + 0.4), spec.Trim, Enum.Material.Wood)
	end
	Kit.block(model, "PorchRoof", Vector3.new(pw + 1, 0.5, pDepth + 0.6), L(doorAt, 8.4, -D / 2 - pDepth / 2 + 0.2) * CFrame.Angles(math.rad(-6), 0, 0), spec.Roof, Enum.Material.RoofShingles)
	local porchLight = Kit.block(model, "PorchLight", Vector3.new(0.6, 0.9, 0.5), L(doorAt + 2.6, 6.4, -D / 2 - 0.3), rgb(255, 230, 190), Enum.Material.Neon, { Decor = true })
	Kit.light(porchLight, "PointLight", { Range = 12, Brightness = 0.8, Color = Palette.WarmLight })
	Kit.fixture(porchLight, "PorchLight", rgb(255, 230, 190), rgb(200, 196, 186), Enum.Material.Glass, { House = spec.Id })

	-- Bushes along the front.
	for _, bx in { -W / 2 + 1.6, doorAt + pw / 2 + 2, W / 2 - 2.5 } do
		Kit.ball(model, "Bush", rng:range(3, 4.2), L(bx, -0.6, -D / 2 - 1.8).Position, Kit.pick(rng, Palette.Bush), Enum.Material.LeafyGrass, { NoCollide = true })
	end

	if spec.Open then
		buildInterior(model, base, spec, rng)
		Kit.bench(model, L(doorAt + 4.6, 0, -D / 2 - 1.6), 4.4, Palette.White, spec.Trim)
	end

	return model
end

-- Little things in front of each house: mailbox, picket fence, and Hollis's garden.
local function yard(parent: Instance, spec: Layout.HouseSpec, rng: Kit.Rng)
	local p = spec.Origin.Position
	local north = p.Z < 0
	local half = Layout.Road.Width / 2 + Layout.Sidewalk.Width
	local edgeZ = if north then -half - 1.2 else half + 1.2
	local folder = Kit.model(parent, "Yard_" .. spec.Id)

	local mailboxX = p.X + 3.4
	Kit.post(folder, "MailboxPost", 3.6, 0.4, Vector3.new(mailboxX, 0, edgeZ), Palette.WoodDark, Enum.Material.Wood)
	local box = Kit.block(folder, "Mailbox", Vector3.new(1, 1, 1.8), CFrame.new(mailboxX, 4, edgeZ), Kit.pick(rng, { rgb(60, 70, 80), spec.Door, rgb(200, 200, 196) }), Enum.Material.Metal)
	if spec.Id == "S2" then
		Kit.interact(box, "Read", { TextId = "mailbox", ActionText = "Peek", ObjectText = "Mailbox" })
	end

	-- Picket fence along the front, with gaps for the walk and the driveway.
	local x0 = p.X - spec.Width / 2 - 2
	local x1 = p.X + spec.Width / 2 + 0.2
	local x = x0
	while x <= x1 do
		local inWalk = math.abs(x - p.X) < 2.4
		if not inWalk and math.abs(x - mailboxX) > 0.8 then
			Kit.block(folder, "Picket", Vector3.new(0.45, 3, 0.2), CFrame.new(x, 1.5, edgeZ), Palette.White, Enum.Material.Wood, { NoShadow = true })
		end
		x += 1.4
	end
	for _, span in { { x0, p.X - 2.4 }, { p.X + 2.4, x1 } } do
		for _, y in { 1, 2.3 } do
			Kit.block(folder, "Rail", Vector3.new(span[2] - span[1], 0.25, 0.15), CFrame.new((span[1] + span[2]) / 2, y, edgeZ + (if north then -0.15 else 0.15)), Palette.White, Enum.Material.Wood, {
				Decor = true,
			})
		end
	end

	if spec.Id == "S1" then
		-- Hollis's tomato beds, his watering can and Gerald's (currently empty) spot.
		local gx = p.X - spec.Width / 2 - 7
		for i = 0, 1 do
			local gz = p.Z - 6 + i * 8
			Kit.block(folder, "GardenBed", Vector3.new(5, 1, 6), CFrame.new(gx, 0.5, gz), Palette.WoodDark, Enum.Material.WoodPlanks)
			Kit.block(folder, "Soil", Vector3.new(4.4, 0.2, 5.4), CFrame.new(gx, 1.05, gz), rgb(84, 60, 44), Enum.Material.Ground, { Decor = true })
			for k = 0, 2 do
				local plant = Vector3.new(gx + rng:range(-1.2, 1.2), 2.1, gz - 1.8 + k * 1.8)
				Kit.ball(folder, "Plant", 1.8, plant, Kit.pick(rng, Palette.Bush), Enum.Material.LeafyGrass, { Decor = true })
				Kit.ball(folder, "Tomato", 0.45, plant + Vector3.new(0.6, 0.2, 0.5), rgb(214, 60, 48), Enum.Material.SmoothPlastic, { Decor = true })
			end
		end
		Kit.post(folder, "WateringCan", 1, 1, Vector3.new(gx + 3.5, 0, p.Z + 4), rgb(90, 140, 120), Enum.Material.Metal, { NoShadow = true })
		Kit.anchor(folder, "NPC_Hollis", CFrame.lookAt(Vector3.new(gx + 3.5, 3, p.Z - 4), Vector3.new(gx, 3, p.Z - 4)))
		Kit.anchor(folder, "MowerHome", CFrame.new(gx - 2, 0, p.Z - 16) * CFrame.Angles(0, math.rad(-90), 0))
		local pedestal = Kit.block(folder, "GnomePedestal", Vector3.new(1.4, 0.6, 1.4), CFrame.new(p.X - 8, 0.3, p.Z - spec.Depth / 2 - 7), rgb(170, 166, 158), Enum.Material.Concrete)
		local tag = Kit.block(folder, "GnomeSign", Vector3.new(1.2, 0.7, 0.1), CFrame.new(p.X - 8, 1.2, p.Z - spec.Depth / 2 - 7.75), Palette.Cream, Enum.Material.Wood, { Decor = true })
		Kit.label(tag, Enum.NormalId.Front, "Gerald", { Font = Enum.Font.PatrickHand, TextColor = rgb(70, 60, 50), Padding = 2 })
		pedestal:SetAttribute("Anchor", "GnomeHome")
	end
end

function Houses.build(parent: Instance, rng: Kit.Rng)
	local folder = Kit.folder(parent, "Houses")
	local locked = 0
	for _, spec in Layout.Houses do
		if not spec.Open then
			locked += 1
		end
		Houses.buildOne(folder, spec, rng, locked)
		yard(folder, spec, rng)
	end
end

return Houses
