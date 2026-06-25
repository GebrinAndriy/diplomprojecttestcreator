--[[
	Map — будує гарну сцену з кількома AFK-зонами при старті гри.
	Кожна зона: світла платформа, неонове кільце, колони з кристалами,
	кристал що крутиться, вивіска з назвою і бонусом.
	Геометрія спільна (на сервері). Бар'єри/замки малює клієнт (Zones.client).
--]]

local Lighting = game:GetService("Lighting")
local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local GameConfig = require(ReplicatedStorage:WaitForChild("GameConfig"))

-- прибираємо стару сцену, якщо Rojo пересинхронив
local old = Workspace:FindFirstChild("AFK_Scene")
if old then old:Destroy() end

local scene = Instance.new("Folder")
scene.Name = "AFK_Scene"
scene.Parent = Workspace

-- список кристалів для анімації
local crystals = {}

-- хелпер для деталей
local function part(parent, props)
	local p = Instance.new("Part")
	p.Anchored = true
	p.CanCollide = props.CanCollide ~= false
	for k, v in pairs(props) do
		if k ~= "CanCollide" then
			p[k] = v
		end
	end
	p.Parent = parent
	return p
end

-- ===== Будуємо одну зону =====
local function buildZone(zone, index)
	local folder = Instance.new("Folder")
	folder.Name = "Zone_" .. index
	folder:SetAttribute("ZoneName", zone.name)
	folder:SetAttribute("Unlock", zone.unlock)
	folder.Parent = scene

	local THEME = zone.color
	local pos = zone.pos
	local R = zone.radius

	-- платформа (диск)
	part(folder, {
		Name = "Pad",
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(1, R * 2, R * 2),
		CFrame = CFrame.new(pos) * CFrame.Angles(0, 0, math.rad(90)),
		Material = Enum.Material.SmoothPlastic,
		Color = Color3.fromRGB(30, 35, 45),
	})

	-- неоновий обідок
	part(folder, {
		Name = "Ring",
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(0.6, R * 2 + 1.2, R * 2 + 1.2),
		CFrame = CFrame.new(pos) * CFrame.Angles(0, 0, math.rad(90)),
		Material = Enum.Material.Neon,
		Color = THEME,
		CanCollide = false,
	})

	-- світіння по центру
	part(folder, {
		Name = "Glow",
		Shape = Enum.PartType.Cylinder,
		Size = Vector3.new(1.1, R * 1.4, R * 1.4),
		CFrame = CFrame.new(pos + Vector3.new(0, 0.05, 0)) * CFrame.Angles(0, 0, math.rad(90)),
		Material = Enum.Material.Neon,
		Color = THEME,
		Transparency = 0.6,
		CanCollide = false,
	})

	-- колони з кристалами по колу
	local PILLARS = 6
	for i = 1, PILLARS do
		local angle = (i / PILLARS) * math.pi * 2
		local offset = Vector3.new(math.cos(angle), 0, math.sin(angle)) * (R + 2)
		part(folder, {
			Name = "Pillar",
			Size = Vector3.new(1.5, 9, 1.5),
			CFrame = CFrame.new(pos + offset + Vector3.new(0, 4.5, 0)),
			Material = Enum.Material.SmoothPlastic,
			Color = Color3.fromRGB(40, 45, 58),
		})
		part(folder, {
			Name = "PillarTop",
			Shape = Enum.PartType.Ball,
			Size = Vector3.new(2, 2, 2),
			CFrame = CFrame.new(pos + offset + Vector3.new(0, 9.5, 0)),
			Material = Enum.Material.Neon,
			Color = THEME,
			CanCollide = false,
		})
	end

	-- центральний кристал (анімується)
	local crystal = part(folder, {
		Name = "Crystal",
		Shape = Enum.PartType.Ball,
		Size = Vector3.new(4, 4, 4),
		CFrame = CFrame.new(pos + Vector3.new(0, 8, 0)),
		Material = Enum.Material.Neon,
		Color = THEME,
		Transparency = 0.15,
		CanCollide = false,
	})
	table.insert(crystals, { part = crystal, base = pos + Vector3.new(0, 8, 0) })

	local light = Instance.new("PointLight")
	light.Color = THEME
	light.Brightness = 5
	light.Range = 32
	light.Parent = crystal

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

	-- вивіска над зоною
	local sign = part(folder, {
		Name = "Sign",
		Size = Vector3.new(0.2, 0.2, 0.2),
		CFrame = CFrame.new(pos + Vector3.new(0, 13, 0)),
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
	title.Text = zone.name
	title.TextColor3 = THEME
	title.TextScaled = true
	title.TextStrokeTransparency = 0
	title.Parent = billboard

	local subtitle = Instance.new("TextLabel")
	subtitle.Position = UDim2.new(0, 0, 0.55, 0)
	subtitle.Size = UDim2.new(1, 0, 0.45, 0)
	subtitle.BackgroundTransparency = 1
	subtitle.Font = Enum.Font.GothamMedium
	subtitle.Text = "+" .. zone.bonus .. " монет/сек"
	subtitle.TextColor3 = Color3.fromRGB(255, 255, 255)
	subtitle.TextScaled = true
	subtitle.TextStrokeTransparency = 0.4
	subtitle.Parent = billboard
end

-- будуємо всі зони
for i, zone in ipairs(GameConfig.ZONES) do
	buildZone(zone, i)
end

-- ===== Точка спавну =====
local spawnLoc = Instance.new("SpawnLocation")
spawnLoc.Name = "Spawn"
spawnLoc.Anchored = true
spawnLoc.Size = Vector3.new(10, 1, 10)
spawnLoc.CFrame = CFrame.new(0, 1, 0)
spawnLoc.Material = Enum.Material.SmoothPlastic
spawnLoc.Color = Color3.fromRGB(55, 60, 75)
spawnLoc.Parent = scene

-- ===== Освітлення сцени =====
Lighting.ClockTime = 18
Lighting.Brightness = 2
Lighting.OutdoorAmbient = Color3.fromRGB(70, 70, 90)
Lighting.FogEnd = 600

local atmosphere = Lighting:FindFirstChildOfClass("Atmosphere") or Instance.new("Atmosphere")
atmosphere.Density = 0.35
atmosphere.Haze = 1.5
atmosphere.Color = Color3.fromRGB(199, 220, 255)
atmosphere.Parent = Lighting

local bloom = Lighting:FindFirstChildOfClass("BloomEffect") or Instance.new("BloomEffect")
bloom.Intensity = 0.6
bloom.Size = 24
bloom.Threshold = 1.2
bloom.Parent = Lighting

-- ===== Анімація всіх кристалів =====
RunService.Heartbeat:Connect(function()
	local t = os.clock()
	for _, c in ipairs(crystals) do
		c.part.CFrame = CFrame.new(c.base + Vector3.new(0, math.sin(t) * 0.5, 0))
			* CFrame.Angles(0, t, t * 0.5)
	end
end)

print("[Map] Побудовано зон: " .. #GameConfig.ZONES .. " ✅")
