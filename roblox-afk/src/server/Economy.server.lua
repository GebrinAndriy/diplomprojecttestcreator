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
end

Players.PlayerAdded:Connect(onPlayerAdded)

-- ===== Хелпери =====
local function getCoins(player)
	local ls = player:FindFirstChild("leaderstats")
	return ls and ls:FindFirstChild("Coins")
end

local function isOnPad(player)
	local char = player.Character
	if not char then return false end
	local root = char:FindFirstChild("HumanoidRootPart")
	if not root then return false end
	local pos = GameConfig.PAD_POSITION
	local dx = root.Position.X - pos.X
	local dz = root.Position.Z - pos.Z
	local dist = math.sqrt(dx * dx + dz * dz)
	local dy = math.abs(root.Position.Y - pos.Y)
	return dist <= GameConfig.PAD_RADIUS and dy < 8
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

				if isOnPad(player) then
					gain += GameConfig.BOOST_BONUS * mult
					player:SetAttribute("AfkTime", (player:GetAttribute("AfkTime") or 0) + 1)
					player:SetAttribute("AfkBoosting", true)
				else
					player:SetAttribute("AfkBoosting", false)
				end

				award(player, coins, gain)
				checkAchievements(player, coins)
			end
		end
	end
end)

print("[Economy] Запущено: дохід, буст, магазин, досягнення ✅")
