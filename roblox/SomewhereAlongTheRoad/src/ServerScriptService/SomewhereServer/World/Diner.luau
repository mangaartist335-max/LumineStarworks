--!strict
-- The Mile Marker Diner: steel, red trim, booths by the windows, pie under glass.
-- Local space: x along the front, z from the front windows (-) to the kitchen (+).

local Kit = require(script.Parent.Kit)
local Layout = require(script.Parent.Layout)
local Palette = require(script.Parent.Palette)

local Diner = {}

local rgb = Color3.fromRGB

function Diner.build(parent: Instance, rng: Kit.Rng)
	local spec = Layout.Diner
	local origin = spec.Origin
	local W, D, H = spec.Width, spec.Depth, spec.Height
	local t = 1
	local model = Kit.model(parent, "MileMarkerDiner")
	model:SetAttribute("Building", "Diner")
	local function L(x: number, y: number, z: number): CFrame
		return origin * CFrame.new(x, y, z)
	end

	-- Shell ------------------------------------------------------------------
	local floor = Kit.block(model, "DinerFloor", Vector3.new(W - 0.2, 0.6, D - 0.2), L(0, 0.3, 0), rgb(236, 232, 222), Enum.Material.SmoothPlastic, {
		NoShadow = true,
	})
	floor:SetAttribute("InteriorOf", "Diner")
	-- Checkerboard in the dining room.
	for ix = 0, 11 do
		for iz = 0, 4 do
			if (ix + iz) % 2 == 0 then
				Kit.block(model, "Tile", Vector3.new(4, 0.04, 4), L(-24 + ix * 4 + 2, 0.62, -12 + iz * 4 + 2), rgb(40, 40, 46), Enum.Material.SmoothPlastic, {
					Decor = true,
				})
			end
		end
	end

	local windows = {}
	for i = 0, 4 do
		table.insert(windows, { At = -4 + i * 6.4, Width = 5.4, Bottom = 3.4, Top = 9.4 })
	end
	table.insert(windows, { At = -15, Width = 5, Bottom = 0.6, Top = 9 }) -- door
	table.insert(windows, { At = -21.5, Width = 4, Bottom = 3.4, Top = 9.4 })
	table.sort(windows, function(p, q)
		return p.At < q.At
	end)
	local front = Kit.wall(model, "Wall", origin, Vector3.new(-W / 2, 0, -D / 2 + t / 2), Vector3.new(W / 2, 0, -D / 2 + t / 2), H, t, Palette.DinerSteel, Enum.Material.Metal, windows)
	local side = Kit.wall(model, "Wall", origin, Vector3.new(W / 2 - t / 2, 0, -D / 2 + t), Vector3.new(W / 2 - t / 2, 0, D / 2 - t), H, t, Palette.DinerSteel, Enum.Material.Metal, {
		{ At = -6, Width = 6, Bottom = 3.4, Top = 9.4 },
	})
	Kit.wall(model, "Wall", origin, Vector3.new(W / 2, 0, D / 2 - t / 2), Vector3.new(-W / 2, 0, D / 2 - t / 2), H, t, Palette.DinerCream, Enum.Material.Plaster)
	Kit.wall(model, "Wall", origin, Vector3.new(-W / 2 + t / 2, 0, D / 2 - t), Vector3.new(-W / 2 + t / 2, 0, -D / 2 + t), H, t, Palette.DinerSteel, Enum.Material.Metal)

	for i, op in windows do
		if op.Bottom > 1 then
			Kit.window(model, front[i], op.Width, op.Top - op.Bottom, t, { Frame = Palette.Chrome, Sill = false })
		end
	end
	Kit.window(model, side[1], 6, 6, t, { Frame = Palette.Chrome, Sill = false })

	-- Red stripes wrapped around the outside (with a gap for the door).
	for _, y in { 2.4, 10.3 } do
		local pieces: { { number } } = if y < 5
			then { { -W / 2 - 0.15, -17.6 }, { -12.4, W / 2 + 0.15 } }
			else { { -W / 2 - 0.15, W / 2 + 0.15 } }
		for _, span in pieces do
			Kit.block(model, "Stripe", Vector3.new(span[2] - span[1], 1, 0.2), L((span[1] + span[2]) / 2, y, -D / 2 - 0.1), Palette.DinerRed, Enum.Material.SmoothPlastic, {
				Decor = true,
			})
		end
		Kit.block(model, "Stripe", Vector3.new(W + 0.3, 1, 0.2), L(0, y, D / 2 + 0.1), Palette.DinerRed, Enum.Material.SmoothPlastic, { Decor = true })
		for _, sx in { -1, 1 } do
			Kit.block(model, "Stripe", Vector3.new(0.2, 1, D + 0.3), L(sx * (W / 2 + 0.1), y, 0), Palette.DinerRed, Enum.Material.SmoothPlastic, { Decor = true })
		end
	end
	Kit.block(model, "Roof", Vector3.new(W + 2, 1, D + 2), L(0, H + 0.5, 0), rgb(150, 150, 152), Enum.Material.Metal)
	for _, s in { -1, 1 } do
		Kit.block(model, "RoofTrim", Vector3.new(W + 2.4, 0.8, 0.6), L(0, H + 1.2, s * (D / 2 + 0.9)), Palette.DinerRed, Enum.Material.SmoothPlastic, { NoShadow = true })
		Kit.block(model, "RoofTrim", Vector3.new(0.6, 0.8, D + 2.4), L(s * (W / 2 + 0.9), H + 1.2, 0), Palette.DinerRed, Enum.Material.SmoothPlastic, { NoShadow = true })
	end

	-- Roof sign on two posts, with neon tubing that hums at night.
	for _, x in { -10, 10 } do
		Kit.post(model, "SignPost", 4, 0.6, L(x, H + 1.4, 2).Position, Palette.MetalDark, Enum.Material.Metal)
	end
	local sign = Kit.block(model, "DinerSign", Vector3.new(28, 4.6, 0.6), L(0, H + 7.6, 2), rgb(30, 34, 44), Enum.Material.SmoothPlastic)
	Kit.label(sign, Enum.NormalId.Front, "MILE MARKER DINER", { Font = Enum.Font.Bangers, TextColor = Palette.Cream, Glow = true, Padding = 8 })
	local tube = Kit.block(model, "NeonTube", Vector3.new(28.6, 0.3, 0.3), L(0, H + 10.05, 1.6), Palette.Neon, Enum.Material.Neon, { Decor = true })
	Kit.fixture(tube, "DinerNeon", Palette.Neon, rgb(120, 60, 60), Enum.Material.Glass)
	local tube2 = Kit.block(model, "NeonTube", Vector3.new(28.6, 0.3, 0.3), L(0, H + 5.15, 1.6), Palette.NeonTeal, Enum.Material.Neon, { Decor = true })
	Kit.fixture(tube2, "DinerNeon", Palette.NeonTeal, rgb(60, 110, 104), Enum.Material.Glass)
	Kit.light(tube, "PointLight", { Range = 22, Brightness = 0.9, Color = Palette.Neon })
	local small = Kit.block(model, "PieSign", Vector3.new(8, 1.8, 0.3), L(14, 11.4, -D / 2 - 0.4), rgb(30, 34, 44), Enum.Material.SmoothPlastic, { Decor = true })
	Kit.label(small, Enum.NormalId.Front, "PIE · COFFEE · PIE", { Font = Enum.Font.Oswald, TextColor = Palette.NeonTeal, Glow = true, Padding = 3 })
	small:SetAttribute("LightGroup", "DinerNeon")
	small:SetAttribute("GuiSign", true)

	-- Front door (swings).
	local door = Kit.block(model, "DinerDoor", Vector3.new(4.8, 8.3, 0.3), L(-15, 4.75, -D / 2 + t / 2), rgb(196, 214, 222), Enum.Material.Glass, {
		Transparency = 0.35,
	})
	Kit.interact(door, "Door", { HingeSide = -1, OpenAngle = 100, ActionText = "Open", ObjectText = "Diner door" })
	Kit.block(model, "DoorFrame", Vector3.new(5.6, 0.5, 1.2), L(-15, 9.2, -D / 2 + t / 2), Palette.Chrome, Enum.Material.Metal, { Decor = true })
	Kit.block(model, "Step", Vector3.new(7, 0.2, 2), L(-15, 0.7, -D / 2 - 0.6), Palette.Concrete, Enum.Material.Concrete, { Decor = true })
	Kit.anchor(model, "DinerDoorOutside", L(-15, 1, -D / 2 - 4))
	Kit.anchor(model, "DinerDoorInside", L(-15, 1, -D / 2 + 4))

	-- Interior ---------------------------------------------------------------
	-- Counter with stools.
	local counterZ = 5
	Kit.block(model, "Counter", Vector3.new(34, 3.4, 2.4), L(0, 2.3, counterZ), Palette.DinerRed, Enum.Material.SmoothPlastic)
	Kit.block(model, "CounterTop", Vector3.new(34.6, 0.35, 3.2), L(0, 4.15, counterZ - 0.2), rgb(236, 230, 214), Enum.Material.Marble, { NoShadow = true })
	Kit.block(model, "CounterRail", Vector3.new(34, 0.25, 0.25), L(0, 1.2, counterZ - 1.5), Palette.Chrome, Enum.Material.Metal, { Decor = true })
	for i = 0, 6 do
		local x = -14 + i * 4.6
		Kit.post(model, "StoolPost", 2.2, 0.4, L(x, 0.6, counterZ - 3).Position, Palette.Chrome, Enum.Material.Metal, { NoShadow = true })
		Kit.disc(model, "StoolTop", 0.6, 2, L(x, 2.9, counterZ - 3), Palette.DinerRed, Enum.Material.Leather, { Decor = true })
		local seat = Kit.block(model, "Stool", Vector3.new(1.8, 0.4, 1.8), L(x, 3, counterZ - 3), Palette.DinerRed, Enum.Material.Leather, {
			Class = "Seat",
			Transparency = 1,
		})
		seat:SetAttribute("Sittable", true)
		if i == 5 then
			seat:SetAttribute("Anchor", "DinerStool")
		end
	end

	-- Behind the counter: coffee, pie case, menu board, kitchen pass.
	Kit.block(model, "BackBar", Vector3.new(34, 3.6, 2), L(0, 2.4, D / 2 - t - 1), rgb(200, 202, 204), Enum.Material.Metal)
	Kit.block(model, "CoffeeMachine", Vector3.new(2.6, 2.4, 1.6), L(-8, 5.4, D / 2 - t - 1.2), Palette.MetalDark, Enum.Material.Metal)
	local coffee = Kit.post(model, "CoffeePot", 1.2, 1, L(-6.4, 4.3, counterZ - 0.4).Position, rgb(90, 56, 40), Enum.Material.Glass, { NoShadow = true })
	Kit.interact(coffee, "Give", { Item = "Coffee", ActionText = "Ask for coffee", ObjectText = "Coffee", Speaker = "Dot", Line = "CoffeeGive" })
	local pieCase = Kit.block(model, "PieCase", Vector3.new(4, 2, 2.4), L(6, 5.3, counterZ - 0.2), rgb(220, 236, 244), Enum.Material.Glass, { Transparency = 0.45 })
	Kit.disc(model, "Pie", 0.5, 2.4, L(6, 4.65, counterZ - 0.2), rgb(214, 160, 96), Enum.Material.SmoothPlastic, { Decor = true })
	Kit.interact(pieCase, "Give", { Item = "Pie", ActionText = "Ask for pie", ObjectText = "Pie case", Speaker = "Dot", Line = "PieGive" })
	local menu = Kit.block(model, "MenuBoard", Vector3.new(16, 4, 0.3), L(-2, 9, D / 2 - t - 0.2), rgb(34, 38, 36), Enum.Material.SmoothPlastic)
	Kit.label(menu, Enum.NormalId.Front, "COFFEE  ·  PIE OF THE DAY  ·  GRILLED CHEESE  ·  SOUP (ASK)", {
		Font = Enum.Font.PermanentMarker,
		TextColor = rgb(240, 236, 220),
		Padding = 10,
	})
	Kit.interact(menu, "Read", { TextId = "menu_board", ActionText = "Read", ObjectText = "Menu", MaxDistance = 18 })
	Kit.anchor(model, "NPC_Dot", L(2, 3.6, counterZ + 2.6))
	Kit.anchor(model, "DinerBehindCounter", L(-4, 3.6, counterZ + 2.6))
	Kit.anchor(model, "DinerCounterEnd", L(-20, 3.6, counterZ + 3))
	Kit.anchor(model, "DinerFloorMid", L(-20, 3.6, 0))

	-- Booths along the front windows.
	for i = 0, 2 do
		local x = -2 + i * 10
		local tableZ = -D / 2 + 4.2
		Kit.block(model, "BoothTable", Vector3.new(3.4, 0.3, 4.6), L(x, 3.5, tableZ), rgb(236, 230, 214), Enum.Material.Marble)
		Kit.post(model, "BoothTablePost", 2.9, 0.5, L(x, 0.6, tableZ).Position, Palette.Chrome, Enum.Material.Metal, { NoShadow = true })
		for _, s in { -1, 1 } do
			local seat = Kit.block(model, "BoothSeat", Vector3.new(4.4, 0.9, 2.4), L(x + s * 3, 1.6, tableZ) * CFrame.Angles(0, s * math.pi / 2, 0), Palette.DinerRed, Enum.Material.Leather, {
				Class = "Seat",
			})
			seat:SetAttribute("Sittable", true)
			Kit.block(model, "BoothBack", Vector3.new(1, 3.6, 4.4), L(x + s * 4.3, 3.6, tableZ), Palette.DinerRed, Enum.Material.Leather)
		end
		Kit.block(model, "Ketchup", Vector3.new(0.35, 0.8, 0.35), L(x - 0.6, 4.05, tableZ + 1.6), rgb(200, 40, 40), Enum.Material.SmoothPlastic, { Decor = true })
		Kit.block(model, "Mustard", Vector3.new(0.35, 0.8, 0.35), L(x - 0.1, 4.05, tableZ + 1.6), rgb(232, 196, 50), Enum.Material.SmoothPlastic, { Decor = true })
	end

	-- Jukebox.
	local juke = Kit.block(model, "Jukebox", Vector3.new(3.4, 5, 2.2), L(-W / 2 + t + 1.3, 3.1, 1), rgb(122, 60, 50), Enum.Material.Wood)
	juke:SetAttribute("AmbientSound", "Jukebox")
	local arch = Kit.block(model, "JukeboxGlow", Vector3.new(3, 1.4, 0.3), L(-W / 2 + t + 2.5, 4.9, 1) * CFrame.Angles(0, math.pi / 2, 0), rgb(255, 180, 90), Enum.Material.Neon, { Decor = true })
	Kit.fixture(arch, "DinerInterior", rgb(255, 180, 90), rgb(120, 90, 70), Enum.Material.Glass)
	Kit.interact(juke, "Jukebox", { ActionText = "Play a song", ObjectText = "Jukebox" })

	-- The Postcard Wall.
	local postcardBoard = Kit.block(model, "PostcardWall", Vector3.new(0.3, 5, 9), L(-W / 2 + t + 0.15, 7, -6), rgb(186, 146, 102), Enum.Material.Cardboard)
	Kit.interact(postcardBoard, "Read", { TextId = "postcard_wall", Discovery = "postcard_wall", ActionText = "Look closer", ObjectText = "Postcards" })
	local cardColors = { rgb(250, 230, 170), rgb(170, 210, 236), rgb(236, 180, 170), rgb(190, 226, 180), rgb(250, 248, 240) }
	for i = 0, 13 do
		local col = i % 5
		local row = math.floor(i / 5)
		Kit.block(
			model,
			"Postcard",
			Vector3.new(0.05, 1, 1.4),
			L(-W / 2 + t + 0.32, 8.6 - row * 1.4, -9.4 + col * 1.7 + rng:range(-0.2, 0.2)) * CFrame.Angles(math.rad(rng:range(-12, 12)), 0, 0),
			Kit.pick(rng, cardColors),
			Enum.Material.SmoothPlastic,
			{ Decor = true }
		)
	end

	-- The Forever Puzzle on a corner table.
	Kit.block(model, "PuzzleTable", Vector3.new(5, 0.3, 4), L(-W / 2 + t + 4, 3.2, -D / 2 + 3.6), rgb(150, 110, 80), Enum.Material.Wood)
	Kit.post(model, "PuzzleTableLeg", 2.6, 0.5, L(-W / 2 + t + 4, 0.6, -D / 2 + 3.6).Position, Palette.WoodDark, Enum.Material.Wood, { NoShadow = true })
	local puzzle = Kit.block(model, "Puzzle", Vector3.new(4, 0.08, 3), L(-W / 2 + t + 4, 3.39, -D / 2 + 3.6), rgb(110, 160, 200), Enum.Material.Cardboard, { NoShadow = true })
	Kit.block(model, "PuzzleGap", Vector3.new(1.2, 0.1, 0.9), L(-W / 2 + t + 4.9, 3.4, -D / 2 + 3.3), rgb(150, 110, 80), Enum.Material.Wood, { Decor = true })
	Kit.interact(puzzle, "Read", { TextId = "forever_puzzle", Discovery = "forever_puzzle", ActionText = "Add a piece", ObjectText = "Puzzle" })
	Kit.block(model, "PuzzleChair", Vector3.new(2, 0.5, 2), L(-W / 2 + t + 4, 2, -D / 2 + 6.4), Palette.DinerRed, Enum.Material.Leather, { Class = "Seat" }):SetAttribute("Sittable", true)

	-- Pendant lights.
	for i = 0, 3 do
		local x = -14 + i * 9.6
		Kit.block(model, "PendantCord", Vector3.new(0.1, 2.2, 0.1), L(x, H - 1.1, -2), Palette.Black, Enum.Material.SmoothPlastic, { Decor = true })
		local shade = Kit.block(model, "PendantShade", Vector3.new(1.6, 1, 1.6), L(x, H - 2.6, -2), rgb(255, 222, 170), Enum.Material.Neon, { Decor = true })
		Kit.light(shade, "PointLight", { Range = 16, Brightness = 0.9, Color = Palette.WarmLight })
		Kit.fixture(shade, "DinerInterior", rgb(255, 222, 170), rgb(120, 110, 100), Enum.Material.SmoothPlastic)
	end
	floor:SetAttribute("AmbientSound", "DinerChatter")

	-- A bench and a planter out front.
	Kit.bench(model, L(4, 0.6, -D / 2 - 2.4) * CFrame.Angles(0, math.pi, 0), 6, Palette.WoodLight, Palette.MetalDark)
	Kit.block(model, "Planter", Vector3.new(6, 1.6, 2), L(-22, 1.4, -D / 2 - 1.8), Palette.WoodDark, Enum.Material.WoodPlanks)
	for i = 0, 4 do
		Kit.ball(model, "Flower", 0.9, L(-24.4 + i * 1.2, 2.5, -D / 2 - 1.8).Position, Kit.pick(rng, Palette.Flowers), Enum.Material.SmoothPlastic, { Decor = true })
	end

	return model
end

return Diner
