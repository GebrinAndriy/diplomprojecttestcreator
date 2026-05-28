// --- TOAST NOTIFICATIONS ---
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success'
        ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`
        : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    toast.innerHTML = `<div class="toast-icon">${icon}</div><div class="toast-content">${message}</div><button class="toast-close"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></button>`;
    container.appendChild(toast);
    const removeToast = () => { toast.classList.add('hiding'); toast.addEventListener('animationend', () => toast.remove()); };
    toast.querySelector('.toast-close').addEventListener('click', removeToast);
    setTimeout(removeToast, 4000);
}

// --- UTILS ---
function getInitials(name) { return !name ? 'U' : name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(); }
function generateJoinCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'; let code = '';
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
}
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// --- SUPABASE CLIENT ---
const { createClient } = window.supabase;
const db = createClient(
    'https://ofoqwqnrknlhjnzwpzac.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9mb3F3cW5ya25saGpuendwemFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MjEwMjgsImV4cCI6MjA5NTQ5NzAyOH0.OH2E92cPmmzlHpf0aB4ZLe2qMO5G0Lr_l5V1ZH0rh4k'
);

const SESSION_KEY = 'eduTestPro_currentUser';

// In-memory caches (loaded from Supabase at startup)
let testsCache = [];
let usersCache = [];

// --- DATA MAPPERS (camelCase JS <-> snake_case DB) ---
function testToDb(t) {
    return {
        id: t.id,
        author_id: t.authorId,
        author_name: t.authorName,
        join_code: t.joinCode,
        title: t.title,
        description: t.description || null,
        cover_image: t.coverImage || null,
        time_limit: t.timeLimit || null,
        questions: t.questions,
        is_public: t.isPublic !== false,
        created_at: t.createdAt || new Date().toISOString(),
        cloned_from_id: t.clonedFromId || null,
        is_edited: t.isEdited || false
    };
}
function testFromDb(r) {
    return {
        id: r.id,
        authorId: r.author_id,
        authorName: r.author_name,
        joinCode: r.join_code,
        title: r.title,
        description: r.description,
        coverImage: r.cover_image,
        timeLimit: r.time_limit,
        questions: r.questions || [],
        isPublic: r.is_public,
        createdAt: r.created_at,
        clonedFromId: r.cloned_from_id,
        isEdited: r.is_edited
    };
}
function userToDb(u) {
    return { id: u.id, name: u.name, email: u.email, password: u.password, role: u.role, avatar: u.avatar || null };
}
function userFromDb(r) {
    return { id: r.id, name: r.name, email: r.email, password: r.password, role: r.role, avatar: r.avatar };
}

// --- DB OPERATIONS ---
async function loadTests() {
    const { data, error } = await db.from('tests').select('*').order('created_at', { ascending: false });
    if (error) { console.error('loadTests:', error); return; }
    testsCache = (data || []).map(testFromDb);
}
async function loadUsers() {
    const { data, error } = await db.from('users').select('*');
    if (error) { console.error('loadUsers:', error); return; }
    usersCache = (data || []).map(userFromDb);
}
async function seedInitialData() {
    const { data, error: selErr } = await db.from('tests').select('id').limit(1);
    if (selErr) return;
    if (data && data.length > 0) return;
    const toInsert = initialTests.map(t => testToDb({ ...t, isPublic: true }));
    const { error } = await db.from('tests').insert(toInsert);
    if (error) console.error('seed error:', error.message);
}
function getTests() { return testsCache; }
async function saveTest(test) {
    const { error } = await db.from('tests').insert(testToDb(test));
    if (error) { console.error('saveTest:', error); showToast('Помилка збереження тесту', 'error'); return false; }
    await loadTests();
    return true;
}
async function updateTestInDb(test) {
    const { error } = await db.from('tests').update(testToDb(test)).eq('id', test.id);
    if (error) { console.error('updateTest:', error); showToast('Помилка оновлення тесту', 'error'); return false; }
    await loadTests();
    return true;
}
async function deleteTest(id) {
    const { error } = await db.from('tests').delete().eq('id', id);
    if (error) { console.error('deleteTest:', error); showToast('Помилка видалення', 'error'); return; }
    await loadTests();
    renderTeacherTests();
}
async function saveResult(testId, testTitle, authorId, joinCode, score, total, percentage, timeTakenStr) {
    const { error } = await db.from('history').insert({
        user_id: currentUser.id,
        user_name: currentUser.name,
        test_id: testId,
        test_title: testTitle,
        author_id: authorId,
        join_code: joinCode,
        score, total, percentage,
        time_taken: timeTakenStr,
        group_id: currentGroupId || null,
        group_name: currentGroupName || null
    });
    if (error) console.error('saveResult:', error);
}

async function renderGroupsSection(testId, isOwner) {
    const section = document.getElementById('detail-groups-section');
    if (!isOwner) { section.classList.add('hidden'); return; }
    section.classList.remove('hidden');

    const { data: groups } = await db.from('groups').select('*').eq('test_id', testId).order('created_at', { ascending: true });
    const list = document.getElementById('detail-groups-list');
    list.innerHTML = '';

    if (!groups || groups.length === 0) {
        list.innerHTML = '<p class="text-muted text-sm">Груп ще немає. Додайте групу — кожна отримає свій унікальний код.</p>';
    } else {
        groups.forEach(g => {
            const card = document.createElement('div');
            card.className = 'history-card flex-between mb-2';
            card.style.alignItems = 'flex-start';
            card.innerHTML = `
                <div style="padding-bottom:0.25rem;">
                    <div class="font-medium">${g.group_name}</div>
                    <div class="text-sm text-muted mt-1" style="display:flex;align-items:center;gap:0.5rem;">
                        Код групи:
                        <span style="font-family:monospace;letter-spacing:2px;font-weight:700;color:var(--primary);font-size:1rem;">${g.join_code}</span>
                        <button class="text-btn text-primary btn-copy-code" data-code="${g.join_code}" style="font-size:0.8rem;">📋 Копіювати</button>
                    </div>
                </div>
                <button class="icon-btn text-error btn-delete-group" data-id="${g.id}" title="Видалити групу">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14H6L5 6"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>`;
            list.appendChild(card);
        });
        list.querySelectorAll('.btn-copy-code').forEach(btn => {
            btn.addEventListener('click', () => { navigator.clipboard?.writeText(btn.dataset.code); showToast('Код скопійовано!'); });
        });
        list.querySelectorAll('.btn-delete-group').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Видалити групу?')) return;
                await db.from('groups').delete().eq('id', btn.dataset.id);
                await renderGroupsSection(testId, isOwner);
                showToast('Групу видалено');
            });
        });
    }

    const btnAdd = document.getElementById('btn-add-group');
    const newBtnAdd = btnAdd.cloneNode(true);
    btnAdd.parentNode.replaceChild(newBtnAdd, btnAdd);
    newBtnAdd.addEventListener('click', () => {
        document.getElementById('group-add-form').classList.remove('hidden');
        document.getElementById('group-name-input').focus();
    });
    document.getElementById('btn-cancel-add-group').onclick = () => {
        document.getElementById('group-add-form').classList.add('hidden');
        document.getElementById('group-name-input').value = '';
    };
    document.getElementById('btn-confirm-add-group').onclick = async () => {
        const name = document.getElementById('group-name-input').value.trim();
        if (!name) { showToast('Введіть назву групи', 'error'); return; }
        const code = generateJoinCode();
        const { error } = await db.from('groups').insert({ test_id: testId, teacher_id: currentUser.id, group_name: name, join_code: code });
        if (error) { showToast('Помилка створення групи', 'error'); return; }
        document.getElementById('group-add-form').classList.add('hidden');
        document.getElementById('group-name-input').value = '';
        await renderGroupsSection(testId, isOwner);
        showToast(`Групу "${name}" створено! Код: ${code}`);
    };
}

// --- INITIAL TEST DATA ---
const initialTests = [
    {
        id: 'test_1', authorId: 'admin', authorName: 'Адміністратор', joinCode: 'HTML99',
        title: 'Основи Web Розробки', description: 'Комплексний тест для перевірки знань HTML та CSS: структура документу, теги, стилізація, блочна модель та семантика.',
        coverImage: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=800&auto=format&fit=crop',
        timeLimit: 20, createdAt: new Date().toISOString(),
        questions: [
            { type: 'multiple', text: 'Який тег використовується для створення гіперпосилання?', options: [{text: '<a>', isCorrect: true}, {text: '<link>', isCorrect: false}, {text: '<href>', isCorrect: false}, {text: '<nav>', isCorrect: false}] },
            { type: 'multiple', text: 'Які з цих властивостей CSS впливають на шрифт? (Кілька відповідей)', options: [{text: 'font-size', isCorrect: true}, {text: 'color', isCorrect: false}, {text: 'font-weight', isCorrect: true}, {text: 'margin', isCorrect: false}] },
            { type: 'text', text: 'Як розшифровується CSS?', correctText: 'Cascading Style Sheets' },
            { type: 'multiple', text: 'Який тег HTML використовується для найбільшого заголовку?', options: [{text: '<h6>', isCorrect: false}, {text: '<h1>', isCorrect: true}, {text: '<header>', isCorrect: false}, {text: '<title>', isCorrect: false}] },
            { type: 'multiple', text: 'Яку роль відіграє атрибут alt у тегу <img>?', options: [{text: 'Задає розмір зображення', isCorrect: false}, {text: 'Відображає текст, якщо зображення не завантажилось', isCorrect: true}, {text: 'Вказує URL зображення', isCorrect: false}, {text: 'Задає рамку навколо зображення', isCorrect: false}] },
            { type: 'multiple', text: 'Яка властивість CSS задає колір фону елемента?', options: [{text: 'color', isCorrect: false}, {text: 'background-color', isCorrect: true}, {text: 'fill', isCorrect: false}, {text: 'bg', isCorrect: false}] },
            { type: 'multiple', text: 'Яке значення display робить елемент флекс-контейнером?', options: [{text: 'block', isCorrect: false}, {text: 'inline', isCorrect: false}, {text: 'flex', isCorrect: true}, {text: 'grid', isCorrect: false}] },
            { type: 'multiple', text: 'Які з цих тегів є семантичними HTML5? (Кілька відповідей)', options: [{text: '<article>', isCorrect: true}, {text: '<div>', isCorrect: false}, {text: '<section>', isCorrect: true}, {text: '<span>', isCorrect: false}] },
            { type: 'multiple', text: 'Яка властивість CSS відповідає за прозорість елемента?', options: [{text: 'visibility', isCorrect: false}, {text: 'transparent', isCorrect: false}, {text: 'opacity', isCorrect: true}, {text: 'alpha', isCorrect: false}] },
            { type: 'text', text: 'Яка CSS властивість використовується для задання відступу всередині елемента (між вмістом та рамкою)?', correctText: 'padding' },
            { type: 'multiple', text: 'Який атрибут тегу <form> вказує метод відправки даних?', options: [{text: 'action', isCorrect: false}, {text: 'type', isCorrect: false}, {text: 'method', isCorrect: true}, {text: 'send', isCorrect: false}] },
            { type: 'text', text: 'Яка одиниця виміру в CSS відповідає розміру шрифту батьківського елемента?', correctText: 'em' }
        ]
    },
    {
        id: 'test_2', authorId: 'admin', authorName: 'Адміністратор', joinCode: 'JS2024',
        title: 'JavaScript ES6+', description: 'Комплексна перевірка сучасних можливостей мови JavaScript: синтаксис ES6+, масиви, функції, асинхронність та типи даних.',
        coverImage: 'https://images.unsplash.com/photo-1555099962-4199c345e5dd?q=80&w=800&auto=format&fit=crop',
        timeLimit: 20, createdAt: new Date(Date.now() - 86400000).toISOString(),
        questions: [
            { type: 'multiple', text: 'Як оголосити змінну, яку не можна переприсвоїти?', options: [{text: 'let', isCorrect: false}, {text: 'const', isCorrect: true}, {text: 'var', isCorrect: false}, {text: 'static', isCorrect: false}] },
            { type: 'text', text: 'Яке ключове слово використовується для створення функції?', correctText: 'function' },
            { type: 'multiple', text: 'Що таке стрілкова функція (Arrow Function)?', options: [{text: 'Функція зі скороченим синтаксисом через =>', isCorrect: true}, {text: 'Функція, що повертає масив', isCorrect: false}, {text: 'Рекурсивна функція', isCorrect: false}, {text: 'Анонімна функція в об\'єкті', isCorrect: false}] },
            { type: 'multiple', text: 'Що повертає typeof null в JavaScript?', options: [{text: '"null"', isCorrect: false}, {text: '"undefined"', isCorrect: false}, {text: '"object"', isCorrect: true}, {text: '"boolean"', isCorrect: false}] },
            { type: 'multiple', text: 'Що робить метод Array.prototype.map()?', options: [{text: 'Фільтрує елементи масиву', isCorrect: false}, {text: 'Повертає новий масив після трансформації кожного елемента', isCorrect: true}, {text: 'Знаходить індекс елемента', isCorrect: false}, {text: 'Сортує масив', isCorrect: false}] },
            { type: 'multiple', text: 'Яка різниця між === та == у JavaScript?', options: [{text: '=== порівнює лише значення, == порівнює тип', isCorrect: false}, {text: '=== порівнює значення і тип без перетворення, == з приведенням типів', isCorrect: true}, {text: 'Різниці немає', isCorrect: false}, {text: '=== тільки для рядків', isCorrect: false}] },
            { type: 'multiple', text: 'Що таке Promise у JavaScript?', options: [{text: 'Об\'єкт для роботи з асинхронними операціями', isCorrect: true}, {text: 'Тип масиву', isCorrect: false}, {text: 'Функція зворотного виклику', isCorrect: false}, {text: 'Метод рядка', isCorrect: false}] },
            { type: 'text', text: 'Яке ключове слово повертає значення з функції?', correctText: 'return' },
            { type: 'multiple', text: 'Який метод масиву додає елемент у кінець?', options: [{text: 'push()', isCorrect: true}, {text: 'pop()', isCorrect: false}, {text: 'shift()', isCorrect: false}, {text: 'append()', isCorrect: false}] },
            { type: 'multiple', text: 'Для чого призначений async/await?', options: [{text: 'Для роботи з DOM', isCorrect: false}, {text: 'Для написання асинхронного коду у синхронному стилі', isCorrect: true}, {text: 'Для оголошення змінних', isCorrect: false}, {text: 'Для обробки помилок', isCorrect: false}] },
            { type: 'multiple', text: 'Що таке деструктуризація в JavaScript?', options: [{text: 'Видалення властивостей об\'єкта', isCorrect: false}, {text: 'Синтаксис для витягування значень з масивів/об\'єктів у змінні', isCorrect: true}, {text: 'Перетворення об\'єкта в рядок', isCorrect: false}, {text: 'Копіювання масиву', isCorrect: false}] },
            { type: 'text', text: 'Яка функція перетворює рядок JSON у JavaScript об\'єкт?', correctText: 'JSON.parse' }
        ]
    },
    {
        id: 'test_3', authorId: 'admin', authorName: 'Адміністратор', joinCode: 'UIUX01',
        title: 'Основи UI/UX Дизайну', description: 'Комплексний тест на розуміння принципів побудови зручних інтерфейсів, дизайн-мислення, прототипування та юзабіліті.',
        coverImage: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=800&auto=format&fit=crop',
        timeLimit: 25, createdAt: new Date(Date.now() - 172800000).toISOString(),
        questions: [
            { type: 'text', text: 'Що означає U у слові UI?', correctText: 'User' },
            { type: 'multiple', text: 'Для чого потрібні wireframes?', options: [{text: 'Для фінального рендеру дизайну', isCorrect: false}, {text: 'Для схематичного планування структури та розміщення елементів', isCorrect: true}, {text: 'Для написання коду', isCorrect: false}, {text: 'Для тестування продуктивності', isCorrect: false}] },
            { type: 'multiple', text: 'Що вивчає UX дизайн?', options: [{text: 'Лише зовнішній вигляд продукту', isCorrect: false}, {text: 'Досвід та відчуття користувача під час взаємодії з продуктом', isCorrect: true}, {text: 'Технічну реалізацію інтерфейсу', isCorrect: false}, {text: 'Монетизацію продукту', isCorrect: false}] },
            { type: 'multiple', text: 'Що таке A/B тестування в UX?', options: [{text: 'Порівняння двох версій дизайну для виявлення кращої', isCorrect: true}, {text: 'Перевірка сумісності з браузерами', isCorrect: false}, {text: 'Тестування навантаження сервера', isCorrect: false}, {text: 'Перевірка кольорів дизайну', isCorrect: false}] },
            { type: 'multiple', text: 'Яка мета прототипування в UX-процесі?', options: [{text: 'Написання фінального коду', isCorrect: false}, {text: 'Рання перевірка ідей та виявлення проблем до розробки', isCorrect: true}, {text: 'Маркетинг продукту', isCorrect: false}, {text: 'Оптимізація бази даних', isCorrect: false}] },
            { type: 'multiple', text: 'Що таке Affordance в UX?', options: [{text: 'Колірна схема інтерфейсу', isCorrect: false}, {text: 'Властивість об\'єкта, що підказує, як ним користуватись', isCorrect: true}, {text: 'Час завантаження сторінки', isCorrect: false}, {text: 'Розмір шрифту', isCorrect: false}] },
            { type: 'multiple', text: 'Скільки основних кольорів рекомендують використовувати в UI для уникнення перевантаження?', options: [{text: '1-2', isCorrect: false}, {text: '2-3', isCorrect: true}, {text: '5-7', isCorrect: false}, {text: '10+', isCorrect: false}] },
            { type: 'multiple', text: 'Що таке навігаційний "хлібний шлях" (Breadcrumb)?', options: [{text: 'Анімація переходу між сторінками', isCorrect: false}, {text: 'Ланцюжок посилань, що показує поточне розташування в структурі сайту', isCorrect: true}, {text: 'Бічна панель навігації', isCorrect: false}, {text: 'Спадне меню', isCorrect: false}] },
            { type: 'multiple', text: 'Який принцип дизайну означає, що схожі елементи повинні виглядати однаково?', options: [{text: 'Контраст', isCorrect: false}, {text: 'Узгодженість (Consistency)', isCorrect: true}, {text: 'Ієрархія', isCorrect: false}, {text: 'Баланс', isCorrect: false}] },
            { type: 'text', text: 'Як називається метод дослідження, при якому спостерігають за реальним користувачем, що виконує завдання в інтерфейсі?', correctText: 'Юзабіліті-тестування' },
            { type: 'multiple', text: 'Що таке "пустий стан" (Empty State) в дизайні інтерфейсів?', options: [{text: 'Сторінка з помилкою 404', isCorrect: false}, {text: 'Екран, що відображається, коли даних ще немає (наприклад, порожній кошик)', isCorrect: true}, {text: 'Форма без заповнених полів', isCorrect: false}, {text: 'Головна сторінка сайту', isCorrect: false}] },
            { type: 'multiple', text: 'Який формат файлів найчастіше використовується для передачі дизайн-макетів розробникам?', options: [{text: 'PSD', isCorrect: false}, {text: 'Figma / .fig', isCorrect: true}, {text: 'DOCX', isCorrect: false}, {text: 'SVG', isCorrect: false}] }
        ]
    },
    {
        id: 'test_4', authorId: 'admin', authorName: 'Адміністратор', joinCode: 'REACT1',
        title: 'Основи React.js', description: 'Комплексний тест на базові концепції бібліотеки React: компоненти, стан, пропси, хуки та Virtual DOM.',
        coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800&auto=format&fit=crop',
        timeLimit: 20, createdAt: new Date(Date.now() - 259200000).toISOString(),
        questions: [
            { type: 'multiple', text: 'Що таке JSX?', options: [{text: 'JavaScript XML — синтаксичне розширення для написання HTML у JS', isCorrect: true}, {text: 'Java Syntax Extension', isCorrect: false}, {text: 'Окремий фреймворк', isCorrect: false}, {text: 'JSON Extended', isCorrect: false}] },
            { type: 'text', text: 'Який хук використовується для управління станом (state) у функціональному компоненті?', correctText: 'useState' },
            { type: 'multiple', text: 'Що таке Virtual DOM у React?', options: [{text: 'База даних компонентів', isCorrect: false}, {text: 'Легка копія реального DOM для оптимізації рендеру', isCorrect: true}, {text: 'Файл конфігурації', isCorrect: false}, {text: 'CSS-бібліотека', isCorrect: false}] },
            { type: 'multiple', text: 'Чим відрізняється state від props?', options: [{text: 'State — внутрішній стан компонента, props — дані від батька', isCorrect: true}, {text: 'Props — внутрішній стан, state — від батька', isCorrect: false}, {text: 'Різниці немає', isCorrect: false}, {text: 'State лише для класових компонентів', isCorrect: false}] },
            { type: 'multiple', text: 'Що робить хук useEffect?', options: [{text: 'Виконує побічні ефекти (запити, підписки) після рендеру', isCorrect: true}, {text: 'Змінює стан компонента', isCorrect: false}, {text: 'Передає дані між компонентами', isCorrect: false}, {text: 'Анімує елементи', isCorrect: false}] },
            { type: 'multiple', text: 'Що таке React Fragment?', options: [{text: 'Хук для роботи з DOM', isCorrect: false}, {text: 'Обгортка для кількох елементів без зайвого DOM-вузла', isCorrect: true}, {text: 'Тип компонента', isCorrect: false}, {text: 'Метод оптимізації', isCorrect: false}] },
            { type: 'multiple', text: 'Яка функція React рендерить компонент у реальний DOM?', options: [{text: 'React.render()', isCorrect: false}, {text: 'ReactDOM.createRoot().render()', isCorrect: true}, {text: 'document.render()', isCorrect: false}, {text: 'React.mount()', isCorrect: false}] },
            { type: 'multiple', text: 'Що таке HOC (Higher Order Component)?', options: [{text: 'Функція, що приймає компонент і повертає новий компонент з розширеною логікою', isCorrect: true}, {text: 'Компонент із великою кількістю props', isCorrect: false}, {text: 'Хук для роботи зі станом', isCorrect: false}, {text: 'Клас компонента', isCorrect: false}] },
            { type: 'text', text: 'Який хук React дозволяє підписатись на Context без використання Consumer?', correctText: 'useContext' },
            { type: 'multiple', text: 'Навіщо потрібен атрибут key при рендері списків у React?', options: [{text: 'Для стилізації елементів', isCorrect: false}, {text: 'Для допомоги React ефективно порівнювати і оновлювати елементи списку', isCorrect: true}, {text: 'Для передачі подій', isCorrect: false}, {text: 'Обов\'язковий лише для класових компонентів', isCorrect: false}] },
            { type: 'multiple', text: 'Яка популярна бібліотека управління глобальним станом використовується разом із React?', options: [{text: 'Vuex', isCorrect: false}, {text: 'Redux', isCorrect: true}, {text: 'Angular Store', isCorrect: false}, {text: 'StatePro', isCorrect: false}] },
            { type: 'multiple', text: 'Що таке умовний рендеринг у React?', options: [{text: 'Рендер лише на мобільних пристроях', isCorrect: false}, {text: 'Відображення різних компонентів або елементів залежно від умов (if/&&/тернарний оператор)', isCorrect: true}, {text: 'Рендер без використання JSX', isCorrect: false}, {text: 'Асинхронний рендер', isCorrect: false}] }
        ]
    },
    {
        id: 'test_5', authorId: 'admin', authorName: 'Адміністратор', joinCode: 'SQLDB5',
        title: 'Бази даних та SQL', description: 'Комплексна перевірка знань реляційних баз даних, SQL-запитів, нормалізації та ключів.',
        coverImage: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=800&auto=format&fit=crop',
        timeLimit: 25, createdAt: new Date(Date.now() - 345600000).toISOString(),
        questions: [
            { type: 'multiple', text: 'Який SQL запит використовується для вибірки даних?', options: [{text: 'SELECT', isCorrect: true}, {text: 'GET', isCorrect: false}, {text: 'FETCH', isCorrect: false}, {text: 'READ', isCorrect: false}] },
            { type: 'text', text: 'Яка SQL команда повністю видаляє таблицю разом із її структурою?', correctText: 'DROP TABLE' },
            { type: 'multiple', text: 'Що таке первинний ключ (Primary Key)?', options: [{text: 'Унікальний ідентифікатор кожного рядка таблиці', isCorrect: true}, {text: 'Поле для зберігання паролів', isCorrect: false}, {text: 'Перший стовпець таблиці', isCorrect: false}, {text: 'Індекс для пришвидшення запитів', isCorrect: false}] },
            { type: 'multiple', text: 'Яка команда SQL додає нові рядки до таблиці?', options: [{text: 'UPDATE', isCorrect: false}, {text: 'INSERT INTO', isCorrect: true}, {text: 'ADD', isCorrect: false}, {text: 'CREATE', isCorrect: false}] },
            { type: 'multiple', text: 'Що таке JOIN в SQL?', options: [{text: 'Команда для видалення дублікатів', isCorrect: false}, {text: 'Оператор для об\'єднання рядків з двох або більше таблиць', isCorrect: true}, {text: 'Функція для сортування', isCorrect: false}, {text: 'Тип індексу', isCorrect: false}] },
            { type: 'multiple', text: 'Як відсортувати результати запиту за спаданням?', options: [{text: 'ORDER BY column ASC', isCorrect: false}, {text: 'ORDER BY column DESC', isCorrect: true}, {text: 'SORT BY column DESC', isCorrect: false}, {text: 'GROUP BY column', isCorrect: false}] },
            { type: 'multiple', text: 'Яке значення NULL у SQL?', options: [{text: 'Нуль або порожній рядок', isCorrect: false}, {text: 'Відсутність значення або невідоме значення', isCorrect: true}, {text: 'Помилка в записі', isCorrect: false}, {text: 'Від\'ємне число', isCorrect: false}] },
            { type: 'multiple', text: 'Яка агрегатна функція SQL повертає кількість рядків?', options: [{text: 'SUM()', isCorrect: false}, {text: 'COUNT()', isCorrect: true}, {text: 'AVG()', isCorrect: false}, {text: 'MAX()', isCorrect: false}] },
            { type: 'multiple', text: 'Що таке зовнішній ключ (Foreign Key)?', options: [{text: 'Ключ шифрування бази даних', isCorrect: false}, {text: 'Поле, що посилається на первинний ключ іншої таблиці', isCorrect: true}, {text: 'Другий первинний ключ', isCorrect: false}, {text: 'Індекс у зовнішній БД', isCorrect: false}] },
            { type: 'text', text: 'Яка SQL команда змінює існуючі записи в таблиці?', correctText: 'UPDATE' },
            { type: 'multiple', text: 'Для чого використовується GROUP BY у SQL?', options: [{text: 'Для сортування результатів', isCorrect: false}, {text: 'Для групування рядків з однаковими значеннями з метою застосування агрегатних функцій', isCorrect: true}, {text: 'Для видалення дублікатів', isCorrect: false}, {text: 'Для об\'єднання таблиць', isCorrect: false}] },
            { type: 'multiple', text: 'Що таке нормалізація бази даних?', options: [{text: 'Прискорення запитів за допомогою індексів', isCorrect: false}, {text: 'Процес організації даних для усунення надлишковості та залежностей', isCorrect: true}, {text: 'Шифрування таблиць', isCorrect: false}, {text: 'Резервне копіювання БД', isCorrect: false}] }
        ]
    },
    {
        id: 'test_6', authorId: 'admin', authorName: 'Адміністратор', joinCode: 'PYTHN3',
        title: 'Основи Python', description: 'Комплексний тест на базовий синтаксис Python: типи даних, функції, цикли, колекції та обробка виключень.',
        coverImage: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=800&auto=format&fit=crop',
        timeLimit: 20, createdAt: new Date(Date.now() - 432000000).toISOString(),
        questions: [
            { type: 'multiple', text: 'Як вивести текст у консоль у Python?', options: [{text: 'console.log()', isCorrect: false}, {text: 'print()', isCorrect: true}, {text: 'echo()', isCorrect: false}, {text: 'write()', isCorrect: false}] },
            { type: 'multiple', text: 'Який тип даних використовується для збереження логічних значень True/False?', options: [{text: 'int', isCorrect: false}, {text: 'str', isCorrect: false}, {text: 'bool', isCorrect: true}, {text: 'float', isCorrect: false}] },
            { type: 'multiple', text: 'Як оголосити список (list) у Python?', options: [{text: 'list = (1, 2, 3)', isCorrect: false}, {text: 'list = [1, 2, 3]', isCorrect: true}, {text: 'list = {1, 2, 3}', isCorrect: false}, {text: 'list = <1, 2, 3>', isCorrect: false}] },
            { type: 'multiple', text: 'Яке ключове слово використовується для визначення функції у Python?', options: [{text: 'func', isCorrect: false}, {text: 'function', isCorrect: false}, {text: 'def', isCorrect: true}, {text: 'define', isCorrect: false}] },
            { type: 'multiple', text: 'Яка вбудована функція повертає довжину рядка або списку?', options: [{text: 'size()', isCorrect: false}, {text: 'count()', isCorrect: false}, {text: 'len()', isCorrect: true}, {text: 'length()', isCorrect: false}] },
            { type: 'multiple', text: 'Як додати елемент у кінець списку у Python?', options: [{text: 'list.add()', isCorrect: false}, {text: 'list.append()', isCorrect: true}, {text: 'list.push()', isCorrect: false}, {text: 'list.insert()', isCorrect: false}] },
            { type: 'multiple', text: 'Що таке словник (dict) у Python?', options: [{text: 'Впорядкований список елементів', isCorrect: false}, {text: 'Колекція пар ключ-значення', isCorrect: true}, {text: 'Множина унікальних елементів', isCorrect: false}, {text: 'Незмінний список', isCorrect: false}] },
            { type: 'multiple', text: 'Яке ключове слово використовується для обробки виключень (помилок)?', options: [{text: 'catch', isCorrect: false}, {text: 'error', isCorrect: false}, {text: 'except', isCorrect: true}, {text: 'handle', isCorrect: false}] },
            { type: 'multiple', text: 'Що таке lambda-функція у Python?', options: [{text: 'Функція для роботи зі списками', isCorrect: false}, {text: 'Анонімна однорядкова функція', isCorrect: true}, {text: 'Рекурсивна функція', isCorrect: false}, {text: 'Асинхронна функція', isCorrect: false}] },
            { type: 'text', text: 'Яке ключове слово використовується для імпорту модуля у Python?', correctText: 'import' },
            { type: 'multiple', text: 'Що таке f-рядок (f-string) у Python?', options: [{text: 'Спеціальний тип числа', isCorrect: false}, {text: 'Рядок з вбудованими виразами Python через {}, позначений префіксом f', isCorrect: true}, {text: 'Функція форматування', isCorrect: false}, {text: 'Символ кінця рядка', isCorrect: false}] },
            { type: 'multiple', text: 'Яке ключове слово завершує цикл достроково у Python?', options: [{text: 'stop', isCorrect: false}, {text: 'exit', isCorrect: false}, {text: 'break', isCorrect: true}, {text: 'end', isCorrect: false}] }
        ]
    },
    {
        id: 'test_7', authorId: 'admin', authorName: 'Адміністратор', joinCode: 'CYBER0',
        title: 'Основи Кібербезпеки', description: 'Комплексний тест на базові правила захисту інформації, мереж, типи атак та принципи безпечної розробки.',
        coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop',
        timeLimit: 25, createdAt: new Date(Date.now() - 518400000).toISOString(),
        questions: [
            { type: 'multiple', text: 'Що таке Phishing?', options: [{text: 'Вид комп\'ютерного вірусу', isCorrect: false}, {text: 'Соціальна інженерія для крадіжки даних через підроблені сайти або листи', isCorrect: true}, {text: 'Захисний екран мережі', isCorrect: false}, {text: 'Шифрування файлів', isCorrect: false}] },
            { type: 'text', text: 'Як називається процес перетворення інформації у нечитабельну форму для захисту?', correctText: 'Шифрування' },
            { type: 'multiple', text: 'Що таке Firewall (міжмережевий екран)?', options: [{text: 'Антивірусна програма', isCorrect: false}, {text: 'Система, що фільтрує мережевий трафік за правилами', isCorrect: true}, {text: 'Протокол шифрування', isCorrect: false}, {text: 'Сервіс резервного копіювання', isCorrect: false}] },
            { type: 'multiple', text: 'Що таке DDoS атака?', options: [{text: 'Злом пароля методом перебору', isCorrect: false}, {text: 'Масове перевантаження сервера запитами для виведення з ладу', isCorrect: true}, {text: 'Впровадження шкідливого коду в базу даних', isCorrect: false}, {text: 'Перехоплення мережевого трафіку', isCorrect: false}] },
            { type: 'multiple', text: 'Яке з цих паролів є найбільш надійним?', options: [{text: '123456', isCorrect: false}, {text: 'password', isCorrect: false}, {text: 'Tr@ff1c!2024#', isCorrect: true}, {text: 'myname1990', isCorrect: false}] },
            { type: 'multiple', text: 'Що таке двофакторна автентифікація (2FA)?', options: [{text: 'Два паролі для входу', isCorrect: false}, {text: 'Підтвердження особи двома незалежними методами (пароль + код/токен)', isCorrect: true}, {text: 'Шифрування даних двічі', isCorrect: false}, {text: 'Доступ з двох пристроїв', isCorrect: false}] },
            { type: 'multiple', text: 'Що таке VPN?', options: [{text: 'Вірус нового покоління', isCorrect: false}, {text: 'Захищений зашифрований тунель для передачі даних через мережу', isCorrect: true}, {text: 'Протокол для завантаження файлів', isCorrect: false}, {text: 'Веб-браузер з антивірусом', isCorrect: false}] },
            { type: 'multiple', text: 'Що таке SQL Injection?', options: [{text: 'Атака через впровадження шкідливого SQL коду у запит до бази даних', isCorrect: true}, {text: 'Резервне копіювання БД', isCorrect: false}, {text: 'Оптимізація SQL запитів', isCorrect: false}, {text: 'Шифрування бази даних', isCorrect: false}] },
            { type: 'multiple', text: 'Чим HTTPS відрізняється від HTTP?', options: [{text: 'HTTPS швидший', isCorrect: false}, {text: 'HTTPS шифрує передані дані за допомогою SSL/TLS', isCorrect: true}, {text: 'HTTPS тільки для файлів', isCorrect: false}, {text: 'Різниці немає', isCorrect: false}] },
            { type: 'multiple', text: 'Що таке Zero-Day вразливість?', options: [{text: 'Вразливість, виявлена першого дня роботи системи', isCorrect: false}, {text: 'Вразливість, про яку розробник ще не знає та не має виправлення', isCorrect: true}, {text: 'Атака в перший день після релізу', isCorrect: false}, {text: 'Вразливість в нульовому байті файлу', isCorrect: false}] },
            { type: 'multiple', text: 'Що таке Brute Force атака?', options: [{text: 'Атака через підроблені електронні листи', isCorrect: false}, {text: 'Систематичний перебір усіх можливих паролів для злому', isCorrect: true}, {text: 'Атака на фізичний сервер', isCorrect: false}, {text: 'Перехоплення сесійних cookies', isCorrect: false}] },
            { type: 'text', text: 'Як називається практика зберігання хешу пароля замість оригіналу для захисту від злому?', correctText: 'Хешування' }
        ]
    },
    {
        id: 'test_8', authorId: 'admin', authorName: 'Адміністратор', joinCode: 'GITVSC',
        title: 'Git та Контроль Версій', description: 'Комплексна перевірка знань команд Git, роботи з гілками, GitHub та принципів командної розробки.',
        coverImage: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=800&auto=format&fit=crop',
        timeLimit: 20, createdAt: new Date(Date.now() - 604800000).toISOString(),
        questions: [
            { type: 'multiple', text: 'Яка команда створює нову гілку (branch)?', options: [{text: 'git branch <name>', isCorrect: true}, {text: 'git push <name>', isCorrect: false}, {text: 'git clone <name>', isCorrect: false}, {text: 'git new <name>', isCorrect: false}] },
            { type: 'text', text: 'Яка команда Git додає всі змінені файли до індексу (staging area)?', correctText: 'git add .' },
            { type: 'multiple', text: 'Яка команда зберігає зміни у локальному репозиторії?', options: [{text: 'git save', isCorrect: false}, {text: 'git commit -m "message"', isCorrect: true}, {text: 'git push', isCorrect: false}, {text: 'git store', isCorrect: false}] },
            { type: 'multiple', text: 'Що таке merge конфлікт у Git?', options: [{text: 'Помилка при завантаженні репозиторію', isCorrect: false}, {text: 'Ситуація, коли дві гілки мають несумісні зміни в одному місці', isCorrect: true}, {text: 'Конфлікт дозволів доступу', isCorrect: false}, {text: 'Помилка у файлі .gitignore', isCorrect: false}] },
            { type: 'multiple', text: 'Яка команда завантажує зміни з remote репозиторію та зливає їх?', options: [{text: 'git fetch', isCorrect: false}, {text: 'git clone', isCorrect: false}, {text: 'git pull', isCorrect: true}, {text: 'git sync', isCorrect: false}] },
            { type: 'multiple', text: 'Що робить команда git revert?', options: [{text: 'Видаляє гілку', isCorrect: false}, {text: 'Створює новий коміт, що скасовує зміни попереднього', isCorrect: true}, {text: 'Скидає всі незбережені зміни', isCorrect: false}, {text: 'Повертає до попередньої версії без нового коміту', isCorrect: false}] },
            { type: 'multiple', text: 'Яка команда перемикає на іншу гілку?', options: [{text: 'git move', isCorrect: false}, {text: 'git switch <branch>', isCorrect: true}, {text: 'git jump', isCorrect: false}, {text: 'git go', isCorrect: false}] },
            { type: 'multiple', text: 'Для чого призначений файл .gitignore?', options: [{text: 'Для зберігання паролів', isCorrect: false}, {text: 'Для вказівки файлів та папок, які Git має ігнорувати', isCorrect: true}, {text: 'Для налаштування гілок', isCorrect: false}, {text: 'Для опису проекту', isCorrect: false}] },
            { type: 'text', text: 'Яка команда Git виводить історію комітів?', correctText: 'git log' },
            { type: 'multiple', text: 'Що таке fork у GitHub?', options: [{text: 'Видалення репозиторію', isCorrect: false}, {text: 'Особиста копія чужого репозиторію у вашому акаунті', isCorrect: true}, {text: 'Нова гілка репозиторію', isCorrect: false}, {text: 'Тег версії', isCorrect: false}] },
            { type: 'multiple', text: 'Яка команда надсилає локальні зміни на remote репозиторій?', options: [{text: 'git send', isCorrect: false}, {text: 'git upload', isCorrect: false}, {text: 'git push', isCorrect: true}, {text: 'git export', isCorrect: false}] },
            { type: 'multiple', text: 'Що таке Pull Request (PR) на GitHub?', options: [{text: 'Запит на завантаження репозиторію', isCorrect: false}, {text: 'Запит до автора репозиторію на злиття вашої гілки з основною', isCorrect: true}, {text: 'Команда Git для оновлення', isCorrect: false}, {text: 'Перегляд змін в коді', isCorrect: false}] }
        ]
    },
    {
        id: 'test_9', authorId: 'admin', authorName: 'Адміністратор', joinCode: 'NETWRK',
        title: 'Мережеві технології', description: 'Комплексний тест на розуміння принципів роботи Інтернету, протоколів, моделі OSI та мережевих пристроїв.',
        coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=800&auto=format&fit=crop',
        timeLimit: 25, createdAt: new Date(Date.now() - 691200000).toISOString(),
        questions: [
            { type: 'multiple', text: 'Що таке IP?', options: [{text: 'Internet Protocol — протокол адресації в мережі', isCorrect: true}, {text: 'Internal Process', isCorrect: false}, {text: 'Internet Provider', isCorrect: false}, {text: 'Interface Point', isCorrect: false}] },
            { type: 'text', text: 'За яким портом за замовчуванням працює протокол HTTP?', correctText: '80' },
            { type: 'multiple', text: 'Що таке DNS?', options: [{text: 'Протокол безпечної передачі файлів', isCorrect: false}, {text: 'Система перетворення доменних імен на IP-адреси', isCorrect: true}, {text: 'Тип мережевого кабелю', isCorrect: false}, {text: 'Мережевий міжмережевий екран', isCorrect: false}] },
            { type: 'multiple', text: 'За яким портом за замовчуванням працює HTTPS?', options: [{text: '80', isCorrect: false}, {text: '8080', isCorrect: false}, {text: '443', isCorrect: true}, {text: '22', isCorrect: false}] },
            { type: 'multiple', text: 'Що таке MAC-адреса?', options: [{text: 'IP-адреса пристрою', isCorrect: false}, {text: 'Унікальна фізична адреса мережевого інтерфейсу пристрою', isCorrect: true}, {text: 'Адреса DNS-сервера', isCorrect: false}, {text: 'Адреса шлюзу за замовчуванням', isCorrect: false}] },
            { type: 'multiple', text: 'Скільки рівнів у мережевій моделі OSI?', options: [{text: '4', isCorrect: false}, {text: '5', isCorrect: false}, {text: '7', isCorrect: true}, {text: '9', isCorrect: false}] },
            { type: 'multiple', text: 'Яка різниця між TCP та UDP?', options: [{text: 'TCP і UDP ідентичні', isCorrect: false}, {text: 'TCP гарантує доставку пакетів, UDP — швидший, але без гарантії', isCorrect: true}, {text: 'UDP надійніший за TCP', isCorrect: false}, {text: 'TCP тільки для відео', isCorrect: false}] },
            { type: 'multiple', text: 'Що таке маршрутизатор (Router)?', options: [{text: 'Пристрій для з\'єднання комп\'ютерів у локальну мережу', isCorrect: false}, {text: 'Пристрій, що спрямовує мережевий трафік між різними мережами', isCorrect: true}, {text: 'Сервер для зберігання даних', isCorrect: false}, {text: 'Мережевий кабель', isCorrect: false}] },
            { type: 'multiple', text: 'Що таке NAT (Network Address Translation)?', options: [{text: 'Протокол шифрування', isCorrect: false}, {text: 'Технологія перетворення приватних IP-адрес на публічні при виході в інтернет', isCorrect: true}, {text: 'Тип DNS записів', isCorrect: false}, {text: 'Метод стиснення трафіку', isCorrect: false}] },
            { type: 'text', text: 'Яка IP-адреса завжди вказує на сам пристрій (localhost)?', correctText: '127.0.0.1' },
            { type: 'multiple', text: 'Що таке пропускна здатність (bandwidth) мережі?', options: [{text: 'Кількість підключених пристроїв', isCorrect: false}, {text: 'Максимальний обсяг даних, що передається за одиницю часу', isCorrect: true}, {text: 'Довжина мережевого кабелю', isCorrect: false}, {text: 'Затримка сигналу (ping)', isCorrect: false}] },
            { type: 'multiple', text: 'Що таке протокол FTP?', options: [{text: 'Протокол для надсилання електронної пошти', isCorrect: false}, {text: 'Протокол для передачі файлів між клієнтом та сервером', isCorrect: true}, {text: 'Протокол шифрування з\'єднання', isCorrect: false}, {text: 'Протокол адресації', isCorrect: false}] }
        ]
    },
    {
        id: 'test_10', authorId: 'admin', authorName: 'Адміністратор', joinCode: 'ENGLIT',
        title: 'Англійська для IT', description: 'Комплексна перевірка базової технічної термінології англійською мовою для ІТ-спеціалістів.',
        coverImage: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?q=80&w=800&auto=format&fit=crop',
        timeLimit: 20, createdAt: new Date(Date.now() - 777600000).toISOString(),
        questions: [
            { type: 'multiple', text: 'Що означає термін "Deploy"?', options: [{text: 'Видалення коду', isCorrect: false}, {text: 'Розгортання проєкту на сервері', isCorrect: true}, {text: 'Написання тестів', isCorrect: false}, {text: 'Перегляд коду', isCorrect: false}] },
            { type: 'text', text: 'Як перекладається слово "Variable" у програмуванні?', correctText: 'Змінна' },
            { type: 'multiple', text: 'Що означає термін "Debug"?', options: [{text: 'Написати новий код', isCorrect: false}, {text: 'Знаходити та виправляти помилки в коді', isCorrect: true}, {text: 'Видалити програму', isCorrect: false}, {text: 'Зробити резервну копію', isCorrect: false}] },
            { type: 'multiple', text: 'Як перекладається "Repository" у контексті Git?', options: [{text: 'Сховище / репозиторій для зберігання коду та його історії', isCorrect: true}, {text: 'Команда для запуску коду', isCorrect: false}, {text: 'Файл з налаштуваннями', isCorrect: false}, {text: 'Гілка розробки', isCorrect: false}] },
            { type: 'multiple', text: 'Що таке "Legacy code"?', options: [{text: 'Код, написаний починаючими розробниками', isCorrect: false}, {text: 'Старий код, що підтримується, але важко модифікується', isCorrect: true}, {text: 'Код без коментарів', isCorrect: false}, {text: 'Незавершений код', isCorrect: false}] },
            { type: 'multiple', text: 'Що означає термін "Refactoring"?', options: [{text: 'Додавання нових функцій', isCorrect: false}, {text: 'Переробка коду для покращення структури без зміни поведінки', isCorrect: true}, {text: 'Видалення старого коду', isCorrect: false}, {text: 'Тестування додатку', isCorrect: false}] },
            { type: 'text', text: 'Як перекладається слово "Algorithm" у програмуванні?', correctText: 'Алгоритм' },
            { type: 'multiple', text: 'Що означає "Dependency" у контексті розробки ПЗ?', options: [{text: 'Незалежний модуль коду', isCorrect: false}, {text: 'Зовнішня бібліотека або модуль, від якого залежить проект', isCorrect: true}, {text: 'Тип помилки', isCorrect: false}, {text: 'Метод тестування', isCorrect: false}] },
            { type: 'multiple', text: 'Що таке "Framework"?', options: [{text: 'Готовий набір інструментів та правил для розробки програм', isCorrect: true}, {text: 'Мова програмування', isCorrect: false}, {text: 'Тип бази даних', isCorrect: false}, {text: 'Мережевий протокол', isCorrect: false}] },
            { type: 'multiple', text: 'Що означає "Scope" у програмуванні?', options: [{text: 'Розмір файлу', isCorrect: false}, {text: 'Область видимості змінної або функції', isCorrect: true}, {text: 'Обсяг пам\'яті', isCorrect: false}, {text: 'Версія програми', isCorrect: false}] },
            { type: 'text', text: 'Як перекладається слово "Iteration" у контексті розробки?', correctText: 'Ітерація' },
            { type: 'multiple', text: 'Що означає термін "Scalability"?', options: [{text: 'Безпека системи', isCorrect: false}, {text: 'Здатність системи зростати та обробляти більше навантаження', isCorrect: true}, {text: 'Швидкість завантаження', isCorrect: false}, {text: 'Сумісність з пристроями', isCorrect: false}] }
        ]
    }
];

// --- STATE MANAGEMENT ---
let currentUser = JSON.parse(localStorage.getItem(SESSION_KEY));

// --- DOM ELEMENTS ---
const screens = {
    publicDashboard: document.getElementById('public-dashboard'),
    about: document.getElementById('about-screen'),
    support: document.getElementById('support-screen'),
    auth: document.getElementById('auth-screen'),
    profile: document.getElementById('profile-screen'),
    teacherDashboard: document.getElementById('teacher-dashboard'),
    teacherTestDetail: document.getElementById('teacher-test-detail'),
    testCreator: document.getElementById('test-creator'),
    testTaker: document.getElementById('test-taker'),
    testResults: document.getElementById('test-results'),
    history: document.getElementById('history-screen'),
};

// --- ROUTING / INIT ---
async function init() {
    await seedInitialData();
    await loadTests();
    await loadUsers();
    updateNavLinksState();
    if (currentUser) {
        document.getElementById('nav-guest-btns').classList.add('hidden');
        document.getElementById('nav-user-btns').classList.remove('hidden');
        updateNavProfile();
        goHome();
    } else {
        document.getElementById('nav-guest-btns').classList.remove('hidden');
        document.getElementById('nav-user-btns').classList.add('hidden');
        renderPublicTests();
        showScreen('publicDashboard');
    }
}

function showScreen(screenKey) {
    Object.values(screens).forEach(screen => screen.classList.add('hidden'));
    screens[screenKey].classList.remove('hidden');
    window.scrollTo(0, 0);
}

// Navigation Events
const navLinks = {
    home: document.getElementById('nav-home'),
    allTests: document.getElementById('nav-all-tests'),
    history: document.getElementById('nav-history'),
    about: document.getElementById('nav-about'),
    support: document.getElementById('nav-support')
};

function setActiveNav(activeKey) {
    Object.values(navLinks).forEach(l => l.classList.remove('active'));
    if (activeKey && navLinks[activeKey]) navLinks[activeKey].classList.add('active');
}

function updateNavLinksState() {
    if (currentUser) {
        if (currentUser.role === 'teacher') {
            navLinks.home.textContent = 'Мої тести';
            navLinks.history.classList.add('hidden');
            navLinks.allTests.classList.remove('hidden');
        } else {
            navLinks.home.textContent = 'Головна';
            navLinks.history.classList.remove('hidden');
            navLinks.allTests.classList.add('hidden');
        }
    } else {
        navLinks.history.classList.add('hidden');
        navLinks.allTests.classList.add('hidden');
        navLinks.home.textContent = 'Головна';
    }
}

navLinks.home.addEventListener('click', (e) => { e.preventDefault(); setActiveNav('home'); goHome(); });
navLinks.allTests.addEventListener('click', (e) => { e.preventDefault(); setActiveNav('allTests'); renderPublicTests(); showScreen('publicDashboard'); });
navLinks.history.addEventListener('click', async (e) => { e.preventDefault(); setActiveNav('history'); await renderHistory(); showScreen('history'); });
navLinks.about.addEventListener('click', (e) => { e.preventDefault(); setActiveNav('about'); showScreen('about'); });
navLinks.support.addEventListener('click', (e) => { e.preventDefault(); setActiveNav('support'); showScreen('support'); });
document.getElementById('nav-logo').addEventListener('click', goHome);

function updateNavProfile() {
    document.getElementById('user-info').textContent = currentUser.name || 'Користувач';
    const avatarImg = document.getElementById('nav-avatar');
    const avatarPl = document.getElementById('nav-avatar-placeholder');
    if (currentUser.avatar) {
        avatarImg.src = currentUser.avatar; avatarImg.classList.remove('hidden'); avatarPl.classList.add('hidden');
    } else {
        avatarImg.classList.add('hidden'); avatarPl.classList.remove('hidden'); avatarPl.textContent = getInitials(currentUser.name);
    }
}

function goHome() {
    setActiveNav('home');
    if (!currentUser) { renderPublicTests(); showScreen('publicDashboard'); }
    else if (currentUser.role === 'teacher') { renderTeacherTests(); showScreen('teacherDashboard'); }
    else { renderPublicTests(); showScreen('publicDashboard'); }
}

document.getElementById('btn-logout').addEventListener('click', () => {
    currentUser = null; localStorage.removeItem(SESSION_KEY); showToast('Ви успішно вийшли з акаунта.', 'success'); init();
});
document.getElementById('nav-btn-login').addEventListener('click', () => { showScreen('auth'); document.getElementById('btn-show-login').click(); });
document.getElementById('nav-btn-register').addEventListener('click', () => { showScreen('auth'); document.getElementById('btn-show-register').click(); });

// Join Code Logic
const globalJoinCodeInput = document.getElementById('global-join-code');
globalJoinCodeInput.addEventListener('input', function () { this.value = this.value.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 6); });
document.getElementById('btn-global-join').addEventListener('click', async () => {
    const code = globalJoinCodeInput.value;
    if (code.length < 6) { showToast('Код має складатись з 6 символів', 'error'); return; }
    if (!currentUser) { showToast('Для проходження тесту за кодом необхідно увійти.', 'error'); showScreen('auth'); return; }

    // Check group codes first
    const { data: groupData } = await db.from('groups').select('*').eq('join_code', code).limit(1);
    if (groupData && groupData.length > 0) {
        const group = groupData[0];
        currentGroupId = group.id;
        currentGroupName = group.group_name;
        globalJoinCodeInput.value = '';
        startTest(group.test_id);
        return;
    }

    // Check regular test codes
    currentGroupId = null; currentGroupName = null;
    const test = getTests().find(t => t.joinCode === code);
    if (test) { globalJoinCodeInput.value = ''; startTest(test.id); }
    else { showToast('Тест з таким кодом не знайдено', 'error'); }
});

// Password Toggles
document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', function () {
        const input = this.previousElementSibling;
        if (input.type === 'password') {
            input.type = 'text'; this.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>';
        } else {
            input.type = 'password'; this.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
        }
    });
});

// --- PUBLIC DASHBOARD ---
function renderPublicTests(searchQuery = '') {
    const list = document.getElementById('public-tests-list');
    const allTests = getTests();
    const filtered = allTests.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()) && t.isPublic !== false);
    list.innerHTML = '';
    if (filtered.length === 0) { list.innerHTML = '<div class="panel center-text text-muted" style="grid-column: 1/-1;">Тестів не знайдено.</div>'; return; }

    filtered.forEach(test => {
        const card = document.createElement('div'); card.className = 'test-card';
        const imgUrl = test.coverImage || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop';
        const isAlreadyAdded = currentUser && currentUser.role === 'teacher' &&
            (test.authorId === currentUser.id || allTests.some(t => t.authorId === currentUser.id && t.clonedFromId === test.id));
        let teacherBtnHtml = '';
        if (currentUser && currentUser.role === 'teacher') {
            if (isAlreadyAdded) {
                teacherBtnHtml = `<button class="secondary-btn full-width mt-2" disabled style="opacity: 0.7; cursor: not-allowed;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="3" style="display:inline-block; vertical-align:middle; margin-right:4px;"><polyline points="20 6 9 17 4 12"></polyline></svg> Додано</button>`;
            } else {
                teacherBtnHtml = `<button class="secondary-btn btn-clone-test full-width mt-2" data-id="${test.id}">Додати собі</button>`;
            }
        }
        card.innerHTML = `
            <div class="test-card-image" style="background-image: url('${imgUrl}')"></div>
            <div class="test-card-content">
                <h3>${test.title}</h3>
                <p>${test.description || 'Немає опису'}</p>
                <div class="test-card-meta mb-4">
                    <span class="badge"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-1"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ${test.questions.length} питань</span>
                    <span class="text-sm flex-align-center"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="mr-1"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> ${test.authorName}</span>
                </div>
                <button class="${currentUser && currentUser.role === 'teacher' ? 'primary-btn btn-preview-test' : 'primary-btn btn-start-test'} full-width" data-id="${test.id}">
                    ${currentUser && currentUser.role === 'teacher' ? 'Переглянути тест' : 'Почати тестування'}
                </button>
                ${teacherBtnHtml}
            </div>`;
        list.appendChild(card);
    });

    document.querySelectorAll('.btn-start-test').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!currentUser) { showToast('Для проходження тесту необхідно увійти в акаунт.', 'error'); showScreen('auth'); return; }
            startTest(e.target.dataset.id);
        });
    });
    document.querySelectorAll('.btn-preview-test').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const test = allTests.find(t => t.id === e.target.dataset.id);
            if (test) await openTeacherTestDetail(test, 'publicDashboard');
        });
    });
    document.querySelectorAll('.btn-clone-test').forEach(btn => {
        btn.addEventListener('click', (e) => { cloneTest(e.target.dataset.id); });
    });
}
document.getElementById('search-input').addEventListener('input', (e) => renderPublicTests(e.target.value));

// --- PROFILE MODULE ---
let tempAvatarBase64 = null;
document.getElementById('nav-profile-btn').addEventListener('click', () => {
    if (!currentUser) return; setActiveNav(null);
    document.getElementById('profile-name').value = currentUser.name;
    document.getElementById('profile-email').value = currentUser.email;
    document.getElementById('profile-role-badge').textContent = currentUser.role === 'teacher' ? 'Викладач' : 'Студент';
    const prev = document.getElementById('profile-avatar-preview'); const pl = document.getElementById('profile-avatar-placeholder');
    if (currentUser.avatar) { prev.src = currentUser.avatar; prev.classList.remove('hidden'); pl.classList.add('hidden'); }
    else { prev.classList.add('hidden'); pl.classList.remove('hidden'); pl.textContent = getInitials(currentUser.name); }
    tempAvatarBase64 = currentUser.avatar || null; showScreen('profile');
});

document.getElementById('avatar-upload').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (event) {
            tempAvatarBase64 = event.target.result;
            document.getElementById('profile-avatar-preview').src = tempAvatarBase64;
            document.getElementById('profile-avatar-preview').classList.remove('hidden');
            document.getElementById('profile-avatar-placeholder').classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }
});

document.getElementById('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newName = document.getElementById('profile-name').value.trim();
    if (!newName) return;
    const { error } = await db.from('users').update({ name: newName, avatar: tempAvatarBase64 }).eq('id', currentUser.id);
    if (error) { showToast('Помилка оновлення профілю', 'error'); return; }
    const userInCache = usersCache.find(u => u.id === currentUser.id);
    if (userInCache) { userInCache.name = newName; userInCache.avatar = tempAvatarBase64; }
    currentUser.name = newName; currentUser.avatar = tempAvatarBase64;
    localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
    updateNavProfile(); showToast('Профіль успішно оновлено!'); goHome();
});

// --- AUTHENTICATION LOGIC ---
const loginForm = document.getElementById('login-form'); const registerForm = document.getElementById('register-form');
document.getElementById('btn-show-register').addEventListener('click', () => { document.getElementById('login-container').classList.add('hidden'); document.getElementById('register-container').classList.remove('hidden'); });
document.getElementById('btn-show-login').addEventListener('click', () => { document.getElementById('register-container').classList.add('hidden'); document.getElementById('login-container').classList.remove('hidden'); });

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const role = document.querySelector('input[name="role"]:checked').value;
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const password = document.getElementById('reg-password').value;
    if (usersCache.find(u => u.email === email)) { showToast('Користувач з таким email вже існує!', 'error'); return; }
    const newUser = { id: Date.now().toString(), role, name, email, password, avatar: null };
    const { error } = await db.from('users').insert(userToDb(newUser));
    if (error) { showToast('Помилка реєстрації. Спробуйте ще раз.', 'error'); return; }
    usersCache.push(newUser);
    currentUser = { id: newUser.id, role, name, email, avatar: null };
    localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
    registerForm.reset(); showToast('Успішна реєстрація!'); await init();
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const password = document.getElementById('login-password').value;
    const user = usersCache.find(u => u.email === email && u.password === password);
    if (user) {
        currentUser = { id: user.id, role: user.role, name: user.name, email: user.email, avatar: user.avatar };
        localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
        loginForm.reset(); showToast('Успішний вхід!'); await init();
    } else { showToast('Невірний email або пароль!', 'error'); }
});

// --- HISTORY MODULE ---
async function renderHistory() {
    const list = document.getElementById('history-list');
    list.innerHTML = '<div class="panel center-text text-muted">Завантаження...</div>';
    const { data: history, error } = await db.from('history').select('*').eq('user_id', currentUser.id).order('date', { ascending: false });
    list.innerHTML = '';
    if (error || !history || history.length === 0) {
        list.innerHTML = '<div class="panel center-text text-muted">У вас ще немає пройдених тестів.</div>'; return;
    }
    history.forEach(item => {
        const date = new Date(item.date).toLocaleString('uk-UA');
        let scoreClass = 'score-low';
        if (item.percentage >= 80) scoreClass = 'score-high'; else if (item.percentage >= 50) scoreClass = 'score-med';
        const card = document.createElement('div'); card.className = 'history-card';
        card.innerHTML = `<div><div class="history-title">${item.test_title}</div><div class="history-date">📅 ${date}</div></div><div class="history-score-badge ${scoreClass}">${item.percentage}% (${item.score}/${item.total})</div>`;
        list.appendChild(card);
    });
}

document.getElementById('btn-view-history').addEventListener('click', async () => {
    document.getElementById('score-circle-path').setAttribute('stroke-dasharray', `0, 100`);
    setActiveNav('history'); await renderHistory(); showScreen('history');
});

// --- TEACHER MODULE ---
let tempTestCoverBase64 = null;
let editingTestId = null;

document.getElementById('btn-create-test').addEventListener('click', () => {
    editingTestId = null;
    document.getElementById('create-test-form').reset();
    document.getElementById('questions-list').innerHTML = '';
    document.getElementById('test-image-preview').classList.add('hidden');
    tempTestCoverBase64 = null;
    document.getElementById('creator-title').textContent = 'Створення нового тесту';
    document.getElementById('btn-save-test').textContent = 'Зберегти тест';
    addQuestionToBuilder(); updateQuestionCount(); showScreen('testCreator');
});

function openTestEditor(testId) {
    const test = getTests().find(t => t.id === testId);
    if (!test) return;
    editingTestId = testId;
    document.getElementById('create-test-form').reset();
    document.getElementById('questions-list').innerHTML = '';
    document.getElementById('creator-title').textContent = 'Редагування тесту';
    document.getElementById('btn-save-test').textContent = 'Зберегти зміни';
    document.getElementById('test-title').value = test.title;
    document.getElementById('test-desc').value = test.description || '';
    document.getElementById('test-time').value = test.timeLimit || '';
    if (test.coverImage) {
        tempTestCoverBase64 = test.coverImage;
        document.getElementById('test-image-preview').querySelector('img').src = test.coverImage;
        document.getElementById('test-image-preview').classList.remove('hidden');
    } else {
        tempTestCoverBase64 = null;
        document.getElementById('test-image-preview').classList.add('hidden');
    }
    test.questions.forEach(q => {
        addQuestionToBuilder();
        const qCards = document.getElementById('questions-list').querySelectorAll('.question-card');
        const qCard = qCards[qCards.length - 1];
        qCard.querySelector('.q-text').value = q.text;
        const typeSelect = qCard.querySelector('.q-type-select');
        typeSelect.value = q.type; typeSelect.dispatchEvent(new Event('change'));
        if (q.image) {
            qCard.dataset.imageBase64 = q.image;
            const prev = qCard.querySelector('.q-image-preview');
            prev.querySelector('img').src = q.image; prev.classList.remove('hidden');
        }
        if (q.type === 'multiple') {
            const optContainer = qCard.querySelector('.options-container');
            optContainer.innerHTML = '';
            q.options.forEach(opt => {
                addOptionToQuestion(optContainer);
                const rows = optContainer.querySelectorAll('.option-row');
                const row = rows[rows.length - 1];
                row.querySelector('.o-text').value = opt.text;
                row.querySelector('.q-correct-checkbox').checked = opt.isCorrect;
            });
        } else {
            qCard.querySelector('.q-correct-text').value = q.correctText || '';
        }
    });
    updateQuestionNumbers(); updateQuestionCount(); showScreen('testCreator');
}

document.getElementById('test-image-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 2 * 1024 * 1024) { showToast('Файл занадто великий (макс 2MB)', 'error'); e.target.value = ''; return; }
        try {
            tempTestCoverBase64 = await fileToBase64(file);
            document.getElementById('test-image-preview').querySelector('img').src = tempTestCoverBase64;
            document.getElementById('test-image-preview').classList.remove('hidden');
        } catch (err) { showToast('Помилка читання файлу', 'error'); }
    }
});
document.getElementById('btn-cancel-create').addEventListener('click', () => showScreen('teacherDashboard'));

function renderTeacherTests() {
    const tests = getTests().filter(t => t.authorId === currentUser.id);
    document.getElementById('teacher-tests-list').innerHTML = '';
    if (tests.length === 0) { document.getElementById('teacher-tests-list').innerHTML = '<div class="panel center-text text-muted" style="grid-column: 1/-1;">Наразі немає створених тестів.</div>'; return; }
    tests.forEach(test => {
        const card = document.createElement('div'); card.className = 'test-card';
        const imgUrl = test.coverImage || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop';
        const isEdited = test.clonedFromId && test.isEdited;
        const isCloned = test.clonedFromId && !test.isEdited;
        card.innerHTML = `
            <div class="test-card-image" style="background-image: url('${imgUrl}')">
                ${isEdited ? '<div class="card-badge-edited">✎ Відредаговано</div>' : ''}
                ${isCloned ? '<div class="card-badge-cloned">Додано</div>' : ''}
            </div>
            <div class="test-card-content flex-col" style="justify-content: space-between;">
                <div>
                    <h3>${test.title}</h3>
                    <p>${test.description || 'Немає опису'}</p>
                    <div class="test-card-meta mb-4">
                        <span class="badge badge-primary">${test.questions.length} питань</span>
                        ${test.timeLimit ? `<span class="badge badge-warning ml-2">⏳ ${test.timeLimit} хв</span>` : ''}
                        <span class="badge ml-2" style="background:${test.isPublic ? 'var(--success-light,#d1fae5)' : 'var(--bg-main)'}; color:${test.isPublic ? 'var(--success)' : 'var(--text-muted)'}; border:1px solid ${test.isPublic ? 'var(--success)' : 'var(--border-light)'};">
                            ${test.isPublic ? '🌐 Публічний' : '🔒 Приватний'}
                        </span>
                    </div>
                </div>
                <div class="border-top pt-3 mt-auto text-center">
                    <span class="text-sm font-medium text-primary flex-align-center" style="justify-content: center;">
                        Керувати тестом <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="ml-1"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </span>
                </div>
            </div>`;
        card.addEventListener('click', async () => await openTeacherTestDetail(test, 'teacherDashboard'));
        document.getElementById('teacher-tests-list').appendChild(card);
    });
}

async function openTeacherTestDetail(test, source = 'teacherDashboard') {
    document.getElementById('detail-test-title').textContent = test.title;
    document.getElementById('detail-test-desc').textContent = test.description || 'Опис відсутній';
    const isOwner = test.authorId === currentUser.id;
    document.getElementById('detail-test-code').textContent = isOwner ? test.joinCode : 'Публічний';
    document.getElementById('detail-test-qcount').textContent = `${test.questions.length} питань`;
    document.getElementById('detail-test-timer').textContent = test.timeLimit ? `${test.timeLimit} хвилин` : 'Без таймера';
    const list = document.getElementById('detail-questions-list');
    list.innerHTML = '';
    test.questions.forEach((q, idx) => {
        const d = document.createElement('div'); d.className = 'history-card flex-between mb-2';
        d.style.alignItems = 'flex-start'; d.style.flexDirection = 'column';
        let ansHtml = '';
        if (q.type === 'text') {
            ansHtml = `<span class="text-success font-medium">Відповідь: ${q.correctText}</span>`;
        } else {
            const correctOpts = q.options.filter(o => o.isCorrect).map(o => o.text).join('", "');
            ansHtml = `<span class="text-success font-medium">Правильні: "${correctOpts}"</span>`;
        }
        let imgBadge = q.image ? `<span class="badge badge-primary mt-2">Має зображення</span>` : '';
        d.innerHTML = `<div class="font-medium mb-1">${idx + 1}. ${q.text}</div><div class="text-sm">${ansHtml}</div>${imgBadge}`;
        list.appendChild(d);
    });

    // Student Results
    const resultsHeading = document.getElementById('detail-results-list').previousElementSibling;
    const filterDiv = document.getElementById('detail-results-filter');
    if (!isOwner) {
        resultsHeading.style.display = 'none';
        document.getElementById('detail-results-list').style.display = 'none';
        filterDiv.classList.add('hidden');
    } else {
        resultsHeading.style.display = 'block';
        document.getElementById('detail-results-list').style.display = 'block';
        const resultsList = document.getElementById('detail-results-list');
        resultsList.innerHTML = '<div class="center-text text-muted p-4">Завантаження...</div>';
        filterDiv.innerHTML = '';

        const { data: testResults } = await db.from('history').select('*').eq('test_id', test.id).order('date', { ascending: false });

        const renderTable = (rows) => {
            if (!rows || rows.length === 0) {
                resultsList.innerHTML = '<div class="center-text text-muted p-4 border-light" style="border-radius:var(--radius-md);border:1px dashed var(--border-light);">Результатів не знайдено.</div>';
                return;
            }
            let html = `<table class="results-table"><thead><tr><th>Студент</th><th>Результат</th><th>Час</th><th>Дата</th><th></th></tr></thead><tbody>`;
            rows.forEach(r => {
                const date = new Date(r.date).toLocaleString('uk-UA');
                let sc = r.percentage >= 80 ? 'text-success font-bold' : (r.percentage >= 50 ? 'text-warning font-bold' : 'text-error font-bold');
                html += `<tr>
                    <td>${r.user_name || 'Студент'}</td>
                    <td class="${sc}">${r.percentage}% (${r.score}/${r.total})</td>
                    <td>${r.time_taken || 'Н/Д'}</td>
                    <td class="text-sm text-muted">${date}</td>
                    <td><button class="icon-btn text-error btn-delete-result" data-id="${r.id}" title="Видалити результат (студент зможе пройти знову)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14H6L5 6"></path></svg>
                    </button></td>
                </tr>`;
            });
            html += '</tbody></table>';
            resultsList.innerHTML = html;
            resultsList.querySelectorAll('.btn-delete-result').forEach(btn => {
                btn.addEventListener('click', async () => {
                    if (!confirm('Видалити результат студента? Він зможе пройти тест ще раз.')) return;
                    const { error } = await db.from('history').delete().eq('id', btn.dataset.id);
                    if (error) { showToast('Помилка видалення', 'error'); return; }
                    showToast('Результат видалено. Студент може пройти тест знову.');
                    await openTeacherTestDetail(test, source);
                });
            });
        };

        if (!testResults || testResults.length === 0) {
            filterDiv.classList.add('hidden');
            resultsList.innerHTML = '<div class="center-text text-muted p-4 border-light" style="border-radius:var(--radius-md);border:1px dashed var(--border-light);">Ще ніхто не проходив цей тест.</div>';
        } else {
            const groupNames = [...new Set(testResults.filter(r => r.group_name).map(r => r.group_name))];
            if (groupNames.length > 0) {
                filterDiv.classList.remove('hidden');
                const hasNoGroup = testResults.some(r => !r.group_name);
                filterDiv.innerHTML = `<div class="group-filter-tabs">
                    <button class="group-tab active" data-g="all">Всі (${testResults.length})</button>
                    ${groupNames.map(g => `<button class="group-tab" data-g="${g}">${g} (${testResults.filter(r => r.group_name === g).length})</button>`).join('')}
                    ${hasNoGroup ? `<button class="group-tab" data-g="__none__">Без групи (${testResults.filter(r => !r.group_name).length})</button>` : ''}
                </div>`;
                filterDiv.querySelectorAll('.group-tab').forEach(tab => {
                    tab.addEventListener('click', () => {
                        filterDiv.querySelectorAll('.group-tab').forEach(t => t.classList.remove('active'));
                        tab.classList.add('active');
                        const g = tab.dataset.g;
                        if (g === 'all') renderTable(testResults);
                        else if (g === '__none__') renderTable(testResults.filter(r => !r.group_name));
                        else renderTable(testResults.filter(r => r.group_name === g));
                    });
                });
            } else {
                filterDiv.classList.add('hidden');
            }
            renderTable(testResults);
        }
    }

    await renderGroupsSection(test.id, isOwner);

    const btnDelete = document.getElementById('btn-detail-delete');
    const newBtnDelete = btnDelete.cloneNode(true);
    btnDelete.parentNode.replaceChild(newBtnDelete, btnDelete);
    if (isOwner) {
        newBtnDelete.style.display = 'inline-flex';
        newBtnDelete.addEventListener('click', async () => {
            if (confirm('Видалити цей тест?')) { await deleteTest(test.id); showToast('Тест видалено'); showScreen(source); }
        });
    } else { newBtnDelete.style.display = 'none'; }

    let btnEdit = document.getElementById('btn-detail-edit');
    if (!btnEdit) {
        btnEdit = document.createElement('button'); btnEdit.id = 'btn-detail-edit'; btnEdit.className = 'secondary-btn'; btnEdit.textContent = 'Редагувати тест';
        newBtnDelete.parentNode.insertBefore(btnEdit, newBtnDelete);
    }
    if (isOwner) {
        btnEdit.style.display = 'inline-flex';
        const newBtnEdit = btnEdit.cloneNode(true);
        btnEdit.parentNode.replaceChild(newBtnEdit, btnEdit);
        newBtnEdit.addEventListener('click', () => openTestEditor(test.id));
    } else { btnEdit.style.display = 'none'; }

    // Publish / Unpublish button
    let btnPublish = document.getElementById('btn-detail-publish');
    if (!btnPublish) {
        btnPublish = document.createElement('button');
        btnPublish.id = 'btn-detail-publish';
        newBtnDelete.parentNode.insertBefore(btnPublish, newBtnDelete);
    }
    if (isOwner) {
        const isPublished = test.isPublic === true;
        btnPublish.style.display = 'inline-flex';
        btnPublish.className = isPublished ? 'secondary-btn' : 'primary-btn';
        btnPublish.style.background = isPublished ? '' : 'var(--success)';
        btnPublish.style.borderColor = isPublished ? 'var(--error)' : '';
        btnPublish.style.color = isPublished ? 'var(--error)' : '';
        btnPublish.textContent = isPublished ? 'Зняти з публікації' : 'Опублікувати';
        const newBtnPublish = btnPublish.cloneNode(true);
        btnPublish.parentNode.replaceChild(newBtnPublish, btnPublish);
        newBtnPublish.addEventListener('click', async () => {
            const newState = !test.isPublic;
            const { error } = await db.from('tests').update({ is_public: newState }).eq('id', test.id);
            if (error) { showToast('Помилка оновлення', 'error'); return; }
            await loadTests();
            showToast(newState ? 'Тест опубліковано! Він тепер видний усім.' : 'Тест знято з публікації.');
            const refreshed = testsCache.find(t => t.id === test.id);
            if (refreshed) await openTeacherTestDetail(refreshed, source);
        });
    } else { btnPublish.style.display = 'none'; }

    const footer = newBtnDelete.parentNode;
    footer.style.display = 'flex'; footer.style.gap = '1rem'; footer.style.alignItems = 'center';

    let btnTake = document.getElementById('btn-detail-take-test');
    if (!btnTake) {
        btnTake = document.createElement('button'); btnTake.id = 'btn-detail-take-test'; btnTake.className = 'primary-btn'; btnTake.textContent = 'Пройти тест (Демо)';
        footer.appendChild(btnTake);
    }
    const newBtnTake = btnTake.cloneNode(true);
    btnTake.parentNode.replaceChild(newBtnTake, btnTake);
    newBtnTake.addEventListener('click', () => startTest(test.id));

    let btnClone = document.getElementById('btn-detail-clone-test');
    if (!btnClone) {
        btnClone = document.createElement('button'); btnClone.id = 'btn-detail-clone-test';
        footer.insertBefore(btnClone, footer.firstChild);
    }
    if (currentUser && currentUser.role === 'teacher' && !isOwner) {
        const allTests = getTests();
        const isAlreadyAdded = allTests.some(t => t.authorId === currentUser.id && t.clonedFromId === test.id);
        if (isAlreadyAdded) {
            btnClone.className = 'secondary-btn'; btnClone.disabled = true; btnClone.style.opacity = '0.7'; btnClone.style.cursor = 'not-allowed';
            btnClone.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="3" style="display:inline-block; vertical-align:middle; margin-right:4px;"><polyline points="20 6 9 17 4 12"></polyline></svg> Додано';
        } else {
            btnClone.className = 'secondary-btn'; btnClone.disabled = false; btnClone.style.opacity = '1'; btnClone.style.cursor = 'pointer'; btnClone.textContent = 'Додати собі';
        }
        btnClone.style.display = 'inline-flex';
        const newBtnClone = btnClone.cloneNode(true);
        btnClone.parentNode.replaceChild(newBtnClone, btnClone);
        if (!isAlreadyAdded) {
            newBtnClone.addEventListener('click', async () => {
                await cloneTest(test.id);
                const refreshedTest = getTests().find(t => t.id === test.id);
                if (refreshedTest) await openTeacherTestDetail(refreshedTest, source);
            });
        }
    } else { btnClone.style.display = 'none'; }

    const btnBack = document.getElementById('btn-back-to-teacher');
    const newBtnBack = btnBack.cloneNode(true);
    btnBack.parentNode.replaceChild(newBtnBack, btnBack);
    newBtnBack.addEventListener('click', () => showScreen(source));

    showScreen('teacherTestDetail');
}

function updateQuestionCount() { document.getElementById('question-count-badge').textContent = `${document.getElementById('questions-list').children.length} питань`; }

function addQuestionToBuilder() {
    const qNode = document.getElementById('question-template').content.cloneNode(true);
    const qCard = qNode.querySelector('.question-card');
    const optionsContainer = qCard.querySelector('.options-container');
    const typeSelect = qCard.querySelector('.q-type-select');
    const optionsBuilder = qCard.querySelector('.options-builder');
    const textBuilder = qCard.querySelector('.text-answer-builder');
    typeSelect.addEventListener('change', (e) => {
        if (e.target.value === 'text') { optionsBuilder.classList.add('hidden'); textBuilder.classList.remove('hidden'); }
        else { optionsBuilder.classList.remove('hidden'); textBuilder.classList.add('hidden'); }
    });
    const fileInput = qCard.querySelector('.q-image-file');
    const previewContainer = qCard.querySelector('.q-image-preview');
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) { showToast('Картинка завелика', 'error'); fileInput.value = ''; return; }
            try {
                const b64 = await fileToBase64(file);
                qCard.dataset.imageBase64 = b64;
                previewContainer.querySelector('img').src = b64;
                previewContainer.classList.remove('hidden');
            } catch (err) { showToast('Помилка', 'error'); }
        }
    });
    addOptionToQuestion(optionsContainer); addOptionToQuestion(optionsContainer);
    qCard.querySelector('.btn-remove-question').addEventListener('click', () => { qCard.remove(); updateQuestionNumbers(); updateQuestionCount(); });
    qCard.querySelector('.btn-add-option').addEventListener('click', () => addOptionToQuestion(optionsContainer));
    document.getElementById('questions-list').appendChild(qCard);
    updateQuestionNumbers(); updateQuestionCount();
}

function updateQuestionNumbers() { Array.from(document.getElementById('questions-list').children).forEach((card, index) => { card.querySelector('.q-num').textContent = index + 1; }); }

function addOptionToQuestion(container) {
    const oNode = document.getElementById('option-template').content.cloneNode(true); const oRow = oNode.querySelector('.option-row');
    oRow.querySelector('.btn-remove-option').addEventListener('click', () => { if (container.children.length > 2) oRow.remove(); else showToast('Мінімум 2 варіанти.', 'error'); });
    container.appendChild(oRow);
}

document.getElementById('btn-add-question').addEventListener('click', addQuestionToBuilder);

document.getElementById('create-test-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('test-title').value.trim();
    const description = document.getElementById('test-desc').value.trim();
    const timeLimitStr = document.getElementById('test-time').value.trim();
    const timeLimit = timeLimitStr ? parseInt(timeLimitStr) : null;
    const qCards = document.getElementById('questions-list').querySelectorAll('.question-card');
    if (qCards.length === 0) { showToast('Додайте хоча б одне питання.', 'error'); return; }
    const questions = []; let isValid = true;
    qCards.forEach(card => {
        const type = card.querySelector('.q-type-select').value;
        const qText = card.querySelector('.q-text').value.trim();
        if (type === 'multiple') {
            const oRows = card.querySelectorAll('.option-row');
            const options = []; let hasCorrect = false;
            oRows.forEach(row => {
                const isCorrect = row.querySelector('.q-correct-checkbox').checked;
                const text = row.querySelector('.o-text').value.trim();
                if (isCorrect) hasCorrect = true;
                options.push({ text, isCorrect });
            });
            if (!hasCorrect) { showToast('У питаннях з вибором має бути хоча б одна правильна відповідь.', 'error'); isValid = false; }
            questions.push({ type, text: qText, image: card.dataset.imageBase64 || null, options });
        } else {
            const correctText = card.querySelector('.q-correct-text').value.trim();
            if (!correctText) { showToast('Введіть правильну відповідь для відкритого питання.', 'error'); isValid = false; }
            questions.push({ type, text: qText, image: card.dataset.imageBase64 || null, correctText });
        }
    });
    if (!isValid) return;

    const btnSave = document.getElementById('btn-save-test');
    btnSave.disabled = true; btnSave.textContent = 'Збереження...';

    if (editingTestId) {
        const originalTest = testsCache.find(t => t.id === editingTestId);
        const updatedTest = {
            id: editingTestId,
            authorId: currentUser.id,
            authorName: currentUser.name,
            joinCode: originalTest ? originalTest.joinCode : generateJoinCode(),
            title, description,
            coverImage: tempTestCoverBase64 || (originalTest ? originalTest.coverImage : null),
            timeLimit,
            createdAt: originalTest ? originalTest.createdAt : new Date().toISOString(),
            questions, isPublic: false,
            clonedFromId: originalTest ? originalTest.clonedFromId : null,
            isEdited: originalTest && originalTest.clonedFromId ? true : false
        };
        await updateTestInDb(updatedTest);
        showToast('Тест успішно оновлено!');
    } else {
        const newTest = {
            id: Date.now().toString(), authorId: currentUser.id, authorName: currentUser.name,
            joinCode: generateJoinCode(), title, description,
            coverImage: tempTestCoverBase64 || null, timeLimit,
            createdAt: new Date().toISOString(), questions, isPublic: false
        };
        await saveTest(newTest);
        showToast('Тест успішно створено!');
    }

    btnSave.disabled = false;
    renderTeacherTests(); showScreen('teacherDashboard');
});

async function cloneTest(testId) {
    const original = testsCache.find(t => t.id === testId);
    if (!original) return;
    const newTest = JSON.parse(JSON.stringify(original));
    newTest.id = Date.now().toString();
    newTest.clonedFromId = original.id;
    newTest.isEdited = false;
    newTest.authorId = currentUser.id;
    newTest.authorName = currentUser.name;
    newTest.joinCode = generateJoinCode();
    newTest.isPublic = false;
    newTest.createdAt = new Date().toISOString();
    await saveTest(newTest);
    showToast('Тест успішно додано до вашого кабінету!', 'success');
    renderPublicTests();
}

// --- TEST TAKER MODULE ---
let currentTakingTest = null; let currentQuestionIndex = 0; let userAnswers = []; let timerInterval = null; let timeLeftSeconds = 0; let testStartTime = null;
let currentGroupId = null; let currentGroupName = null;

async function startTest(testId) {
    if (currentUser && currentUser.role === 'student') {
        const { data: existing } = await db.from('history').select('id').eq('test_id', testId).eq('user_id', currentUser.id).limit(1);
        if (existing && existing.length > 0) {
            showToast('Ви вже проходили цей тест. Зверніться до викладача для видалення результату.', 'error');
            return;
        }
    }
    const tests = getTests(); currentTakingTest = tests.find(t => t.id === testId);
    currentQuestionIndex = 0; userAnswers = currentTakingTest.questions.map(() => null);
    testStartTime = Date.now();
    document.getElementById('current-test-title').textContent = currentTakingTest.title;
    const timerDisplay = document.getElementById('timer-display');
    if (currentTakingTest.timeLimit) {
        timeLeftSeconds = currentTakingTest.timeLimit * 60; updateTimerUI(); timerDisplay.classList.remove('hidden');
        clearInterval(timerInterval);
        timerInterval = setInterval(() => {
            timeLeftSeconds--; updateTimerUI();
            if (timeLeftSeconds <= 0) { clearInterval(timerInterval); showToast('Час вичерпано!', 'error'); finishTest(); }
        }, 1000);
    } else { timerDisplay.classList.add('hidden'); }
    renderCurrentQuestion(); showScreen('testTaker');
}

function updateTimerUI() {
    const mins = Math.floor(timeLeftSeconds / 60); const secs = timeLeftSeconds % 60;
    document.getElementById('time-remaining').textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    const timerDisplay = document.getElementById('timer-display');
    if (timeLeftSeconds < 60) { timerDisplay.style.backgroundColor = 'var(--error)'; timerDisplay.style.color = 'white'; }
    else { timerDisplay.style.backgroundColor = 'var(--error-light)'; timerDisplay.style.color = 'var(--error)'; }
}

document.getElementById('btn-cancel-test').addEventListener('click', () => { if (confirm('Вийти з тестування? Прогрес не збережеться.')) { clearInterval(timerInterval); goHome(); } });

function renderCurrentQuestion() {
    const q = currentTakingTest.questions[currentQuestionIndex]; const totalQ = currentTakingTest.questions.length;
    document.getElementById('question-counter').textContent = `Питання ${currentQuestionIndex + 1} з ${totalQ}`;
    document.getElementById('test-progress').style.width = `${((currentQuestionIndex) / totalQ) * 100}%`;
    document.getElementById('current-question-text').textContent = q.text;
    const imgContainer = document.getElementById('question-image-container');
    if (q.image) { imgContainer.querySelector('img').src = q.image; imgContainer.classList.remove('hidden'); }
    else { imgContainer.classList.add('hidden'); }
    const optionsList = document.getElementById('current-options-list');
    const textAnswerContainer = document.getElementById('current-text-answer-container');
    const hint = document.getElementById('multiple-answers-hint');
    const btnNext = document.getElementById('btn-next-question');
    btnNext.disabled = true; btnNext.textContent = currentQuestionIndex === totalQ - 1 ? 'Завершити тест' : 'Наступне питання';
    if (q.type === 'multiple') {
        optionsList.classList.remove('hidden'); textAnswerContainer.classList.add('hidden'); optionsList.innerHTML = '';
        userAnswers[currentQuestionIndex] = userAnswers[currentQuestionIndex] || [];
        const isMultiple = q.options.filter(o => o.isCorrect).length > 1;
        hint.textContent = isMultiple ? 'Оберіть УСІ правильні варіанти.' : 'Оберіть один правильний варіант.';
        btnNext.disabled = userAnswers[currentQuestionIndex].length === 0;
        q.options.forEach((opt, index) => {
            const btn = document.createElement('button'); btn.className = 'option-btn';
            if (userAnswers[currentQuestionIndex].includes(index)) btn.classList.add('selected');
            btn.innerHTML = `<div class="option-checkbox-ui"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" style="display: ${userAnswers[currentQuestionIndex].includes(index) ? 'block' : 'none'}"><polyline points="20 6 9 17 4 12"></polyline></svg></div><span>${opt.text}</span>`;
            btn.addEventListener('click', () => {
                let ansArr = userAnswers[currentQuestionIndex];
                if (!isMultiple) {
                    ansArr = [index];
                    Array.from(optionsList.children).forEach(b => { b.classList.remove('selected'); b.querySelector('svg').style.display = 'none'; });
                    btn.classList.add('selected'); btn.querySelector('svg').style.display = 'block';
                } else {
                    const idx = ansArr.indexOf(index);
                    if (idx > -1) { ansArr.splice(idx, 1); btn.classList.remove('selected'); btn.querySelector('svg').style.display = 'none'; }
                    else { ansArr.push(index); btn.classList.add('selected'); btn.querySelector('svg').style.display = 'block'; }
                }
                userAnswers[currentQuestionIndex] = ansArr; btnNext.disabled = ansArr.length === 0;
            });
            optionsList.appendChild(btn);
        });
    } else {
        optionsList.classList.add('hidden'); textAnswerContainer.classList.remove('hidden');
        hint.textContent = 'Введіть вашу відповідь текстом.';
        const txtInput = document.getElementById('student-text-answer');
        txtInput.value = userAnswers[currentQuestionIndex] || '';
        btnNext.disabled = txtInput.value.trim() === '';
        txtInput.oninput = () => { userAnswers[currentQuestionIndex] = txtInput.value.trim(); btnNext.disabled = txtInput.value.trim() === ''; };
    }
}

document.getElementById('btn-next-question').addEventListener('click', async () => {
    document.getElementById('test-progress').style.width = `${((currentQuestionIndex + 1) / currentTakingTest.questions.length) * 100}%`;
    if (currentQuestionIndex < currentTakingTest.questions.length - 1) { currentQuestionIndex++; setTimeout(renderCurrentQuestion, 200); }
    else { await finishTest(); }
});

async function finishTest() {
    clearInterval(timerInterval); let score = 0; const total = currentTakingTest.questions.length;
    currentTakingTest.questions.forEach((q, idx) => {
        const userAns = userAnswers[idx];
        if (q.type === 'text') {
            if (userAns && userAns.toLowerCase() === q.correctText.toLowerCase()) score++;
        } else {
            const correctIndices = []; q.options.forEach((o, i) => { if (o.isCorrect) correctIndices.push(i); });
            const userSelected = userAns || [];
            if (correctIndices.length === userSelected.length && correctIndices.every(val => userSelected.includes(val))) score++;
        }
    });
    const percentage = Math.round((score / total) * 100);
    let timeTakenSeconds = Math.floor((Date.now() - testStartTime) / 1000);
    let timeTakenStr = `${Math.floor(timeTakenSeconds / 60).toString().padStart(2, '0')}:${(timeTakenSeconds % 60).toString().padStart(2, '0')}`;
    await saveResult(currentTakingTest.id, currentTakingTest.title, currentTakingTest.authorId, currentTakingTest.joinCode, score, total, percentage, timeTakenStr);
    document.getElementById('score-text').textContent = `Ви відповіли правильно на ${score} з ${total} питань.`;
    document.getElementById('score-percentage').textContent = `${percentage}%`;
    const circlePath = document.getElementById('score-circle-path');
    const color = percentage >= 80 ? 'var(--success)' : (percentage >= 50 ? 'var(--warning)' : 'var(--error)');
    circlePath.style.stroke = color; document.getElementById('score-percentage').style.fill = color;
    setTimeout(() => { circlePath.setAttribute('stroke-dasharray', `${percentage}, 100`); }, 100);
    const motivation = document.getElementById('motivation-text');
    if (percentage === 100) motivation.textContent = "Ідеальний результат! Відмінна робота.";
    else if (percentage >= 70) motivation.textContent = "Добре впорались! У вас гарний рівень.";
    else if (percentage >= 50) motivation.textContent = "Непогано, але варто повторити матеріал.";
    else motivation.textContent = "Спробуйте ще раз після вивчення матеріалу.";
    document.getElementById('btn-back-to-dashboard-student').onclick = () => { document.getElementById('score-circle-path').setAttribute('stroke-dasharray', `0, 100`); goHome(); };
    showScreen('testResults');
}

// Start the app
init();
