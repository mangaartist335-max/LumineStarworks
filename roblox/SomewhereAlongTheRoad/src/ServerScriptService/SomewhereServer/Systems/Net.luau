--!strict
-- Remotes and shared world state. State lives as attributes on ReplicatedStorage.SomewhereState,
-- so clients can read it and listen with GetAttributeChangedSignal.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Net = {}

local remotes: Folder
local state: Folder

function Net.Init()
	local existingRemotes = ReplicatedStorage:FindFirstChild("SomewhereRemotes")
	if existingRemotes and existingRemotes:IsA("Folder") then
		remotes = existingRemotes
	else
		local f = Instance.new("Folder")
		f.Name = "SomewhereRemotes"
		f.Parent = ReplicatedStorage
		remotes = f
	end
	for _, name in { "Notify", "Flash", "Director" } do
		if not remotes:FindFirstChild(name) then
			local r = Instance.new("RemoteEvent")
			r.Name = name
			r.Parent = remotes
		end
	end
	local existingState = ReplicatedStorage:FindFirstChild("SomewhereState")
	if existingState and existingState:IsA("Folder") then
		state = existingState
	else
		local f = Instance.new("Folder")
		f.Name = "SomewhereState"
		f.Parent = ReplicatedStorage
		state = f
	end
	Net.Set("PowerOn", true)
	Net.Set("StoreOpen", true)
	Net.Set("Weather", "Clear")
	Net.Set("Rain", 0)
	Net.Set("Wind", 0.2)
	Net.Set("Storm", 0)
	Net.Set("ActiveEvents", "")
end

function Net.Remote(name: string): RemoteEvent
	return remotes:WaitForChild(name) :: RemoteEvent
end

function Net.Set(key: string, value: any)
	if state:GetAttribute(key) ~= value then
		state:SetAttribute(key, value)
	end
end

function Net.Get(key: string): any
	return state:GetAttribute(key)
end

export type Payload = { [string]: any }

function Net.Notify(player: Player, payload: Payload)
	Net.Remote("Notify"):FireClient(player, payload)
end

function Net.NotifyAll(payload: Payload)
	Net.Remote("Notify"):FireAllClients(payload)
end

return Net
