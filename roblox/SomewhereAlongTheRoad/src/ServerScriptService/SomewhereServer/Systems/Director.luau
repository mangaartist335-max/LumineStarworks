--!strict
-- Trailer tools: trigger any event, set the time, pin the weather, jump to landmarks.
-- Only players allowed by Config.Director (always you, in Studio) can use them.

local Layout = require(script.Parent.Parent.World.Layout)
local Ground = require(script.Parent.Parent.World.Ground)

local Director = {}

local ctx: any

local function spot(x: number, z: number, facing: Vector3?): CFrame
	local pos = Vector3.new(x, Ground.hillHeight(x, z) + 4, z)
	return if facing then CFrame.lookAt(pos, Vector3.new(facing.X, pos.Y, facing.Z)) else CFrame.new(pos)
end

local PLACES: { [string]: CFrame } = {
	BusStop = spot(-16, 18, Vector3.new(-30, 0, -40)),
	Store = spot(-50, -50, Vector3.new(-50, 0, -80)),
	Diner = spot(25, 34, Vector3.new(30, 0, 60)),
	Hollis = spot(110, 40, Vector3.new(114, 0, 60)),
	Trail = spot(-112, 24, Vector3.new(-110, 0, 80)),
	OldOak = spot(-110, 118, Layout.OldOak),
	Bridge = spot(-150, 164, Vector3.new(-150, 0, 200)),
	Clearing = spot(-196, 232, Layout.Clearing.Center),
	Lookout = spot(-150, 340, Vector3.new(-40, 0, 0)),
	Truck = spot(222, -78, Vector3.new(236, 0, -92)),
}
Director.Places = PLACES

local function handle(player: Player, action: any, arg: any)
	if not player:GetAttribute("IsDirector") or typeof(action) ~= "string" then
		return
	end
	if action == "Event" and typeof(arg) == "string" then
		ctx.Events.Trigger(arg, true)
	elseif action == "StopEvents" then
		ctx.Events.StopAll()
	elseif action == "AutoEvents" and typeof(arg) == "boolean" then
		ctx.Events.SetAuto(arg)
	elseif action == "Clock" and typeof(arg) == "number" then
		ctx.DayNight.SetClock(math.clamp(arg, 0, 23.99))
	elseif action == "TimeScale" and typeof(arg) == "number" then
		ctx.DayNight.SetTimeScale(math.clamp(arg, 0, 20))
		ctx.Net.Set("TimeScale", ctx.DayNight.GetTimeScale())
	elseif action == "Weather" and typeof(arg) == "string" then
		ctx.Weather.Force(if arg == "Auto" then nil else arg)
	elseif action == "Teleport" and typeof(arg) == "string" then
		local cf = PLACES[arg]
		local character = player.Character
		if cf and character then
			local humanoid = character:FindFirstChildOfClass("Humanoid")
			if humanoid then
				humanoid.Sit = false
			end
			character:PivotTo(cf)
		end
	end
end

function Director.Init(context: any)
	ctx = context
	ctx.Net.Set("TimeScale", 1)
	ctx.Net.Remote("Director").OnServerEvent:Connect(handle)
end

return Director
