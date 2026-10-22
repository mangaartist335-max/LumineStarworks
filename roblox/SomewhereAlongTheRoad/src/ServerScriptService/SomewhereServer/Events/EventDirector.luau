--!strict
-- Decides when something happens. Each in-game day rolls a mood (quiet, ordinary, lively)
-- that sets how many events it gets. Events claim "resources" (the road, the weather, the store)
-- so two things never fight over the same stage, and each has a cooldown so nothing repeats
-- too often. Some days nothing happens at all, which is part of the charm.

local HttpService = game:GetService("HttpService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("SomewhereShared"):WaitForChild("Config"))
local EventContext = require(script.Parent.EventContext)

local EventDirector = {}

export type EventModule = {
	Id: string,
	Name: string,
	Resources: { string },
	Cooldown: number,
	Weight: number | (any) -> number,
	CanRun: ((any) -> boolean)?,
	Rare: boolean?,
	Run: (EventContext.Context) -> (),
}

type Running = { context: EventContext.Context, resources: { string } }

local ORDER = {
	"Rainstorm",
	"UnusualVehicle",
	"StoreClosing",
	"BusStopStranger",
	"PowerOutage",
	"WoodsNoise",
	"RoadsideObject",
	"GoldenSunset",
	"FunnyIncident",
	"RareOccurrence",
}

local systems: any
local events: { [string]: EventModule } = {}
local running: { [string]: Running } = {}
local lastFinished: { [string]: number } = {}
local lastStartedId: string? = nil
local auto = Config.Events.Enabled
local rng = Random.new()
local profile = Config.Events.DayProfiles[2]
local budget = 2
local startedToday = 0
local rareToday = false

local function publish()
	local ids = {}
	for id in running do
		table.insert(ids, id)
	end
	table.sort(ids)
	systems.Net.Set("ActiveEvents", table.concat(ids, ","))
	systems.Net.Set("AutoEvents", auto)
	systems.Net.Set("DayMood", profile.Name)
end

local function rollDay()
	local total = 0
	for _, p in Config.Events.DayProfiles do
		total += p.Weight
	end
	local roll = rng:NextNumber() * total
	for _, p in Config.Events.DayProfiles do
		roll -= p.Weight
		if roll <= 0 then
			profile = p
			break
		end
	end
	budget = rng:NextInteger(profile.Budget[1], profile.Budget[2])
	startedToday = 0
	rareToday = false
	publish()
end

local function weightOf(e: EventModule): number
	local w = e.Weight
	if type(w) == "function" then
		return w(systems)
	end
	return w :: number
end

local function conflicts(resources: { string }): { string }
	local hits = {}
	for id, r in running do
		for _, res in resources do
			if table.find(r.resources, res) then
				table.insert(hits, id)
				break
			end
		end
	end
	return hits
end

function EventDirector.Stop(id: string)
	local r = running[id]
	if r then
		r.context:Cleanup()
		running[id] = nil
		lastFinished[id] = os.clock()
		publish()
	end
end

function EventDirector.StopAll()
	for id in running do
		EventDirector.Stop(id)
	end
end

-- Starts an event. `forced` (from the director panel) clears anything in its way.
function EventDirector.Trigger(id: string, forced: boolean?): boolean
	local e = events[id]
	if not e or running[id] then
		return false
	end
	local blocking = conflicts(e.Resources)
	if #blocking > 0 then
		if not forced then
			return false
		end
		for _, other in blocking do
			EventDirector.Stop(other)
		end
	end
	local context = EventContext.new(id, systems, forced == true)
	running[id] = { context = context, resources = e.Resources }
	lastStartedId = id
	if not forced then
		startedToday += 1
		if e.Rare then
			rareToday = true
		end
	end
	publish()
	print(`[Somewhere] Event: {e.Name}`)
	task.spawn(function()
		local ok, err = xpcall(function()
			e.Run(context)
		end, function(message: any): string
			return debug.traceback(tostring(message))
		end)
		if not ok and not context.Cancelled then
			warn(`[Somewhere] Event {id} hit a problem: {err}`)
		end
		if running[id] and rawequal(running[id].context, context) then
			EventDirector.Stop(id)
		end
	end)
	return true
end

local function tryAutoStart()
	if not auto or startedToday >= budget then
		return
	end
	local count = 0
	for _ in running do
		count += 1
	end
	if count >= Config.Events.MaxConcurrent then
		return
	end
	local now = os.clock()
	local pool: { { id: string, w: number } } = {}
	local total = 0
	for id, e in events do
		local ready = not running[id]
			and id ~= lastStartedId
			and now - (lastFinished[id] or -math.huge) >= e.Cooldown
			and not (e.Rare and rareToday)
			and #conflicts(e.Resources) == 0
			and (not e.CanRun or e.CanRun(systems))
		if ready then
			local w = weightOf(e)
			if w > 0 then
				table.insert(pool, { id = id, w = w })
				total += w
			end
		end
	end
	if total <= 0 then
		return
	end
	local roll = rng:NextNumber() * total
	for _, entry in pool do
		roll -= entry.w
		if roll <= 0 then
			EventDirector.Trigger(entry.id, false)
			return
		end
	end
end

function EventDirector.SetAuto(on: boolean)
	auto = on
	publish()
end

function EventDirector.Init(context: any)
	systems = context
	local catalogFolder = script.Parent:WaitForChild("Catalog")
	local catalog = {}
	for _, id in ORDER do
		local module = catalogFolder:FindFirstChild(id)
		if module and module:IsA("ModuleScript") then
			local e = require(module) :: any
			events[id] = e
			table.insert(catalog, { Id = id, Name = e.Name })
		else
			warn("[Somewhere] Missing event module " .. id)
		end
	end
	systems.Net.Set("EventCatalog", HttpService:JSONEncode(catalog))
	rollDay()
	systems.DayNight.OnNewDay(rollDay)

	task.spawn(function()
		local first = Config.Events.FirstEventDelay
		task.wait(rng:NextNumber(first[1], first[2]))
		while true do
			tryAutoStart()
			local gap = Config.Events.Gap
			task.wait(rng:NextNumber(gap[1], gap[2]) * profile.GapScale)
		end
	end)
end

return EventDirector
