--!strict
-- Townspeople. Marv runs the store, Dot runs the diner, Hollis gardens, Wendell fishes.
-- Event visitors (like the traveler) are spawned through the same API.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("SomewhereShared")
local Config = require(Shared:WaitForChild("Config"))
local Text = require(Shared:WaitForChild("Text"))
local Props = require(script.Parent.Parent.World.Props)

local NPCs = {}

local rgb = Color3.fromRGB

export type Def = {
	Name: string,
	Anchor: string?,
	CFrame: CFrame?,
	Skin: Color3,
	Shirt: Color3,
	Pants: Color3,
	LongSleeves: boolean?,
	Hat: string?,
	HatColor: Color3?,
	Apron: Color3?,
	Holds: string?,
	Talk: boolean?,
	Wander: number?, -- radius to potter about in
}

export type NPC = {
	Name: string,
	Model: Model,
	Humanoid: Humanoid,
	Root: BasePart,
	Home: CFrame,
	Busy: boolean,
	Def: Def,
	Say: (self: NPC, text: string, seconds: number?) -> (),
	WalkTo: (self: NPC, target: Vector3, timeout: number?) -> boolean,
	WalkPath: (self: NPC, points: { Vector3 }) -> boolean,
	Face: (self: NPC, target: Vector3) -> (),
	Play: (self: NPC, anim: string, looped: boolean?) -> AnimationTrack?,
	SitOn: (self: NPC, seat: Seat) -> (),
	Stand: (self: NPC) -> (),
	GoHome: (self: NPC) -> (),
	Destroy: (self: NPC) -> (),
}

local RESIDENTS: { Def } = {
	{
		Name = "Marv",
		Anchor = "NPC_Marv",
		Skin = rgb(224, 172, 136),
		Shirt = rgb(220, 214, 200),
		Pants = rgb(70, 76, 92),
		Hat = "Cap",
		HatColor = rgb(54, 96, 80),
		Apron = rgb(54, 96, 80),
		Talk = true,
	},
	{
		Name = "Dot",
		Anchor = "NPC_Dot",
		Skin = rgb(160, 112, 86),
		Shirt = rgb(176, 214, 220),
		Pants = rgb(60, 64, 80),
		Hat = "Bun",
		HatColor = rgb(70, 50, 40),
		Apron = rgb(250, 248, 240),
		Talk = true,
	},
	{
		Name = "Hollis",
		Anchor = "NPC_Hollis",
		Skin = rgb(236, 196, 166),
		Shirt = rgb(120, 150, 110),
		Pants = rgb(150, 120, 90),
		LongSleeves = true,
		Hat = "Straw",
		HatColor = rgb(226, 202, 140),
		Talk = true,
		Wander = 6,
	},
	{
		Name = "Wendell",
		Anchor = "NPC_Wendell",
		Skin = rgb(120, 82, 62),
		Shirt = rgb(176, 90, 70),
		Pants = rgb(80, 90, 110),
		LongSleeves = true,
		Hat = "Bucket",
		HatColor = rgb(120, 130, 100),
		Holds = "FishingRod",
		Talk = true,
	},
}

local ctx: any
local folder: Folder
local byName: { [string]: NPC } = {}
local animCache: { [string]: Animation } = {}

local function anchorCFrame(name: string): CFrame?
	for _, d in (ctx.Town :: Instance):GetDescendants() do
		if d:IsA("BasePart") and d:GetAttribute("Anchor") == name then
			return d.CFrame
		end
	end
	return nil
end
NPCs.AnchorCFrame = anchorCFrame

local function animation(id: string): Animation
	local cached = animCache[id]
	if cached then
		return cached
	end
	local a = Instance.new("Animation")
	a.AnimationId = id
	animCache[id] = a
	return a
end

-- Fallback rig if the avatar service is unavailable: a plain blocky R6 figure.
local function blockyRig(def: Def): Model
	local m = Instance.new("Model")
	local function limb(name: string, size: Vector3, color: Color3): BasePart
		local p = Instance.new("Part")
		p.Name = name
		p.Size = size
		p.Color = color
		p.TopSurface = Enum.SurfaceType.Smooth
		p.BottomSurface = Enum.SurfaceType.Smooth
		p.Parent = m
		return p
	end
	local root = limb("HumanoidRootPart", Vector3.new(2, 2, 1), def.Shirt)
	root.Transparency = 1
	local torso = limb("Torso", Vector3.new(2, 2, 1), def.Shirt)
	local head = limb("Head", Vector3.new(2, 1, 1), def.Skin)
	local arms = if def.LongSleeves then def.Shirt else def.Skin
	local la = limb("Left Arm", Vector3.new(1, 2, 1), arms)
	local ra = limb("Right Arm", Vector3.new(1, 2, 1), arms)
	local ll = limb("Left Leg", Vector3.new(1, 2, 1), def.Pants)
	local rl = limb("Right Leg", Vector3.new(1, 2, 1), def.Pants)
	local function joint(name: string, p0: BasePart, p1: BasePart, c0: CFrame, c1: CFrame)
		local j = Instance.new("Motor6D")
		j.Name = name
		j.Part0 = p0
		j.Part1 = p1
		j.C0 = c0
		j.C1 = c1
		j.Parent = p0
	end
	joint("RootJoint", root, torso, CFrame.new(), CFrame.new())
	joint("Neck", torso, head, CFrame.new(0, 1, 0), CFrame.new(0, -0.5, 0))
	joint("Left Shoulder", torso, la, CFrame.new(-1, 0.5, 0), CFrame.new(0.5, 0.5, 0))
	joint("Right Shoulder", torso, ra, CFrame.new(1, 0.5, 0), CFrame.new(-0.5, 0.5, 0))
	joint("Left Hip", torso, ll, CFrame.new(-1, -1, 0), CFrame.new(-0.5, 1, 0))
	joint("Right Hip", torso, rl, CFrame.new(1, -1, 0), CFrame.new(0.5, 1, 0))
	local humanoid = Instance.new("Humanoid")
	humanoid.RigType = Enum.HumanoidRigType.R6
	humanoid.Parent = m
	m.PrimaryPart = root
	return m
end

local function makeRig(def: Def): Model
	local ok, model = pcall(function()
		local desc = Instance.new("HumanoidDescription")
		desc.HeadColor = def.Skin
		desc.TorsoColor = def.Shirt
		desc.LeftArmColor = if def.LongSleeves then def.Shirt else def.Skin
		desc.RightArmColor = if def.LongSleeves then def.Shirt else def.Skin
		desc.LeftLegColor = def.Pants
		desc.RightLegColor = def.Pants
		return Players:CreateHumanoidModelFromDescription(desc, Enum.HumanoidRigType.R15)
	end)
	if ok and model then
		return model
	end
	warn("[Somewhere] Avatar rig unavailable, using a blocky stand-in for " .. def.Name)
	return blockyRig(def)
end

local function weldTo(part: BasePart, target: BasePart, offset: CFrame)
	part.Anchored = false
	part.Massless = true
	part.CanCollide = false
	part.CFrame = target.CFrame * offset
	local w = Instance.new("WeldConstraint")
	w.Part0 = target
	w.Part1 = part
	w.Parent = part
end

local function dress(model: Model, def: Def)
	local head = model:FindFirstChild("Head") :: BasePart?
	local torso = (model:FindFirstChild("UpperTorso") or model:FindFirstChild("Torso")) :: BasePart?
	local hand = (model:FindFirstChild("RightHand") or model:FindFirstChild("Right Arm")) :: BasePart?
	if def.Hat and head then
		local hat = Props.hat(model, def.Hat, def.HatColor or rgb(200, 200, 200))
		for _, p in hat:GetDescendants() do
			if p:IsA("BasePart") then
				local offset = p.CFrame
				weldTo(p, head, CFrame.new(0, head.Size.Y / 2 + 0.05, 0) * offset)
			end
		end
	end
	if def.Apron and torso then
		local apron = Props.apron(model, def.Apron)
		weldTo(apron, torso, CFrame.new(0, -0.35, -torso.Size.Z / 2 - 0.06))
	end
	if def.Holds == "FishingRod" and hand then
		local rod = Props.fishingRod(model)
		for _, p in rod:GetDescendants() do
			if p:IsA("BasePart") then
				local offset = p.CFrame
				weldTo(p, hand, CFrame.new(0, -0.3, 0) * CFrame.Angles(math.rad(35), 0, 0) * offset)
			end
		end
	end
end

-- A speech bubble over any part (a head, or a truck driver's head).
local function bubbleOn(head: BasePart, speaker: string, text: string, seconds: number)
	local old = head:FindFirstChild("Speech")
	if old then
		old:Destroy()
	end
	local gui = Instance.new("BillboardGui")
	gui.Name = "Speech"
	gui.Size = UDim2.fromOffset(260, 96)
	gui.StudsOffsetWorldSpace = Vector3.new(0, 3.4, 0)
	gui.MaxDistance = 70
	gui.LightInfluence = 0
	gui.AlwaysOnTop = false
	gui.Parent = head
	local frame = Instance.new("Frame")
	frame.AnchorPoint = Vector2.new(0.5, 1)
	frame.Position = UDim2.fromScale(0.5, 1)
	frame.Size = UDim2.fromScale(1, 0)
	frame.AutomaticSize = Enum.AutomaticSize.Y
	frame.BackgroundColor3 = rgb(252, 249, 242)
	frame.BackgroundTransparency = 0.06
	frame.Parent = gui
	local corner = Instance.new("UICorner")
	corner.CornerRadius = UDim.new(0, 12)
	corner.Parent = frame
	local pad = Instance.new("UIPadding")
	pad.PaddingTop = UDim.new(0, 7)
	pad.PaddingBottom = UDim.new(0, 7)
	pad.PaddingLeft = UDim.new(0, 10)
	pad.PaddingRight = UDim.new(0, 10)
	pad.Parent = frame
	local label = Instance.new("TextLabel")
	label.BackgroundTransparency = 1
	label.Size = UDim2.fromScale(1, 0)
	label.AutomaticSize = Enum.AutomaticSize.Y
	label.FontFace = Font.fromEnum(Enum.Font.BuilderSans)
	label.TextSize = 17
	label.TextWrapped = true
	label.RichText = true
	label.TextColor3 = rgb(44, 40, 38)
	label.Text = `<b>{speaker}</b>  {text}`
	label.Parent = frame
	task.delay(seconds, function()
		if gui.Parent then
			gui:Destroy()
		end
	end)
end
NPCs.Bubble = bubbleOn

local function bubble(npc: NPC, text: string, seconds: number)
	local head = npc.Model:FindFirstChild("Head") :: BasePart?
	if head then
		bubbleOn(head, npc.Name, text, seconds)
	end
end

local function newNPC(def: Def, home: CFrame): NPC
	local model = makeRig(def)
	model.Name = def.Name
	local animate = model:FindFirstChild("Animate")
	if animate then
		animate:Destroy()
	end
	local humanoid = model:FindFirstChildOfClass("Humanoid") :: Humanoid
	humanoid.DisplayDistanceType = Enum.HumanoidDisplayDistanceType.None
	humanoid.WalkSpeed = 9
	humanoid.BreakJointsOnDeath = false
	humanoid:SetStateEnabled(Enum.HumanoidStateType.Dead, false)
	local animator = humanoid:FindFirstChildOfClass("Animator") or Instance.new("Animator")
	animator.Parent = humanoid
	dress(model, def)
	model.Parent = folder
	model:PivotTo(home)
	local root = model:FindFirstChild("HumanoidRootPart") :: BasePart
	pcall(function()
		root:SetNetworkOwner(nil)
	end)

	local tracks: { [string]: AnimationTrack } = {}
	local npc = {
		Name = def.Name,
		Model = model,
		Humanoid = humanoid,
		Root = root,
		Home = home,
		Busy = false,
		Def = def,
	} :: any

	function npc.Play(self: NPC, anim: string, looped: boolean?): AnimationTrack?
		local id = (Config.Animations :: any)[anim]
		if not id or humanoid.RigType ~= Enum.HumanoidRigType.R15 then
			return nil
		end
		local track = tracks[anim]
		if not track then
			local ok, loaded = pcall(function()
				return animator:LoadAnimation(animation(id))
			end)
			if not ok or not loaded then
				return nil
			end
			track = loaded
			tracks[anim] = track
		end
		if looped and track.IsPlaying then
			return track -- already going; restarting it every call would make walks stutter
		end
		track.Looped = looped == true
		if anim == "Idle" or anim == "Walk" or anim == "Sit" then
			for name, other in tracks do
				if (name == "Idle" or name == "Walk" or name == "Sit") and name ~= anim then
					other:Stop(0.3)
				end
			end
		end
		track:Play(0.3)
		return track
	end

	function npc.Say(self: NPC, text: string, seconds: number?)
		bubble(self, text, seconds or math.clamp(#text / 14, 3.5, 8))
	end

	function npc.Face(self: NPC, target: Vector3)
		local pos = root.Position
		local flat = Vector3.new(target.X, pos.Y, target.Z)
		if (flat - pos).Magnitude > 0.1 then
			model:PivotTo(CFrame.lookAt(pos, flat))
		end
	end

	function npc.WalkTo(self: NPC, target: Vector3, timeout: number?): boolean
		if humanoid.Sit then
			humanoid.Sit = false
			task.wait(0.3)
		end
		self:Play("Walk", true)
		local deadline = os.clock() + (timeout or 20)
		local reached = false
		while os.clock() < deadline and model.Parent do
			humanoid:MoveTo(target)
			local flat = Vector3.new(target.X - root.Position.X, 0, target.Z - root.Position.Z)
			if flat.Magnitude < 2.2 then
				reached = true
				break
			end
			task.wait(0.25)
		end
		humanoid:Move(Vector3.zero)
		self:Play("Idle", true)
		return reached
	end

	function npc.WalkPath(self: NPC, points: { Vector3 }): boolean
		for _, p in points do
			if not self:WalkTo(p) then
				return false
			end
		end
		return true
	end

	function npc.SitOn(self: NPC, seat: Seat)
		seat:Sit(humanoid)
		self:Play("Sit", true)
	end

	function npc.Stand(self: NPC)
		humanoid.Sit = false
		self:Play("Idle", true)
	end

	function npc.GoHome(self: NPC)
		self:Stand()
		model:PivotTo(self.Home)
	end

	function npc.Destroy(self: NPC)
		if byName[self.Name] == self then
			byName[self.Name] = nil
		end
		model:Destroy()
	end

	npc:Play("Idle", true)
	return npc :: NPC
end

function NPCs.Get(name: string): NPC?
	local npc = byName[name]
	if npc and npc.Model.Parent then
		return npc
	end
	return nil
end

-- True if this resident exists and isn't already part of something.
function NPCs.Available(name: string): boolean
	local npc = NPCs.Get(name)
	return npc ~= nil and not npc.Busy
end

local function attachTalk(npc: NPC)
	local lines = (Text.NPC :: any)[npc.Name] :: { string }?
	if not lines then
		return
	end
	local index = 0
	ctx.Interactions.Add(npc.Root, {
		ActionText = "Talk",
		ObjectText = npc.Name,
		MaxDistance = 9,
	}, function(player: Player)
		index = index % #lines + 1
		local character = player.Character
		local proot = character and character:FindFirstChild("HumanoidRootPart") :: BasePart?
		if proot and not npc.Busy and not npc.Humanoid.Sit then
			npc:Face(proot.Position)
		end
		npc:Say(lines[index])
	end)
end

function NPCs.Spawn(def: Def): NPC?
	local home = def.CFrame or (def.Anchor and anchorCFrame(def.Anchor))
	if not home then
		warn("[Somewhere] No spot for " .. def.Name)
		return nil
	end
	local npc = newNPC(def, home)
	byName[def.Name] = npc
	if def.Talk then
		attachTalk(npc)
	end
	return npc
end

-- Residents mutter to themselves now and then if someone's nearby, and Hollis potters about.
local function ambientLoop(npc: NPC)
	local rng = Random.new()
	while npc.Model.Parent do
		task.wait(rng:NextNumber(40, 110))
		if not npc.Busy and npc.Model.Parent then
			local near = false
			for _, player in Players:GetPlayers() do
				local root = player.Character and player.Character:FindFirstChild("HumanoidRootPart") :: BasePart?
				if root and (root.Position - npc.Root.Position).Magnitude < 24 then
					near = true
					break
				end
			end
			local wander = npc.Def.Wander
			if wander and rng:NextNumber() < 0.6 then
				local offset = Vector3.new(rng:NextNumber(-wander, wander), 0, rng:NextNumber(-wander, wander))
				npc:WalkTo(npc.Home.Position + offset, 8)
				npc:Face(npc.Home.Position + npc.Home.LookVector * 10)
			end
			local lines = (Text.Ambient :: any)[npc.Name] :: { string }?
			if near and lines then
				npc:Say(lines[rng:NextInteger(1, #lines)])
			end
		end
	end
end

function NPCs.Init(context: any)
	ctx = context
	local existing = workspace:FindFirstChild("SomewhereNPCs")
	if existing and existing:IsA("Folder") then
		folder = existing
	else
		local f = Instance.new("Folder")
		f.Name = "SomewhereNPCs"
		f.Parent = workspace
		folder = f
	end
	for _, def in RESIDENTS do
		task.spawn(function()
			local npc = NPCs.Spawn(def)
			if npc then
				ambientLoop(npc)
			end
		end)
	end
end

return NPCs
