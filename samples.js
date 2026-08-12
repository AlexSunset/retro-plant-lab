// ============================================
// 🔬 ХРАНИЛИЩЕ ОБРАЗЦОВ v3.0
// Система комментариев для задач
// ============================================

// 🔥 Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA7Zpsng2b6I02RZ7r7VtwXzzN-gR_kNmk",
    authDomain: "retro-tkat.firebaseapp.com",
    databaseURL: "https://retro-tkat-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "retro-tkat",
    storageBucket: "retro-tkat.firebasestorage.app",
    messagingSenderId: "526671550405",
    appId: "1:526671550405:web:fded37933b6c890ed95dac",
    measurementId: "G-EVC7M9W82C"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Данные задач
const tasks = [
    { key: "AS-26075", title: "Миграция EcomDirect и SharelinkDirect в новый алаймент" },
    { key: "AS-25596", title: "Создание SafeDeal" },
    { key: "ACQSP-3357", title: "Редактирование параметров sharelinkDirect" },
    { key: "AS-26308", title: "[T-KAT] Доработать процки для проекта по объединению гардов (убрать старый тег)" },
    { key: "ACQSP-2503", title: "Услуги в FineDog" },
    { key: "AS-25674", title: "SafeDeal: отображение общих данных по магазину" },
    { key: "AS-26532", title: "[T-KAT] Отключить установку ставок С2А" },
    { key: "AS-26352", title: "Доступ к админке ИЭ для диспутов" },
    { key: "AS-26585", title: "[T-KAT] Выгрузка по компании в синей с логинами" },
    { key: "AS-21634", title: "Аналитика в Twork" },
    { key: "ACQSP-1401", title: "Переход на Angular 21 и Taiga UI 4" },
    { key: "ACQSP-1805", title: "Магазин safeDeal. Просмотр списка магазинов" }
];

// Текущий пользователь
const storedName = localStorage.getItem('scientistName');
let currentUserName = storedName || 'Аноним';

if (!storedName) {
    console.warn('⚠️ Имя не найдено в localStorage. Перенаправление на титульную страницу...');
    // Можно раскомментировать для строгой проверки:
    // window.location.href = 'index.html';
}

console.log(`👨‍🔬 Учёный в хранилище: ${currentUserName}`);
let currentTaskKey = null;

// ============================================
// 🎯 Инициализация
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🧫 Хранилище образцов загружено');
    renderTasks();
    setupModal();
});

// ============================================
// 📋 Рендеринг задач
// ============================================

function renderTasks() {
    const grid = document.getElementById('samplesGrid');
    grid.innerHTML = '';

    tasks.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = 'task-card';
        taskCard.innerHTML = `
            <div class="task-header">
                <a href="https://jira.tcsbank.ru/browse/${task.key}" target="_blank" class="task-key">
                    ${task.key}
                </a>
                <button class="btn-add-sample" data-task="${task.key}" title="Добавить образец">
                    + Образец
                </button>
            </div>
            <p class="task-title">${task.title}</p>
            <div class="samples-list" id="samples-${task.key}">
                <div class="loading-samples">Загрузка образцов...</div>
            </div>
        `;
        grid.appendChild(taskCard);

        // Подписка на комментарии задачи
        subscribeToSamples(task.key);
    });

    // Обработчики кнопок "Добавить образец"
    document.querySelectorAll('.btn-add-sample').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentTaskKey = e.target.dataset.task;
            openModal();
        });
    });
}

// ============================================
// 💬 Работа с комментариями (образцами)
// ============================================

function subscribeToSamples(taskKey) {
    const samplesRef = db.ref(`samples/${taskKey}`);
    
    samplesRef.on('value', (snapshot) => {
        const container = document.getElementById(`samples-${taskKey}`);
        if (!container) return;

        const samples = snapshot.val() || {};
        
        if (Object.keys(samples).length === 0) {
            container.innerHTML = '<div class="no-samples">Нет образцов</div>';
            return;
        }

        container.innerHTML = '';
        
        // Преобразуем объект в массив и сортируем по дате
        const samplesArray = Object.entries(samples)
            .map(([id, data]) => ({ id, ...data }))
            .sort((a, b) => b.timestamp - a.timestamp);

        samplesArray.forEach(sample => {
            const sampleEl = document.createElement('div');
            sampleEl.className = 'sample-item';
            
            // Проверка: может ли текущий пользователь удалить этот образец
            const canDelete = (sample.author === currentUserName) && 
                              (Date.now() - sample.timestamp < 24 * 60 * 60 * 1000); // 24 часа
            
            sampleEl.innerHTML = `
                <div class="sample-author">
                    <span class="sample-icon">🧪</span>
                    <span class="sample-name">${escapeHtml(sample.author)}</span>
                    <span class="sample-date">${formatDate(sample.timestamp)}</span>
                    ${canDelete ? `<button class="btn-delete-sample" data-task="${taskKey}" data-sample-id="${sample.id}" title="Удалить образец">🗑️</button>` : ''}
                </div>
                <div class="sample-text">${escapeHtml(sample.text)}</div>
            `;
            container.appendChild(sampleEl);
        });

        // Обработчики кнопок удаления
        container.querySelectorAll('.btn-delete-sample').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskKey = btn.dataset.task;
                const sampleId = btn.dataset.sampleId;
                if (confirm('Удалить этот образец?')) {
                    deleteSample(taskKey, sampleId);
                }
            });
        });
    });
}

function addSample(taskKey, text) {
    const samplesRef = db.ref(`samples/${taskKey}`);
    const newSampleRef = samplesRef.push();
    
    newSampleRef.set({
        author: currentUserName,
        text: text,
        timestamp: Date.now()
    }).then(() => {
        console.log('✅ Образец добавлен');
    }).catch((error) => {
        console.error('❌ Ошибка добавления образца:', error);
    });
}

function deleteSample(taskKey, sampleId) {
    const sampleRef = db.ref(`samples/${taskKey}/${sampleId}`);
    
    sampleRef.remove().then(() => {
        console.log('✅ Образец удалён');
    }).catch((error) => {
        console.error('❌ Ошибка удаления образца:', error);
    });
}

// ============================================
// 🪟 Модальное окно
// ============================================

function setupModal() {
    const modal = document.getElementById('commentModal');
    const closeBtn = document.getElementById('modalClose');
    const cancelBtn = document.getElementById('cancelBtn');
    const submitBtn = document.getElementById('submitBtn');
    const commentText = document.getElementById('commentText');
    const charCount = document.getElementById('charCount');
    const taskInfo = document.getElementById('modalTaskInfo');

    // Закрытие
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Закрытие по клику вне окна
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Счётчик символов
    commentText.addEventListener('input', () => {
        charCount.textContent = commentText.value.length;
    });

    // Отправка
    submitBtn.addEventListener('click', () => {
        const text = commentText.value.trim();
        if (text && currentTaskKey) {
            addSample(currentTaskKey, text);
            closeModal();
            commentText.value = '';
            charCount.textContent = '0';
        }
    });

    // Enter для отправки (Ctrl+Enter)
    commentText.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            submitBtn.click();
        }
    });
}

function openModal() {
    const modal = document.getElementById('commentModal');
    const taskInfo = document.getElementById('modalTaskInfo');
    const task = tasks.find(t => t.key === currentTaskKey);
    
    if (task) {
        taskInfo.innerHTML = `
            <strong>Задача:</strong> ${task.key} — ${task.title}
        `;
    }
    
    modal.classList.add('modal-active');
    document.getElementById('commentText').focus();
}

function closeModal() {
    const modal = document.getElementById('commentModal');
    modal.classList.remove('modal-active');
}

// ============================================
// 🛠️ Утилиты
// ============================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
}

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    // Менее минуты
    if (diff < 60000) return 'только что';
    
    // Менее часа
    if (diff < 3600000) {
        const mins = Math.floor(diff / 60000);
        return `${mins} мин. назад`;
    }
    
    // Менее дня
    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} ч. назад`;
    }
    
    // Больше дня
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    });
}
