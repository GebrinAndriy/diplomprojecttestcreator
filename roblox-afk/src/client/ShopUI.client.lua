--[[
	ShopUI — увесь інтерфейс гри (клієнт):
	- вертикальне меню зліва по центру (Магазин / Досягнення)
	- панель магазину покращень
	- панель досягнень з прогресом
	- спливаючі сповіщення
	Будується кодом, стиль — під неонову тему.
--]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local GameConfig = require(ReplicatedStorage:WaitForChild("GameConfig"))
local remotes = ReplicatedStorage:WaitForChild("Remotes")
local buyUpgrade = remotes:WaitForChild("BuyUpgrade")
local achUnlocked = remotes:WaitForChild("AchievementUnlocked")

local leaderstats = player:WaitForChild("leaderstats")
local coinsValue = leaderstats:WaitForChild("Coins")

-- ===== палітра =====
local THEME = GameConfig.THEME
local DARK = Color3.fromRGB(24, 27, 36)
local DARK2 = Color3.fromRGB(36, 41, 54)
local WHITE = Color3.fromRGB(245, 245, 245)
local GREY = Color3.fromRGB(150, 156, 170)
local GREEN = Color3.fromRGB(80, 200, 120)
local RED = Color3.fromRGB(210, 80, 80)

-- ===== дрібні хелпери стилю =====
local function corner(inst, r)
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0, r or 8)
	c.Parent = inst
	return c
end

local function stroke(inst, color, thick)
	local s = Instance.new("UIStroke")
	s.Color = color or THEME
	s.Thickness = thick or 1.5
	s.Parent = inst
	return s
end

local function fmt(n) -- 1500 -> "1.5K"
	if n >= 1e6 then return string.format("%.1fM", n / 1e6) end
	if n >= 1e3 then return string.format("%.1fK", n / 1e3) end
	return tostring(math.floor(n))
end

-- ===== корінь =====
local gui = Instance.new("ScreenGui")
gui.Name = "GameUI"
gui.ResetOnSpawn = false
gui.IgnoreGuiInset = true
gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
gui.Parent = playerGui

-- ============================================================
--  МЕНЮ ЗЛІВА (вертикальне, по центру висоти)
-- ============================================================
local menu = Instance.new("Frame")
menu.Name = "Menu"
menu.AnchorPoint = Vector2.new(0, 0.5)
menu.Position = UDim2.new(0, 14, 0.5, 0)
menu.Size = UDim2.new(0, 70, 0, 0)
menu.AutomaticSize = Enum.AutomaticSize.Y
menu.BackgroundTransparency = 1
menu.Parent = gui

local menuLayout = Instance.new("UIListLayout")
menuLayout.FillDirection = Enum.FillDirection.Vertical
menuLayout.Padding = UDim.new(0, 12)
menuLayout.HorizontalAlignment = Enum.HorizontalAlignment.Center
menuLayout.SortOrder = Enum.SortOrder.LayoutOrder
menuLayout.Parent = menu

local function makeMenuButton(icon, order)
	local btn = Instance.new("TextButton")
	btn.Size = UDim2.new(0, 64, 0, 64)
	btn.BackgroundColor3 = DARK
	btn.Text = icon
	btn.TextSize = 32
	btn.Font = Enum.Font.GothamBold
	btn.TextColor3 = WHITE
	btn.LayoutOrder = order
	btn.AutoButtonColor = true
	corner(btn, 16)
	stroke(btn, THEME, 2)
	btn.Parent = menu
	return btn
end

local shopBtn = makeMenuButton("🛒", 1)
local achBtn = makeMenuButton("🏆", 2)

-- ============================================================
--  ШАБЛОН ПАНЕЛІ (по центру екрана)
-- ============================================================
local function makePanel(titleText)
	local panel = Instance.new("Frame")
	panel.AnchorPoint = Vector2.new(0.5, 0.5)
	panel.Position = UDim2.new(0.5, 0, 0.5, 0)
	panel.Size = UDim2.new(0, 480, 0, 440)
	panel.BackgroundColor3 = DARK
	panel.Visible = false
	corner(panel, 18)
	stroke(panel, THEME, 2.5)
	panel.Parent = gui

	local title = Instance.new("TextLabel")
	title.Size = UDim2.new(1, -70, 0, 50)
	title.Position = UDim2.new(0, 18, 0, 10)
	title.BackgroundTransparency = 1
	title.Font = Enum.Font.FredokaOne
	title.Text = titleText
	title.TextColor3 = THEME
	title.TextXAlignment = Enum.TextXAlignment.Left
	title.TextSize = 26
	title.Parent = panel

	local close = Instance.new("TextButton")
	close.Size = UDim2.new(0, 38, 0, 38)
	close.Position = UDim2.new(1, -48, 0, 12)
	close.BackgroundColor3 = RED
	close.Text = "✕"
	close.Font = Enum.Font.GothamBold
	close.TextSize = 20
	close.TextColor3 = WHITE
	corner(close, 12)
	close.Parent = panel
	close.MouseButton1Click:Connect(function()
		panel.Visible = false
	end)

	local scroll = Instance.new("ScrollingFrame")
	scroll.Name = "Content"
	scroll.Position = UDim2.new(0, 14, 0, 68)
	scroll.Size = UDim2.new(1, -28, 1, -82)
	scroll.BackgroundTransparency = 1
	scroll.BorderSizePixel = 0
	scroll.ScrollBarThickness = 6
	scroll.ScrollBarImageColor3 = THEME
	scroll.CanvasSize = UDim2.new(0, 0, 0, 0)
	scroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
	scroll.Parent = panel

	local list = Instance.new("UIListLayout")
	list.Padding = UDim.new(0, 8)
	list.SortOrder = Enum.SortOrder.LayoutOrder
	list.Parent = scroll

	return panel, scroll
end

local shopPanel, shopContent = makePanel("🛒 Магазин покращень")
local achPanel, achContent = makePanel("🏆 Досягнення")

local function clearRows(scroll)
	for _, ch in ipairs(scroll:GetChildren()) do
		if not ch:IsA("UIListLayout") then
			ch:Destroy()
		end
	end
end

-- ============================================================
--  МАГАЗИН
-- ============================================================
local function refreshShop()
	clearRows(shopContent)
	local level = player:GetAttribute("UpgradeLevel") or 0
	local coins = coinsValue.Value

	for i, upg in ipairs(GameConfig.UPGRADES) do
		local owned = i <= level
		local isNext = i == level + 1

		local row = Instance.new("Frame")
		row.Size = UDim2.new(1, 0, 0, 66)
		row.BackgroundColor3 = DARK2
		row.LayoutOrder = i
		corner(row, 12)
		if owned then stroke(row, GREEN, 1.5) end
		row.Parent = shopContent

		local name = Instance.new("TextLabel")
		name.BackgroundTransparency = 1
		name.Position = UDim2.new(0, 14, 0, 8)
		name.Size = UDim2.new(0.6, 0, 0, 26)
		name.Font = Enum.Font.GothamBold
		name.Text = upg.name
		name.TextColor3 = WHITE
		name.TextSize = 18
		name.TextXAlignment = Enum.TextXAlignment.Left
		name.Parent = row

		local desc = Instance.new("TextLabel")
		desc.BackgroundTransparency = 1
		desc.Position = UDim2.new(0, 14, 0, 34)
		desc.Size = UDim2.new(0.6, 0, 0, 22)
		desc.Font = Enum.Font.Gotham
		desc.Text = upg.desc
		desc.TextColor3 = GREY
		desc.TextSize = 14
		desc.TextXAlignment = Enum.TextXAlignment.Left
		desc.Parent = row

		local btn = Instance.new("TextButton")
		btn.AnchorPoint = Vector2.new(1, 0.5)
		btn.Position = UDim2.new(1, -12, 0.5, 0)
		btn.Size = UDim2.new(0, 130, 0, 44)
		btn.Font = Enum.Font.GothamBold
		btn.TextSize = 16
		btn.TextColor3 = WHITE
		corner(btn, 10)
		btn.Parent = row

		if owned then
			btn.Text = "Куплено ✓"
			btn.BackgroundColor3 = GREEN
			btn.AutoButtonColor = false
		elseif isNext then
			btn.Text = "💰 " .. fmt(upg.cost)
			local canAfford = coins >= upg.cost
			btn.BackgroundColor3 = canAfford and THEME or Color3.fromRGB(70, 75, 90)
			btn.TextColor3 = canAfford and DARK or GREY
			btn.MouseButton1Click:Connect(function()
				local ok, msg = buyUpgrade:InvokeServer()
				notify(ok and "✅ " .. msg or "❌ " .. msg, ok and GREEN or RED)
				refreshShop()
			end)
		else
			btn.Text = "🔒"
			btn.BackgroundColor3 = Color3.fromRGB(55, 60, 72)
			btn.TextColor3 = GREY
			btn.AutoButtonColor = false
		end
	end
end

-- ============================================================
--  ДОСЯГНЕННЯ
-- ============================================================
local function refreshAch()
	clearRows(achContent)

	for i, ach in ipairs(GameConfig.ACHIEVEMENTS) do
		local unlocked = player:GetAttribute("Ach_" .. ach.id) == true
		local statValue = player:GetAttribute(ach.stat) or 0
		local progress = math.clamp(statValue / ach.goal, 0, 1)

		local row = Instance.new("Frame")
		row.Size = UDim2.new(1, 0, 0, 74)
		row.BackgroundColor3 = DARK2
		row.LayoutOrder = i
		corner(row, 12)
		if unlocked then stroke(row, THEME, 1.5) end
		row.Parent = achContent

		local name = Instance.new("TextLabel")
		name.BackgroundTransparency = 1
		name.Position = UDim2.new(0, 14, 0, 8)
		name.Size = UDim2.new(1, -120, 0, 22)
		name.Font = Enum.Font.GothamBold
		name.Text = (unlocked and "✅ " or "🔒 ") .. ach.name
		name.TextColor3 = unlocked and THEME or WHITE
		name.TextSize = 17
		name.TextXAlignment = Enum.TextXAlignment.Left
		name.Parent = row

		local desc = Instance.new("TextLabel")
		desc.BackgroundTransparency = 1
		desc.Position = UDim2.new(0, 14, 0, 30)
		desc.Size = UDim2.new(1, -120, 0, 18)
		desc.Font = Enum.Font.Gotham
		desc.Text = ach.desc
		desc.TextColor3 = GREY
		desc.TextSize = 13
		desc.TextXAlignment = Enum.TextXAlignment.Left
		desc.Parent = row

		-- смужка прогресу
		local barBg = Instance.new("Frame")
		barBg.Position = UDim2.new(0, 14, 0, 54)
		barBg.Size = UDim2.new(1, -120, 0, 10)
		barBg.BackgroundColor3 = Color3.fromRGB(55, 60, 72)
		corner(barBg, 5)
		barBg.Parent = row

		local barFill = Instance.new("Frame")
		barFill.Size = UDim2.new(progress, 0, 1, 0)
		barFill.BackgroundColor3 = unlocked and THEME or Color3.fromRGB(90, 140, 255)
		corner(barFill, 5)
		barFill.Parent = barBg

		local reward = Instance.new("TextLabel")
		reward.AnchorPoint = Vector2.new(1, 0.5)
		reward.Position = UDim2.new(1, -14, 0.5, 0)
		reward.Size = UDim2.new(0, 96, 0, 40)
		reward.BackgroundTransparency = 1
		reward.Font = Enum.Font.GothamBold
		reward.Text = "💰 " .. fmt(ach.reward)
		reward.TextColor3 = unlocked and GREEN or GREY
		reward.TextSize = 16
		reward.TextXAlignment = Enum.TextXAlignment.Right
		reward.Parent = row
	end
end

-- ============================================================
--  СПОВІЩЕННЯ (toast)
-- ============================================================
function notify(text, color)
	local toast = Instance.new("Frame")
	toast.AnchorPoint = Vector2.new(0.5, 0)
	toast.Position = UDim2.new(0.5, 0, 0, -60)
	toast.Size = UDim2.new(0, 340, 0, 50)
	toast.BackgroundColor3 = DARK
	corner(toast, 12)
	stroke(toast, color or THEME, 2)
	toast.Parent = gui

	local label = Instance.new("TextLabel")
	label.Size = UDim2.new(1, -20, 1, 0)
	label.Position = UDim2.new(0, 10, 0, 0)
	label.BackgroundTransparency = 1
	label.Font = Enum.Font.GothamBold
	label.Text = text
	label.TextColor3 = WHITE
	label.TextSize = 16
	label.TextScaled = false
	label.Parent = toast

	local inTween = TweenService:Create(toast, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
		Position = UDim2.new(0.5, 0, 0, 20),
	})
	inTween:Play()

	task.delay(2.2, function()
		local outTween = TweenService:Create(toast, TweenInfo.new(0.3), {
			Position = UDim2.new(0.5, 0, 0, -60),
		})
		outTween:Play()
		outTween.Completed:Wait()
		toast:Destroy()
	end)
end

-- ============================================================
--  ПЕРЕМИКАННЯ ПАНЕЛЕЙ
-- ============================================================
local function toggle(panel, other, refresh)
	other.Visible = false
	panel.Visible = not panel.Visible
	if panel.Visible then refresh() end
end

shopBtn.MouseButton1Click:Connect(function()
	toggle(shopPanel, achPanel, refreshShop)
end)
achBtn.MouseButton1Click:Connect(function()
	toggle(achPanel, shopPanel, refreshAch)
end)

-- оновлювати магазин коли змінюються монети або рівень (для актуальних цін)
coinsValue.Changed:Connect(function()
	if shopPanel.Visible then refreshShop() end
end)
player:GetAttributeChangedSignal("UpgradeLevel"):Connect(function()
	if shopPanel.Visible then refreshShop() end
end)

-- сповіщення про досягнення з сервера
achUnlocked.OnClientEvent:Connect(function(id, name, rewardAmount)
	notify("🏆 " .. name .. "  +" .. fmt(rewardAmount), GREEN)
	if achPanel.Visible then refreshAch() end
end)

print("[ShopUI] Інтерфейс готовий ✅")
