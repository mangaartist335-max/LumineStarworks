--!strict
-- What every event gets while it runs: the game's systems, a random stream, and cleanup
-- helpers so an event can never leave a truck parked forever or the power switched off.

local Players = game:GetService("Players")

local EventContext = {}
EventContext.__index = EventContext

export type Context = typeof(setmetatable(
	{} :: {
		Id: string,
		Forced: boolean,
		Options: { [string]: any }, -- staging hints from the cutscene (where, which variant, how fast)
		Cancelled: boolean,
		Systems: any,
		Rng: Random,
		_cleanup: { () -> () },
	},
	EventContext
))

function EventContext.new(id: string, systems: any, forced: boolean, options: { [string]: any }?): Context
	return setmetatable({
		Id = id,
		Forced = forced,
		Options = options or {},
		Cancelled = false,
		Systems = systems,
		Rng = Random.new(),
		_cleanup = {},
	}, EventContext)
end

-- Waits, but wakes early (returning false) if the event is being stopped.
function EventContext.Wait(self: Context, seconds: number): boolean
	local deadline = os.clock() + seconds
	while os.clock() < deadline do
		if self.Cancelled then
			return false
		end
		task.wait(math.min(0.25, deadline - os.clock()))
	end
	return not self.Cancelled
end

function EventContext.OnCleanup(self: Context, fn: () -> ())
	table.insert(self._cleanup, fn)
end

function EventContext.Track<T>(self: Context, inst: T): T
	self:OnCleanup(function()
		if typeof(inst) == "Instance" then
			(inst :: any):Destroy()
		elseif typeof(inst) == "RBXScriptConnection" then
			(inst :: any):Disconnect()
		end
	end)
	return inst
end

-- Runs `fn` in the background for the life of the event.
function EventContext.Spawn(self: Context, fn: () -> ())
	local thread = task.spawn(fn)
	self:OnCleanup(function()
		if coroutine.status(thread) ~= "dead" then
			pcall(function()
				task.cancel(thread)
			end)
		end
	end)
end

function EventContext.Cleanup(self: Context)
	self.Cancelled = true
	local list = self._cleanup
	self._cleanup = {}
	for i = #list, 1, -1 do
		local fn = list[i]
		local ok, err = pcall(function()
			fn()
		end)
		if not ok then
			warn(`[Somewhere] cleanup in {self.Id} failed: {err}`)
		end
	end
end

function EventContext.Anchors(self: Context, name: string): { BasePart }
	local list = {}
	for _, d in (self.Systems.Town :: Instance):GetDescendants() do
		if d:IsA("BasePart") and d:GetAttribute("Anchor") == name then
			table.insert(list, d)
		end
	end
	return list
end

function EventContext.Anchor(self: Context, name: string): CFrame?
	local list = self:Anchors(name)
	return if #list > 0 then list[1].CFrame else nil
end

function EventContext.Find(self: Context, name: string): Instance?
	return (self.Systems.Town :: Instance):FindFirstChild(name, true)
end

function EventContext.Pick<T>(self: Context, list: { T }): T
	return list[self.Rng:NextInteger(1, #list)]
end

function EventContext.PlayerPositions(_self: Context): { Vector3 }
	local list = {}
	for _, player in Players:GetPlayers() do
		local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart") :: BasePart?
		if root then
			table.insert(list, root.Position)
		end
	end
	return list
end

function EventContext.NearestPlayerDistance(self: Context, pos: Vector3): number
	local best = math.huge
	for _, p in self:PlayerPositions() do
		best = math.min(best, (p - pos).Magnitude)
	end
	return best
end

-- Keeps awarding a discovery to anyone who comes within `radius` of a moving thing.
function EventContext.AwardNearby(self: Context, getPosition: () -> Vector3?, radius: number, discovery: string, extra: string?)
	self:Spawn(function()
		while not self.Cancelled do
			local pos = getPosition()
			if pos then
				self.Systems.Discoveries.AwardNear(pos, radius, discovery, extra)
			end
			task.wait(0.5)
		end
	end)
end

-- A soft line of text for players nearby, used when a sound slot is left empty.
function EventContext.Hint(self: Context, text: string, near: Vector3?, radius: number?)
	local Config = require(game:GetService("ReplicatedStorage"):WaitForChild("SomewhereShared"):WaitForChild("Config"))
	if not Config.SubtleHints then
		return
	end
	for _, player in Players:GetPlayers() do
		local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart") :: BasePart?
		if root and (not near or (root.Position - near).Magnitude <= (radius or 200)) then
			self.Systems.Net.Notify(player, { kind = "hint", text = text })
		end
	end
end

-- A positional sound from Config.Sounds, if that slot has an id. Returns nil otherwise.
function EventContext.Sound(self: Context, slot: string, parent: Instance, looped: boolean?, volume: number?): Sound?
	local Config = require(game:GetService("ReplicatedStorage"):WaitForChild("SomewhereShared"):WaitForChild("Config"))
	local id = (Config.Sounds :: any)[slot] :: string?
	if not id or id == "" then
		return nil
	end
	local s = Instance.new("Sound")
	s.SoundId = id
	s.Looped = looped == true
	s.Volume = volume or 0.6
	s.RollOffMaxDistance = 140
	s.Parent = parent
	s:Play()
	return self:Track(s)
end

return EventContext
