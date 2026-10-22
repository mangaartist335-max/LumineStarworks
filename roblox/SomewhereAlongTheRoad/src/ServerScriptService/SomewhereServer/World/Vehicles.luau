--!strict
-- Vehicles made of plain parts. Every builder returns a Model whose PrimaryPart ("Root")
-- sits at ground level under the vehicle's centre, with the front of the vehicle facing -Z.
-- Everything is anchored; Events/Motion turns a model into a smoothly driven assembly.

local Kit = require(script.Parent.Kit)
local Palette = require(script.Parent.Palette)

local Vehicles = {}

local rgb = Color3.fromRGB

local function root(model: Model, cf: CFrame): BasePart
	local r = Kit.block(model, "Root", Vector3.new(2, 1, 2), cf * CFrame.new(0, 0.5, 0), Color3.new(1, 1, 1), Enum.Material.SmoothPlastic, {
		Transparency = 1,
		Decor = true,
	})
	model.PrimaryPart = r
	return r
end

local function wheels(model: Model, cf: CFrame, xs: { number }, zs: { number }, diameter: number, width: number)
	for _, x in xs do
		for _, z in zs do
			Kit.cylinder(model, "Wheel", width, diameter, cf * CFrame.new(x, diameter / 2, z), rgb(34, 34, 36), Enum.Material.Rubber, { NoShadow = true })
			Kit.cylinder(model, "Hubcap", width + 0.1, diameter * 0.45, cf * CFrame.new(x, diameter / 2, z), Palette.Chrome, Enum.Material.Metal, { Decor = true })
		end
	end
end

local function lights(model: Model, cf: CFrame, halfWidth: number, y: number, frontZ: number, backZ: number)
	for _, s in { -1, 1 } do
		Kit.block(model, "Headlight", Vector3.new(1, 0.6, 0.2), cf * CFrame.new(s * (halfWidth - 0.8), y, frontZ), rgb(255, 248, 220), Enum.Material.Neon, { Decor = true })
		Kit.block(model, "Taillight", Vector3.new(0.9, 0.5, 0.2), cf * CFrame.new(s * (halfWidth - 0.7), y, backZ), rgb(200, 40, 40), Enum.Material.Neon, { Decor = true })
	end
end

-- A simple seated figure for drivers (no rig, just a friendly silhouette).
function Vehicles.driver(model: Instance, cf: CFrame, shirt: Color3, skin: Color3?, hat: Color3?)
	local s = skin or rgb(234, 192, 160)
	Kit.block(model, "DriverBody", Vector3.new(1.8, 2, 1), cf * CFrame.new(0, 1, 0), shirt, Enum.Material.Fabric, { Decor = true })
	Kit.ball(model, "DriverHead", 1.3, (cf * CFrame.new(0, 2.7, 0)).Position, s, Enum.Material.SmoothPlastic, { Decor = true })
	if hat then
		Kit.disc(model, "DriverHat", 0.2, 1.9, cf * CFrame.new(0, 3.25, 0), hat, Enum.Material.Fabric, { Decor = true })
		Kit.disc(model, "DriverHatTop", 0.6, 1.2, cf * CFrame.new(0, 3.5, 0), hat, Enum.Material.Fabric, { Decor = true })
	end
end

function Vehicles.car(parent: Instance, cf: CFrame, color: Color3): Model
	local m = Kit.model(parent, "Car")
	root(m, cf)
	Kit.block(m, "Body", Vector3.new(6, 2.2, 12.5), cf * CFrame.new(0, 2.1, 0), color, Enum.Material.SmoothPlastic)
	Kit.block(m, "Cabin", Vector3.new(5.4, 2, 6.2), cf * CFrame.new(0, 4.2, 0.8), rgb(120, 140, 150), Enum.Material.Glass, { Transparency = 0.2 })
	Kit.block(m, "CabinRoof", Vector3.new(5.6, 0.3, 5.4), cf * CFrame.new(0, 5.3, 0.9), color, Enum.Material.SmoothPlastic)
	for _, s in { -1, 1 } do
		Kit.block(m, "Pillar", Vector3.new(0.3, 2, 0.4), cf * CFrame.new(s * 2.65, 4.2, -2.2), color, Enum.Material.SmoothPlastic, { Decor = true })
	end
	Kit.block(m, "Bumper", Vector3.new(6.2, 0.6, 0.5), cf * CFrame.new(0, 1.2, -6.3), Palette.Chrome, Enum.Material.Metal, { Decor = true })
	Kit.block(m, "Bumper", Vector3.new(6.2, 0.6, 0.5), cf * CFrame.new(0, 1.2, 6.3), Palette.Chrome, Enum.Material.Metal, { Decor = true })
	wheels(m, cf, { -2.8, 2.8 }, { -3.9, 4.1 }, 2.4, 0.9)
	lights(m, cf, 3, 2.4, -6.27, 6.27)
	return m
end

function Vehicles.pickup(parent: Instance, cf: CFrame, color: Color3, rusty: boolean?): Model
	local m = Kit.model(parent, "Pickup")
	root(m, cf)
	local mat = if rusty then Enum.Material.CorrodedMetal else Enum.Material.SmoothPlastic
	Kit.block(m, "Hood", Vector3.new(6, 2.4, 4.6), cf * CFrame.new(0, 2.4, -5), color, mat)
	Kit.block(m, "Cab", Vector3.new(6, 4.4, 4), cf * CFrame.new(0, 3.4, -0.9), color, mat)
	Kit.block(m, "Windshield", Vector3.new(5.2, 1.8, 0.2), cf * CFrame.new(0, 4.5, -2.95), rgb(120, 140, 150), Enum.Material.Glass, { Transparency = 0.3, Decor = true })
	Kit.block(m, "BedFloor", Vector3.new(6, 1.4, 7), cf * CFrame.new(0, 1.9, 4.6), color, mat)
	for _, s in { -1, 1 } do
		Kit.block(m, "BedSide", Vector3.new(0.4, 1.6, 7), cf * CFrame.new(s * 2.8, 3.4, 4.6), color, mat)
	end
	Kit.block(m, "Tailgate", Vector3.new(6, 1.6, 0.4), cf * CFrame.new(0, 3.4, 7.9), color, mat)
	Kit.block(m, "Grille", Vector3.new(4.4, 1.2, 0.2), cf * CFrame.new(0, 2.4, -7.35), Palette.Chrome, Enum.Material.Metal, { Decor = true })
	wheels(m, cf, { -2.8, 2.8 }, { -4.8, 4.6 }, 2.6, 1)
	return m
end

function Vehicles.iceCreamTruck(parent: Instance, cf: CFrame): Model
	local m = Kit.model(parent, "IceCreamTruck")
	root(m, cf)
	local pink, mint, cream = rgb(246, 196, 206), rgb(170, 226, 206), rgb(252, 244, 228)
	Kit.block(m, "Cab", Vector3.new(6.6, 5.4, 4.4), cf * CFrame.new(0, 3.6, -6.2), cream, Enum.Material.SmoothPlastic)
	Kit.block(m, "Windshield", Vector3.new(5.8, 2, 0.2), cf * CFrame.new(0, 5, -8.42), rgb(120, 140, 150), Enum.Material.Glass, { Transparency = 0.3, Decor = true })
	Kit.block(m, "Box", Vector3.new(7, 7.6, 11), cf * CFrame.new(0, 4.9, 1.6), pink, Enum.Material.SmoothPlastic)
	Kit.block(m, "Stripe", Vector3.new(7.1, 1, 11.1), cf * CFrame.new(0, 3, 1.6), mint, Enum.Material.SmoothPlastic, { Decor = true })
	local window = Kit.block(m, "ServingWindow", Vector3.new(0.2, 2.6, 5), cf * CFrame.new(3.55, 5.6, 1.6), rgb(60, 50, 56), Enum.Material.SmoothPlastic, { Decor = true })
	Kit.label(window, Enum.NormalId.Right, "ICE CREAM", { Font = Enum.Font.FredokaOne, TextColor = cream, Padding = 6 })
	Kit.block(m, "Awning", Vector3.new(1.6, 0.2, 5.6), cf * CFrame.new(4.2, 7.2, 1.6) * CFrame.Angles(0, 0, math.rad(-15)), mint, Enum.Material.Fabric, { Decor = true })
	-- The big cone on the roof.
	local top = cf * CFrame.new(0, 8.7, 2.5)
	Kit.disc(m, "Cone", 1.2, 2.4, top * CFrame.new(0, 0.6, 0), rgb(214, 170, 110), Enum.Material.WoodPlanks, { Decor = true })
	Kit.disc(m, "Cone", 1.2, 1.6, top * CFrame.new(0, -0.4, 0), rgb(214, 170, 110), Enum.Material.WoodPlanks, { Decor = true })
	Kit.ball(m, "Scoop", 3, (top * CFrame.new(0, 2.2, 0)).Position, pink, Enum.Material.SmoothPlastic, { Decor = true })
	Kit.ball(m, "Scoop", 2.4, (top * CFrame.new(0, 3.9, 0)).Position, mint, Enum.Material.SmoothPlastic, { Decor = true })
	Kit.ball(m, "Cherry", 0.7, (top * CFrame.new(0, 5.2, 0)).Position, rgb(200, 30, 40), Enum.Material.SmoothPlastic, { Decor = true })
	wheels(m, cf, { -3, 3 }, { -5.6, 4.6 }, 2.6, 1)
	lights(m, cf, 3.3, 2.2, -8.42, 7.12)
	Vehicles.driver(m, cf * CFrame.new(-1.4, 2.4, -6.2), rgb(240, 240, 236), nil, rgb(240, 240, 236))
	return m
end

function Vehicles.duckTruck(parent: Instance, cf: CFrame): Model
	local m = Kit.model(parent, "DuckTruck")
	root(m, cf)
	local blue = rgb(70, 110, 160)
	Kit.block(m, "Cab", Vector3.new(7, 6, 5.4), cf * CFrame.new(0, 4.2, -11), blue, Enum.Material.SmoothPlastic)
	Kit.block(m, "Windshield", Vector3.new(6.2, 2.2, 0.2), cf * CFrame.new(0, 5.6, -13.75), rgb(120, 140, 150), Enum.Material.Glass, { Transparency = 0.3, Decor = true })
	Kit.block(m, "Flatbed", Vector3.new(7.4, 1.2, 20), cf * CFrame.new(0, 2.6, 2.4), Palette.MetalDark, Enum.Material.DiamondPlate)
	local yellow, orange = rgb(250, 214, 60), rgb(240, 140, 40)
	Kit.ball(m, "DuckBody", 13, (cf * CFrame.new(0, 9.4, 4)).Position, yellow, Enum.Material.SmoothPlastic)
	Kit.ball(m, "DuckHead", 8.4, (cf * CFrame.new(0, 17.6, -0.6)).Position, yellow, Enum.Material.SmoothPlastic)
	Kit.ball(m, "DuckTail", 5, (cf * CFrame.new(0, 12.4, 10)).Position, yellow, Enum.Material.SmoothPlastic, { Decor = true })
	Kit.block(m, "DuckBeak", Vector3.new(4, 1.2, 3.6), cf * CFrame.new(0, 16.8, -5.4), orange, Enum.Material.SmoothPlastic, { Decor = true })
	for _, s in { -1, 1 } do
		Kit.ball(m, "DuckEye", 1.3, (cf * CFrame.new(s * 2.4, 19, -3.6)).Position, Palette.Black, Enum.Material.SmoothPlastic, { Decor = true })
		Kit.block(m, "Strap", Vector3.new(0.3, 0.2, 14), cf * CFrame.new(s * 3.5, 3.3, 4), rgb(240, 140, 40), Enum.Material.Fabric, { Decor = true })
	end
	wheels(m, cf, { -3.2, 3.2 }, { -10.6, 6, 10 }, 3, 1.1)
	lights(m, cf, 3.5, 2.6, -13.75, 12.45)
	Vehicles.driver(m, cf * CFrame.new(-1.6, 3, -11), rgb(200, 90, 60))
	return m
end

function Vehicles.tractorAndWagon(parent: Instance, cf: CFrame): Model
	local m = Kit.model(parent, "TractorAndWagon")
	root(m, cf)
	local green, yellow = rgb(70, 130, 70), rgb(236, 196, 60)
	Kit.block(m, "Engine", Vector3.new(3.6, 3.4, 6), cf * CFrame.new(0, 3.6, -4), green, Enum.Material.SmoothPlastic)
	Kit.block(m, "Seat", Vector3.new(3, 0.6, 2.4), cf * CFrame.new(0, 4.4, 0.8), Palette.Black, Enum.Material.Leather, { Decor = true })
	Kit.post(m, "Exhaust", 3.4, 0.5, (cf * CFrame.new(1, 5.3, -5.6)).Position, Palette.MetalDark, Enum.Material.Metal, { Decor = true })
	Kit.cylinder(m, "BigWheel", 1.6, 5.6, cf * CFrame.new(-2.8, 2.8, 0.8), rgb(34, 34, 36), Enum.Material.Rubber, { NoShadow = true })
	Kit.cylinder(m, "BigWheel", 1.6, 5.6, cf * CFrame.new(2.8, 2.8, 0.8), rgb(34, 34, 36), Enum.Material.Rubber, { NoShadow = true })
	Kit.cylinder(m, "Rim", 1.7, 3, cf * CFrame.new(-2.8, 2.8, 0.8), yellow, Enum.Material.Metal, { Decor = true })
	Kit.cylinder(m, "Rim", 1.7, 3, cf * CFrame.new(2.8, 2.8, 0.8), yellow, Enum.Material.Metal, { Decor = true })
	wheels(m, cf, { -2, 2 }, { -6 }, 2.4, 0.9)
	Vehicles.driver(m, cf * CFrame.new(0, 4.4, 0.8), rgb(110, 140, 190), nil, rgb(220, 200, 150))
	-- Hitch and the hay wagon.
	Kit.block(m, "Hitch", Vector3.new(0.4, 0.4, 5), cf * CFrame.new(0, 1.6, 5), Palette.MetalDark, Enum.Material.Metal, { Decor = true })
	Kit.block(m, "Wagon", Vector3.new(7, 0.8, 14), cf * CFrame.new(0, 2.4, 14.5), Palette.WoodLight, Enum.Material.WoodPlanks)
	wheels(m, cf, { -3, 3 }, { 9.5, 19.5 }, 2.4, 0.8)
	local hay = rgb(222, 194, 110)
	for i = 0, 2 do
		for _, s in { -1, 1 } do
			Kit.block(m, "HayBale", Vector3.new(3.2, 2.2, 4), cf * CFrame.new(s * 1.7, 3.9, 9.8 + i * 4.5), hay, Enum.Material.Grass)
		end
	end
	Kit.block(m, "HayBale", Vector3.new(3.2, 2.2, 4), cf * CFrame.new(0, 6.1, 14.3), hay, Enum.Material.Grass)
	return m
end

function Vehicles.bus(parent: Instance, cf: CFrame): Model
	local m = Kit.model(parent, "Bus")
	root(m, cf)
	local body, stripe = rgb(236, 232, 220), rgb(60, 110, 150)
	Kit.block(m, "Body", Vector3.new(8.4, 8.6, 32), cf * CFrame.new(0, 5.9, 0), body, Enum.Material.SmoothPlastic)
	Kit.block(m, "Stripe", Vector3.new(8.5, 1.2, 32.1), cf * CFrame.new(0, 3.4, 0), stripe, Enum.Material.SmoothPlastic, { Decor = true })
	for _, s in { -1, 1 } do
		Kit.block(m, "Windows", Vector3.new(0.2, 2.6, 26), cf * CFrame.new(s * 4.25, 7.4, 1.6), rgb(90, 110, 120), Enum.Material.Glass, { Transparency = 0.1, Decor = true })
	end
	Kit.block(m, "Windshield", Vector3.new(7.6, 3.4, 0.2), cf * CFrame.new(0, 7, -16.05), rgb(90, 110, 120), Enum.Material.Glass, { Transparency = 0.1, Decor = true })
	local sign = Kit.block(m, "RouteSign", Vector3.new(4.6, 1, 0.2), cf * CFrame.new(0, 9.5, -16.1), rgb(20, 20, 24), Enum.Material.SmoothPlastic, { Decor = true })
	Kit.label(sign, Enum.NormalId.Front, "9  HALFWAY", { Font = Enum.Font.Arcade, TextColor = rgb(255, 190, 80), Glow = true, Padding = 2 })
	Kit.block(m, "Door", Vector3.new(0.2, 6, 3.4), cf * CFrame.new(4.25, 4.6, -12.6), rgb(90, 110, 120), Enum.Material.Glass, { Transparency = 0.2, Decor = true })
	wheels(m, cf, { -3.8, 3.8 }, { -10.5, 10 }, 3, 1.1)
	lights(m, cf, 4.2, 2.6, -16.05, 16.05)
	return m
end

return Vehicles
