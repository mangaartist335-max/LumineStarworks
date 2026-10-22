--!strict
-- Player arrival: everyone starts at the bus stop at an easy walking pace.

local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local StarterPlayer = game:GetService("StarterPlayer")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("SomewhereShared"):WaitForChild("Config"))

local Spawning = {}

function Spawning.IsDirector(player: Player): boolean
	local d = Config.Director
	if d.AllowInStudio and RunService:IsStudio() then
		return true
	end
	if d.AllowCreator and game.CreatorType == Enum.CreatorType.User and player.UserId == game.CreatorId then
		return true
	end
	return table.find(d.UserIds, player.UserId) ~= nil
end

function Spawning.Init(_ctx: any)
	StarterPlayer.CharacterWalkSpeed = Config.Player.WalkSpeed
	StarterPlayer.CameraMaxZoomDistance = Config.Player.CameraMaxZoom
	local function added(player: Player)
		player:SetAttribute("IsDirector", Spawning.IsDirector(player))
		player.CharacterAdded:Connect(function(character)
			local humanoid = character:WaitForChild("Humanoid") :: Humanoid
			humanoid.WalkSpeed = Config.Player.WalkSpeed
		end)
	end
	Players.PlayerAdded:Connect(added)
	for _, player in Players:GetPlayers() do
		added(player)
	end
end

return Spawning
