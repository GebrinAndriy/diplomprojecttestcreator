--[[
	Zones — вивіски зон + бар'єри (клієнт).
	Одна вивіска на зону:
	  - закрита: "🔒 Назва" + "Заробити X"
	  - відкрита: "Назва" + "+X аури/сек"
	Закриті зони перекриті силовим полем, яке ефектно зникає при відкритті.
	Усе локальне — у кожного гравця свій прогрес.
--]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local Workspace = game:GetService("Workspace")

local player = Players.LocalPlayer
local GameConfig = require(ReplicatedStorage:WaitForChild("GameConfig"))

local WHITE = Color3.fromRGB(245, 245, 245)

local function fmt(n)
	if n >= 1e6 then return string.format("%.1fM", n / 1e6) end
	if n >= 1e3 then return string.format("%.1fK", n / 1e3) end
	return tostring(math.floor(n))
end

local container = Instance.new("Folder")
container.Name = "Zone_Local"
container.Parent = Workspace

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
	frame.BackgroundColor3 = Color3.fromRGB(26, 28, 36)
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
	lbl.Font = Enum.Font.GothamBold
	lbl.Text = text
	lbl.TextColor3 = WHITE
	lbl.TextSize = 18
	lbl.Parent = frame

	TweenService:Create(frame, TweenInfo.new(0.4, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
		Position = UDim2.new(0.5, 0, 0, 160),
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

-- ===== дані по кожній зоні =====
local zones = {} -- [zone] = { l1, l2, wall, opened }

local function makeSign(zone)
	local part = Instance.new("Part")
	part.Anchored = true
	part.CanCollide = false
	part.Transparency = 1
	part.Size = Vector3.new(0.2, 0.2, 0.2)
	part.CFrame = CFrame.new(zone.pos + Vector3.new(0, 13, 0))
	part.Parent = container

	local bb = Instance.new("BillboardGui")
	bb.Size = UDim2.new(0, 300, 0, 96)
	bb.AlwaysOnTop = true
	bb.MaxDistance = 70 -- видно тільки зблизька
	bb.Parent = part

	local l1 = Instance.new("TextLabel")
	l1.Size = UDim2.new(1, 0, 0.55, 0)
	l1.BackgroundTransparency = 1
	l1.Font = Enum.Font.FredokaOne
	l1.TextScaled = true
	l1.TextStrokeTransparency = 0.1
	l1.Parent = bb

	local l2 = Instance.new("TextLabel")
	l2.Position = UDim2.new(0, 0, 0.55, 0)
	l2.Size = UDim2.new(1, 0, 0.45, 0)
	l2.BackgroundTransparency = 1
	l2.Font = Enum.Font.GothamBold
	l2.TextScaled = true
	l2.TextStrokeTransparency = 0.3
	l2.Parent = bb

	return l1, l2
end

local function updateSign(z, zone, unlocked)
	if unlocked then
		z.l1.Text = zone.name
		z.l1.TextColor3 = zone.color
		z.l2.Text = "+" .. zone.bonus .. " аури/сек"
		z.l2.TextColor3 = WHITE
	else
		z.l1.Text = "🔒 " .. zone.name
		z.l1.TextColor3 = WHITE
		z.l2.Text = "Заробити " .. fmt(zone.unlock)
		z.l2.TextColor3 = zone.color
	end
end

local function makeBarrier(zone)
	local wall = Instance.new("Part")
	wall.Name = "Barrier"
	wall.Anchored = true
	wall.CanCollide = true
	wall.Shape = Enum.PartType.Cylinder
	wall.Size = Vector3.new(16, zone.radius * 2, zone.radius * 2)
	wall.CFrame = CFrame.new(zone.pos + Vector3.new(0, 8, 0)) * CFrame.Angles(0, 0, math.rad(90))
	wall.Material = Enum.Material.ForceField
	wall.Color = zone.color
	wall.Transparency = 0.5
	wall.Parent = container
	return wall
end

local function openZone(z, zone)
	if z.opened then return end
	z.opened = true
	updateSign(z, zone, true)
	if z.wall then
		z.wall.CanCollide = false
		local up = TweenService:Create(z.wall, TweenInfo.new(0.9), {
			Transparency = 1,
			Size = z.wall.Size + Vector3.new(6, 0, 0),
		})
		up:Play()
		up.Completed:Connect(function()
			z.wall:Destroy()
		end)
		z.wall = nil
	end
	toast("🔓 Відкрито: " .. zone.name .. "!", zone.color)
end

-- будуємо все
for _, zone in ipairs(GameConfig.ZONES) do
	local l1, l2 = makeSign(zone)
	local z = { l1 = l1, l2 = l2, opened = false }
	local startUnlocked = zone.unlock <= 0
	if not startUnlocked then
		z.wall = makeBarrier(zone)
	end
	updateSign(z, zone, startUnlocked)
	z.opened = startUnlocked
	zones[zone] = z
end

local function refresh()
	local total = player:GetAttribute("TotalEarned") or 0
	for _, zone in ipairs(GameConfig.ZONES) do
		if zone.unlock > 0 and total >= zone.unlock then
			openZone(zones[zone], zone)
		end
	end
end

refresh()
player:GetAttributeChangedSignal("TotalEarned"):Connect(refresh)

print("[Zones] Вивіски й бар'єри готові ✅")
