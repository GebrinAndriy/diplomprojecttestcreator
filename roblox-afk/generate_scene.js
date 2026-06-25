/*
  Генератор сцени для Rojo (об'єкти згори на terrain-острові).
  Земля/вода/пляжі — це Terrain (Island.server.lua). Тут: платформи зон,
  доріжки, ліхтарі, декор спавну і РІЗНІ постройки для кожної зони.
  Запуск:  node generate_scene.js
*/

const fs = require("fs");
const path = require("path");

const round = (n) => Math.round(n * 1000) / 1000;
const C = (r, g, b) => [round(r / 255), round(g / 255), round(b / 255)];

const cf = (x, y, z) => [x, y, z, 1, 0, 0, 0, 1, 0, 0, 0, 1];
const cfRotZ90 = (x, y, z) => [x, y, z, 0, -1, 0, 1, 0, 0, 0, 0, 1];
const cfYaw = (x, y, z, a) => {
  const c = Math.cos(a), s = Math.sin(a);
  return [x, y, z, c, 0, s, 0, 1, 0, -s, 0, c];
};

// ===== Палітра =====
const STONE = C(120, 120, 128);
const STONE_D = C(86, 86, 94);
const WOOD = C(120, 84, 52);
const PILLAR = C(150, 150, 158);
const LAMP_LIGHT = C(255, 240, 210);
const SPAWN_CRYSTAL = C(120, 210, 255);

// ЗОНИ (синхронно з GameConfig.lua)
const ZONES = [
  { name: "Старт",        pos: [0, 1, -48],   radius: 10, color: [120, 220, 255] },
  { name: "Срібна зона",  pos: [72, 1, -52],  radius: 10, color: [150, 200, 255] },
  { name: "Золота зона",  pos: [-72, 1, -52], radius: 10, color: [255, 205, 70] },
  { name: "Алмазна зона", pos: [0, 1, -126],  radius: 12, color: [120, 255, 240] },
];

function part(className, name, props, children) {
  return { className, name, properties: props, ...(children ? { children } : {}) };
}
function P(name, props, children) {
  return part("Part", name, { Anchored: true, ...props }, children);
}
function light(color, brightness, range) {
  return part("PointLight", "Light", { Color: color, Brightness: brightness, Range: range });
}

// ===== Платформа зони =====
function buildZone(zone, index) {
  const [px, py, pz] = zone.pos;
  const R = zone.radius;
  const col = C(...zone.color);
  const kids = [];

  kids.push(P("Pad", {
    Shape: "Cylinder", Size: [1, R * 2, R * 2], CFrame: cfRotZ90(px, py, pz),
    Material: "SmoothPlastic", Color: STONE_D,
  }));
  kids.push(P("Ring", {
    Shape: "Cylinder", Size: [1.2, R * 2 + 1, R * 2 + 1], CFrame: cfRotZ90(px, py + 0.1, pz),
    CanCollide: false, Material: "SmoothPlastic", Color: col,
  }));

  const PILLARS = 6;
  for (let i = 1; i <= PILLARS; i++) {
    const a = (i / PILLARS) * Math.PI * 2;
    const ox = Math.cos(a) * (R + 2), oz = Math.sin(a) * (R + 2);
    kids.push(P("Pillar", {
      Size: [1.4, 8, 1.4], CFrame: cf(px + ox, py + 4, pz + oz),
      Material: "Concrete", Color: PILLAR,
    }));
    kids.push(P("PillarTop", {
      Shape: "Ball", Size: [1.5, 1.5, 1.5], CFrame: cf(px + ox, py + 8.6, pz + oz),
      CanCollide: false, Material: "Neon", Color: col,
    }));
  }

  kids.push(P("Crystal", {
    Shape: "Ball", Size: [4, 4, 4], CFrame: cf(px, py + 8, pz),
    CanCollide: false, Material: "Neon", Color: col, Transparency: 0.1,
  }, [light(col, 3, 20)]));

  return part("Folder", "Zone_" + index, {}, kids);
}

// ===== Доріжка (кам'яна, на траві) =====
function buildPath(zone, index) {
  const [zx, , zz] = zone.pos;
  const dist = Math.sqrt(zx * zx + zz * zz);
  const ang = Math.atan2(zx, zz);
  const kids = [];
  kids.push(P("PathBase", {
    Size: [7, 0.6, dist], CFrame: cfYaw(zx / 2, 1.2, zz / 2, ang),
    Material: "Slate", Color: STONE_D, CanCollide: false,
  }));
  kids.push(P("PathLine", {
    Size: [1.2, 0.65, dist], CFrame: cfYaw(zx / 2, 1.25, zz / 2, ang),
    Material: "Concrete", Color: STONE, CanCollide: false,
  }));
  return part("Folder", "Path_" + index, {}, kids);
}

// ===== Ліхтар =====
function buildLamp(x, z, n) {
  const kids = [];
  kids.push(P("Post", {
    Shape: "Cylinder", Size: [13, 0.9, 0.9], CFrame: cfRotZ90(x, 6.5, z),
    Material: "Metal", Color: STONE,
  }));
  kids.push(P("Bulb", {
    Shape: "Ball", Size: [2, 2, 2], CFrame: cf(x, 13.2, z),
    CanCollide: false, Material: "Neon", Color: LAMP_LIGHT,
  }, [light(LAMP_LIGHT, 2.5, 22)]));
  return part("Folder", "Lamp_" + n, {}, kids);
}

// ===== РІЗНІ постройки для кожної зони =====
function buildStructure(zone, index) {
  const [px, , pz] = zone.pos;
  const R = zone.radius;
  const col = C(...zone.color);
  const len = Math.hypot(px, pz);
  const ax = px / len, az = pz / len;
  const bx = px + ax * (R + 11), bz = pz + az * (R + 11); // позаду зони
  const kids = [];
  const v = (index - 1) % 4;

  if (v === 0) {
    // вказівник
    kids.push(P("S_Post", { Shape: "Cylinder", Size: [10, 1, 1], CFrame: cfRotZ90(bx, 5, bz), Material: "Wood", Color: WOOD }));
    kids.push(P("S_Board", { Size: [8, 3, 0.6], CFrame: cf(bx, 9, bz), Material: "Wood", Color: WOOD }));
    kids.push(P("S_Gem", { Shape: "Ball", Size: [1.6, 1.6, 1.6], CFrame: cf(bx, 11.5, bz), CanCollide: false, Material: "Neon", Color: col }, [light(col, 2, 12)]));
  } else if (v === 1) {
    // вежа
    kids.push(P("S_Base", { Size: [8, 6, 8], CFrame: cf(bx, 4, bz), Material: "Brick", Color: STONE }));
    kids.push(P("S_Mid", { Size: [6, 6, 6], CFrame: cf(bx, 10, bz), Material: "Brick", Color: STONE_D }));
    kids.push(P("S_Top", { Size: [4, 5, 4], CFrame: cf(bx, 15, bz), Material: "Brick", Color: STONE }));
    kids.push(P("S_Gem", { Shape: "Ball", Size: [2.5, 2.5, 2.5], CFrame: cf(bx, 19, bz), CanCollide: false, Material: "Neon", Color: col }, [light(col, 3, 16)]));
  } else if (v === 2) {
    // храм (колони + дах)
    const cs = [[-4, -4], [4, -4], [-4, 4], [4, 4]];
    for (let i = 0; i < cs.length; i++) {
      kids.push(P("S_Col" + i, { Shape: "Cylinder", Size: [10, 1.4, 1.4], CFrame: cfRotZ90(bx + cs[i][0], 5, bz + cs[i][1]), Material: "Marble", Color: PILLAR }));
    }
    kids.push(P("S_Roof", { Size: [12, 1.5, 12], CFrame: cf(bx, 10.5, bz), Material: "Marble", Color: STONE }));
    kids.push(P("S_Gem", { Shape: "Ball", Size: [2.5, 2.5, 2.5], CFrame: cf(bx, 13, bz), CanCollide: false, Material: "Neon", Color: col }, [light(col, 3, 16)]));
  } else {
    // святилище
    kids.push(P("S_Base", { Shape: "Cylinder", Size: [3, 12, 12], CFrame: cfRotZ90(bx, 2.5, bz), Material: "Marble", Color: STONE }));
    kids.push(P("S_Ring", { Shape: "Cylinder", Size: [1, 9, 9], CFrame: cfRotZ90(bx, 9, bz), CanCollide: false, Material: "Neon", Color: col }));
    kids.push(P("S_Gem", { Shape: "Ball", Size: [3.5, 3.5, 3.5], CFrame: cf(bx, 9, bz), CanCollide: false, Material: "Neon", Color: col, Transparency: 0.1 }, [light(col, 4, 20)]));
  }
  return part("Folder", "Structure_" + index, {}, kids);
}

// ===== Декор спавну =====
function buildSpawnDecor() {
  const kids = [];
  const R = 9;
  for (let i = 1; i <= 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const ox = Math.cos(a) * R, oz = Math.sin(a) * R;
    kids.push(P("Arch", { Size: [1.4, 15, 1.4], CFrame: cf(ox, 8, oz), Material: "Marble", Color: PILLAR }));
    kids.push(P("ArchTop", { Shape: "Ball", Size: [2, 2, 2], CFrame: cf(ox, 16, oz), CanCollide: false, Material: "Neon", Color: LAMP_LIGHT }, [light(LAMP_LIGHT, 2, 16)]));
  }
  kids.push(P("FloatCrystal", { Shape: "Ball", Size: [4.5, 4.5, 4.5], CFrame: cf(0, 15, 0), CanCollide: false, Material: "Neon", Color: SPAWN_CRYSTAL, Transparency: 0.1 }, [light(SPAWN_CRYSTAL, 4, 26)]));
  return part("Folder", "SpawnDecor", {}, kids);
}

// ===== Збираємо =====
const children = [];
ZONES.forEach((z, i) => children.push(buildZone(z, i + 1)));
ZONES.forEach((z, i) => children.push(buildPath(z, i + 1)));
ZONES.forEach((z, i) => children.push(buildStructure(z, i + 1)));

const lampSpots = [
  [-30, 30], [30, 30], [-50, -90], [50, -90], [-40, -150], [40, -150],
];
lampSpots.forEach((p, i) => children.push(buildLamp(p[0], p[1], i + 1)));

children.push(buildSpawnDecor());

children.push(part("SpawnLocation", "Spawn", {
  Size: [12, 1, 12], CFrame: cf(0, 1, 0), Anchored: true,
  Material: "Slate", Color: STONE,
}));

const scene = part("Folder", "AFK_Scene", {}, children);

const outDir = path.join(__dirname, "src", "workspace");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "AFK_Scene.model.json");
fs.writeFileSync(outFile, JSON.stringify(scene, null, 2));
console.log("Згенеровано:", outFile, "| об'єктів:", JSON.stringify(scene).match(/"className"/g).length);
