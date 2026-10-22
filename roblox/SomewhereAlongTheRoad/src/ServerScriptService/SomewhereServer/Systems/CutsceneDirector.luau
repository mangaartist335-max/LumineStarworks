--!strict
-- Runs the trailer. The server owns the timeline: for each shot it sets the time of day, the
-- weather and the mood, stages that shot's event, then tells every screen which shot is live
-- (and exactly when it started) so the cameras all move in step.

local PhysicsService = game:GetService("PhysicsService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Cutscene = require(ReplicatedStorage:WaitForChild("SomewhereShared"):WaitForChild("Cutscene"))
local Config = require(ReplicatedStorage:WaitForChild("SomewhereShared"):WaitForChild("Config"))

local CutsceneDirector = {}

type Live = { kind: string, index: number?, startedAt: number? }

local ctx: any
local remote: RemoteEvent
local runToken = 0
local live: Live = { kind = "waiting" }
local started = false
local skipRequested = false
local seats: { Seat } = {}

local function send(payload: Live, player: Player?)
	if player then
		remote:FireClient(player, payload)
	else
		remote:FireAllClients(payload)
	end
end

local function runCue(cue: Cutscene.Cue)
	if cue.Do == "Flash" then
		ctx.Net.Remote("Flash"):FireAllClients(cue.Strength or 1)
	elseif cue.Do == "Say" and cue.Npc and cue.Text then
		local npc = ctx.NPCs.Get(cue.Npc)
		if npc then
			npc:Say(cue.Text, cue.Seconds)
		end
	end
end

-- Sets the scene for a shot: weather first (the lighting reads it), then the clock and mood.
local function prepare(shot: Cutscene.Shot)
	ctx.DayNight.SetTimeScale(0)
	ctx.DayNight.ResetMoods()
	ctx.Net.Set("PowerOn", true)
	if shot.Weather then
		ctx.Weather.Snap(shot.Weather)
	end
	if shot.WeatherRamp then
		ctx.Weather.Force(shot.WeatherRamp.Name, shot.WeatherRamp.Seconds)
	end
	if shot.Clock then
		ctx.DayNight.SetClock(shot.Clock)
	end
	if shot.Mood then
		ctx.DayNight.SetMood(shot.Mood.Name, shot.Mood.Value, shot.Mood.Seconds)
	end
	ctx.Lights.Refresh()
end

local function stage(shot: Cutscene.Shot)
	local e = shot.Event
	if e then
		ctx.Events.Trigger(e.Id, true, e.Options)
	end
end

function CutsceneDirector.Play()
	runToken += 1
	local token = runToken
	local shots = Cutscene.Shots
	task.spawn(function()
		ctx.Events.StopAll()
		local staged: { [number]: boolean } = {}
		for i, shot in shots do
			if token ~= runToken then
				return
			end
			-- Clear the stage, keeping this shot's event if it was started early.
			ctx.Events.StopAll(if staged[i] and shot.Event then shot.Event.Id else nil)
			prepare(shot)
			if not staged[i] then
				stage(shot)
			end
			live = { kind = "shot", index = i, startedAt = workspace:GetServerTimeNow() }
			send(live)

			-- Cues and early staging only count while this shot is still the live one
			-- (a tap can move things along before their timers come up).
			local function stillHere(): boolean
				return token == runToken and live.index == i
			end
			local cues: { Cutscene.Cue } = shot.Cues or {}
			for _, cue in cues do
				task.delay(cue.At, function()
					if stillHere() then
						runCue(cue)
					end
				end)
			end
			-- Some events need a moment to get into place (someone sitting down, say),
			-- so they start a little before their shot.
			local nextShot = shots[i + 1]
			local lead = nextShot and nextShot.Event and nextShot.Event.Lead
			if nextShot and lead then
				task.delay(math.max(0, shot.Duration - lead), function()
					if stillHere() then
						staged[i + 1] = true
						stage(nextShot)
					end
				end)
			end
			-- Play the shot out, or move on early if someone taps. With WaitForTap the last
			-- frame holds until a tap.
			skipRequested = false
			local deadline = os.clock() + shot.Duration
			while token == runToken and not skipRequested do
				if os.clock() >= deadline and not Cutscene.Settings.WaitForTap then
					break
				end
				task.wait(0.05)
			end
		end
		if token ~= runToken then
			return
		end
		live = { kind = "end" }
		send(live)
		ctx.Events.StopAll()
		if Cutscene.Settings.Loop then
			task.wait(Cutscene.Settings.LoopDelay)
			if token == runToken then
				CutsceneDirector.Play()
			end
		end
	end)
end

-- Everyone walks the same marks, so avatars pass through each other instead of bumping.
local STARS = "SomewhereStars"
local function letAvatarsOverlap()
	pcall(function()
		PhysicsService:RegisterCollisionGroup(STARS)
		PhysicsService:CollisionGroupSetCollidable(STARS, STARS, false)
	end)
	local function join(d: Instance)
		if d:IsA("BasePart") then
			d.CollisionGroup = STARS
		end
	end
	local function watch(player: Player)
		player.CharacterAdded:Connect(function(char)
			for _, d in char:GetDescendants() do
				join(d)
			end
			char.DescendantAdded:Connect(join)
		end)
		if player.Character then
			for _, d in player.Character:GetDescendants() do
				join(d)
			end
		end
	end
	for _, player in Players:GetPlayers() do
		watch(player)
	end
	Players.PlayerAdded:Connect(watch)
end

function CutsceneDirector.Init(context: any)
	ctx = context
	remote = ctx.Net.Remote("Cutscene")
	letAvatarsOverlap()
	if not Cutscene.Settings.StarAvatar then
		-- Anyone who slipped in before character spawning was switched off loses their avatar.
		for _, player in Players:GetPlayers() do
			if player.Character then
				player.Character:Destroy()
			end
		end
	end
	for _, d in (ctx.Town :: Instance):GetDescendants() do
		if d:IsA("Seat") then
			table.insert(seats, d)
		end
	end
	local view = if Cutscene.Settings.FirstPerson then "First-person cutscene" else "Cutscene"
	print(`[Somewhere] {view} (v{Config.Version}): the trailer starts in a moment. Tap or click to skip ahead, R to restart.`)
	remote.OnServerEvent:Connect(function(player: Player, action: any, arg: any)
		if action == "Ready" then
			if not started then
				started = true
				task.delay(Cutscene.Settings.StartDelay, CutsceneDirector.Play)
			else
				send(live, player)
			end
		elseif action == "Restart" and player:GetAttribute("IsDirector") then
			CutsceneDirector.Play()
		elseif action == "Next" and Cutscene.Settings.TapToSkip then
			-- With friends watching, only the director moves the story along.
			if #Players:GetPlayers() == 1 or player:GetAttribute("IsDirector") then
				skipRequested = true
			end
		elseif action == "Sit" and typeof(arg) == "Vector3" then
			-- Seats can only be taken from the server, so the camera asks us to sit the star down.
			local character = player.Character
			local humanoid = character and character:FindFirstChildOfClass("Humanoid")
			-- Only the seat the shot means (if a friend already has it, you just stay standing
			-- there, and your view is the same).
			local best: Seat? = nil
			local bestDist = 2
			for _, seat in seats do
				local dist = (seat.Position - arg).Magnitude
				if dist < bestDist and not seat.Occupant then
					best, bestDist = seat, dist
				end
			end
			if humanoid and best then
				best:Sit(humanoid)
			end
		end
	end)
end

return CutsceneDirector
