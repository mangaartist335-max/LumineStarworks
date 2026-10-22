--!strict
-- Where the town's sounds come from. Each sound has a slot (Wind, Rain, DayBirds...), and a
-- slot can be filled in either of two ways:
--   * in Studio: SoundService > SomewhereSounds > click the Sound with the slot's name and
--     set its SoundId (the dropdown lists the audio you've uploaded), or
--   * in code: paste the id into Config.Sounds (this wins if both are set).
-- The matching files are in the project's audio/ folder (made by tools/make_sounds.py).
-- Empty slots just stay quiet, so the town works with any mix of sounds filled in.

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local SoundService = game:GetService("SoundService")

local Config = require(ReplicatedStorage:WaitForChild("SomewhereShared"):WaitForChild("Config"))

local Sounds = {}

Sounds.FolderName = "SomewhereSounds"

-- Accepts "rbxassetid://123", a plain "123", or nothing.
local function normalize(id: string?): string?
	if not id then
		return nil
	end
	local trimmed = string.gsub(id, "^%s*(.-)%s*$", "%1")
	if trimmed == "" or trimmed == "rbxassetid://" or trimmed == "rbxassetid://0" then
		return nil
	end
	if string.match(trimmed, "^%d+$") then
		return "rbxassetid://" .. trimmed
	end
	return trimmed
end

-- The sound id for a slot, or nil while it's still empty.
function Sounds.Id(slot: string): string?
	local fromConfig = normalize((Config.Sounds :: any)[slot])
	if fromConfig then
		return fromConfig
	end
	local folder = SoundService:FindFirstChild(Sounds.FolderName)
	local holder = folder and folder:FindFirstChild(slot)
	if holder and holder:IsA("Sound") then
		return normalize(holder.SoundId)
	end
	return nil
end

export type Props = { Looped: boolean?, Volume: number?, Name: string? }

-- A new Sound for a slot, or nil if the slot is empty. Doesn't start playing.
function Sounds.Make(slot: string, parent: Instance, props: Props?): Sound?
	local id = Sounds.Id(slot)
	if not id then
		return nil
	end
	local p: Props = props or {}
	local s = Instance.new("Sound")
	s.Name = p.Name or slot
	s.SoundId = id
	s.Looped = p.Looped == true
	s.Volume = p.Volume or 0.5
	s.Parent = parent
	return s
end

-- Makes SoundService.SomewhereSounds with one empty Sound per slot, so filling them in is
-- just a matter of clicking each one. Never touches a slot that's already there (so your ids
-- survive re-running the installer).
function Sounds.EnsureSlots(): Folder
	local folder = SoundService:FindFirstChild(Sounds.FolderName)
	if not folder then
		local f = Instance.new("Folder")
		f.Name = Sounds.FolderName
		f.Parent = SoundService
		folder = f
	end
	local slots = {}
	for slot in Config.Sounds :: any do
		table.insert(slots, slot)
	end
	table.sort(slots)
	for _, slot in slots do
		if not (folder :: Folder):FindFirstChild(slot) then
			local s = Instance.new("Sound")
			s.Name = slot
			s.SoundId = ""
			s.Volume = 0.5
			s:SetAttribute("File", `audio/{slot}.ogg`)
			s.Parent = folder
		end
	end
	return folder :: Folder
end

return Sounds
