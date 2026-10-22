--!strict
-- "Discover three interesting things." Tracks what each visitor has found this session.

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("SomewhereShared")
local Config = require(Shared:WaitForChild("Config"))
local Text = require(Shared:WaitForChild("Text"))

local Discoveries = {}

local ctx: any
local found: { [Player]: { [string]: boolean } } = {}
local counts: { [Player]: number } = {}

function Discoveries.Has(player: Player, id: string): boolean
	local set = found[player]
	return set ~= nil and set[id] == true
end

function Discoveries.Count(player: Player): number
	return counts[player] or 0
end

-- `extra` lets an event add a line of its own to the journal entry.
function Discoveries.Award(player: Player, id: string, extra: string?): boolean
	local entry = Text.Discoveries[id]
	if not entry then
		warn("[Somewhere] Unknown discovery " .. id)
		return false
	end
	local set = found[player]
	if not set or set[id] then
		return false
	end
	set[id] = true
	counts[player] = (counts[player] or 0) + 1
	local body = entry.Body
	if extra and extra ~= "" then
		body = body .. "\n\n" .. extra
	end
	ctx.Net.Notify(player, {
		kind = "discovery",
		id = id,
		title = entry.Title,
		body = body,
		count = counts[player],
		goal = Config.Objective.Goal,
	})
	if counts[player] == Config.Objective.Goal then
		task.delay(4, function()
			if player.Parent then
				ctx.Net.Notify(player, { kind = "toast", text = Text.Lines.ObjectiveDone, long = true })
			end
		end)
	end
	return true
end

-- Awards everyone within `radius` of a position (used by events you witness rather than read).
function Discoveries.AwardNear(position: Vector3, radius: number, id: string, extra: string?)
	for _, player in Players:GetPlayers() do
		local character = player.Character
		local root = character and character:FindFirstChild("HumanoidRootPart") :: BasePart?
		if root and (root.Position - position).Magnitude <= radius then
			Discoveries.Award(player, id, extra)
		end
	end
end

function Discoveries.Init(context: any)
	ctx = context
	local function added(player: Player)
		found[player] = {}
		counts[player] = 0
		ctx.Net.Notify(player, { kind = "objective", count = 0, goal = Config.Objective.Goal })
	end
	Players.PlayerAdded:Connect(added)
	for _, player in Players:GetPlayers() do
		added(player)
	end
	Players.PlayerRemoving:Connect(function(player)
		found[player] = nil
		counts[player] = nil
	end)
end

return Discoveries
