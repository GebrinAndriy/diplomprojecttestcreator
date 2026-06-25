--[[
	Economy — серце гри (сервер):
	- створює валюту (leaderstats.Coins) і атрибути гравця
	- нараховує дохід щосекунди (з урахуванням множника покращень)
	- дає бонус на AFK-платформі
	- обробляє покупки покращень
	- видає досягнення й нагороди

	Замінює старі AfkCoins / AfkBoost.
--]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local GameConfig = require(ReplicatedStorage:WaitForChild("GameConfig"))

-- ===== Створюємо канали зв'язку клієнт <-> сервер =====
local remotes = Instance.new("Folder")
remotes.Name = "Remotes"
remotes.Parent = ReplicatedStorage

local buyUpgrade = Instance.new("RemoteFunction")
buyUpgrade.Name = "BuyUpgrade"
buyUpgrade.Parent = remotes

local achUnlocked = Instance.new("RemoteEvent")
achUnlocked.Name = "AchievementUnlocked"
achUnlocked.Parent = remotes

-- ===== Налаштування гравця при вході =====
local function onPlayerAdded(player)
	local leaderstats = Instance.new("Folder")
	leaderstats.Name = "leaderstats"
	leaderstats.Parent = player

	local coins = Instance.new("IntValue")
	coins.Name = "Coins"
	coins.Value = 0
	coins.Parent = leaderstats

	-- атрибути (реплікуються на клієнт автоматично — UI читає їх напряму)
	player:SetAttribute("Multiplier", 1)     -- поточний множник доходу
	player:SetAttribute("UpgradeLevel", 0)   -- скільки покращень куплено
	player:SetAttribute("TotalEarned", 0)    -- всього зароблено (для досягнень)
	player:SetAttribute("AfkTime", 0)        -- секунд на платформі
	player:SetAttribute("AfkBoosting", false)
	player:SetAttribute("ZoneBonus", 0)      -- бонус поточної зони
	player:SetAttribute("ZoneName", "")      -- назва поточної зони
end

Players.PlayerAdded:Connect(onPlayerAdded)

-- ===== Хелпери =====
local function getCoins(player)
	local ls = player:FindFirstChild("leaderstats")
	return ls and ls:FindFirstChild("Coins")
end

-- у якій зоні стоїть гравець (повертає зону або nil)
local function getZoneFor(player)
	local char = player.Character
	if not char then return nil end
	local root = char:FindFirstChild("HumanoidRootPart")
	if not root then return nil end
	for _, zone in ipairs(GameConfig.ZONES) do
		local dx = root.Position.X - zone.pos.X
		local dz = root.Position.Z - zone.pos.Z
		local dist = math.sqrt(dx * dx + dz * dz)
		local dy = math.abs(root.Position.Y - zone.pos.Y)
		if dist <= zone.radius and dy < 8 then
			return zone
		end
	end
	return nil
end

-- видати монети + порахувати у "всього зароблено"
local function award(player, coins, amount)
	coins.Value += amount
	player:SetAttribute("TotalEarned", (player:GetAttribute("TotalEarned") or 0) + amount)
end

-- перевірка досягнень
local function checkAchievements(player, coins)
	for _, ach in ipairs(GameConfig.ACHIEVEMENTS) do
		local key = "Ach_" .. ach.id
		if not player:GetAttribute(key) then
			local statValue = player:GetAttribute(ach.stat) or 0
			if statValue >= ach.goal then
				player:SetAttribute(key, true)
				coins.Value += ach.reward -- нагорода
				achUnlocked:FireClient(player, ach.id, ach.name, ach.reward)
			end
		end
	end
end

-- ===== Покупка покращення =====
buyUpgrade.OnServerInvoke = function(player)
	local level = player:GetAttribute("UpgradeLevel") or 0
	local nextUpg = GameConfig.UPGRADES[level + 1]
	if not nextUpg then
		return false, "Усе вже куплено! 🎉"
	end
	local coins = getCoins(player)
	if not coins then
		return false, "Помилка"
	end
	if coins.Value < nextUpg.cost then
		return false, "Недостатньо монет"
	end
	coins.Value -= nextUpg.cost
	player:SetAttribute("UpgradeLevel", level + 1)
	player:SetAttribute("Multiplier", nextUpg.mult)
	return true, "Куплено: " .. nextUpg.name
end

-- ===== Головний цикл доходу (раз на секунду) =====
task.spawn(function()
	while true do
		task.wait(1)
		for _, player in ipairs(Players:GetPlayers()) do
			local coins = getCoins(player)
			if coins then
				local mult = player:GetAttribute("Multiplier") or 1
				local gain = GameConfig.BASE_INCOME * mult

				local zone = getZoneFor(player)
				local totalEarned = player:GetAttribute("TotalEarned") or 0
				-- зона дає буст лише якщо вже розблокована (заробив достатньо)
				if zone and totalEarned >= zone.unlock then
					gain += zone.bonus * mult
					player:SetAttribute("AfkTime", (player:GetAttribute("AfkTime") or 0) + 1)
					player:SetAttribute("AfkBoosting", true)
					player:SetAttribute("ZoneBonus", zone.bonus)
					player:SetAttribute("ZoneName", zone.name)
				else
					player:SetAttribute("AfkBoosting", false)
					player:SetAttribute("ZoneBonus", 0)
					player:SetAttribute("ZoneName", "")
				end

				award(player, coins, gain)
				checkAchievements(player, coins)
			end
		end
	end
end)

print("[Economy] Запущено: дохід, буст, магазин, досягнення ✅")
