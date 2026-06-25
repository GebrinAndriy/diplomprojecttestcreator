--[[
	ShopUI — весь інтерфейс (клієнт):
	- лічильник аури зверху по центру (з анімацією)
	- меню зліва (Магазин / Досягнення)
	- гарний магазин покращень + панель досягнень
	- шкала прогресу до наступного тіру аури (знизу)
	- анімація фарму (літаючі "+X") + сповіщення
--]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local TweenService = game:GetService("TweenService")
local RunService = game:GetService("RunService")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local GameConfig = require(ReplicatedStorage:WaitForChild("GameConfig"))
local CUR = GameConfig.CURRENCY
local CUR_ICON = "🔮" -- іконка валюти (емодзі, що точно рендериться)
local remotes = ReplicatedStorage:WaitForChild("Remotes")
local buyUpgrade = remotes:WaitForChild("BuyUpgrade")
local achUnlocked = remotes:WaitForChild("AchievementUnlocked")

local leaderstats = player:WaitForChild("leaderstats")
local auraValue = leaderstats:WaitForChild(CUR)

-- ===== палітра =====
local THEME = GameConfig.THEME
local DARK = Color3.fromRGB(22, 24, 34)
local DARK2 = Color3.fromRGB(34, 38, 52)
local WHITE = Color3.fromRGB(245, 245, 245)
local GREY = Color3.fromRGB(150, 156, 170)
local GREEN = Color3.fromRGB(80, 200, 120)
local RED = Color3.fromRGB(210, 80, 80)

-- ===== хелпери =====
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

local function gradient(inst, c1, c2, rot)
	local g = Instance.new("UIGradient")
	g.Color = ColorSequence.new(c1, c2)
	g.Rotation = rot or 90
	g.Parent = inst
	return g
end

local function fmt(n)
	if n >= 1e9 then return string.format("%.1fB", n / 1e9) end
	if n >= 1e6 then return string.format("%.1fM", n / 1e6) end
	if n >= 1e3 then return string.format("%.1fK", n / 1e3) end
	return tostring(math.floor(n))
end

local function comma(n)
	local s = tostring(math.floor(n))
	local out = s:reverse():gsub("(%d%d%d)", "%1 "):reverse()
	return (out:gsub("^%s+", ""))
end

local gui = Instance.new("ScreenGui")
gui.Name = "GameUI"
gui.ResetOnSpawn = false
gui.IgnoreGuiInset = true
gui.ZIndexBehavior = Enum.ZIndexBehavior.Sibling
gui.Parent = playerGui

-- ============================================================
--  ЛІЧИЛЬНИК АУРИ (зверху по центру)
-- ============================================================
local hud = Instance.new("Frame")
hud.Name = "AuraHUD"
hud.AnchorPoint = Vector2.new(0.5, 0)
hud.Position = UDim2.new(0.5, 0, 0, 14)
hud.AutomaticSize = Enum.AutomaticSize.X
hud.Size = UDim2.new(0, 0, 0, 64)
hud.BackgroundColor3 = DARK
corner(hud, 20)
gradient(hud, Color3.fromRGB(40, 30, 60), DARK, 90)
local hudStroke = stroke(hud, THEME, 2.5)
hud.Parent = gui

local hudPad = Instance.new("UIPadding")
hudPad.PaddingLeft = UDim.new(0, 10)
hudPad.PaddingRight = UDim.new(0, 22)
hudPad.Parent = hud

local hudLayout = Instance.new("UIListLayout")
hudLayout.FillDirection = Enum.FillDirection.Horizontal
hudLayout.VerticalAlignment = Enum.VerticalAlignment.Center
hudLayout.Padding = UDim.new(0, 12)
hudLayout.SortOrder = Enum.SortOrder.LayoutOrder
hudLayout.Parent = hud

local icon = Instance.new("Frame")
icon.Size = UDim2.new(0, 44, 0, 44)
icon.BackgroundColor3 = THEME
icon.LayoutOrder = 1
corner(icon, 22)
gradient(icon, Color3.fromRGB(210, 150, 255), Color3.fromRGB(140, 70, 230), 90)
stroke(icon, Color3.fromRGB(220, 180, 255), 2)
icon.Parent = hud

local iconText = Instance.new("TextLabel")
iconText.Size = UDim2.new(1, 0, 1, 0)
iconText.BackgroundTransparency = 1
iconText.Font = Enum.Font.FredokaOne
iconText.Text = CUR_ICON
iconText.TextColor3 = WHITE
iconText.TextSize = 26
iconText.Parent = icon

local info = Instance.new("Frame")
info.AutomaticSize = Enum.AutomaticSize.XY
info.BackgroundTransparency = 1
info.LayoutOrder = 2
info.Parent = hud

local infoLayout = Instance.new("UIListLayout")
infoLayout.FillDirection = Enum.FillDirection.Vertical
infoLayout.SortOrder = Enum.SortOrder.LayoutOrder
infoLayout.Parent = info

local amountLabel = Instance.new("TextLabel")
amountLabel.AutomaticSize = Enum.AutomaticSize.X
amountLabel.Size = UDim2.new(0, 0, 0, 30)
amountLabel.BackgroundTransparency = 1
amountLabel.Font = Enum.Font.FredokaOne
amountLabel.Text = "0 аури"
amountLabel.TextColor3 = WHITE
amountLabel.TextSize = 26
amountLabel.TextXAlignment = Enum.TextXAlignment.Left
amountLabel.LayoutOrder = 1
amountLabel.Parent = info

local rateLabel = Instance.new("TextLabel")
rateLabel.AutomaticSize = Enum.AutomaticSize.X
rateLabel.Size = UDim2.new(0, 0, 0, 16)
rateLabel.BackgroundTransparency = 1
rateLabel.Font = Enum.Font.GothamBold
rateLabel.Text = "+1/сек"
rateLabel.TextColor3 = THEME
rateLabel.TextSize = 14
rateLabel.TextXAlignment = Enum.TextXAlignment.Left
rateLabel.LayoutOrder = 2
rateLabel.Parent = info

-- плавний лічильник
local displayed = auraValue.Value
RunService.Heartbeat:Connect(function(dt)
	local target = auraValue.Value
	if math.abs(displayed - target) < 1 then
		displayed = target
	else
		displayed = displayed + (target - displayed) * math.min(dt * 8, 1)
	end
	amountLabel.Text = comma(displayed) .. " аури"
end)

local function updateRate()
	local mult = player:GetAttribute("Multiplier") or 1
	local zoneBonus = player:GetAttribute("ZoneBonus") or 0
	local boosting = player:GetAttribute("AfkBoosting") == true
	local rps = (GameConfig.BASE_INCOME + zoneBonus) * mult
	local multText = mult > 1 and ("  ×" .. mult) or ""
	rateLabel.Text = (boosting and "⚡ +" or "+") .. comma(rps) .. "/сек" .. multText
	rateLabel.TextColor3 = boosting and Color3.fromRGB(255, 200, 60) or THEME
	hudStroke.Color = boosting and Color3.fromRGB(255, 200, 60) or THEME
end
player:GetAttributeChangedSignal("Multiplier"):Connect(updateRate)
player:GetAttributeChangedSignal("AfkBoosting"):Connect(updateRate)
player:GetAttributeChangedSignal("ZoneBonus"):Connect(updateRate)
updateRate()

-- ============================================================
--  ШКАЛА ПРОГРЕСУ ТІРУ АУРИ (знизу по центру)
-- ============================================================
local tierBar = Instance.new("Frame")
tierBar.Name = "TierBar"
tierBar.AnchorPoint = Vector2.new(0.5, 1)
tierBar.Position = UDim2.new(0.5, 0, 1, -16)
tierBar.Size = UDim2.new(0, 540, 0, 64)
tierBar.BackgroundColor3 = DARK
corner(tierBar, 16)
stroke(tierBar, THEME, 2)
tierBar.Parent = gui

local tbPad = Instance.new("UIPadding")
tbPad.PaddingTop = UDim.new(0, 8)
tbPad.PaddingBottom = UDim.new(0, 8)
tbPad.PaddingLeft = UDim.new(0, 14)
tbPad.PaddingRight = UDim.new(0, 14)
tbPad.Parent = tierBar

local tierNow = Instance.new("TextLabel")
tierNow.Size = UDim2.new(0.5, 0, 0, 18)
tierNow.BackgroundTransparency = 1
tierNow.Font = Enum.Font.GothamBold
tierNow.Text = "Аура: Тьмяна"
tierNow.TextColor3 = WHITE
tierNow.TextSize = 14
tierNow.TextXAlignment = Enum.TextXAlignment.Left
tierNow.Parent = tierBar

local tierNext = Instance.new("TextLabel")
tierNext.AnchorPoint = Vector2.new(1, 0)
tierNext.Position = UDim2.new(1, 0, 0, 0)
tierNext.Size = UDim2.new(0.5, 0, 0, 18)
tierNext.BackgroundTransparency = 1
tierNext.Font = Enum.Font.GothamBold
tierNext.Text = "Далі: Іскриста"
tierNext.TextColor3 = GREY
tierNext.TextSize = 14
tierNext.TextXAlignment = Enum.TextXAlignment.Right
tierNext.Parent = tierBar

local barBg = Instance.new("Frame")
barBg.AnchorPoint = Vector2.new(0.5, 1)
barBg.Position = UDim2.new(0.5, 0, 1, 0)
barBg.Size = UDim2.new(1, 0, 0, 22)
barBg.BackgroundColor3 = Color3.fromRGB(48, 52, 66)
corner(barBg, 11)
barBg.Parent = tierBar

local barFill = Instance.new("Frame")
barFill.Size = UDim2.new(0, 0, 1, 0)
barFill.BackgroundColor3 = THEME
corner(barFill, 11)
gradient(barFill, Color3.fromRGB(210, 150, 255), Color3.fromRGB(140, 70, 230), 0)
barFill.Parent = barBg

local barText = Instance.new("TextLabel")
barText.Size = UDim2.new(1, 0, 1, 0)
barText.BackgroundTransparency = 1
barText.Font = Enum.Font.GothamBold
barText.Text = "0 / 300"
barText.TextColor3 = WHITE
barText.TextSize = 13
barText.TextStrokeTransparency = 0.4
barText.ZIndex = 2
barText.Parent = barBg

local function updateTierBar()
	local total = player:GetAttribute("TotalEarned") or 0
	local tiers = GameConfig.AURA_TIERS
	local idx = player:GetAttribute("AuraTier") or 1
	local cur = tiers[idx]
	local nxt = tiers[idx + 1]

	tierNow.Text = "Аура: " .. cur.name
	tierNow.TextColor3 = cur.color

	if nxt then
		local span = nxt.goal - cur.goal
		local prog = math.clamp((total - cur.goal) / span, 0, 1)
		barFill.Size = UDim2.new(prog, 0, 1, 0)
		barText.Text = comma(total - cur.goal) .. " / " .. comma(span)
		tierNext.Text = "Далі: " .. nxt.name
		tierNext.TextColor3 = nxt.color
	else
		barFill.Size = UDim2.new(1, 0, 1, 0)
		barText.Text = "МАКСИМАЛЬНИЙ ТІР 👑"
		tierNext.Text = "Далі: —"
	end
end
player:GetAttributeChangedSignal("TotalEarned"):Connect(updateTierBar)
player:GetAttributeChangedSignal("AuraTier"):Connect(updateTierBar)
updateTierBar()

-- ============================================================
--  МЕНЮ ЗЛІВА
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

local function makeMenuButton(iconTxt, order)
	local btn = Instance.new("TextButton")
	btn.Size = UDim2.new(0, 64, 0, 64)
	btn.BackgroundColor3 = DARK
	btn.Text = iconTxt
	btn.TextSize = 32
	btn.Font = Enum.Font.GothamBold
	btn.TextColor3 = WHITE
	btn.LayoutOrder = order
	corner(btn, 16)
	stroke(btn, THEME, 2)
	btn.Parent = menu
	return btn
end

local shopBtn = makeMenuButton("🛒", 1)
local achBtn = makeMenuButton("🏆", 2)

-- ============================================================
--  ПАНЕЛІ
-- ============================================================
local function makePanel(titleText)
	local panel = Instance.new("Frame")
	panel.AnchorPoint = Vector2.new(0.5, 0.5)
	panel.Position = UDim2.new(0.5, 0, 0.5, 0)
	panel.Size = UDim2.new(0, 500, 0, 450)
	panel.BackgroundColor3 = DARK
	panel.Visible = false
	corner(panel, 18)
	gradient(panel, Color3.fromRGB(34, 26, 50), DARK, 90)
	stroke(panel, THEME, 2.5)
	panel.Parent = gui

	local title = Instance.new("TextLabel")
	title.Size = UDim2.new(1, -70, 0, 52)
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
	close.Text = "X"
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
	scroll.Position = UDim2.new(0, 14, 0, 70)
	scroll.Size = UDim2.new(1, -28, 1, -84)
	scroll.BackgroundTransparency = 1
	scroll.BorderSizePixel = 0
	scroll.ScrollBarThickness = 6
	scroll.ScrollBarImageColor3 = THEME
	scroll.CanvasSize = UDim2.new(0, 0, 0, 0)
	scroll.AutomaticCanvasSize = Enum.AutomaticSize.Y
	scroll.Parent = panel

	local list = Instance.new("UIListLayout")
	list.Padding = UDim.new(0, 10)
	list.SortOrder = Enum.SortOrder.LayoutOrder
	list.Parent = scroll

	return panel, scroll
end

local shopPanel, shopContent = makePanel("🛒 Магазин аури")
local achPanel, achContent = makePanel("🏆 Досягнення")

local function clearRows(scroll)
	for _, ch in ipairs(scroll:GetChildren()) do
		if not ch:IsA("UIListLayout") then
			ch:Destroy()
		end
	end
end

-- ============================================================
--  МАГАЗИН (гарний)
-- ============================================================
local function refreshShop()
	clearRows(shopContent)
	local level = player:GetAttribute("UpgradeLevel") or 0
	local mult = player:GetAttribute("Multiplier") or 1
	local aura = auraValue.Value

	-- заголовок із поточним множником
	local header = Instance.new("TextLabel")
	header.Size = UDim2.new(1, 0, 0, 30)
	header.BackgroundColor3 = DARK2
	header.Font = Enum.Font.GothamBold
	header.Text = "Поточний множник аури:  ×" .. mult
	header.TextColor3 = THEME
	header.TextSize = 16
	header.LayoutOrder = 0
	corner(header, 10)
	header.Parent = shopContent

	for i, upg in ipairs(GameConfig.UPGRADES) do
		local owned = i <= level
		local isNext = i == level + 1

		local row = Instance.new("Frame")
		row.Size = UDim2.new(1, 0, 0, 72)
		row.BackgroundColor3 = DARK2
		row.LayoutOrder = i
		corner(row, 14)
		gradient(row, Color3.fromRGB(44, 40, 60), DARK2, 90)
		if owned then stroke(row, GREEN, 1.5) elseif isNext then stroke(row, THEME, 1.5) end
		row.Parent = shopContent

		-- іконка
		local ic = Instance.new("TextLabel")
		ic.Position = UDim2.new(0, 10, 0.5, 0)
		ic.AnchorPoint = Vector2.new(0, 0.5)
		ic.Size = UDim2.new(0, 50, 0, 50)
		ic.BackgroundColor3 = DARK
		ic.Font = Enum.Font.GothamBold
		ic.Text = upg.icon or "✦"
		ic.TextSize = 26
		ic.TextColor3 = WHITE
		corner(ic, 12)
		stroke(ic, owned and GREEN or THEME, 1.5)
		ic.Parent = row

		local name = Instance.new("TextLabel")
		name.BackgroundTransparency = 1
		name.Position = UDim2.new(0, 72, 0, 12)
		name.Size = UDim2.new(0.5, 0, 0, 24)
		name.Font = Enum.Font.GothamBold
		name.Text = upg.name
		name.TextColor3 = WHITE
		name.TextSize = 18
		name.TextXAlignment = Enum.TextXAlignment.Left
		name.Parent = row

		local desc = Instance.new("TextLabel")
		desc.BackgroundTransparency = 1
		desc.Position = UDim2.new(0, 72, 0, 38)
		desc.Size = UDim2.new(0.5, 0, 0, 22)
		desc.Font = Enum.Font.Gotham
		desc.Text = upg.desc
		desc.TextColor3 = GREY
		desc.TextSize = 14
		desc.TextXAlignment = Enum.TextXAlignment.Left
		desc.Parent = row

		local btn = Instance.new("TextButton")
		btn.AnchorPoint = Vector2.new(1, 0.5)
		btn.Position = UDim2.new(1, -12, 0.5, 0)
		btn.Size = UDim2.new(0, 140, 0, 46)
		btn.Font = Enum.Font.GothamBold
		btn.TextSize = 16
		btn.TextColor3 = WHITE
		corner(btn, 12)
		btn.Parent = row

		if owned then
			btn.Text = "Куплено ✓"
			btn.BackgroundColor3 = GREEN
			btn.AutoButtonColor = false
		elseif isNext then
			btn.Text = CUR_ICON .. " " .. fmt(upg.cost)
			local canAfford = aura >= upg.cost
			btn.BackgroundColor3 = canAfford and THEME or Color3.fromRGB(70, 70, 90)
			btn.TextColor3 = canAfford and WHITE or GREY
			if canAfford then gradient(btn, Color3.fromRGB(200, 140, 255), Color3.fromRGB(140, 70, 230), 90) end
			btn.MouseButton1Click:Connect(function()
				local ok, msg = buyUpgrade:InvokeServer()
				notify(ok and "✅ " .. msg or "❌ " .. msg, ok and GREEN or RED)
				refreshShop()
			end)
		else
			btn.Text = "🔒"
			btn.BackgroundColor3 = Color3.fromRGB(55, 58, 72)
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

		local bg = Instance.new("Frame")
		bg.Position = UDim2.new(0, 14, 0, 54)
		bg.Size = UDim2.new(1, -120, 0, 10)
		bg.BackgroundColor3 = Color3.fromRGB(55, 58, 72)
		corner(bg, 5)
		bg.Parent = row

		local fill = Instance.new("Frame")
		fill.Size = UDim2.new(progress, 0, 1, 0)
		fill.BackgroundColor3 = unlocked and THEME or Color3.fromRGB(120, 150, 255)
		corner(fill, 5)
		fill.Parent = bg

		local reward = Instance.new("TextLabel")
		reward.AnchorPoint = Vector2.new(1, 0.5)
		reward.Position = UDim2.new(1, -14, 0.5, 0)
		reward.Size = UDim2.new(0, 96, 0, 40)
		reward.BackgroundTransparency = 1
		reward.Font = Enum.Font.GothamBold
		reward.Text = CUR_ICON .. " " .. fmt(ach.reward)
		reward.TextColor3 = unlocked and GREEN or GREY
		reward.TextSize = 16
		reward.TextXAlignment = Enum.TextXAlignment.Right
		reward.Parent = row
	end
end

-- ============================================================
--  СПОВІЩЕННЯ
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
	label.Parent = toast

	TweenService:Create(toast, TweenInfo.new(0.35, Enum.EasingStyle.Back, Enum.EasingDirection.Out), {
		Position = UDim2.new(0.5, 0, 0, 96),
	}):Play()
	task.delay(2.2, function()
		local out = TweenService:Create(toast, TweenInfo.new(0.3), {
			Position = UDim2.new(0.5, 0, 0, -60),
		})
		out:Play()
		out.Completed:Wait()
		toast:Destroy()
	end)
end

-- ============================================================
--  ПЕРЕМИКАННЯ
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

auraValue.Changed:Connect(function()
	if shopPanel.Visible then refreshShop() end
end)
player:GetAttributeChangedSignal("UpgradeLevel"):Connect(function()
	if shopPanel.Visible then refreshShop() end
end)

achUnlocked.OnClientEvent:Connect(function(id, name, rewardAmount)
	notify("🏆 " .. name .. "  +" .. fmt(rewardAmount), GREEN)
	if achPanel.Visible then refreshAch() end
end)

-- ============================================================
--  АНІМАЦІЯ ФАРМУ
-- ============================================================
local lastAura = auraValue.Value

local function floatGain(amount)
	local char = player.Character
	local head = char and char:FindFirstChild("Head")
	if not head then return end

	local bb = Instance.new("BillboardGui")
	bb.Size = UDim2.new(0, 120, 0, 40)
	bb.StudsOffset = Vector3.new(math.random(-12, 12) / 10, 2.4, 0)
	bb.AlwaysOnTop = true
	bb.Adornee = head
	bb.Parent = head

	local lbl = Instance.new("TextLabel")
	lbl.Size = UDim2.new(1, 0, 1, 0)
	lbl.BackgroundTransparency = 1
	lbl.Font = Enum.Font.FredokaOne
	lbl.Text = "+" .. comma(amount)
	lbl.TextColor3 = Color3.fromRGB(210, 150, 255)
	lbl.TextStrokeTransparency = 0.2
	lbl.TextScaled = true
	lbl.Parent = bb

	TweenService:Create(bb, TweenInfo.new(1), {
		StudsOffset = bb.StudsOffset + Vector3.new(0, 2.5, 0),
	}):Play()
	TweenService:Create(lbl, TweenInfo.new(1), {
		TextTransparency = 1,
		TextStrokeTransparency = 1,
	}):Play()

	task.delay(1.05, function()
		bb:Destroy()
	end)
end

auraValue.Changed:Connect(function(newVal)
	local delta = newVal - lastAura
	lastAura = newVal
	if delta > 0 then
		floatGain(delta)
		icon.BackgroundColor3 = Color3.fromRGB(220, 180, 255)
		TweenService:Create(icon, TweenInfo.new(0.35), {
			BackgroundColor3 = THEME,
		}):Play()
	end
end)

print("[ShopUI] Інтерфейс аури готовий ✅")
