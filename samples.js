// ============================================
// ХРАНИЛИЩЕ ОБРАЗЦОВ | T-KAT Retro
// ============================================

// Стандартные задачи
const DEFAULT_TASKS = [
    { key: 'AS-26075', title: 'Миграция EcomDirect и SharelinkDirect в новый алаймент', url: 'https://jira.tcsbank.ru/browse/AS-26075' },
    { key: 'AS-25596', title: 'Создание SafeDeal', url: 'https://jira.tcsbank.ru/browse/AS-25596' },
    { key: 'ACQSP-3357', title: 'Редактирование параметров sharelinkDirect', url: 'https://jira.tcsbank.ru/browse/ACQSP-3357' },
    { key: 'AS-26308', title: '[T-KAT] Доработать процки для проекта по объединению гардов (убрать старый тег)', url: 'https://jira.tcsbank.ru/browse/AS-26308' },
    { key: 'ACQSP-2503', title: 'Услуги в FineDog', url: 'https://jira.tcsbank.ru/browse/ACQSP-2503' },
    { key: 'AS-25674', title: 'SafeDeal: отображение общих данных по магазину', url: 'https://jira.tcsbank.ru/browse/AS-25674' },
    { key: 'AS-26532', title: '[T-KAT] Отключить установку ставок С2А', url: 'https://jira.tcsbank.ru/browse/AS-26532' },
    { key: 'AS-26352', title: 'Доступ к админке ИЭ для диспутов', url: 'https://jira.tcsbank.ru/browse/AS-26352' },
    { key: 'AS-26585', title: '[T-KAT] Выгрузка по компании в синей с логинами', url: 'https://jira.tcsbank.ru/browse/AS-26585' },
    { key: 'AS-21634', title: 'Аналитика в Twork', url: 'https://jira.tcsbank.ru/browse/AS-21634' },
    { key: 'ACQSP-1401', title: 'Переход на Angular 21 и Taiga UI 4', url: 'https://jira.tcsbank.ru/browse/ACQSP-1401' },
    { key: 'ACQSP-1805', title: 'Магазин safeDeal. Просмотр списка магазинов', url: 'https://jira.tcsbank.ru/browse/ACQSP-1805' }
];

// Конфигурация Firebase
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

// Текущий пользователь
let currentUserName = null;
let currentSessionId = null;

// ============================================
// ПРОВЕРКА ИМЕНИ
// ============================================

currentUserName = localStorage.getItem('scientistName');

// Проверка имени
if (!currentUserName || currentUserName === 'undefined' || currentUserName === 'null') {
    console.error('❌ Нет имени учёного, возврат на титульную');
    window.location.href = 'index.html';
} else {
    // Весь код внутри else
    
    currentSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    console.log('🧫 Хранилище Образцов загружено');
    console.log(`👨‍🔬 Учёный в хранилище: ${currentUserName} | Session: ${currentSessionId}`);
    
    // ============================================
    // ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
    // ============================================
    
    document.addEventListener('DOMContentLoaded', () => {
        // Рендерим стандартные задачи
        renderDefaultTasks();
        
        // Загружаем кастомные задачи
        loadCustomTasks();
        
        // Модальное окно для комментария
        setupCommentModal();
        
        // Модальное окно для добавления задачи
        setupAddTaskModal();
    });
    
    // ============================================
    // СТАНДАРТНЫЕ ЗАДАЧИ
    // ============================================
    
    function renderDefaultTasks() {
        const grid = document.getElementById('samplesGrid');
        grid.innerHTML = '';
        
        DEFAULT_TASKS.forEach(task => {
            const card = createTaskCard(task.key, task.title, task.url, false);
            grid.appendChild(card);
            
            // Загружаем образцы для задачи
            loadSamples(task.key);
        });
    }
    
    // ============================================
    // КАСТОМНЫЕ ЗАДАЧИ
    // ============================================
    
    function loadCustomTasks() {
        const customTasksRef = db.ref('customTasks');
        
        customTasksRef.on('value', (snapshot) => {
            console.log('📦 Получены кастомные задачи:', snapshot.val());
            
            // Удаляем старые кастомные задачи из DOM
            document.querySelectorAll('.task-card.custom-task').forEach(el => el.remove());
            
            const data = snapshot.val();
            if (!data) return;
            
            // Добавляем кастомные задачи в сетку
            Object.entries(data).forEach(([taskId, task]) => {
                const grid = document.getElementById('samplesGrid');
                const card = createTaskCard(task.key, task.title, task.url, true, taskId, task.addedBy);
                grid.appendChild(card);
                
                // Загружаем образцы для кастомной задачи
                loadSamples(task.key);
            });
        });
    }
    
    function addCustomTask(key, title, url) {
        const newTaskRef = db.ref('customTasks').push();
        newTaskRef.set({
            key: key,
            title: title,
            url: url,
            addedBy: currentUserName,
            timestamp: Date.now()
        }).then(() => {
            console.log('✅ Кастомная задача добавлена');
            closeModal('addTaskModal');
        }).catch(error => {
            console.error('❌ Ошибка добавления задачи:', error);
            alert('Ошибка добавления задачи: ' + error.message);
        });
    }
    
    function deleteCustomTask(taskId) {
        if (!confirm('Удалить эту задачу и все образцы?')) return;
        
        db.ref('customTasks/' + taskId).remove()
          .then(() => {
              console.log('✅ Задача удалена');
              // Образцы удалятся автоматически при очистке в loadSamples
          })
          .catch(error => {
              console.error('❌ Ошибка удаления задачи:', error);
          });
    }
    
    // ============================================
    // СОЗДАНИЕ КАРТОЧКИ ЗАДАЧИ
    // ============================================
    
    function createTaskCard(key, title, url, isCustom, taskId = null, addedBy = null) {
        const card = document.createElement('div');
        card.className = 'task-card' + (isCustom ? ' custom-task' : '');
        card.dataset.taskKey = key;
        card.dataset.taskTitle = title;
        card.dataset.taskUrl = url;
        
        const header = document.createElement('div');
        header.className = 'task-header';
        
        const keyLink = document.createElement('a');
        keyLink.href = url;
        keyLink.target = '_blank';
        keyLink.className = 'task-key';
        keyLink.textContent = key;
        
        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.gap = '8px';
        
        const addSampleBtn = document.createElement('button');
        addSampleBtn.className = 'btn-add-sample';
        addSampleBtn.textContent = '+ Образец';
        addSampleBtn.dataset.action = 'addSample';
        addSampleBtn.dataset.taskKey = key;
        addSampleBtn.dataset.taskTitle = title;
        addSampleBtn.onclick = function(e) {
            e.stopPropagation();
            const taskKey = this.dataset.taskKey;
            const taskTitle = this.dataset.taskTitle;
            openCommentModal(taskKey, taskTitle);
        };
        
        actions.appendChild(addSampleBtn);
        
        if (isCustom && taskId) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-delete-task';
            deleteBtn.textContent = '🗑️';
            deleteBtn.title = 'Удалить задачу';
            deleteBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                deleteCustomTask(taskId);
            };
            actions.appendChild(deleteBtn);
        }
        
        header.appendChild(keyLink);
        header.appendChild(actions);
        
        const taskTitle = document.createElement('div');
        taskTitle.className = 'task-title';
        taskTitle.textContent = title;
        
        const samplesList = document.createElement('div');
        samplesList.className = 'samples-list';
        samplesList.id = 'samples-' + key;
        samplesList.innerHTML = '<div class="loading-samples">Загрузка образцов...</div>';
        
        card.appendChild(header);
        card.appendChild(taskTitle);
        card.appendChild(samplesList);
        
        return card;
    }
    
    // ============================================
    // ОБРАЗЦЫ (КОММЕНТАРИИ)
    // ============================================
    
    function loadSamples(taskKey) {
        const samplesRef = db.ref('samples/' + taskKey);
        const container = document.getElementById('samples-' + taskKey);
        
        if (!container) return;
        
        samplesRef.on('value', (snapshot) => {
            const data = snapshot.val();
            
            if (!data || Object.keys(data).length === 0) {
                container.innerHTML = '<div class="no-samples">Нет образцов</div>';
                return;
            }
            
            container.innerHTML = '';
            
            // Сортируем по времени (новые сверху)
            const samples = Object.entries(data).sort((a, b) => b[1].timestamp - a[1].timestamp);
            
            samples.forEach(([sampleId, sample]) => {
                const sampleEl = createSampleElement(sampleId, sample);
                container.appendChild(sampleEl);
            });
        });
    }
    
    function createSampleElement(sampleId, sample) {
        const div = document.createElement('div');
        div.className = 'sample-item';
        
        const author = document.createElement('div');
        author.className = 'sample-author';
        
        const icon = document.createElement('span');
        icon.className = 'sample-icon';
        icon.textContent = '🧪';
        
        const name = document.createElement('span');
        name.className = 'sample-name';
        name.textContent = sample.author;
        
        const date = document.createElement('span');
        date.className = 'sample-date';
        date.textContent = formatTime(sample.timestamp);
        
        author.appendChild(icon);
        author.appendChild(name);
        author.appendChild(date);
        
        // Кнопка удаления (только для автора и в течение 24 часов)
        const canDelete = sample.author === currentUserName && 
                          (Date.now() - sample.timestamp < 24 * 60 * 60 * 1000);
        
        if (canDelete) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-delete-sample';
            deleteBtn.textContent = '🗑️';
            deleteBtn.title = 'Удалить образец';
            deleteBtn.onclick = () => deleteSample(sampleId, sample.author);
            author.appendChild(deleteBtn);
        }
        
        const text = document.createElement('div');
        text.className = 'sample-text';
        text.textContent = sample.text;
        
        div.appendChild(author);
        div.appendChild(text);
        
        return div;
    }
    
    function addSample(taskKey, taskTitle, text) {
        const newSampleRef = db.ref('samples/' + taskKey).push();
        
        // Добавляем только образец (без завершения стадии)
        newSampleRef.set({
            author: currentUserName,
            text: text,
            timestamp: Date.now()
        }).then(() => {
            console.log('✅ Образец добавлен');
            closeModal('commentModal');
        }).catch(error => {
            console.error('❌ Ошибка добавления образца:', error);
            alert('Ошибка добавления образца: ' + error.message);
        });
    }
    
    function deleteSample(sampleId, author) {
        if (author !== currentUserName) {
            alert('Можно удалить только свои образцы!');
            return;
        }
        
        db.ref('samples').child(sampleId).remove()
          .then(() => {
              console.log('✅ Образец удалён');
          })
          .catch(error => {
              console.error('❌ Ошибка удаления образца:', error);
          });
    }
    
    // ============================================
    // МОДАЛЬНОЕ ОКНО (КОММЕНТАРИЙ)
    // ============================================
    
    let currentTaskKey = null;
    let currentTaskTitle = null;
    
    function setupCommentModal() {
        // Делегирование событий для всех кнопок "+ Образец"
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('btn-add-sample')) {
                const taskKey = e.target.dataset.taskKey;
                const taskTitle = e.target.dataset.taskTitle;
                openCommentModal(taskKey, taskTitle);
            }
        });
        
        const modal = document.getElementById('commentModal');
        const closeBtn = document.getElementById('modalClose');
        const cancelBtn = document.getElementById('cancelBtn');
        const submitBtn = document.getElementById('submitBtn');
        const textarea = document.getElementById('commentText');
        const charCount = document.getElementById('charCount');
        
        closeBtn.onclick = () => closeModal('commentModal');
        cancelBtn.onclick = () => closeModal('commentModal');
        
        submitBtn.onclick = () => {
            const text = textarea.value.trim();
            if (!text) {
                alert('Введите текст образца');
                return;
            }
            if (!currentTaskKey || !currentTaskTitle) {
                alert('Ошибка: задача не выбрана');
                return;
            }
            addSample(currentTaskKey, currentTaskTitle, text);
        };
        
        textarea.oninput = () => {
            charCount.textContent = textarea.value.length;
        };
        
        // Ctrl+Enter для отправки
        textarea.onkeydown = (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                submitBtn.click();
            }
        };
    }
    
    function openCommentModal(taskKey, taskTitle) {
        console.log('📝 Открытие модального окна:', taskKey, taskTitle);
        currentTaskKey = taskKey;
        currentTaskTitle = taskTitle;
        
        const modal = document.getElementById('commentModal');
        const taskInfo = document.getElementById('modalTaskInfo');
        const textarea = document.getElementById('commentText');
        const charCount = document.getElementById('charCount');
        
        taskInfo.textContent = `${taskKey} — ${taskTitle}`;
        textarea.value = '';
        charCount.textContent = '0';
        
        modal.classList.add('modal-active');
        textarea.focus();
    }
    
    // ============================================
    // МОДАЛЬНОЕ ОКНО (ДОБАВИТЬ ЗАДАЧУ)
    // ============================================
    
    function setupAddTaskModal() {
        const modal = document.getElementById('addTaskModal');
        const closeBtn = document.getElementById('closeAddTaskModal');
        const cancelBtn = document.getElementById('cancelAddTaskBtn');
        const submitBtn = document.getElementById('submitAddTaskBtn');
        const addTaskBtn = document.getElementById('addTaskBtn');
        
        const keyInput = document.getElementById('taskKey');
        const titleInput = document.getElementById('taskTitle');
        const urlInput = document.getElementById('taskUrl');
        
        addTaskBtn.onclick = () => {
            keyInput.value = '';
            titleInput.value = '';
            urlInput.value = '';
            modal.classList.add('modal-active');
            keyInput.focus();
        };
        
        closeBtn.onclick = () => closeModal('addTaskModal');
        cancelBtn.onclick = () => closeModal('addTaskModal');
        
        submitBtn.onclick = () => {
            const key = keyInput.value.trim();
            const title = titleInput.value.trim();
            let url = urlInput.value.trim();
            
            if (!key || !title) {
                alert('Заполните ключ и название задачи');
                return;
            }
            
            // Если URL не указан, используем jira.tcsbank.ru
            if (!url) {
                url = 'https://jira.tcsbank.ru/browse/' + key;
            }
            
            addCustomTask(key, title, url);
        };
    }
    
    // ============================================
    // УТИЛИТЫ
    // ============================================
    
    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('modal-active');
    }
    
    function formatTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        if (diff < 60000) return 'только что';
        if (diff < 3600000) return Math.floor(diff / 60000) + ' мин. назад';
        if (diff < 86400000) return Math.floor(diff / 3600000) + ' ч. назад';
        return Math.floor(diff / 86400000) + ' дн. назад';
    }
    
    // Закрытие по клику вне модального окна
    window.onclick = (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.remove('modal-active');
        }
    };

} // Конец else
