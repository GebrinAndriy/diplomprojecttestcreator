--[[
	Economy — серце гри (сервер):
	- валюта Aura (leaderstats) + атрибути гравця
	- дохід щосекунди (множник покращень + бонус зони)
	- тіри аури (AuraTier) за кількістю всього заробленого
	- магазин покращень, досягнення
	- збереження прогресу через DataStore
--]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local DataStoreService = game:GetService("DataStoreService")

local GameConfig = require(ReplicatedStorage:WaitForChild("GameConfig"))
local CUR = GameConfig.CURRENCY

local store = DataStoreService:GetDataStore("AuraSave_v1")

-- ===== Канали клієнт <-> сервер =====
local remotes = Instance.new("Folder")
remotes.Name = "Remotes"
remotes.Parent = ReplicatedStorage

local buyUpgrade = Instance.new("RemoteFunction")
buyUpgrade.Name = "BuyUpgrade"
buyUpgrade.Parent = remotes

local achUnlocked = Instance.new("RemoteEvent")
achUnlocked.Name = "AchievementUnlocked"
achUnlocked.Parent = remotes

-- ===== Хелпери =====
local function getCur(player)
	local ls = player:FindFirstChild("leaderstats")
	return ls and ls:FindFirstChild(CUR)
end

-- тір за кількістю всього заробленого
local function tierFor(total)
	local tier = 1
	for i, t in ipairs(GameConfig.AURA_TIERS) do
		if total >= t.goal then
			tier = i
		end
	end
	return tier
end

-- у якій зоні гравець
local function getZoneFor(player)
	local char = player.Character
	if not char then return nil end
	local root = char:FindFirstChild("HumanoidRootPart")
	if not root then return nil end
	for _, zone in ipairs(GameConfig.ZONES) do
		local dx = root.Position.X - zone.pos.X
		local dz = root.Position.Z - zone.pos.Z
		local dy = math.abs(root.Position.Y - zone.pos.Y)
		if math.sqrt(dx * dx + dz * dz) <= zone.radius and dy < 8 then
			return zone
		end
	end
	return nil
end

-- ===== Збереження =====
local function key(player)
	return "p_" .. player.UserId
end

local function saveData(player)
	local cur = getCur(player)
	if not cur then return end
	local ach = {}
	for _, a in ipairs(GameConfig.ACHIEVEMENTS) do
		if player:GetAttribute("Ach_" .. a.id) then
			table.insert(ach, a.id)
		end
	end
	local payload = {
		aura = cur.Value,
		upgradeLevel = player:GetAttribute("UpgradeLevel") or 0,
		totalEarned = player:GetAttribute("TotalEarned") or 0,
		afkTime = player:GetAttribute("AfkTime") or 0,
		ach = ach,
	}
	local ok, err = pcall(function()
		store:SetAsync(key(player), payload)
	end)
	if not ok then
		warn("[Economy] Не вдалось зберегти " .. player.Name .. ": " .. tostring(err))
	end
end

local function loadData(player)
	local ok, data = pcall(function()
		return store:GetAsync(key(player))
	end)
	if ok and data then
		return data
	end
	if not ok then
		warn("[Economy] DataStore недоступний (увімкни API Services у Game Settings)")
	end
	return nil
end

-- ===== Вхід гравця =====
local function onPlayerAdded(player)
	local leaderstats = Instance.new("Folder")
	leaderstats.Name = "leaderstats"
	leaderstats.Parent = player

	local aura = Instance.new("IntValue")
	aura.Name = CUR
	aura.Value = 0
	aura.Parent = leaderstats

	player:SetAttribute("Multiplier", 1)
	player:SetAttribute("UpgradeLevel", 0)
	player:SetAttribute("TotalEarned", 0)
	player:SetAttribute("AfkTime", 0)
	player:SetAttribute("AfkBoosting", false)
	player:SetAttribute("ZoneBonus", 0)
	player:SetAttribute("ZoneName", "")
	player:SetAttribute("AuraTier", 1)

	-- завантажуємо збереження
	local data = loadData(player)
	if data then
		aura.Value = data.aura or 0
		player:SetAttribute("UpgradeLevel", data.upgradeLevel or 0)
		player:SetAttribute("TotalEarned", data.totalEarned or 0)
		player:SetAttribute("AfkTime", data.afkTime or 0)
		local lvl = data.upgradeLevel or 0
		local upg = GameConfig.UPGRADES[lvl]
		player:SetAttribute("Multiplier", upg and upg.mult or 1)
		for _, id in ipairs(data.ach or {}) do
			player:SetAttribute("Ach_" .. id, true)
		end
		player:SetAttribute("AuraTier", tierFor(data.totalEarned or 0))
	end

	player:SetAttribute("DataLoaded", true)
end

Players.PlayerAdded:Connect(onPlayerAdded)
Players.PlayerRemoving:Connect(saveData)

-- збереження при закритті сервера
game:BindToClose(function()
	for _, player in ipairs(Players:GetPlayers()) do
		saveData(player)
	end
end)

-- автозбереження раз на 60 сек
task.spawn(function()
	while true do
		task.wait(60)
		for _, player in ipairs(Players:GetPlayers()) do
			saveData(player)
		end
	end
end)

-- ===== Нарахування + досягнення =====
local function award(player, cur, amount)
	cur.Value += amount
	player:SetAttribute("TotalEarned", (player:GetAttribute("TotalEarned") or 0) + amount)
end

local function checkAchievements(player, cur)
	for _, ach in ipairs(GameConfig.ACHIEVEMENTS) do
		local k = "Ach_" .. ach.id
		if not player:GetAttribute(k) then
			local statValue = player:GetAttribute(ach.stat) or 0
			if statValue >= ach.goal then
				player:SetAttribute(k, true)
				cur.Value += ach.reward
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
	local cur = getCur(player)
	if not cur then
		return false, "Помилка"
	end
	if cur.Value < nextUpg.cost then
		return false, "Недостатньо аури"
	end
	cur.Value -= nextUpg.cost
	player:SetAttribute("UpgradeLevel", level + 1)
	player:SetAttribute("Multiplier", nextUpg.mult)
	return true, "Куплено: " .. nextUpg.name
end

-- ===== Головний цикл =====
task.spawn(function()
	while true do
		task.wait(1)
		for _, player in ipairs(Players:GetPlayers()) do
			local cur = getCur(player)
			if cur then
				local mult = player:GetAttribute("Multiplier") or 1
				local gain = GameConfig.BASE_INCOME * mult

				local zone = getZoneFor(player)
				local total = player:GetAttribute("TotalEarned") or 0
				if zone and total >= zone.unlock then
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

				award(player, cur, gain)
				checkAchievements(player, cur)

				-- оновлюємо тір аури
				local newTier = tierFor(player:GetAttribute("TotalEarned") or 0)
				if newTier ~= (player:GetAttribute("AuraTier") or 1) then
					player:SetAttribute("AuraTier", newTier)
				end
			end
		end
	end
end)

print("[Economy] Запущено: аура, тіри, магазин, досягнення, збереження ✅")
