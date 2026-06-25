--[[
	AuraEffects — аніме-аура навколо гравця (сервер, видно всім).
	Чим вищий AuraTier, тим масштабніше: світло, стовп енергії, хмара-обгортка,
	іскри, слід, викид від ніг, величезне сяйво на топ-тірах.
	Слухає атрибут AuraTier (його виставляє Economy).
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

local function clearFX(hrp)
	for _, c in ipairs(hrp:GetChildren()) do
		if string.sub(c.Name, 1, 5) == "Aura_" then
			c:Destroy()
		end
	end
end

local function applyFX(char, tier)
	local hrp = char:FindFirstChild("HumanoidRootPart")
	if not hrp then return end
	clearFX(hrp)
	if tier < 1 then return end

	local data = GameConfig.AURA_TIERS[tier] or GameConfig.AURA_TIERS[1]
	local color = data.color
	local s = tier -- масштаб

	-- світло
	local light = Instance.new("PointLight")
	light.Name = "Aura_Light"
	light.Color = color
	light.Brightness = 1 + s * 2.2
	light.Range = 8 + s * 4
	light.Parent = hrp

	-- точки випуску
	local att = Instance.new("Attachment")
	att.Name = "Aura_Att"
	att.Parent = hrp
	local feet = Instance.new("Attachment")
	feet.Name = "Aura_Feet"
	feet.Position = Vector3.new(0, -2.8, 0)
	feet.Parent = hrp

	-- 1) стовп енергії вгору
	local column = Instance.new("ParticleEmitter")
	column.Color = ColorSequence.new(color)
	column.LightEmission = 1
	column.LightInfluence = 0
	column.Lifetime = NumberRange.new(1, 1 + s * 0.3)
	column.Rate = 8 * s
	column.Speed = NumberRange.new(3, 6)
	column.SpreadAngle = Vector2.new(14, 14)
	column.Acceleration = Vector3.new(0, 10 + s * 5, 0)
	column.Size = seq(0.4 + s * 0.45, 0)
	column.Transparency = seq(0.15, 1)
	column.Rotation = NumberRange.new(0, 360)
	column.Parent = att

	-- 2) хмара-обгортка навколо тіла (тір 2+)
	if tier >= 2 then
		local cloud = Instance.new("ParticleEmitter")
		cloud.Color = ColorSequence.new(color)
		cloud.LightEmission = 0.8
		cloud.Lifetime = NumberRange.new(1.2, 1.8)
		cloud.Rate = 5 * s
		cloud.Speed = NumberRange.new(1, 2.5)
		cloud.SpreadAngle = Vector2.new(180, 180)
		cloud.Size = seq(1 + s * 0.8, 0)
		cloud.Transparency = seq(0.55, 1)
		cloud.Parent = att
	end

	-- 3) іскри (тір 3+)
	if tier >= 3 then
		local spark = Instance.new("ParticleEmitter")
		spark.Color = ColorSequence.new(Color3.new(1, 1, 1), color)
		spark.LightEmission = 1
		spark.Lifetime = NumberRange.new(0.5, 1)
		spark.Rate = 6 * s
		spark.Speed = NumberRange.new(8, 16)
		spark.SpreadAngle = Vector2.new(180, 180)
		spark.Size = seq(0.25 + s * 0.1, 0)
		spark.Transparency = seq(0.1, 1)
		spark.Parent = att

		-- слід за рухом
		local a0 = Instance.new("Attachment")
		a0.Name = "Aura_T0"
		a0.Position = Vector3.new(0, 1.5, 0)
		a0.Parent = hrp
		local a1 = Instance.new("Attachment")
		a1.Name = "Aura_T1"
		a1.Position = Vector3.new(0, -1.5, 0)
		a1.Parent = hrp
		local trail = Instance.new("Trail")
		trail.Name = "Aura_Trail"
		trail.Attachment0 = a0
		trail.Attachment1 = a1
		trail.Color = ColorSequence.new(color)
		trail.LightEmission = 1
		trail.Lifetime = 0.5 + s * 0.15
		trail.Transparency = seq(0.2, 1)
		trail.Parent = hrp
	end

	-- 4) викид енергії від ніг (тір 4+)
	if tier >= 4 then
		local burst = Instance.new("ParticleEmitter")
		burst.Color = ColorSequence.new(color)
		burst.LightEmission = 1
		burst.Lifetime = NumberRange.new(0.7, 1.2)
		burst.Rate = 5 * s
		burst.Speed = NumberRange.new(7, 14)
		burst.SpreadAngle = Vector2.new(95, 25)
		burst.Acceleration = Vector3.new(0, -3, 0)
		burst.Size = seq(0.7 + s * 0.2, 0)
		burst.Transparency = seq(0.15, 1)
		burst.Parent = feet
	end

	-- 5) величезне сяйво-аура (тір 5+) — те, що "як в аніме"
	if tier >= 5 then
		local glow = Instance.new("ParticleEmitter")
		glow.Color = ColorSequence.new(color)
		glow.LightEmission = 0.9
		glow.Lifetime = NumberRange.new(1.4, 2)
		glow.Rate = 4 * s
		glow.Speed = NumberRange.new(0, 1)
		glow.SpreadAngle = Vector2.new(180, 180)
		glow.Size = seq(3 + s * 1.2, 0)
		glow.Transparency = seq(0.65, 1)
		glow.Parent = att

		-- другий, ширший стовп
		local column2 = Instance.new("ParticleEmitter")
		column2.Color = ColorSequence.new(Color3.new(1, 1, 1), color)
		column2.LightEmission = 1
		column2.Lifetime = NumberRange.new(1.2, 1.8)
		column2.Rate = 6 * s
		column2.Speed = NumberRange.new(4, 8)
		column2.SpreadAngle = Vector2.new(22, 22)
		column2.Acceleration = Vector3.new(0, 18 + s * 4, 0)
		column2.Size = seq(0.8 + s * 0.4, 0)
		column2.Transparency = seq(0.1, 1)
		column2.Parent = att
	end
end

local function bind(player)
	local function refresh()
		if player.Character then
			applyFX(player.Character, player:GetAttribute("AuraTier") or 1)
		end
	end
	player.CharacterAdded:Connect(function()
		task.wait(0.4)
		refresh()
	end)
	player:GetAttributeChangedSignal("AuraTier"):Connect(refresh)
	refresh()
end

Players.PlayerAdded:Connect(bind)
for _, p in ipairs(Players:GetPlayers()) do
	bind(p)
end

print("[AuraEffects] Аніме-аура готова ✅")
