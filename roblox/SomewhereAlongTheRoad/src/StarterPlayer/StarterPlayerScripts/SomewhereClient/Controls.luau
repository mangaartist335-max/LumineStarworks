--!strict
-- A relaxed walk by default. Hold Shift (or tap the Run button on a phone) to hurry.

local ContextActionService = game:GetService("ContextActionService")
local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("SomewhereShared"):WaitForChild("Config"))

local Controls = {}

local player = Players.LocalPlayer
local running = false

local function apply()
	local character = player.Character
	local humanoid = character and character:FindFirstChildOfClass("Humanoid")
	if humanoid then
		humanoid.WalkSpeed = if running then Config.Player.RunSpeed else Config.Player.WalkSpeed
	end
	ContextActionService:SetTitle("SomewhereRun", if running then "Walk" else "Run")
end

local function onRun(_: string, inputState: Enum.UserInputState, input: InputObject): Enum.ContextActionResult
	if input.UserInputType == Enum.UserInputType.Touch then
		if inputState == Enum.UserInputState.Begin then
			running = not running
			apply()
		end
	elseif inputState == Enum.UserInputState.Begin then
		running = true
		apply()
	elseif inputState == Enum.UserInputState.End or inputState == Enum.UserInputState.Cancel then
		running = false
		apply()
	end
	return Enum.ContextActionResult.Sink
end

function Controls.Init()
	ContextActionService:BindAction("SomewhereRun", onRun, true, Enum.KeyCode.LeftShift, Enum.KeyCode.ButtonL3)
	player.CameraMaxZoomDistance = Config.Player.CameraMaxZoom
	player.CharacterAdded:Connect(function()
		running = false
		task.wait(0.2)
		apply()
	end)
	apply()
end

return Controls
