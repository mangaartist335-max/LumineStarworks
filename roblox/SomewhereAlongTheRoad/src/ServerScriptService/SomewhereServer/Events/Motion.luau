--!strict
-- Smooth movement for vehicles and animals. The model becomes one welded, unanchored assembly
-- held by AlignPosition/AlignOrientation, so clients see interpolated physics instead of
-- choppy anchored teleports.

local RunService = game:GetService("RunService")

local Motion = {}

export type Rig = {
	Model: Model,
	Root: BasePart,
	Attachment: Attachment,
	Align: AlignPosition,
	Orient: AlignOrientation,
	Ground: boolean, -- follow the ground height (animals), or keep the given Y (vehicles)
}

function Motion.Rig(model: Model, followGround: boolean?): Rig
	local root = model.PrimaryPart :: BasePart
	for _, d in model:GetDescendants() do
		if d:IsA("BasePart") then
			d.CanCollide = false
			d.CanTouch = false
			if d ~= root then
				d.Massless = true
				local weld = Instance.new("WeldConstraint")
				weld.Part0 = root
				weld.Part1 = d
				weld.Parent = d
			end
		end
	end
	for _, d in model:GetDescendants() do
		if d:IsA("BasePart") then
			d.Anchored = false
		end
	end
	local att = Instance.new("Attachment")
	att.Name = "MotionAttachment"
	att.Parent = root
	local align = Instance.new("AlignPosition")
	align.Mode = Enum.PositionAlignmentMode.OneAttachment
	align.Attachment0 = att
	align.RigidityEnabled = true
	align.Position = root.Position
	align.Parent = root
	local orient = Instance.new("AlignOrientation")
	orient.Mode = Enum.OrientationAlignmentMode.OneAttachment
	orient.Attachment0 = att
	orient.RigidityEnabled = true
	orient.CFrame = root.CFrame.Rotation
	orient.Parent = root
	pcall(function()
		root:SetNetworkOwner(nil)
	end)
	return {
		Model = model,
		Root = root,
		Attachment = att,
		Align = align,
		Orient = orient,
		Ground = followGround == true,
	}
end

local rayParams = RaycastParams.new()
rayParams.FilterType = Enum.RaycastFilterType.Exclude

local function groundY(rig: Rig, pos: Vector3): number
	rayParams.FilterDescendantsInstances = { rig.Model, workspace:FindFirstChild("SomewhereNPCs") :: Instance }
	local hit = workspace:Raycast(pos + Vector3.new(0, 30, 0), Vector3.new(0, -80, 0), rayParams)
	return if hit then hit.Position.Y else pos.Y
end

function Motion.Place(rig: Rig, cf: CFrame)
	rig.Align.Position = cf.Position
	rig.Orient.CFrame = cf.Rotation
	rig.Root.CFrame = cf
end

-- Moves the rig's root to `target` at `speed` studs/second, facing the direction of travel.
-- `hop` adds a little bounce (chickens). Returns false if `isCancelled()` stops it early.
function Motion.MoveTo(rig: Rig, target: Vector3, speed: number, isCancelled: () -> boolean, hop: number?): boolean
	local done = false
	local cancelled = false
	local pos = rig.Align.Position
	local t = 0
	local conn
	conn = RunService.Heartbeat:Connect(function(dt)
		if isCancelled() or not rig.Model.Parent then
			cancelled = true
			done = true
			conn:Disconnect()
			return
		end
		local flatTarget = Vector3.new(target.X, pos.Y, target.Z)
		local delta = flatTarget - pos
		local dist = delta.Magnitude
		local step = speed * dt
		if dist <= step then
			pos = flatTarget
			done = true
		else
			pos += delta.Unit * step
		end
		local y = if rig.Ground then groundY(rig, pos) + rig.Root.Size.Y / 2 else target.Y
		t += dt
		local bounce = if hop then math.abs(math.sin(t * 9)) * hop else 0
		rig.Align.Position = Vector3.new(pos.X, y + bounce, pos.Z)
		if dist > 0.05 then
			rig.Orient.CFrame = CFrame.lookAt(Vector3.zero, Vector3.new(delta.X, 0, delta.Z))
		end
		if done then
			conn:Disconnect()
		end
	end)
	while not done do
		task.wait()
	end
	return not cancelled
end

function Motion.Face(rig: Rig, target: Vector3)
	local pos = rig.Align.Position
	local dir = Vector3.new(target.X - pos.X, 0, target.Z - pos.Z)
	if dir.Magnitude > 0.05 then
		rig.Orient.CFrame = CFrame.lookAt(Vector3.zero, dir)
	end
end

return Motion
