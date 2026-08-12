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
const scientistName = localStorage.getItem('scientistName');

console.log('🧬 Очистка генома загружена');

// Проверка имени
if (!scientistName || scientistName === 'undefined' || scientistName === 'null') {
    console.error('❌ Нет имени учёного, возврат на титульную');
    window.location.href = 'index.html';
}

// Глобальные переменные
let currentStrategyDefectId = '';

// ============================================
// УТИЛИТЫ (объявляем первыми)
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

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('modal-active');
    if (modalId === 'strategyModal') {
        currentStrategyDefectId = '';
    }
}

// ============================================
// ОСНОВНЫЕ ФУНКЦИИ (глобальные)
// ============================================

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
        strategies: {}
    }).then(() => {
        console.log('✅ Дефектный геном добавлен');
        document.getElementById('defectText').value = '';
        closeModal('defectModal');
    }).catch(err => {
        console.error('❌ Ошибка добавления:', err);
        alert('Ошибка: ' + err.message);
    });
}

window.addDefect = addDefect;

function deleteDefect(id) {
    if (!confirm('Удалить этот дефектный геном и все стратегии?')) return;
    
    db.ref(`clean/defects/${id}`).remove().then(() => {
        console.log('✅ Дефектный геном удалён');
    }).catch(err => {
        console.error('❌ Ошибка удаления:', err);
    });
}
window.deleteDefect = deleteDefect;

function openStrategyModal(defectId) {
    currentStrategyDefectId = defectId;
    document.getElementById('strategyModal').classList.add('modal-active');
    document.getElementById('strategyText').value = '';
    updateStrategyCharCount();
}
window.openStrategyModal = openStrategyModal;

function addStrategy() {
    const text = document.getElementById('strategyText').value.trim();
    
    if (!text) {
        alert('Введите описание стратегии');
        return;
    }
    
    if (!currentStrategyDefectId) {
        alert('Ошибка: не выбран дефект');
        return;
    }
    
    console.log(`📝 Добавление стратегии к дефекту ${currentStrategyDefectId}`);
    
    const strategyId = db.ref(`clean/defects/${currentStrategyDefectId}/strategies`).push().key;
    
    db.ref(`clean/defects/${currentStrategyDefectId}/strategies/${strategyId}`).set({
        text: text,
        author: scientistName,
        timestamp: Date.now()
    }).then(() => {
        console.log('✅ Стратегия добавлена');
        closeModal('strategyModal');
        currentStrategyDefectId = '';
    }).catch(err => {
        console.error('❌ Ошибка добавления:', err);
        alert('Ошибка: ' + err.message);
    });
}
window.addStrategy = addStrategy;

function deleteStrategy(defectId, strategyId) {
    if (!confirm('Удалить эту стратегию?')) return;
    
    db.ref(`clean/defects/${defectId}/strategies/${strategyId}`).remove().then(() => {
        console.log('✅ Стратегия удалена');
    }).catch(err => {
        console.error('❌ Ошибка удаления:', err);
    });
}
window.deleteStrategy = deleteStrategy;

function renderStrategies(strategies, defectId) {
    const strategyList = Object.values(strategies || {}).sort((a, b) => a.timestamp - b.timestamp);
    
    if (strategyList.length === 0) {
        return '<div class="no-strategies">Пока нет стратегий. Добавьте первую!</div>';
    }
    
    return strategyList.map(strategy => {
        const canDelete = strategy.author === scientistName && (Date.now() - strategy.timestamp < 86400000);
        const strategyKey = Object.keys(strategies).find(k => strategies[k] === strategy);
        return `
            <div class="strategy-item">
                <div class="strategy-header">
                    <span class="strategy-author">${strategy.author}</span>
                    <span class="strategy-time">${formatTime(strategy.timestamp)}</span>
                    ${canDelete ? `<button class="btn-delete-strategy" onclick="deleteStrategy('${defectId}', '${strategyKey}')">🗑️</button>` : ''}
                </div>
                <div class="strategy-text">${strategy.text}</div>
            </div>
        `;
    }).join('');
}

function updateCharCount() {
    const textarea = document.getElementById('defectText');
    const counter = document.getElementById('defectCharCount');
    if (counter) {
        counter.textContent = `${textarea.value.length}/500`;
    }
}

function updateStrategyCharCount() {
    const textarea = document.getElementById('strategyText');
    const counter = document.getElementById('strategyCharCount');
    if (counter) {
        counter.textContent = `${textarea.value.length}/500`;
    }
}

// ============================================
// ПОДКЛЮЧЕНИЕ И ПРИСУТСТВИЕ
// ============================================

function updateConnectionStatus(connected) {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.getElementById('statusText');
    
    if (connected) {
        statusDot?.classList.add('connected');
        statusDot?.classList.remove('disconnected');
        if (statusText) statusText.textContent = 'Подключено';
    } else {
        statusDot?.classList.remove('connected');
        statusDot?.classList.add('disconnected');
        if (statusText) statusText.textContent = 'Отключено';
    }
}

function setupPresence(sessionId) {
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

function loadDefects() {
    console.log('📊 Загрузка дефектных геномов...');
    
    db.ref('clean/defects').on('value', (snapshot) => {
        const defects = snapshot.val() || {};
        const container = document.getElementById('cleanGrid');
        
        console.log(`📝 Получено дефектов: ${Object.keys(defects).length}`);
        
        if (Object.keys(defects).length === 0) {
            container.innerHTML = '<div class="no-items">Пока нет дефектных геномов. Добавьте первый!</div>';
            return;
        }
        
        container.innerHTML = '';
        
        // Сортируем: новые сверху
        const sortedDefects = Object.entries(defects).sort((a, b) => b[1].timestamp - a[1].timestamp);
        
        sortedDefects.forEach(([id, defect]) => {
            const canDelete = defect.author === scientistName && (Date.now() - defect.timestamp < 86400000);
            const strategies = defect.strategies || {};
            
            const defectEl = document.createElement('div');
            defectEl.className = 'defect-card';
            defectEl.innerHTML = `
                <div class="defect-header">
                    <div class="defect-main">
                        <span class="defect-icon">🔴</span>
                        <div class="defect-info">
                            <div class="defect-author-row">
                                <span class="author-name">${defect.author}</span>
                                <span class="genome-time">${formatTime(defect.timestamp)}</span>
                            </div>
                            <div class="defect-text">${defect.text}</div>
                        </div>
                    </div>
                    ${canDelete ? `<button class="btn-delete-defect" onclick="deleteDefect('${id}')">🗑️</button>` : ''}
                </div>
                
                <div class="strategies-section">
                    <div class="strategies-header">
                        <span class="strategies-title">🟢 Стратегии извлечения</span>
                        <button class="btn-add-strategy" onclick="openStrategyModal('${id}')">+ Стратегия</button>
                    </div>
                    
                    <div class="strategies-list" id="strategies-${id}">
                        ${renderStrategies(strategies, id)}
                    </div>
                </div>
            `;
            container.appendChild(defectEl);
        });
    });
}

function connectToClean(sessionId) {
    console.log('🔌 Подключение к очистке генома...');
    
    db.ref('.info/connected').on('value', (snapshot) => {
        const connected = snapshot.val() === true;
        updateConnectionStatus(connected);
        
        if (connected) {
            console.log('✅ Подключение к Firebase установлено');
            setupPresence(sessionId);
            loadDefects();
        }
    });
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ DOM
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    console.log(`👨‍🔬 Учёный: ${scientistName} Session: ${sessionId}`);

    // Модальное окно дефекта
    document.getElementById('addDefectBtn')?.addEventListener('click', () => {
        document.getElementById('defectModal').classList.add('modal-active');
    });
    
    // Кнопки отмены
    document.querySelectorAll('.btn-cancel').forEach(btn => {
        btn.addEventListener('click', function() {
            this.closest('.modal-overlay').classList.remove('modal-active');
        });
    });
    
    // Кнопки отправки
    document.getElementById('submitDefectBtn')?.addEventListener('click', addDefect);
    document.getElementById('submitStrategyBtn')?.addEventListener('click', addStrategy);
    
    // Закрытие по крестику
    document.getElementById('closeDefectModal')?.addEventListener('click', () => {
        closeModal('defectModal');
    });
    document.getElementById('closeStrategyModal')?.addEventListener('click', () => {
        closeModal('strategyModal');
    });
    
    // Счётчики символов
    document.getElementById('defectText')?.addEventListener('input', updateCharCount);
    document.getElementById('strategyText')?.addEventListener('input', updateStrategyCharCount);
    
    // Закрытие по клику вне модального окна
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('modal-active');
            }
        });
    });
    
    // Подключение
    connectToClean(sessionId);
});
