--[[
	Offline place builder for Somewhere Along the Road.

	Run from the project folder:   lune run tools/build.luau

	It:
	  1. loads every script in src/ into a fresh DataModel (Rojo-style layout),
	  2. runs the real World/Builder module to bake the town into Workspace,
	  3. records the terrain calls with a stand-in Terrain (terrain is filled in at Play time),
	  4. checks that every interactable, anchor and text id the game relies on exists,
	  5. writes dist/SomewhereAlongTheRoad_Cutscene.rbxl, dist/Bootstrap_CommandBar.lua,
	     sourcemap.json and dist/map.json (for the top-down preview).
]]

local fs = require("@lune/fs")
local luau = require("@lune/luau")
local roblox = require("@lune/roblox")
local serde = require("@lune/serde")
local process = require("@lune/process")

local Instance = roblox.Instance

roblox.implementMethod("Instance", "WaitForChild", function(self, name)
	local child = self:FindFirstChild(name)
	assert(child, `WaitForChild would hang: {self:GetFullName()}.{name}`)
	return child
end)

local SRC = "src"
local DIST = "dist"

------------------------------------------------------------------------------
-- 1. Load sources (Rojo rules: init.server/init.client/init make a folder a script)
------------------------------------------------------------------------------

local function classFor(fileName: string): (string?, string?)
	local base = fileName:match("^(.-)%.server%.luau$")
	if base then
		return "Script", base
	end
	base = fileName:match("^(.-)%.client%.luau$")
	if base then
		return "LocalScript", base
	end
	base = fileName:match("^(.-)%.luau$")
	if base then
		return "ModuleScript", base
	end
	return nil, nil
end

local scriptFiles: { { inst: any, path: string } } = {}

local function loadDir(dirPath: string, name: string, parent: any, sourcemapParent: { [string]: any })
	local entries = fs.readDir(dirPath)
	table.sort(entries)
	local inst
	local node = { name = name, className = "Folder", children = {} }
	for _, initName in { "init.server.luau", "init.client.luau", "init.luau" } do
		if table.find(entries, initName) then
			local class = classFor(initName)
			inst = Instance.new(class)
			inst.Source = fs.readFile(`{dirPath}/{initName}`)
			node.className = class
			node.filePaths = { `{dirPath}/{initName}` }
			table.insert(scriptFiles, { inst = inst, path = `{dirPath}/{initName}` })
			break
		end
	end
	inst = inst or Instance.new("Folder")
	inst.Name = name
	inst.Parent = parent
	table.insert(sourcemapParent.children, node)
	for _, entry in entries do
		local full = `{dirPath}/{entry}`
		if fs.isDir(full) then
			loadDir(full, entry, inst, node)
		elseif not entry:match("^init%.") then
			local class, base = classFor(entry)
			if class then
				local s = Instance.new(class)
				s.Name = base
				s.Source = fs.readFile(full)
				s.Parent = inst
				table.insert(node.children, { name = base, className = class, filePaths = { full } })
				table.insert(scriptFiles, { inst = s, path = full })
			end
		end
	end
	return inst
end

local game = Instance.new("DataModel")
local workspace = game:GetService("Workspace")
local lighting = game:GetService("Lighting")
local starterPlayer = game:GetService("StarterPlayer")
local sourcemap = { name = "SomewhereAlongTheRoad", className = "DataModel", children = {} }

local function serviceNode(name: string, className: string)
	local node = { name = name, className = className, children = {} }
	table.insert(sourcemap.children, node)
	return node
end

local rsNode = serviceNode("ReplicatedStorage", "ReplicatedStorage")
loadDir(`{SRC}/ReplicatedStorage/SomewhereShared`, "SomewhereShared", game:GetService("ReplicatedStorage"), rsNode)
local sssNode = serviceNode("ServerScriptService", "ServerScriptService")
loadDir(`{SRC}/ServerScriptService/SomewhereServer`, "SomewhereServer", game:GetService("ServerScriptService"), sssNode)
local spNode = serviceNode("StarterPlayer", "StarterPlayer")
local spsNode = { name = "StarterPlayerScripts", className = "StarterPlayerScripts", children = {} }
table.insert(spNode.children, spsNode)
local sps = Instance.new("StarterPlayerScripts")
sps.Parent = starterPlayer
loadDir(`{SRC}/StarterPlayer/StarterPlayerScripts/SomewhereClient`, "SomewhereClient", sps, spsNode)
-- Services the type checker should know about, even though we put nothing in them.
for _, svc in { "Workspace", "Lighting", "Players", "SoundService", "TweenService", "RunService", "TextChatService" } do
	serviceNode(svc, svc)
end

-- Every script must at least compile.
local compileErrors = 0
for _, entry in scriptFiles do
	local ok, err = pcall(luau.compile, entry.inst.Source)
	if not ok then
		compileErrors += 1
		print(`COMPILE ERROR in {entry.path}: {err}`)
	end
end
assert(compileErrors == 0, `{compileErrors} script(s) failed to compile`)
print(`Compiled {#scriptFiles} scripts`)

------------------------------------------------------------------------------
-- 2. Run the real world builder against this DataModel
------------------------------------------------------------------------------

local makeEnv

-- Enough of Roblox's Random for modules that create one at load time.
local RandomShim = {
	new = function(_seed: number?)
		return {
			NextNumber = function(_, lo: number?, hi: number?)
				local a, b = lo or 0, hi or 1
				return a + (b - a) * math.random()
			end,
			NextInteger = function(_, lo: number, hi: number)
				return math.random(lo, hi)
			end,
		}
	end,
}

local InstanceShim = {
	new = function(className: string, parent: any?)
		local inst = Instance.new(className)
		if parent then
			inst.Parent = parent
		end
		return inst
	end,
}

-- A tiny stand-in for Roblox's require(): runs ModuleScript sources against a given DataModel.
local function makeRequire(dataModel: any)
	local cache = {}
	local function emulatedRequire(module: any)
		if cache[module] ~= nil then
			return cache[module]
		end
		assert(typeof(module) == "Instance" and module.ClassName == "ModuleScript", "require() expects a ModuleScript")
		local result = luau.load(module.Source, {
			debugName = module:GetFullName(),
			environment = makeEnv(dataModel, module, emulatedRequire),
		})()
		cache[module] = result
		return result
	end
	return emulatedRequire
end

function makeEnv(dataModel: any, scriptInstance: any, requireFn: any)
	return {
		script = scriptInstance,
		game = dataModel,
		workspace = dataModel:GetService("Workspace"),
		Instance = InstanceShim,
		Vector3 = roblox.Vector3,
		Vector2 = roblox.Vector2,
		CFrame = roblox.CFrame,
		Color3 = roblox.Color3,
		BrickColor = roblox.BrickColor,
		Enum = roblox.Enum,
		UDim = roblox.UDim,
		UDim2 = roblox.UDim2,
		Font = roblox.Font,
		NumberSequence = roblox.NumberSequence,
		NumberSequenceKeypoint = roblox.NumberSequenceKeypoint,
		ColorSequence = roblox.ColorSequence,
		ColorSequenceKeypoint = roblox.ColorSequenceKeypoint,
		NumberRange = roblox.NumberRange,
		PhysicalProperties = roblox.PhysicalProperties,
		Random = RandomShim,
		typeof = typeof,
		print = print,
		warn = print,
		require = requireFn,
	}
end
local emulatedRequire = makeRequire(game)

local server = game:GetService("ServerScriptService").SomewhereServer
local Builder = emulatedRequire(server.World.Builder)
local Config = emulatedRequire(game:GetService("ReplicatedStorage").SomewhereShared.Config)
local Text = emulatedRequire(game:GetService("ReplicatedStorage").SomewhereShared.Text)

workspace.StreamingEnabled = false
local terrain = Instance.new("Terrain")
terrain.Parent = workspace
Builder.SetupLighting(lighting, terrain)
starterPlayer.CharacterWalkSpeed = Config.Player.WalkSpeed
starterPlayer.CameraMaxZoomDistance = Config.Player.CameraMaxZoom

local town = Builder.Build()

-- Stand-in terrain that records what would be filled.
local terrainOps = {}
local function cfData(cf)
	local p = cf.Position
	local look = cf.LookVector
	return { p.X, p.Y, p.Z, math.atan2(-look.X, -look.Z) }
end
local mockTerrain = {
	FillBlock = function(_, cf, size, material)
		table.insert(terrainOps, { op = "block", cf = cfData(cf), size = { size.X, size.Y, size.Z }, mat = material.Name })
	end,
	FillCylinder = function(_, cf, height, radius, material)
		table.insert(terrainOps, { op = "cylinder", cf = cfData(cf), height = height, radius = radius, mat = material.Name })
	end,
	FillBall = function(_, center, radius, material)
		table.insert(terrainOps, { op = "ball", center = { center.X, center.Y, center.Z }, radius = radius, mat = material.Name })
	end,
}
Builder.BuildTerrain(mockTerrain)

-- Event props and vehicles are built at runtime; build each once here so typos surface now.
local scratch = Instance.new("Folder")
local Vehicles = emulatedRequire(server.World.Vehicles)
local Props = emulatedRequire(server.World.Props)
local origin = roblox.CFrame.new(0, 0, 0)
for _, name in { "car", "pickup", "iceCreamTruck", "duckTruck", "tractorAndWagon", "bus" } do
	local m = Vehicles[name](scratch, origin, roblox.Color3.new(1, 0, 0))
	assert(m.PrimaryPart, `{name} has no PrimaryPart`)
end
for _, name in { "deer", "owl", "raccoon", "chicken", "mower", "gnome", "umbrella", "suitcase", "sunflowerJar", "books", "radio", "compass" } do
	local m = Props[name](scratch, origin)
	assert(m.PrimaryPart, `{name} has no PrimaryPart`)
end
for _, kind in { "Straw", "Bucket", "Cap", "Fedora", "Bun" } do
	Props.hat(scratch, kind, roblox.Color3.new(1, 1, 1))
end
Props.apron(scratch, roblox.Color3.new(1, 1, 1))
Props.fishingRod(scratch)
local scratchParts = 0
for _, d in scratch:GetDescendants() do
	if d:IsA("BasePart") then
		scratchParts += 1
	end
end
scratch:Destroy()
print(`Runtime props and vehicles build cleanly ({scratchParts} parts across all of them)`)

------------------------------------------------------------------------------
-- 3. Consistency checks
------------------------------------------------------------------------------

local problems = {}
local function problem(msg: string)
	table.insert(problems, msg)
end

local counts = { parts = 0, lights = 0, interact = 0, fixtures = 0, seats = 0 }
local anchors = {}
local interactKinds = {}
local validItems = { Coffee = true, Pie = true, Soda = true, Snack = true, IceCream = true }
local knownKinds = { Door = true, Read = true, Give = true, Bell = true, Jukebox = true, Pet = true, Switch = true }
for _, d in town:GetDescendants() do
	if d:IsA("BasePart") then
		counts.parts += 1
		if d:IsA("Seat") then
			counts.seats += 1
		end
		local anchor = d:GetAttribute("Anchor")
		if anchor then
			anchors[anchor] = (anchors[anchor] or 0) + 1
		end
		local kind = d:GetAttribute("Interact")
		if kind then
			counts.interact += 1
			interactKinds[kind] = (interactKinds[kind] or 0) + 1
			if not knownKinds[kind] then
				problem(`{d:GetFullName()}: unknown Interact kind {kind}`)
			end
			local textId = d:GetAttribute("TextId")
			if textId and not (Text.Notes[textId] or Text.Discoveries[textId]) then
				problem(`{d:GetFullName()}: TextId {textId} has no text`)
			end
			local discovery = d:GetAttribute("Discovery")
			if discovery and not Text.Discoveries[discovery] then
				problem(`{d:GetFullName()}: Discovery {discovery} has no entry`)
			end
			if kind == "Give" then
				local item = d:GetAttribute("Item")
				if not validItems[item] then
					problem(`{d:GetFullName()}: unknown Item {item}`)
				end
				local line = d:GetAttribute("Line")
				if line and not Text.Lines[line] then
					problem(`{d:GetFullName()}: unknown Line {line}`)
				end
			end
			if kind == "Read" and not textId then
				problem(`{d:GetFullName()}: Read without TextId`)
			end
		end
		if d:GetAttribute("LightGroup") then
			counts.fixtures += 1
		end
		local ambient = d:GetAttribute("AmbientSound")
		if ambient and Config.Sounds[ambient] == nil then
			problem(`{d:GetFullName()}: AmbientSound {ambient} is not a Config.Sounds slot`)
		end
	elseif d:IsA("Light") then
		counts.lights += 1
	end
end
local requiredAnchors = {
	"NPC_Marv",
	"NPC_Dot",
	"NPC_Hollis",
	"NPC_Wendell",
	"BusBench",
	"BusStopRoad",
	"BusStopCurb",
	"TravelerArrive",
	"RoadsideSpot",
	"WoodsSpot",
	"RoadWest",
	"RoadEast",
	"StoreCurb",
	"ClearingCenter",
	"MowerHome",
	"GnomeHome",
	"DinerDoorOutside",
	"DinerDoorInside",
	"DinerStool",
	"DinerBehindCounter",
}
for _, name in requiredAnchors do
	if not anchors[name] then
		problem(`missing anchor {name}`)
	end
end
-- The cutscene: every shot must point at real events, weather and people, and fit its timing.
local Cutscene = emulatedRequire(game:GetService("ReplicatedStorage").SomewhereShared.Cutscene)
local Weather = emulatedRequire(server.Systems.Weather)
local eventIds = {}
for _, m in server.Events.Catalog:GetChildren() do
	eventIds[m.Name] = true
end
local residents = { Marv = true, Dot = true, Hollis = true, Wendell = true }
local totalTime = 0
local shotExport = {}
for i, shot in Cutscene.Shots do
	local where = `Cutscene shot {i} ({shot.Name})`
	totalTime += shot.Duration
	if shot.Duration <= 0 then
		problem(`{where}: Duration must be positive`)
	end
	for _, w in { shot.Weather, shot.WeatherRamp and shot.WeatherRamp.Name } do
		if w and not Weather.States[w] then
			problem(`{where}: unknown weather {w}`)
		end
	end
	if shot.Event and not eventIds[shot.Event.Id] then
		problem(`{where}: unknown event {shot.Event.Id}`)
	end
	for _, cue in shot.Cues or {} do
		if cue.Do ~= "Flash" and cue.Do ~= "Say" then
			problem(`{where}: unknown cue {cue.Do}`)
		end
		if cue.Do == "Say" and not residents[cue.Npc] then
			problem(`{where}: nobody called {cue.Npc}`)
		end
		if cue.At > shot.Duration then
			problem(`{where}: cue at {cue.At}s is after the shot ends`)
		end
	end
	for _, c in shot.Captions or {} do
		if c.To > shot.Duration + 0.01 or c.From >= c.To then
			problem(`{where}: caption "{c.Text}" doesn't fit inside the shot`)
		end
	end
	local function key(k)
		return { pos = { k.Pos.X, k.Pos.Y, k.Pos.Z }, look = { k.Look.X, k.Look.Y, k.Look.Z } }
	end
	local avatar = nil
	if shot.Avatar then
		local at = shot.Avatar.At.Position
		local walk = {}
		for _, w in shot.Avatar.Walk or {} do
			table.insert(walk, { w.X, w.Y, w.Z })
		end
		local sit = shot.Avatar.Sit
		avatar = {
			at = { at.X, at.Y, at.Z },
			walk = walk,
			speed = shot.Avatar.Speed or 8,
			sit = sit ~= nil,
			sitAt = if sit then { sit.X, sit.Y, sit.Z } else nil,
		}
	end
	table.insert(shotExport, {
		name = shot.Name,
		duration = shot.Duration,
		ease = shot.Ease or "InOut",
		from = key(shot.From),
		to = key(shot.To),
		avatar = avatar,
		-- The tighter of the two lenses, so the frame check is never too generous.
		fov = math.min(shot.From.Fov or Cutscene.Settings.DefaultFov, shot.To.Fov or shot.From.Fov or Cutscene.Settings.DefaultFov),
	})
end
print(`Cutscene: {#Cutscene.Shots} shots, {math.floor(totalTime / 60)}:{string.format("%02d", math.floor(totalTime % 60))} long`)

print(`Town: {counts.parts} parts, {counts.lights} lights, {counts.fixtures} switchable fixtures, {counts.seats} seats, {counts.interact} interactables`)
local kindsList = {}
for k, n in interactKinds do
	table.insert(kindsList, `{k}={n}`)
end
table.sort(kindsList)
print(`Interactables by kind: {table.concat(kindsList, ", ")}`)
print(`Terrain operations recorded: {#terrainOps}`)

if #problems > 0 then
	for _, p in problems do
		print("PROBLEM: " .. p)
	end
	process.exit(1)
end
print("All consistency checks passed")

------------------------------------------------------------------------------
-- 4. Outputs
------------------------------------------------------------------------------

if not fs.isDir(DIST) then
	fs.writeDir(DIST)
end

fs.writeFile(`{DIST}/SomewhereAlongTheRoad_Cutscene.rbxl`, roblox.serializePlace(game))
fs.writeFile("sourcemap.json", serde.encode("json", sourcemap, true))

-- Map data for the preview renderer.
local mapParts = {}
for _, d in town:GetDescendants() do
	if d:IsA("BasePart") and d.Transparency < 0.95 then
		local cf = d.CFrame
		local shape = if d:IsA("Part") then d.Shape.Name else d.ClassName
		local c = d.Color
		table.insert(mapParts, {
			n = d.Name,
			k = shape,
			p = { cf.Position.X, cf.Position.Y, cf.Position.Z },
			x = { cf.XVector.X, cf.XVector.Y, cf.XVector.Z },
			y = { cf.YVector.X, cf.YVector.Y, cf.YVector.Z },
			z = { cf.ZVector.X, cf.ZVector.Y, cf.ZVector.Z },
			s = { d.Size.X, d.Size.Y, d.Size.Z },
			c = { math.floor(c.R * 255), math.floor(c.G * 255), math.floor(c.B * 255) },
			t = d.Transparency,
		})
	end
end
fs.writeFile(`{DIST}/map.json`, serde.encode("json", { parts = mapParts, terrain = terrainOps, shots = shotExport }, false))

-- The Command Bar bootstrap: recreates every script, then builds the town and terrain.
local LEVEL = string.rep("=", 6)
for _, entry in scriptFiles do
	assert(not entry.inst.Source:find("]" .. LEVEL .. "]", 1, true), "source contains the bootstrap delimiter")
end
local lines = {}
local function emit(s: string)
	table.insert(lines, s)
end
emit("-- Somewhere Along the Road: Studio Command Bar bootstrap (generated by tools/build.luau)")
emit("-- Paste ALL of this into View > Command Bar in Roblox Studio and press Enter.")
emit("-- It installs the game's scripts, builds the town and terrain, then you press Play.")
emit("local ok, err = pcall(function()")
emit("local function make(class, name, parent, source)")
emit("\tlocal existing = parent:FindFirstChild(name)")
emit("\tif existing then existing:Destroy() end")
emit("\tlocal inst = Instance.new(class)")
emit("\tinst.Name = name")
emit("\tif source then inst.Source = source end")
emit("\tinst.Parent = parent")
emit("\treturn inst")
emit("end")
emit("local StarterPlayer = game:GetService(\"StarterPlayer\")")
emit("local sps = StarterPlayer:FindFirstChildOfClass(\"StarterPlayerScripts\") or Instance.new(\"StarterPlayerScripts\", StarterPlayer)")
local idFor = {}
local counter = 0
local function emitTree(inst: any, parentExpr: string)
	counter += 1
	local var = `i{counter}`
	idFor[inst] = var
	local isScript = inst:IsA("LuaSourceContainer")
	local source = if isScript then `[{LEVEL}[\n{inst.Source}]{LEVEL}]` else "nil"
	emit(`local {var} = make("{inst.ClassName}", "{inst.Name}", {parentExpr}, {source})`)
	for _, child in inst:GetChildren() do
		emitTree(child, var)
	end
end
emitTree(game:GetService("ReplicatedStorage").SomewhereShared, "game:GetService(\"ReplicatedStorage\")")
emitTree(server, "game:GetService(\"ServerScriptService\")")
emitTree(sps.SomewhereClient, "sps")
emit("workspace.StreamingEnabled = false")
emit(`StarterPlayer.CharacterWalkSpeed = {Config.Player.WalkSpeed}`)
emit(`StarterPlayer.CameraMaxZoomDistance = {Config.Player.CameraMaxZoom}`)
emit("local Builder = require(game:GetService(\"ServerScriptService\").SomewhereServer.World.Builder)")
emit("Builder.Build()")
emit("workspace.Terrain:Clear()")
emit("Builder.BuildTerrain(workspace.Terrain)")
emit("Builder.TintTerrain(workspace.Terrain)")
emit("Builder.SetupLighting(game:GetService(\"Lighting\"), workspace.Terrain)")
emit("end)")
emit("if ok then")
emit("\tprint(\"Somewhere Along the Road is installed. Press Play (F5) to visit.\")")
emit("else")
emit("\twarn(\"Bootstrap stopped: \" .. tostring(err))")
emit("end")
local bootstrap = table.concat(lines, "\n") .. "\n"
fs.writeFile(`{DIST}/Bootstrap_CommandBar.lua`, bootstrap)
local okCompile, compileErr = pcall(luau.compile, bootstrap)
assert(okCompile, `bootstrap does not compile: {compileErr}`)

------------------------------------------------------------------------------
-- 5. Run the bootstrap itself against an empty place, like Studio's Command Bar would
------------------------------------------------------------------------------

local terrainCalls = 0
for _, method in { "FillBlock", "FillBall", "FillCylinder", "FillWedge" } do
	roblox.implementMethod("Terrain", method, function()
		terrainCalls += 1
	end)
end
roblox.implementMethod("Terrain", "Clear", function() end)
roblox.implementMethod("Terrain", "SetMaterialColor", function() end)

local fresh = Instance.new("DataModel")
local freshTerrain = Instance.new("Terrain")
freshTerrain.Parent = fresh:GetService("Workspace")
local printed = {}
local env = makeEnv(fresh, nil, makeRequire(fresh))
env.print = function(...)
	table.insert(printed, table.concat({ ... }, " "))
end
env.warn = function(...)
	error("bootstrap warned: " .. table.concat({ ... }, " "))
end
luau.load(bootstrap, { debugName = "Bootstrap_CommandBar", environment = env })()
local freshTown = fresh:GetService("Workspace"):FindFirstChild(Config.World.FolderName)
assert(freshTown, "bootstrap did not build the town")
local freshParts = 0
for _, d in freshTown:GetDescendants() do
	if d:IsA("BasePart") then
		freshParts += 1
	end
end
assert(freshParts == counts.parts, `bootstrap built {freshParts} parts, expected {counts.parts}`)
assert(terrainCalls == #terrainOps, `bootstrap made {terrainCalls} terrain calls, expected {#terrainOps}`)
local freshServer = fresh:GetService("ServerScriptService"):FindFirstChild("SomewhereServer")
assert(freshServer and freshServer.ClassName == "Script", "bootstrap did not install the server script")
local freshScripts = 0
for _, d in fresh:GetDescendants() do
	if d:IsA("LuaSourceContainer") then
		freshScripts += 1
	end
end
assert(freshScripts == #scriptFiles, `bootstrap installed {freshScripts} scripts, expected {#scriptFiles}`)
print(`Bootstrap dry run: installed {freshScripts} scripts, built {freshParts} parts and {terrainCalls} terrain fills ("{printed[#printed] or ""}")`)

print(`Wrote {DIST}/SomewhereAlongTheRoad_Cutscene.rbxl, {DIST}/Bootstrap_CommandBar.lua ({math.floor(#bootstrap / 1024)} KB), sourcemap.json, {DIST}/map.json`)
