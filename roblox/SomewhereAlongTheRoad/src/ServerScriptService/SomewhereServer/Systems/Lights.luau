--!strict
-- Every switchable light in town: streetlights, the store, the diner's neon, house windows.
-- Fixtures are parts with a "LightGroup" attribute (see World/Kit.fixture).

local Lights = {}

type Fixture = {
	part: BasePart,
	group: string,
	house: string?,
	on: boolean?,
}

local ctx: any
local fixtures: { Fixture } = {}
local switches: { [string]: boolean } = {}
local flickering = false
-- Each house keeps its own hours, re-rolled every day, so windows go dark one by one.
local houseHours: { [string]: { evening: number, bedtime: number, morning: number } } = {}
local rng = Random.new()

local function rollHouseHours()
	for _, f in fixtures do
		if f.house and not houseHours[f.house] then
			houseHours[f.house] = { evening = 0, bedtime = 0, morning = 0 }
		end
	end
	for _, hours in houseHours do
		hours.evening = rng:NextNumber(18.2, 19.6)
		hours.bedtime = rng:NextNumber(21.8, 25.4) -- past 24 means after midnight
		hours.morning = if rng:NextNumber() < 0.6 then rng:NextNumber(5.6, 6.8) else 99
	end
end

local function inWindow(clock: number, from: number, to: number): boolean
	if to > 24 then
		return clock >= from or clock < to - 24
	end
	return clock >= from and clock < to
end

local function wanted(f: Fixture): boolean
	if not ctx.Net.Get("PowerOn") then
		return false
	end
	local clock = ctx.DayNight.GetClock()
	local storm = ctx.Weather.Get().Storm
	local dark = ctx.DayNight.IsDark() or storm > 0.55
	local g = f.group
	if g == "Street" then
		return dark
	elseif g == "StoreInterior" or g == "StoreSign" then
		return ctx.Net.Get("StoreOpen") == true
	elseif g == "StoreFront" then
		return dark
	elseif g == "DinerNeon" then
		return clock >= 16.2 or clock < 1.5 or storm > 0.55
	elseif g == "DinerInterior" then
		return clock >= 5.8 and clock < 23.5
	elseif g == "HouseWindow" or g == "PorchLight" then
		local hours = f.house and houseHours[f.house]
		if not hours then
			return false
		end
		if g == "PorchLight" then
			return inWindow(clock, hours.evening, math.min(hours.bedtime, 24))
		end
		return inWindow(clock, hours.evening, hours.bedtime) or (clock >= hours.morning and clock < hours.morning + 1.2)
	elseif g:sub(1, 14) == "HouseInterior_" then
		return switches[g] ~= false
	end
	return true
end

local function setLook(f: Fixture, on: boolean)
	local part = f.part
	local onColor = part:GetAttribute("OnColor")
	if typeof(onColor) == "Color3" then
		if on then
			part.Material = Enum.Material.Neon
			part.Color = onColor
			part.Transparency = (part:GetAttribute("OnTransparency") :: number?) or (part:GetAttribute("OffTransparency") :: number?) or 0
		else
			local offMaterial = part:GetAttribute("OffMaterial") :: string?
			local mat = offMaterial and (Enum.Material :: any)[offMaterial]
			part.Material = mat or Enum.Material.SmoothPlastic
			part.Color = (part:GetAttribute("OffColor") :: Color3?) or part.Color
			part.Transparency = (part:GetAttribute("OffTransparency") :: number?) or 0
		end
	end
	for _, child in part:GetChildren() do
		if child:IsA("Light") then
			child.Enabled = on
		elseif child:IsA("SurfaceGui") and part:GetAttribute("GuiSign") then
			child.Enabled = on
		end
	end
end

function Lights.Refresh()
	if flickering then
		return
	end
	for _, f in fixtures do
		local on = wanted(f)
		if f.on ~= on then
			f.on = on
			setLook(f, on)
		end
	end
end

function Lights.SetSwitch(group: string, on: boolean)
	switches[group] = on
	Lights.Refresh()
end

function Lights.Toggle(group: string): boolean
	local on = switches[group] == false
	Lights.SetSwitch(group, on)
	return on
end

-- A few seconds of unsteady lights (outages, the rare event).
function Lights.Flicker(seconds: number, groups: { string }?)
	flickering = true
	local stop = os.clock() + seconds
	while os.clock() < stop do
		for _, f in fixtures do
			if f.on and (not groups or table.find(groups, f.group)) and rng:NextNumber() < 0.5 then
				setLook(f, rng:NextNumber() < 0.5)
			end
		end
		task.wait(rng:NextNumber(0.05, 0.18))
	end
	flickering = false
	for _, f in fixtures do
		f.on = nil
	end
	Lights.Refresh()
end

-- Pulses one group in order along X (east to west), like a wave rolling toward the trail.
function Lights.Wave(group: string, delayEach: number)
	local list = {}
	for _, f in fixtures do
		if f.group == group and f.on then
			table.insert(list, f)
		end
	end
	table.sort(list, function(a, b)
		return a.part.CFrame.Position.X > b.part.CFrame.Position.X
	end)
	for _, f in list do
		setLook(f, false)
		task.delay(0.35, function()
			setLook(f, f.on == true)
		end)
		task.wait(delayEach)
	end
end

local function add(part: BasePart)
	local group = part:GetAttribute("LightGroup")
	if typeof(group) ~= "string" then
		return
	end
	local house = part:GetAttribute("House")
	table.insert(fixtures, { part = part, group = group, house = if typeof(house) == "string" then house else nil })
end

function Lights.Init(context: any)
	ctx = context
	for _, d in (ctx.Town :: Instance):GetDescendants() do
		if d:IsA("BasePart") then
			add(d)
		end
	end
	rollHouseHours()
	ctx.DayNight.OnNewDay(function()
		rollHouseHours()
	end)
	local state = game:GetService("ReplicatedStorage"):WaitForChild("SomewhereState")
	state:GetAttributeChangedSignal("PowerOn"):Connect(Lights.Refresh)
	state:GetAttributeChangedSignal("StoreOpen"):Connect(Lights.Refresh)
	task.spawn(function()
		while true do
			Lights.Refresh()
			task.wait(1)
		end
	end)
end

return Lights
