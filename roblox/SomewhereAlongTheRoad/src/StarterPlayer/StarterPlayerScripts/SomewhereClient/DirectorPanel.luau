--!strict
-- Trailer tools for whoever owns the game (and for you, in Studio): trigger events, set the hour,
-- pin the weather, jump to landmarks, hide every bit of UI for clean footage.

local GuiService = game:GetService("GuiService")
local HttpService = game:GetService("HttpService")
local Lighting = game:GetService("Lighting")
local Players = game:GetService("Players")
local ProximityPromptService = game:GetService("ProximityPromptService")
local StarterGui = game:GetService("StarterGui")
local UserInputService = game:GetService("UserInputService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local DirectorPanel = {}

local rgb = Color3.fromRGB
local player = Players.LocalPlayer
local FONT = Font.fromEnum(Enum.Font.BuilderSans)
local BOLD = Font.new(FONT.Family, Enum.FontWeight.Bold)

local remote: RemoteEvent
local state: Folder
local panel: Frame
local status: TextLabel
local trailerMode = false
local mainGui: ScreenGui
local restore: TextButton

local function send(action: string, arg: any?)
	remote:FireServer(action, arg)
end

local function button(parent: Instance, text: string, onClick: () -> ()): TextButton
	local b = Instance.new("TextButton")
	b.Size = UDim2.fromOffset(0, 44)
	b.AutomaticSize = Enum.AutomaticSize.X
	b.BackgroundColor3 = rgb(54, 58, 66)
	b.TextColor3 = rgb(244, 240, 232)
	b.FontFace = FONT
	b.TextSize = 16
	b.Text = text
	b.Parent = parent
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0, 10)
	c.Parent = b
	local pad = Instance.new("UIPadding")
	pad.PaddingLeft = UDim.new(0, 12)
	pad.PaddingRight = UDim.new(0, 12)
	pad.Parent = b
	b.Activated:Connect(onClick)
	return b
end

local function section(parent: Instance, title: string, order: number): Frame
	local header = Instance.new("TextLabel")
	header.BackgroundTransparency = 1
	header.Size = UDim2.new(1, 0, 0, 26)
	header.FontFace = BOLD
	header.TextSize = 15
	header.TextColor3 = rgb(200, 196, 186)
	header.TextXAlignment = Enum.TextXAlignment.Left
	header.Text = string.upper(title)
	header.LayoutOrder = order
	header.Parent = parent
	local row = Instance.new("Frame")
	row.BackgroundTransparency = 1
	row.Size = UDim2.fromScale(1, 0)
	row.AutomaticSize = Enum.AutomaticSize.Y
	row.LayoutOrder = order + 1
	row.Parent = parent
	local flow = Instance.new("UIListLayout")
	flow.FillDirection = Enum.FillDirection.Horizontal
	flow.Wraps = true
	flow.Padding = UDim.new(0, 8)
	flow.SortOrder = Enum.SortOrder.LayoutOrder
	flow.Parent = row
	return row
end

local function setTrailerMode(on: boolean)
	trailerMode = on
	mainGui.Enabled = not on
	panel.Visible = false
	restore.Visible = on
	pcall(function()
		StarterGui:SetCoreGuiEnabled(Enum.CoreGuiType.All, not on)
	end)
	pcall(function()
		GuiService.TouchControlsEnabled = not on
	end)
	pcall(function()
		ProximityPromptService.Enabled = not on
	end)
end

local function refreshStatus()
	local active = state:GetAttribute("ActiveEvents") :: string?
	local mood = state:GetAttribute("DayMood") :: string?
	local auto = state:GetAttribute("AutoEvents")
	local timeScale = state:GetAttribute("TimeScale") :: number?
	status.Text = string.format(
		"%02d:%02d · %s day · auto events %s · time ×%s\nNow: %s",
		math.floor(Lighting.ClockTime),
		math.floor((Lighting.ClockTime % 1) * 60),
		mood or "?",
		if auto == false then "off" else "on",
		tostring(timeScale or 1),
		if active and active ~= "" then active:gsub(",", ", ") else "nothing in particular"
	)
end

function DirectorPanel.Init(gui: ScreenGui)
	mainGui = gui
	remote = ReplicatedStorage:WaitForChild("SomewhereRemotes"):WaitForChild("Director") :: RemoteEvent
	state = ReplicatedStorage:WaitForChild("SomewhereState") :: Folder

	local own = Instance.new("ScreenGui")
	own.Name = "SomewhereDirector"
	own.ResetOnSpawn = false
	own.DisplayOrder = 5
	own.ScreenInsets = Enum.ScreenInsets.CoreUISafeInsets
	own.Parent = player:WaitForChild("PlayerGui")

	local toggle = Instance.new("TextButton")
	toggle.AnchorPoint = Vector2.new(1, 0)
	toggle.Position = UDim2.new(1, -12, 0, 10)
	toggle.Size = UDim2.fromOffset(104, 44)
	toggle.BackgroundColor3 = rgb(24, 26, 30)
	toggle.BackgroundTransparency = 0.35
	toggle.TextColor3 = rgb(250, 244, 230)
	toggle.FontFace = BOLD
	toggle.TextSize = 16
	toggle.Text = "🎬 Director"
	toggle.Visible = false
	toggle.Parent = own
	local tc = Instance.new("UICorner")
	tc.CornerRadius = UDim.new(0, 22)
	tc.Parent = toggle

	-- An invisible corner button that brings the UI back after trailer mode.
	restore = Instance.new("TextButton")
	restore.AnchorPoint = Vector2.new(1, 0)
	restore.Position = UDim2.new(1, 0, 0, 0)
	restore.Size = UDim2.fromOffset(80, 80)
	restore.BackgroundTransparency = 1
	restore.Text = ""
	restore.Visible = false
	restore.Parent = own
	restore.Activated:Connect(function()
		setTrailerMode(false)
		toggle.Visible = true
	end)

	panel = Instance.new("Frame")
	panel.AnchorPoint = Vector2.new(1, 0)
	panel.Position = UDim2.new(1, -12, 0, 62)
	panel.Size = UDim2.new(0.92, 0, 1, -76)
	panel.BackgroundColor3 = rgb(30, 32, 38)
	panel.BackgroundTransparency = 0.08
	panel.Visible = false
	panel.Parent = own
	local pc = Instance.new("UICorner")
	pc.CornerRadius = UDim.new(0, 16)
	pc.Parent = panel
	local max = Instance.new("UISizeConstraint")
	max.MaxSize = Vector2.new(380, 900)
	max.Parent = panel
	local scroll = Instance.new("ScrollingFrame")
	scroll.Size = UDim2.fromScale(1, 1)
	scroll.BackgroundTransparency = 1
	scroll.BorderSizePixel = 0
	scroll.ScrollBarThickness = 4
	scroll.CanvasSize = UDim2.new()
	scroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
	scroll.ScrollingDirection = Enum.ScrollingDirection.Y
	scroll.Parent = panel
	local spad = Instance.new("UIPadding")
	spad.PaddingTop = UDim.new(0, 14)
	spad.PaddingBottom = UDim.new(0, 14)
	spad.PaddingLeft = UDim.new(0, 14)
	spad.PaddingRight = UDim.new(0, 14)
	spad.Parent = scroll
	local list = Instance.new("UIListLayout")
	list.Padding = UDim.new(0, 8)
	list.SortOrder = Enum.SortOrder.LayoutOrder
	list.Parent = scroll

	status = Instance.new("TextLabel")
	status.BackgroundTransparency = 1
	status.Size = UDim2.fromScale(1, 0)
	status.AutomaticSize = Enum.AutomaticSize.Y
	status.FontFace = FONT
	status.TextSize = 15
	status.TextWrapped = true
	status.TextXAlignment = Enum.TextXAlignment.Left
	status.TextColor3 = rgb(236, 230, 216)
	status.LayoutOrder = 0
	status.Parent = scroll

	-- Events (names come from the server so this list never goes stale).
	local events = section(scroll, "Trigger an event", 10)
	local eventButtons = 0
	local function buildEvents()
		local catalogJson = state:GetAttribute("EventCatalog") :: string?
		if eventButtons > 0 or not catalogJson then
			return
		end
		local ok, catalog = pcall(function()
			return HttpService:JSONDecode(catalogJson)
		end)
		if not ok or type(catalog) ~= "table" then
			return
		end
		for i, e in catalog :: { { Id: string, Name: string } } do
			local b = button(events, e.Name, function()
				send("Event", e.Id)
			end)
			b.LayoutOrder = i
			eventButtons += 1
		end
	end
	local stop = button(events, "Stop all", function()
		send("StopEvents")
	end)
	stop.LayoutOrder = 100
	local autoToggle = button(events, "Auto events on/off", function()
		send("AutoEvents", state:GetAttribute("AutoEvents") == false)
	end)
	autoToggle.LayoutOrder = 101
	buildEvents()
	state:GetAttributeChangedSignal("EventCatalog"):Connect(buildEvents)

	local time = section(scroll, "Time of day", 20)
	local hours: { { label: string, value: number } } = {
		{ label = "Dawn", value = 6.1 },
		{ label = "Morning", value = 9 },
		{ label = "Noon", value = 12.5 },
		{ label = "Golden hour", value = 17.2 },
		{ label = "Dusk", value = 18.8 },
		{ label = "Night", value = 22 },
	}
	for _, t in hours do
		button(time, t.label, function()
			send("Clock", t.value)
		end)
	end
	local speeds: { { label: string, value: number } } = {
		{ label = "Freeze time", value = 0 },
		{ label = "Normal speed", value = 1 },
		{ label = "Fast ×8", value = 8 },
	}
	for _, sp in speeds do
		button(time, sp.label, function()
			send("TimeScale", sp.value)
		end)
	end

	local weather = section(scroll, "Weather", 30)
	for _, w in { "Clear", "PartlyCloudy", "Overcast", "Drizzle", "Fog", "Storm", "Auto" } do
		button(weather, w, function()
			send("Weather", w)
		end)
	end

	local camera = section(scroll, "Filming", 40)
	button(camera, "Hide all UI (tap top-right corner to bring it back)", function()
		setTrailerMode(true)
		toggle.Visible = false
	end)
	button(camera, "Soft focus on/off", function()
		local dof = Lighting:FindFirstChild("TrailerFocus") :: DepthOfFieldEffect?
		if dof then
			dof.Enabled = not dof.Enabled
		end
	end)

	local places = section(scroll, "Go to", 50)
	for _, p in { "BusStop", "Store", "Diner", "Hollis", "Trail", "OldOak", "Bridge", "Clearing", "Lookout", "Truck" } do
		button(places, p, function()
			send("Teleport", p)
		end)
	end

	local tips = Instance.new("TextLabel")
	tips.BackgroundTransparency = 1
	tips.Size = UDim2.fromScale(1, 0)
	tips.AutomaticSize = Enum.AutomaticSize.Y
	tips.FontFace = FONT
	tips.TextSize = 14
	tips.TextWrapped = true
	tips.TextXAlignment = Enum.TextXAlignment.Left
	tips.TextColor3 = rgb(170, 166, 158)
	tips.LayoutOrder = 60
	tips.Text = "On a computer: H toggles clean-footage mode, Shift+P is Roblox's free camera (for the game's owner)."
	tips.Parent = scroll

	toggle.Activated:Connect(function()
		panel.Visible = not panel.Visible
		refreshStatus()
	end)
	UserInputService.InputBegan:Connect(function(input, processed)
		if not processed and input.KeyCode == Enum.KeyCode.H and player:GetAttribute("IsDirector") then
			setTrailerMode(not trailerMode)
			toggle.Visible = not trailerMode
		end
	end)

	local function updateVisibility()
		toggle.Visible = player:GetAttribute("IsDirector") == true and not trailerMode
	end
	player:GetAttributeChangedSignal("IsDirector"):Connect(updateVisibility)
	updateVisibility()

	task.spawn(function()
		while true do
			if panel.Visible then
				refreshStatus()
			end
			task.wait(1)
		end
	end)
end

return DirectorPanel
