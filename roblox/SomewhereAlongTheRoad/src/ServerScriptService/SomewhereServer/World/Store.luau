--!strict
-- The Halfway Mart: a small convenience store with aisles, fridges, a counter and a community board.
-- Local space: x across the storefront, z from the front door (-) to the back wall (+).

local Kit = require(script.Parent.Kit)
local Layout = require(script.Parent.Layout)
local Palette = require(script.Parent.Palette)

local Store = {}

local rgb = Color3.fromRGB

function Store.build(parent: Instance, rng: Kit.Rng)
	local spec = Layout.Store
	local origin = spec.Origin
	local W, D, H = spec.Width, spec.Depth, spec.Height
	local t = 1
	local model = Kit.model(parent, "HalfwayMart")
	model:SetAttribute("Building", "Store")
	local function L(x: number, y: number, z: number): CFrame
		return origin * CFrame.new(x, y, z)
	end

	-- Shell ------------------------------------------------------------------
	local floor = Kit.block(model, "StoreFloor", Vector3.new(W - 0.2, 0.6, D - 0.2), L(0, 0.3, 0), rgb(226, 224, 218), Enum.Material.CeramicTiles, {
		NoShadow = true,
	})
	floor:SetAttribute("InteriorOf", "Store")

	local front = Kit.wall(model, "Wall", origin, Vector3.new(-W / 2, 0, -D / 2 + t / 2), Vector3.new(W / 2, 0, -D / 2 + t / 2), H, t, Palette.StoreBrick, Enum.Material.Brick, {
		{ At = 0, Width = 8, Bottom = 0.6, Top = 9.2 },
		{ At = -13, Width = 13, Bottom = 2.6, Top = 10 },
		{ At = 13, Width = 13, Bottom = 2.6, Top = 10 },
	})
	Kit.wall(model, "Wall", origin, Vector3.new(W / 2 - t / 2, 0, -D / 2 + t), Vector3.new(W / 2 - t / 2, 0, D / 2 - t), H, t, Palette.StoreWall, Enum.Material.Plaster)
	local back = Kit.wall(model, "Wall", origin, Vector3.new(W / 2, 0, D / 2 - t / 2), Vector3.new(-W / 2, 0, D / 2 - t / 2), H, t, Palette.StoreWall, Enum.Material.Plaster, {
		{ At = -14, Width = 4, Bottom = 0.6, Top = 8 },
	})
	Kit.wall(model, "Wall", origin, Vector3.new(-W / 2 + t / 2, 0, D / 2 - t), Vector3.new(-W / 2 + t / 2, 0, -D / 2 + t), H, t, Palette.StoreWall, Enum.Material.Plaster)

	-- Kit.wall returns openings sorted left to right: [1] left window, [2] the door, [3] right window.
	Kit.window(model, front[1], 13, 7.4, t, { Frame = Palette.MetalDark, Mullion = true })
	Kit.window(model, front[3], 13, 7.4, t, { Frame = Palette.MetalDark, Mullion = true })

	Kit.block(model, "Roof", Vector3.new(W + 1, 1, D + 1), L(0, H + 0.5, 0), rgb(120, 118, 114), Enum.Material.Concrete)
	Kit.block(model, "Parapet", Vector3.new(W + 0.6, 3.6, 1.2), L(0, H + 1.8, -D / 2 + 0.6), Palette.StoreBrick, Enum.Material.Brick)
	Kit.block(model, "Coping", Vector3.new(W + 1, 0.4, 1.6), L(0, H + 3.8, -D / 2 + 0.6), Palette.Concrete, Enum.Material.Concrete, { NoShadow = true })
	Kit.block(model, "RoofUnit", Vector3.new(6, 3, 5), L(-8, H + 2.5, 6), Palette.Metal, Enum.Material.Metal)
	Kit.block(model, "RoofVent", Vector3.new(2, 1.6, 2), L(9, H + 1.8, 9), Palette.MetalDark, Enum.Material.Metal)

	local sign = Kit.block(model, "StoreSign", Vector3.new(30, 3.2, 0.5), L(0, H + 1.9, -D / 2 - 0.2), Palette.StoreGreen, Enum.Material.SmoothPlastic)
	Kit.label(sign, Enum.NormalId.Front, "HALFWAY MART", { Font = Enum.Font.Oswald, TextColor = Palette.Cream, Padding = 6 })

	-- Awning and the lights under it.
	Kit.block(model, "Awning", Vector3.new(W - 2, 0.5, 6), L(0, 10.9, -D / 2 - 3), Palette.StoreGreen, Enum.Material.SmoothPlastic)
	Kit.block(model, "AwningFascia", Vector3.new(W - 2, 1.2, 0.4), L(0, 10.75, -D / 2 - 6), Palette.Cream, Enum.Material.SmoothPlastic, { NoShadow = true })
	for _, x in { -12, 0, 12 } do
		local can = Kit.block(model, "AwningLight", Vector3.new(1.2, 0.3, 1.2), L(x, 10.5, -D / 2 - 3), rgb(160, 160, 160), Enum.Material.SmoothPlastic, { Decor = true })
		Kit.light(can, "SpotLight", { Range = 16, Brightness = 1.6, Angle = 110, Color = Palette.WarmLight })
		Kit.fixture(can, "StoreFront", Palette.WarmLight, rgb(160, 160, 160), Enum.Material.SmoothPlastic)
	end

	-- Automatic sliding doors (Systems/Store slides them open for anyone nearby).
	for _, side in { -1, 1 } do
		local panel = Kit.block(model, "SlidingDoor", Vector3.new(4.05, 8.6, 0.25), L(side * 2.02, 4.9, -D / 2 + t + 0.2), rgb(180, 200, 208), Enum.Material.Glass, {
			Transparency = 0.5,
		})
		panel:SetAttribute("AutoDoor", "Store")
		panel:SetAttribute("SlideX", side * 3.9)
		Kit.block(model, "DoorRail", Vector3.new(0.2, 8.6, 0.3), L(side * 4.05, 4.9, -D / 2 + t + 0.2), Palette.MetalDark, Enum.Material.Metal, { Decor = true })
	end
	-- The sign hangs on the left door and slides along with it.
	local doorSign = Kit.block(model, "DoorSign", Vector3.new(2.6, 1.6, 0.1), L(-2.02, 6.2, -D / 2 + t + 0.42), Palette.Cream, Enum.Material.SmoothPlastic, { Decor = true })
	doorSign:SetAttribute("StoreDoorSign", true)
	doorSign:SetAttribute("AutoDoor", "Store")
	doorSign:SetAttribute("SlideX", -3.9)
	local doorLabel = Kit.label(doorSign, Enum.NormalId.Front, "OPEN\n24 hrs-ish", { Font = Enum.Font.PatrickHand, TextColor = Palette.StoreGreen, Padding = 2 })
	doorLabel.Name = "DoorSignLabel"
	Kit.block(model, "Mat", Vector3.new(7, 0.06, 4), L(0, 0.63, -D / 2 + 3.2), rgb(70, 64, 60), Enum.Material.Fabric, { Decor = true })

	-- The "OPEN" sign glowing in the window.
	local openSign = Kit.block(model, "OpenSign", Vector3.new(4, 1.6, 0.1), L(13, 6.8, -D / 2 + t + 0.3), rgb(20, 20, 24), Enum.Material.SmoothPlastic, {
		Decor = true,
		Transparency = 0.2,
	})
	Kit.label(openSign, Enum.NormalId.Front, "OPEN", { Font = Enum.Font.Michroma, TextColor = Palette.Neon, Glow = true, Padding = 3 })
	openSign:SetAttribute("LightGroup", "StoreSign")
	openSign:SetAttribute("GuiSign", true)

	-- Ceiling lights.
	for _, pos in { Vector2.new(-10, -5), Vector2.new(-10, 7), Vector2.new(8, -5), Vector2.new(8, 7) } do
		local panel = Kit.block(model, "CeilingLight", Vector3.new(8, 0.3, 2), L(pos.X, H - 0.25, pos.Y), rgb(250, 248, 240), Enum.Material.Neon, { Decor = true })
		Kit.light(panel, "SurfaceLight", { Range = 18, Brightness = 1.3, Angle = 120, Color = rgb(255, 244, 228), Face = Enum.NormalId.Bottom })
		Kit.fixture(panel, "StoreInterior", rgb(250, 248, 240), rgb(150, 150, 150), Enum.Material.SmoothPlastic)
	end

	-- Aisles --------------------------------------------------------------------
	local productColors = {
		rgb(214, 70, 62),
		rgb(236, 180, 60),
		rgb(72, 128, 190),
		rgb(96, 168, 92),
		rgb(240, 236, 226),
		rgb(222, 120, 50),
		rgb(150, 92, 160),
		rgb(60, 60, 66),
	}
	for _, ax in { -15, -6 } do
		local len = 14
		local cz = 1
		Kit.block(model, "ShelfBase", Vector3.new(3.2, 0.8, len), L(ax, 1, cz), rgb(90, 96, 104), Enum.Material.Metal)
		Kit.block(model, "ShelfBack", Vector3.new(0.3, 6, len), L(ax, 4, cz), rgb(200, 202, 204), Enum.Material.Metal)
		Kit.block(model, "ShelfTop", Vector3.new(3.2, 0.25, len), L(ax, 7.1, cz), rgb(90, 96, 104), Enum.Material.Metal, { NoShadow = true })
		for _, y in { 2.9, 4.8 } do
			Kit.block(model, "Shelf", Vector3.new(3.2, 0.2, len), L(ax, y, cz), rgb(200, 202, 204), Enum.Material.Metal, { Decor = true })
		end
		for _, y in { 1.4, 3.0, 4.9 } do
			for _, side in { -1, 1 } do
				local z = cz - len / 2 + 0.6
				while z < cz + len / 2 - 1 do
					local w = rng:range(1.6, 3.2)
					local h = rng:range(0.9, 1.6)
					Kit.block(
						model,
						"Product",
						Vector3.new(1.1, h, w - 0.15),
						L(ax + side * 0.95, y + 0.1 + h / 2, z + w / 2),
						Kit.pick(rng, productColors),
						Enum.Material.SmoothPlastic,
						{ Decor = true }
					)
					z += w
				end
			end
		end
	end
	-- End cap with chips, facing the door.
	local endcap = Kit.block(model, "ChipsEndcap", Vector3.new(3.2, 4.2, 1.6), L(-6, 2.7, -6.9), rgb(236, 180, 60), Enum.Material.SmoothPlastic)
	Kit.label(endcap, Enum.NormalId.Front, "CHIPS!", { Font = Enum.Font.FredokaOne, TextColor = rgb(160, 40, 40), Padding = 4 })
	Kit.interact(endcap, "Give", { Item = "Snack", ActionText = "Grab some chips", ObjectText = "Chips", Speaker = "Marv", Line = "SnackGive" })

	-- Fridges along the back wall.
	local fridge = Kit.block(model, "Fridges", Vector3.new(25, 8.4, 3), L(-8, 4.8, D / 2 - t - 1.5), rgb(220, 222, 224), Enum.Material.Metal)
	fridge:SetAttribute("AmbientSound", "StoreHum")
	for i = 0, 4 do
		local x = -18 + i * 5
		for _, y in { 2.4, 4.6, 6.8 } do
			for k = 0, 2 do
				Kit.block(model, "Drink", Vector3.new(0.9, 1.5, 0.9), L(x - 1.3 + k * 1.3, y + 0.75, D / 2 - t - 2.1), Kit.pick(rng, productColors), Enum.Material.SmoothPlastic, {
					Decor = true,
				})
			end
		end
		local door = Kit.block(model, "FridgeDoor", Vector3.new(4.7, 7.2, 0.2), L(x, 4.8, D / 2 - t - 3.1), rgb(196, 220, 232), Enum.Material.Glass, {
			Transparency = 0.55,
			NoShadow = true,
		})
		if i == 2 then
			Kit.interact(door, "Give", { Item = "Soda", ActionText = "Grab a soda", ObjectText = "Fridge", Speaker = "Marv", Line = "SodaGive" })
		end
	end
	local glow = Kit.block(model, "FridgeGlow", Vector3.new(24, 0.2, 0.4), L(-8, 8.6, D / 2 - t - 2.6), Palette.CoolLight, Enum.Material.Neon, { Decor = true })
	Kit.fixture(glow, "StoreInterior", Palette.CoolLight, rgb(140, 140, 140), Enum.Material.SmoothPlastic)

	-- Counter, register, bell.
	Kit.block(model, "Counter", Vector3.new(2.6, 3.4, 12), L(13.2, 2.3, -6), rgb(110, 84, 62), Enum.Material.WoodPlanks)
	Kit.block(model, "CounterTop", Vector3.new(3.2, 0.3, 12.4), L(13.2, 4.15, -6), rgb(230, 226, 214), Enum.Material.Marble, { NoShadow = true })
	Kit.block(model, "Register", Vector3.new(1.6, 1, 1.8), L(13.4, 4.8, -8), Palette.MetalDark, Enum.Material.SmoothPlastic, { Decor = true })
	local screen = Kit.block(model, "RegisterScreen", Vector3.new(0.2, 1, 1.4), L(13.1, 5.8, -8), rgb(30, 60, 50), Enum.Material.SmoothPlastic, { Decor = true })
	Kit.label(screen, Enum.NormalId.Left, "THANK YOU", { Font = Enum.Font.Arcade, TextColor = rgb(120, 255, 180), Glow = true, Padding = 2 })
	local bell = Kit.disc(model, "CounterBell", 0.5, 0.9, L(12.6, 4.55, -3.5), Palette.Chrome, Enum.Material.Metal, { NoShadow = true })
	Kit.interact(bell, "Bell", { ActionText = "Ring the bell", ObjectText = "Counter bell" })
	Kit.block(model, "GumRack", Vector3.new(0.8, 2.4, 3), L(11.6, 1.8, -10), rgb(214, 70, 62), Enum.Material.SmoothPlastic, { Decor = true })
	-- Shelf behind the counter.
	Kit.block(model, "BackShelf", Vector3.new(1.6, 7, 12), L(W / 2 - t - 0.8, 4.1, -6), rgb(110, 84, 62), Enum.Material.WoodPlanks)
	for _, y in { 3, 5, 7 } do
		local z = -11.4
		while z < -0.8 do
			local w = rng:range(0.8, 1.6)
			Kit.block(model, "Product", Vector3.new(0.6, 1.1, w - 0.1), L(W / 2 - t - 1.9, y + 0.6, z + w / 2), Kit.pick(rng, productColors), Enum.Material.SmoothPlastic, {
				Decor = true,
			})
			z += w
		end
	end
	Kit.anchor(model, "NPC_Marv", L(17.4, 3.6, -5) * CFrame.Angles(0, math.rad(90), 0))
	Kit.anchor(model, "StoreBehindCounter", L(17.4, 3.6, -13.4))
	Kit.anchor(model, "StoreAisle", L(8, 3.6, -13.4))
	Kit.anchor(model, "StoreDoorInside", L(0, 3.6, -D / 2 + 4))
	Kit.anchor(model, "StoreDoorOutside", L(0, 3.6, -D / 2 - 9))

	-- Ice cream freezer and a magazine rack near the entrance.
	Kit.block(model, "Freezer", Vector3.new(6, 3, 3), L(-14, 2.1, -11), rgb(232, 234, 236), Enum.Material.SmoothPlastic)
	Kit.block(model, "FreezerLid", Vector3.new(5.6, 0.2, 2.6), L(-14, 3.7, -11), rgb(190, 214, 228), Enum.Material.Glass, { Transparency = 0.4, Decor = true })
	Kit.block(model, "MagazineRack", Vector3.new(4, 4, 1.2), L(-19.6, 2.6, -2), rgb(110, 84, 62), Enum.Material.Wood)
	for i = 0, 2 do
		Kit.block(model, "Magazine", Vector3.new(1.1, 1.4, 0.15), L(-20.6 + i * 1.2, 4.2, -1.3), Kit.pick(rng, productColors), Enum.Material.SmoothPlastic, { Decor = true })
	end

	-- Community board on the left wall.
	local board = Kit.block(model, "CommunityBoard", Vector3.new(0.3, 4, 7), L(-W / 2 + t + 0.15, 6, -9), rgb(186, 146, 102), Enum.Material.Cardboard)
	Kit.interact(board, "Read", { TextId = "bulletin", ActionText = "Read", ObjectText = "Community board" })
	local paperColors = { rgb(250, 248, 238), rgb(250, 236, 150), rgb(200, 226, 250), rgb(250, 210, 210) }
	for i = 0, 5 do
		local col = i % 3
		local row = math.floor(i / 3)
		Kit.block(
			model,
			"Flyer",
			Vector3.new(0.06, 1.3, 1.6),
			L(-W / 2 + t + 0.33, 6.9 - row * 1.8, -11.2 + col * 2.2) * CFrame.Angles(math.rad(rng:range(-6, 6)), 0, 0),
			paperColors[(i % #paperColors) + 1],
			Enum.Material.SmoothPlastic,
			{ Decor = true }
		)
	end

	-- Back door (employees only, and Gerald).
	local backDoor = Kit.block(model, "BackDoor", Vector3.new(4, 7.4, 0.3), back[1], rgb(120, 126, 130), Enum.Material.Metal)
	Kit.interact(backDoor, "Read", { TextId = "employees_only", ActionText = "Read sign", ObjectText = "Back door" })

	-- Outside: ice machine, payphone, bench, trash can, newspaper box.
	local ice = Kit.block(model, "IceMachine", Vector3.new(5, 5.2, 2.6), L(-17, 3.2, -D / 2 - 1.5), Palette.White, Enum.Material.SmoothPlastic)
	Kit.label(ice, Enum.NormalId.Front, "ICE", { Font = Enum.Font.Oswald, TextColor = rgb(60, 120, 190), Padding = 10 })
	local phone = Kit.block(model, "Payphone", Vector3.new(1.4, 3.2, 1.2), L(W / 2 + 0.7, 5, -10), Palette.Chrome, Enum.Material.Metal)
	Kit.block(model, "PayphoneHood", Vector3.new(2.4, 0.3, 2), L(W / 2 + 1, 7.3, -10), rgb(60, 90, 140), Enum.Material.SmoothPlastic, { Decor = true })
	Kit.interact(phone, "Read", { TextId = "payphone", ActionText = "Pick up", ObjectText = "Payphone" })
	Kit.bench(model, L(12, 0.6, -D / 2 - 2.2) * CFrame.Angles(0, math.pi, 0), 6, Palette.WoodLight, Palette.MetalDark)
	Kit.post(model, "TrashCan", 3.2, 2.2, L(5.5, 0.6, -D / 2 - 1.6).Position, rgb(70, 90, 76), Enum.Material.Metal)
	Kit.block(model, "NewsBox", Vector3.new(1.8, 3.4, 1.6), L(-6.5, 2.3, -D / 2 - 1.6), rgb(60, 110, 170), Enum.Material.Metal)

	return model, front
end

return Store
