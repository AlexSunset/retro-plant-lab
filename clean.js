// ============================================
// ОЧИСТКА ГЕНОМА
// ============================================

// Firebase конфигурация
const firebaseConfig = {
    apiKey: "AIzaSyA7Zpsng2b6I02RZ7r7VtwXzzN-gR_kNmk",
    authDomain: "retro-tkat.firebaseapp.com",
    projectId: "retro-tkat",
    storageBucket: "retro-tkat.firebasestorage.app",
    messagingSenderId: "526671550405",
    appId: "1:526671550405:web:fded37933b6c890ed95dac",
    measurementId: "G-EVC7M9W82C",
    databaseURL: "https://retro-tkat-default-rtdb.europe-west1.firebasedatabase.app"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Получаем имя учёного
const scientistName = localStorage.getItem('scientistName') || 'Аноним';
const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

console.log('🧬 Очистка генома загружена');
console.log(`👨‍🔬 Учёный: ${scientistName} Session: ${sessionId}`);

// Обновляем имя в шапке
document.getElementById('currentUserName').textContent = scientistName;

// Индикатор подключения
function updateConnectionStatus(connected) {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.getElementById('statusText');
    
    console.log(`📡 updateConnectionStatus: ${connected}`);
    
    if (connected) {
        statusDot.classList.add('connected');
        statusDot.classList.remove('disconnected');
        statusText.textContent = 'Подключено';
    } else {
        statusDot.classList.remove('connected');
        statusDot.classList.add('disconnected');
        statusText.textContent = 'Отключено';
    }
}

// Подключение к Firebase
function connectToClean() {
    console.log('🔌 Подключение к очистке генома...');
    
    db.ref('.info/connected').on('value', (snapshot) => {
        const connected = snapshot.val() === true;
        updateConnectionStatus(connected);
        
        if (connected) {
            console.log('✅ Подключение к Firebase установлено');
            setupPresence();
            loadDefects();
            loadStrategies();
        }
    });
}

// Отслеживание присутствия
function setupPresence() {
    const userRef = db.ref(`clean/presence/${sessionId}`);
    const connectedRef = db.ref('.info/connected');
    
    connectedRef.on('value', (snapshot) => {
        if (snapshot.val() === true) {
            userRef.set({
                name: scientistName,
                joinedAt: Date.now(),
                lastSeen: Date.now()
            }).then(() => {
                console.log('✅ Я записан в список присутствующих');
            }).catch(err => {
                console.error('❌ Ошибка записи присутствия:', err);
            });
            
            userRef.onDisconnect().remove();
            
            // Heartbeat каждые 5 секунд
            setInterval(() => {
                userRef.update({ lastSeen: Date.now() }).catch(console.error);
            }, 5000);
            
            // Наблюдение за другими участниками
            db.ref('clean/presence').on('value', (snapshot) => {
                const users = snapshot.val() || {};
                const now = Date.now();
                const timeout = 30000; // 30 секунд
                
                Object.keys(users).forEach(id => {
                    if (now - users[id].lastSeen > timeout) {
                        db.ref(`clean/presence/${id}`).remove();
                    }
                });
            });
        }
    });
}

// ============================================
// ДЕФЕКТНЫЕ ГЕНОМЫ (ПРОБЛЕМЫ)
// ============================================

function loadDefects() {
    console.log('📊 Загрузка дефектных геномов...');
    
    db.ref('clean/defects').on('value', (snapshot) => {
        const defects = snapshot.val() || {};
        const container = document.getElementById('defectsList');
        
        console.log(`📝 Получено дефектов: ${Object.keys(defects).length}`);
        
        if (Object.keys(defects).length === 0) {
            container.innerHTML = '<div class="no-items">Пока нет дефектных геномов</div>';
            return;
        }
        
        container.innerHTML = '';
        
        Object.entries(defects).forEach(([id, defect]) => {
            const canDelete = defect.author === scientistName && (Date.now() - defect.timestamp < 86400000);
            
            const defectEl = document.createElement('div');
            defectEl.className = 'genome-item defect';
            defectEl.innerHTML = `
                <div class="genome-header">
                    <div class="genome-author">
                        <span class="genome-icon">🔴</span>
                        <span class="author-name">${defect.author}</span>
                        <span class="genome-time">${formatTime(defect.timestamp)}</span>
                    </div>
                    ${canDelete ? `<button class="btn-delete-genome" onclick="deleteDefect('${id}')">🗑️</button>` : ''}
                </div>
                <div class="genome-text">${defect.text}</div>
                <div class="genome-comments">
                    <div class="comments-header">
                        <span>💬 Комментарии</span>
                        <button class="btn-add-comment" onclick="openCommentModal('defect', '${id}')">+ Комментарий</button>
                    </div>
                    <div class="comments-list" id="defect-comments-${id}">
                        ${renderComments(defect.comments || {}, 'defect', id)}
                    </div>
                </div>
            `;
            container.appendChild(defectEl);
        });
    });
}

function addDefect() {
    const text = document.getElementById('defectText').value.trim();
    
    if (!text) {
        alert('Введите описание дефектного генома');
        return;
    }
    
    console.log('📝 Добавление дефектного генома...');
    
    db.ref('clean/defects').push({
        text: text,
        author: scientistName,
        timestamp: Date.now(),
        comments: {}
    }).then(() => {
        console.log('✅ Дефектный геном добавлен');
        document.getElementById('defectText').value = '';
        closeModal('defectModal');
    }).catch(err => {
        console.error('❌ Ошибка добавления:', err);
        alert('Ошибка: ' + err.message);
    });
}

function deleteDefect(id) {
    if (!confirm('Удалить этот дефектный геном?')) return;
    
    db.ref(`clean/defects/${id}`).remove().then(() => {
        console.log('✅ Дефектный геном удалён');
    }).catch(err => {
        console.error('❌ Ошибка удаления:', err);
    });
}

// ============================================
// СТРАТЕГИИ ИЗВЛЕЧЕНИЯ (РЕШЕНИЯ)
// ============================================

function loadStrategies() {
    console.log('📊 Загрузка стратегий извлечения...');
    
    db.ref('clean/strategies').on('value', (snapshot) => {
        const strategies = snapshot.val() || {};
        const container = document.getElementById('strategiesList');
        
        console.log(`📝 Получено стратегий: ${Object.keys(strategies).length}`);
        
        if (Object.keys(strategies).length === 0) {
            container.innerHTML = '<div class="no-items">Пока нет стратегий извлечения</div>';
            return;
        }
        
        container.innerHTML = '';
        
        Object.entries(strategies).forEach(([id, strategy]) => {
            const canDelete = strategy.author === scientistName && (Date.now() - strategy.timestamp < 86400000);
            
            const strategyEl = document.createElement('div');
            strategyEl.className = 'genome-item strategy';
            strategyEl.innerHTML = `
                <div class="genome-header">
                    <div class="genome-author">
                        <span class="genome-icon">🟢</span>
                        <span class="author-name">${strategy.author}</span>
                        <span class="genome-time">${formatTime(strategy.timestamp)}</span>
                    </div>
                    ${canDelete ? `<button class="btn-delete-genome" onclick="deleteStrategy('${id}')">🗑️</button>` : ''}
                </div>
                <div class="genome-text">${strategy.text}</div>
                <div class="genome-comments">
                    <div class="comments-header">
                        <span>💬 Комментарии</span>
                        <button class="btn-add-comment" onclick="openCommentModal('strategy', '${id}')">+ Комментарий</button>
                    </div>
                    <div class="comments-list" id="strategy-comments-${id}">
                        ${renderComments(strategy.comments || {}, 'strategy', id)}
                    </div>
                </div>
            `;
            container.appendChild(strategyEl);
        });
    });
}

function addStrategy() {
    const text = document.getElementById('strategyText').value.trim();
    
    if (!text) {
        alert('Введите описание стратегии');
        return;
    }
    
    console.log('📝 Добавление стратегии извлечения...');
    
    db.ref('clean/strategies').push({
        text: text,
        author: scientistName,
        timestamp: Date.now(),
        comments: {}
    }).then(() => {
        console.log('✅ Стратегия извлечения добавлена');
        document.getElementById('strategyText').value = '';
        closeModal('strategyModal');
    }).catch(err => {
        console.error('❌ Ошибка добавления:', err);
        alert('Ошибка: ' + err.message);
    });
}

function deleteStrategy(id) {
    if (!confirm('Удалить эту стратегию?')) return;
    
    db.ref(`clean/strategies/${id}`).remove().then(() => {
        console.log('✅ Стратегия удалена');
    }).catch(err => {
        console.error('❌ Ошибка удаления:', err);
    });
}

// ============================================
// КОММЕНТАРИИ
// ============================================

let currentCommentType = '';
let currentCommentId = '';

function openCommentModal(type, id) {
    currentCommentType = type;
    currentCommentId = id;
    
    console.log(`📝 Открытие модального окна: ${type} ${id}`);
    
    const modal = document.getElementById('commentModal');
    modal.classList.add('modal-active');
    
    document.getElementById('commentText').value = '';
    updateCharCount();
}

function closeCommentModal() {
    const modal = document.getElementById('commentModal');
    modal.classList.remove('modal-active');
    currentCommentType = '';
    currentCommentId = '';
}

function addComment() {
    const text = document.getElementById('commentText').value.trim();
    
    if (!text) {
        alert('Введите текст комментария');
        return;
    }
    
    console.log(`📝 Добавление комментария к ${currentCommentType} ${currentCommentId}`);
    
    const commentId = db.ref(`clean/${currentCommentType}s/${currentCommentId}/comments`).push().key;
    
    db.ref(`clean/${currentCommentType}s/${currentCommentId}/comments/${commentId}`).set({
        author: scientistName,
        text: text,
        timestamp: Date.now()
    }).then(() => {
        console.log('✅ Комментарий добавлен');
        closeCommentModal();
    }).catch(err => {
        console.error('❌ Ошибка добавления:', err);
        alert('Ошибка: ' + err.message);
    });
}

function deleteComment(type, id, commentId) {
    db.ref(`clean/${type}s/${id}/comments/${commentId}`).remove().then(() => {
        console.log('✅ Комментарий удалён');
    }).catch(err => {
        console.error('❌ Ошибка удаления:', err);
    });
}

function renderComments(comments, type, id) {
    const commentList = Object.values(comments || {}).sort((a, b) => b.timestamp - a.timestamp);
    
    if (commentList.length === 0) {
        return '<div class="no-comments">Пока нет комментариев</div>';
    }
    
    return commentList.map(comment => {
        const canDelete = comment.author === scientistName && (Date.now() - comment.timestamp < 86400000);
        return `
            <div class="comment-item">
                <div class="comment-header">
                    <span class="comment-author">${comment.author}</span>
                    <span class="comment-time">${formatTime(comment.timestamp)}</span>
                    ${canDelete ? `<button class="btn-delete-comment" onclick="deleteComment('${type}', '${id}', '${comment.id || Object.keys(comments).find(k => comments[k] === comment)}')">🗑️</button>` : ''}
                </div>
                <div class="comment-text">${comment.text}</div>
            </div>
        `;
    }).join('');
}

// ============================================
// УТИЛИТЫ
// ============================================

function formatTime(timestamp) {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин. назад`;
    if (hours < 24) return `${hours} ч. назад`;
    return `${days} дн. назад`;
}

function updateCharCount() {
    const textarea = document.getElementById('commentText');
    const counter = document.getElementById('charCount');
    counter.textContent = `${textarea.value.length}/500`;
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('modal-active');
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    connectToClean();
    
    // Модальные окна
    document.getElementById('defectModalBtn')?.addEventListener('click', () => {
        document.getElementById('defectModal').classList.add('modal-active');
    });
    
    document.getElementById('strategyModalBtn')?.addEventListener('click', () => {
        document.getElementById('strategyModal').classList.add('modal-active');
    });
    
    // Кнопки отмены
    document.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal-overlay').classList.remove('modal-active');
        });
    });
    
    // Кнопки отправки
    document.querySelector('#defectModal .btn-submit')?.addEventListener('click', addDefect);
    document.querySelector('#strategyModal .btn-submit')?.addEventListener('click', addStrategy);
    document.querySelector('#commentModal .btn-submit')?.addEventListener('click', addComment);
    
    // Счётчик символов
    document.getElementById('commentText')?.addEventListener('input', updateCharCount);
    
    // Закрытие по клику вне модального окна
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('modal-active');
            }
        });
    });
});
