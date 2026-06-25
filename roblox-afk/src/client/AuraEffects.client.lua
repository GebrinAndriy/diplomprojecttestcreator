--[[
	AuraEffects (клієнт) — обʼємні аніме-аури навколо КОЖНОГО гравця.
	Малюється локально (плавно, видно всіх), масштаб росте з AuraTier:
	  стовп вогню -> кільця що крутяться -> каміння що злітає -> ударні хвилі
	  -> сяюча сфера -> ВЕЛИЧЕЗНА аура (як в аніме).
--]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")
local Workspace = game:GetService("Workspace")

local GameConfig = require(ReplicatedStorage:WaitForChild("GameConfig"))
local TIERS = GameConfig.AURA_TIERS

local FIRE = "rbxasset://textures/particles/fire_main.dds"
local SPARK = "rbxasset://textures/particles/sparkles_main.dds"

local container = Instance.new("Folder")
container.Name = "AuraFX_Local"
container.Parent = Workspace

local rigs = {} -- [player] = { folder, atts={}, elems={} }

local function seq(a, b)
	return NumberSequence.new({
		NumberSequenceKeypoint.new(0, a),
		NumberSequenceKeypoint.new(1, b),
	})
end

local function lerp(a, b, t) return a + (b - a) * t end

local function destroyRig(player)
	local rig = rigs[player]
	if not rig then return end
	if rig.folder then rig.folder:Destroy() end
	for _, a in ipairs(rig.atts) do
		if a then a:Destroy() end
	end
	rigs[player] = nil
end

-- частинки (вогонь/іскри), кріпляться до тіла
local function addEmitter(att, props)
	local e = Instance.new("ParticleEmitter")
	for k, v in pairs(props) do e[k] = v end
	e.Parent = att
	return e
end

local function makePart(folder, props)
	local p = Instance.new("Part")
	p.Anchored = true
	p.CanCollide = false
	p.CastShadow = false
	p.Massless = true
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	for k, v in pairs(props) do p[k] = v end
	p.Parent = folder
	return p
end

-- ===== Побудова аури для тіру =====
local function buildRig(player, char, tier)
	destroyRig(player)
	if tier < 1 then return end
	local hrp = char:FindFirstChild("HumanoidRootPart")
	if not hrp then return end

	local data = TIERS[tier] or TIERS[1]
	local color = data.color
	local s = tier -- 1..6

	local folder = Instance.new("Folder")
	folder.Name = "Rig_" .. player.Name
	folder.Parent = container

	local rig = { folder = folder, atts = {}, elems = {} }
	rigs[player] = rig

	-- ===== ЧАСТИНКИ =====
	local att = Instance.new("Attachment")
	att.Parent = hrp
	table.insert(rig.atts, att)

	-- стовп вогню-аури вгору
	addEmitter(att, {
		Texture = FIRE,
		Color = ColorSequence.new(Color3.new(1, 1, 1), color),
		LightEmission = 1, LightInfluence = 0,
		Lifetime = NumberRange.new(0.6, 1 + s * 0.25),
		Rate = 40 + s * 30,
		Speed = NumberRange.new(6, 10 + s * 2),
		SpreadAngle = Vector2.new(12 + s, 12 + s),
		Acceleration = Vector3.new(0, 14 + s * 6, 0),
		Size = seq(1 + s * 0.8, 0),
		Transparency = seq(0.1, 1),
		Rotation = NumberRange.new(0, 360),
		ZOffset = -0.5,
	})

	-- обгортка-хмара
	if tier >= 2 then
		addEmitter(att, {
			Texture = FIRE,
			Color = ColorSequence.new(color),
			LightEmission = 0.8,
			Lifetime = NumberRange.new(1, 1.6),
			Rate = 20 + s * 14,
			Speed = NumberRange.new(2, 4),
			SpreadAngle = Vector2.new(180, 180),
			Size = seq(2 + s * 1.1, 0),
			Transparency = seq(0.5, 1),
		})
	end

	-- іскри
	if tier >= 3 then
		addEmitter(att, {
			Texture = SPARK,
			Color = ColorSequence.new(Color3.new(1, 1, 1), color),
			LightEmission = 1,
			Lifetime = NumberRange.new(0.5, 1),
			Rate = 14 + s * 10,
			Speed = NumberRange.new(10, 22),
			SpreadAngle = Vector2.new(180, 180),
			Size = seq(0.6 + s * 0.15, 0),
			Transparency = seq(0.1, 1),
		})
		-- слід
		local a0 = Instance.new("Attachment"); a0.Position = Vector3.new(0, 1.6, 0); a0.Parent = hrp
		local a1 = Instance.new("Attachment"); a1.Position = Vector3.new(0, -1.6, 0); a1.Parent = hrp
		table.insert(rig.atts, a0); table.insert(rig.atts, a1)
		local trail = Instance.new("Trail")
		trail.Attachment0 = a0; trail.Attachment1 = a1
		trail.Color = ColorSequence.new(color)
		trail.LightEmission = 1
		trail.Lifetime = 0.5 + s * 0.2
		trail.Transparency = seq(0.2, 1)
		trail.Parent = folder
	end

	-- ===== ОБ'ЄМНІ ЕЛЕМЕНТИ =====
	-- світло
	local light = makePart(folder, {
		Shape = Enum.PartType.Ball, Size = Vector3.new(1, 1, 1),
		Transparency = 1,
	})
	local pl = Instance.new("PointLight")
	pl.Color = color; pl.Brightness = 2 + s * 2; pl.Range = 12 + s * 5
	pl.Parent = light
	table.insert(rig.elems, { kind = "follow", part = light, h = 0 })

	-- кільце орбів (тір 2+), більше кілець на вищих тірах
	local rings = math.clamp(s - 1, 0, 3)
	for r = 1, rings do
		local count = 10 + s
		local radius = 3 + r * 0.8
		local height = -1 + r * 1.6
		local speed = (r % 2 == 0) and -2 or 2
		for i = 1, count do
			local orb = makePart(folder, {
				Shape = Enum.PartType.Ball,
				Size = Vector3.new(0.6 + s * 0.06, 0.6 + s * 0.06, 0.6 + s * 0.06),
				Material = Enum.Material.Neon, Color = color,
			})
			table.insert(rig.elems, {
				kind = "orb", part = orb,
				ang0 = (i / count) * math.pi * 2,
				radius = radius, height = height, speed = speed, bob = 0.4 + r * 0.2, phase = i,
			})
		end
	end

	-- ударна хвиля від ніг (тір 3+)
	if tier >= 3 then
		local waves = (tier >= 6) and 2 or 1
		for w = 1, waves do
			local disc = makePart(folder, {
				Shape = Enum.PartType.Cylinder, Size = Vector3.new(0.5, 2, 2),
				Material = Enum.Material.Neon, Color = color,
			})
			table.insert(rig.elems, {
				kind = "shock", part = disc, maxR = 10 + s * 2.5,
				cycle = 1.3, off = (w - 1) * 0.65,
			})
		end
	end

	-- каміння що злітає (тір 3+)
	if tier >= 3 then
		local rocks = 3 + s
		for i = 1, rocks do
			local rock = makePart(folder, {
				Size = Vector3.new(1 + s * 0.15, 1 + s * 0.15, 1 + s * 0.15),
				Material = Enum.Material.Slate, Color = Color3.fromRGB(70, 72, 82),
			})
			table.insert(rig.elems, {
				kind = "rock", part = rock,
				ang = (i / rocks) * math.pi * 2, radius = 3.5 + s * 0.3,
				speed = 0.4 + math.random() * 0.3, phase = math.random(),
				rise = 6 + s, spin = math.random() * 4 + 2,
			})
		end
	end

	-- енергетичний стовп (тір 4+)
	if tier >= 4 then
		local pillar = makePart(folder, {
			Shape = Enum.PartType.Cylinder, Size = Vector3.new(20 + s * 4, 6 + s, 6 + s),
			Material = Enum.Material.Neon, Color = color, Transparency = 0.7,
		})
		table.insert(rig.elems, { kind = "pillar", part = pillar, h = 20 + s * 4 })
	end

	-- сяюча сфера-аура (тір 5+)
	if tier >= 5 then
		local shell = makePart(folder, {
			Shape = Enum.PartType.Ball, Size = Vector3.new(10, 10, 10),
			Material = Enum.Material.ForceField, Color = color, Transparency = 0.4,
		})
		table.insert(rig.elems, { kind = "shell", part = shell, size = 9 + s * 1.5, amp = 1.5 })
	end
end

-- ===== Анімація всіх аур =====
RunService.RenderStepped:Connect(function()
	local t = os.clock()
	for player, rig in pairs(rigs) do
		local char = player.Character
		local hrp = char and char:FindFirstChild("HumanoidRootPart")
		if hrp then
			local base = hrp.Position
			for _, e in ipairs(rig.elems) do
				if e.kind == "follow" then
					e.part.CFrame = CFrame.new(base + Vector3.new(0, e.h, 0))
				elseif e.kind == "orb" then
					local a = e.ang0 + t * e.speed
					local y = e.height + math.sin(t * 2 + e.phase) * e.bob
					e.part.CFrame = CFrame.new(base + Vector3.new(math.cos(a) * e.radius, y, math.sin(a) * e.radius))
				elseif e.kind == "shock" then
					local p = ((t + e.off) % e.cycle) / e.cycle
					local d = lerp(2, e.maxR * 2, p)
					e.part.Size = Vector3.new(0.5, d, d)
					e.part.Transparency = lerp(0.15, 1, p)
					e.part.CFrame = CFrame.new(base + Vector3.new(0, -2.6, 0)) * CFrame.Angles(0, 0, math.rad(90))
				elseif e.kind == "rock" then
					local p = (t * e.speed + e.phase) % 1
					local y = lerp(-2.5, e.rise, p)
					local fade = (p < 0.15 and p / 0.15) or (p > 0.85 and (1 - p) / 0.15) or 1
					e.part.Transparency = 1 - fade
					e.part.CFrame = CFrame.new(base + Vector3.new(math.cos(e.ang) * e.radius, y, math.sin(e.ang) * e.radius))
						* CFrame.Angles(t * e.spin, t * e.spin * 0.7, 0)
				elseif e.kind == "pillar" then
					local pulse = 0.6 + math.sin(t * 4) * 0.12
					e.part.Transparency = pulse
					e.part.CFrame = CFrame.new(base + Vector3.new(0, e.h / 2 - 4, 0)) * CFrame.Angles(0, 0, math.rad(90))
				elseif e.kind == "shell" then
					local sz = e.size + math.sin(t * 3) * e.amp
					e.part.Size = Vector3.new(sz, sz, sz)
					e.part.CFrame = CFrame.new(base)
				end
			end
		end
	end
end)

-- ===== Привʼязка до гравців =====
local function bind(player)
	local function refresh()
		local char = player.Character
		if char then
			buildRig(player, char, player:GetAttribute("AuraTier") or 1)
		end
	end
	player.CharacterAdded:Connect(function()
		task.wait(0.5)
		refresh()
	end)
	player:GetAttributeChangedSignal("AuraTier"):Connect(refresh)
	if player.Character then refresh() end
end

Players.PlayerAdded:Connect(bind)
Players.PlayerRemoving:Connect(destroyRig)
for _, p in ipairs(Players:GetPlayers()) do
	bind(p)
end

print("[AuraEffects] Обʼємні аніме-аури готові ✅")
