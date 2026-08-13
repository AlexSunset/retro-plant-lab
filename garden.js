// ============================================
// КОНФИГУРАЦИЯ FIREBASE
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyA7Zpsng2b6I02RZr7VtwXzzN-gR_kNmk",
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
let isConnected = false;
let isUpdating = false;
let scientistName = '';
let sessionId = '';
let savedAvatar = '👨‍🔬';

// Стадии роста растения (6 стадий)
const plantStages = {
    1: { emoji: '🌰', name: 'Семя', desc: 'Начало пути' },
    2: { emoji: '🌱', name: 'Росток', desc: 'Первые шаги' },
    3: { emoji: '🪴', name: 'В горшке', desc: 'Набирает силу' },
    4: { emoji: '🌿', name: 'Молодое дерево', desc: 'Активный рост' },
    5: { emoji: '🌳', name: 'Дерево', desc: 'Расцвет' },
    6: { emoji: '🌺', name: 'Цветущее дерево', desc: 'Полный успех' }
};

// Протоколы по стадиям (5 протоколов для перехода на стадии 2-6)
const stageProtocols = {
    2: { key: 'stage2_soil', page: 'soil.html', name: 'Подготовленная почва' },
    3: { key: 'stage3_samples', page: 'samples.html', name: 'Набор генома' },
    4: { key: 'stage4_clean', page: 'clean.html', name: 'Очищенный геном' },
    5: { key: 'stage5_growth', page: 'growth.html', name: 'Модуляция роста' },
    6: { key: 'stage6_resistance', page: 'resistance.html', name: 'Сильный иммунитет' }
};

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
    savedAvatar = storedAvatar || '👨‍🔬';
    
    // Получаем или генерируем sessionId
    sessionId = localStorage.getItem('scientistSessionId');
    
    // Если sessionId есть — удаляем старую сессию из Firebase
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
    document.getElementById('headerUserAvatar').textContent = savedAvatar;
    
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase не загружен');
        return;
    }
    
    connectToLab();
});

// ============================================
// ПОДКЛЮЧЕНИЕ К ЛАБОРАТОРИИ
// ============================================
function connectToLab() {
    updateConnectionStatus(false);
    
    console.log('🔌 Подключение к комнате:', ROOM_ID);
    
    const roomRef = database.ref(`rooms/${ROOM_ID}`);
    
    // Инициализируем комнату — создаём структуру стадий, если её нет
    roomRef.once('value').then((snapshot) => {
        const data = snapshot.val();
        const needsInit = !data || !data.stages;
        
        if (needsInit) {
            // Первая инициализация — начинаем с стадии 1 (семя)
            return roomRef.update({
                stages: {
                    stage1_soil: false,
                    stage2_samples: false,
                    stage3_clean: false,
                    stage4_growth: false,
                    stage5_resistance: false
                },
                currentStage: 1,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
        } else {
            return roomRef.update({
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
        }
    }).then(() => {
        console.log('✅ Комната инициализирована');
        
        // Подписываемся на изменения
        roomRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const currentStage = data.currentStage || 1;
                updateStagesUI(data.stages || {}, currentStage);
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
const HEARTBEAT_INTERVAL = 5000;
const PRESENCE_TIMEOUT = 30000;
let heartbeatTimer = null;

function trackScientists() {
    console.log('👥 Отслеживание учёных, sessionId:', sessionId);
    
    if (heartbeatTimer) {
        console.warn('⚠️ Heartbeat уже запущен, пропускаем повторный вызов');
        return;
    }
    
    if (!scientistName || scientistName === 'undefined' || scientistName === 'null' || scientistName === '') {
        console.error('❌ Нет имени учёного, возврат на титульную');
        window.location.href = 'index.html';
        return;
    }
    
    const scientistsRef = database.ref(`rooms/${ROOM_ID}/scientists`);
    const myRef = scientistsRef.child(sessionId);
    const equipRef = database.ref(`equip/${sessionId}`);
    
    // Сначала читаем аватарку из Firebase (equip), потом из localStorage
    equipRef.once('value').then((snapshot) => {
        const equipData = snapshot.val();
        if (equipData && equipData.avatar && equipData.avatar.emoji) {
            savedAvatar = equipData.avatar.emoji;
            localStorage.setItem('scientistAvatar', savedAvatar);
            console.log('🎭 Аватарка загружена из Firebase:', savedAvatar);
        } else {
            savedAvatar = localStorage.getItem('scientistAvatar') || '👨‍🔬';
            console.log('🎭 Аватарка из localStorage:', savedAvatar);
        }
        
        // Обновляем отображение аватарки в шапке
        document.getElementById('headerUserAvatar').textContent = savedAvatar;
        
        // Записываем учёного с аватаркой
        const myData = {
            name: scientistName,
            avatar: savedAvatar,
            joinedAt: Date.now(),
            lastSeen: Date.now()
        };
        
        return myRef.set(myData);
    }).then(() => {
        console.log('✅ Я записан в список учёных');
    }).catch((error) => {
        console.error('❌ Ошибка записи:', error);
    });
    
    myRef.update({ lastSeen: Date.now() });
    myRef.onDisconnect().remove();
    
    function sendHeartbeat() {
        if (!scientistName || scientistName === 'undefined' || scientistName === 'null' || scientistName === '') {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
            return;
        }
        // Читаем актуальную аватарку из localStorage
        const currentAvatar = localStorage.getItem('scientistAvatar') || savedAvatar;
        myRef.update({ 
            lastSeen: Date.now(),
            name: scientistName,
            avatar: currentAvatar
        }).catch((error) => {
            console.error('❌ Ошибка heartbeat:', error);
        });
    }
    
    sendHeartbeat();
    heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

    window.addEventListener('beforeunload', () => {
        console.log('🚪 Страница закрывается, удаляем сессию:', sessionId);
        if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
        }
        myRef.remove().catch(err => console.error('❌ Ошибка удаления сессии:', err));
    });
    
    scientistsRef.on('value', (snapshot) => {
        const scientists = [];
        const now = Date.now();
        
        snapshot.forEach((child) => {
            const data = child.val();
            const lastSeen = data.lastSeen || 0;
            const timeSinceLastSeen = now - lastSeen;
            
            if (!data.name || data.name === 'undefined' || data.name === 'null' || data.name === '') {
                return;
            }
            
            if (timeSinceLastSeen > PRESENCE_TIMEOUT) {
                child.ref.remove();
                return;
            }
            
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
    
    if (!statusDot || !statusText) return;
    
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

function updatePlant(currentStage) {
    const plantData = plantStages[currentStage] || plantStages[1];
    
    const plantDisplay = document.getElementById('plantDisplay');
    plantDisplay.textContent = plantData.emoji;
    
    document.getElementById('plantStageInfo').textContent = `Стадия: ${plantData.name}`;
    document.getElementById('stageProgress').textContent = `${currentStage}/6`;
    
    // Анимация
    plantDisplay.style.transform = 'scale(1.15)';
    setTimeout(() => {
        plantDisplay.style.transform = 'scale(1)';
    }, 200);
}

function updateStagesUI(stages, currentStage) {
    // currentStage: 1-6 (1=семя, 6=цветущее дерево)
    currentStage = currentStage || 1;
    
    // Проверяем каждую стадию (2-6)
    for (let i = 2; i <= 6; i++) {
        const protocolKey = stageProtocols[i]?.key;
        if (!protocolKey) continue;
        
        const isCompleted = stages[protocolKey] === true;
        const card = document.querySelector(`.protocol-card[data-stage="${i}"]`);
        const statusEl = document.getElementById(`stage${i}Status`);
        
        if (card) {
            card.setAttribute('data-completed', isCompleted);
            if (isCompleted) {
                card.classList.add('completed');
            } else {
                card.classList.remove('completed');
            }
        }
        
        if (statusEl) {
            statusEl.textContent = isCompleted ? '✅ Выполнено' : '⏳ Не выполнено';
        }
    }
    
    // Обновляем общий счёт (сколько протоколов выполнено из 5)
    let completedCount = 0;
    for (let i = 2; i <= 6; i++) {
        const protocolKey = stageProtocols[i]?.key;
        if (protocolKey && stages[protocolKey] === true) {
            completedCount++;
        }
    }
    
    document.getElementById('totalScore').textContent = `${completedCount}/5`;
    
    // Обновляем растение
    updatePlant(currentStage);
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
        const avatar = s.avatar || '👨‍🔬';
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

function resetAll() {
    if (!isConnected) return;
    
    if (confirm('⚠️ Сбросить ВСЕ протоколы и данные? Это действие необратимо!')) {
        // Сброс стадий
        database.ref(`rooms/${ROOM_ID}/stages`).set({
            stage2_soil: false,
            stage3_samples: false,
            stage4_clean: false,
            stage5_growth: false,
            stage6_resistance: false
        });
        
        // Сброс текущей стадии растения
        database.ref(`rooms/${ROOM_ID}/currentStage`).set(1);
        
        // Сброс всех образцов
        database.ref('samples').remove();
        
        // Сброс всех договорённостей
        database.ref('soil').remove();
        
        // Сброс кастомных задач
        database.ref('customTasks').remove();
        
        // Сброс дефектов и стратегий
        database.ref('clean').remove();
        
        // Сброс протоколов роста
        database.ref('growth').remove();
        
        // Сброс отзывов
        database.ref('resistance').remove();
        
        // Сброс учёных
        database.ref(`rooms/${ROOM_ID}/scientists`).remove();
        
        console.log('✅ Все данные сброшены');
    }
}

// Экспорт функции для использования на других страницах
window.markStageComplete = function(stageNumber) {
    if (!isConnected) {
        console.error('❌ Нет подключения к Firebase');
        return false;
    }
    
    // stageNumber: 2-6 (переход на следующую стадию)
    if (stageNumber < 2 || stageNumber > 6) {
        console.error('❌ Неверный номер стадии:', stageNumber);
        return false;
    }
    
    const protocolKey = stageProtocols[stageNumber]?.key;
    if (!protocolKey) {
        console.error('❌ Неверный ключ протокола для стадии:', stageNumber);
        return false;
    }
    
    // Отмечаем протокол как выполненный
    database.ref(`rooms/${ROOM_ID}/stages/${protocolKey}`).set(true)
        .then(() => {
            // Обновляем текущую стадию растения
            database.ref(`rooms/${ROOM_ID}/currentStage`).set(stageNumber)
                .then(() => {
                    console.log(`✅ Стадия ${stageNumber} активирована`);
                })
                .catch((error) => {
                    console.error('❌ Ошибка обновления стадии:', error);
                });
        })
        .catch((error) => {
            console.error('❌ Ошибка обновления протокола:', error);
        });
    
    return true;
};
