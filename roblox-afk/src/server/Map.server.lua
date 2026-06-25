--[[
	Map — оформлення сцени (сервер).
	Геометрія лежить у Workspace.AFK_Scene (Rojo, src/workspace).
	Цей скрипт: чисте освітлення, легкі частинки на кристалах,
	анімація кристалів, заголовок над спавном.
	Вивіски зон тепер на клієнті (Zones.client) — щоб не дублювались.
--]]

local Lighting = game:GetService("Lighting")
local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local GameConfig = require(ReplicatedStorage:WaitForChild("GameConfig"))

local scene = Workspace:WaitForChild("AFK_Scene")

-- ===== Освітлення (чисте денне, без неонового перебору) =====
pcall(function()
	Lighting.Technology = Enum.Technology.Future
end)
Lighting.ClockTime = 15
Lighting.Brightness = 2.5
Lighting.GlobalShadows = true
Lighting.OutdoorAmbient = Color3.fromRGB(120, 122, 132)
Lighting.Ambient = Color3.fromRGB(80, 82, 92)
Lighting.FogEnd = 100000
Lighting.EnvironmentDiffuseScale = 0.6
Lighting.EnvironmentSpecularScale = 0.6

local atmosphere = Lighting:FindFirstChildOfClass("Atmosphere") or Instance.new("Atmosphere")
atmosphere.Density = 0.2
atmosphere.Haze = 0.4
atmosphere.Glare = 0
atmosphere.Color = Color3.fromRGB(210, 220, 240)
atmosphere.Decay = Color3.fromRGB(150, 165, 200)
atmosphere.Parent = Lighting

-- легкий bloom лише щоб кристали трохи світились
local bloom = Lighting:FindFirstChildOfClass("BloomEffect") or Instance.new("BloomEffect")
bloom.Intensity = 0.25
bloom.Size = 24
bloom.Threshold = 1.8
bloom.Parent = Lighting

local cc = Lighting:FindFirstChildOfClass("ColorCorrectionEffect") or Instance.new("ColorCorrectionEffect")
cc.Saturation = 0.05
cc.Contrast = 0.05
cc.TintColor = Color3.fromRGB(255, 255, 255)
cc.Parent = Lighting

-- ===== Легкі частинки на кристалах зон =====
local crystals = {}

for i, zone in ipairs(GameConfig.ZONES) do
	local folder = scene:FindFirstChild("Zone_" .. i)
	if not folder then
		continue
	end

	local crystal = folder:FindFirstChild("Crystal")
	if crystal then
		table.insert(crystals, { part = crystal, base = zone.pos + Vector3.new(0, 8, 0) })

		if not crystal:FindFirstChildOfClass("ParticleEmitter") then
			local sparkles = Instance.new("ParticleEmitter")
			sparkles.Color = ColorSequence.new(zone.color)
			sparkles.LightEmission = 0.6
			sparkles.Lifetime = NumberRange.new(1, 1.8)
			sparkles.Rate = 10
			sparkles.Speed = NumberRange.new(1, 2)
			sparkles.Size = NumberSequence.new(0.35)
			sparkles.Transparency = NumberSequence.new({
				NumberSequenceKeypoint.new(0, 0.3),
				NumberSequenceKeypoint.new(1, 1),
			})
			sparkles.Parent = crystal
		end
	end
end

-- декоративні кристали (острови, спавн) теж анімуємо
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
	label.Text = "AURA FARM"
	label.TextColor3 = Color3.fromRGB(235, 235, 245)
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
