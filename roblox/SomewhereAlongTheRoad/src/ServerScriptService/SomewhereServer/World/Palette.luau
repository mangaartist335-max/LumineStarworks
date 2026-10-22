--!strict
-- The town's colours. Muted, warm, a little faded by the sun.

local rgb = Color3.fromRGB

return {
	Asphalt = rgb(62, 63, 67),
	LotAsphalt = rgb(78, 79, 82),
	RoadYellow = rgb(226, 188, 72),
	RoadWhite = rgb(232, 230, 222),
	Concrete = rgb(190, 186, 176),
	Curb = rgb(214, 210, 200),
	Driveway = rgb(172, 168, 160),

	Wood = rgb(128, 92, 64),
	WoodLight = rgb(176, 138, 98),
	WoodDark = rgb(86, 62, 46),
	Metal = rgb(120, 124, 128),
	MetalDark = rgb(64, 66, 70),
	Chrome = rgb(206, 210, 214),
	White = rgb(244, 242, 236),
	Cream = rgb(240, 228, 200),
	Black = rgb(34, 34, 38),

	Bark = rgb(96, 74, 56),
	BarkDark = rgb(72, 56, 44),
	Leaves = { rgb(86, 122, 64), rgb(104, 138, 72), rgb(122, 150, 78), rgb(78, 110, 62), rgb(138, 156, 84) },
	Pines = { rgb(52, 84, 62), rgb(60, 94, 68), rgb(46, 76, 58) },
	Bush = { rgb(92, 128, 70), rgb(108, 140, 76), rgb(80, 116, 66) },
	Rock = { rgb(132, 130, 124), rgb(118, 116, 112), rgb(146, 142, 134) },
	Flowers = { rgb(232, 196, 70), rgb(226, 120, 126), rgb(244, 240, 232), rgb(170, 140, 214), rgb(240, 150, 80) },

	StoreGreen = rgb(54, 96, 80),
	StoreWall = rgb(222, 214, 196),
	StoreBrick = rgb(150, 92, 72),
	DinerRed = rgb(178, 54, 52),
	DinerSteel = rgb(196, 200, 204),
	DinerCream = rgb(242, 232, 208),
	Neon = rgb(255, 120, 110),
	NeonTeal = rgb(110, 236, 220),

	WarmLight = rgb(255, 212, 160),
	StreetLight = rgb(255, 200, 140),
	CoolLight = rgb(236, 244, 255),
}
