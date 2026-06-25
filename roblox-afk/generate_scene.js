/*
  Генератор сцени для Rojo.
  Рахує всю геометрію (зони + декор підлога/доріжки/ліхтарі/острови)
  і пише src/workspace/AFK_Scene.model.json — справжні об'єкти у Workspace.
  Запуск:  node generate_scene.js
  Зони мають збігатися з src/shared/GameConfig.lua
*/

const fs = require("fs");
const path = require("path");

const round = (n) => Math.round(n * 1000) / 1000;
const C = (r, g, b) => [round(r / 255), round(g / 255), round(b / 255)];

// CFrame як масив Rojo: позиція + матриця обертання 3x3 (рядки)
const cf = (x, y, z) => [x, y, z, 1, 0, 0, 0, 1, 0, 0, 0, 1];
const cfRotZ90 = (x, y, z) => [x, y, z, 0, -1, 0, 1, 0, 0, 0, 0, 1]; // циліндр-диск/стовп
// поворот навколо Y (для доріжок під кутом)
const cfYaw = (x, y, z, a) => {
  const c = Math.cos(a), s = Math.sin(a);
  return [x, y, z, c, 0, s, 0, 1, 0, -s, 0, c];
};

// ===== Кольори =====
const ACCENT = C(170, 95, 255);   // фіолетовий неон — глобальний декор
const FLOOR = C(28, 31, 42);
const FLOOR2 = C(20, 22, 30);
const DARK_PAD = C(30, 35, 45);
const PILLAR = C(40, 45, 58);
const SPAWN = C(60, 200, 255);

// ЗОНИ (синхронно з GameConfig.lua)
const ZONES = [
  { name: "Старт",        pos: [0, 1, -40],   radius: 10, color: [70, 255, 160] },
  { name: "Срібна зона",  pos: [48, 1, -40],  radius: 10, color: [150, 200, 255] },
  { name: "Золота зона",  pos: [-48, 1, -40], radius: 10, color: [255, 205, 70] },
  { name: "Алмазна зона", pos: [0, 1, -98],   radius: 12, color: [120, 255, 240] },
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

// ===== Зона =====
function buildZone(zone, index) {
  const [px, py, pz] = zone.pos;
  const R = zone.radius;
  const col = C(...zone.color);
  const kids = [];

  kids.push(P("Pad", {
    Shape: "Cylinder", Size: [1, R * 2, R * 2], CFrame: cfRotZ90(px, py, pz),
    Material: "SmoothPlastic", Color: DARK_PAD,
  }));
  kids.push(P("Ring", {
    Shape: "Cylinder", Size: [0.6, R * 2 + 1.2, R * 2 + 1.2], CFrame: cfRotZ90(px, py, pz),
    CanCollide: false, Material: "Neon", Color: col,
  }));
  kids.push(P("Glow", {
    Shape: "Cylinder", Size: [1.1, R * 1.4, R * 1.4], CFrame: cfRotZ90(px, py + 0.05, pz),
    CanCollide: false, Material: "Neon", Color: col, Transparency: 0.6,
  }));

  const PILLARS = 6;
  for (let i = 1; i <= PILLARS; i++) {
    const a = (i / PILLARS) * Math.PI * 2;
    const ox = Math.cos(a) * (R + 2), oz = Math.sin(a) * (R + 2);
    kids.push(P("Pillar", {
      Size: [1.5, 9, 1.5], CFrame: cf(px + ox, py + 4.5, pz + oz),
      Material: "SmoothPlastic", Color: PILLAR,
    }));
    kids.push(P("PillarTop", {
      Shape: "Ball", Size: [2, 2, 2], CFrame: cf(px + ox, py + 9.5, pz + oz),
      CanCollide: false, Material: "Neon", Color: col,
    }));
  }

  kids.push(P("Crystal", {
    Shape: "Ball", Size: [4, 4, 4], CFrame: cf(px, py + 8, pz),
    CanCollide: false, Material: "Neon", Color: col, Transparency: 0.15,
  }, [light(col, 5, 32)]));

  return part("Folder", "Zone_" + index, {}, kids);
}

// ===== Підлога з неоновою рамкою =====
function buildFloor() {
  const kids = [];
  const cx = 0, cz = -52, W = 190, D = 175;

  kids.push(P("FloorBase", {
    Size: [W, 1, D], CFrame: cf(cx, 0, cz),
    Material: "Slate", Color: FLOOR,
  }));
  // внутрішня темніша вставка для глибини
  kids.push(P("FloorInlay", {
    Size: [W - 14, 1.05, D - 14], CFrame: cf(cx, 0, cz),
    Material: "SmoothPlastic", Color: FLOOR2, CanCollide: false,
  }));

  // неонова рамка по периметру
  const hx = W / 2, hz = D / 2;
  const trims = [
    { s: [W + 4, 1.4, 4], p: [cx, 0.6, cz + hz] },
    { s: [W + 4, 1.4, 4], p: [cx, 0.6, cz - hz] },
    { s: [4, 1.4, D + 4], p: [cx + hx, 0.6, cz] },
    { s: [4, 1.4, D + 4], p: [cx - hx, 0.6, cz] },
  ];
  for (const t of trims) {
    kids.push(P("Trim", {
      Size: t.s, CFrame: cf(t.p[0], t.p[1], t.p[2]),
      Material: "Neon", Color: ACCENT, CanCollide: false,
    }));
  }
  return part("Folder", "Floor", {}, kids);
}

// ===== Доріжка від спавну до зони =====
function buildPath(zone, index) {
  const [zx, , zz] = zone.pos;
  const ax = 0, az = 0;          // старт біля спавну
  const dx = zx - ax, dz = zz - az;
  const dist = Math.sqrt(dx * dx + dz * dz);
  const ang = Math.atan2(dx, dz); // локальна +Z дивиться на зону
  const mx = (ax + zx) / 2, mz = (az + zz) / 2;
  const kids = [];

  kids.push(P("PathBase", {
    Size: [8, 0.4, dist], CFrame: cfYaw(mx, 0.7, mz, ang),
    Material: "SmoothPlastic", Color: PILLAR, CanCollide: false,
  }));
  kids.push(P("PathLine", {
    Size: [1.4, 0.45, dist], CFrame: cfYaw(mx, 0.72, mz, ang),
    Material: "Neon", Color: ACCENT, CanCollide: false,
  }));
  return part("Folder", "Path_" + index, {}, kids);
}

// ===== Ліхтар =====
function buildLamp(x, z, n) {
  const kids = [];
  kids.push(P("Post", {
    Shape: "Cylinder", Size: [13, 1.1, 1.1], CFrame: cfRotZ90(x, 6.5, z),
    Material: "Metal", Color: PILLAR,
  }));
  kids.push(P("Bulb", {
    Shape: "Ball", Size: [2.6, 2.6, 2.6], CFrame: cf(x, 13.4, z),
    CanCollide: false, Material: "Neon", Color: ACCENT,
  }, [light(ACCENT, 4, 26)]));
  return part("Folder", "Lamp_" + n, {}, kids);
}

// ===== Літаючий декоративний острів =====
function buildIsland(x, y, z, rgb, scale, n) {
  const col = C(...rgb);
  const kids = [];
  kids.push(P("IslandTop", {
    Shape: "Cylinder", Size: [2, 14 * scale, 14 * scale], CFrame: cfRotZ90(x, y, z),
    Material: "Slate", Color: FLOOR,
  }));
  kids.push(P("IslandRing", {
    Shape: "Cylinder", Size: [1.2, 15 * scale, 15 * scale], CFrame: cfRotZ90(x, y + 0.4, z),
    CanCollide: false, Material: "Neon", Color: col,
  }));
  // звужений низ
  kids.push(P("IslandBottom", {
    Shape: "Ball", Size: [10 * scale, 12 * scale, 10 * scale], CFrame: cf(x, y - 6 * scale, z),
    CanCollide: false, Material: "Slate", Color: FLOOR2,
  }));
  kids.push(P("FloatCrystal", {
    Shape: "Ball", Size: [4 * scale, 4 * scale, 4 * scale], CFrame: cf(x, y + 7 * scale, z),
    CanCollide: false, Material: "Neon", Color: col, Transparency: 0.1,
  }, [light(col, 4, 28)]));
  return part("Folder", "Island_" + n, {}, kids);
}

// ===== Декор спавну: кільце колон + великий кристал =====
function buildSpawnDecor() {
  const kids = [];
  const R = 9;
  for (let i = 1; i <= 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const ox = Math.cos(a) * R, oz = Math.sin(a) * R;
    kids.push(P("Arch", {
      Size: [1.6, 16, 1.6], CFrame: cf(ox, 8.5, oz),
      Material: "Metal", Color: PILLAR,
    }));
    kids.push(P("ArchTop", {
      Shape: "Ball", Size: [2.4, 2.4, 2.4], CFrame: cf(ox, 17, oz),
      CanCollide: false, Material: "Neon", Color: ACCENT,
    }, [light(ACCENT, 3, 18)]));
  }
  kids.push(P("FloatCrystal", {
    Shape: "Ball", Size: [5, 5, 5], CFrame: cf(0, 16, 0),
    CanCollide: false, Material: "Neon", Color: SPAWN, Transparency: 0.1,
  }, [light(SPAWN, 6, 30)]));
  return part("Folder", "SpawnDecor", {}, kids);
}

// ===== Збираємо сцену =====
const children = [];

children.push(buildFloor());

ZONES.forEach((z, i) => children.push(buildZone(z, i + 1)));
ZONES.forEach((z, i) => children.push(buildPath(z, i + 1)));

// ліхтарі по периметру підлоги
const lampSpots = [
  [-82, 28], [82, 28], [-82, -132], [82, -132],
  [-82, -52], [82, -52], [-30, 30], [30, 30],
];
lampSpots.forEach((p, i) => children.push(buildLamp(p[0], p[1], i + 1)));

// літаючі острови на фоні (для глибини й краси)
children.push(buildIsland(130, 24, -30, [255, 120, 200], 1.3, 1));
children.push(buildIsland(-130, 34, -90, [120, 255, 200], 1.1, 2));
children.push(buildIsland(70, 46, -165, [255, 210, 90], 1.0, 3));
children.push(buildIsland(-95, 20, 30, [120, 200, 255], 0.9, 4));

children.push(buildSpawnDecor());

// точка спавну
children.push(part("SpawnLocation", "Spawn", {
  Size: [12, 1, 12], CFrame: cf(0, 1, 0), Anchored: true,
  Material: "Metal", Color: C(70, 75, 95),
}));

const scene = part("Folder", "AFK_Scene", {}, children);

const outDir = path.join(__dirname, "src", "workspace");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "AFK_Scene.model.json");
fs.writeFileSync(outFile, JSON.stringify(scene, null, 2));
const count = JSON.stringify(scene).match(/"className"/g).length;
console.log("Згенеровано:", outFile, "| об'єктів:", count);
