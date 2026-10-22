--!strict
-- Small things people hand you: coffee, pie, a soda, chips, ice cream. Tap to have a bite or a sip.

local ReplicatedStorage = game:GetService("ReplicatedStorage")

local Shared = ReplicatedStorage:WaitForChild("SomewhereShared")
local Sounds = require(Shared:WaitForChild("Sounds"))
local Text = require(Shared:WaitForChild("Text"))

local Items = {}

local rgb = Color3.fromRGB
local ctx: any

type Look = { { size: Vector3, offset: CFrame, color: Color3, material: Enum.Material, shape: Enum.PartType? } }

local LOOKS: { [string]: { uses: number, verb: string, parts: Look } } = {
	Coffee = {
		uses = 4,
		verb = "Sip",
		parts = {
			{ size = Vector3.new(0.9, 0.7, 0.7), offset = CFrame.Angles(0, 0, math.pi / 2), color = rgb(244, 242, 236), material = Enum.Material.SmoothPlastic, shape = Enum.PartType.Cylinder },
			{ size = Vector3.new(0.05, 0.6, 0.6), offset = CFrame.new(0, 0.44, 0) * CFrame.Angles(0, 0, math.pi / 2), color = rgb(90, 56, 40), material = Enum.Material.SmoothPlastic, shape = Enum.PartType.Cylinder },
			{ size = Vector3.new(0.15, 0.45, 0.3), offset = CFrame.new(0.45, 0, 0), color = rgb(244, 242, 236), material = Enum.Material.SmoothPlastic },
		},
	},
	Soda = {
		uses = 3,
		verb = "Sip",
		parts = {
			{ size = Vector3.new(1, 0.55, 0.55), offset = CFrame.Angles(0, 0, math.pi / 2), color = rgb(236, 130, 50), material = Enum.Material.SmoothPlastic, shape = Enum.PartType.Cylinder },
			{ size = Vector3.new(0.05, 0.5, 0.5), offset = CFrame.new(0, 0.52, 0) * CFrame.Angles(0, 0, math.pi / 2), color = rgb(200, 204, 208), material = Enum.Material.Metal, shape = Enum.PartType.Cylinder },
		},
	},
	Pie = {
		uses = 3,
		verb = "Bite",
		parts = {
			{ size = Vector3.new(0.5, 0.35, 1.2), offset = CFrame.new(), color = rgb(214, 160, 96), material = Enum.Material.SmoothPlastic },
			{ size = Vector3.new(0.52, 0.12, 1.1), offset = CFrame.new(0, 0.2, 0), color = rgb(176, 40, 60), material = Enum.Material.SmoothPlastic },
		},
	},
	Snack = {
		uses = 5,
		verb = "Crunch",
		parts = {
			{ size = Vector3.new(0.3, 1.3, 1), offset = CFrame.new(), color = rgb(236, 180, 60), material = Enum.Material.SmoothPlastic },
			{ size = Vector3.new(0.32, 0.4, 1.02), offset = CFrame.new(0, 0.2, 0), color = rgb(200, 50, 46), material = Enum.Material.SmoothPlastic },
		},
	},
	IceCream = {
		uses = 4,
		verb = "Lick",
		parts = {
			{ size = Vector3.new(1, 0.5, 0.5), offset = CFrame.new(0, -0.2, 0) * CFrame.Angles(0, 0, math.pi / 2), color = rgb(214, 170, 110), material = Enum.Material.WoodPlanks, shape = Enum.PartType.Cylinder },
			{ size = Vector3.new(0.7, 0.7, 0.7), offset = CFrame.new(0, 0.45, 0), color = rgb(246, 196, 206), material = Enum.Material.SmoothPlastic, shape = Enum.PartType.Ball },
			{ size = Vector3.new(0.6, 0.6, 0.6), offset = CFrame.new(0, 0.95, 0), color = rgb(170, 226, 206), material = Enum.Material.SmoothPlastic, shape = Enum.PartType.Ball },
		},
	},
}

local DISPLAY = { Coffee = "Coffee", Soda = "Soda", Pie = "Pie", Snack = "Chips", IceCream = "Ice Cream" }

local function hasItem(player: Player, name: string): boolean
	local display = DISPLAY[name]
	local backpack = player:FindFirstChildOfClass("Backpack")
	return (backpack ~= nil and backpack:FindFirstChild(display) ~= nil)
		or (player.Character ~= nil and player.Character:FindFirstChild(display) ~= nil)
end

local function build(name: string): Tool?
	local def = LOOKS[name]
	if not def then
		return nil
	end
	local tool = Instance.new("Tool")
	tool.Name = DISPLAY[name]
	tool.CanBeDropped = false
	tool.RequiresHandle = true
	tool.ToolTip = def.verb
	tool.Grip = CFrame.new(0, -0.1, 0)
	local handle: BasePart? = nil
	for i, p in def.parts do
		local part = Instance.new("Part")
		part.Name = if i == 1 then "Handle" else "Detail"
		if p.shape then
			part.Shape = p.shape
		end
		part.Size = p.size
		part.Color = p.color
		part.Material = p.material
		part.CanCollide = false
		part.CanTouch = false
		part.Massless = true
		part.TopSurface = Enum.SurfaceType.Smooth
		part.BottomSurface = Enum.SurfaceType.Smooth
		if handle then
			part.CFrame = handle.CFrame * p.offset
			local weld = Instance.new("WeldConstraint")
			weld.Part0 = handle
			weld.Part1 = part
			weld.Parent = part
		else
			part.CFrame = p.offset
			handle = part
		end
		part.Parent = tool
	end

	local usesLeft = def.uses
	local busy = false
	local sip: Sound? = if handle then Sounds.Make("Sip", handle, { Volume = 0.5 }) else nil
	tool.Activated:Connect(function()
		if busy then
			return
		end
		busy = true
		local rest = tool.Grip
		tool.Grip = rest * CFrame.new(0, -0.6, 0.4) * CFrame.Angles(math.rad(-50), 0, 0)
		if sip then
			sip:Play()
		end
		task.wait(0.7)
		tool.Grip = rest
		usesLeft -= 1
		if usesLeft <= 0 then
			local character = tool.Parent
			local player = if character then game:GetService("Players"):GetPlayerFromCharacter(character) else nil
			tool:Destroy()
			if player then
				ctx.Net.Notify(player, { kind = "toast", text = Text.Lines.Finished })
			end
		end
		busy = false
	end)
	return tool
end

-- Returns false if they're already carrying one.
function Items.Give(player: Player, name: string): boolean
	if hasItem(player, name) then
		return false
	end
	local tool = build(name)
	local backpack = player:FindFirstChildOfClass("Backpack")
	if not tool or not backpack then
		return false
	end
	tool.Parent = backpack
	return true
end

function Items.Init(context: any)
	ctx = context
end

return Items
