--[[
	AuraEffects — візуальні ефекти аури навколо гравця (сервер, видно всім).
	Чим вищий AuraTier — тим більше й крутіше: світло, частинки, слід, німб.
	Слухає атрибут AuraTier (його виставляє Economy) і перебудовує ефект.
--]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local GameConfig = require(ReplicatedStorage:WaitForChild("GameConfig"))

local function seq(a, b)
	return NumberSequence.new({
		NumberSequenceKeypoint.new(0, a),
		NumberSequenceKeypoint.new(1, b),
	})
end

-- прибрати старі ефекти
local function clearFX(hrp)
	for _, c in ipairs(hrp:GetChildren()) do
		if string.sub(c.Name, 1, 5) == "Aura_" then
			c:Destroy()
		end
	end
end

-- побудувати ефект для тіру
local function applyFX(char, tier)
	local hrp = char:FindFirstChild("HumanoidRootPart")
	if not hrp then return end
	clearFX(hrp)
	if tier < 1 then return end

	local data = GameConfig.AURA_TIERS[tier] or GameConfig.AURA_TIERS[1]
	local color = data.color

	-- світло
	local light = Instance.new("PointLight")
	light.Name = "Aura_Light"
	light.Color = color
	light.Brightness = 1 + tier * 0.9
	light.Range = 8 + tier * 2.5
	light.Parent = hrp

	-- точка випуску частинок
	local att = Instance.new("Attachment")
	att.Name = "Aura_Att"
	att.Parent = hrp

	-- основні частинки (піднімаються навколо гравця)
	local rise = Instance.new("ParticleEmitter")
	rise.Color = ColorSequence.new(color)
	rise.LightEmission = 1
	rise.LightInfluence = 0
	rise.Lifetime = NumberRange.new(0.8, 1.6)
	rise.Rate = 10 + tier * 10
	rise.Speed = NumberRange.new(2, 5)
	rise.SpreadAngle = Vector2.new(35, 35)
	rise.Acceleration = Vector3.new(0, 7, 0)
	rise.Size = seq(0.2 + tier * 0.12, 0)
	rise.Transparency = seq(0.15, 1)
	rise.Rotation = NumberRange.new(0, 360)
	rise.Parent = att

	-- тір 2+: іскри
	if tier >= 2 then
		local spark = Instance.new("ParticleEmitter")
		spark.Color = ColorSequence.new(Color3.new(1, 1, 1), color)
		spark.LightEmission = 1
		spark.Lifetime = NumberRange.new(0.5, 1)
		spark.Rate = tier * 8
		spark.Speed = NumberRange.new(4, 9)
		spark.SpreadAngle = Vector2.new(180, 180)
		spark.Size = seq(0.25, 0)
		spark.Transparency = seq(0.1, 1)
		spark.Parent = att
	end

	-- тір 3+: світний слід за гравцем
	if tier >= 3 then
		local a0 = Instance.new("Attachment")
		a0.Name = "Aura_T0"
		a0.Position = Vector3.new(0, 1.2, 0)
		a0.Parent = hrp
		local a1 = Instance.new("Attachment")
		a1.Name = "Aura_T1"
		a1.Position = Vector3.new(0, -1.2, 0)
		a1.Parent = hrp
		local trail = Instance.new("Trail")
		trail.Name = "Aura_Trail"
		trail.Attachment0 = a0
		trail.Attachment1 = a1
		trail.Color = ColorSequence.new(color)
		trail.LightEmission = 1
		trail.Lifetime = 0.6 + tier * 0.1
		trail.Transparency = seq(0.2, 1)
		trail.Parent = hrp
	end

	-- тір 4+: німб над головою
	if tier >= 4 then
		local halo = Instance.new("ParticleEmitter")
		halo.Color = ColorSequence.new(color)
		halo.LightEmission = 1
		halo.Lifetime = NumberRange.new(1.2, 1.8)
		halo.Rate = tier * 6
		halo.Speed = NumberRange.new(0, 0)
		halo.SpreadAngle = Vector2.new(0, 0)
		halo.Size = seq(0.6, 0)
		halo.Transparency = seq(0.1, 1)
		halo.Rotation = NumberRange.new(0, 360)
		halo.Parent = att
	end
end

-- ===== Підключення =====
local function bind(player)
	local function refresh()
		if player.Character then
			applyFX(player.Character, player:GetAttribute("AuraTier") or 1)
		end
	end
	player.CharacterAdded:Connect(function()
		task.wait(0.4) -- даємо тілу зібратись
		refresh()
	end)
	player:GetAttributeChangedSignal("AuraTier"):Connect(refresh)
	refresh()
end

Players.PlayerAdded:Connect(bind)
for _, p in ipairs(Players:GetPlayers()) do
	bind(p)
end

print("[AuraEffects] Готово ✅")
