/*
  Генератор сцени для Rojo.
  Рахує всі деталі зон і пише src/workspace/AFK_Scene.model.json,
  щоб геометрія була справжніми об'єктами у Workspace (видно в едіторі).
  Запуск:  node generate_scene.js
  Зони мають збігатися з src/shared/GameConfig.lua
*/

const fs = require("fs");
const path = require("path");

// колір RGB -> [r,g,b] 0..1
const C = (r, g, b) => [round(r / 255), round(g / 255), round(b / 255)];
const round = (n) => Math.round(n * 1000) / 1000;

// CFrame як масив Rojo: позиція + матриця обертання 3x3 (рядки)
const cfIdentity = (x, y, z) => [x, y, z, 1, 0, 0, 0, 1, 0, 0, 0, 1];
// обертання на 90° навколо Z (для циліндрів-дисків)
const cfRotZ90 = (x, y, z) => [x, y, z, 0, -1, 0, 1, 0, 0, 0, 0, 1];

// ЗОНИ (синхронно з GameConfig.lua)
const ZONES = [
  { name: "Старт",        pos: [0, 1, -40],   radius: 10, color: [70, 255, 160] },
  { name: "Срібна зона",  pos: [48, 1, -40],  radius: 10, color: [150, 200, 255] },
  { name: "Золота зона",  pos: [-48, 1, -40], radius: 10, color: [255, 205, 70] },
  { name: "Алмазна зона", pos: [0, 1, -98],   radius: 12, color: [120, 255, 240] },
];

const DARK_PAD = C(30, 35, 45);
const PILLAR = C(40, 45, 58);
const SPAWN = C(55, 60, 75);

function part(className, name, props, children) {
  return { className, name, properties: props, ...(children ? { children } : {}) };
}

function buildZone(zone, index) {
  const [px, py, pz] = zone.pos;
  const R = zone.radius;
  const col = C(...zone.color);
  const kids = [];

  // платформа
  kids.push(part("Part", "Pad", {
    Shape: "Cylinder",
    Size: [1, R * 2, R * 2],
    CFrame: cfRotZ90(px, py, pz),
    Anchored: true,
    Material: "SmoothPlastic",
    Color: DARK_PAD,
  }));

  // неоновий обідок
  kids.push(part("Part", "Ring", {
    Shape: "Cylinder",
    Size: [0.6, R * 2 + 1.2, R * 2 + 1.2],
    CFrame: cfRotZ90(px, py, pz),
    Anchored: true,
    CanCollide: false,
    Material: "Neon",
    Color: col,
  }));

  // світіння
  kids.push(part("Part", "Glow", {
    Shape: "Cylinder",
    Size: [1.1, R * 1.4, R * 1.4],
    CFrame: cfRotZ90(px, py + 0.05, pz),
    Anchored: true,
    CanCollide: false,
    Material: "Neon",
    Color: col,
    Transparency: 0.6,
  }));

  // колони з кристалами
  const PILLARS = 6;
  for (let i = 1; i <= PILLARS; i++) {
    const a = (i / PILLARS) * Math.PI * 2;
    const ox = Math.cos(a) * (R + 2);
    const oz = Math.sin(a) * (R + 2);
    kids.push(part("Part", "Pillar", {
      Size: [1.5, 9, 1.5],
      CFrame: cfIdentity(px + ox, py + 4.5, pz + oz),
      Anchored: true,
      Material: "SmoothPlastic",
      Color: PILLAR,
    }));
    kids.push(part("Part", "PillarTop", {
      Shape: "Ball",
      Size: [2, 2, 2],
      CFrame: cfIdentity(px + ox, py + 9.5, pz + oz),
      Anchored: true,
      CanCollide: false,
      Material: "Neon",
      Color: col,
    }));
  }

  // центральний кристал + світло
  kids.push(part("Part", "Crystal", {
    Shape: "Ball",
    Size: [4, 4, 4],
    CFrame: cfIdentity(px, py + 8, pz),
    Anchored: true,
    CanCollide: false,
    Material: "Neon",
    Color: col,
    Transparency: 0.15,
  }, [
    part("PointLight", "Light", {
      Color: col,
      Brightness: 5,
      Range: 32,
    }),
  ]));

  return part("Folder", "Zone_" + index, {}, kids);
}

// ===== збираємо сцену =====
const children = ZONES.map((z, i) => buildZone(z, i + 1));

// точка спавну
children.push(part("SpawnLocation", "Spawn", {
  Size: [10, 1, 10],
  CFrame: cfIdentity(0, 1, 0),
  Anchored: true,
  Material: "SmoothPlastic",
  Color: SPAWN,
}));

const scene = part("Folder", "AFK_Scene", {}, children);

const outDir = path.join(__dirname, "src", "workspace");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "AFK_Scene.model.json");
fs.writeFileSync(outFile, JSON.stringify(scene, null, 2));
console.log("Згенеровано:", outFile);
console.log("Зон:", ZONES.length, "| деталей у сцені:", JSON.stringify(scene).match(/"className"/g).length);
