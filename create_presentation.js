const pptxgen = require("pptxgenjs");
const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.title = 'EduTest Pro — Захист дипломної роботи';
pres.author = 'Гебрин Андрій';

// Palette (no # prefix!)
const BLK = '111111';
const DRK = '2A2A2A';
const MED = '555555';
const GRY = '999999';
const LGT = 'DDDDDD';
const OFW = 'F4F4F4';
const WHT = 'FFFFFF';

// ================================================================
// SLIDE 1 — TITLE (dark)
// ================================================================
{
  const s = pres.addSlide();
  s.background = { color: BLK };

  // Vertical accent bar
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.45, h: 5.625,
    fill: { color: DRK }, line: { color: DRK }
  });

  // Top label
  s.addText("ДИПЛОМНА РОБОТА  •  2026", {
    x: 0.7, y: 0.38, w: 8.8, h: 0.28,
    fontSize: 10, fontFace: "Calibri", bold: true,
    color: MED, charSpacing: 4, align: "left", margin: 0
  });

  // Main title
  s.addText("EduTest Pro", {
    x: 0.7, y: 0.95, w: 9, h: 1.55,
    fontSize: 64, fontFace: "Georgia", bold: true,
    color: WHT, align: "left", margin: 0
  });

  // Subtitle
  s.addText("Веб-платформа інтерактивного тестування", {
    x: 0.7, y: 2.6, w: 8.5, h: 0.5,
    fontSize: 20, fontFace: "Calibri",
    color: GRY, align: "left", margin: 0
  });

  // Divider
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.7, y: 3.3, w: 4.8, h: 0.04,
    fill: { color: DRK }, line: { color: DRK }
  });

  // Author row
  s.addText("Студент:", {
    x: 0.7, y: 3.52, w: 1.4, h: 0.3,
    fontSize: 12, fontFace: "Calibri", color: GRY, margin: 0
  });
  s.addText("Гебрин Андрій", {
    x: 2.0, y: 3.52, w: 4, h: 0.3,
    fontSize: 12, fontFace: "Calibri", bold: true, color: WHT, margin: 0
  });

  // College row
  s.addText("Заклад:", {
    x: 0.7, y: 3.9, w: 1.4, h: 0.3,
    fontSize: 11, fontFace: "Calibri", color: GRY, margin: 0
  });
  s.addText("Кам'янець-Подільський фаховий коледж індустрії", {
    x: 2.0, y: 3.9, w: 7.5, h: 0.3,
    fontSize: 11, fontFace: "Calibri", bold: true, color: LGT, margin: 0
  });

  // Bottom-right corner decoration
  s.addShape(pres.shapes.RECTANGLE, {
    x: 9.55, y: 4.5, w: 0.45, h: 1.125,
    fill: { color: DRK }, line: { color: DRK }
  });
}

// ================================================================
// SLIDE 2 — АКТУАЛЬНІСТЬ ТА МЕТА (light)
// ================================================================
{
  const s = pres.addSlide();
  s.background = { color: WHT };

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.07,
    fill: { color: BLK }, line: { color: BLK }
  });
  s.addText("02", {
    x: 9.15, y: 0.18, w: 0.65, h: 0.28,
    fontSize: 11, fontFace: "Calibri", bold: true, color: LGT, align: "right", margin: 0
  });
  s.addText("Актуальність та мета", {
    x: 0.5, y: 0.18, w: 8, h: 0.68,
    fontSize: 34, fontFace: "Georgia", bold: true, color: BLK, align: "left", margin: 0
  });

  // Left: Problem box
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.4, y: 1.1, w: 4.3, h: 3.85,
    fill: { color: OFW }, line: { color: LGT }
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.4, y: 1.1, w: 4.3, h: 0.07,
    fill: { color: BLK }, line: { color: BLK }
  });
  s.addText("ПРОБЛЕМА", {
    x: 0.65, y: 1.28, w: 4.0, h: 0.3,
    fontSize: 10, fontFace: "Calibri", bold: true, color: MED, charSpacing: 3, margin: 0
  });
  s.addText("Відсутність власного інструменту для онлайн-тестування у коледжі", {
    x: 0.65, y: 1.65, w: 3.85, h: 1.05,
    fontSize: 17, fontFace: "Georgia", bold: true, color: BLK, margin: 0
  });
  const problems = [
    "Використання незручних сторонніх платформ",
    "Відсутність системи груп та кодів доступу",
    "Немає централізованої статистики результатів"
  ];
  problems.forEach((p, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.65, y: 2.85 + i * 0.64, w: 0.07, h: 0.32,
      fill: { color: BLK }, line: { color: BLK }
    });
    s.addText(p, {
      x: 0.86, y: 2.85 + i * 0.64, w: 3.65, h: 0.35,
      fontSize: 12, fontFace: "Calibri", color: DRK, valign: "middle", margin: 0
    });
  });

  // Right: Goal + Tasks
  s.addText("МЕТА", {
    x: 5.1, y: 1.1, w: 4.5, h: 0.3,
    fontSize: 10, fontFace: "Calibri", bold: true, color: MED, charSpacing: 3, margin: 0
  });
  s.addText("Розробити веб-платформу EduTest Pro для автоматизованого контролю знань студентів коледжу", {
    x: 5.1, y: 1.48, w: 4.5, h: 1.05,
    fontSize: 14, fontFace: "Calibri", color: BLK, margin: 0
  });

  s.addShape(pres.shapes.RECTANGLE, {
    x: 5.1, y: 2.63, w: 4.5, h: 0.04,
    fill: { color: LGT }, line: { color: LGT }
  });

  s.addText("ЗАВДАННЯ", {
    x: 5.1, y: 2.78, w: 4.5, h: 0.3,
    fontSize: 10, fontFace: "Calibri", bold: true, color: MED, charSpacing: 3, margin: 0
  });

  const tasks = [
    "Проектування UI/UX та структури бази даних",
    "Реалізація авторизації та ролей (студент / викладач)",
    "Модуль тестування з таймером та статистикою",
    "Система груп та персональних кодів доступу"
  ];
  tasks.forEach((t, i) => {
    s.addShape(pres.shapes.OVAL, {
      x: 5.1, y: 3.18 + i * 0.58, w: 0.32, h: 0.32,
      fill: { color: BLK }, line: { color: BLK }
    });
    s.addText(String(i + 1), {
      x: 5.1, y: 3.18 + i * 0.58, w: 0.32, h: 0.32,
      fontSize: 11, fontFace: "Calibri", bold: true,
      color: WHT, align: "center", valign: "middle", margin: 0
    });
    s.addText(t, {
      x: 5.52, y: 3.2 + i * 0.58, w: 4.1, h: 0.32,
      fontSize: 12, fontFace: "Calibri", color: DRK, valign: "middle", margin: 0
    });
  });
}

// ================================================================
// SLIDE 3 — ТЕХНІЧНИЙ СТЕК (light)
// ================================================================
{
  const s = pres.addSlide();
  s.background = { color: WHT };

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.07,
    fill: { color: BLK }, line: { color: BLK }
  });
  s.addText("03", {
    x: 9.15, y: 0.18, w: 0.65, h: 0.28,
    fontSize: 11, fontFace: "Calibri", bold: true, color: LGT, align: "right", margin: 0
  });
  s.addText("Технічний стек", {
    x: 0.5, y: 0.18, w: 8, h: 0.68,
    fontSize: 34, fontFace: "Georgia", bold: true, color: BLK, align: "left", margin: 0
  });

  const techs = [
    {
      badge: "FRONTEND",
      title: "HTML / CSS / JS",
      sub: "Vanilla JavaScript  •  ES6+",
      bullets: [
        "Single Page Application — без фреймворків",
        "Адаптивний дизайн для мобільних пристроїв",
        "CSS Custom Properties — гнучка тема"
      ]
    },
    {
      badge: "BACKEND / БД",
      title: "Supabase",
      sub: "PostgreSQL  •  REST API",
      bullets: [
        "Хмарна СУБД без власного сервера",
        "Таблиці: users, tests, history, groups",
        "Realtime-підписки та безкоштовний план"
      ]
    },
    {
      badge: "ЗОВНІШНІ API",
      title: "Web3Forms",
      sub: "Email API",
      bullets: [
        "Форма підтримки без backend",
        "Надсилання листів на email викладача",
        "Захист від спаму та підтвердження доставки"
      ]
    }
  ];

  techs.forEach((tech, i) => {
    const x = 0.45 + i * 3.12;

    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.1, w: 2.95, h: 4.1,
      fill: { color: OFW }, line: { color: LGT }
    });
    // Top accent
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.1, w: 2.95, h: 0.07,
      fill: { color: BLK }, line: { color: BLK }
    });
    // Badge
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.2, y: 1.3, w: 1.3, h: 0.28,
      fill: { color: BLK }, line: { color: BLK }
    });
    s.addText(tech.badge, {
      x: x + 0.2, y: 1.3, w: 1.3, h: 0.28,
      fontSize: 8, fontFace: "Calibri", bold: true,
      color: WHT, align: "center", valign: "middle", charSpacing: 2, margin: 0
    });
    // Title
    s.addText(tech.title, {
      x: x + 0.2, y: 1.72, w: 2.6, h: 0.55,
      fontSize: 21, fontFace: "Georgia", bold: true, color: BLK, margin: 0
    });
    // Sub
    s.addText(tech.sub, {
      x: x + 0.2, y: 2.32, w: 2.6, h: 0.28,
      fontSize: 11, fontFace: "Calibri", bold: true, color: MED, margin: 0
    });
    // Divider
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.2, y: 2.68, w: 2.55, h: 0.04,
      fill: { color: LGT }, line: { color: LGT }
    });
    // Bullets
    tech.bullets.forEach((b, j) => {
      s.addShape(pres.shapes.OVAL, {
        x: x + 0.2, y: 2.88 + j * 0.62, w: 0.14, h: 0.14,
        fill: { color: BLK }, line: { color: BLK }
      });
      s.addText(b, {
        x: x + 0.44, y: 2.82 + j * 0.62, w: 2.35, h: 0.38,
        fontSize: 12, fontFace: "Calibri", color: DRK, valign: "middle", margin: 0
      });
    });
  });
}

// ================================================================
// SLIDE 4 — АРХІТЕКТУРА СИСТЕМИ (dark)
// ================================================================
{
  const s = pres.addSlide();
  s.background = { color: BLK };

  s.addText("04", {
    x: 9.15, y: 0.18, w: 0.65, h: 0.28,
    fontSize: 11, fontFace: "Calibri", bold: true, color: DRK, align: "right", margin: 0
  });
  s.addText("Архітектура системи", {
    x: 0.5, y: 0.18, w: 8, h: 0.68,
    fontSize: 34, fontFace: "Georgia", bold: true, color: WHT, align: "left", margin: 0
  });

  // Flow boxes
  const flow = [
    { label: "Браузер", sub: "Клієнт" },
    { label: "JavaScript\nSPA", sub: "app.js" },
    { label: "Supabase\nAPI", sub: "REST / Realtime" },
    { label: "PostgreSQL", sub: "База даних" }
  ];

  flow.forEach((item, i) => {
    const x = 0.5 + i * 2.38;

    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.35, w: 1.95, h: 1.2,
      fill: { color: DRK }, line: { color: MED }
    });
    s.addText(item.label, {
      x, y: 1.38, w: 1.95, h: 0.8,
      fontSize: 14, fontFace: "Calibri", bold: true,
      color: WHT, align: "center", valign: "middle", margin: 0
    });
    s.addText(item.sub, {
      x, y: 2.22, w: 1.95, h: 0.28,
      fontSize: 10, fontFace: "Calibri", color: GRY, align: "center", margin: 0
    });

    // Arrow
    if (i < 3) {
      s.addShape(pres.shapes.RECTANGLE, {
        x: x + 1.95, y: 1.93, w: 0.38, h: 0.04,
        fill: { color: MED }, line: { color: MED }
      });
      // Arrow head triangle (small rect rotated — use two shapes)
      s.addShape(pres.shapes.RECTANGLE, {
        x: x + 2.29, y: 1.87, w: 0.04, h: 0.16,
        fill: { color: MED }, line: { color: MED }
      });
    }
  });

  // DB Tables
  s.addText("ТАБЛИЦІ БАЗИ ДАНИХ", {
    x: 0.5, y: 2.85, w: 9, h: 0.3,
    fontSize: 10, fontFace: "Calibri", bold: true, color: GRY, charSpacing: 3, margin: 0
  });

  const tables = [
    { name: "users",   desc: "id, name, email, role, password, avatar" },
    { name: "tests",   desc: "id, title, questions, join_code, time_limit, author_id" },
    { name: "history", desc: "user_id, test_id, score, percentage, date, group_name" },
    { name: "groups",  desc: "test_id, group_name, join_code, teacher_id" }
  ];

  tables.forEach((tbl, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 0.5 + col * 4.8;
    const y = 3.28 + row * 0.72;

    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 1.0, h: 0.34,
      fill: { color: DRK }, line: { color: MED }
    });
    s.addText(tbl.name, {
      x, y, w: 1.0, h: 0.34,
      fontSize: 11, fontFace: "Calibri", bold: true,
      color: WHT, align: "center", valign: "middle", margin: 0
    });
    s.addText(tbl.desc, {
      x: x + 1.08, y: y + 0.03, w: 3.5, h: 0.3,
      fontSize: 10, fontFace: "Calibri", color: GRY, valign: "middle", margin: 0
    });
  });

  // Roles
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.15, w: 10, h: 0.475,
    fill: { color: DRK }, line: { color: DRK }
  });
  s.addText("Студент — перегляд, пошук та проходження тестів", {
    x: 0.5, y: 5.2, w: 4.5, h: 0.35,
    fontSize: 11, fontFace: "Calibri", color: LGT, valign: "middle", margin: 0
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 4.97, y: 5.28, w: 0.06, h: 0.2,
    fill: { color: MED }, line: { color: MED }
  });
  s.addText("Викладач — створення, редагування та статистика", {
    x: 5.15, y: 5.2, w: 4.5, h: 0.35,
    fontSize: 11, fontFace: "Calibri", color: LGT, valign: "middle", margin: 0
  });
}

// ================================================================
// SLIDE 5 — ФУНКЦІОНАЛ СТУДЕНТА (light)
// ================================================================
{
  const s = pres.addSlide();
  s.background = { color: WHT };

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.07,
    fill: { color: BLK }, line: { color: BLK }
  });
  s.addText("05", {
    x: 9.15, y: 0.18, w: 0.65, h: 0.28,
    fontSize: 11, fontFace: "Calibri", bold: true, color: LGT, align: "right", margin: 0
  });
  s.addText("Функціонал студента", {
    x: 0.5, y: 0.18, w: 8, h: 0.68,
    fontSize: 34, fontFace: "Georgia", bold: true, color: BLK, align: "left", margin: 0
  });

  // Left dark info panel
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.4, y: 1.1, w: 3.0, h: 4.1,
    fill: { color: BLK }, line: { color: BLK }
  });
  s.addText("РОЛЬ", {
    x: 0.65, y: 1.3, w: 2.6, h: 0.3,
    fontSize: 10, fontFace: "Calibri", bold: true, color: GRY, charSpacing: 3, margin: 0
  });
  s.addText("Студент", {
    x: 0.65, y: 1.68, w: 2.6, h: 0.65,
    fontSize: 32, fontFace: "Georgia", bold: true, color: WHT, margin: 0
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.65, y: 2.42, w: 2.6, h: 0.04,
    fill: { color: DRK }, line: { color: DRK }
  });
  s.addText("Доступ до публічних тестів та проходження за кодом. Бачить лише свою особисту статистику.", {
    x: 0.65, y: 2.56, w: 2.6, h: 1.5,
    fontSize: 12, fontFace: "Calibri", color: GRY, margin: 0
  });

  // Right: 2x3 feature grid
  const features = [
    { title: "Пошук тестів",    desc: "Пошук публічних тестів за назвою" },
    { title: "Код доступу",     desc: "Вхід за кодом тесту або навчальної групи" },
    { title: "Таймер",          desc: "Тест з обмеженням часу або без нього" },
    { title: "Типи питань",     desc: "Вибір варіантів або вільна текстова відповідь" },
    { title: "Результат",       desc: "Відсоток, бали та мотиваційний фідбек" },
    { title: "Моя історія",     desc: "Всі попередні результати з датами та балами" }
  ];

  features.forEach((f, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 3.68 + col * 3.05;
    const y = 1.1 + row * 1.37;

    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 2.85, h: 1.18,
      fill: { color: OFW }, line: { color: LGT }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.07, h: 1.18,
      fill: { color: BLK }, line: { color: BLK }
    });
    s.addText(f.title, {
      x: x + 0.2, y: y + 0.12, w: 2.58, h: 0.38,
      fontSize: 14, fontFace: "Calibri", bold: true, color: BLK, margin: 0
    });
    s.addText(f.desc, {
      x: x + 0.2, y: y + 0.55, w: 2.58, h: 0.52,
      fontSize: 12, fontFace: "Calibri", color: MED, margin: 0
    });
  });
}

// ================================================================
// SLIDE 6 — ФУНКЦІОНАЛ ВИКЛАДАЧА (light)
// ================================================================
{
  const s = pres.addSlide();
  s.background = { color: WHT };

  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 10, h: 0.07,
    fill: { color: BLK }, line: { color: BLK }
  });
  s.addText("06", {
    x: 9.15, y: 0.18, w: 0.65, h: 0.28,
    fontSize: 11, fontFace: "Calibri", bold: true, color: LGT, align: "right", margin: 0
  });
  s.addText("Функціонал викладача", {
    x: 0.5, y: 0.18, w: 8, h: 0.68,
    fontSize: 34, fontFace: "Georgia", bold: true, color: BLK, align: "left", margin: 0
  });

  // Left dark info panel
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.4, y: 1.1, w: 3.0, h: 4.1,
    fill: { color: BLK }, line: { color: BLK }
  });
  s.addText("РОЛЬ", {
    x: 0.65, y: 1.3, w: 2.6, h: 0.3,
    fontSize: 10, fontFace: "Calibri", bold: true, color: GRY, charSpacing: 3, margin: 0
  });
  s.addText("Викладач", {
    x: 0.65, y: 1.68, w: 2.6, h: 0.65,
    fontSize: 28, fontFace: "Georgia", bold: true, color: WHT, margin: 0
  });
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0.65, y: 2.42, w: 2.6, h: 0.04,
    fill: { color: DRK }, line: { color: DRK }
  });
  s.addText("Створює та редагує тести, керує навчальними групами та переглядає детальну статистику.", {
    x: 0.65, y: 2.56, w: 2.6, h: 1.5,
    fontSize: 12, fontFace: "Calibri", color: GRY, margin: 0
  });

  const features = [
    { title: "Конструктор тестів", desc: "Назва, опис, обкладинка, таймер" },
    { title: "Типи питань",        desc: "Один/кілька варіантів або вільна відповідь" },
    { title: "Зображення",         desc: "Обкладинка тесту та фото до кожного питання" },
    { title: "Код доступу",        desc: "Унікальний 6-символьний код для кожного тесту" },
    { title: "Групи студентів",    desc: "Відокремлені коди для кожної навчальної групи" },
    { title: "Статистика",         desc: "Результати студентів: бали, відсотки, дати" }
  ];

  features.forEach((f, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 3.68 + col * 3.05;
    const y = 1.1 + row * 1.37;

    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 2.85, h: 1.18,
      fill: { color: OFW }, line: { color: LGT }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 0.07, h: 1.18,
      fill: { color: BLK }, line: { color: BLK }
    });
    s.addText(f.title, {
      x: x + 0.2, y: y + 0.12, w: 2.58, h: 0.38,
      fontSize: 14, fontFace: "Calibri", bold: true, color: BLK, margin: 0
    });
    s.addText(f.desc, {
      x: x + 0.2, y: y + 0.55, w: 2.58, h: 0.52,
      fontSize: 12, fontFace: "Calibri", color: MED, margin: 0
    });
  });
}

// ================================================================
// SLIDE 7 — ДЕМОНСТРАЦІЯ (dark)
// ================================================================
{
  const s = pres.addSlide();
  s.background = { color: BLK };

  s.addText("07", {
    x: 9.15, y: 0.18, w: 0.65, h: 0.28,
    fontSize: 11, fontFace: "Calibri", bold: true, color: DRK, align: "right", margin: 0
  });
  s.addText("Інтерфейс платформи", {
    x: 0.5, y: 0.18, w: 8, h: 0.68,
    fontSize: 34, fontFace: "Georgia", bold: true, color: WHT, align: "left", margin: 0
  });

  const screens = [
    { label: "Головна сторінка", sub: "Каталог тестів з пошуком" },
    { label: "Проходження тесту", sub: "Таймер + питання + варіанти" },
    { label: "Конструктор тестів", sub: "Інтерфейс викладача" }
  ];

  screens.forEach((sc, i) => {
    const x = 0.4 + i * 3.15;

    // Browser window frame
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.05, w: 2.92, h: 3.75,
      fill: { color: DRK }, line: { color: MED }
    });
    // Browser bar
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.05, w: 2.92, h: 0.3,
      fill: { color: '1E1E1E' }, line: { color: MED }
    });
    // Traffic lights
    const dotColors = ['FF5F57', 'FFBD2E', '28C840'];
    dotColors.forEach((dc, di) => {
      s.addShape(pres.shapes.OVAL, {
        x: x + 0.13 + di * 0.22, y: 1.16, w: 0.12, h: 0.12,
        fill: { color: dc }, line: { color: dc }
      });
    });
    // URL bar mock
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.75, y: 1.12, w: 1.8, h: 0.18,
      fill: { color: '2A2A2A' }, line: { color: MED }
    });
    s.addText("edutestpro.app", {
      x: x + 0.75, y: 1.12, w: 1.8, h: 0.18,
      fontSize: 8, fontFace: "Calibri", color: GRY, align: "center", valign: "middle", margin: 0
    });

    // Screen content placeholder
    s.addText("[ СКРИНШОТ ]", {
      x, y: 1.35, w: 2.92, h: 3.15,
      fontSize: 12, fontFace: "Calibri",
      color: '3A3A3A', align: "center", valign: "middle", margin: 0
    });

    // Label below
    s.addText(sc.label, {
      x, y: 4.88, w: 2.92, h: 0.3,
      fontSize: 12, fontFace: "Calibri", bold: true, color: LGT, align: "center", margin: 0
    });
    s.addText(sc.sub, {
      x, y: 5.2, w: 2.92, h: 0.24,
      fontSize: 10, fontFace: "Calibri", color: GRY, align: "center", margin: 0
    });
  });
}

// ================================================================
// SLIDE 8 — ВИСНОВКИ (dark)
// ================================================================
{
  const s = pres.addSlide();
  s.background = { color: BLK };

  s.addText("08", {
    x: 9.15, y: 0.18, w: 0.65, h: 0.28,
    fontSize: 11, fontFace: "Calibri", bold: true, color: DRK, align: "right", margin: 0
  });
  s.addText("Висновки", {
    x: 0.5, y: 0.18, w: 8, h: 0.68,
    fontSize: 34, fontFace: "Georgia", bold: true, color: WHT, align: "left", margin: 0
  });

  const cols = [
    {
      num: "01",
      title: "Що реалізовано",
      items: [
        "Повноцінна SPA-платформа",
        "10 вбудованих тестів",
        "Конструктор тестів",
        "Система ролей та груп",
        "Хмарна БД Supabase"
      ]
    },
    {
      num: "02",
      title: "Практична цінність",
      items: [
        "Готова до використання у коледжі",
        "Безкоштовний хостинг",
        "Без власного серверу",
        "Адаптивний дизайн",
        "Реальна статистика результатів"
      ]
    },
    {
      num: "03",
      title: "Перспективи розвитку",
      items: [
        "Мобільний застосунок",
        "AI-генерація тестів",
        "Інтеграція з LMS",
        "Розширена аналітика",
        "Офлайн-режим"
      ]
    }
  ];

  cols.forEach((col, i) => {
    const x = 0.45 + i * 3.17;

    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.1, w: 2.98, h: 4.05,
      fill: { color: DRK }, line: { color: '2D2D2D' }
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 1.1, w: 2.98, h: 0.07,
      fill: { color: MED }, line: { color: MED }
    });

    s.addText(col.num, {
      x: x + 0.22, y: 1.2, w: 2.6, h: 0.58,
      fontSize: 36, fontFace: "Georgia", bold: true, color: MED, margin: 0
    });
    s.addText(col.title, {
      x: x + 0.22, y: 1.85, w: 2.6, h: 0.38,
      fontSize: 14, fontFace: "Calibri", bold: true, color: WHT, margin: 0
    });
    s.addShape(pres.shapes.RECTANGLE, {
      x: x + 0.22, y: 2.3, w: 2.55, h: 0.04,
      fill: { color: MED }, line: { color: MED }
    });

    col.items.forEach((item, j) => {
      s.addShape(pres.shapes.RECTANGLE, {
        x: x + 0.22, y: 2.5 + j * 0.5, w: 0.07, h: 0.3,
        fill: { color: GRY }, line: { color: GRY }
      });
      s.addText(item, {
        x: x + 0.4, y: 2.5 + j * 0.5, w: 2.4, h: 0.3,
        fontSize: 12, fontFace: "Calibri", color: LGT, valign: "middle", margin: 0
      });
    });
  });

  // Footer
  s.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 5.33, w: 10, h: 0.295,
    fill: { color: DRK }, line: { color: DRK }
  });
  s.addText("EduTest Pro  •  Гебрин Андрій  •  Кам'янець-Подільський фаховий коледж індустрії  •  2026", {
    x: 0.3, y: 5.33, w: 9.4, h: 0.295,
    fontSize: 10, fontFace: "Calibri",
    color: MED, align: "center", valign: "middle", margin: 0
  });
}

// Save
const outPath = "C:\\Users\\GameOn\\Desktop\\EduTest_Pro_Presentation.pptx";
pres.writeFile({ fileName: outPath })
  .then(() => console.log("DONE: " + outPath))
  .catch(err => { console.error("ERROR:", err); process.exit(1); });
