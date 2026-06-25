--[[
	GameConfig — усі налаштування гри (аура-фармінг).
	ModuleScript у ReplicatedStorage: читають і сервер, і клієнт.
--]]

local GameConfig = {}

-- ===== ЗАГАЛЬНЕ =====
GameConfig.DEV_MODE = true                         -- ⚠️ чіт-кнопки накрутки аури (вимкни перед релізом!)
GameConfig.CURRENCY = "Aura"                       -- назва валюти в leaderstats
GameConfig.THEME = Color3.fromRGB(170, 95, 255)   -- фіолетова аура
GameConfig.BASE_INCOME = 1                         -- базова аура/сек

-- ===== AFK-ЗОНИ =====
-- bonus — додаткова аура/сек у зоні; unlock — скільки ВСЬОГО заробити, щоб відкрити
-- rebirth — скільки перероджень треба, щоб зона відкрилась (0 = не треба)
GameConfig.ZONES = {
	{ name = "Старт",        pos = Vector3.new(0, 1, -48),    radius = 10, bonus = 4,    unlock = 0,      color = Color3.fromRGB(120, 220, 255) },
	{ name = "Срібна зона",  pos = Vector3.new(72, 1, -52),   radius = 10, bonus = 20,   unlock = 1000,   color = Color3.fromRGB(150, 200, 255) },
	{ name = "Золота зона",  pos = Vector3.new(-72, 1, -52),  radius = 10, bonus = 80,   unlock = 15000,  color = Color3.fromRGB(255, 205, 70) },
	{ name = "Алмазна зона", pos = Vector3.new(0, 1, -126),   radius = 12, bonus = 400,  unlock = 200000, color = Color3.fromRGB(120, 255, 240) },
	{ name = "VIP зона",     pos = Vector3.new(0, 1, 22),     radius = 12, bonus = 3000, unlock = 0, rebirth = 1, color = Color3.fromRGB(255, 120, 255) },
}

-- ===== ПЕРЕРОДЖЕННЯ (prestige) =====
GameConfig.REBIRTH = {
	baseCost = 3000000,    -- перше = досягти максимального тіру аури
	growth = 3,            -- кожне наступне ×3 дорожче
	bonusPerRebirth = 1,   -- RebirthMult = 1 + Rebirths (тобто +100% доходу за кожне)
	offlineCapHours = 8,   -- максимум офлайн-доходу
}

GameConfig.REBIRTH_PERKS = {
	{ at = 1, name = "Сяйво переродженого", desc = "Райдужна аура + VIP-зона + дохід ×2" },
	{ at = 2, name = "Друге дихання",       desc = "Дохід ×3 назавжди" },
	{ at = 3, name = "Майстер аури",        desc = "Дохід ×4 + більші ефекти" },
	{ at = 5, name = "Легенда",             desc = "Дохід ×6 + максимальне сяйво" },
}

-- ===== ПОКРАЩЕННЯ (магазин) — множник аури =====
GameConfig.UPGRADES = {
	{ name = "Подвійна аура", desc = "Аура ×2",  icon = "⭐", mult = 2,  cost = 50 },
	{ name = "Потрійна аура", desc = "Аура ×3",  icon = "🌟", mult = 3,  cost = 250 },
	{ name = "Турбо ×5",      desc = "Аура ×5",  icon = "⚡", mult = 5,  cost = 1200 },
	{ name = "Мега ×10",      desc = "Аура ×10", icon = "🔥", mult = 10, cost = 6000 },
	{ name = "Космос ×25",    desc = "Аура ×25", icon = "🌀", mult = 25, cost = 30000 },
	{ name = "Легенда ×50",   desc = "Аура ×50", icon = "👑", mult = 50, cost = 150000 },
}

-- ===== ДОСЯГНЕННЯ =====
GameConfig.ACHIEVEMENTS = {
	{ id = "start",  name = "Перші кроки", desc = "Заробити 100 аури",       stat = "TotalEarned",  goal = 100,     reward = 50 },
	{ id = "rich",   name = "Багатій",     desc = "Заробити 1 000 аури",     stat = "TotalEarned",  goal = 1000,    reward = 250 },
	{ id = "boss",   name = "Магнат",      desc = "Заробити 50 000 аури",    stat = "TotalEarned",  goal = 50000,   reward = 5000 },
	{ id = "mega",   name = "Володар",     desc = "Заробити 1 000 000",      stat = "TotalEarned",  goal = 1000000, reward = 50000 },
	{ id = "afk1",   name = "AFK новачок", desc = "Простояти 60 сек у зоні", stat = "AfkTime",      goal = 60,      reward = 100 },
	{ id = "afk2",   name = "AFK майстер", desc = "Простояти 10 хв у зоні",  stat = "AfkTime",      goal = 600,     reward = 1000 },
	{ id = "upg1",   name = "Прокачка",    desc = "Купити покращення",       stat = "UpgradeLevel", goal = 1,       reward = 100 },
	{ id = "upgmax", name = "Максималка",  desc = "Купити всі покращення",   stat = "UpgradeLevel", goal = 6,       reward = 10000 },
}

-- ===== ТІРИ АУРИ =====
-- коли TotalEarned досягає goal — навколо гравця вмикається крутіший ефект
-- index тіру = найвищий, чий goal <= TotalEarned (мінімум 1)
GameConfig.AURA_TIERS = {
	{ name = "Тьмяна",      goal = 0,       color = Color3.fromRGB(180, 180, 195) },
	{ name = "Іскриста",    goal = 300,     color = Color3.fromRGB(120, 220, 255) },
	{ name = "Палаюча",     goal = 3000,    color = Color3.fromRGB(255, 150, 60) },
	{ name = "Грозова",     goal = 30000,   color = Color3.fromRGB(150, 120, 255) },
	{ name = "Космічна",    goal = 300000,  color = Color3.fromRGB(255, 90, 220) },
	{ name = "Божественна", goal = 3000000, color = Color3.fromRGB(255, 230, 90) },
}

-- ===== МУЗИКА =====
-- ⚠️ ЗАМІНИ на свої треки! Creator Store -> Audio -> ПКМ -> Copy Asset ID
-- (через приватність аудіо Roblox чужі ID часто не грають — постав свої)
GameConfig.MUSIC_IDS = {
	-- "rbxassetid://0000000000",
}
GameConfig.MUSIC_VOLUME = 0.4

return GameConfig
