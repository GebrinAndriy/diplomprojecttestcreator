--[[
	AFK Coins — пасивний дохід
	Поки гравець у грі, кожну секунду йому капають монети.
	Синхронізується в ServerScriptService через Rojo.
--]]

local Players = game:GetService("Players")

-- скільки монет за секунду
local COINS_PER_SECOND = 1

-- коли гравець заходить у гру
local function onPlayerAdded(player)
	-- створюємо "leaderstats" — це те що видно в таблиці гравців (Tab)
	local leaderstats = Instance.new("Folder")
	leaderstats.Name = "leaderstats"
	leaderstats.Parent = player

	-- наша валюта
	local coins = Instance.new("IntValue")
	coins.Name = "Coins"
	coins.Value = 0
	coins.Parent = leaderstats

	-- цикл нарахування, поки гравець у грі
	task.spawn(function()
		while player.Parent == Players do
			task.wait(1)
			coins.Value = coins.Value + COINS_PER_SECOND
		end
	end)
end

Players.PlayerAdded:Connect(onPlayerAdded)
