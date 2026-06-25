--[[
	Island — генерує справжній острів з Roblox Terrain (трава/пісок/камінь/вода).
	Це органічна земля під сценою (не геометричні блоки).
	Будується при старті (Terrain не синхронізується через Rojo, тому в коді).
	Зони/постройки лежать згори на траві (рівень ~ y=1).
--]]

local Workspace = game:GetService("Workspace")
local Terrain = Workspace.Terrain

local M = Enum.Material
local cx, cz = 0, -60 -- центр острова

Terrain:Clear()

-- ОКЕАН (поверхня води ~ y = -2)
Terrain:FillBlock(CFrame.new(cx, -22, cz), Vector3.new(1200, 40, 1200), M.Water)

-- КАМ'ЯНА ОСНОВА острова
Terrain:FillBlock(CFrame.new(cx, -6, cz), Vector3.new(258, 12, 238), M.Rock)

-- ПІСОК (пляжі) — ширший і нижчий, щоб виглядав по периметру
Terrain:FillBlock(CFrame.new(cx, -2.5, cz), Vector3.new(272, 6, 252), M.Sand)

-- ТРАВА згори (вужча й вища — основна поверхня)
Terrain:FillBlock(CFrame.new(cx, -1, cz), Vector3.new(250, 5, 230), M.Grass)

-- округлюємо кути травою, щоб не був прямокутник
local corners = {
	{ -120, -150 }, { 120, -150 }, { -120, 30 }, { 120, 30 },
	{ 0, -160 }, { 0, 35 }, { -130, -60 }, { 130, -60 },
}
for _, c in ipairs(corners) do
	Terrain:FillBall(Vector3.new(c[1], 0, c[2]), 26, M.Grass)
	Terrain:FillBall(Vector3.new(c[1], -3, c[2]), 30, M.Sand)
end

-- ПАГОРБИ для рельєфу (трава)
local hills = {
	{ -95, 2, -110, 24 },
	{ 100, 4, -30, 20 },
	{ -40, 3, 10, 18 },
	{ 60, 5, -150, 22 },
}
for _, h in ipairs(hills) do
	Terrain:FillBall(Vector3.new(h[1], h[2], h[3]), h[4], M.Grass)
end

-- СКЕЛІ (камінь) для різноманіття
local rocks = {
	{ -110, 6, -30, 12 },
	{ 110, 8, -100, 14 },
	{ 30, 6, 20, 10 },
}
for _, r in ipairs(rocks) do
	Terrain:FillBall(Vector3.new(r[1], r[2], r[3]), r[4], M.Rock)
end

print("[Island] Острів згенеровано ✅")
