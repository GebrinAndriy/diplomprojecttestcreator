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

-- ===== Анімація кристалів =====
RunService.Heartbeat:Connect(function()
	local t = os.clock()
	for _, c in ipairs(crystals) do
		c.part.CFrame = CFrame.new(c.base + Vector3.new(0, math.sin(t) * 0.5, 0))
			* CFrame.Angles(0, t, t * 0.5)
	end
end)

print("[Map] Оформлення сцени застосовано ✅")
