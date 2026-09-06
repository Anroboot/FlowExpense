// Начальные демо-данные
const DEMO_EXPENSES = [
    { id: "1", amount: 1250, category: "Еда", date: "2026-03-01", description: "Продукты на неделю" },
    { id: "2", amount: 350, category: "Транспорт", date: "2026-03-02", description: "Пополнение проездного" },
    { id: "3", amount: 4500, category: "Покупки", date: "2026-03-03", description: "Новые кроссовки" },
    { id: "4", amount: 800, category: "Развлечения", date: "2026-03-04", description: "Билеты в кино" },
    { id: "5", amount: 2100, category: "Здоровье", date: "2026-03-05", description: "Витамины и аптека" }
];

// Состояние приложения
let expenses = [];
let currentTheme = 'dark';

// DOM-элементы
const themeToggleBtn = document.getElementById('themeToggle');
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');
const pageTitle = document.getElementById('pageTitle');
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const sidebar = document.querySelector('.sidebar');

// Modal Elements
const expenseModal = document.getElementById('expenseModal');
const modalOverlay = document.getElementById('modalOverlay');
const openAddModalBtn = document.getElementById('openAddModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const expenseForm = document.getElementById('expenseForm');
const modalTitle = document.getElementById('modalTitle');

// Form Inputs
const expenseIdInput = document.getElementById('expenseId');
const amountInput = document.getElementById('amountInput');
const categorySelect = document.getElementById('categorySelect');
const dateInput = document.getElementById('dateInput');
const descriptionInput = document.getElementById('descriptionInput');

// Filter Inputs
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const sortBy = document.getElementById('sortBy');

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadExpenses();
    initEventListeners();
    renderApp();
});

// Работа с LocalStorage
function loadExpenses() {
    const saved = localStorage.getItem('flow_expenses');
    if (saved) {
        expenses = JSON.parse(saved);
    } else {
        expenses = [...DEMO_EXPENSES];
        saveExpenses();
    }
}

function saveExpenses() {
    localStorage.setItem('flow_expenses', JSON.stringify(expenses));
}

// Тематизация
function initTheme() {
    const savedTheme = localStorage.getItem('flow_theme') || 'dark';
    setTheme(savedTheme);
}

function setTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('flow_theme', theme);
    
    const icon = themeToggleBtn.querySelector('.theme-icon');
    const text = themeToggleBtn.querySelector('.theme-text');
    if (theme === 'dark') {
        icon.textContent = '🌙';
        text.textContent = 'Тёмная тема';
    } else {
        icon.textContent = '☀️';
        text.textContent = 'Светлая тема';
    }
}

// Обработчики событий
function initEventListeners() {
    // Смена темы
    themeToggleBtn.addEventListener('click', () => {
        setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });

    // Навигация
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabName = item.dataset.tab;
            
            navItems.forEach(nav => nav.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));

            item.classList.add('active');
            document.getElementById(`${tabName}Tab`).classList.add('active');
            pageTitle.textContent = tabName === 'dashboard' ? 'Дашборд' : 'Расходы';
            
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('mobile-open');
            }
        });
    });

    // Мобильное меню
    mobileMenuBtn.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
    });

    // Модальное окно
    openAddModalBtn.addEventListener('click', () => openModal());
    closeModalBtn.addEventListener('click', closeModal);
    cancelModalBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);

    // Форма
    expenseForm.addEventListener('submit', handleFormSubmit);

    // Фильтры
    searchInput.addEventListener('input', renderExpensesTable);
    categoryFilter.addEventListener('change', renderExpensesTable);
    sortBy.addEventListener('change', renderExpensesTable);
}

// Управление модальным окном
function openModal(expense = null) {
    if (expense) {
        modalTitle.textContent = 'Редактировать расход';
        expenseIdInput.value = expense.id;
        amountInput.value = expense.amount;
        categorySelect.value = expense.category;
        dateInput.value = expense.date;
        descriptionInput.value = expense.description;
    } else {
        modalTitle.textContent = 'Добавить расход';
        expenseForm.reset();
        expenseIdInput.value = '';
        dateInput.value = new Date().toISOString().split('T')[0];
    }
    expenseModal.classList.add('active');
}

function closeModal() {
    expenseModal.classList.remove('active');
}

// Сохранение / Изменение расхода
function handleFormSubmit(e) {
    e.preventDefault();

    const id = expenseIdInput.value;
    const amount = parseFloat(amountInput.value);
    const category = categorySelect.value;
    const date = dateInput.value;
    const description = descriptionInput.value.trim();

    if (!amount || !date || !description) return;

    if (id) {
        // Редактирование
        expenses = expenses.map(item => 
            item.id === id ? { id, amount, category, date, description } : item
        );
    } else {
        // Добавление
        const newExpense = {
            id: Date.now().toString(),
            amount,
            category,
            date,
            description
        };
        expenses.unshift(newExpense);
    }

    saveExpenses();
    renderApp();
    closeModal();
}

// Удаление расхода
function deleteExpense(id) {
    if (confirm('Вы уверены, что хотите удалить эту запись?')) {
        expenses = expenses.filter(item => item.id !== id);
        saveExpenses();
        renderApp();
    }
}

// Отрисовка приложения
function renderApp() {
    renderStats();
    renderChart();
    renderRecent();
    renderExpensesTable();
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 2 }).format(amount);
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('ru-RU');
}

// Отрисовка статистики
function renderStats() {
    const total = expenses.reduce((sum, item) => sum + item.amount, 0);
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyTotal = expenses.reduce((sum, item) => {
        const itemDate = new Date(item.date);
        if (itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear) {
            return sum + item.amount;
        }
        return sum;
    }, 0);

    document.getElementById('totalExpenses').textContent = formatCurrency(total);
    document.getElementById('monthlyExpenses').textContent = formatCurrency(monthlyTotal);
    document.getElementById('totalCount').textContent = expenses.length;
}

// Отрисовка графика категорий
function renderChart() {
    const chartContainer = document.getElementById('categoryChart');
    chartContainer.innerHTML = '';

    const categoriesTotal = {};
    let maxTotal = 0;

    expenses.forEach(item => {
        categoriesTotal[item.category] = (categoriesTotal[item.category] || 0) + item.amount;
    });

    Object.values(categoriesTotal).forEach(val => {
        if (val > maxTotal) maxTotal = val;
    });

    if (Object.keys(categoriesTotal).length === 0) {
        chartContainer.innerHTML = '<p class="empty-state">Нет данных для графика</p>';
        return;
    }

    for (const [cat, total] of Object.entries(categoriesTotal)) {
        const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;

        const barItem = document.createElement('div');
        barItem.className = 'chart-bar-item';
        barItem.innerHTML = `
            <div class="chart-bar-label">
                <span>${cat}</span>
                <span>${formatCurrency(total)}</span>
            </div>
            <div class="chart-bar-bg">
                <div class="chart-bar-fill" style="width: ${percentage}%"></div>
            </div>
        `;
        chartContainer.appendChild(barItem);
    }
}

// Отрисовка последних операций
function renderRecent() {
    const recentContainer = document.getElementById('recentList');
    recentContainer.innerHTML = '';

    const recent = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

    if (recent.length === 0) {
        recentContainer.innerHTML = '<p class="empty-state">Нет операций</p>';
        return;
    }

    recent.forEach(item => {
        const el = document.createElement('div');
        el.className = 'recent-item';
        el.innerHTML = `
            <div class="recent-info">
                <h4>${escapeHtml(item.description)}</h4>
                <span>${formatDate(item.date)} • ${item.category}</span>
            </div>
            <div class="recent-amount">-${formatCurrency(item.amount)}</div>
        `;
        recentContainer.appendChild(el);
    });
}

// Отрисовка таблицы
function renderExpensesTable() {
    const tbody = document.getElementById('expensesTableBody');
    const emptyState = document.getElementById('emptyState');
    tbody.innerHTML = '';

    const query = searchInput.value.toLowerCase().trim();
    const cat = categoryFilter.value;
    const sort = sortBy.value;

    let filtered = expenses.filter(item => {
        const matchesSearch = item.description.toLowerCase().includes(query);
        const matchesCategory = cat === 'ALL' || item.category === cat;
        return matchesSearch && matchesCategory;
    });

    // Сортировка
    filtered.sort((a, b) => {
        if (sort === 'date-desc') return new Date(b.date) - new Date(a.date);
        if (sort === 'date-asc') return new Date(a.date) - new Date(b.date);
        if (sort === 'amount-desc') return b.amount - a.amount;
        if (sort === 'amount-asc') return a.amount - b.amount;
    });

    if (filtered.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');
    }

    filtered.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${formatDate(item.date)}</td>
            <td><span class="category-badge">${item.category}</span></td>
            <td>${escapeHtml(item.description)}</td>
            <td style="font-weight: 600;">${formatCurrency(item.amount)}</td>
            <td class="text-right">
                <button class="action-btn edit-btn" data-id="${item.id}">✏️</button>
                <button class="action-btn delete-btn" data-id="${item.id}">🗑️</button>
            </td>
        `;

        tr.querySelector('.edit-btn').addEventListener('click', () => {
            const exp = expenses.find(e => e.id === item.id);
            openModal(exp);
        });

        tr.querySelector('.delete-btn').addEventListener('click', () => {
            deleteExpense(item.id);
        });

        tbody.appendChild(tr);
    });
}

function escapeHtml(str) {
    return str.replace(/[&<>"']/g, match => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[match]));
}