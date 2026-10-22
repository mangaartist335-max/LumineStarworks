--!strict
-- Where everything is. One stud is roughly 28 cm; a person is about 5.5 studs tall.
-- The main road runs east-west along Z = 0. North is -Z (store side), south is +Z (diner side).

local Layout = {}

Layout.Ground = { MinX = -600, MaxX = 600, MinZ = -380, MaxZ = 540, Depth = 12 }
Layout.Bounds = { MinX = -540, MaxX = 540, MinZ = -330, MaxZ = 470 }

Layout.Road = { Z = 0, Width = 26, MinX = -600, MaxX = 600, Top = 0.2, LaneOffset = 6.5 }
Layout.Sidewalk = { Width = 8, Top = 0.55, MinX = -104, MaxX = 192 }

-- Facing helpers: buildings on the north side face +Z (toward the road).
local FACE_SOUTH = CFrame.Angles(0, math.pi, 0)

Layout.Store = {
	Origin = CFrame.new(-50, 0, -78) * FACE_SOUTH,
	Width = 44,
	Depth = 32,
	Height = 14,
}

Layout.ParkingLot = { MinX = -104, MaxX = -2, MinZ = -62, MaxZ = -21 }

Layout.Diner = {
	Origin = CFrame.new(40, 0, 56),
	Width = 52,
	Depth = 28,
	Height = 13,
}

Layout.DinerLot = { MinX = 6, MaxX = 92, MinZ = 21, MaxZ = 42 }

export type HouseSpec = {
	Id: string,
	Origin: CFrame,
	Width: number,
	Depth: number,
	Siding: Color3,
	Trim: Color3,
	Roof: Color3,
	Door: Color3,
	Curtain: Color3,
	Open: boolean?,
	Chimney: boolean?,
}

Layout.Houses = {
	{
		Id = "N1",
		Origin = CFrame.new(40, 0, -64) * FACE_SOUTH,
		Width = 24,
		Depth = 20,
		Siding = Color3.fromRGB(176, 196, 178), -- sage
		Trim = Color3.fromRGB(246, 242, 232),
		Roof = Color3.fromRGB(74, 70, 72),
		Door = Color3.fromRGB(122, 74, 58),
		Curtain = Color3.fromRGB(238, 226, 200),
		Chimney = true,
	},
	{
		Id = "N2",
		Origin = CFrame.new(90, 0, -62) * FACE_SOUTH,
		Width = 26,
		Depth = 20,
		Siding = Color3.fromRGB(162, 184, 206), -- dusty blue
		Trim = Color3.fromRGB(250, 248, 240),
		Roof = Color3.fromRGB(92, 84, 80),
		Door = Color3.fromRGB(184, 64, 58),
		Curtain = Color3.fromRGB(246, 236, 214),
	},
	{
		Id = "N3",
		Origin = CFrame.new(142, 0, -64) * FACE_SOUTH,
		Width = 24,
		Depth = 20,
		Siding = Color3.fromRGB(214, 200, 182), -- warm sand
		Trim = Color3.fromRGB(110, 86, 66),
		Roof = Color3.fromRGB(108, 66, 54),
		Door = Color3.fromRGB(70, 92, 76),
		Curtain = Color3.fromRGB(232, 214, 190),
		Chimney = true,
	},
	{
		Id = "S1", -- Hollis's yellow house, the one with the open door
		Origin = CFrame.new(114, 0, 60),
		Width = 28,
		Depth = 22,
		Siding = Color3.fromRGB(238, 214, 140),
		Trim = Color3.fromRGB(252, 250, 244),
		Roof = Color3.fromRGB(86, 96, 108),
		Door = Color3.fromRGB(86, 128, 150),
		Curtain = Color3.fromRGB(250, 240, 220),
		Open = true,
	},
	{
		Id = "S2",
		Origin = CFrame.new(166, 0, 58),
		Width = 24,
		Depth = 20,
		Siding = Color3.fromRGB(240, 238, 232), -- white with a red door
		Trim = Color3.fromRGB(70, 74, 80),
		Roof = Color3.fromRGB(60, 62, 68),
		Door = Color3.fromRGB(176, 52, 50),
		Curtain = Color3.fromRGB(236, 222, 206),
		Chimney = true,
	},
} :: { HouseSpec }

Layout.BusStop = { Center = Vector3.new(-30, 0, 26) }
Layout.SpawnPoint = CFrame.new(-16, 0.6, 18) -- faces north, toward the store across the road

Layout.StreetlightsX = { -92, -52, -12, 28, 68, 108, 148, 188 }
Layout.PowerPoleSpacing = 72
Layout.PowerPoleZ = -24

-- The dirt trail into the woods: road -> old oak -> creek bridge -> lookout hill.
Layout.TrailPoints = {
	Vector3.new(-112, 0, 14),
	Vector3.new(-114, 0, 50),
	Vector3.new(-106, 0, 84),
	Vector3.new(-112, 0, 118),
	Vector3.new(-132, 0, 148),
	Vector3.new(-150, 0, 172),
	Vector3.new(-150, 0, 192),
	Vector3.new(-158, 0, 222),
	Vector3.new(-152, 0, 256),
	Vector3.new(-150, 0, 290),
	Vector3.new(-150, 0, 330),
}
Layout.ClearingSpur = {
	Vector3.new(-158, 0, 222),
	Vector3.new(-180, 0, 232),
	Vector3.new(-206, 0, 240),
}

Layout.Creek = { Z = 182, Amplitude = 9, Wavelength = 38, MinX = -560, MaxX = 140, Width = 12, Depth = 5 }
Layout.Bridge = { X = -150, Z = 182, Length = 26, Width = 7 }
Layout.Hill = { Center = Vector3.new(-150, 0, 362), Radius = 112, Height = 30 }
Layout.Lookout = Vector3.new(-150, 0, 344)
Layout.Clearing = { Center = Vector3.new(-210, 0, 242), Radius = 22 }
Layout.OldOak = Vector3.new(-98, 0, 120)
Layout.SunflowerTruck = CFrame.new(236, 0, -92) * CFrame.Angles(0, math.rad(-28), 0)

-- Where unexpected things can turn up along the shoulder.
Layout.RoadsideSpots = {
	CFrame.new(-196, 0, 19) * CFrame.Angles(0, math.rad(20), 0),
	CFrame.new(-268, 0, -19) * CFrame.Angles(0, math.rad(200), 0),
	CFrame.new(236, 0, 19) * CFrame.Angles(0, math.rad(-15), 0),
	CFrame.new(300, 0, -19) * CFrame.Angles(0, math.rad(170), 0),
	CFrame.new(-150, 0, -19) * CFrame.Angles(0, math.rad(190), 0),
}

-- Places in the woods where something might rustle.
Layout.WoodsSpots = {
	Vector3.new(-64, 0, 150),
	Vector3.new(-236, 0, 128),
	Vector3.new(30, 0, 150),
	Vector3.new(-250, 0, -160),
	Vector3.new(120, 0, -166),
}

return Layout
