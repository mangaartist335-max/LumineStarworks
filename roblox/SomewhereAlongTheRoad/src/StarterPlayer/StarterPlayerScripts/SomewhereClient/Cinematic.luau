--!strict
-- The camera operator. Follows the server's timeline and flies the camera through each shot,
-- with letterbox bars, fades, captions and the title card. Also directs your avatar (where to
-- stand, walk, sit, wave) and lets a tap or click move things along. Hides every bit of Roblox
-- UI so the screen is ready to record.

local GuiService = game:GetService("GuiService")
local TextChatService = game:GetService("TextChatService")
local Players = game:GetService("Players")
local ProximityPromptService = game:GetService("ProximityPromptService")
local RunService = game:GetService("RunService")
local StarterGui = game:GetService("StarterGui")
local UserInputService = game:GetService("UserInputService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("SomewhereShared")
local Cutscene = require(Shared:WaitForChild("Cutscene"))
local Config = require(Shared:WaitForChild("Config"))

local Cinematic = {}

local rgb = Color3.fromRGB
local player = Players.LocalPlayer
local settings = Cutscene.Settings
local shots = Cutscene.Shots

local TITLE_FONT = Font.new("rbxasset://fonts/families/Merriweather.json", Enum.FontWeight.Bold)
local CAPTION_FONT = Font.new("rbxasset://fonts/families/Merriweather.json", Enum.FontWeight.Regular, Enum.FontStyle.Italic)
local SUB_FONT = Font.new("rbxasset://fonts/families/Merriweather.json", Enum.FontWeight.Light)

local current: { index: number, startedAt: number }? = nil
local ended = false
local lastIndex = 0
local trackedLook: Vector3? = nil
local remote: RemoteEvent
local avatarThread: thread? = nil
local directedIndex = 0
local placedIndex = 0 -- the shot whose mark the avatar has actually reached
local eyeSmoothed: Vector3? = nil
local eyeIndex = 0
local lastTap = 0
local PARKED = CFrame.new(0, -60, 0) -- out of sight, under the town, for shots you're not in

local gui: ScreenGui
local topBar: Frame
local bottomBar: Frame
local fade: Frame
local caption: TextLabel
local smallCaption: TextLabel
local title: TextLabel
local subtitle: TextLabel
local hint: TextLabel

local function ease(a: number, style: string?): number
	if style == "Linear" then
		return a
	elseif style == "Out" then
		return 1 - (1 - a) * (1 - a)
	end
	return 0.5 - math.cos(a * math.pi) / 2
end

-- 0 outside the window, 1 inside it, with soft edges.
local function window(t: number, from: number, to: number, edge: number): number
	if t < from or t > to then
		return 0
	end
	return math.min(1, (t - from) / edge, (to - t) / edge)
end

local function hideRobloxUI()
	for _ = 1, 20 do
		local ok = pcall(function()
			StarterGui:SetCoreGuiEnabled(Enum.CoreGuiType.All, false)
			StarterGui:SetCore("TopbarEnabled", false)
		end)
		if ok then
			break
		end
		task.wait(0.25)
	end
	if settings.HideCursor then
		UserInputService.MouseIconEnabled = false
	end
end

local function textLabel(name: string, font: Font, color: Color3): TextLabel
	local l = Instance.new("TextLabel")
	l.Name = name
	l.BackgroundTransparency = 1
	l.AnchorPoint = Vector2.new(0.5, 0.5)
	l.FontFace = font
	l.TextColor3 = color
	l.TextTransparency = 1
	l.TextStrokeColor3 = rgb(0, 0, 0)
	l.TextStrokeTransparency = 1
	l.TextWrapped = true
	l.TextScaled = true
	l.ZIndex = 10
	l.Parent = gui
	return l
end

local function layout()
	local view = workspace.CurrentCamera.ViewportSize
	local bar = 0
	if settings.Letterbox and view.Y > 0 then
		bar = math.max(0, (1 - (view.X / view.Y) / settings.LetterboxRatio) / 2)
	end
	topBar.Size = UDim2.fromScale(1, bar)
	bottomBar.Size = UDim2.fromScale(1, bar)
	caption.Position = UDim2.fromScale(0.5, 1 - bar - 0.11)
	smallCaption.Position = UDim2.fromScale(0.5, 1 - bar - 0.055)
	-- The hint sits on the bottom black bar, out of the picture.
	hint.Position = UDim2.fromScale(0.97, if bar > 0.03 then 1 - bar / 2 else 0.96)
end

local function build()
	gui = Instance.new("ScreenGui")
	gui.Name = "SomewhereCinematic"
	gui.IgnoreGuiInset = true
	gui.ScreenInsets = Enum.ScreenInsets.None
	gui.ResetOnSpawn = false
	gui.DisplayOrder = 100
	gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
	gui.Parent = player:WaitForChild("PlayerGui")

	local function bar(name: string, anchorY: number): Frame
		local f = Instance.new("Frame")
		f.Name = name
		f.AnchorPoint = Vector2.new(0, anchorY)
		f.Position = UDim2.fromScale(0, anchorY)
		f.BackgroundColor3 = rgb(0, 0, 0)
		f.BorderSizePixel = 0
		f.ZIndex = 5
		f.Parent = gui
		return f
	end
	topBar = bar("TopBar", 0)
	bottomBar = bar("BottomBar", 1)

	fade = Instance.new("Frame")
	fade.Name = "Fade"
	fade.Size = UDim2.fromScale(1, 1)
	fade.BackgroundColor3 = rgb(0, 0, 0)
	fade.BorderSizePixel = 0
	fade.ZIndex = 8
	fade.Parent = gui

	caption = textLabel("Caption", CAPTION_FONT, rgb(255, 250, 240))
	caption.Size = UDim2.fromScale(0.8, 0.06)
	smallCaption = textLabel("SmallCaption", SUB_FONT, rgb(236, 230, 218))
	smallCaption.Size = UDim2.fromScale(0.6, 0.038)

	title = textLabel("Title", TITLE_FONT, rgb(255, 250, 238))
	title.Position = UDim2.fromScale(0.5, 0.46)
	title.Size = UDim2.fromScale(0.8, 0.11)
	subtitle = textLabel("Subtitle", SUB_FONT, rgb(236, 228, 214))
	subtitle.Position = UDim2.fromScale(0.5, 0.56)
	subtitle.Size = UDim2.fromScale(0.5, 0.04)

	hint = textLabel("TapHint", SUB_FONT, rgb(220, 214, 204))
	hint.AnchorPoint = Vector2.new(1, 0.5)
	hint.Size = UDim2.fromScale(0.22, 0.03)
	hint.TextXAlignment = Enum.TextXAlignment.Right
	hint.ZIndex = 9

	workspace.CurrentCamera:GetPropertyChangedSignal("ViewportSize"):Connect(layout)
	layout()
end

local function setText(label: TextLabel, text: string, alpha: number)
	if label.Text ~= text then
		label.Text = text
	end
	label.TextTransparency = 1 - alpha
	label.TextStrokeTransparency = 1 - alpha * 0.35
end

-- Where your eyes would be for this shot's plan, before the avatar has got there.
local function plannedEye(plan: Cutscene.Avatar): Vector3
	local eye = if plan.Sit then plan.Sit + Vector3.new(0, 2.9, 0) else plan.At.Position + Vector3.new(0, settings.EyeHeight, 0)
	return if plan.Crouch then eye - Vector3.new(0, settings.CrouchDrop, 0) else eye
end

-- Where your eyes actually are: just above the centre of your avatar's head. For a seated
-- shot this waits until you're actually on the seat, so the view doesn't dip on the way down.
local function headEye(plan: Cutscene.Avatar): Vector3?
	local char = player.Character
	local head = char and char:FindFirstChild("Head")
	if not char or not head or not head:IsA("BasePart") then
		return nil
	end
	if plan.Sit then
		local humanoid = char:FindFirstChildOfClass("Humanoid")
		if not humanoid or not humanoid.SeatPart then
			return nil
		end
	end
	local eye = head.Position + Vector3.new(0, 0.25, 0)
	return if plan.Crouch then eye - Vector3.new(0, settings.CrouchDrop, 0) else eye
end

-- In first person you don't see your own body. Your shadow stays (it's nice to see it walk
-- along beside you), except when you're crouching, where a standing shadow would look odd.
local function hideBody(hide: boolean, noShadow: boolean)
	local char = player.Character
	if not char then
		return
	end
	local value = if hide then 1 else 0
	for _, d in char:GetDescendants() do
		if d:IsA("BasePart") then
			d.LocalTransparencyModifier = value
			d.CastShadow = not noShadow
		elseif d:IsA("Decal") then
			d.LocalTransparencyModifier = value
		end
	end
end

local function step(dt: number)
	local camera = workspace.CurrentCamera
	camera.CameraType = Enum.CameraType.Scriptable

	local live = current
	if not live then
		fade.BackgroundTransparency = 0
		return
	end
	local shot = shots[live.index]
	if not shot then
		return
	end
	if live.index ~= lastIndex then
		lastIndex = live.index
		trackedLook = nil
	end
	local duration = shot.Duration
	local t = math.clamp(workspace:GetServerTimeNow() - live.startedAt, 0, duration)
	local e = ease(t / duration, shot.Ease)

	local look = shot.From.Look:Lerp(shot.To.Look, e)
	local track = shot.Track
	if track then
		local model = workspace:FindFirstChild(track.Model)
		local root = if model and model:IsA("Model") then model.PrimaryPart else nil
		if root then
			local target = look:Lerp(root.Position + (track.Offset or Vector3.zero), track.Weight or 1)
			-- Ease the aim toward the moving thing so the camera glides rather than snaps.
			local k = 1 - math.exp(-dt * 5)
			trackedLook = if trackedLook then trackedLook:Lerp(target, k) else target
			look = trackedLook :: Vector3
		end
	end

	local plan = if settings.StarAvatar then shot.Avatar else nil
	local pov = plan ~= nil and settings.FirstPerson
	local pos: Vector3
	if plan then
		-- Your eyes: the planned spot until the avatar reaches its mark, then the real head,
		-- smoothed so footsteps give a gentle bob rather than a shake.
		local target = (placedIndex == live.index and headEye(plan)) or plannedEye(plan)
		if eyeIndex ~= live.index or not eyeSmoothed then
			eyeIndex = live.index
			eyeSmoothed = target
		else
			eyeSmoothed = (eyeSmoothed :: Vector3):Lerp(target, 1 - math.exp(-dt * 12))
		end
		local eye = eyeSmoothed :: Vector3
		if pov then
			pos = eye
		else
			-- Third person: hang back behind your shoulder.
			local flat = Vector3.new(look.X - eye.X, 0, look.Z - eye.Z)
			local back = if flat.Magnitude > 0.1 then flat.Unit else Vector3.zAxis
			pos = eye - back * 9 + Vector3.new(0, 2, 0)
		end
	else
		local from = shot.From.Pos or Vector3.new(0, 20, 0)
		pos = from:Lerp(shot.To.Pos or from, e)
	end
	hideBody(pov, pov and plan ~= nil and plan.Crouch == true)

	local frame = CFrame.lookAt(pos, look)
	if pov and settings.HeadSway > 0 then
		local s = settings.HeadSway
		local clock = os.clock()
		frame *= CFrame.Angles(
			(math.sin(clock * 1.1) * 0.0035 + math.sin(clock * 2.3) * 0.0012) * s,
			(math.sin(clock * 0.8 + 1) * 0.005) * s,
			math.sin(clock * 0.6 + 2) * 0.002 * s
		)
	end
	camera.CFrame = frame
	local defaultFov = if pov then settings.PovFov else settings.DefaultFov
	local fov0 = shot.From.Fov or defaultFov
	local fov1 = shot.To.Fov or fov0
	camera.FieldOfView = fov0 + (fov1 - fov0) * e

	-- Fades.
	local black = 0
	if shot.FadeIn and t < shot.FadeIn then
		black = 1 - t / shot.FadeIn
	end
	if shot.FadeOut and t > duration - shot.FadeOut then
		black = math.max(black, (t - (duration - shot.FadeOut)) / shot.FadeOut)
	end
	if ended then
		black = 1
	end
	fade.BackgroundTransparency = 1 - black

	-- Captions.
	local main, mainAlpha, small, smallAlpha = "", 0, "", 0
	if not ended then
		local captions: { Cutscene.Caption } = shot.Captions or {}
		for _, c in captions do
			local a = window(t, c.From, c.To, 0.8)
			if a > 0 then
				if c.Small then
					small, smallAlpha = c.Text, a
				else
					main, mainAlpha = c.Text, a
				end
			end
		end
	end
	setText(caption, main, mainAlpha)
	setText(smallCaption, small, smallAlpha)

	-- "Tap to continue": while a scene waits for a tap, or briefly at the start as a reminder.
	local hintText, hintAlpha = "", 0
	if settings.TapToSkip and not ended then
		if settings.WaitForTap and t >= duration then
			hintText, hintAlpha = "tap to continue  ›", 0.55 + 0.35 * math.sin(os.clock() * 3)
		elseif settings.TapHint and live.index == 1 then
			hintText, hintAlpha = "tap to skip ahead  ›", window(t, 3, 10, 1) * 0.8
		end
	end
	setText(hint, hintText, hintAlpha)

	-- Title card (stays up on the black after the last shot).
	local card = shot.Title
	if card then
		local a = if t >= card.From then math.min(1, (t - card.From) / 1.6) else 0
		setText(title, card.Text, a)
		setText(subtitle, card.Sub or "", math.clamp((t - card.From - 1.2) / 1.6, 0, 1))
	else
		setText(title, "", 0)
		setText(subtitle, "", 0)
	end
end

-- Your avatar's part in a shot -----------------------------------------------------------

local function playEmote(humanoid: Humanoid, name: string)
	local id = (Config.Animations :: any)[name] :: string?
	local animator = humanoid:FindFirstChildOfClass("Animator")
	if not id or not animator then
		return
	end
	pcall(function()
		local anim = Instance.new("Animation")
		anim.AnimationId = id
		animator:LoadAnimation(anim):Play()
	end)
end

local function direct(index: number)
	directedIndex = index
	if avatarThread then
		local old = avatarThread
		pcall(function()
			task.cancel(old)
		end)
	end
	local shot = shots[index]
	avatarThread = task.spawn(function()
		local char = player.Character or player.CharacterAdded:Wait()
		local humanoid = char:WaitForChild("Humanoid") :: Humanoid
		local root = char:WaitForChild("HumanoidRootPart") :: BasePart
		local plan = if settings.StarAvatar and shot then shot.Avatar else nil

		-- Stand up from any seat before moving to the next mark.
		if humanoid.SeatPart then
			humanoid.Sit = false
			local giveUp = os.clock() + 1
			while humanoid.SeatPart and os.clock() < giveUp do
				task.wait()
			end
		end
		humanoid:Move(Vector3.zero)

		if not plan then
			root.Anchored = true
			char:PivotTo(PARKED)
			placedIndex = index
			return
		end
		local standHeight = if humanoid.RigType == Enum.HumanoidRigType.R15 then humanoid.HipHeight + root.Size.Y / 2 else 3
		root.Anchored = false
		char:PivotTo(plan.At * CFrame.new(0, standHeight, 0))
		root.AssemblyLinearVelocity = Vector3.zero
		placedIndex = index

		if plan.Sit then
			remote:FireServer("Sit", plan.Sit)
		end
		local emote = plan.Emote
		if emote then
			task.delay(emote.At, function()
				if directedIndex == index then
					playEmote(humanoid, emote.Name)
				end
			end)
		end
		local walk = plan.Walk
		if walk then
			local speed = plan.Speed or 8
			humanoid.WalkSpeed = speed
			for _, point in walk do
				local reached = false
				local conn = humanoid.MoveToFinished:Connect(function()
					reached = true
				end)
				humanoid:MoveTo(point)
				local giveUp = os.clock() + (point - root.Position).Magnitude / speed + 3
				while not reached and os.clock() < giveUp do
					task.wait(0.1)
				end
				conn:Disconnect()
			end
		end
	end)
end

-- With friends (or strangers) in the same server, everyone walks the same marks. Each screen
-- shows only the town, so other people's avatars, name tags and chat bubbles are hidden here.
local function hideOthers()
	local function hideCharacter(char: Model)
		local function hide(d: Instance)
			if d:IsA("BasePart") then
				d.LocalTransparencyModifier = 1
			elseif d:IsA("Decal") then
				d.LocalTransparencyModifier = 1
			elseif d:IsA("Humanoid") then
				d.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None
			end
		end
		for _, d in char:GetDescendants() do
			hide(d)
		end
		char.DescendantAdded:Connect(hide)
	end
	local function watch(other: Player)
		if other == player then
			return
		end
		if other.Character then
			hideCharacter(other.Character)
		end
		other.CharacterAdded:Connect(hideCharacter)
	end
	for _, other in Players:GetPlayers() do
		watch(other)
	end
	Players.PlayerAdded:Connect(watch)
	pcall(function()
		local bubbles = TextChatService:FindFirstChildOfClass("BubbleChatConfiguration")
		if bubbles then
			bubbles.Enabled = false
		end
	end)
end

local function takeOverControls()
	pcall(function()
		local playerModule = require(player:WaitForChild("PlayerScripts"):WaitForChild("PlayerModule") :: ModuleScript) :: any
		playerModule:GetControls():Disable()
	end)
	pcall(function()
		GuiService.TouchControlsEnabled = false
	end)
	pcall(function()
		ProximityPromptService.Enabled = false
	end)
end

function Cinematic.Init()
	build()
	task.spawn(hideRobloxUI)
	task.spawn(takeOverControls)
	hideOthers()
	remote = ReplicatedStorage:WaitForChild("SomewhereRemotes"):WaitForChild("Cutscene") :: RemoteEvent
	remote.OnClientEvent:Connect(function(payload: { kind: string, index: number?, startedAt: number? })
		if payload.kind == "shot" and payload.index and payload.startedAt then
			current = { index = payload.index, startedAt = payload.startedAt }
			ended = false
			if payload.index ~= directedIndex then
				direct(payload.index)
			end
		elseif payload.kind == "end" then
			ended = true
		end
	end)
	-- A tap or click moves on to the next scene.
	UserInputService.InputBegan:Connect(function(input, processed)
		local tap = input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch
		if tap and not processed and settings.TapToSkip and current and not ended and os.clock() - lastTap > 0.6 then
			lastTap = os.clock()
			remote:FireServer("Next")
		end
	end)
	RunService:BindToRenderStep("SomewhereCinematic", Enum.RenderPriority.Camera.Value + 1, step)
	-- Directors can press R to roll the whole thing again (handy for retakes).
	UserInputService.InputBegan:Connect(function(input, processed)
		if not processed and input.KeyCode == Enum.KeyCode.R and player:GetAttribute("IsDirector") then
			remote:FireServer("Restart")
		end
	end)
	remote:FireServer("Ready")
end

return Cinematic
