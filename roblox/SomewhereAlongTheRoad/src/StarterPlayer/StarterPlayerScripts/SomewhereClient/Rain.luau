--!strict
-- Rain you can see: a sheet of streaks that follows the camera (and stops under a roof),
-- plus the lightning flash during storms. Everything here is local to each player.

local RunService = game:GetService("RunService")
local UserInputService = game:GetService("UserInputService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("SomewhereShared"):WaitForChild("Config"))

local Rain = {}

local emitter: ParticleEmitter
local holder: Part
local flash: ColorCorrectionEffect
local state: Folder
local isIndoors: () -> boolean = function()
	return false
end

function Rain.Flash(strength: number)
	task.spawn(function()
		for _, k in { 1, 0.35, 0.8 } do
			flash.Brightness = 0.32 * strength * k
			task.wait(0.06)
			flash.Brightness = 0
			task.wait(0.08)
		end
	end)
end

function Rain.Init(indoorCheck: () -> boolean)
	isIndoors = indoorCheck
	state = ReplicatedStorage:WaitForChild("SomewhereState") :: Folder
	local camera = workspace.CurrentCamera

	holder = Instance.new("Part")
	holder.Name = "RainSheet"
	holder.Anchored = true
	holder.CanCollide = false
	holder.CanQuery = false
	holder.CanTouch = false
	holder.Transparency = 1
	holder.Size = Vector3.new(110, 1, 110)
	holder.Parent = camera

	emitter = Instance.new("ParticleEmitter")
	emitter.Texture = Config.Textures.RainStreak
	emitter.Color = ColorSequence.new(Color3.fromRGB(200, 214, 230))
	emitter.Transparency = NumberSequence.new(0.45)
	emitter.LightEmission = 0.1
	emitter.LightInfluence = 0.6
	emitter.Size = NumberSequence.new(0.09)
	emitter.Squash = NumberSequence.new(3)
	emitter.Orientation = Enum.ParticleOrientation.VelocityParallel
	emitter.EmissionDirection = Enum.NormalId.Bottom
	emitter.Speed = NumberRange.new(85, 100)
	emitter.SpreadAngle = Vector2.new(4, 4)
	emitter.Lifetime = NumberRange.new(0.75, 0.9)
	emitter.Rate = 0
	emitter.Parent = holder

	flash = Instance.new("ColorCorrectionEffect")
	flash.Name = "ThunderFlash"
	flash.Brightness = 0
	flash.Parent = camera

	-- Phones get a lighter shower; it still reads as rain and keeps the frame rate up.
	local density = if UserInputService.TouchEnabled and not UserInputService.KeyboardEnabled then 800 else 1400
	RunService.RenderStepped:Connect(function()
		local cf = camera.CFrame
		local ahead = Vector3.new(cf.LookVector.X, 0, cf.LookVector.Z) * 18
		holder.CFrame = CFrame.new(cf.Position + ahead + Vector3.new(0, 42, 0))
		local rain = (state:GetAttribute("Rain") :: number?) or 0
		local wind = (state:GetAttribute("Wind") :: number?) or 0
		emitter.Rate = if isIndoors() or rain < 0.03 then 0 else density * rain
		emitter.Acceleration = Vector3.new(14 * wind, 0, 6 * wind)
	end)
end

return Rain
