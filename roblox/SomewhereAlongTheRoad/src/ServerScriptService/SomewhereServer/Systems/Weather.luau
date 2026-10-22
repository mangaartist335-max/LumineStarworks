--!strict
-- Weather drifts on its own (clear, cloudy, the odd drizzle, morning fog).
-- Events can push an override (a storm, a clear sky for the sunset) and release it later.

local RunService = game:GetService("RunService")

local Weather = {}

export type Mix = { Cloud: number, Rain: number, Storm: number, Fog: number, Wind: number }

local STATES: { [string]: Mix } = {
	Clear = { Cloud = 0.12, Rain = 0, Storm = 0, Fog = 0, Wind = 0.2 },
	PartlyCloudy = { Cloud = 0.45, Rain = 0, Storm = 0, Fog = 0, Wind = 0.3 },
	Overcast = { Cloud = 0.8, Rain = 0, Storm = 0, Fog = 0.1, Wind = 0.45 },
	Drizzle = { Cloud = 0.86, Rain = 0.35, Storm = 0.1, Fog = 0.15, Wind = 0.4 },
	Fog = { Cloud = 0.5, Rain = 0, Storm = 0, Fog = 1, Wind = 0.05 },
	Storm = { Cloud = 1, Rain = 1, Storm = 1, Fog = 0.2, Wind = 1 },
}
Weather.States = STATES

type Override = { name: string, rate: number }

local ctx: any
local current: Mix = table.clone(STATES.Clear)
local natural = "Clear"
local nextNatural = 0
local overrides: { Override } = {}
local forced: string? = nil
local nextThunder = 0
local wetParts: { BasePart } = {}
local lastWet = -1
local rng = Random.new()

local function targetName(): (string, number)
	if forced then
		return forced, 3 / 20
	end
	local top = overrides[#overrides]
	if top then
		return top.name, top.rate
	end
	return natural, 3 / 60
end

function Weather.Get(): Mix
	return current
end

function Weather.Current(): string
	return (targetName())
end

-- Push a weather state. `seconds` is roughly how long the change takes.
function Weather.Override(name: string, seconds: number?): Override
	assert(STATES[name], "unknown weather " .. name)
	local o = { name = name, rate = 3 / math.max(seconds or 30, 1) }
	table.insert(overrides, o)
	return o
end

function Weather.Release(o: Override?)
	if not o then
		return
	end
	local i = table.find(overrides, o)
	if i then
		table.remove(overrides, i)
	end
end

-- Director control: pin a state, or nil to go back to automatic.
function Weather.Force(name: string?)
	if name and not STATES[name] then
		return
	end
	forced = name
end

local function pickNatural(): string
	local clock = ctx.DayNight.GetClock()
	local options: { { name: string, weight: number } } = {
		{ name = "Clear", weight = 40 },
		{ name = "PartlyCloudy", weight = 30 },
		{ name = "Overcast", weight = 14 },
		{ name = "Drizzle", weight = 6 },
		{ name = "Fog", weight = if clock > 4.5 and clock < 9 then 22 else 0 },
	}
	local total = 0
	for _, o in options do
		total += o.weight
	end
	local roll = rng:NextNumber() * total
	for _, o in options do
		roll -= o.weight
		if roll <= 0 then
			return o.name
		end
	end
	return "Clear"
end

function Weather.Init(context: any)
	ctx = context
	local town = ctx.Town :: Instance
	for _, d in town:GetDescendants() do
		if d:IsA("BasePart") and d:GetAttribute("WetRoad") then
			table.insert(wetParts, d)
		end
	end
	nextNatural = os.clock() + rng:NextNumber(200, 420)

	local acc = 0
	RunService.Heartbeat:Connect(function(dt: number)
		acc += dt
		if acc < 0.25 then
			return
		end
		local step = acc
		acc = 0
		local now = os.clock()
		if now >= nextNatural then
			natural = pickNatural()
			nextNatural = now + rng:NextNumber(240, 540)
		end
		local name, rate = targetName()
		local target = STATES[name]
		local k = math.min(1, step * rate)
		current.Cloud += (target.Cloud - current.Cloud) * k
		current.Rain += (target.Rain - current.Rain) * k
		current.Storm += (target.Storm - current.Storm) * k
		current.Fog += (target.Fog - current.Fog) * k
		current.Wind += (target.Wind - current.Wind) * k

		local Net = ctx.Net
		Net.Set("Weather", name)
		Net.Set("Rain", math.floor(current.Rain * 100 + 0.5) / 100)
		Net.Set("Wind", math.floor(current.Wind * 100 + 0.5) / 100)
		Net.Set("Storm", math.floor(current.Storm * 100 + 0.5) / 100)
		Net.Set("Fog", math.floor(current.Fog * 100 + 0.5) / 100)

		if math.abs(current.Rain - lastWet) > 0.03 then
			lastWet = current.Rain
			for _, p in wetParts do
				p.Reflectance = 0.14 * current.Rain
			end
		end

		if current.Storm > 0.6 and now >= nextThunder then
			nextThunder = now + rng:NextNumber(10, 28)
			Net.Remote("Flash"):FireAllClients(rng:NextNumber(0.55, 1))
		end
	end)
end

return Weather
