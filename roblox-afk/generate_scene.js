/*
  Генератор сцени для Rojo (чистий, не-неоновий вигляд).
  Реалістичні матеріали: бетон/метал/мармур; світяться лише кристали й ліхтарі.
  Запуск:  node generate_scene.js  (зони мають збігатися з GameConfig.lua)
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

// ===== Палітра (спокійна, реалістична) =====
const FLOOR = C(84, 88, 98);
const FLOOR2 = C(66, 70, 80);
const TRIM = C(120, 126, 142);
const DARK_PAD = C(52, 56, 66);
const PILLAR = C(78, 83, 96);
const LAMP_LIGHT = C(255, 240, 210); // тепле світло ліхтарів
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

// ===== Зона (платформа + металеве кільце + кристал) =====
function buildZone(zone, index) {
  const [px, py, pz] = zone.pos;
  const R = zone.radius;
  const col = C(...zone.color);
  const kids = [];

  // платформа
  kids.push(P("Pad", {
    Shape: "Cylinder", Size: [1, R * 2, R * 2], CFrame: cfRotZ90(px, py, pz),
    Material: "Marble", Color: DARK_PAD,
  }));
  // кольорове кільце (метал, без неону)
  kids.push(P("Ring", {
    Shape: "Cylinder", Size: [0.8, R * 2 + 1, R * 2 + 1], CFrame: cfRotZ90(px, py + 0.1, pz),
    CanCollide: false, Material: "Metal", Color: col,
  }));

  // колони
  const PILLARS = 6;
  for (let i = 1; i <= PILLARS; i++) {
    const a = (i / PILLARS) * Math.PI * 2;
    const ox = Math.cos(a) * (R + 2), oz = Math.sin(a) * (R + 2);
    kids.push(P("Pillar", {
      Size: [1.4, 8, 1.4], CFrame: cf(px + ox, py + 4, pz + oz),
      Material: "Metal", Color: PILLAR,
    }));
    kids.push(P("PillarTop", {
      Shape: "Ball", Size: [1.5, 1.5, 1.5], CFrame: cf(px + ox, py + 8.6, pz + oz),
      CanCollide: false, Material: "Neon", Color: col,
    }));
  }

  // кристал — єдиний світний акцент
  kids.push(P("Crystal", {
    Shape: "Ball", Size: [4, 4, 4], CFrame: cf(px, py + 8, pz),
    CanCollide: false, Material: "Neon", Color: col, Transparency: 0.1,
  }, [light(col, 3, 20)]));

  return part("Folder", "Zone_" + index, {}, kids);
}

// ===== Підлога (бетон + металева рамка) =====
function buildFloor() {
  const kids = [];
  const cx = 0, cz = -58, W = 210, D = 185;

  kids.push(P("FloorBase", {
    Size: [W, 1, D], CFrame: cf(cx, 0, cz), Material: "Concrete", Color: FLOOR,
  }));
  kids.push(P("FloorInlay", {
    Size: [W - 16, 1.05, D - 16], CFrame: cf(cx, 0, cz),
    Material: "Marble", Color: FLOOR2, CanCollide: false,
  }));

  const hx = W / 2, hz = D / 2;
  const trims = [
    { s: [W + 4, 2.2, 4], p: [cx, 1, cz + hz] },
    { s: [W + 4, 2.2, 4], p: [cx, 1, cz - hz] },
    { s: [4, 2.2, D + 4], p: [cx + hx, 1, cz] },
    { s: [4, 2.2, D + 4], p: [cx - hx, 1, cz] },
  ];
  for (const t of trims) {
    kids.push(P("Trim", {
      Size: t.s, CFrame: cf(t.p[0], t.p[1], t.p[2]), Material: "Metal", Color: TRIM,
    }));
  }
  // невисокі перила-стовпчики по краю
  return part("Folder", "Floor", {}, kids);
}

// ===== Доріжка =====
function buildPath(zone, index) {
  const [zx, , zz] = zone.pos;
  const dx = zx, dz = zz;
  const dist = Math.sqrt(dx * dx + dz * dz);
  const ang = Math.atan2(dx, dz);
  const mx = zx / 2, mz = zz / 2;
  const kids = [];
  kids.push(P("PathBase", {
    Size: [8, 0.4, dist], CFrame: cfYaw(mx, 0.7, mz, ang),
    Material: "Slate", Color: FLOOR2, CanCollide: false,
  }));
  kids.push(P("PathLine", {
    Size: [1.2, 0.45, dist], CFrame: cfYaw(mx, 0.72, mz, ang),
    Material: "Metal", Color: TRIM, CanCollide: false,
  }));
  return part("Folder", "Path_" + index, {}, kids);
}

// ===== Ліхтар (тепле світло) =====
function buildLamp(x, z, n) {
  const kids = [];
  kids.push(P("Post", {
    Shape: "Cylinder", Size: [13, 0.9, 0.9], CFrame: cfRotZ90(x, 6.5, z),
    Material: "Metal", Color: PILLAR,
  }));
  kids.push(P("Bulb", {
    Shape: "Ball", Size: [2, 2, 2], CFrame: cf(x, 13.2, z),
    CanCollide: false, Material: "Neon", Color: LAMP_LIGHT,
  }, [light(LAMP_LIGHT, 2.5, 22)]));
  return part("Folder", "Lamp_" + n, {}, kids);
}

// ===== Літаючий острів (камінь + кристал) =====
function buildIsland(x, y, z, rgb, scale, n) {
  const col = C(...rgb);
  const kids = [];
  kids.push(P("IslandTop", {
    Shape: "Cylinder", Size: [2, 14 * scale, 14 * scale], CFrame: cfRotZ90(x, y, z),
    Material: "Slate", Color: FLOOR2,
  }));
  kids.push(P("IslandRing", {
    Shape: "Cylinder", Size: [1.4, 15 * scale, 15 * scale], CFrame: cfRotZ90(x, y + 0.4, z),
    CanCollide: false, Material: "Metal", Color: col,
  }));
  kids.push(P("IslandBottom", {
    Shape: "Ball", Size: [10 * scale, 12 * scale, 10 * scale], CFrame: cf(x, y - 6 * scale, z),
    CanCollide: false, Material: "Rock", Color: FLOOR2,
  }));
  kids.push(P("FloatCrystal", {
    Shape: "Ball", Size: [3.5 * scale, 3.5 * scale, 3.5 * scale], CFrame: cf(x, y + 7 * scale, z),
    CanCollide: false, Material: "Neon", Color: col, Transparency: 0.1,
  }, [light(col, 2.5, 20)]));
  return part("Folder", "Island_" + n, {}, kids);
}

// ===== Декор спавну =====
function buildSpawnDecor() {
  const kids = [];
  const R = 9;
  for (let i = 1; i <= 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const ox = Math.cos(a) * R, oz = Math.sin(a) * R;
    kids.push(P("Arch", {
      Size: [1.4, 15, 1.4], CFrame: cf(ox, 8, oz), Material: "Metal", Color: PILLAR,
    }));
    kids.push(P("ArchTop", {
      Shape: "Ball", Size: [2, 2, 2], CFrame: cf(ox, 16, oz),
      CanCollide: false, Material: "Neon", Color: LAMP_LIGHT,
    }, [light(LAMP_LIGHT, 2, 16)]));
  }
  kids.push(P("FloatCrystal", {
    Shape: "Ball", Size: [4.5, 4.5, 4.5], CFrame: cf(0, 15, 0),
    CanCollide: false, Material: "Neon", Color: SPAWN_CRYSTAL, Transparency: 0.1,
  }, [light(SPAWN_CRYSTAL, 4, 26)]));
  return part("Folder", "SpawnDecor", {}, kids);
}

// ===== Збираємо сцену =====
const children = [];
children.push(buildFloor());
ZONES.forEach((z, i) => children.push(buildZone(z, i + 1)));
ZONES.forEach((z, i) => children.push(buildPath(z, i + 1)));

const lampSpots = [
  [-95, 28], [95, 28], [-95, -148], [95, -148],
  [-95, -60], [95, -60], [-35, 32], [35, 32],
];
lampSpots.forEach((p, i) => children.push(buildLamp(p[0], p[1], i + 1)));

children.push(buildIsland(145, 24, -40, [255, 150, 210], 1.3, 1));
children.push(buildIsland(-145, 34, -95, [150, 255, 210], 1.1, 2));
children.push(buildIsland(85, 46, -180, [255, 220, 130], 1.0, 3));
children.push(buildIsland(-125, 20, 45, [150, 210, 255], 0.9, 4));

children.push(buildSpawnDecor());

children.push(part("SpawnLocation", "Spawn", {
  Size: [12, 1, 12], CFrame: cf(0, 1, 0), Anchored: true,
  Material: "Metal", Color: C(80, 85, 100),
}));

const scene = part("Folder", "AFK_Scene", {}, children);

const outDir = path.join(__dirname, "src", "workspace");
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, "AFK_Scene.model.json");
fs.writeFileSync(outFile, JSON.stringify(scene, null, 2));
console.log("Згенеровано:", outFile, "| об'єктів:", JSON.stringify(scene).match(/"className"/g).length);
