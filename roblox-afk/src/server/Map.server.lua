--[[
	Map — будує гарну AFK-сцену при старті гри.
	Усе створюється кодом, тому з'являється коли тиснеш ▶ Play.
	Центральний елемент: світла AFK-платформа з кристалом і вивіскою.
--]]

local Lighting = game:GetService("Lighting")
local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local GameConfig = require(ReplicatedStorage:WaitForChild("GameConfig"))

-- беремо з єдиного конфіга
local PAD_POSITION = GameConfig.PAD_POSITION
local PAD_RADIUS = GameConfig.PAD_RADIUS
local THEME = GameConfig.THEME

-- прибираємо стару сцену, якщо Rojo пересинхронив (щоб не дублювалось)
local old = Workspace:FindFirstChild("AFK_Scene")
if old then old:Destroy() end

local scene = Instance.new("Folder")
scene.Name = "AFK_Scene"
scene.Parent = Workspace

-- хелпер для створення деталей
local function part(props)
	local p = Instance.new("Part")
	p.Anchored = true
	p.CanCollide = props.CanCollide ~= false
	for k, v in pairs(props) do
		if k ~= "CanCollide" then
			p[k] = v
		end
	end
	p.Parent = scene
	return p
end

-- ===== Платформа (диск) =====
local pad = part({
	Name = "AfkPad",
	Shape = Enum.PartType.Cylinder,
	Size = Vector3.new(1, PAD_RADIUS * 2, PAD_RADIUS * 2),
	CFrame = CFrame.new(PAD_POSITION) * CFrame.Angles(0, 0, math.rad(90)),
	Material = Enum.Material.SmoothPlastic,
	Color = Color3.fromRGB(30, 35, 45),
})

-- неонове кільце-обідок
local ring = part({
	Name = "Ring",
	Shape = Enum.PartType.Cylinder,
	Size = Vector3.new(0.6, PAD_RADIUS * 2 + 1.2, PAD_RADIUS * 2 + 1.2),
	CFrame = CFrame.new(PAD_POSITION) * CFrame.Angles(0, 0, math.rad(90)),
	Material = Enum.Material.Neon,
	Color = THEME,
	CanCollide = false,
})

-- світлий «глоу» по центру платформи
local glow = part({
	Name = "Glow",
	Shape = Enum.PartType.Cylinder,
	Size = Vector3.new(1.1, PAD_RADIUS * 1.4, PAD_RADIUS * 1.4),
	CFrame = CFrame.new(PAD_POSITION + Vector3.new(0, 0.05, 0)) * CFrame.Angles(0, 0, math.rad(90)),
	Material = Enum.Material.Neon,
	Color = THEME,
	Transparency = 0.6,
	CanCollide = false,
})

-- ===== Колони по колу =====
local PILLARS = 6
for i = 1, PILLARS do
	local angle = (i / PILLARS) * math.pi * 2
	local offset = Vector3.new(math.cos(angle), 0, math.sin(angle)) * (PAD_RADIUS + 2)
	-- сама колона
	part({
		Name = "Pillar",
		Size = Vector3.new(1.5, 9, 1.5),
		CFrame = CFrame.new(PAD_POSITION + offset + Vector3.new(0, 4.5, 0)),
		Material = Enum.Material.SmoothPlastic,
		Color = Color3.fromRGB(40, 45, 58),
	})
	-- неоновий «кристал» на вершині колони
	part({
		Name = "PillarTop",
		Shape = Enum.PartType.Ball,
		Size = Vector3.new(2, 2, 2),
		CFrame = CFrame.new(PAD_POSITION + offset + Vector3.new(0, 9.5, 0)),
		Material = Enum.Material.Neon,
		Color = THEME,
		CanCollide = false,
	})
end

-- ===== Кристал, що крутиться над центром =====
local crystal = part({
	Name = "Crystal",
	Shape = Enum.PartType.Ball,
	Size = Vector3.new(4, 4, 4),
	CFrame = CFrame.new(PAD_POSITION + Vector3.new(0, 8, 0)),
	Material = Enum.Material.Neon,
	Color = THEME,
	CanCollide = false,
	Transparency = 0.15,
})

-- світло від кристала
local light = Instance.new("PointLight")
light.Color = THEME
light.Brightness = 5
light.Range = 30
light.Parent = crystal

-- іскорки навколо кристала
local sparkles = Instance.new("ParticleEmitter")
sparkles.Color = ColorSequence.new(THEME)
sparkles.LightEmission = 1
sparkles.Lifetime = NumberRange.new(1, 2)
sparkles.Rate = 25
sparkles.Speed = NumberRange.new(1, 3)
sparkles.Size = NumberSequence.new(0.5)
sparkles.Transparency = NumberSequence.new({
	NumberSequenceKeypoint.new(0, 0),
	NumberSequenceKeypoint.new(1, 1),
})
sparkles.Parent = crystal

-- ===== Вивіска над зоною =====
local sign = part({
	Name = "Sign",
	Size = Vector3.new(0.2, 0.2, 0.2),
	CFrame = CFrame.new(PAD_POSITION + Vector3.new(0, 13, 0)),
	Transparency = 1,
	CanCollide = false,
})

local billboard = Instance.new("BillboardGui")
billboard.Size = UDim2.new(0, 320, 0, 110)
billboard.AlwaysOnTop = true
billboard.Parent = sign

local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, 0, 0.55, 0)
title.BackgroundTransparency = 1
title.Font = Enum.Font.FredokaOne
title.Text = "⚡ AFK BOOST ×5 ⚡"
title.TextColor3 = THEME
title.TextScaled = true
title.TextStrokeTransparency = 0
title.Parent = billboard

local subtitle = Instance.new("TextLabel")
subtitle.Position = UDim2.new(0, 0, 0.55, 0)
subtitle.Size = UDim2.new(1, 0, 0.45, 0)
subtitle.BackgroundTransparency = 1
subtitle.Font = Enum.Font.GothamMedium
subtitle.Text = "Стій тут і отримуй більше монет"
subtitle.TextColor3 = Color3.fromRGB(255, 255, 255)
subtitle.TextScaled = true
subtitle.TextStrokeTransparency = 0.4
subtitle.Parent = billboard

-- ===== Точка спавну поряд (щоб гравець йшов до зони) =====
local spawnLoc = Instance.new("SpawnLocation")
spawnLoc.Name = "Spawn"
spawnLoc.Anchored = true
spawnLoc.Size = Vector3.new(8, 1, 8)
spawnLoc.CFrame = CFrame.new(0, 1, 0)
spawnLoc.Material = Enum.Material.SmoothPlastic
spawnLoc.Color = Color3.fromRGB(55, 60, 75)
spawnLoc.Parent = scene

-- ===== Освітлення сцени (приємний вечір) =====
Lighting.ClockTime = 18
Lighting.Brightness = 2
Lighting.OutdoorAmbient = Color3.fromRGB(70, 70, 90)
Lighting.FogEnd = 500

-- атмосфера
local atmosphere = Lighting:FindFirstChildOfClass("Atmosphere") or Instance.new("Atmosphere")
atmosphere.Density = 0.35
atmosphere.Haze = 1.5
atmosphere.Color = Color3.fromRGB(199, 220, 255)
atmosphere.Parent = Lighting

-- легке світіння (bloom) для неону
local bloom = Lighting:FindFirstChildOfClass("BloomEffect") or Instance.new("BloomEffect")
bloom.Intensity = 0.6
bloom.Size = 24
bloom.Threshold = 1.2
bloom.Parent = Lighting

-- ===== Анімація кристала (повільне обертання + плавне «дихання») =====
RunService.Heartbeat:Connect(function()
	local t = os.clock()
	crystal.CFrame = CFrame.new(PAD_POSITION + Vector3.new(0, 8 + math.sin(t) * 0.5, 0))
		* CFrame.Angles(0, t, t * 0.5)
end)

print("[Map] AFK-сцену побудовано ✅")
