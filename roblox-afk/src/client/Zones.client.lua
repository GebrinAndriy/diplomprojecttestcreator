--[[
	Zones — бар'єри на закритих зонах (клієнт).
	Поки гравець не заробив достатньо, зону перекриває силове поле із замком.
	Коли поріг досягнуто — бар'єр ефектно зникає й вилітає сповіщення.
	Малюється локально, тому в кожного гравця свій прогрес.
--]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local Workspace = game:GetService("Workspace")

local player = Players.LocalPlayer
local GameConfig = require(ReplicatedStorage:WaitForChild("GameConfig"))

local function fmt(n)
	if n >= 1e6 then return string.format("%.1fM", n / 1e6) end
	if n >= 1e3 then return string.format("%.1fK", n / 1e3) end
	return tostring(math.floor(n))
end

-- контейнер для локальних бар'єрів
local container = Instance.new("Folder")
container.Name = "ZoneBarriers_Local"
container.Parent = Workspace

-- проста плашка-сповіщення (своя, бо це окремий скрипт)
local playerGui = player:WaitForChild("PlayerGui")
local function toast(text, color)
	local gui = Instance.new("ScreenGui")
	gui.IgnoreGuiInset = true
	gui.ResetOnSpawn = false
	gui.Parent = playerGui

	local frame = Instance.new("Frame")
	frame.AnchorPoint = Vector2.new(0.5, 0)
	frame.Position = UDim2.new(0.5, 0, 0, -70)
	frame.Size = UDim2.new(0, 360, 0, 56)
	frame.BackgroundColor3 = Color3.fromRGB(24, 27, 36)
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0, 14)
	c.Parent = frame
	local s = Instance.new("UIStroke")
	s.Color = color
	s.Thickness = 2.5
	s.Parent = frame
	frame.Parent = gui

	local lbl = Instance.new("TextLabel")
	lbl.Size = UDim2.new(1, -20, 1, 0)
	lbl.Position = UDim2.new(0, 10, 0, 0)
	lbl.BackgroundTransparency = 1
	lbl.Font = Enum.Font.FredokaOne
	lbl.Text = text
	lbl.TextColor3 = Color3.fromRGB(245, 245, 245)
	lbl.TextSize = 18
	lbl.Parent = frame

	TweenService:Create(frame, TweenInfo.new(0.4, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
		Position = UDim2.new(0.5, 0, 0, 84),
	}):Play()
	task.delay(2.6, function()
		local out = TweenService:Create(frame, TweenInfo.new(0.35), {
			Position = UDim2.new(0.5, 0, 0, -70),
		})
		out:Play()
		out.Completed:Wait()
		gui:Destroy()
	end)
end

-- ===== Будуємо бар'єр для зони =====
local barriers = {} -- [zone] = {part=, sign=, opened=false}

local function buildBarrier(zone)
	-- силове поле (циліндр-стіна)
	local wall = Instance.new("Part")
	wall.Name = "Barrier"
	wall.Anchored = true
	wall.CanCollide = true
	wall.Shape = Enum.PartType.Cylinder
	wall.Size = Vector3.new(16, zone.radius * 2, zone.radius * 2)
	wall.CFrame = CFrame.new(zone.pos + Vector3.new(0, 8, 0)) * CFrame.Angles(0, 0, math.rad(90))
	wall.Material = Enum.Material.ForceField
	wall.Color = zone.color
	wall.Transparency = 0.45
	wall.Parent = container

	-- табличка із замком
	local signPart = Instance.new("Part")
	signPart.Anchored = true
	signPart.CanCollide = false
	signPart.Transparency = 1
	signPart.Size = Vector3.new(0.2, 0.2, 0.2)
	signPart.CFrame = CFrame.new(zone.pos + Vector3.new(0, 13, 0))
	signPart.Parent = container

	local bb = Instance.new("BillboardGui")
	bb.Size = UDim2.new(0, 300, 0, 90)
	bb.AlwaysOnTop = true
	bb.Parent = signPart

	local lockLbl = Instance.new("TextLabel")
	lockLbl.Size = UDim2.new(1, 0, 0.5, 0)
	lockLbl.BackgroundTransparency = 1
	lockLbl.Font = Enum.Font.FredokaOne
	lockLbl.Text = "🔒 " .. zone.name
	lockLbl.TextColor3 = Color3.fromRGB(255, 255, 255)
	lockLbl.TextScaled = true
	lockLbl.TextStrokeTransparency = 0.2
	lockLbl.Parent = bb

	local reqLbl = Instance.new("TextLabel")
	reqLbl.Position = UDim2.new(0, 0, 0.5, 0)
	reqLbl.Size = UDim2.new(1, 0, 0.5, 0)
	reqLbl.BackgroundTransparency = 1
	reqLbl.Font = Enum.Font.GothamBold
	reqLbl.Text = "Заробити " .. fmt(zone.unlock)
	reqLbl.TextColor3 = zone.color
	reqLbl.TextScaled = true
	reqLbl.TextStrokeTransparency = 0.4
	reqLbl.Parent = bb

	barriers[zone] = { wall = wall, sign = signPart, opened = false }
end

-- ===== Відкриття зони (анімація) =====
local function openZone(zone)
	local b = barriers[zone]
	if not b or b.opened then return end
	b.opened = true

	b.wall.CanCollide = false
	local up = TweenService:Create(b.wall, TweenInfo.new(0.9, Enum.EasingStyle.Quad), {
		Transparency = 1,
		Size = b.wall.Size + Vector3.new(6, 0, 0), -- "розчиняється" вгору
	})
	up:Play()
	up.Completed:Connect(function()
		b.wall:Destroy()
	end)
	b.sign:Destroy()

	toast("🔓 Відкрито: " .. zone.name .. "!", zone.color)
end

-- ===== Перевірка прогресу =====
local function refresh()
	local total = player:GetAttribute("TotalEarned") or 0
	for _, zone in ipairs(GameConfig.ZONES) do
		if zone.unlock > 0 then
			if total >= zone.unlock then
				openZone(zone)
			end
		end
	end
end

-- будуємо бар'єри лише для закритих зон
for _, zone in ipairs(GameConfig.ZONES) do
	if zone.unlock > 0 then
		buildBarrier(zone)
	end
end

refresh()
player:GetAttributeChangedSignal("TotalEarned"):Connect(refresh)

print("[Zones] Бар'єри зон готові ✅")
