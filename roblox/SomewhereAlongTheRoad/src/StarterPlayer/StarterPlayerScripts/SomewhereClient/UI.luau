--!strict
-- The little bit of UI there is: an opening title, a quiet objective line, a journal,
-- note cards for things you read, and soft toasts. Sized for phones first.

local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("SomewhereShared")
local Config = require(Shared:WaitForChild("Config"))
local Text = require(Shared:WaitForChild("Text"))

local UI = {}

local rgb = Color3.fromRGB
local player = Players.LocalPlayer
local INK = rgb(44, 40, 38)
local PAPER = rgb(250, 246, 236)
local DARK = rgb(24, 26, 30)

local TITLE_FONT = Font.new("rbxasset://fonts/families/Merriweather.json", Enum.FontWeight.Bold)
local BODY_FONT = Font.fromEnum(Enum.Font.BuilderSans)
local BODY_BOLD = Font.new(BODY_FONT.Family, Enum.FontWeight.Bold)

local gui: ScreenGui
local objective: TextButton
local journal: Frame
local journalList: ScrollingFrame
local noteCard: CanvasGroup
local noteTitle: TextLabel
local noteBody: TextLabel
local toastLabel: TextLabel
local hintLabel: TextLabel

local found: { { title: string, body: string } } = {}
local count, goal = 0, Config.Objective.Goal
local toastQueue: { string } = {}
local toastBusy = false
local noteToken = 0

local function corner(parent: Instance, radius: number)
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0, radius)
	c.Parent = parent
end

local function padding(parent: Instance, px: number)
	local p = Instance.new("UIPadding")
	p.PaddingTop = UDim.new(0, px)
	p.PaddingBottom = UDim.new(0, px)
	p.PaddingLeft = UDim.new(0, px + 2)
	p.PaddingRight = UDim.new(0, px + 2)
	p.Parent = parent
end

local function label(parent: Instance, text: string, font: Font, size: number, color: Color3): TextLabel
	local l = Instance.new("TextLabel")
	l.BackgroundTransparency = 1
	l.FontFace = font
	l.TextSize = size
	l.TextColor3 = color
	l.TextWrapped = true
	l.Text = text
	l.Size = UDim2.fromScale(1, 0)
	l.AutomaticSize = Enum.AutomaticSize.Y
	l.TextXAlignment = Enum.TextXAlignment.Left
	l.Parent = parent
	return l
end

local function closeButton(parent: Instance, onClick: () -> ()): TextButton
	local b = Instance.new("TextButton")
	b.Name = "Close"
	b.AnchorPoint = Vector2.new(1, 0)
	b.Position = UDim2.new(1, 4, 0, -4)
	b.Size = UDim2.fromOffset(48, 48)
	b.BackgroundTransparency = 1
	b.Text = "×"
	b.FontFace = BODY_BOLD
	b.TextSize = 30
	b.TextColor3 = INK
	b.ZIndex = 5
	b.Parent = parent
	b.Activated:Connect(onClick)
	return b
end

local function refreshObjective()
	if count >= goal then
		objective.Text = `✦  Things found: {count}`
	else
		objective.Text = `✦  Find {goal} interesting things · {count}/{goal}`
	end
end

local function rebuildJournal()
	for _, child in journalList:GetChildren() do
		if child:IsA("Frame") or child:IsA("TextLabel") then
			child:Destroy()
		end
	end
	if #found == 0 then
		local empty = label(journalList, "Nothing yet. Try the bus stop guestbook, the diner, or the trail into the woods.", BODY_FONT, 17, rgb(110, 104, 98))
		empty.LayoutOrder = 1
		return
	end
	for i = #found, 1, -1 do
		local entry = found[i]
		local item = Instance.new("Frame")
		item.BackgroundTransparency = 1
		item.Size = UDim2.fromScale(1, 0)
		item.AutomaticSize = Enum.AutomaticSize.Y
		item.LayoutOrder = #found - i
		item.Parent = journalList
		local list = Instance.new("UIListLayout")
		list.Padding = UDim.new(0, 4)
		list.SortOrder = Enum.SortOrder.LayoutOrder
		list.Parent = item
		local t = label(item, entry.title, TITLE_FONT, 18, INK)
		t.LayoutOrder = 1
		local b = label(item, entry.body, BODY_FONT, 16, rgb(80, 74, 70))
		b.LayoutOrder = 2
	end
end

function UI.SetObjective(c: number, g: number)
	count, goal = c, g
	refreshObjective()
end

function UI.ShowNote(title: string, body: string)
	noteToken += 1
	local token = noteToken
	noteTitle.Text = title
	noteBody.Text = body
	noteCard.Visible = true
	noteCard.GroupTransparency = 1
	TweenService:Create(noteCard, TweenInfo.new(0.25), { GroupTransparency = 0 }):Play()
	-- Close by itself after a while, or once you walk away.
	local character = player.Character
	local root = character and character:FindFirstChild("HumanoidRootPart") :: BasePart?
	local origin = root and root.Position
	local readTime = math.clamp(#body / 12, 8, 22)
	task.spawn(function()
		local started = os.clock()
		while noteToken == token and noteCard.Visible do
			local r = player.Character and player.Character:FindFirstChild("HumanoidRootPart") :: BasePart?
			local walkedAway = origin and r and (r.Position - origin).Magnitude > 16
			if os.clock() - started > readTime or walkedAway then
				UI.HideNote()
				break
			end
			task.wait(0.3)
		end
	end)
end

function UI.HideNote()
	noteToken += 1
	local tween = TweenService:Create(noteCard, TweenInfo.new(0.2), { GroupTransparency = 1 })
	tween:Play()
	tween.Completed:Once(function()
		if noteCard.GroupTransparency > 0.95 then
			noteCard.Visible = false
		end
	end)
end

function UI.Toast(text: string)
	table.insert(toastQueue, text)
	if toastBusy then
		return
	end
	toastBusy = true
	task.spawn(function()
		while #toastQueue > 0 do
			local t = table.remove(toastQueue, 1) :: string
			toastLabel.Text = t
			local hold = math.clamp(#t / 16, 2.8, 6)
			TweenService:Create(toastLabel, TweenInfo.new(0.3), { TextTransparency = 0, BackgroundTransparency = 0.25 }):Play()
			task.wait(hold)
			TweenService:Create(toastLabel, TweenInfo.new(0.4), { TextTransparency = 1, BackgroundTransparency = 1 }):Play()
			task.wait(0.45)
		end
		toastBusy = false
	end)
end

function UI.Hint(text: string)
	hintLabel.Text = text
	TweenService:Create(hintLabel, TweenInfo.new(1.2), { TextTransparency = 0.1 }):Play()
	task.delay(5.5, function()
		if hintLabel.Text == text then
			TweenService:Create(hintLabel, TweenInfo.new(1.5), { TextTransparency = 1 }):Play()
		end
	end)
end

function UI.Discovered(title: string, body: string, c: number, g: number)
	table.insert(found, { title = title, body = body })
	UI.SetObjective(c, g)
	rebuildJournal()
	UI.Toast(`✦  Found: {title}`)
end

function UI.SetVisible(visible: boolean)
	gui.Enabled = visible
end

function UI.Gui(): ScreenGui
	return gui
end

local function titleCard()
	local cover = Instance.new("Frame")
	cover.Name = "TitleCard"
	cover.Size = UDim2.fromScale(1, 1)
	cover.BackgroundColor3 = rgb(10, 10, 12)
	cover.BorderSizePixel = 0
	cover.ZIndex = 20
	cover.Parent = gui
	local title = Instance.new("TextLabel")
	title.AnchorPoint = Vector2.new(0.5, 0.5)
	title.Position = UDim2.fromScale(0.5, 0.44)
	title.Size = UDim2.fromScale(0.86, 0.14)
	title.BackgroundTransparency = 1
	title.FontFace = TITLE_FONT
	title.TextScaled = true
	title.TextColor3 = rgb(252, 246, 232)
	title.TextTransparency = 1
	title.Text = Config.GameName
	title.ZIndex = 21
	title.Parent = gui
	local limit = Instance.new("UITextSizeConstraint")
	limit.MaxTextSize = 60
	limit.Parent = title
	local sub = Instance.new("TextLabel")
	sub.AnchorPoint = Vector2.new(0.5, 0)
	sub.Position = UDim2.fromScale(0.5, 0.53)
	sub.Size = UDim2.new(0.8, 0, 0, 30)
	sub.BackgroundTransparency = 1
	sub.FontFace = Font.new(BODY_FONT.Family, Enum.FontWeight.Regular, Enum.FontStyle.Italic)
	sub.TextSize = 20
	sub.TextColor3 = rgb(236, 228, 214)
	sub.TextTransparency = 1
	sub.Text = Text.Lines.TitleSub
	sub.ZIndex = 21
	sub.Parent = gui

	task.spawn(function()
		TweenService:Create(title, TweenInfo.new(1.6), { TextTransparency = 0 }):Play()
		task.wait(1.2)
		TweenService:Create(sub, TweenInfo.new(1.4), { TextTransparency = 0.1 }):Play()
		task.wait(1.2)
		TweenService:Create(cover, TweenInfo.new(3, Enum.EasingStyle.Sine), { BackgroundTransparency = 1 }):Play()
		task.wait(3.5)
		TweenService:Create(title, TweenInfo.new(2), { TextTransparency = 1 }):Play()
		TweenService:Create(sub, TweenInfo.new(2), { TextTransparency = 1 }):Play()
		task.wait(2.2)
		cover:Destroy()
		title:Destroy()
		sub:Destroy()
	end)
end

function UI.Init()
	gui = Instance.new("ScreenGui")
	gui.Name = "SomewhereUI"
	gui.ResetOnSpawn = false
	gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
	gui.ScreenInsets = Enum.ScreenInsets.CoreUISafeInsets
	gui.Parent = player:WaitForChild("PlayerGui")

	-- Scale everything gently with the screen; phones get slightly smaller but still thumb-sized.
	local scale = Instance.new("UIScale")
	scale.Parent = gui
	local camera = workspace.CurrentCamera
	local function rescale()
		local v = camera.ViewportSize
		scale.Scale = math.clamp(math.min(v.X, v.Y) / 720, 0.85, 1.2)
	end
	camera:GetPropertyChangedSignal("ViewportSize"):Connect(rescale)
	rescale()

	-- Objective line (tap it to open the journal).
	objective = Instance.new("TextButton")
	objective.Name = "Objective"
	objective.Position = UDim2.fromOffset(12, 10)
	objective.Size = UDim2.fromOffset(0, 44)
	objective.AutomaticSize = Enum.AutomaticSize.X
	objective.BackgroundColor3 = DARK
	objective.BackgroundTransparency = 0.45
	objective.FontFace = BODY_BOLD
	objective.TextSize = 17
	objective.TextColor3 = rgb(250, 244, 230)
	objective.AutoButtonColor = true
	objective.Parent = gui
	corner(objective, 22)
	local opad = Instance.new("UIPadding")
	opad.PaddingLeft = UDim.new(0, 16)
	opad.PaddingRight = UDim.new(0, 16)
	opad.Parent = objective
	refreshObjective()

	-- Journal.
	journal = Instance.new("Frame")
	journal.Name = "Journal"
	journal.AnchorPoint = Vector2.new(0.5, 0.5)
	journal.Position = UDim2.fromScale(0.5, 0.5)
	journal.Size = UDim2.new(0.92, 0, 0.74, 0)
	journal.BackgroundColor3 = PAPER
	journal.Visible = false
	journal.ZIndex = 4
	journal.Parent = gui
	corner(journal, 16)
	padding(journal, 16)
	local jmax = Instance.new("UISizeConstraint")
	jmax.MaxSize = Vector2.new(480, 620)
	jmax.Parent = journal
	local jtitle = label(journal, "Journal", TITLE_FONT, 22, INK)
	jtitle.Size = UDim2.new(1, -48, 0, 32)
	jtitle.AutomaticSize = Enum.AutomaticSize.None
	closeButton(journal, function()
		journal.Visible = false
	end)
	journalList = Instance.new("ScrollingFrame")
	journalList.Position = UDim2.fromOffset(0, 44)
	journalList.Size = UDim2.new(1, 0, 1, -44)
	journalList.BackgroundTransparency = 1
	journalList.BorderSizePixel = 0
	journalList.ScrollBarThickness = 4
	journalList.ScrollBarImageColor3 = rgb(160, 150, 140)
	journalList.CanvasSize = UDim2.new()
	journalList.AutomaticCanvasSize = Enum.AutomaticSize.Y
	journalList.ScrollingDirection = Enum.ScrollingDirection.Y
	journalList.Parent = journal
	local jlist = Instance.new("UIListLayout")
	jlist.Padding = UDim.new(0, 14)
	jlist.SortOrder = Enum.SortOrder.LayoutOrder
	jlist.Parent = journalList
	rebuildJournal()
	objective.Activated:Connect(function()
		journal.Visible = not journal.Visible
	end)

	-- Note card for things you read.
	local group = Instance.new("CanvasGroup")
	group.Name = "Note"
	group.AnchorPoint = Vector2.new(0.5, 0.5)
	group.Position = UDim2.fromScale(0.5, 0.46)
	group.Size = UDim2.new(0.92, 0, 0, 0)
	group.AutomaticSize = Enum.AutomaticSize.Y
	group.BackgroundColor3 = PAPER
	group.Visible = false
	group.ZIndex = 3
	group.Parent = gui
	noteCard = group
	corner(group, 14)
	padding(group, 18)
	local nmax = Instance.new("UISizeConstraint")
	nmax.MaxSize = Vector2.new(520, math.huge)
	nmax.Parent = group
	local nlist = Instance.new("UIListLayout")
	nlist.Padding = UDim.new(0, 8)
	nlist.SortOrder = Enum.SortOrder.LayoutOrder
	nlist.Parent = group
	noteTitle = label(group, "", TITLE_FONT, 20, INK)
	noteTitle.Size = UDim2.new(1, -40, 0, 0)
	noteTitle.LayoutOrder = 1
	noteBody = label(group, "", BODY_FONT, 18, rgb(70, 64, 60))
	noteBody.LayoutOrder = 2
	-- The close button lives in a zero-height holder so it sits outside the list flow.
	local holder = Instance.new("Frame")
	holder.BackgroundTransparency = 1
	holder.Size = UDim2.fromScale(1, 0)
	holder.LayoutOrder = 0
	holder.Parent = group
	local close = closeButton(holder, UI.HideNote)
	close.Position = UDim2.new(1, 8, 0, -10)

	-- Toast and hint lines.
	toastLabel = Instance.new("TextLabel")
	toastLabel.Name = "Toast"
	toastLabel.AnchorPoint = Vector2.new(0.5, 0)
	toastLabel.Position = UDim2.new(0.5, 0, 0, 64)
	toastLabel.Size = UDim2.fromOffset(0, 40)
	toastLabel.AutomaticSize = Enum.AutomaticSize.X
	toastLabel.BackgroundColor3 = DARK
	toastLabel.BackgroundTransparency = 1
	toastLabel.FontFace = BODY_BOLD
	toastLabel.TextSize = 17
	toastLabel.TextColor3 = rgb(252, 246, 232)
	toastLabel.TextTransparency = 1
	toastLabel.Text = ""
	toastLabel.Parent = gui
	corner(toastLabel, 20)
	local tpad = Instance.new("UIPadding")
	tpad.PaddingLeft = UDim.new(0, 18)
	tpad.PaddingRight = UDim.new(0, 18)
	tpad.Parent = toastLabel

	hintLabel = Instance.new("TextLabel")
	hintLabel.Name = "Hint"
	hintLabel.AnchorPoint = Vector2.new(0.5, 0)
	hintLabel.Position = UDim2.new(0.5, 0, 0, 112)
	hintLabel.Size = UDim2.new(0.8, 0, 0, 28)
	hintLabel.BackgroundTransparency = 1
	hintLabel.FontFace = Font.new(BODY_FONT.Family, Enum.FontWeight.Medium, Enum.FontStyle.Italic)
	hintLabel.TextSize = 18
	hintLabel.TextColor3 = rgb(255, 250, 240)
	hintLabel.TextStrokeTransparency = 0.6
	hintLabel.TextTransparency = 1
	hintLabel.TextWrapped = true
	hintLabel.Text = ""
	hintLabel.Parent = gui

	titleCard()
end

return UI
