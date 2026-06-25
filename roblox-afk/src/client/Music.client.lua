--[[
	Music — фонова музика (клієнт) + кнопка вкл/викл у правому верхньому куті.
	Треки беруться з GameConfig.MUSIC_IDS. Якщо список порожній — просто
	показує кнопку (постав свої ID у GameConfig, бо чужі аудіо часто закриті).
--]]

local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local SoundService = game:GetService("SoundService")

local GameConfig = require(ReplicatedStorage:WaitForChild("GameConfig"))
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local sound = Instance.new("Sound")
sound.Name = "BackgroundMusic"
sound.Volume = GameConfig.MUSIC_VOLUME or 0.4
sound.Looped = false
sound.Parent = SoundService

local ids = GameConfig.MUSIC_IDS or {}
local muted = false
local index = 0

local function playNext()
	if muted or #ids == 0 then return end
	index = index % #ids + 1
	sound.SoundId = ids[index]
	sound:Play()
end

sound.Ended:Connect(playNext)

-- ===== Кнопка звуку =====
local gui = Instance.new("ScreenGui")
gui.Name = "MusicUI"
gui.ResetOnSpawn = false
gui.IgnoreGuiInset = true
gui.Parent = playerGui

local btn = Instance.new("TextButton")
btn.AnchorPoint = Vector2.new(1, 0)
btn.Position = UDim2.new(1, -14, 0, 14)
btn.Size = UDim2.new(0, 48, 0, 48)
btn.BackgroundColor3 = Color3.fromRGB(24, 27, 36)
btn.Text = "🔊"
btn.TextSize = 24
btn.Font = Enum.Font.GothamBold
btn.TextColor3 = Color3.fromRGB(245, 245, 245)
btn.Parent = gui

local corner = Instance.new("UICorner")
corner.CornerRadius = UDim.new(0, 14)
corner.Parent = btn
local stroke = Instance.new("UIStroke")
stroke.Color = GameConfig.THEME
stroke.Thickness = 2
stroke.Parent = btn

btn.MouseButton1Click:Connect(function()
	muted = not muted
	btn.Text = muted and "🔇" or "🔊"
	if muted then
		sound:Pause()
	else
		if sound.SoundId ~= "" then
			sound:Resume()
		else
			playNext()
		end
	end
end)

playNext()
print("[Music] Готово (треків: " .. #ids .. ") ✅")
