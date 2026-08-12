// ============================================
// КОНФИГУРАЦИЯ FIREBASE
// ============================================
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
const database = firebase.database();

// ============================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ============================================
const ROOM_ID = 'retro-main';
let localCounters = {
    water: 0,
    sunlight: 0,
    nitrogen: 0,
    phosphorus: 0,
    potassium: 0,
    compost: 0
};
let isConnected = false;
let isUpdating = false;
let scientistName = '';
let sessionId = '';
let savedAvatar = '👨‍🔬'; // Аватарка по умолчанию

// Стадии роста растения
const plantStages = [
    { threshold: 0, emoji: '🌱', name: 'Росток', adaptation: '0-10' },
    { threshold: 10, emoji: '🌿', name: 'Всходы', adaptation: '11-25' },
    { threshold: 25, emoji: '🪴', name: 'Саженец', adaptation: '26-50' },
    { threshold: 50, emoji: '🌳', name: 'Дерево', adaptation: '51-100' },
    { threshold: 100, emoji: '🌺', name: 'Цветущее', adaptation: '101-150' },
    { threshold: 150, emoji: '🌻', name: 'Подсолнух', adaptation: '151-200' },
    { threshold: 200, emoji: '🌸', name: 'Сакура', adaptation: '201-300' },
    { threshold: 300, emoji: '🌹', name: 'Роза', adaptation: '301-500' },
    { threshold: 500, emoji: '🌷', name: 'Тюльпан', adaptation: '501-1000' },
    { threshold: 1000, emoji: '👑', name: 'Легендарное', adaptation: '1001+' }
];

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔬 Лаборатория Адаптации загружена');
    
    // Получаем имя учёного и аватарку из localStorage
    scientistName = localStorage.getItem('scientistName');
    const storedAvatar = localStorage.getItem('scientistAvatar');
    
    if (!scientistName) {
        console.warn('⚠️ Имя не найдено, возврат на титульную');
        window.location.href = 'index.html';
        return;
    }
    
    // Если аватарка не сохранена, используем стандартную
    if (!storedAvatar) {
        savedAvatar = '👨‍🔬';
    } else {
        savedAvatar = storedAvatar;
    }
    
    // Получаем или генерируем sessionId
    sessionId = localStorage.getItem('scientistSessionId');
    
    // Если sessionId есть — удаляем старую сессию из Firebase (на случай краша)
    if (sessionId) {
        const oldSessionRef = database.ref(`rooms/${ROOM_ID}/scientists/${sessionId}`);
        oldSessionRef.remove().catch(() => {});
        console.log('🗑️ Старая сессия удалена:', sessionId);
    }
    
    // Генерируем новый sessionId
    sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('scientistSessionId', sessionId);
    console.log('🆕 Сгенерирован sessionId:', sessionId);
    
    console.log('👨‍🔬 Учёный:', scientistName, 'Session:', sessionId, 'Avatar:', savedAvatar);
    
    document.getElementById('currentUserName').textContent = scientistName;
    
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase не загружен');
        return;
    }
    
    updateUI();
    connectToLab();
});

// ============================================
// ПОДКЛЮЧЕНИЕ К ЛАБОРАТОРИИ
// ============================================
function connectToLab() {
    updateConnectionStatus(false);
    
    console.log('🔌 Подключение к комнате:', ROOM_ID);
    
    const roomRef = database.ref(`rooms/${ROOM_ID}`);
    
    // Инициализируем комнату
    roomRef.update({
        counters: localCounters,
        totalScore: 0,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
    }).then(() => {
        console.log('✅ Комната инициализирована');
        
        // Подписываемся на изменения
        roomRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data && data.counters) {
                localCounters = { ...data.counters };
                updateUI();
            }
            
            if (!isConnected) {
                isConnected = true;
                updateConnectionStatus(true);
            }
        });
        
        // Отслеживаем учёных
        trackScientists();
        
    }).catch((error) => {
        console.error('❌ Ошибка инициализации:', error);
        updateConnectionStatus(false);
        alert('Ошибка: ' + error.message);
    });
}

// ============================================
// ОТСЛЕЖИВАНИЕ УЧЁНЫХ
// ============================================
const HEARTBEAT_INTERVAL = 5000; // Обновление каждые 5 секунд
const PRESENCE_TIMEOUT = 30000; // Считаем offline через 30 секунд
let heartbeatTimer = null;

function trackScientists() {
    console.log('👥 Отслеживание учёных, sessionId:', sessionId);
    
    // Защита от повторного вызова
    if (heartbeatTimer) {
        console.warn('⚠️ Heartbeat уже запущен, пропускаем повторный вызов');
        return;
    }
    
    console.log('🔍 Проверка имени:', JSON.stringify(scientistName), 'type:', typeof scientistName);
    console.log('🔍 localStorage scientistName:', JSON.stringify(localStorage.getItem('scientistName')));
    
    // Проверка: если имени нет, не записываем и не создаём сессию
    if (!scientistName || scientistName === 'undefined' || scientistName === 'null' || scientistName === '') {
        console.error('❌ Нет имени учёного, возврат на титульную');
        window.location.href = 'index.html';
        return;
    }
    
    const scientistsRef = database.ref(`rooms/${ROOM_ID}/scientists`);
    const myRef = scientistsRef.child(sessionId);
    
    const myData = {
        name: scientistName,
        avatar: savedAvatar,
        joinedAt: Date.now(),
        lastSeen: Date.now()
    };
    
    console.log('📝 Запись учёного ПЕРЕД set():', myData);
    console.log('📝 sessionId:', sessionId);
    
    // Записываем себя
    myRef.set(myData).then(() => {
        console.log('✅ Я записан в список учёных');
        // Проверяем, что записалось
        myRef.once('value').then(snapshot => {
            const data = snapshot.val();
            console.log('📖 Проверка записи после set():', data);
        });
    }).catch((error) => {
        console.error('❌ Ошибка записи:', error);
    });
    
    // Обновляем lastSeen сразу
    myRef.update({ lastSeen: Date.now() });
    
    // Удаляем при отключении
    myRef.onDisconnect().remove();
    
    // Heartbeat - обновляем lastSeen каждые 5 секунд
    console.log('⏰ Запуск heartbeat для sessionId:', sessionId, 'name:', scientistName, 'avatar:', savedAvatar);
    
    // Функция обновления heartbeat
    function sendHeartbeat() {
        // Проверка имени перед отправкой
        if (!scientistName || scientistName === 'undefined' || scientistName === 'null' || scientistName === '') {
            console.error('❌ Heartbeat: имя потеряно, остановка таймера');
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
            return;
        }
        console.log('💓 Heartbeat tick, sessionId:', sessionId, 'name:', scientistName, 'avatar:', savedAvatar);
        myRef.update({ 
            lastSeen: Date.now(),
            name: scientistName,  // Явно обновляем имя
            avatar: savedAvatar   // Явно обновляем аватарку
        }).catch((error) => {
            console.error('❌ Ошибка heartbeat:', error);
        });
    }
    
    // Первая отправка сразу
    sendHeartbeat();
    
    // Затем каждые 5 секунд
    heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    // Очистка ТОЛЬКО при полном закрытии страницы/вкладки
    window.addEventListener('beforeunload', () => {
        console.log('🚪 Страница закрывается, удаляем сессию:', sessionId);
        if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
        }
        myRef.remove().catch(err => console.error('❌ Ошибка удаления сессии:', err));
    });
    // visibilitychange убрали - сессия остаётся при переключении вкладок
    
    // Слушаем список учёных
    scientistsRef.on('value', (snapshot) => {
        const scientists = [];
        const now = Date.now();
        
        snapshot.forEach((child) => {
            const data = child.val();
            const lastSeen = data.lastSeen || 0;
            const timeSinceLastSeen = now - lastSeen;
            
            // ИГНОРИРУЕМ сессии с undefined или пустым именем (не показываем, но и не удаляем)
            if (!data.name || data.name === 'undefined' || data.name === 'null' || data.name === '') {
                console.log('⚠️ Пропускаем сессию с некорректным именем:', child.key);
                // НЕ удаляем, просто игнорируем
                return;
            }
            
            // Если учёный не обновлялся больше PRESENCE_TIMEOUT - удаляем
            if (timeSinceLastSeen > PRESENCE_TIMEOUT) {
                console.log('🗑️ Удаляем неактивного учёного:', data.name, '(' + Math.round(timeSinceLastSeen/1000) + 'сек)');
                child.ref.remove();
                return;
            }
            
            console.log('  👤 Учёный:', data.name, '| lastSeen:', Math.round(timeSinceLastSeen/1000) + 'сек назад');
            scientists.push({
                id: child.key,
                name: data.name,
                joinedAt: data.joinedAt,
                lastSeen: lastSeen,
                avatar: data.avatar || '👨‍🔬'
            });
        });
        
        scientists.sort((a, b) => a.joinedAt - b.joinedAt);
        updateScientistsList(scientists);
    });
}

// Очистка при закрытии страницы
window.addEventListener('beforeunload', () => {
    if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
    }
});

// ============================================
// UI ФУНКЦИИ
// ============================================

function updateConnectionStatus(connected) {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.getElementById('statusText');
    
    console.log('📡 updateConnectionStatus:', connected, 'statusDot:', statusDot, 'statusText:', statusText);
    
    if (!statusDot || !statusText) {
        console.warn('⚠️ Элементы статуса не найдены');
        return;
    }
    
    if (connected) {
        statusDot.classList.add('connected');
        statusDot.classList.remove('disconnected');
        statusText.textContent = 'Синхронизация активна';
    } else {
        statusDot.classList.add('disconnected');
        statusDot.classList.remove('connected');
        statusText.textContent = 'Подключение...';
    }
}

function updatePlant() {
    const total = Object.values(localCounters).reduce((sum, count) => sum + count, 0);
    
    let currentStage = plantStages[0];
    for (const stage of plantStages) {
        if (total >= stage.threshold) {
            currentStage = stage;
        }
    }
    
    const plantDisplay = document.getElementById('plantDisplay');
    plantDisplay.textContent = currentStage.emoji;
    
    document.getElementById('plantStageInfo').textContent = `Стадия: ${currentStage.name}`;
    
    const maxForStage = currentStage.threshold === 0 ? 10 : 
                        currentStage.threshold === 10 ? 25 :
                        currentStage.threshold === 25 ? 50 :
                        currentStage.threshold === 50 ? 100 :
                        currentStage.threshold === 100 ? 150 :
                        currentStage.threshold === 150 ? 200 :
                        currentStage.threshold === 200 ? 300 :
                        currentStage.threshold === 300 ? 500 :
                        currentStage.threshold === 500 ? 1000 : total;
    
    const prevThreshold = currentStage.threshold;
    const range = maxForStage - prevThreshold;
    const progress = total - prevThreshold;
    const percentage = range > 0 ? Math.round((progress / range) * 100) : 100;
    
    document.getElementById('adaptationScore').textContent = `${percentage}%`;
    
    plantDisplay.style.transform = 'scale(1.15)';
    setTimeout(() => {
        plantDisplay.style.transform = 'scale(1)';
    }, 200);
}

function updateUI() {
    Object.keys(localCounters).forEach(key => {
        const el = document.getElementById(`${key}Counter`);
        if (el) el.textContent = localCounters[key];
    });
    
    const total = Object.values(localCounters).reduce((sum, count) => sum + count, 0);
    document.getElementById('totalScore').textContent = total;
    
    updatePlant();
}

function increaseCounter(fertilizer) {
    if (!isConnected) {
        alert('⚠️ Нет связи!');
        return;
    }
    
    localCounters[fertilizer]++;
    
    const el = document.getElementById(`${fertilizer}Counter`);
    el.classList.add('counter-updated');
    setTimeout(() => el.classList.remove('counter-updated'), 300);
    
    const card = document.querySelector(`.fertilizer-card[data-fertilizer="${fertilizer}"]`);
    if (card) {
        card.classList.add('card-applied');
        setTimeout(() => card.classList.remove('card-applied'), 300);
    }
    
    updateUI();
    updateFirebase();
}

function resetAll() {
    if (!isConnected) return;
    
    if (confirm('⚠️ Сбросить ВСЕ протоколы и образцы? Это действие необратимо!')) {
        // Сброс счётчиков
        Object.keys(localCounters).forEach(k => localCounters[k] = 0);
        updateUI();
        updateFirebase();
        
        // Сброс всех образцов
        const samplesRef = database.ref('samples');
        samplesRef.remove().then(() => {
            console.log('✅ Все образцы удалены');
        }).catch((error) => {
            console.error('❌ Ошибка удаления образцов:', error);
        });
        
        // Сброс всех договорённостей (почва)
        const soilRef = database.ref('soil');
        soilRef.remove().then(() => {
            console.log('✅ Все договорённости сброшены');
        }).catch((error) => {
            console.error('❌ Ошибка удаления договорённостей:', error);
        });
        
        // Сброс кастомных задач
        const customTasksRef = database.ref('customTasks');
        customTasksRef.remove().then(() => {
            console.log('✅ Кастомные задачи удалены');
        }).catch((error) => {
            console.error('❌ Ошибка удаления задач:', error);
        });
        
        // Сброс дефектов и стратегий (очистка генома)
        const cleanRef = database.ref('clean');
        cleanRef.remove().then(() => {
            console.log('✅ Очистка генома сброшена');
        }).catch((error) => {
            console.error('❌ Ошибка удаления очистки:', error);
        });
        
        // Сброс протоколов роста (модуляция роста)
        const growthRef = database.ref('growth');
        growthRef.remove().then(() => {
            console.log('✅ Модуляция роста сброшена');
        }).catch((error) => {
            console.error('❌ Ошибка удаления роста:', error);
        });
        
        // Сброс отзывов (резистентность)
        const resistanceRef = database.ref('resistance');
        resistanceRef.remove().then(() => {
            console.log('✅ Резистентность сброшена');
        }).catch((error) => {
            console.error('❌ Ошибка удаления отзывов:', error);
        });
        
        // Сброс учёных
        const scientistsRef = database.ref(`rooms/${ROOM_ID}/scientists`);
        scientistsRef.remove().then(() => {
            console.log('✅ Список учёных сброшен');
        }).catch((error) => {
            console.error('❌ Ошибка удаления учёных:', error);
        });
    }
}

function updateFirebase() {
    if (!isConnected) return;
    
    isUpdating = true;
    
    const total = Object.values(localCounters).reduce((sum, count) => sum + count, 0);
    
    database.ref(`rooms/${ROOM_ID}`).update({
        counters: localCounters,
        totalScore: total,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
    }).catch((error) => {
        console.error('Ошибка обновления:', error);
    }).finally(() => {
        setTimeout(() => isUpdating = false, 100);
    });
}

function updateScientistsList(scientists) {
    const grid = document.getElementById('scientistsGrid');
    
    if (!grid) return;
    
    if (scientists.length === 0) {
        grid.innerHTML = '<div class="scientist-placeholder"><p>Загрузка...</p></div>';
        return;
    }
    
    grid.innerHTML = scientists.map((s) => {
        const isMe = s.id === sessionId;
        // Берём аватарку из данных учёного
        const avatar = s.avatar || '👨‍🔬';
        console.log('👤 Учёный', s.name, '| sessionId:', s.id, '| avatar:', avatar, '| isMe:', isMe);
        return `
            <div class="scientist-card ${isMe ? 'is-me' : ''}">
                <div class="scientist-icon">${avatar}</div>
                <div class="scientist-info">
                    <div class="scientist-name">${escapeHtml(s.name)} ${isMe ? '<span class="badge-me">Вы</span>' : ''}</div>
                    <div class="scientist-status">
                        <span class="status-indicator online"></span>
                        <span>В сети</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Клик по карточке удобрения
document.querySelectorAll('.fertilizer-card').forEach(card => {
    card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('btn-apply')) {
            const fertilizer = card.dataset.fertilizer;
            increaseCounter(fertilizer);
        }
    });
});
