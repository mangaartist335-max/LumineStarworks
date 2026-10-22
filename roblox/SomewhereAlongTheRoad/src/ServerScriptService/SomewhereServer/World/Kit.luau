--!strict
-- Small building blocks for the town: parts, walls with openings, roofs, signs, lights.
-- Runs both in a live server and in the offline place builder, so it only sets CFrame
-- (never Position/Orientation) and never uses PivotTo.

local Kit = {}

-- Deterministic random numbers (Park-Miller). Same seed, same town, everywhere.
export type Rng = {
	state: number,
	next: (self: Rng) -> number,
	range: (self: Rng, a: number, b: number) -> number,
	int: (self: Rng, a: number, b: number) -> number,
	chance: (self: Rng, p: number) -> boolean,
}

local function rngNext(self: Rng): number
	self.state = (self.state * 48271) % 2147483647
	return (self.state - 1) / 2147483646
end

function Kit.rng(seed: number): Rng
	local rng = {
		state = (math.floor(seed) % 2147483646) + 1,
		next = rngNext,
		range = function(self: Rng, a: number, b: number): number
			return a + (b - a) * self:next()
		end,
		int = function(self: Rng, a: number, b: number): number
			return math.min(b, math.floor(a + (b - a + 1) * self:next()))
		end,
		chance = function(self: Rng, p: number): boolean
			return self:next() < p
		end,
	}
	return rng
end

function Kit.pick<T>(rng: Rng, list: { T }): T
	return list[rng:int(1, #list)]
end

export type PartOpts = {
	Class: string?,
	Shape: Enum.PartType?,
	Transparency: number?,
	Reflectance: number?,
	Decor: boolean?, -- purely visual: no collision, no queries, no shadow
	NoCollide: boolean?,
	NoShadow: boolean?,
	NoQuery: boolean?, -- ignored by raycasts (foliage, so rain still falls under trees)
}

function Kit.block(
	parent: Instance,
	name: string,
	size: Vector3,
	cf: CFrame,
	color: Color3,
	material: Enum.Material?,
	opts: PartOpts?
): BasePart
	local o: PartOpts = opts or {}
	local part = Instance.new((o.Class or "Part") :: any) :: BasePart
	part.Name = name
	part.Anchored = true
	if o.Shape and part:IsA("Part") then
		(part :: Part).Shape = o.Shape
	end
	part.Size = size
	part.CFrame = cf
	part.Color = color
	part.Material = material or Enum.Material.SmoothPlastic
	part.TopSurface = Enum.SurfaceType.Smooth
	part.BottomSurface = Enum.SurfaceType.Smooth
	if o.Transparency then
		part.Transparency = o.Transparency
	end
	if o.Reflectance then
		part.Reflectance = o.Reflectance
	end
	if o.Decor then
		part.CanCollide = false
		part.CanQuery = false
		part.CanTouch = false
		part.CastShadow = false
	else
		if o.NoCollide then
			part.CanCollide = false
			part.CanTouch = false
		end
		if o.NoShadow then
			part.CastShadow = false
		end
		if o.NoQuery then
			part.CanQuery = false
		end
	end
	part.Parent = parent
	return part
end

-- Cylinder whose axis runs along the CFrame's X axis.
function Kit.cylinder(
	parent: Instance,
	name: string,
	length: number,
	diameter: number,
	cf: CFrame,
	color: Color3,
	material: Enum.Material?,
	opts: PartOpts?
): BasePart
	local o: PartOpts = table.clone(opts or {})
	o.Shape = Enum.PartType.Cylinder
	return Kit.block(parent, name, Vector3.new(length, diameter, diameter), cf, color, material, o)
end

local UPRIGHT = CFrame.Angles(0, 0, math.pi / 2)

-- Vertical cylinder standing on `base`.
function Kit.post(
	parent: Instance,
	name: string,
	height: number,
	diameter: number,
	base: Vector3,
	color: Color3,
	material: Enum.Material?,
	opts: PartOpts?
): BasePart
	return Kit.cylinder(parent, name, height, diameter, CFrame.new(base + Vector3.new(0, height / 2, 0)) * UPRIGHT, color, material, opts)
end

-- Flat disc (vertical axis) centred at `center`.
function Kit.disc(
	parent: Instance,
	name: string,
	thickness: number,
	diameter: number,
	center: CFrame,
	color: Color3,
	material: Enum.Material?,
	opts: PartOpts?
): BasePart
	return Kit.cylinder(parent, name, thickness, diameter, center * UPRIGHT, color, material, opts)
end

function Kit.ball(
	parent: Instance,
	name: string,
	diameter: number,
	pos: Vector3,
	color: Color3,
	material: Enum.Material?,
	opts: PartOpts?
): BasePart
	local o: PartOpts = table.clone(opts or {})
	o.Shape = Enum.PartType.Ball
	return Kit.block(parent, name, Vector3.new(diameter, diameter, diameter), CFrame.new(pos), color, material, o)
end

function Kit.wedge(
	parent: Instance,
	name: string,
	size: Vector3,
	cf: CFrame,
	color: Color3,
	material: Enum.Material?,
	opts: PartOpts?
): BasePart
	local o: PartOpts = table.clone(opts or {})
	o.Class = "WedgePart"
	return Kit.block(parent, name, size, cf, color, material, o)
end

function Kit.model(parent: Instance, name: string): Model
	local m = Instance.new("Model")
	m.Name = name
	m.Parent = parent
	return m
end

function Kit.folder(parent: Instance, name: string): Folder
	local f = Instance.new("Folder")
	f.Name = name
	f.Parent = parent
	return f
end

function Kit.attrs(inst: Instance, attributes: { [string]: any }): Instance
	for key, value in attributes do
		inst:SetAttribute(key, value)
	end
	return inst
end

-- Marks a part as interactable. Systems/Interactions turns these into ProximityPrompts.
function Kit.interact(part: Instance, kind: string, attributes: { [string]: any }?)
	part:SetAttribute("Interact", kind)
	if attributes then
		Kit.attrs(part, attributes)
	end
end

-- Invisible marker that runtime systems look up by its "Anchor" attribute.
-- Move these around in Studio to re-stage events.
function Kit.anchor(parent: Instance, anchorName: string, cf: CFrame, attributes: { [string]: any }?): BasePart
	local p = Kit.block(parent, anchorName, Vector3.new(1, 1, 1), cf, Color3.new(1, 0, 1), Enum.Material.SmoothPlastic, {
		Decor = true,
		Transparency = 1,
	})
	p:SetAttribute("Anchor", anchorName)
	if attributes then
		Kit.attrs(p, attributes)
	end
	return p
end

export type LabelOpts = {
	Font: Enum.Font?,
	TextColor: Color3?,
	Background: Color3?,
	BackgroundTransparency: number?,
	Glow: boolean?, -- ignores scene lighting, so it reads like a lit sign
	PixelsPerStud: number?,
	Padding: number?,
	Align: Enum.TextXAlignment?,
	Wrapped: boolean?,
	TextSize: number?,
}

function Kit.label(part: BasePart, face: Enum.NormalId, text: string, opts: LabelOpts?): SurfaceGui
	local o: LabelOpts = opts or {}
	local gui = Instance.new("SurfaceGui")
	gui.Name = "Label"
	gui.Face = face
	gui.SizingMode = Enum.SurfaceGuiSizingMode.PixelsPerStud
	gui.PixelsPerStud = o.PixelsPerStud or 40
	gui.LightInfluence = if o.Glow then 0 else 1
	gui.MaxDistance = 260
	gui.Parent = part

	local label = Instance.new("TextLabel")
	label.Name = "Text"
	label.Size = UDim2.fromScale(1, 1)
	label.BackgroundColor3 = o.Background or Color3.new(1, 1, 1)
	label.BackgroundTransparency = if o.Background then (o.BackgroundTransparency or 0) else 1
	label.BorderSizePixel = 0
	label.FontFace = Font.fromEnum(o.Font or Enum.Font.Oswald)
	label.TextColor3 = o.TextColor or Color3.new(1, 1, 1)
	label.Text = text
	if o.TextSize then
		label.TextScaled = false
		label.TextSize = o.TextSize
	else
		label.TextScaled = true
	end
	label.TextWrapped = o.Wrapped ~= false
	label.TextXAlignment = o.Align or Enum.TextXAlignment.Center
	label.Parent = gui

	local pad = o.Padding or 0
	if pad > 0 then
		local padding = Instance.new("UIPadding")
		padding.PaddingTop = UDim.new(0, pad)
		padding.PaddingBottom = UDim.new(0, pad)
		padding.PaddingLeft = UDim.new(0, pad)
		padding.PaddingRight = UDim.new(0, pad)
		padding.Parent = label
	end
	return gui
end

export type LightOpts = {
	Color: Color3?,
	Range: number?,
	Brightness: number?,
	Angle: number?,
	Face: Enum.NormalId?,
	Shadows: boolean?,
}

function Kit.light(part: BasePart, className: string, opts: LightOpts?): Light
	local o: LightOpts = opts or {}
	local light = Instance.new(className :: any) :: Light
	light.Color = o.Color or Color3.fromRGB(255, 214, 160)
	light.Brightness = o.Brightness or 1
	light.Shadows = o.Shadows == true
	if light:IsA("PointLight") then
		light.Range = o.Range or 16
	elseif light:IsA("SpotLight") then
		light.Range = o.Range or 24
		light.Angle = o.Angle or 90
		light.Face = o.Face or Enum.NormalId.Bottom
	elseif light:IsA("SurfaceLight") then
		light.Range = o.Range or 16
		light.Angle = o.Angle or 90
		light.Face = o.Face or Enum.NormalId.Bottom
	end
	light.Parent = part
	return light
end

-- Tags a fixture so Systems/Lights can switch it. `on`/`off` describe the bulb's look.
function Kit.fixture(part: BasePart, group: string, onColor: Color3, offColor: Color3, offMaterial: Enum.Material?, extra: { [string]: any }?)
	part:SetAttribute("LightGroup", group)
	part:SetAttribute("OnColor", onColor)
	part:SetAttribute("OffColor", offColor)
	part:SetAttribute("OffMaterial", (offMaterial or Enum.Material.SmoothPlastic).Name)
	part:SetAttribute("OffTransparency", part.Transparency)
	if extra then
		Kit.attrs(part, extra)
	end
end

export type Opening = {
	At: number, -- centre of the opening, measured from the wall's centre along the wall
	Width: number,
	Bottom: number,
	Top: number,
}

-- A straight wall from local point `a` to `b` (relative to `origin`), with rectangular holes.
-- The wall's local +Z is dir x up, so callers pick a->b so that +Z faces inward.
-- Returns one CFrame per opening (its centre, same orientation as the wall).
function Kit.wall(
	parent: Instance,
	name: string,
	origin: CFrame,
	a: Vector3,
	b: Vector3,
	height: number,
	thickness: number,
	color: Color3,
	material: Enum.Material,
	openings: { Opening }?
): { CFrame }
	local delta = b - a
	local length = delta.Magnitude
	local dir = delta.Unit
	local mid = (a + b) / 2
	local wallCF = origin * CFrame.fromMatrix(Vector3.new(mid.X, a.Y, mid.Z), dir, Vector3.yAxis)

	local function segment(x0: number, x1: number, y0: number, y1: number)
		if x1 - x0 < 0.05 or y1 - y0 < 0.05 then
			return
		end
		Kit.block(
			parent,
			name,
			Vector3.new(x1 - x0, y1 - y0, thickness),
			wallCF * CFrame.new((x0 + x1) / 2 - length / 2, (y0 + y1) / 2, 0),
			color,
			material
		)
	end

	local sorted: { Opening } = table.clone(openings or {})
	table.sort(sorted, function(p, q)
		return p.At < q.At
	end)

	local frames = {}
	local cursor = 0
	for _, op in sorted do
		local left = op.At - op.Width / 2 + length / 2
		local right = op.At + op.Width / 2 + length / 2
		segment(cursor, left, 0, height)
		segment(left, right, 0, op.Bottom)
		segment(left, right, op.Top, height)
		cursor = right
		table.insert(frames, wallCF * CFrame.new(op.At, (op.Bottom + op.Top) / 2, 0))
	end
	segment(cursor, length, 0, height)
	return frames
end

export type WindowOpts = {
	Frame: Color3?,
	Curtain: Color3?, -- adds a curtain just inside the glass (hides empty interiors)
	LightGroup: string?, -- the curtain glows warm at night
	Extra: { [string]: any }?,
	Sill: boolean?,
	Mullion: boolean?,
}

-- Fills an opening with glass and trim. `cf` is an opening frame from Kit.wall (+Z = inside).
function Kit.window(parent: Instance, cf: CFrame, width: number, height: number, wallThickness: number, opts: WindowOpts?): BasePart
	local o: WindowOpts = opts or {}
	local frameColor = o.Frame or Color3.fromRGB(240, 236, 226)
	local glass = Kit.block(parent, "Glass", Vector3.new(width, height, 0.2), cf, Color3.fromRGB(176, 196, 206), Enum.Material.Glass, {
		Transparency = 0.45,
		NoShadow = true,
	})
	local t = 0.35
	local out = -wallThickness / 2 - 0.05
	Kit.block(parent, "Trim", Vector3.new(width + t * 2, t, 0.3), cf * CFrame.new(0, height / 2 + t / 2, out), frameColor, Enum.Material.SmoothPlastic, { Decor = true })
	Kit.block(parent, "Trim", Vector3.new(t, height, 0.3), cf * CFrame.new(-width / 2 - t / 2, 0, out), frameColor, Enum.Material.SmoothPlastic, { Decor = true })
	Kit.block(parent, "Trim", Vector3.new(t, height, 0.3), cf * CFrame.new(width / 2 + t / 2, 0, out), frameColor, Enum.Material.SmoothPlastic, { Decor = true })
	if o.Sill ~= false then
		Kit.block(parent, "Sill", Vector3.new(width + 0.9, 0.3, 0.8), cf * CFrame.new(0, -height / 2 - 0.15, out - 0.2), frameColor, Enum.Material.SmoothPlastic, { Decor = true })
	end
	if o.Mullion then
		Kit.block(parent, "Mullion", Vector3.new(0.2, height, 0.25), cf, frameColor, Enum.Material.SmoothPlastic, { Decor = true })
		Kit.block(parent, "Mullion", Vector3.new(width, 0.2, 0.25), cf, frameColor, Enum.Material.SmoothPlastic, { Decor = true })
	end
	if o.Curtain then
		local curtain = Kit.block(
			parent,
			"Curtain",
			Vector3.new(width, height, 0.15),
			cf * CFrame.new(0, 0, wallThickness / 2 + 0.1),
			o.Curtain,
			Enum.Material.Fabric,
			{ Decor = true }
		)
		if o.LightGroup then
			Kit.fixture(curtain, o.LightGroup, Color3.fromRGB(236, 170, 104), o.Curtain, Enum.Material.Fabric, o.Extra)
		end
	end
	return glass
end

-- Gable roof over a W x D footprint whose walls are `wallH` tall. Ridge runs along local X.
function Kit.gableRoof(
	parent: Instance,
	origin: CFrame,
	width: number,
	depth: number,
	wallH: number,
	rise: number,
	overhang: number,
	gableColor: Color3,
	gableMaterial: Enum.Material,
	roofColor: Color3,
	roofMaterial: Enum.Material
)
	local half = depth / 2
	-- Gable ends: two wedges in siding colour fill the triangle under the roof.
	Kit.wedge(parent, "Gable", Vector3.new(width, rise, half), origin * CFrame.new(0, wallH + rise / 2, -half / 2), gableColor, gableMaterial)
	Kit.wedge(
		parent,
		"Gable",
		Vector3.new(width, rise, half),
		origin * CFrame.new(0, wallH + rise / 2, half / 2) * CFrame.Angles(0, math.pi, 0),
		gableColor,
		gableMaterial
	)
	local theta = math.atan2(rise, half)
	local run = half + overhang
	local slope = run / math.cos(theta)
	local thick = 0.7
	local ridge = origin * CFrame.new(0, wallH + rise, 0)
	local w = width + overhang * 2
	Kit.block(parent, "Roof", Vector3.new(w, thick, slope), ridge * CFrame.Angles(-theta, 0, 0) * CFrame.new(0, thick / 2, -slope / 2), roofColor, roofMaterial)
	Kit.block(parent, "Roof", Vector3.new(w, thick, slope), ridge * CFrame.Angles(theta, 0, 0) * CFrame.new(0, thick / 2, slope / 2), roofColor, roofMaterial)
	Kit.block(parent, "Ridge", Vector3.new(w, 0.6, 1.1), ridge * CFrame.new(0, thick * 0.9, 0), roofColor:Lerp(Color3.new(0, 0, 0), 0.25), roofMaterial, { NoShadow = true })
end

-- A simple bench, used at the bus stop, the lookout and on porches.
function Kit.bench(parent: Instance, cf: CFrame, length: number, woodColor: Color3, metalColor: Color3): BasePart
	local seat = Kit.block(parent, "BenchSeat", Vector3.new(length, 0.4, 1.8), cf * CFrame.new(0, 1.9, 0), woodColor, Enum.Material.Wood, { Class = "Seat" })
	Kit.block(parent, "BenchBack", Vector3.new(length, 1.6, 0.3), cf * CFrame.new(0, 3.1, 0.85) * CFrame.Angles(math.rad(-10), 0, 0), woodColor, Enum.Material.Wood)
	for _, x in { -length / 2 + 0.5, length / 2 - 0.5 } do
		Kit.block(parent, "BenchLeg", Vector3.new(0.3, 1.9, 1.6), cf * CFrame.new(x, 0.95, 0), metalColor, Enum.Material.Metal, { NoShadow = true })
		Kit.block(parent, "BenchArm", Vector3.new(0.3, 1.3, 0.3), cf * CFrame.new(x, 2.6, 0.75), metalColor, Enum.Material.Metal, { Decor = true })
	end
	return seat
end

return Kit
