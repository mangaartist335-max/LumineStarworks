--!strict
-- Turns every part marked with an "Interact" attribute into a ProximityPrompt.
-- Prompts work the same with a tap (mobile), E (keyboard) or X (gamepad).

local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("SomewhereShared")
local Config = require(Shared:WaitForChild("Config"))
local Text = require(Shared:WaitForChild("Text"))

local Interactions = {}

export type Options = {
	ActionText: string?,
	ObjectText: string?,
	MaxDistance: number?,
	HoldDuration: number?,
	LineOfSight: boolean?,
}

local ctx: any
local lastUse: { [Player]: number } = {}
local doorState: { [BasePart]: { closed: CFrame, open: boolean, token: number } } = {}
local jukeboxSound: Sound? = nil

local function debounce(player: Player): boolean
	local now = os.clock()
	if lastUse[player] and now - lastUse[player] < 0.4 then
		return false
	end
	lastUse[player] = now
	return true
end

-- Adds a prompt to any part (or attachment). Returns the prompt so callers can remove it.
function Interactions.Add(parent: Instance, opts: Options, handler: (Player, ProximityPrompt) -> ()): ProximityPrompt
	local prompt = Instance.new("ProximityPrompt")
	prompt.Name = "SomewherePrompt"
	prompt.ActionText = opts.ActionText or "Look"
	prompt.ObjectText = opts.ObjectText or ""
	prompt.MaxActivationDistance = opts.MaxDistance or 9
	prompt.HoldDuration = opts.HoldDuration or 0
	prompt.RequiresLineOfSight = opts.LineOfSight == true
	prompt.KeyboardKeyCode = Enum.KeyCode.E
	prompt.GamepadKeyCode = Enum.KeyCode.ButtonX
	prompt.ClickablePrompt = true
	prompt.Style = Enum.ProximityPromptStyle.Default
	prompt.Triggered:Connect(function(player)
		if debounce(player) then
			handler(player, prompt)
		end
	end)
	prompt.Parent = parent
	return prompt
end

local function note(player: Player, textId: string)
	local entry = Text.Notes[textId] or Text.Discoveries[textId]
	if entry then
		ctx.Net.Notify(player, { kind = "note", title = entry.Title, body = entry.Body })
	end
end
Interactions.Note = note

local function toast(player: Player, text: string)
	ctx.Net.Notify(player, { kind = "toast", text = text })
end
Interactions.Toast = toast

-- Doors swing toward the building's inside (+Z of the door part) around one edge.
function Interactions.SetDoor(door: BasePart, open: boolean)
	local st = doorState[door]
	if not st then
		st = { closed = door.CFrame, open = false, token = 0 }
		doorState[door] = st
	end
	if st.open == open then
		return
	end
	st.open = open
	st.token += 1
	local side = (door:GetAttribute("HingeSide") :: number?) or 1
	local angle = math.rad((door:GetAttribute("OpenAngle") :: number?) or 95)
	local hinge = st.closed * CFrame.new(side * door.Size.X / 2, 0, 0)
	local target = if open then hinge * CFrame.Angles(0, side * angle, 0) * hinge:Inverse() * st.closed else st.closed
	TweenService:Create(door, TweenInfo.new(0.7, Enum.EasingStyle.Sine, Enum.EasingDirection.Out), { CFrame = target }):Play()
	door.CanCollide = not open
	if open then
		local token = st.token
		task.delay(18, function()
			if st.token == token and st.open then
				Interactions.SetDoor(door, false)
			end
		end)
	end
end

local handlers: { [string]: (Player, BasePart, ProximityPrompt) -> () } = {}

handlers.Read = function(player, part)
	local textId = part:GetAttribute("TextId") :: string?
	if textId then
		note(player, textId)
	end
	local discovery = part:GetAttribute("Discovery") :: string?
	if discovery then
		task.delay(0.6, function()
			ctx.Discoveries.Award(player, discovery)
		end)
	end
end

handlers.Door = function(player, part, prompt)
	if part:GetAttribute("Locked") then
		local index = (part:GetAttribute("LockedIndex") :: number?) or 1
		toast(player, Text.LockedDoors[((index - 1) % #Text.LockedDoors) + 1])
		return
	end
	local st = doorState[part]
	local open = not (st and st.open)
	Interactions.SetDoor(part, open)
	prompt.ActionText = if open then "Close" else "Open"
end

handlers.Give = function(player, part)
	local item = part:GetAttribute("Item") :: string
	local lineId = part:GetAttribute("Line") :: string?
	local speakerName = part:GetAttribute("Speaker") :: string?
	if not ctx.Items.Give(player, item) then
		toast(player, Text.Lines.AlreadyHave)
		return
	end
	local line = lineId and (Text.Lines :: any)[lineId] :: string?
	if line then
		local speaker = speakerName and ctx.NPCs.Get(speakerName)
		if speaker and not speaker.Busy then
			speaker:Say(line)
		else
			toast(player, line)
		end
	end
end

handlers.Bell = function(player, part)
	if Config.Sounds.CounterBell ~= "" then
		local existing = part:FindFirstChild("Ding")
		if existing and existing:IsA("Sound") then
			existing:Play()
		else
			local s = Instance.new("Sound")
			s.Name = "Ding"
			s.SoundId = Config.Sounds.CounterBell
			s.Volume = 0.5
			s.Parent = part
			s:Play()
		end
	else
		toast(player, "Ding!")
	end
	local marv = ctx.NPCs.Get("Marv")
	if marv and not marv.Busy then
		marv:Say("Coming! ...oh, I'm already here.")
	end
end

handlers.Jukebox = function(player, part)
	if Config.Sounds.Jukebox == "" then
		toast(player, Text.Lines.JukeboxNoMusic)
		return
	end
	if not jukeboxSound then
		local s = Instance.new("Sound")
		s.SoundId = Config.Sounds.Jukebox
		s.Looped = true
		s.Volume = 0.45
		s.RollOffMaxDistance = 45
		s.Parent = part
		jukeboxSound = s
	end
	local s = jukeboxSound :: Sound
	if s.IsPlaying then
		s:Stop()
	else
		s:Play()
	end
end

handlers.Pet = function(player, part)
	toast(player, Text.Lines.CatPet)
	local existing = part:FindFirstChild("Hearts")
	local h: ParticleEmitter
	if existing and existing:IsA("ParticleEmitter") then
		h = existing
	else
		h = Instance.new("ParticleEmitter")
		h.Name = "Hearts"
		h.Texture = Config.Textures.Sparkle
		h.Color = ColorSequence.new(Color3.fromRGB(255, 170, 190))
		h.Size = NumberSequence.new(0.35)
		h.Lifetime = NumberRange.new(0.8, 1.2)
		h.Speed = NumberRange.new(2, 3)
		h.SpreadAngle = Vector2.new(25, 25)
		h.EmissionDirection = Enum.NormalId.Top
		h.LightEmission = 0.4
		h.Rate = 0
		h.Parent = part
	end
	h:Emit(6)
end

handlers.Switch = function(player, part)
	local group = part:GetAttribute("Group") :: string?
	if group then
		ctx.Lights.Toggle(group)
		toast(player, Text.Lines.SwitchOn)
	end
end

local function setup(part: BasePart)
	local kind = part:GetAttribute("Interact") :: string?
	local handler = kind and handlers[kind]
	if not kind or not handler then
		return
	end
	Interactions.Add(part, {
		ActionText = part:GetAttribute("ActionText") :: string?,
		ObjectText = part:GetAttribute("ObjectText") :: string?,
		MaxDistance = part:GetAttribute("MaxDistance") :: number?,
	}, function(player, prompt)
		handler(player, part, prompt)
	end)
end

-- Seats get a "Sit" prompt too, so tapping works as well as walking onto them.
local function setupSeat(seat: Seat)
	Interactions.Add(seat, { ActionText = "Sit", ObjectText = "", MaxDistance = 7 }, function(player)
		local character = player.Character
		local humanoid = character and character:FindFirstChildOfClass("Humanoid")
		if humanoid and not seat.Occupant then
			seat:Sit(humanoid)
		end
	end)
end

function Interactions.Init(context: any)
	ctx = context
	for _, d in (ctx.Town :: Instance):GetDescendants() do
		if d:IsA("BasePart") then
			if d:GetAttribute("Interact") then
				setup(d)
			end
			if d:IsA("Seat") and d:GetAttribute("Sittable") then
				setupSeat(d)
			end
		end
	end
	Players.PlayerRemoving:Connect(function(player)
		lastUse[player] = nil
	end)
end

return Interactions
