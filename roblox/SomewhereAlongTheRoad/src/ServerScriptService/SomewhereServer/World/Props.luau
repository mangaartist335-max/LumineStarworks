--!strict
-- Small things that show up during events: animals, lost objects, hats, a compass.
-- Every builder returns a Model with PrimaryPart "Root" at ground level, front facing -Z.

local Kit = require(script.Parent.Kit)
local Palette = require(script.Parent.Palette)

local Props = {}

local rgb = Color3.fromRGB

local function newModel(parent: Instance, name: string, cf: CFrame): Model
	local m = Kit.model(parent, name)
	local r = Kit.block(m, "Root", Vector3.new(1, 0.2, 1), cf * CFrame.new(0, 0.1, 0), Color3.new(1, 1, 1), Enum.Material.SmoothPlastic, {
		Transparency = 1,
		Decor = true,
	})
	m.PrimaryPart = r
	return m
end

local function at(cf: CFrame, x: number, y: number, z: number): Vector3
	return (cf * CFrame.new(x, y, z)).Position
end

function Props.deer(parent: Instance, cf: CFrame): Model
	local m = newModel(parent, "Deer", cf)
	local fur, light = rgb(156, 110, 72), rgb(232, 214, 188)
	Kit.block(m, "Body", Vector3.new(2, 2.2, 5), cf * CFrame.new(0, 4.4, 0), fur, Enum.Material.Fabric)
	Kit.block(m, "Belly", Vector3.new(1.8, 0.6, 4.2), cf * CFrame.new(0, 3.4, 0), light, Enum.Material.Fabric, { Decor = true })
	for _, x in { -0.7, 0.7 } do
		for _, z in { -1.9, 1.9 } do
			Kit.block(m, "Leg", Vector3.new(0.45, 3.4, 0.45), cf * CFrame.new(x, 1.7, z), fur, Enum.Material.Fabric, { NoShadow = true })
		end
	end
	Kit.block(m, "Neck", Vector3.new(1, 2.6, 1.1), cf * CFrame.new(0, 6, -2.4) * CFrame.Angles(math.rad(-25), 0, 0), fur, Enum.Material.Fabric)
	Kit.block(m, "Head", Vector3.new(1.2, 1.2, 2.2), cf * CFrame.new(0, 7.4, -3.2), fur, Enum.Material.Fabric)
	Kit.block(m, "Nose", Vector3.new(0.6, 0.5, 0.4), cf * CFrame.new(0, 7.2, -4.4), Palette.Black, Enum.Material.SmoothPlastic, { Decor = true })
	for _, s in { -1, 1 } do
		Kit.wedge(m, "Ear", Vector3.new(0.2, 1.1, 0.6), cf * CFrame.new(s * 0.7, 8.4, -2.6), fur, Enum.Material.Fabric, { Decor = true })
		Kit.ball(m, "Eye", 0.3, at(cf, s * 0.62, 7.6, -3.6), Palette.Black, Enum.Material.SmoothPlastic, { Decor = true })
	end
	Kit.block(m, "Tail", Vector3.new(0.6, 0.9, 0.4), cf * CFrame.new(0, 5, 2.6), light, Enum.Material.Fabric, { Decor = true })
	return m
end

function Props.owl(parent: Instance, cf: CFrame): Model
	local m = newModel(parent, "Owl", cf)
	local brown, cream = rgb(130, 98, 70), rgb(226, 206, 170)
	Kit.block(m, "Branch", Vector3.new(4, 0.5, 0.5), cf * CFrame.new(0, 0.25, 0), Palette.Bark, Enum.Material.Wood)
	Kit.ball(m, "Body", 1.8, at(cf, 0, 1.4, 0), brown, Enum.Material.Fabric)
	Kit.ball(m, "Chest", 1.3, at(cf, 0, 1.3, -0.4), cream, Enum.Material.Fabric, { Decor = true })
	Kit.ball(m, "Head", 1.5, at(cf, 0, 2.6, 0), brown, Enum.Material.Fabric)
	for _, s in { -1, 1 } do
		Kit.disc(m, "EyeRing", 0.2, 0.75, cf * CFrame.new(s * 0.35, 2.7, -0.62) * CFrame.Angles(math.rad(90), 0, 0), cream, Enum.Material.SmoothPlastic, { Decor = true })
		Kit.ball(m, "Eye", 0.35, at(cf, s * 0.35, 2.7, -0.72), rgb(250, 200, 60), Enum.Material.Neon, { Decor = true })
		Kit.wedge(m, "Tuft", Vector3.new(0.2, 0.6, 0.4), cf * CFrame.new(s * 0.45, 3.4, 0), brown, Enum.Material.Fabric, { Decor = true })
	end
	Kit.wedge(m, "Beak", Vector3.new(0.2, 0.35, 0.3), cf * CFrame.new(0, 2.45, -0.75), rgb(70, 60, 50), Enum.Material.SmoothPlastic, { Decor = true })
	return m
end

function Props.raccoon(parent: Instance, cf: CFrame): Model
	local m = newModel(parent, "Raccoon", cf)
	local gray, dark = rgb(132, 130, 128), rgb(52, 52, 56)
	Kit.ball(m, "Body", 2.2, at(cf, 0, 1.3, 0.3), gray, Enum.Material.Fabric)
	Kit.ball(m, "Head", 1.5, at(cf, 0, 2.4, -0.9), gray, Enum.Material.Fabric)
	Kit.block(m, "Mask", Vector3.new(1.4, 0.4, 0.5), cf * CFrame.new(0, 2.5, -1.45), dark, Enum.Material.Fabric, { Decor = true })
	for _, s in { -1, 1 } do
		Kit.wedge(m, "Ear", Vector3.new(0.2, 0.5, 0.4), cf * CFrame.new(s * 0.5, 3.2, -0.9), gray, Enum.Material.Fabric, { Decor = true })
	end
	for i = 0, 3 do
		Kit.cylinder(m, "Tail", 0.55, 0.8, cf * CFrame.new(0, 1, 1.6 + i * 0.5) * CFrame.Angles(0, math.rad(90), 0), if i % 2 == 0 then gray else dark, Enum.Material.Fabric, {
			Decor = true,
		})
	end
	-- The sandwich.
	local s = cf * CFrame.new(0, 1.9, -1.8)
	Kit.block(m, "Bread", Vector3.new(1.1, 0.18, 1.1), s * CFrame.new(0, -0.2, 0), rgb(226, 190, 130), Enum.Material.SmoothPlastic, { Decor = true })
	Kit.block(m, "Lettuce", Vector3.new(1.2, 0.1, 1.2), s, rgb(120, 190, 80), Enum.Material.SmoothPlastic, { Decor = true })
	Kit.block(m, "Tomato", Vector3.new(1, 0.12, 1), s * CFrame.new(0, 0.1, 0), rgb(214, 70, 60), Enum.Material.SmoothPlastic, { Decor = true })
	Kit.block(m, "Bread", Vector3.new(1.1, 0.18, 1.1), s * CFrame.new(0, 0.25, 0), rgb(226, 190, 130), Enum.Material.SmoothPlastic, { Decor = true })
	return m
end

function Props.chicken(parent: Instance, cf: CFrame): Model
	local m = newModel(parent, "Chicken", cf)
	Kit.ball(m, "Body", 1.6, at(cf, 0, 1.6, 0), rgb(246, 244, 238), Enum.Material.Fabric)
	Kit.ball(m, "Head", 0.9, at(cf, 0, 2.6, -0.6), rgb(246, 244, 238), Enum.Material.Fabric)
	Kit.block(m, "Comb", Vector3.new(0.15, 0.4, 0.5), cf * CFrame.new(0, 3.1, -0.6), rgb(214, 40, 40), Enum.Material.SmoothPlastic, { Decor = true })
	Kit.wedge(m, "Beak", Vector3.new(0.25, 0.25, 0.35), cf * CFrame.new(0, 2.55, -1.15), rgb(240, 160, 40), Enum.Material.SmoothPlastic, { Decor = true })
	Kit.block(m, "TailFeathers", Vector3.new(0.3, 0.9, 0.5), cf * CFrame.new(0, 2.1, 0.8) * CFrame.Angles(math.rad(-30), 0, 0), rgb(236, 232, 226), Enum.Material.Fabric, {
		Decor = true,
	})
	for _, s in { -1, 1 } do
		Kit.block(m, "Leg", Vector3.new(0.12, 0.9, 0.12), cf * CFrame.new(s * 0.3, 0.5, 0), rgb(240, 160, 40), Enum.Material.SmoothPlastic, { Decor = true })
		Kit.ball(m, "Eye", 0.15, at(cf, s * 0.3, 2.75, -0.95), Palette.Black, Enum.Material.SmoothPlastic, { Decor = true })
	end
	return m
end

function Props.mower(parent: Instance, cf: CFrame): Model
	local m = newModel(parent, "Mower", cf)
	local red = rgb(196, 56, 50)
	Kit.block(m, "Deck", Vector3.new(3, 1, 3.2), cf * CFrame.new(0, 1.1, 0), red, Enum.Material.Metal)
	Kit.post(m, "Engine", 1, 1.6, at(cf, 0, 1.6, 0), Palette.MetalDark, Enum.Material.Metal)
	Kit.block(m, "GrassBag", Vector3.new(2, 1.6, 1.6), cf * CFrame.new(0, 1.5, 2.4), rgb(70, 90, 70), Enum.Material.Fabric)
	for _, s in { -1, 1 } do
		Kit.block(m, "Handle", Vector3.new(0.2, 0.2, 3.6), cf * CFrame.new(s * 1, 2.6, 2.6) * CFrame.Angles(math.rad(35), 0, 0), Palette.MetalDark, Enum.Material.Metal, { Decor = true })
		for _, z in { -1.2, 1.2 } do
			Kit.cylinder(m, "Wheel", 0.4, 1.1, cf * CFrame.new(s * 1.6, 0.55, z), rgb(34, 34, 36), Enum.Material.Rubber, { Decor = true })
		end
	end
	Kit.block(m, "Grip", Vector3.new(2.2, 0.25, 0.25), cf * CFrame.new(0, 3.65, 4.1), Palette.Black, Enum.Material.Rubber, { Decor = true })
	return m
end

function Props.gnome(parent: Instance, cf: CFrame): Model
	local m = newModel(parent, "Gerald", cf)
	Kit.disc(m, "Body", 1.4, 1.6, cf * CFrame.new(0, 0.9, 0), rgb(70, 110, 170), Enum.Material.SmoothPlastic)
	Kit.ball(m, "Beard", 1.3, at(cf, 0, 1.75, -0.3), rgb(244, 242, 236), Enum.Material.SmoothPlastic, { Decor = true })
	Kit.ball(m, "Face", 0.9, at(cf, 0, 2.2, -0.15), rgb(240, 196, 166), Enum.Material.SmoothPlastic, { Decor = true })
	Kit.ball(m, "Nose", 0.35, at(cf, 0, 2.15, -0.6), rgb(232, 160, 140), Enum.Material.SmoothPlastic, { Decor = true })
	Kit.disc(m, "Hat", 0.5, 1.1, cf * CFrame.new(0, 2.65, 0), rgb(200, 40, 40), Enum.Material.SmoothPlastic, { Decor = true })
	Kit.disc(m, "Hat", 0.5, 0.75, cf * CFrame.new(0, 3.1, 0.05), rgb(200, 40, 40), Enum.Material.SmoothPlastic, { Decor = true })
	Kit.disc(m, "Hat", 0.5, 0.4, cf * CFrame.new(0, 3.5, 0.12), rgb(200, 40, 40), Enum.Material.SmoothPlastic, { Decor = true })
	return m
end

function Props.umbrella(parent: Instance, cf: CFrame): Model
	local m = newModel(parent, "Umbrella", cf)
	local tilt = cf * CFrame.new(0, 0.6, 0) * CFrame.Angles(math.rad(12), 0, math.rad(8))
	Kit.disc(m, "Canopy", 0.5, 5.4, tilt, rgb(206, 50, 52), Enum.Material.Fabric)
	Kit.disc(m, "Puddle", 0.1, 3.6, tilt * CFrame.new(0, 0.28, 0), rgb(150, 190, 210), Enum.Material.Glass, { Transparency = 0.3, Decor = true })
	Kit.post(m, "Shaft", 3.2, 0.2, (tilt * CFrame.new(0, 0.2, 0)).Position, Palette.MetalDark, Enum.Material.Metal, { Decor = true })
	return m
end

function Props.suitcase(parent: Instance, cf: CFrame, color: Color3?): Model
	local m = newModel(parent, "Suitcase", cf)
	local c = color or rgb(150, 96, 62)
	Kit.block(m, "Case", Vector3.new(3.4, 2.4, 1.2), cf * CFrame.new(0, 1.25, 0), c, Enum.Material.Leather)
	Kit.block(m, "Handle", Vector3.new(1.2, 0.3, 0.3), cf * CFrame.new(0, 2.6, 0), Palette.Black, Enum.Material.Leather, { Decor = true })
	Kit.block(m, "Tag", Vector3.new(0.5, 0.7, 0.05), cf * CFrame.new(0.7, 2.2, -0.65), Palette.Cream, Enum.Material.SmoothPlastic, { Decor = true })
	for _, x in { -1.1, 1.1 } do
		Kit.block(m, "Strap", Vector3.new(0.25, 2.45, 1.25), cf * CFrame.new(x, 1.25, 0), c:Lerp(Color3.new(0, 0, 0), 0.4), Enum.Material.Leather, { Decor = true })
	end
	return m
end

local function sunflower(m: Model, base: Vector3, height: number)
	Kit.post(m, "Stem", height, 0.2, base, rgb(90, 140, 60), Enum.Material.SmoothPlastic, { Decor = true })
	local head = CFrame.new(base + Vector3.new(0, height, 0)) * CFrame.Angles(math.rad(70), 0, 0)
	Kit.disc(m, "Petals", 0.15, 1.6, head, rgb(250, 204, 50), Enum.Material.SmoothPlastic, { Decor = true })
	Kit.disc(m, "Seeds", 0.2, 0.8, head * CFrame.new(0, 0.05, 0), rgb(96, 64, 40), Enum.Material.SmoothPlastic, { Decor = true })
end

function Props.sunflowerJar(parent: Instance, cf: CFrame): Model
	local m = newModel(parent, "SunflowerJar", cf)
	Kit.post(m, "Jar", 1.4, 1, at(cf, 0, 0, 0), rgb(200, 226, 230), Enum.Material.Glass, { Transparency = 0.4 })
	for i = 0, 2 do
		sunflower(m, at(cf, -0.25 + i * 0.25, 0.8, -0.1 + i * 0.1), 1.8 + i * 0.4)
	end
	Kit.block(m, "Note", Vector3.new(0.7, 0.5, 0.05), cf * CFrame.new(0.2, 0.6, -0.55), Palette.Cream, Enum.Material.SmoothPlastic, { Decor = true })
	return m
end

function Props.books(parent: Instance, cf: CFrame): Model
	local m = newModel(parent, "Books", cf)
	local colors = { rgb(160, 60, 50), rgb(60, 90, 140), rgb(220, 196, 120) }
	for i = 0, 2 do
		Kit.block(m, "Book", Vector3.new(1.6, 0.4, 2.2), cf * CFrame.new(0, 0.2 + i * 0.4, 0) * CFrame.Angles(0, math.rad(i * 9 - 8), 0), colors[i + 1], Enum.Material.SmoothPlastic)
	end
	return m
end

function Props.radio(parent: Instance, cf: CFrame): Model
	local m = newModel(parent, "Radio", cf)
	Kit.block(m, "Case", Vector3.new(2.2, 1.4, 0.8), cf * CFrame.new(0, 0.7, 0), rgb(170, 120, 80), Enum.Material.Wood)
	Kit.disc(m, "Speaker", 0.1, 0.9, cf * CFrame.new(-0.4, 0.7, -0.42) * CFrame.Angles(math.rad(90), 0, 0), rgb(60, 50, 44), Enum.Material.Fabric, { Decor = true })
	Kit.block(m, "Dial", Vector3.new(0.6, 0.4, 0.05), cf * CFrame.new(0.5, 0.8, -0.42), rgb(240, 220, 160), Enum.Material.Neon, { Decor = true })
	Kit.block(m, "Antenna", Vector3.new(0.06, 2, 0.06), cf * CFrame.new(0.8, 2.2, 0) * CFrame.Angles(0, 0, math.rad(-20)), Palette.Chrome, Enum.Material.Metal, { Decor = true })
	return m
end

function Props.compass(parent: Instance, cf: CFrame): Model
	local m = newModel(parent, "Compass", cf)
	Kit.disc(m, "Case", 0.3, 1, cf * CFrame.new(0, 0.15, 0), rgb(196, 160, 80), Enum.Material.Metal)
	Kit.disc(m, "Glass", 0.06, 0.8, cf * CFrame.new(0, 0.32, 0), rgb(230, 240, 250), Enum.Material.Glass, { Transparency = 0.4, Decor = true })
	Kit.block(m, "Needle", Vector3.new(0.08, 0.04, 0.7), cf * CFrame.new(0, 0.33, 0), rgb(200, 50, 50), Enum.Material.Neon, { Decor = true })
	return m
end

-- Hats and held items for the residents. Built at the origin; NPCs weld them on.
function Props.hat(parent: Instance, kind: string, color: Color3): Model
	local m = Kit.model(parent, "Hat")
	local cf = CFrame.new()
	if kind == "Straw" then
		Kit.disc(m, "Brim", 0.15, 3, cf, color, Enum.Material.Fabric, { Decor = true })
		Kit.disc(m, "Crown", 0.9, 1.6, cf * CFrame.new(0, 0.45, 0), color, Enum.Material.Fabric, { Decor = true })
	elseif kind == "Bucket" then
		Kit.disc(m, "Brim", 0.2, 2.3, cf, color, Enum.Material.Fabric, { Decor = true })
		Kit.disc(m, "Crown", 0.9, 1.7, cf * CFrame.new(0, 0.45, 0), color, Enum.Material.Fabric, { Decor = true })
	elseif kind == "Cap" then
		Kit.disc(m, "Crown", 0.7, 1.7, cf * CFrame.new(0, 0.3, 0), color, Enum.Material.Fabric, { Decor = true })
		Kit.block(m, "Visor", Vector3.new(1.4, 0.12, 1), cf * CFrame.new(0, 0, -1), color, Enum.Material.Fabric, { Decor = true })
	elseif kind == "Fedora" then
		Kit.disc(m, "Brim", 0.15, 2.4, cf, color, Enum.Material.Fabric, { Decor = true })
		Kit.disc(m, "Crown", 1, 1.6, cf * CFrame.new(0, 0.5, 0), color, Enum.Material.Fabric, { Decor = true })
		Kit.disc(m, "Band", 0.25, 1.65, cf * CFrame.new(0, 0.2, 0), Palette.Black, Enum.Material.Fabric, { Decor = true })
	else -- "Bun"
		Kit.ball(m, "Bun", 1, cf * CFrame.new(0, 0.3, 0.6).Position, color, Enum.Material.Fabric, { Decor = true })
	end
	return m
end

function Props.apron(parent: Instance, color: Color3): BasePart
	return Kit.block(parent, "Apron", Vector3.new(1.7, 1.9, 0.1), CFrame.new(), color, Enum.Material.Fabric, { Decor = true })
end

function Props.fishingRod(parent: Instance): Model
	local m = Kit.model(parent, "FishingRod")
	Kit.block(m, "Rod", Vector3.new(0.12, 0.12, 9), CFrame.new(0, 0, -4.5), rgb(110, 80, 50), Enum.Material.Wood, { Decor = true })
	Kit.block(m, "Line", Vector3.new(0.03, 6, 0.03), CFrame.new(0, -3, -9), rgb(230, 230, 230), Enum.Material.SmoothPlastic, { Decor = true, Transparency = 0.3 })
	Kit.ball(m, "Bobber", 0.4, Vector3.new(0, -6, -9), rgb(220, 50, 50), Enum.Material.SmoothPlastic, { Decor = true })
	return m
end

return Props
