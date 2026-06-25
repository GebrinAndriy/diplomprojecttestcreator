--[[
	Map — оформлення сцени (сервер).
	Сама геометрія зон тепер лежить у Workspace.AFK_Scene як справжні
	об'єкти (видно в едіторі, синхронізує Rojo з src/workspace).
	Цей скрипт лише додає те, що зручніше робити кодом:
	- освітлення сцени
	- частинки й вивіски на кожній зоні
	- анімацію кристалів
--]]

local Lighting = game:GetService("Lighting")
local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local GameConfig = require(ReplicatedStorage:WaitForChild("GameConfig"))

local scene = Workspace:WaitForChild("AFK_Scene")

-- ===== Освітлення сцени (вечірня неонова атмосфера) =====
pcall(function()
	Lighting.Technology = Enum.Technology.Future -- гарні тіні + світіння неону
end)
Lighting.ClockTime = 18.6
Lighting.Brightness = 2
Lighting.GlobalShadows = true
Lighting.OutdoorAmbient = Color3.fromRGB(60, 60, 85)
Lighting.Ambient = Color3.fromRGB(30, 30, 45)
Lighting.FogEnd = 700
Lighting.FogColor = Color3.fromRGB(40, 45, 70)
Lighting.EnvironmentDiffuseScale = 0.4
Lighting.EnvironmentSpecularScale = 0.6

local atmosphere = Lighting:FindFirstChildOfClass("Atmosphere") or Instance.new("Atmosphere")
atmosphere.Density = 0.38
atmosphere.Haze = 2
atmosphere.Glare = 0.2
atmosphere.Color = Color3.fromRGB(199, 210, 255)
atmosphere.Decay = Color3.fromRGB(106, 112, 156)
atmosphere.Parent = Lighting

local bloom = Lighting:FindFirstChildOfClass("BloomEffect") or Instance.new("BloomEffect")
bloom.Intensity = 0.9
bloom.Size = 28
bloom.Threshold = 1.1
bloom.Parent = Lighting

local cc = Lighting:FindFirstChildOfClass("ColorCorrectionEffect") or Instance.new("ColorCorrectionEffect")
cc.Saturation = 0.18
cc.Contrast = 0.12
cc.TintColor = Color3.fromRGB(225, 225, 255)
cc.Parent = Lighting

local rays = Lighting:FindFirstChildOfClass("SunRaysEffect") or Instance.new("SunRaysEffect")
rays.Intensity = 0.12
rays.Spread = 0.8
rays.Parent = Lighting

-- ===== Ефекти й вивіски на кожній зоні =====
local crystals = {}

for i, zone in ipairs(GameConfig.ZONES) do
	local folder = scene:FindFirstChild("Zone_" .. i)
	if not folder then
		continue
	end
	local THEME = zone.color

	-- кристал: частинки + у список на анімацію
	local crystal = folder:FindFirstChild("Crystal")
	if crystal then
		table.insert(crystals, { part = crystal, base = zone.pos + Vector3.new(0, 8, 0) })

		if not crystal:FindFirstChildOfClass("ParticleEmitter") then
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
		end
	end

	-- вивіска над зоною
	if not folder:FindFirstChild("Sign") then
		local sign = Instance.new("Part")
		sign.Name = "Sign"
		sign.Anchored = true
		sign.CanCollide = false
		sign.Transparency = 1
		sign.Size = Vector3.new(0.2, 0.2, 0.2)
		sign.CFrame = CFrame.new(zone.pos + Vector3.new(0, 13, 0))
		sign.Parent = folder

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
end

-- ===== Декоративні кристали (острови, спавн) теж анімуємо =====
for _, d in ipairs(scene:GetDescendants()) do
	if d:IsA("BasePart") and d.Name == "FloatCrystal" then
		table.insert(crystals, { part = d, base = d.Position, slow = true })
	end
end

-- ===== Заголовок над спавном =====
do
	local sign = Instance.new("Part")
	sign.Name = "SpawnTitle"
	sign.Anchored = true
	sign.CanCollide = false
	sign.Transparency = 1
	sign.Size = Vector3.new(0.2, 0.2, 0.2)
	sign.CFrame = CFrame.new(0, 22, 0)
	sign.Parent = scene

	local bb = Instance.new("BillboardGui")
	bb.Size = UDim2.new(0, 420, 0, 90)
	bb.AlwaysOnTop = true
	bb.Parent = sign

	local label = Instance.new("TextLabel")
	label.Size = UDim2.new(1, 0, 1, 0)
	label.BackgroundTransparency = 1
	label.Font = Enum.Font.FredokaOne
	label.Text = "⚡ AFK SIMULATOR ⚡"
	label.TextColor3 = Color3.fromRGB(180, 120, 255)
	label.TextScaled = true
	label.TextStrokeTransparency = 0
	label.Parent = bb
end

-- ===== Анімація кристалів =====
RunService.Heartbeat:Connect(function()
	local t = os.clock()
	for _, c in ipairs(crystals) do
		local speed = c.slow and 0.4 or 1
		c.part.CFrame = CFrame.new(c.base + Vector3.new(0, math.sin(t * speed) * 0.6, 0))
			* CFrame.Angles(0, t * speed, t * speed * 0.5)
	end
end)

print("[Map] Оформлення сцени застосовано ✅")
