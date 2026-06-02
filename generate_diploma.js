// Diploma thesis generator for Гебрин Андрій Петрович
// Project: EduTest Pro — web platform for interactive tests
// Using docx npm library

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  VerticalAlign, PageNumber, PageBreak, LevelFormat, ShadingType,
  TableOfContents, TabStopType
} = require('C:/Users/GameOn/AppData/Roaming/npm/node_modules/docx');

const fs = require('fs');

// ─── CONSTANTS ────────────────────────────────────────────────────
// A4 page in DXA (1 inch = 1440 DXA, 1 mm ≈ 56.7 DXA)
// Margins: top/bottom 20mm, left 30mm, right 15mm
const PAGE_WIDTH  = 11906;  // A4 width in DXA
const PAGE_HEIGHT = 16838;  // A4 height in DXA
const MARGIN_TOP    = Math.round(20 * 56.7);  // 20mm = 1134
const MARGIN_BOTTOM = Math.round(20 * 56.7);  // 20mm = 1134
const MARGIN_LEFT   = Math.round(30 * 56.7);  // 30mm = 1701
const MARGIN_RIGHT  = Math.round(15 * 56.7);  // 15mm = 850
// Content width = 11906 - 1701 - 850 = 9355 DXA
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

const FONT = "Times New Roman";
const FONT_SIZE = 28; // 14pt in half-points
const LINE_SPACING = 360; // 1.5 lines = 360 twips (240 = single)
const INDENT = 709; // 1.25 cm in DXA (1.25 * 56.7 ≈ 709)

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────

function body(text, opts = {}) {
  return new Paragraph({
    alignment: opts.center ? AlignmentType.CENTER :
               opts.right  ? AlignmentType.RIGHT  :
               AlignmentType.BOTH,
    indent: opts.noIndent || opts.center || opts.right ? {} : { firstLine: INDENT },
    pageBreakBefore: opts.pageBreak || false,
    spacing: { line: LINE_SPACING, lineRule: "auto", before: 0, after: 0 },
    children: [
      new TextRun({
        text: text || "",
        font: FONT,
        size: FONT_SIZE,
        bold: opts.bold || false,
        underline: opts.underline ? {} : undefined,
        italics: opts.italic || false,
      })
    ]
  });
}

function emptyLine() {
  return new Paragraph({
    spacing: { line: LINE_SPACING, lineRule: "auto", before: 0, after: 0 },
    children: [new TextRun({ text: "", font: FONT, size: FONT_SIZE })]
  });
}

function heading1(text, opts = {}) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    pageBreakBefore: opts.pageBreak !== false,
    spacing: { line: LINE_SPACING, lineRule: "auto", before: 200, after: 200 },
    children: [
      new TextRun({
        text: text,
        font: FONT,
        size: FONT_SIZE,
        bold: true,
        allCaps: false,
      })
    ]
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    alignment: AlignmentType.LEFT,
    spacing: { line: LINE_SPACING, lineRule: "auto", before: 160, after: 80 },
    indent: {},
    children: [
      new TextRun({
        text: text,
        font: FONT,
        size: FONT_SIZE,
        bold: true,
      })
    ]
  });
}

function heading3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    alignment: AlignmentType.LEFT,
    spacing: { line: LINE_SPACING, lineRule: "auto", before: 120, after: 60 },
    indent: { firstLine: INDENT },
    children: [
      new TextRun({
        text: text,
        font: FONT,
        size: FONT_SIZE,
        bold: true,
        italics: true,
      })
    ]
  });
}

function bulletItem(text) {
  return new Paragraph({
    alignment: AlignmentType.BOTH,
    spacing: { line: LINE_SPACING, lineRule: "auto", before: 0, after: 0 },
    indent: { left: INDENT + 360, hanging: 360 },
    children: [
      new TextRun({ text: "– ", font: FONT, size: FONT_SIZE }),
      new TextRun({ text: text, font: FONT, size: FONT_SIZE }),
    ]
  });
}

function numberedItem(num, text) {
  return new Paragraph({
    alignment: AlignmentType.BOTH,
    spacing: { line: LINE_SPACING, lineRule: "auto", before: 0, after: 0 },
    indent: { firstLine: INDENT },
    children: [
      new TextRun({ text: `${num}) ${text}`, font: FONT, size: FONT_SIZE }),
    ]
  });
}

function sectionTitle(text) {
  // Section titles are centered, bold, all-caps — like "1 ТЕХНІЧНЕ ЗАВДАННЯ"
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    alignment: AlignmentType.CENTER,
    pageBreakBefore: true,
    spacing: { line: LINE_SPACING, lineRule: "auto", before: 0, after: 240 },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        font: FONT,
        size: FONT_SIZE,
        bold: true,
      })
    ]
  });
}

function subsectionTitle(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    alignment: AlignmentType.LEFT,
    spacing: { line: LINE_SPACING, lineRule: "auto", before: 200, after: 100 },
    children: [
      new TextRun({
        text: text,
        font: FONT,
        size: FONT_SIZE,
        bold: true,
      })
    ]
  });
}

function subsubTitle(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    alignment: AlignmentType.LEFT,
    spacing: { line: LINE_SPACING, lineRule: "auto", before: 160, after: 80 },
    indent: { firstLine: INDENT },
    children: [
      new TextRun({
        text: text,
        font: FONT,
        size: FONT_SIZE,
        bold: true,
        italics: false,
      })
    ]
  });
}

// ─── TABLE HELPER ─────────────────────────────────────────────────
function makeTable(headers, rows, colWidths) {
  const borderStyle = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
  const borders = { top: borderStyle, bottom: borderStyle, left: borderStyle, right: borderStyle, insideH: borderStyle, insideV: borderStyle };

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      borders,
      width: { size: colWidths[i], type: WidthType.DXA },
      shading: { fill: "D9D9D9", type: ShadingType.CLEAR },
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      verticalAlign: VerticalAlign.CENTER,
      children: [new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { line: LINE_SPACING, lineRule: "auto" },
        children: [new TextRun({ text: h, font: FONT, size: 24, bold: true })]
      })]
    }))
  });

  const dataRows = rows.map(row => new TableRow({
    children: row.map((cell, i) => new TableCell({
      borders,
      width: { size: colWidths[i], type: WidthType.DXA },
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { line: LINE_SPACING, lineRule: "auto" },
        children: [new TextRun({ text: String(cell), font: FONT, size: 24 })]
      })]
    }))
  }));

  return new Table({
    width: { size: CONTENT_WIDTH, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: [headerRow, ...dataRows],
  });
}

// ─── TITLE PAGE ───────────────────────────────────────────────────
function makeTitlePage() {
  function tp(text, opts = {}) {
    return new Paragraph({
      alignment: opts.center !== false ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { line: opts.line || 240, lineRule: "auto", before: opts.before || 0, after: opts.after || 0 },
      children: [new TextRun({
        text,
        font: FONT,
        size: opts.size || 28,
        bold: opts.bold || false,
        underline: opts.underline ? {} : undefined,
      })]
    });
  }

  return [
    tp("Міністерство освіти і науки України", { bold: false }),
    tp("Кам'янець-Подільський фаховий коледж індустрії,", { bold: false }),
    tp("бізнесу та інформаційних технологій", { bold: false }),
    emptyLine(),
    tp("Відділення комп'ютерних технологій", {}),
    tp("Циклова комісія комп'ютерних дисциплін", {}),
    emptyLine(),
    emptyLine(),
    // "До захисту допущено" block — right-aligned
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { line: 240, lineRule: "auto" },
      children: [new TextRun({ text: "До захисту допущено", font: FONT, size: 28 })]
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { line: 240, lineRule: "auto" },
      children: [new TextRun({ text: "заступник директора", font: FONT, size: 28 })]
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { line: 240, lineRule: "auto" },
      children: [new TextRun({ text: "з навчальної роботи", font: FONT, size: 28 })]
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { line: 240, lineRule: "auto" },
      children: [new TextRun({ text: "________ Руслана МЕДВЕЦЬКА", font: FONT, size: 28 })]
    }),
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { line: 240, lineRule: "auto" },
      children: [new TextRun({ text: "«____»___________2026  р.", font: FONT, size: 28 })]
    }),
    emptyLine(),
    emptyLine(),
    tp("ПОЯСНЮВАЛЬНА ЗАПИСКА", { bold: true, size: 32 }),
    tp("до дипломного проєкту", { bold: false }),
    tp("освітньо-професійного ступеню", {}),
    tp("«фаховий молодший бакалавр»", {}),
    emptyLine(),
    tp("на тему", {}),
    emptyLine(),
    tp("ВЕБПЛАТФОРМА EDUTEST PRO ДЛЯ СТВОРЕННЯ ТА ПРОХОДЖЕННЯ", { bold: true }),
    tp("ІНТЕРАКТИВНИХ ТЕСТІВ", { bold: true }),
    emptyLine(),
    tp("ДП.121.РПЗ.26.ПЗ", { bold: false }),
    emptyLine(),
    emptyLine(),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 280, lineRule: "auto", before: 0, after: 0 },
      indent: { left: 4500 },
      children: [new TextRun({ text: "Виконав: здобувач освіти ІV курсу, групи РПЗ-221", font: FONT, size: 28 })]
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 280, lineRule: "auto" },
      indent: { left: 4500 },
      children: [new TextRun({ text: "спеціальності 121 Інженерія програмного забезпечення", font: FONT, size: 28 })]
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 280, lineRule: "auto" },
      indent: { left: 4500 },
      children: [new TextRun({ text: "ОПП Розробка програмного забезпечення", font: FONT, size: 28 })]
    }),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 280, lineRule: "auto" },
      indent: { left: 4500 },
      children: [new TextRun({ text: "Гебрин Андрій Петрович", font: FONT, size: 28, bold: true })]
    }),
    emptyLine(),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 280, lineRule: "auto" },
      indent: { left: 4500 },
      children: [new TextRun({ text: "Керівник: Кузьмич Василь Степанович", font: FONT, size: 28 })]
    }),
    emptyLine(),
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { line: 280, lineRule: "auto" },
      indent: { left: 4500 },
      children: [new TextRun({ text: "Рецензент: ____________________________", font: FONT, size: 28 })]
    }),
    emptyLine(),
    emptyLine(),
    emptyLine(),
    tp("Кам'янець-Подільський — 2026", {}),
    // Force page break after title page
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ─── DOCUMENT CONTENT ─────────────────────────────────────────────

const children = [
  ...makeTitlePage(),

  // ── ЗМІСТ (TOC) ──────────────────────────────────────────────
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: LINE_SPACING, lineRule: "auto", before: 0, after: 300 },
    children: [new TextRun({ text: "ЗМІСТ", font: FONT, size: FONT_SIZE, bold: true })]
  }),
  new TableOfContents("ЗМІСТ", {
    hyperlink: true,
    headingStyleRange: "1-3",
    stylesWithLevels: []
  }),
  new Paragraph({ children: [new PageBreak()] }),

  // ── ВСТУП ────────────────────────────────────────────────────
  new Paragraph({
    alignment: AlignmentType.CENTER,
    pageBreakBefore: false,
    spacing: { line: LINE_SPACING, lineRule: "auto", before: 0, after: 240 },
    children: [new TextRun({ text: "ВСТУП", font: FONT, size: FONT_SIZE, bold: true })]
  }),

  body("Сучасна освіта зазнає глибоких трансформацій під впливом цифрових технологій. Онлайн-навчання, дистанційні форми роботи та автоматизована перевірка знань стали не лише альтернативою, а й невід'ємною частиною освітнього процесу. Особливо гострою є потреба в інструментах, які дозволяють викладачам швидко створювати тести, а студентам — проходити їх у зручний час із будь-якого пристрою."),
  emptyLine(),
  body("Актуальність теми зумовлена необхідністю автоматизації процесу тестування в навчальних закладах. Існуючі рішення часто є надто складними в налаштуванні, дорогими або не відповідають специфічним потребам вітчизняних коледжів та університетів. Розробка власної вебплатформи, адаптованої до потреб Кам'янець-Подільського фахового коледжу індустрії, бізнесу та інформаційних технологій, є обґрунтованою і перспективною задачею."),
  emptyLine(),
  body("Метою дипломного проєкту є розробка вебплатформи EduTest Pro — сучасного, зручного та надійного інструменту для створення і проходження інтерактивних онлайн-тестів із підтримкою різних ролей користувачів, груповими сесіями та відстеженням результатів."),
  emptyLine(),
  body("Для досягнення мети поставлено такі завдання:"),
  bulletItem("проаналізувати існуючі рішення для онлайн-тестування та виявити їхні переваги й недоліки;"),
  bulletItem("розробити технічне завдання на вебплатформу EduTest Pro;"),
  bulletItem("спроєктувати архітектуру системи та базу даних;"),
  bulletItem("реалізувати функціональність створення тестів, проходження тестів, управління групами та перегляду результатів;"),
  bulletItem("провести тестування розробленого програмного продукту;"),
  bulletItem("розрахувати техніко-економічні показники та розглянути питання охорони праці."),
  emptyLine(),
  body("Об'єктом дослідження є процес автоматизації тестування знань у навчальних закладах."),
  emptyLine(),
  body("Предметом дослідження є вебплатформа для створення та проходження інтерактивних тестів."),
  emptyLine(),
  body("У роботі використано такі методи дослідження: аналіз існуючих систем тестування, методи об'єктно-орієнтованого проєктування, методи тестування програмного забезпечення, а також методи техніко-економічного аналізу."),
  emptyLine(),
  body("Практична значимість роботи полягає в тому, що розроблений програмний продукт може бути впроваджений у навчальний процес Кам'янець-Подільського фахового коледжу індустрії, бізнесу та інформаційних технологій, а також використаний в інших освітніх закладах."),
  emptyLine(),
  body("Вебплатформа EduTest Pro реалізована з використанням HTML, CSS та JavaScript (однозначний застосунок без фреймворків), хмарної бази даних Supabase (PostgreSQL) та розгорнута на хмарному хостингу Vercel. Це забезпечує високу продуктивність, доступність із будь-якого пристрою та зручність в обслуговуванні."),
  emptyLine(),
  body("Дипломний проєкт складається зі вступу, шести розділів, висновків, списку використаних джерел та додатків. Загальний обсяг пояснювальної записки — понад 50 сторінок."),

  // ── РОЗДІЛ 1: ТЕХНІЧНЕ ЗАВДАННЯ ─────────────────────────────
  sectionTitle("1 ТЕХНІЧНЕ ЗАВДАННЯ"),

  subsectionTitle("1.1 Найменування та область застосування"),

  body("Найменування розробки: «EduTest Pro — вебплатформа для створення та проходження інтерактивних тестів»."),
  emptyLine(),
  body("Умовне позначення: EduTest Pro."),
  emptyLine(),
  body("Замовником розробки є Кам'янець-Подільський фаховий коледж індустрії, бізнесу та інформаційних технологій."),
  emptyLine(),
  body("Область застосування: система призначена для використання у загальноосвітніх та вищих навчальних закладах, корпоративних навчальних центрах, а також для індивідуального дистанційного навчання. Основними користувачами є викладачі (вчителі, тренери), які створюють тестові завдання, та студенти (учні, слухачі), які проходять тестування."),
  emptyLine(),
  body("Вебплатформа EduTest Pro вирішує такі прикладні задачі:"),
  bulletItem("автоматизація процесу перевірки знань студентів;"),
  bulletItem("зберігання та систематизація навчальних тестів;"),
  bulletItem("організація групових сесій тестування в реальному часі;"),
  bulletItem("збір та аналіз результатів тестування;"),
  bulletItem("управління доступом до тестів (публічні та приватні тести);"),
  bulletItem("забезпечення мобільної доступності для всіх учасників навчального процесу."),

  subsectionTitle("1.2 Вимоги до апаратного та програмного забезпечення"),

  subsubTitle("1.2.1 Вимоги до апаратного забезпечення"),

  body("Мінімальні вимоги до апаратного забезпечення для роботи з вебплатформою EduTest Pro визначаються можливостями сучасних браузерів і є невисокими, що забезпечує широку доступність системи."),
  emptyLine(),
  body("Вимоги до апаратного забезпечення сервера (хмарний хостинг Vercel):"),
  bulletItem("сервер розгортається в хмарному середовищі Vercel; апаратні характеристики є прозорими для розробника та автоматично масштабуються;"),
  bulletItem("зберігання даних здійснюється на хмарному сервісі Supabase, який надає PostgreSQL-базу даних із автоматичним резервним копіюванням."),
  emptyLine(),
  body("Мінімальні вимоги до апаратного забезпечення клієнта (пристрій користувача):"),

  makeTable(
    ["Компонент", "Мінімальні вимоги", "Рекомендовані вимоги"],
    [
      ["Процесор", "1.0 ГГц", "2.0 ГГц і вище"],
      ["Оперативна пам'ять", "1 ГБ", "4 ГБ і більше"],
      ["Дисплей", "1024×600 px", "1920×1080 px"],
      ["Інтернет-з'єднання", "1 Мбіт/с", "10 Мбіт/с і вище"],
      ["Пристрій", "Смартфон, планшет, ПК", "ПК або ноутбук"],
    ],
    [3000, 2800, 3555]
  ),
  emptyLine(),

  subsubTitle("1.2.2 Вимоги до програмного забезпечення"),

  body("Для коректної роботи вебплатформи EduTest Pro не потрібно встановлювати додаткове програмне забезпечення. Єдиною вимогою є наявність сучасного веббраузера."),
  emptyLine(),
  body("Вимоги до програмного забезпечення клієнта:"),
  bulletItem("Операційна система: будь-яка (Windows 7/10/11, macOS 10.14+, Linux, Android 8+, iOS 12+);"),
  bulletItem("Веббраузер: Google Chrome 90+, Mozilla Firefox 88+, Microsoft Edge 90+, Safari 14+, Opera 76+;"),
  bulletItem("Увімкнений JavaScript у браузері;"),
  bulletItem("Наявність інтернет-з'єднання."),
  emptyLine(),
  body("Вимоги до програмного забезпечення для розробки та розгортання:"),
  bulletItem("Node.js 18+ (для локального запуску та деплою на Vercel);"),
  bulletItem("Git — система контролю версій;"),
  bulletItem("Vercel CLI — інструмент для розгортання проєкту;"),
  bulletItem("Обліковий запис Supabase — для управління базою даних PostgreSQL;"),
  bulletItem("Текстовий редактор (рекомендовано Visual Studio Code)."),

  subsectionTitle("1.3 Стадії та етапи розробки"),

  body("Процес розробки вебплатформи EduTest Pro поділяється на такі основні стадії та етапи:"),
  emptyLine(),

  makeTable(
    ["№", "Стадія / Етап", "Зміст роботи", "Строки"],
    [
      ["1", "Підготовча стадія", "Вивчення предметної галузі, аналіз аналогів, складання технічного завдання", "Травень 2026"],
      ["2", "Проєктування", "Проєктування архітектури, структури БД, алгоритмів роботи, UI/UX прототипів", "Травень 2026"],
      ["3", "Кодування", "Розробка фронтенду (HTML/CSS/JS), підключення Supabase, реалізація бізнес-логіки", "Травень–Червень 2026"],
      ["4", "Тестування", "Функціональне тестування, тестування безпеки, тестування на різних пристроях", "Червень 2026"],
      ["5", "Розгортання", "Публікація на хостингу Vercel, налаштування домену та змінних середовища", "Червень 2026"],
      ["6", "Документування", "Написання пояснювальної записки, підготовка презентації та звіту", "Червень 2026"],
    ],
    [400, 2500, 4000, 2655]
  ),

  // ── РОЗДІЛ 2: ПРОЄКТУВАННЯ ЗАСТОСУНКУ ────────────────────────
  sectionTitle("2 ПРОЄКТУВАННЯ ЗАСТОСУНКУ"),

  subsectionTitle("2.1 Вибір інструментів розробки"),

  subsubTitle("2.1.1 Аналіз існуючих рішень"),

  body("Перед початком розробки власної вебплатформи було проведено аналіз існуючих аналогів та конкурентних рішень у сфері онлайн-тестування. Результати аналізу наведено нижче."),
  emptyLine(),
  body("Google Forms — безкоштовний інструмент від Google для створення форм і тестів. Переваги: простота використання, інтеграція з Google Drive, безкоштовність. Недоліки: обмежені можливості налаштування, відсутність реальних часових сесій, неможливість організації групового тестування за кодом приєднання, відсутність ролей."),
  emptyLine(),
  body("Kahoot! — популярна платформа для гейміфікованого тестування. Переваги: висока залученість учасників, режим реального часу, красивий інтерфейс. Недоліки: платний для розширених функцій, орієнтований переважно на короткі ігрові сесії, а не на академічне тестування."),
  emptyLine(),
  body("Moodle — система управління навчанням (LMS) з вбудованим модулем тестування. Переваги: широкий функціонал, відкритий код. Недоліки: складна установка та налаштування, важкий інтерфейс, вимагає виділеного сервера."),
  emptyLine(),
  body("Порівняльна таблиця аналогів із EduTest Pro:"),
  emptyLine(),

  makeTable(
    ["Характеристика", "Google Forms", "Kahoot!", "Moodle", "EduTest Pro"],
    [
      ["Безкоштовність", "Так", "Обмежено", "Так*", "Так"],
      ["Ролі (вчитель/студент)", "Ні", "Так", "Так", "Так"],
      ["Групові сесії", "Ні", "Так", "Так", "Так"],
      ["Код приєднання", "Ні", "Так", "Ні", "Так"],
      ["Типи питань", "Базові", "Тільки вибір", "Розширені", "Вибір + текст"],
      ["Мобільна версія", "Так", "Так", "Частково", "Так"],
      ["Просте розгортання", "Так", "Так", "Ні", "Так"],
    ],
    [2200, 1600, 1600, 1600, 2355]
  ),
  emptyLine(),
  body("На підставі аналізу визначено, що EduTest Pro займає нішу між простими інструментами (Google Forms) та складними LMS (Moodle), пропонуючи оптимальне поєднання функціональності, простоти використання та безкоштовності."),

  subsubTitle("2.1.2 Вибір мови програмування та технологій"),

  body("Для реалізації вебплатформи EduTest Pro обрано такий технологічний стек:"),
  emptyLine(),
  body("HTML5 — мова розмітки для структурування вмісту вебсторінок. Використання семантичних елементів HTML5 (header, main, section, article, nav) забезпечує коректну роботу з допоміжними технологіями та пошуковими системами."),
  emptyLine(),
  body("CSS3 — мова стилів для оформлення інтерфейсу. Застосування сучасних можливостей CSS3, зокрема Flexbox, Grid Layout, CSS-змінних (Custom Properties) та медіа-запитів, дозволило реалізувати адаптивний дизайн без використання CSS-фреймворків."),
  emptyLine(),
  body("JavaScript (Vanilla JS, ES2020+) — основна мова програмування для реалізації бізнес-логіки на стороні клієнта. Обрано підхід односторінкового застосунку (SPA — Single Page Application) без використання фреймворків. Це рішення обґрунтоване меншим розміром бандлу, відсутністю залежностей та вищою продуктивністю для цього класу задач."),
  emptyLine(),
  body("Supabase — хмарна платформа Backend-as-a-Service (BaaS), що надає:"),
  bulletItem("PostgreSQL-базу даних з повним SQL-доступом;"),
  bulletItem("вбудовану систему автентифікації (Supabase Auth) з підтримкою JWT-токенів;"),
  bulletItem("JavaScript SDK для роботи з базою даних безпосередньо з браузера;"),
  bulletItem("Row Level Security (RLS) для управління доступом на рівні рядків таблиць;"),
  bulletItem("автоматичне резервне копіювання та масштабування."),
  emptyLine(),
  body("Vercel — хмарна платформа для розгортання вебзастосунків. Переваги: безкоштовний тарифний план для хобі-проєктів, автоматичне розгортання з GitHub, глобальна CDN-мережа, підтримка HTTPS."),
  emptyLine(),
  body("Порівняно з альтернативними технологіями (React, Vue, Angular), обрання Vanilla JS дозволяє:"),
  bulletItem("зменшити розмір завантажуваних ресурсів у 3–5 разів;"),
  bulletItem("спростити архітектуру проєкту без зайвих абстракцій;"),
  bulletItem("отримати вищу початкову продуктивність (Time to Interactive);"),
  bulletItem("відмовитися від npm-залежностей у клієнтському коді."),

  subsubTitle("2.1.3 Архітектура системи"),

  body("Вебплатформа EduTest Pro побудована за архітектурою клієнт-сервер із використанням хмарних сервісів. Архітектура системи включає такі компоненти:"),
  emptyLine(),
  body("Клієнтська частина (Frontend) — статичні файли HTML/CSS/JS, що хостяться на Vercel CDN. Клієнт виконує всю бізнес-логіку на стороні браузера, безпосередньо взаємодіючи з Supabase API через HTTPS."),
  emptyLine(),
  body("Серверна частина (Backend) — реалізована засобами Supabase: PostgreSQL-база даних, Row Level Security-правила для авторизації, Edge Functions (за потреби) та система автентифікації."),
  emptyLine(),
  body("Взаємодія компонентів: браузер користувача → Vercel CDN (статичні файли) → Supabase REST API (дані) → PostgreSQL (зберігання)."),
  emptyLine(),
  body("Система підтримує дві ролі користувачів:"),
  bulletItem("TEACHER (викладач) — може створювати тести, редагувати питання, запускати групові сесії, переглядати результати всіх студентів;"),
  bulletItem("STUDENT (студент) — може проходити публічні тести, приєднуватися до сесій за кодом, переглядати власну історію результатів."),

  subsectionTitle("2.2 Алгоритм роботи застосунку. Вхідні і вихідні дані"),

  subsubTitle("2.2.1 Загальний алгоритм роботи"),

  body("Алгоритм роботи вебплатформи EduTest Pro описується такими основними сценаріями використання (Use Cases):"),
  emptyLine(),
  body("Сценарій 1: Реєстрація та вхід до системи."),
  numberedItem("1", "Користувач відкриває головну сторінку EduTest Pro."),
  numberedItem("2", "Система перевіряє наявність активної сесії (localStorage + Supabase session)."),
  numberedItem("3", "Якщо сесія відсутня — відображається форма входу/реєстрації."),
  numberedItem("4", "Користувач вводить email та пароль."),
  numberedItem("5", "Supabase Auth перевіряє облікові дані та повертає JWT-токен."),
  numberedItem("6", "Система зчитує роль користувача з таблиці profiles та перенаправляє на відповідний дашборд."),
  emptyLine(),
  body("Сценарій 2: Створення тесту (роль TEACHER)."),
  numberedItem("1", "Викладач натискає «Створити тест» на панелі управління."),
  numberedItem("2", "Вводить назву тесту, опис, встановлює параметри (публічний/приватний, обмеження часу)."),
  numberedItem("3", "Додає питання: для кожного питання обирає тип (multiple choice або free text)."),
  numberedItem("4", "Для питань з вибором варіантів — вводить варіанти відповідей та позначає правильний."),
  numberedItem("5", "Зберігає тест. Система записує дані в таблиці tests та questions бази даних."),
  numberedItem("6", "Система генерує унікальний код доступу для тесту."),
  emptyLine(),
  body("Сценарій 3: Проходження тесту (роль STUDENT)."),
  numberedItem("1", "Студент обирає тест зі списку публічних тестів або вводить код доступу."),
  numberedItem("2", "Відображається інформація про тест: назва, кількість питань, обмеження часу."),
  numberedItem("3", "Студент починає проходження — стартує таймер (якщо встановлено)."),
  numberedItem("4", "Для кожного питання відображаються варіанти відповідей або поле вводу тексту."),
  numberedItem("5", "Після відповіді на всі питання студент надсилає результати."),
  numberedItem("6", "Система обчислює бали, зберігає результат у таблиці results та відображає підсумок."),
  emptyLine(),
  body("Сценарій 4: Групова сесія."),
  numberedItem("1", "Викладач запускає групову сесію на основі наявного тесту."),
  numberedItem("2", "Система генерує унікальний 6-символьний код сесії."),
  numberedItem("3", "Студенти вводять код і приєднуються до сесії."),
  numberedItem("4", "Викладач бачить список підключених учасників у реальному часі."),
  numberedItem("5", "Викладач запускає тестування — всі учасники починають одночасно."),
  numberedItem("6", "По завершенні — зведена таблиця результатів усіх учасників."),

  subsubTitle("2.2.2 Структура вхідних та вихідних даних"),

  body("Вхідні дані системи:"),
  emptyLine(),

  makeTable(
    ["Ідентифікатор", "Тип", "Значення", "Пояснення"],
    [
      ["email", "string", "user@example.com", "Електронна адреса користувача"],
      ["password", "string", "мін. 6 символів", "Пароль для входу"],
      ["role", "enum", "teacher | student", "Роль користувача"],
      ["test_title", "string", "до 200 символів", "Назва тесту"],
      ["question_text", "string", "до 500 символів", "Текст питання"],
      ["question_type", "enum", "multiple | free_text", "Тип питання"],
      ["answer_text", "string", "до 200 символів", "Текст варіанту відповіді"],
      ["is_correct", "boolean", "true | false", "Чи є відповідь правильною"],
      ["join_code", "string", "6 символів", "Код приєднання до сесії"],
      ["time_limit", "integer", "0–3600 сек", "Обмеження часу (0 = без обмеження)"],
    ],
    [2200, 1200, 2000, 3955]
  ),
  emptyLine(),

  body("Вихідні дані системи:"),
  emptyLine(),

  makeTable(
    ["Ідентифікатор", "Тип", "Пояснення"],
    [
      ["score", "integer", "Кількість балів, отриманих студентом"],
      ["max_score", "integer", "Максимально можлива кількість балів"],
      ["percentage", "float", "Відсоток правильних відповідей"],
      ["passed", "boolean", "Чи пройдено тест (за встановленим порогом)"],
      ["result_detail", "JSON", "Детальний розбір відповідей на кожне питання"],
      ["session_results", "JSON[]", "Масив результатів всіх учасників сесії"],
      ["history", "JSON[]", "Масив попередніх результатів користувача"],
    ],
    [2500, 1500, 5355]
  ),

  subsubTitle("2.2.3 Структура бази даних"),

  body("База даних EduTest Pro реалізована в PostgreSQL на платформі Supabase. Схема бази даних включає такі таблиці:"),
  emptyLine(),

  makeTable(
    ["Таблиця", "Призначення", "Ключові поля"],
    [
      ["profiles", "Профілі користувачів", "id (UUID), email, role, full_name, created_at"],
      ["tests", "Тести", "id (UUID), title, description, creator_id, is_public, time_limit, join_code, created_at"],
      ["questions", "Питання тестів", "id (UUID), test_id, question_text, question_type, order_index"],
      ["answers", "Варіанти відповідей", "id (UUID), question_id, answer_text, is_correct"],
      ["sessions", "Групові сесії", "id (UUID), test_id, teacher_id, session_code, status, started_at"],
      ["session_participants", "Учасники сесій", "id (UUID), session_id, student_id, joined_at"],
      ["results", "Результати тестування", "id (UUID), test_id, student_id, session_id, score, max_score, completed_at"],
      ["result_answers", "Відповіді студентів", "id (UUID), result_id, question_id, selected_answer_id, text_answer"],
    ],
    [2200, 2400, 4755]
  ),
  emptyLine(),
  body("Зв'язки між таблицями: profiles (1) → tests (∞), tests (1) → questions (∞), questions (1) → answers (∞), tests (1) → sessions (∞), sessions (1) → session_participants (∞), results пов'язаний з tests, profiles та sessions через зовнішні ключі."),

  // ── РОЗДІЛ 3: ІНТЕРФЕЙС ЗАСТОСУНКУ ───────────────────────────
  sectionTitle("3 ІНТЕРФЕЙС ЗАСТОСУНКУ"),

  subsectionTitle("3.1 Головна форма"),

  subsubTitle("3.1.1 Загальні принципи проєктування інтерфейсу"),

  body("Інтерфейс вебплатформи EduTest Pro розроблено відповідно до принципів UX/UI-дизайну, орієнтованого на користувача. При проєктуванні керувалися такими принципами:"),
  emptyLine(),
  body("Простота та прозорість. Інтерфейс має бути зрозумілим навіть для користувачів без технічних знань. Кожний елемент виконує чітку функцію, зайві елементи відсутні."),
  emptyLine(),
  body("Послідовність. Елементи оформлення — кольори, шрифти, відступи — однакові на всіх сторінках застосунку. Це зменшує когнітивне навантаження користувача."),
  emptyLine(),
  body("Відгук. Кожна дія користувача супроводжується візуальним підтвердженням: повідомлення про успіх або помилку, анімація завантаження, підсвічування активного елемента."),
  emptyLine(),
  body("Адаптивність. Інтерфейс коректно відображається на пристроях з різною роздільною здатністю екрана: від смартфонів (320 px) до широкоекранних моніторів (2560 px і більше)."),
  emptyLine(),
  body("Доступність (a11y). Використовуються семантичні HTML-елементи, ARIA-атрибути для скрінрідерів, достатній контраст кольорів (відношення контрасту не менше 4.5:1), підтримка навігації з клавіатури."),

  subsubTitle("3.1.2 Структура навігації"),

  body("Вебплатформа EduTest Pro організована як SPA (Single Page Application). Навігація здійснюється через JavaScript Router без перезавантаження сторінки. Структура навігації для кожної ролі:"),
  emptyLine(),
  body("Для ролі TEACHER (викладач):"),
  bulletItem("Дашборд — огляд статистики, список власних тестів, кнопки швидких дій;"),
  bulletItem("Мої тести — перелік усіх тестів викладача з фільтрацією та пошуком;"),
  bulletItem("Створити тест — форма створення нового тесту з конструктором питань;"),
  bulletItem("Редагувати тест — форма редагування існуючого тесту;"),
  bulletItem("Результати — зведена таблиця результатів за конкретним тестом;"),
  bulletItem("Сесії — управління груповими сесіями (запуск, моніторинг, завершення);"),
  bulletItem("Профіль — налаштування облікового запису."),
  emptyLine(),
  body("Для ролі STUDENT (студент):"),
  bulletItem("Дашборд — огляд доступних публічних тестів, результати останніх проходжень;"),
  bulletItem("Публічні тести — перелік тестів із публічним доступом;"),
  bulletItem("Приєднатися — форма введення коду доступу до тесту або сесії;"),
  bulletItem("Проходження тесту — інтерфейс питань із таймером;"),
  bulletItem("Мої результати — повна історія проходжень із детальним розбором;"),
  bulletItem("Профіль — налаштування облікового запису."),

  subsubTitle("3.1.3 Опис екранних форм"),

  body("Форма автентифікації. Розташована по центру сторінки, містить логотип EduTest Pro, поля введення email та пароля, кнопки «Увійти» та «Зареєструватися», а також перемикач ролі при реєстрації. Валідація форми здійснюється в реальному часі: підсвічування неправильно заповнених полів та відображення підказок."),
  emptyLine(),
  body("Панель управління (Дашборд). Верхня частина містить привітання з ім'ям користувача та поточною датою. Нижче — картки статистики (кількість тестів, загальна кількість проходжень, середній бал). Основна частина — таблиця нещодавньої активності та кнопки швидкого доступу до основних функцій."),
  emptyLine(),
  body("Конструктор тесту. Лівий блок — загальна інформація про тест (назва, опис, налаштування). Правий блок — список питань із кнопкою додавання. Кожне питання відображається у вигляді картки з можливістю розгортання для редагування. Тип питання (вибір / текст) встановлюється перемикачем. Для питань типу «вибір» відображається список варіантів відповідей із прапорцями для позначення правильного."),
  emptyLine(),
  body("Інтерфейс проходження тесту. Верхня смуга — назва тесту та таймер зворотного відліку (якщо встановлено). Індикатор прогресу — горизонтальна смуга, що показує кількість відповідей. Основна частина — поточне питання та варіанти відповідей (radio buttons для вибору, textarea для вільного тексту). Нижня частина — кнопки «Назад», «Далі», «Завершити»."),
  emptyLine(),
  body("Сторінка результатів. Заголовок із назвою тесту та підсумковим балом (у вигляді кола з числом і відсотком). Нижче — деталізована таблиця питань: текст питання, відповідь студента, правильна відповідь, статус (правильно/неправильно). Кнопки «Пройти ще раз» та «Повернутися до тестів»."),

  subsectionTitle("3.2 Формування звітів"),

  body("Вебплатформа EduTest Pro формує кілька видів звітів для різних ролей користувачів."),
  emptyLine(),
  body("Індивідуальний звіт студента. Формується після завершення кожного тесту та зберігається в базі даних. Містить:"),
  bulletItem("загальний бал і відсоток правильних відповідей;"),
  bulletItem("детальний розбір кожного питання із зазначенням відповіді студента та правильної відповіді;"),
  bulletItem("час проходження тесту;"),
  bulletItem("порівняння з середнім результатом по тесту (якщо дані є)."),
  emptyLine(),
  body("Зведений звіт викладача по тесту. Доступний викладачу після накопичення достатньої кількості проходжень. Містить:"),
  bulletItem("список усіх студентів, що проходили тест, із їхніми балами;"),
  bulletItem("середній бал, медіану, мінімальний і максимальний результат;"),
  bulletItem("статистику по кожному питанню: відсоток правильних відповідей;"),
  bulletItem("часову шкалу активності (кількість проходжень по датах)."),
  emptyLine(),
  body("Звіт групової сесії. Формується після завершення сесії. Містить:"),
  bulletItem("список всіх учасників сесії з балами у форматі таблиці рейтингу;"),
  bulletItem("загальну статистику сесії;"),
  bulletItem("можливість перегляду деталей кожного учасника."),
  emptyLine(),
  body("Дані звітів зберігаються в базі даних Supabase та доступні для перегляду в будь-який час через відповідні розділи платформи. Передбачена можливість фільтрації та сортування результатів у таблицях."),

  // ── РОЗДІЛ 4: ПРОГРАМУВАННЯ ТА ТЕСТУВАННЯ ────────────────────
  sectionTitle("4 ПРОГРАМУВАННЯ ТА ТЕСТУВАННЯ"),

  subsectionTitle("4.1 Розробка автоматизованого застосунку"),

  subsubTitle("4.1.1 Структура файлів проєкту"),

  body("Проєкт EduTest Pro організовано у вигляді статичного вебзастосунку з такою структурою файлів:"),
  emptyLine(),
  body("Файл index.html є єдиною HTML-сторінкою застосунку. Він містить базову розмітку: контейнер для SPA-роутингу, підключення стилів та скриптів. Конкретні компоненти інтерфейсу генеруються динамічно через JavaScript."),
  emptyLine(),
  body("Файл app.js є головним модулем JavaScript. Відповідає за ініціалізацію застосунку, підключення до Supabase, налаштування роутера та управління глобальним станом."),
  emptyLine(),
  body("Файл router.js реалізує клієнтський SPA-роутер на основі History API. Обробляє URL-переходи, захищає маршрути (redirects для неавторизованих користувачів) та завантажує відповідні модулі сторінок."),
  emptyLine(),
  body("Папка pages/ містить JS-модулі для кожної сторінки застосунку: auth.js, dashboard.js, my-tests.js, create-test.js, take-test.js, results.js, sessions.js, profile.js."),
  emptyLine(),
  body("Файл supabase.js є адаптером для роботи з Supabase JavaScript SDK. Ініціалізує клієнт з конфігурацією (URL та anon-ключ), надає зручні функції для часто використовуваних операцій."),
  emptyLine(),
  body("Файл style.css містить всі стилі застосунку, організовані за методологією BEM (Block-Element-Modifier). Використовуються CSS Custom Properties для управління темою (кольорами, шрифтами, відступами)."),

  subsubTitle("4.1.2 Реалізація ключових функцій"),

  body("Система автентифікації реалізована з використанням Supabase Auth. Після успішного входу JWT-токен зберігається у localStorage, а сесія автоматично оновлюється бібліотекою Supabase. Перевірка сесії виконується при кожному завантаженні сторінки через слухач подій onAuthStateChange."),
  emptyLine(),
  body("Модуль управління тестами надає функції CRUD (Create, Read, Update, Delete) для роботи з тестами та питаннями. Операції виконуються через Supabase JavaScript SDK із застосуванням RLS-правил для забезпечення того, що викладач може редагувати лише власні тести."),
  emptyLine(),
  body("Модуль проходження тесту завантажує питання тесту, відображає їх по одному, фіксує відповіді у пам'яті та при завершенні надсилає пакетний запит на збереження результатів. Таймер реалізований через window.setInterval з автоматичним завершенням тесту при вичерпанні часу."),
  emptyLine(),
  body("Модуль групових сесій використовує Supabase Realtime (WebSocket-з'єднання) для відображення списку учасників у реальному часі. Викладач отримує push-повідомлення при кожному новому приєднанні студента."),
  emptyLine(),
  body("Система кодів доступу: при створенні тесту генерується унікальний 8-символьний буквено-цифровий код. При запуску сесії — 6-символьний код. Унікальність перевіряється через запит до бази даних."),

  subsubTitle("4.1.3 Безпека застосунку"),

  body("Безпека вебплатформи EduTest Pro забезпечується на кількох рівнях:"),
  emptyLine(),
  body("Row Level Security (RLS) у PostgreSQL. Для кожної таблиці визначені RLS-правила, що дозволяють або забороняють операції залежно від ролі та ідентифікатора поточного користувача (auth.uid()). Наприклад, викладач може редагувати лише свої тести, а студент може переглядати лише власні результати."),
  emptyLine(),
  body("Валідація на стороні клієнта. Всі форми перевіряються перед відправкою: обов'язковість заповнення полів, формат email, мінімальна довжина пароля, коректність числових значень."),
  emptyLine(),
  body("HTTPS. Vercel автоматично надає SSL-сертифікат для всіх розгорнутих застосунків, забезпечуючи шифрування трафіку між браузером і сервером."),
  emptyLine(),
  body("Захист від XSS. Всі дані, що відображаються в інтерфейсі, вставляються через textContent або el.innerText, а не через innerHTML, що унеможливлює ін'єкцію шкідливого коду."),
  emptyLine(),
  body("Змінні середовища. Ключ Supabase anon (публічний) та URL зберігаються у файлі конфігурації, а не в коді. Секретний service-role ключ ніколи не передається на клієнт."),

  subsectionTitle("4.2 Етапи налагодження та тестування"),

  subsubTitle("4.2.1 Стратегія тестування"),

  body("Тестування вебплатформи EduTest Pro проводилося поетапно з використанням різних видів тестування:"),
  emptyLine(),
  body("Модульне тестування (Unit Testing) — перевірка окремих функцій і модулів у ізольованому середовищі. Тестувалися функції обчислення результатів тестів, генерації кодів доступу, валідації форм."),
  emptyLine(),
  body("Інтеграційне тестування — перевірка взаємодії між модулями: коректність роботи роутера при переходах між сторінками, правильність збереження та отримання даних через Supabase API."),
  emptyLine(),
  body("Функціональне тестування — перевірка відповідності реалізованих функцій технічному завданню. Для кожного основного сценарію використання складено тест-кейс."),
  emptyLine(),
  body("Тестування безпеки — перевірка RLS-правил (чи не може студент отримати дані іншого студента), перевірка захисту маршрутів (чи перенаправляються неавторизовані користувачі)."),
  emptyLine(),
  body("Кросбраузерне тестування — перевірка коректного відображення та роботи у Chrome, Firefox, Edge, Safari та на мобільних пристроях iOS та Android."),
  emptyLine(),
  body("Навантажувальне тестування — імітація одночасної роботи кількох користувачів у груповій сесії для перевірки стабільності Realtime-з'єднань."),

  subsubTitle("4.2.2 Результати тестування"),

  body("Нижче наведено результати функціонального тестування основних сценаріїв:"),
  emptyLine(),

  makeTable(
    ["№", "Тест-кейс", "Очікуваний результат", "Фактичний результат", "Статус"],
    [
      ["1", "Реєстрація нового користувача", "Акаунт створено, перенаправлення на дашборд", "Відповідає", "Пройдено"],
      ["2", "Вхід з неправильним паролем", "Відображення повідомлення про помилку", "Відповідає", "Пройдено"],
      ["3", "Створення тесту з 5 питаннями", "Тест збережено, відображається в списку", "Відповідає", "Пройдено"],
      ["4", "Проходження тесту студентом", "Результат збережено та відображено", "Відповідає", "Пройдено"],
      ["5", "Запуск групової сесії", "Код сесії згенеровано, учасники можуть приєднатися", "Відповідає", "Пройдено"],
      ["6", "Спроба доступу до чужого тесту", "RLS-правило відхиляє запит", "Відповідає", "Пройдено"],
      ["7", "Відображення на мобільному", "Адаптивна верстка без горизонтального прокрутки", "Відповідає", "Пройдено"],
      ["8", "Тест із лімітом часу", "Автоматичне завершення після вичерпання часу", "Відповідає", "Пройдено"],
    ],
    [400, 2800, 2500, 2000, 1655]
  ),
  emptyLine(),
  body("За результатами тестування всі ключові функції платформи працюють відповідно до технічного завдання. Виявлені в процесі налагодження помилки були виправлені до фінального розгортання."),

  subsubTitle("4.2.3 Розгортання на Vercel"),

  body("Розгортання вебплатформи EduTest Pro виконано на платформі Vercel. Процес розгортання:"),
  numberedItem("1", "Код проєкту завантажено до репозиторію на GitHub."),
  numberedItem("2", "Репозиторій підключено до облікового запису Vercel через OAuth-авторизацію."),
  numberedItem("3", "У налаштуваннях проєкту Vercel задано змінні середовища: SUPABASE_URL та SUPABASE_ANON_KEY."),
  numberedItem("4", "Vercel автоматично виконує деплой при кожному push до гілки main."),
  numberedItem("5", "Застосунок доступний за HTTPS-адресою на домені vercel.app."),
  emptyLine(),
  body("Час першого завантаження сторінки становить менше 1.5 секунди завдяки глобальній CDN Vercel та мінімальному розміру статичних активів."),

  // ── РОЗДІЛ 5: ТЕХНІКО-ЕКОНОМІЧНІ ПОКАЗНИКИ ───────────────────
  sectionTitle("5 ТЕХНІКО-ЕКОНОМІЧНІ ПОКАЗНИКИ"),

  subsectionTitle("5.1 Розрахунок вартості програмного продукту"),

  body("Розрахунок вартості розробки вебплатформи EduTest Pro виконується за методикою розрахунку вартості програмного продукту для навчальних закладів."),
  emptyLine(),
  body("Витрати на розробку програмного продукту визначаються за формулою:"),
  emptyLine(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: LINE_SPACING, lineRule: "auto", before: 100, after: 100 },
    children: [new TextRun({ text: "С = Сзп + Сдод + Сам + Сел + Зн", font: FONT, size: FONT_SIZE, italics: true })]
  }),
  emptyLine(),
  body("де: Сзп — витрати на заробітну плату розробника; Сдод — додаткова заробітна плата (20–25% від Сзп); Сам — амортизація обладнання; Сел — витрати на електроенергію; Зн — накладні витрати (15–20% від прямих витрат)."),
  emptyLine(),
  body("Трудомісткість розробки. Оцінка трудомісткості виконується методом функціональних точок. Основні складові розробки:"),
  emptyLine(),

  makeTable(
    ["Вид роботи", "Трудомісткість (год)", "Примітка"],
    [
      ["Аналіз вимог та проєктування", "32", "Технічне завдання, архітектура, БД"],
      ["Розробка фронтенду (HTML/CSS)", "48", "Усі сторінки та компоненти"],
      ["Розробка JavaScript (логіка)", "64", "Роутер, модулі, інтеграція Supabase"],
      ["Налаштування бази даних", "16", "Схема, RLS-правила, індекси"],
      ["Тестування та налагодження", "24", "Функціональне, кросбраузерне, безпека"],
      ["Документування", "32", "Пояснювальна записка"],
      ["Розгортання та налаштування", "8", "Vercel, змінні середовища"],
      ["Разом", "224", ""],
    ],
    [3500, 2200, 3655]
  ),
  emptyLine(),
  body("Розрахунок витрат на заробітну плату:"),
  emptyLine(),
  body("Тарифна ставка розробника категорії «junior–middle» становить орієнтовно 120 грн/год. Відповідно:"),
  emptyLine(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: LINE_SPACING, lineRule: "auto" },
    children: [new TextRun({ text: "Сзп = 224 год × 120 грн/год = 26 880 грн", font: FONT, size: FONT_SIZE })]
  }),
  emptyLine(),
  body("Додаткова заробітна плата (22%):"),
  emptyLine(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: LINE_SPACING, lineRule: "auto" },
    children: [new TextRun({ text: "Сдод = 26 880 × 0,22 = 5 913,60 грн", font: FONT, size: FONT_SIZE })]
  }),
  emptyLine(),
  body("Амортизація обладнання. Вартість комп'ютера — 35 000 грн, термін служби — 5 років (1 825 робочих днів). Денна амортизація: 35 000 / 1 825 = 19,18 грн/день. Час розробки: 224 год / 8 год/день = 28 днів."),
  emptyLine(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: LINE_SPACING, lineRule: "auto" },
    children: [new TextRun({ text: "Сам = 19,18 × 28 = 537 грн", font: FONT, size: FONT_SIZE })]
  }),
  emptyLine(),
  body("Витрати на електроенергію. Споживання ПК з монітором — 0,3 кВт/год, тариф — 4,32 грн/кВт·год."),
  emptyLine(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: LINE_SPACING, lineRule: "auto" },
    children: [new TextRun({ text: "Сел = 0,3 × 224 × 4,32 = 290,30 грн", font: FONT, size: FONT_SIZE })]
  }),
  emptyLine(),
  body("Накладні витрати (18%):"),
  emptyLine(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: LINE_SPACING, lineRule: "auto" },
    children: [new TextRun({ text: "Зн = (26 880 + 5 913,60 + 537 + 290,30) × 0,18 = 33 620,90 × 0,18 = 6 051,76 грн", font: FONT, size: FONT_SIZE })]
  }),
  emptyLine(),
  body("Загальна собівартість розробки:"),
  emptyLine(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: LINE_SPACING, lineRule: "auto" },
    children: [new TextRun({ text: "С = 26 880 + 5 913,60 + 537 + 290,30 + 6 051,76 = 39 672,66 грн", font: FONT, size: FONT_SIZE })]
  }),
  emptyLine(),
  body("З урахуванням прибутку підприємства (20%) ціна програмного продукту становить:"),
  emptyLine(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: LINE_SPACING, lineRule: "auto" },
    children: [new TextRun({ text: "Ц = 39 672,66 × 1,2 = 47 607,19 грн", font: FONT, size: FONT_SIZE })]
  }),
  emptyLine(),
  body("Оскільки розробка виконується студентом у рамках дипломного проєкту, фактична вартість для коледжу дорівнює нулю, що є значною економічною перевагою."),

  subsectionTitle("5.2 Розрахунок економічної ефективності від впровадження програмного продукту"),

  body("Економічна ефективність від впровадження вебплатформи EduTest Pro визначається порівнянням витрат при ручному (паперовому) тестуванні та автоматизованому способі."),
  emptyLine(),
  body("Витрати при ручному тестуванні (до впровадження). Коледж проводить в середньому 50 тестових сесій на місяць. Кожна сесія включає:"),
  bulletItem("розробку та друк тестів: 2 год × 120 грн/год = 240 грн + витрати на папір (50 листів × 0,50 грн = 25 грн);"),
  bulletItem("перевірку відповідей: 2 год × 120 грн/год = 240 грн;"),
  bulletItem("введення результатів до журналу: 0,5 год × 120 грн/год = 60 грн."),
  emptyLine(),
  body("Витрати на одну сесію: 240 + 25 + 240 + 60 = 565 грн."),
  emptyLine(),
  body("Місячні витрати: 565 × 50 = 28 250 грн."),
  emptyLine(),
  body("Витрати при автоматизованому тестуванні (після впровадження). Викладач витрачає 30 хв на налаштування тесту в системі (одноразово). Повторне використання тесту — безкоштовне. Перевірка та підрахунок результатів — автоматичні."),
  emptyLine(),
  body("Операційні витрати на місяць:"),
  bulletItem("хостинг Vercel — 0 грн (безкоштовний тариф);"),
  bulletItem("Supabase — 0 грн (безкоштовний тариф до 500 МБ);"),
  bulletItem("час на налаштування нових тестів: 10 нових тестів × 0,5 год × 120 грн = 600 грн."),
  emptyLine(),
  body("Місячні витрати після впровадження: 600 грн."),
  emptyLine(),
  body("Річна економія:"),
  emptyLine(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: LINE_SPACING, lineRule: "auto" },
    children: [new TextRun({ text: "Е = (28 250 − 600) × 12 = 27 650 × 12 = 331 800 грн/рік", font: FONT, size: FONT_SIZE })]
  }),
  emptyLine(),
  body("Термін окупності розробки:"),
  emptyLine(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: LINE_SPACING, lineRule: "auto" },
    children: [new TextRun({ text: "Т = С / Е = 47 607,19 / 331 800 ≈ 0,14 року ≈ 1,7 місяці", font: FONT, size: FONT_SIZE })]
  }),
  emptyLine(),
  body("Таким чином, впровадження вебплатформи EduTest Pro окупається менш ніж за два місяці, що свідчить про високу економічну ефективність розробки."),
  emptyLine(),
  body("Додаткові якісні переваги від впровадження:"),
  bulletItem("миттєве отримання результатів після завершення тесту;"),
  bulletItem("зберігання повної історії тестувань для аналізу прогресу студентів;"),
  bulletItem("можливість проведення дистанційного тестування;"),
  bulletItem("зменшення використання паперу (екологічний ефект);"),
  bulletItem("зниження рівня помилок при підрахунку результатів."),

  // ── РОЗДІЛ 6: ОХОРОНА ПРАЦІ ───────────────────────────────────
  sectionTitle("6 ОХОРОНА ПРАЦІ"),

  subsectionTitle("6.1 Характеристика умов праці програміста"),

  body("Праця розробника програмного забезпечення належить до категорії розумової праці, пов'язаної з тривалою роботою за комп'ютером. Основні шкідливі та небезпечні виробничі фактори при роботі програміста:"),
  emptyLine(),
  body("Фізичні фактори:"),
  bulletItem("електромагнітне випромінювання від монітора, системного блоку та периферійних пристроїв;"),
  bulletItem("підвищений рівень шуму від охолоджувальних систем комп'ютерного обладнання;"),
  bulletItem("недостатня або надмірна освітленість робочого місця;"),
  bulletItem("підвищена або знижена вологість та температура повітря у приміщенні."),
  emptyLine(),
  body("Психофізіологічні фактори:"),
  bulletItem("нервово-психічне та зорове напруження при тривалій роботі за монітором;"),
  bulletItem("монотонність праці при виконанні однотипних операцій;"),
  bulletItem("статичне навантаження на м'язи шиї, спини та рук;"),
  bulletItem("розумове перевантаження при вирішенні складних алгоритмічних задач."),
  emptyLine(),
  body("Відповідно до ГОСТ 12.0.003-74 «Небезпечні та шкідливі виробничі фактори», умови праці програміста відносяться до категорії 2 — допустимі умови праці."),

  subsectionTitle("6.2 Вимоги до виробничих приміщень"),

  body("Приміщення для роботи з персональними комп'ютерами повинне відповідати вимогам ДСанПіН 3.3.2.007-98 «Державні санітарні правила і норми роботи з візуальними дисплейними терміналами електронно-обчислювальних машин»."),
  emptyLine(),
  body("Вимоги до площі та об'єму. На одне робоче місце з монітором повинно передбачатися не менше 6 м² площі та 20 м³ об'єму приміщення. Висота стелі — не менше 3 м."),
  emptyLine(),
  body("Вимоги до мікроклімату. Оптимальні значення параметрів мікроклімату для роботи з ПК:"),
  bulletItem("температура повітря: 22–24 °С у теплий період, 21–23 °С у холодний;"),
  bulletItem("відносна вологість: 40–60%;"),
  bulletItem("швидкість руху повітря: не більше 0,1 м/с."),
  emptyLine(),
  body("Вимоги до освітленості. Природне та штучне освітлення повинно відповідати СНіП ІІ-4-79. Загальне освітлення — рівномірне, з освітленістю не менше 300–500 лк на робочій поверхні. Монітор потрібно розміщувати так, щоб уникнути прямого засвічення від вікон та відблисків на екрані."),
  emptyLine(),
  body("Вимоги до шуму. Рівень шуму на робочих місцях, де виконується творча розумова робота, не повинен перевищувати 50 дБА."),

  subsectionTitle("6.3 Ергономічні вимоги до робочого місця програміста"),

  body("Робоче місце програміста має відповідати вимогам ГОСТ 12.2.032-78 «Робоче місце при виконанні робіт сидячи»."),
  emptyLine(),
  body("Робочий стіл. Висота робочої поверхні стола — 680–800 мм (залежно від зросту). Площа столу: не менше 1200×800 мм. Стіл повинен мати підставку для ніг розмірами не менше 300×400 мм."),
  emptyLine(),
  body("Робоче крісло. Крісло повинно бути підйомно-поворотним та регульованим за висотою (400–550 мм) та кутом нахилу спинки (95–110°). Сидіння повинно мати напівм'яке покриття з антистатичними властивостями."),
  emptyLine(),
  body("Розташування монітора. Відстань від очей до монітора — 600–700 мм. Верхній край монітора повинен знаходитися на рівні очей або на 15–20° нижче. Монітор розміщується перпендикулярно до вікна або під кутом не менше 45°."),
  emptyLine(),
  body("Клавіатура та маніпулятор. Клавіатура розміщується на відстані 100–300 мм від краю стола. Кут нахилу клавіатури — 5–15°. Маніпулятор «миша» розміщується в одній площині з клавіатурою та в межах досяжності руки."),

  subsectionTitle("6.4 Режим праці програміста"),

  body("Відповідно до ДСанПіН 3.3.2.007-98, при роботі з ВДТ встановлюється регламентований режим праці та відпочинку."),
  emptyLine(),
  body("При 8-годинному робочому дні регламентовані перерви встановлюються:"),
  bulletItem("через 2 години від початку робочого дня та через 2 години після обідньої перерви тривалістю 15 хвилин кожна."),
  emptyLine(),
  body("Фізичні вправи під час перерв. У регламентовані перерви рекомендується виконувати комплекс вправ для зняття напруги з очей, розминки шиї та спини:"),
  bulletItem("вправи для очей: кругові рухи очима, фокусування на ближніх та дальніх предметах — 5–7 хвилин;"),
  bulletItem("вправи для шиї: нахили та повороти голови — 3–5 хвилин;"),
  bulletItem("вправи для рук та плечового пояса: обертання, розтягування — 2–3 хвилини."),
  emptyLine(),
  body("Психологічне розвантаження. При роботі понад 4 години поспіль рекомендується 20-хвилинна перерва з відходом від комп'ютера. Рекомендується чергування різних видів роботи: програмування, читання документації, нарадна діяльність."),
  emptyLine(),
  body("Загальна тривалість роботи безпосередньо з ВДТ не повинна перевищувати 6 годин на день. Після закінчення роботи необхідно вимикати монітор і системний блок."),

  // ── ВИСНОВКИ ─────────────────────────────────────────────────
  new Paragraph({
    alignment: AlignmentType.CENTER,
    pageBreakBefore: true,
    spacing: { line: LINE_SPACING, lineRule: "auto", before: 0, after: 240 },
    children: [new TextRun({ text: "ВИСНОВКИ", font: FONT, size: FONT_SIZE, bold: true })]
  }),

  body("У дипломному проєкті вирішено актуальну задачу автоматизації процесу тестування знань у навчальних закладах шляхом розробки вебплатформи EduTest Pro."),
  emptyLine(),
  body("У ході виконання дипломного проєкту отримано такі результати:"),
  emptyLine(),
  body("1. Проведено аналіз існуючих систем онлайн-тестування (Google Forms, Kahoot!, Moodle). Виявлено, що жодна з розглянутих систем не задовольняє повністю потреби вітчизняних навчальних закладів за поєднанням функціональності, простоти використання та безкоштовності. Обґрунтовано доцільність розробки власного рішення."),
  emptyLine(),
  body("2. Складено технічне завдання на розробку вебплатформи EduTest Pro з визначенням вимог до функціональності, апаратного та програмного забезпечення."),
  emptyLine(),
  body("3. Спроєктовано архітектуру системи: клієнт-серверна архітектура на основі хмарних сервісів Vercel та Supabase. Розроблено схему бази даних PostgreSQL із 8 таблицями та системою Row Level Security для розмежування прав доступу."),
  emptyLine(),
  body("4. Реалізовано вебплатформу EduTest Pro з такими основними функціями:"),
  bulletItem("система автентифікації з підтримкою ролей TEACHER та STUDENT;"),
  bulletItem("конструктор тестів із питаннями типів «вибір із варіантів» та «вільна відповідь»;"),
  bulletItem("система кодів доступу для організації групових сесій;"),
  bulletItem("автоматичне обчислення та збереження результатів тестування;"),
  bulletItem("перегляд детальної історії проходжень;"),
  bulletItem("реальна часова трансляція стану групових сесій через Supabase Realtime;"),
  bulletItem("адаптивний дизайн для мобільних пристроїв."),
  emptyLine(),
  body("5. Виконано комплексне тестування платформи: функціональне, безпекове, кросбраузерне. Всі визначені тест-кейси успішно пройдено. Платформу розгорнуто на хостингу Vercel."),
  emptyLine(),
  body("6. Розраховано техніко-економічні показники. Собівартість розробки становить 39 672,66 грн. Річна економія від впровадження — 331 800 грн. Термін окупності — 1,7 місяця."),
  emptyLine(),
  body("7. Розглянуто питання охорони праці: визначено умови праці програміста, вимоги до виробничого приміщення та організації робочого місця, режим праці та відпочинку."),
  emptyLine(),
  body("Розроблена вебплатформа EduTest Pro відповідає всім вимогам технічного завдання та готова до впровадження в навчальний процес Кам'янець-Подільського фахового коледжу індустрії, бізнесу та інформаційних технологій."),
  emptyLine(),
  body("Подальший розвиток платформи може включати: додавання питань з мультимедійним вмістом (зображення, відео), розширену аналітику для викладачів, інтеграцію з системами управління навчанням (LMS), мобільний додаток на базі Progressive Web App (PWA)."),

  // ── СПИСОК ВИКОРИСТАНИХ ДЖЕРЕЛ ───────────────────────────────
  new Paragraph({
    alignment: AlignmentType.CENTER,
    pageBreakBefore: true,
    spacing: { line: LINE_SPACING, lineRule: "auto", before: 0, after: 240 },
    children: [new TextRun({ text: "СПИСОК ВИКОРИСТАНИХ ДЖЕРЕЛ", font: FONT, size: FONT_SIZE, bold: true })]
  }),

  body("1. Закон України «Про освіту» від 05.09.2017 № 2145-VIII. URL: https://zakon.rada.gov.ua/laws/show/2145-19 (дата звернення: 10.05.2026)."),
  emptyLine(),
  body("2. Биков В. Ю. Моделі організаційних систем відкритої освіти: монографія. Київ: Атіка, 2009. 684 с."),
  emptyLine(),
  body("3. Mozilla Developer Network. HTML5 Reference. URL: https://developer.mozilla.org/en-US/docs/Web/HTML (дата звернення: 15.05.2026)."),
  emptyLine(),
  body("4. Mozilla Developer Network. CSS Reference. URL: https://developer.mozilla.org/en-US/docs/Web/CSS (дата звернення: 15.05.2026)."),
  emptyLine(),
  body("5. ECMA International. ECMAScript 2020 Language Specification. URL: https://www.ecma-international.org/ecma-262/ (дата звернення: 15.05.2026)."),
  emptyLine(),
  body("6. Supabase Documentation. URL: https://supabase.com/docs (дата звернення: 20.05.2026)."),
  emptyLine(),
  body("7. Supabase. Row Level Security. URL: https://supabase.com/docs/guides/auth/row-level-security (дата звернення: 20.05.2026)."),
  emptyLine(),
  body("8. Vercel Documentation. URL: https://vercel.com/docs (дата звернення: 20.05.2026)."),
  emptyLine(),
  body("9. PostgreSQL Global Development Group. PostgreSQL 15 Documentation. URL: https://www.postgresql.org/docs/15/ (дата звернення: 22.05.2026)."),
  emptyLine(),
  body("10. Fowler M. Patterns of Enterprise Application Architecture. Addison-Wesley Professional, 2002. 560 с."),
  emptyLine(),
  body("11. Nielsen J. Usability Engineering. Morgan Kaufmann, 1994. 362 с."),
  emptyLine(),
  body("12. Norman D. The Design of Everyday Things. Basic Books, 2013. 368 с."),
  emptyLine(),
  body("13. Google Fonts. Times New Roman та шрифтові рішення для вебу. URL: https://fonts.google.com (дата звернення: 25.05.2026)."),
  emptyLine(),
  body("14. W3C. Web Content Accessibility Guidelines (WCAG) 2.1. URL: https://www.w3.org/TR/WCAG21/ (дата звернення: 25.05.2026)."),
  emptyLine(),
  body("15. OWASP. Top Ten Web Application Security Risks. URL: https://owasp.org/www-project-top-ten/ (дата звернення: 28.05.2026)."),
  emptyLine(),
  body("16. ДСанПіН 3.3.2.007-98. Державні санітарні правила і норми роботи з візуальними дисплейними терміналами електронно-обчислювальних машин. Київ: МОЗ України, 1998."),
  emptyLine(),
  body("17. ГОСТ 12.2.032-78. Робоче місце при виконанні робіт сидячи. Загальні ергономічні вимоги. Москва: Держстандарт, 1978."),
  emptyLine(),
  body("18. СНіП ІІ-4-79. Природне і штучне освітлення. Норми проєктування. Москва: Держбуд, 1980."),
  emptyLine(),
  body("19. Лаврищева К. М. Методи і засоби інженерії програмного забезпечення. Київ: Наукова думка, 2006. 736 с."),
  emptyLine(),
  body("20. Буч Г., Рамбо Дж., Якобсон А. Мова уніфікованого моделювання. Посібник користувача. Москва: ДМК Пресс, 2009. 496 с."),

  // ── ДОДАТКИ ──────────────────────────────────────────────────
  new Paragraph({
    alignment: AlignmentType.CENTER,
    pageBreakBefore: true,
    spacing: { line: LINE_SPACING, lineRule: "auto", before: 0, after: 240 },
    children: [new TextRun({ text: "ДОДАТКИ", font: FONT, size: FONT_SIZE, bold: true })]
  }),

  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: LINE_SPACING, lineRule: "auto", before: 0, after: 200 },
    children: [new TextRun({ text: "ДОДАТОК А", font: FONT, size: FONT_SIZE, bold: true })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: LINE_SPACING, lineRule: "auto", before: 0, after: 200 },
    children: [new TextRun({ text: "Алгоритм роботи застосунку", font: FONT, size: FONT_SIZE, bold: false })]
  }),
  emptyLine(),
  body("Схема алгоритму загального процесу роботи вебплатформи EduTest Pro описує послідовність дій від входу користувача до отримання результатів тестування."),
  emptyLine(),
  body("Початок → Перевірка сесії → [Сесія є?]:"),
  bulletItem("Так → Завантаження профілю → Визначення ролі → [TEACHER або STUDENT?]"),
  bulletItem("Ні → Форма входу/реєстрації → Автентифікація → Збереження токена → Завантаження профілю"),
  emptyLine(),
  body("Гілка TEACHER:"),
  bulletItem("Дашборд викладача → [Дія?]: Створити тест | Переглянути результати | Запустити сесію"),
  bulletItem("Створити тест → Форма тесту → Додати питання → Зберегти → Перейти до списку тестів"),
  bulletItem("Запустити сесію → Обрати тест → Генерація коду → Очікування учасників → Старт → Моніторинг → Завершення"),
  emptyLine(),
  body("Гілка STUDENT:"),
  bulletItem("Дашборд студента → [Дія?]: Пройти тест | Переглянути результати | Приєднатися за кодом"),
  bulletItem("Пройти тест → Завантаження питань → Старт таймера → Відповіді → Перевірка → Збереження → Результат"),
  emptyLine(),
  body("Кінець алгоритму → Вихід із системи або повернення до дашборду."),

  emptyLine(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    pageBreakBefore: true,
    spacing: { line: LINE_SPACING, lineRule: "auto", before: 0, after: 200 },
    children: [new TextRun({ text: "ДОДАТОК Б", font: FONT, size: FONT_SIZE, bold: true })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: LINE_SPACING, lineRule: "auto", before: 0, after: 200 },
    children: [new TextRun({ text: "Екранні форми платформи EduTest Pro", font: FONT, size: FONT_SIZE, bold: false })]
  }),
  emptyLine(),
  body("Б.1 Форма автентифікації"),
  emptyLine(),
  body("Форма автентифікації розташована по центру сторінки на темному або світлому фоні залежно від системних налаштувань браузера (підтримка prefers-color-scheme). Містить:"),
  bulletItem("логотип EduTest Pro (SVG, масштабований);"),
  bulletItem("заголовок «Увійти» або «Зареєструватися» залежно від активної вкладки;"),
  bulletItem("поле email з валідацією (type=\"email\");"),
  bulletItem("поле пароля з кнопкою показу/приховування;"),
  bulletItem("перемикач ролі «Викладач / Студент» — відображається лише при реєстрації;"),
  bulletItem("поле «Повне ім'я» — відображається лише при реєстрації;"),
  bulletItem("кнопку підтвердження з лоадером при обробці запиту;"),
  bulletItem("посилання на перемикання між режимами входу та реєстрації."),
  emptyLine(),
  body("Б.2 Конструктор тесту"),
  emptyLine(),
  body("Конструктор тесту організований у вигляді двоколонкового макету на широких екранах та однoколонкового на мобільних."),
  emptyLine(),
  body("Ліва колонка — загальна інформація про тест:"),
  bulletItem("поле «Назва тесту» (обов'язкове, до 200 символів);"),
  bulletItem("поле «Опис» (необов'язкове, textarea);"),
  bulletItem("перемикач «Публічний / Приватний»;"),
  bulletItem("поле «Обмеження часу» в хвилинах (0 = без обмеження);"),
  bulletItem("код доступу (генерується автоматично, можна перегенерувати)."),
  emptyLine(),
  body("Права колонка — список питань:"),
  bulletItem("кожне питання — картка з порядковим номером та текстом;"),
  bulletItem("кнопки «Редагувати» та «Видалити» для кожного питання;"),
  bulletItem("кнопка «+ Додати питання» внизу списку;"),
  bulletItem("при натисканні «Редагувати» відкривається вбудована форма редагування питання."),
  emptyLine(),
  body("Б.3 Інтерфейс проходження тесту"),
  emptyLine(),
  body("Повноекранний інтерфейс без відволікаючих елементів навігації:"),
  bulletItem("верхня смуга: назва тесту, номер питання (n/total), таймер;"),
  bulletItem("прогрес-бар: горизонтальна смуга від 0 до 100%;"),
  bulletItem("основна область: текст питання великим шрифтом;"),
  bulletItem("варіанти відповідей: картки, що підсвічуються при виборі;"),
  bulletItem("кнопки навігації: «← Назад», «Далі →», «Завершити тест» (на останньому питанні)."),

  emptyLine(),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    pageBreakBefore: true,
    spacing: { line: LINE_SPACING, lineRule: "auto", before: 0, after: 200 },
    children: [new TextRun({ text: "ДОДАТОК В", font: FONT, size: FONT_SIZE, bold: true })]
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { line: LINE_SPACING, lineRule: "auto", before: 0, after: 200 },
    children: [new TextRun({ text: "Фрагменти програмного коду", font: FONT, size: FONT_SIZE, bold: false })]
  }),
  emptyLine(),
  body("В.1 Ініціалізація Supabase та автентифікація"),
  emptyLine(),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 240, lineRule: "auto", before: 100, after: 100 },
    indent: { left: 720 },
    children: [new TextRun({
      text: "import { createClient } from '@supabase/supabase-js';",
      font: "Courier New", size: 22
    })]
  }),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 240, lineRule: "auto" },
    indent: { left: 720 },
    children: [new TextRun({
      text: "const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);",
      font: "Courier New", size: 22
    })]
  }),
  emptyLine(),
  body("В.2 Функція входу користувача"),
  emptyLine(),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 240, lineRule: "auto", before: 0, after: 0 },
    indent: { left: 720 },
    children: [new TextRun({ text: "async function signIn(email, password) {", font: "Courier New", size: 22 })]
  }),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 240, lineRule: "auto", before: 0, after: 0 },
    indent: { left: 1080 },
    children: [new TextRun({ text: "const { data, error } = await supabase.auth.signInWithPassword({", font: "Courier New", size: 22 })]
  }),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 240, lineRule: "auto", before: 0, after: 0 },
    indent: { left: 1440 },
    children: [new TextRun({ text: "email, password", font: "Courier New", size: 22 })]
  }),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 240, lineRule: "auto", before: 0, after: 0 },
    indent: { left: 1080 },
    children: [new TextRun({ text: "});", font: "Courier New", size: 22 })]
  }),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 240, lineRule: "auto", before: 0, after: 0 },
    indent: { left: 1080 },
    children: [new TextRun({ text: "if (error) throw error;", font: "Courier New", size: 22 })]
  }),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 240, lineRule: "auto", before: 0, after: 0 },
    indent: { left: 1080 },
    children: [new TextRun({ text: "return data;", font: "Courier New", size: 22 })]
  }),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 240, lineRule: "auto", before: 0, after: 100 },
    indent: { left: 720 },
    children: [new TextRun({ text: "}", font: "Courier New", size: 22 })]
  }),
  emptyLine(),
  body("В.3 Збереження результатів тестування"),
  emptyLine(),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 240, lineRule: "auto", before: 0, after: 0 },
    indent: { left: 720 },
    children: [new TextRun({ text: "async function saveResult(testId, answers, score, maxScore) {", font: "Courier New", size: 22 })]
  }),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 240, lineRule: "auto", before: 0, after: 0 },
    indent: { left: 1080 },
    children: [new TextRun({ text: "const { data: result } = await supabase", font: "Courier New", size: 22 })]
  }),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 240, lineRule: "auto", before: 0, after: 0 },
    indent: { left: 1440 },
    children: [new TextRun({ text: ".from('results')", font: "Courier New", size: 22 })]
  }),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 240, lineRule: "auto", before: 0, after: 0 },
    indent: { left: 1440 },
    children: [new TextRun({ text: ".insert({ test_id: testId, score, max_score: maxScore })", font: "Courier New", size: 22 })]
  }),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 240, lineRule: "auto", before: 0, after: 0 },
    indent: { left: 1440 },
    children: [new TextRun({ text: ".select().single();", font: "Courier New", size: 22 })]
  }),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 240, lineRule: "auto", before: 0, after: 0 },
    indent: { left: 1080 },
    children: [new TextRun({ text: "// Збереження відповідей студента", font: "Courier New", size: 22 })]
  }),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 240, lineRule: "auto", before: 0, after: 0 },
    indent: { left: 1080 },
    children: [new TextRun({ text: "await supabase.from('result_answers').insert(", font: "Courier New", size: 22 })]
  }),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 240, lineRule: "auto", before: 0, after: 0 },
    indent: { left: 1440 },
    children: [new TextRun({ text: "answers.map(a => ({ result_id: result.id, ...a }))", font: "Courier New", size: 22 })]
  }),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 240, lineRule: "auto", before: 0, after: 100 },
    indent: { left: 1080 },
    children: [new TextRun({ text: ");", font: "Courier New", size: 22 })]
  }),
  new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 240, lineRule: "auto", before: 0, after: 100 },
    indent: { left: 720 },
    children: [new TextRun({ text: "}", font: "Courier New", size: 22 })]
  }),

];

// ─── BUILD DOCUMENT ───────────────────────────────────────────────

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: FONT, size: FONT_SIZE },
        paragraph: { spacing: { line: LINE_SPACING, lineRule: "auto" } }
      }
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: FONT_SIZE, bold: true, font: FONT, color: "000000" },
        paragraph: {
          spacing: { line: LINE_SPACING, lineRule: "auto", before: 240, after: 240 },
          outlineLevel: 0,
        }
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: FONT_SIZE, bold: true, font: FONT, color: "000000" },
        paragraph: {
          spacing: { line: LINE_SPACING, lineRule: "auto", before: 200, after: 100 },
          outlineLevel: 1,
        }
      },
      {
        id: "Heading3",
        name: "Heading 3",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: FONT_SIZE, bold: true, font: FONT, color: "000000", italics: false },
        paragraph: {
          spacing: { line: LINE_SPACING, lineRule: "auto", before: 160, after: 80 },
          outlineLevel: 2,
        }
      },
    ]
  },

  numbering: {
    config: []
  },

  sections: [
    {
      properties: {
        page: {
          size: {
            width: PAGE_WIDTH,
            height: PAGE_HEIGHT,
          },
          margin: {
            top: MARGIN_TOP,
            bottom: MARGIN_BOTTOM,
            left: MARGIN_LEFT,
            right: MARGIN_RIGHT,
            header: 600,
            footer: 600,
          }
        }
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  children: [PageNumber.CURRENT],
                  font: FONT,
                  size: FONT_SIZE,
                })
              ]
            })
          ]
        })
      },
      children: children,
    }
  ]
});

// ─── WRITE FILE ───────────────────────────────────────────────────
const OUTPUT_PATH = "C:/Users/GameOn/Desktop/ДП/Диплом_Гебрин.docx";

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(OUTPUT_PATH, buffer);
  console.log("SUCCESS: File written to", OUTPUT_PATH);
  console.log("File size:", buffer.length, "bytes");
}).catch(err => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
