--!strict
-- Somewhere Along the Road: client entry point.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Config = require(ReplicatedStorage:WaitForChild("SomewhereShared"):WaitForChild("Config"))
local Ambience = require(script:WaitForChild("Ambience"))
local Rain = require(script:WaitForChild("Rain"))

-- The camera can be a frame or two late on slower phones.
if not workspace.CurrentCamera then
	workspace:GetPropertyChangedSignal("CurrentCamera"):Wait()
end

Ambience.Init(Config.Mode == "Cutscene")
Rain.Init(Ambience.IsIndoors)

local remotes = ReplicatedStorage:WaitForChild("SomewhereRemotes")

;(remotes:WaitForChild("Flash") :: RemoteEvent).OnClientEvent:Connect(function(strength: number)
	Rain.Flash(strength)
	Ambience.Thunder(strength)
end)

if Config.Mode == "Cutscene" then
	-- The trailer plays by itself, starring your avatar. Tap to move it along.
	local notify = remotes:WaitForChild("Notify") :: RemoteEvent
	notify.OnClientEvent:Connect(function() end)
	require(script:WaitForChild("Cinematic")).Init()
	return
end

local UI = require(script:WaitForChild("UI"))
local Controls = require(script:WaitForChild("Controls"))
local DirectorPanel = require(script:WaitForChild("DirectorPanel"))

UI.Init()
Controls.Init()

;(remotes:WaitForChild("Notify") :: RemoteEvent).OnClientEvent:Connect(function(payload: { [string]: any })
	local kind = payload.kind
	if kind == "note" then
		UI.ShowNote(payload.title or "", payload.body or "")
	elseif kind == "toast" then
		UI.Toast(payload.text or "")
	elseif kind == "hint" then
		UI.Hint(payload.text or "")
	elseif kind == "discovery" then
		UI.Discovered(payload.title, payload.body, payload.count, payload.goal)
	elseif kind == "objective" then
		UI.SetObjective(payload.count, payload.goal)
	end
end)

DirectorPanel.Init(UI.Gui())
