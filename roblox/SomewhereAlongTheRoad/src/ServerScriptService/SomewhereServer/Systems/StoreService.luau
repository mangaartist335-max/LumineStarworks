--!strict
-- The Halfway Mart's automatic doors and its open/closed state.

local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Sounds = require(ReplicatedStorage:WaitForChild("SomewhereShared"):WaitForChild("Sounds"))

local StoreService = {}

type Door = { part: BasePart, closed: CFrame, opened: CFrame, isOpen: boolean }

local ctx: any
local doors: { Door } = {}
local floor: BasePart? = nil
local signLabel: TextLabel? = nil
local chime: Sound? = nil
local OPEN_TEXT = "OPEN\n24 hrs-ish"

function StoreService.IsInside(pos: Vector3): boolean
	if not floor then
		return false
	end
	local rel = floor.CFrame:PointToObjectSpace(pos)
	return math.abs(rel.X) < floor.Size.X / 2 and math.abs(rel.Z) < floor.Size.Z / 2 and rel.Y > -2 and rel.Y < 16
end

function StoreService.IsOpen(): boolean
	return ctx.Net.Get("StoreOpen") == true
end

function StoreService.SetOpen(open: boolean, note: string?)
	ctx.Net.Set("StoreOpen", open)
	if signLabel then
		signLabel.Text = if open then OPEN_TEXT else (note or "CLOSED")
		signLabel.TextColor3 = if open then Color3.fromRGB(54, 96, 80) else Color3.fromRGB(150, 50, 40)
	end
end

function StoreService.DoorSign(): BasePart?
	return if signLabel then signLabel:FindFirstAncestorWhichIsA("BasePart") else nil
end

local function roots(): { BasePart }
	local list = {}
	for _, player in Players:GetPlayers() do
		local character = player.Character
		local root = character and character:FindFirstChild("HumanoidRootPart")
		if root and root:IsA("BasePart") then
			table.insert(list, root)
		end
	end
	local npcs = workspace:FindFirstChild("SomewhereNPCs")
	if npcs then
		for _, model in npcs:GetChildren() do
			local root = model:FindFirstChild("HumanoidRootPart")
			if root and root:IsA("BasePart") then
				table.insert(list, root)
			end
		end
	end
	return list
end

local function setDoors(open: boolean)
	for _, door in doors do
		if door.isOpen ~= open then
			door.isOpen = open
			TweenService:Create(door.part, TweenInfo.new(0.55, Enum.EasingStyle.Quad, Enum.EasingDirection.Out), {
				CFrame = if open then door.opened else door.closed,
			}):Play()
		end
	end
	if open and chime then
		chime:Play()
	end
end

function StoreService.Init(context: any)
	ctx = context
	local store = (ctx.Town :: Instance):FindFirstChild("HalfwayMart")
	if not store then
		warn("[Somewhere] No HalfwayMart found; store doors disabled")
		return
	end
	for _, d in store:GetDescendants() do
		if d:IsA("BasePart") then
			if d:GetAttribute("AutoDoor") == "Store" then
				local slide = (d:GetAttribute("SlideX") :: number?) or 4
				table.insert(doors, { part = d, closed = d.CFrame, opened = d.CFrame * CFrame.new(slide, 0, 0), isOpen = false })
			end
			if d.Name == "StoreFloor" then
				floor = d
			elseif d:GetAttribute("StoreDoorSign") then
				local gui = d:FindFirstChildWhichIsA("SurfaceGui")
				signLabel = gui and gui:FindFirstChildWhichIsA("TextLabel") or nil
			end
		end
	end
	if #doors > 0 then
		chime = Sounds.Make("StoreChime", doors[1].part, { Volume = 0.4 })
		if chime then
			chime.RollOffMaxDistance = 50
		end
	end
	if #doors == 0 then
		return
	end

	-- The middle of the doorway (the sign rides on one door, so take the middle of them all).
	local low, high = doors[1].closed.Position, doors[1].closed.Position
	for _, door in doors do
		low = low:Min(door.closed.Position)
		high = high:Max(door.closed.Position)
	end
	local center = (low + high) / 2

	task.spawn(function()
		while true do
			local want = false
			local open = StoreService.IsOpen()
			for _, root in roots() do
				local p = root.Position
				if (p - center).Magnitude < 10 and (open or StoreService.IsInside(p)) then
					want = true
					break
				end
			end
			setDoors(want)
			task.wait(0.15)
		end
	end)
end

return StoreService
