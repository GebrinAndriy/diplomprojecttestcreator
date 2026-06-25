--[[
	GameConfig — усі налаштування гри в одному місці.
	Це ModuleScript у ReplicatedStorage: його читають і сервер, і клієнт.
	Хочеш поміняти ціни/нагороди/кольори — міняй тут.
--]]

local GameConfig = {}

-- ===== ЗАГАЛЬНЕ =====
GameConfig.THEME = Color3.fromRGB(70, 255, 160) -- основний колір (неон)
GameConfig.BASE_INCOME = 1                       -- базовий дохід монет/сек
GameConfig.BOOST_BONUS = 4                       -- бонус/сек на AFK-платформі

-- AFK-платформа (спільне з картою)
GameConfig.PAD_POSITION = Vector3.new(0, 1, -40)
GameConfig.PAD_RADIUS = 10

-- ===== ПОКРАЩЕННЯ (магазин) =====
-- купуються по черзі; mult — у скільки разів множиться дохід
GameConfig.UPGRADES = {
	{ name = "Подвійний дохід", desc = "Дохід ×2",  mult = 2,  cost = 50 },
	{ name = "Потрійний дохід", desc = "Дохід ×3",  mult = 3,  cost = 250 },
	{ name = "Турбо ×5",        desc = "Дохід ×5",  mult = 5,  cost = 1200 },
	{ name = "Мега ×10",        desc = "Дохід ×10", mult = 10, cost = 6000 },
	{ name = "Космос ×25",      desc = "Дохід ×25", mult = 25, cost = 30000 },
	{ name = "Легенда ×50",     desc = "Дохід ×50", mult = 50, cost = 150000 },
}

-- ===== ДОСЯГНЕННЯ =====
-- stat — який показник перевіряти (атрибут гравця), goal — поріг, reward — монети
GameConfig.ACHIEVEMENTS = {
	{ id = "start",  name = "Перші кроки", desc = "Заробити 100 монет",      stat = "TotalEarned",  goal = 100,    reward = 50 },
	{ id = "rich",   name = "Багатій",     desc = "Заробити 1 000 монет",    stat = "TotalEarned",  goal = 1000,   reward = 250 },
	{ id = "boss",   name = "Магнат",      desc = "Заробити 50 000 монет",   stat = "TotalEarned",  goal = 50000,  reward = 5000 },
	{ id = "mega",   name = "Мільйонер",   desc = "Заробити 1 000 000",      stat = "TotalEarned",  goal = 1000000,reward = 50000 },
	{ id = "afk1",   name = "AFK новачок", desc = "Простояти 60 сек у зоні", stat = "AfkTime",      goal = 60,     reward = 100 },
	{ id = "afk2",   name = "AFK майстер", desc = "Простояти 10 хв у зоні",  stat = "AfkTime",      goal = 600,    reward = 1000 },
	{ id = "upg1",   name = "Прокачка",    desc = "Купити покращення",       stat = "UpgradeLevel", goal = 1,      reward = 100 },
	{ id = "upgmax", name = "Максималка",  desc = "Купити всі покращення",   stat = "UpgradeLevel", goal = 6,      reward = 10000 },
}

return GameConfig
