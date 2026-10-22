--!strict
-- Somewhere Along the Road: client entry point.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local UI = require(script:WaitForChild("UI"))
local Ambience = require(script:WaitForChild("Ambience"))
local Rain = require(script:WaitForChild("Rain"))
local Controls = require(script:WaitForChild("Controls"))
local DirectorPanel = require(script:WaitForChild("DirectorPanel"))

-- The camera can be a frame or two late on slower phones.
if not workspace.CurrentCamera then
	workspace:GetPropertyChangedSignal("CurrentCamera"):Wait()
end

UI.Init()
Controls.Init()
Ambience.Init()
Rain.Init(Ambience.IsIndoors)

local remotes = ReplicatedStorage:WaitForChild("SomewhereRemotes")

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

;(remotes:WaitForChild("Flash") :: RemoteEvent).OnClientEvent:Connect(function(strength: number)
	Rain.Flash(strength)
	Ambience.Thunder(strength)
end)

DirectorPanel.Init(UI.Gui())
