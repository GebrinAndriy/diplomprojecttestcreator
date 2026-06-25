--[[
	AfkBoost — поки гравець стоїть на AFK-платформі, він отримує бонусні монети.
	Бонус нараховується ПОВЕРХ твоєї основної системи доходу.

	Як це працює:
	- кожну секунду перевіряємо, хто стоїть у радіусі платформи
	- хто стоїть — отримує BONUS_PER_SEC монет
	- валюту шукаємо автоматично в leaderstats
--]]

local Players = game:GetService("Players")
local Workspace = game:GetService("Workspace")

-- ===== НАЛАШТУВАННЯ (мають співпадати з Map.server.lua) =====
local PAD_POSITION = Vector3.new(0, 1, -40)
local PAD_RADIUS = 10
local BONUS_PER_SEC = 4         -- скільки ДОДАТКОВО монет за секунду на платформі
local CURRENCY_NAME = "Coins"   -- бажана назва валюти (якщо інша — знайде сам)
-- ============================================================

-- знаходимо числову валюту гравця в leaderstats
local function getCurrency(player)
	local ls = player:FindFirstChild("leaderstats")
	if not ls then return nil end
	-- спершу шукаємо по назві
	local v = ls:FindFirstChild(CURRENCY_NAME)
	if v and (v:IsA("IntValue") or v:IsA("NumberValue")) then return v end
	-- інакше беремо перше числове значення
	for _, c in ipairs(ls:GetChildren()) do
		if c:IsA("IntValue") or c:IsA("NumberValue") then return c end
	end
	return nil
end

-- чи стоїть гравець на платформі
local function isOnPad(player)
	local char = player.Character
	if not char then return false end
	local root = char:FindFirstChild("HumanoidRootPart")
	if not root then return false end
	-- горизонтальна відстань до центру платформи
	local dx = root.Position.X - PAD_POSITION.X
	local dz = root.Position.Z - PAD_POSITION.Z
	local dist = math.sqrt(dx * dx + dz * dz)
	-- і приблизно на рівні платформи (не летить десь зверху)
	local dy = math.abs(root.Position.Y - PAD_POSITION.Y)
	return dist <= PAD_RADIUS and dy < 8
end

-- головний цикл нарахування бонусу
task.spawn(function()
	while true do
		task.wait(1)
		for _, player in ipairs(Players:GetPlayers()) do
			if isOnPad(player) then
				local currency = getCurrency(player)
				if currency then
					currency.Value = currency.Value + BONUS_PER_SEC
					-- позначка, що гравець у бусті (можна юзати для UI)
					player:SetAttribute("AfkBoosting", true)
				end
			else
				player:SetAttribute("AfkBoosting", false)
			end
		end
	end
end)

print("[AfkBoost] Запущено. Бонус на платформі: +" .. BONUS_PER_SEC .. "/сек")
