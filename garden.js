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
let savedAvatar = '👨\u200d🔬';

// Стадии роста растения (6 стадий)
const plantStages = {
    1: { image: 'stages/stage1.png', name: 'Семя', desc: 'Начало пути' },
    2: { image: 'stages/stage2.png', name: 'Росток', desc: 'Первые шаги' },
    3: { image: 'stages/stage3.png', name: 'В горшке', desc: 'Набирает силу' },
    4: { image: 'stages/stage4.png', name: 'Молодое дерево', desc: 'Активный рост' },
    5: { image: 'stages/stage5.png', name: 'Дерево', desc: 'Расцвет' },
    6: { image: 'stages/stage6.png', name: 'Цветущее дерево', desc: 'Полный успех' }
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
    savedAvatar = storedAvatar || '👨\u200d🔬';
    
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
    
    console.log('👨\u200d🔬 Учёный:', scientistName, 'Session:', sessionId, 'Avatar:', savedAvatar);
    
    document.getElementById('currentUserName').textContent = scientistName;
    
    // Отображаем аватарку (картинка или эмодзи)
    const headerAvatarEl = document.getElementById('headerUserAvatar');
    if (headerAvatarEl) {
        headerAvatarEl.innerHTML = getAvatarDisplay(savedAvatar);
    }
    
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
                    stage2_soil: false,
                    stage3_samples: false,
                    stage4_clean: false,
                    stage5_growth: false,
                    stage6_resistance: false
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
        if (equipData && equipData.avatar) {
            // Проверяем, это путь к картинке или эмодзи
            if (typeof equipData.avatar === 'string' && equipData.avatar.startsWith('avatars/')) {
                savedAvatar = equipData.avatar;
            } else if (equipData.avatar.emoji) {
                savedAvatar = equipData.avatar.emoji;
            } else {
                savedAvatar = 'avatars/avatar1.png';
            }
            localStorage.setItem('scientistAvatar', savedAvatar);
            console.log('🎭 Аватарка загружена из Firebase:', savedAvatar);
        } else {
            savedAvatar = localStorage.getItem('scientistAvatar') || 'avatars/avatar1.png';
            console.log('🎭 Аватарка из localStorage:', savedAvatar);
        }
        
        // Обновляем отображение аватарки в шапке
        const headerAvatarEl = document.getElementById('headerUserAvatar');
        if (headerAvatarEl) {
            headerAvatarEl.innerHTML = getAvatarDisplay(savedAvatar);
        }
        
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
                avatar: data.avatar || '👨\u200d🔬'
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

function getAvatarDisplay(avatar) {
    // Если аватарка - это путь к картинке (начинается с 'avatars/')
    if (avatar && typeof avatar === 'string' && avatar.startsWith('avatars/')) {
        return `<img src="${avatar}" alt="avatar" class="avatar-image-small">`;
    }
    // Иначе это эмодзи
    return avatar || '👨\u200d🔬';
}

function updatePlant(currentStage) {
    const plantData = plantStages[currentStage] || plantStages[1];
    
    const plantDisplay = document.getElementById('plantDisplay');
    plantDisplay.innerHTML = `<img src="${plantData.image}" alt="${plantData.name}" class="plant-image">`;
    
    document.getElementById('plantStageInfo').textContent = `Стадия: ${plantData.name}`;
    document.getElementById('stageProgress').textContent = `${currentStage}/6`;
    
    // Анимация
    plantDisplay.style.transform = 'scale(1.15)';
    setTimeout(() => {
        plantDisplay.style.transform = 'scale(1)';
    }, 200);
}

function updateStagesUI(stages, currentStage) {
    currentStage = currentStage || 1;
    
    // Находим первую незавершённую стадию
    let nextActiveStage = null;
    for (let i = 2; i <= 6; i++) {
        const protocolKey = stageProtocols[i]?.key;
        if (protocolKey && stages[protocolKey] !== true) {
            nextActiveStage = i;
            break;
        }
    }
    
    if (!nextActiveStage) {
        nextActiveStage = 6;
    }
    
    console.log('🔍 updateStagesUI: currentStage=' + currentStage + ', nextActiveStage=' + nextActiveStage);
    
    // Сначала обновляем состояние всех карточек и кнопок
    for (let i = 2; i <= 6; i++) {
        const protocolKey = stageProtocols[i]?.key;
        if (!protocolKey) continue;
        
        const isCompleted = stages[protocolKey] === true;
        const card = document.querySelector(`.protocol-card[data-stage="${i}"]`);
        const statusEl = document.getElementById(`stage${i}Status`);
        const goToBtn = card ? card.querySelector('.btn-go-to') : null;
        const addBtn = card ? card.querySelector('.btn-add-protocol') : null;
        const applyBtn = card ? card.querySelector('.btn-apply') : null;
        
        const isActive = (i === nextActiveStage && !isCompleted);
        
        console.log('  Стадия ' + i + ': isCompleted=' + isCompleted + ', isActive=' + isActive);
        
        // Обновляем классы карточки
        if (card) {
            card.classList.remove('locked', 'completed', 'active');
            if (isCompleted) {
                card.classList.add('completed');
            } else if (isActive) {
                card.classList.add('active');
            } else {
                card.classList.add('locked');
            }
        }
        
        // Обновляем статус
        if (statusEl) {
            statusEl.textContent = isCompleted ? '✅ Выполнено' : '⏳ Не выполнено';
        }
        
        // Кнопка "Перейти"
        if (goToBtn) {
            goToBtn.classList.remove('locked');
            if (isCompleted) {
                goToBtn.disabled = false;
                goToBtn.textContent = '↗️ Открыть';
            } else if (isActive) {
                goToBtn.disabled = false;
                goToBtn.textContent = '↗️ Перейти';
            } else {
                goToBtn.disabled = true;
                goToBtn.textContent = '🔒 Заблокировано';
                goToBtn.classList.add('locked');
            }
        }
        
        // Кнопка "+ Добавить протокол"
        if (addBtn) {
            addBtn.classList.remove('locked');
            if (isActive) {
                addBtn.disabled = false;
            } else {
                addBtn.disabled = true;
                addBtn.classList.add('locked');
            }
        }
        
        // Кнопка "Применить протоколы" — по умолчанию заблокирована
        if (applyBtn) {
            applyBtn.disabled = true;
        }
    }
    
    // Обновляем счёт и растение
    let completedCount = 0;
    for (let i = 2; i <= 6; i++) {
        const protocolKey = stageProtocols[i]?.key;
        if (protocolKey && stages[protocolKey] === true) {
            completedCount++;
        }
    }
    document.getElementById('totalScore').textContent = `${completedCount}/5`;
    updatePlant(currentStage);
    
    // Загружаем комментарии и обновляем кнопки "Применить"
    loadProtocolComments(stages, nextActiveStage);
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
        const avatarDisplay = getAvatarDisplay(s.avatar);
        return `
            <div class="scientist-card ${isMe ? 'is-me' : ''}">
                <div class="scientist-icon">${avatarDisplay}</div>
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
        
        // Сброс комментариев протоколов
        database.ref(`rooms/${ROOM_ID}/protocols`).remove()
            .then(() => {
                // Очищаем UI комментариев и отключаем кнопки после удаления из Firebase
                for (let i = 2; i <= 6; i++) {
                    const commentsEl = document.getElementById(`stage${i}Comments`);
                    if (commentsEl) {
                        commentsEl.innerHTML = '';
                    }
                    
                    // Отключаем кнопку "Применить протоколы"
                    const applyBtn = document.getElementById(`applyBtn${i}`);
                    if (applyBtn) {
                        applyBtn.disabled = true;
                    }
                }
                console.log('✅ Протоколы и кнопки сброшены');
            })
            .catch((error) => {
                console.error('❌ Ошибка сброса протоколов:', error);
            });
        
        console.log('✅ Все данные сброшены');
    }
}

// ============================================
// ФУНКЦИИ ДЛЯ КОММЕНТАРИЕВ (ПРОТОКОЛОВ)
// ============================================

// Открыть модальное окно для добавления комментария
window.openCommentModal = function(stageNumber) {
    const modal = document.getElementById('commentModal');
    const modalTitle = document.getElementById('modalTitle');
    const currentStageId = document.getElementById('currentStageId');
    
    if (!modal || !modalTitle || !currentStageId) return;
    
    const protocolName = stageProtocols[stageNumber]?.name || 'Протокол';
    modalTitle.textContent = `Добавить протокол: ${protocolName}`;
    currentStageId.value = stageNumber;
    document.getElementById('commentText').value = '';
    
    modal.style.display = 'flex';
};

// Закрыть модальное окно
window.closeCommentModal = function() {
    const modal = document.getElementById('commentModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

// Сохранить комментарий протокола
window.saveProtocolComment = function() {
    const stageNumber = parseInt(document.getElementById('currentStageId').value);
    const commentText = document.getElementById('commentText').value.trim();
    
    if (!commentText) {
        alert('Введите текст протокола');
        return;
    }
    
    const protocolKey = stageProtocols[stageNumber]?.key;
    if (!protocolKey) {
        console.error('❌ Неверный ключ протокола:', stageNumber);
        return;
    }
    
    // Создаём новый комментарий с уникальным ID
    const newCommentRef = database.ref(`rooms/${ROOM_ID}/protocols/${protocolKey}/comments`).push();
    const newComment = {
        text: commentText,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    
    // Только добавляем комментарий, НЕ отмечаем стадию
    database.ref(`rooms/${ROOM_ID}/protocols/${protocolKey}/comments/${newCommentRef.key}`).set(newComment)
        .then(() => {
            console.log(`✅ Протокол ${stageNumber} сохранён`);
            closeCommentModal();
        })
        .catch((error) => {
            console.error('❌ Ошибка сохранения:', error);
            alert('Ошибка сохранения: ' + error.message);
        });
};

// Загрузка комментариев для протоколов
function loadProtocolComments(stages, nextActiveStage) {
    const protocolsRef = database.ref(`rooms/${ROOM_ID}/protocols`);
    
    console.log('🔍 loadProtocolComments: nextActiveStage=' + nextActiveStage);
    
    protocolsRef.once('value').then((snapshot) => {
        const data = snapshot.val();
        
        // Очищаем все комментарии
        for (let i = 2; i <= 6; i++) {
            const commentsEl = document.getElementById(`stage${i}Comments`);
            if (commentsEl) {
                commentsEl.innerHTML = '';
            }
        }
        
        if (!data) {
            console.log('  Нет данных протоколов');
            // Разблокируем кнопки для активной стадии даже если нет данных
            unblockActiveStageButtons(nextActiveStage);
            return;
        }
        
        // Отображаем комментарии и обновляем кнопки
        Object.keys(data).forEach((key) => {
            const protocol = data[key];
            const stageNum = parseInt(key.replace('stage', '').split('_')[0]);
            
            if (stageNum >= 2 && stageNum <= 6 && protocol) {
                const commentsEl = document.getElementById(`stage${stageNum}Comments`);
                const applyBtn = document.getElementById(`applyBtn${stageNum}`);
                
                const protocolKey = stageProtocols[stageNum]?.key;
                const isCompleted = stages[protocolKey] === true;
                const isActive = (stageNum === nextActiveStage && !isCompleted);
                
                console.log('  Протокол ' + stageNum + ': isActive=' + isActive + ', isCompleted=' + isCompleted);
                
                if (commentsEl && protocol.comments) {
                    const sortedComments = Object.values(protocol.comments).sort((a, b) => {
                        const timeA = a.timestamp || 0;
                        const timeB = b.timestamp || 0;
                        return timeA - timeB;
                    });
                    
                    commentsEl.innerHTML = sortedComments.map((comment) => `
                        <div class="protocol-comment">
                            <p>${escapeHtml(comment.text)}</p>
                        </div>
                    `).join('');
                    
                    // Активируем кнопку только если:
                    // 1. Есть комментарии
                    // 2. Стадия активна
                    // 3. Стадия не завершена
                    if (applyBtn && sortedComments.length > 0 && isActive) {
                        applyBtn.disabled = false;
                        console.log('  ✅ applyBtn' + stageNum + ' активирована (' + sortedComments.length + ' комм.)');
                    }
                }
            }
        });
        
        // Разблокируем кнопки "Перейти" и "+ Добавить протокол" для активной стадии
        unblockActiveStageButtons(nextActiveStage);
        
    }).catch((error) => {
        console.error('❌ Ошибка загрузки комментариев:', error);
    });
}

// Разблокировка кнопок для активной стадии
function unblockActiveStageButtons(nextActiveStage) {
    console.log('  🔓 unblockActiveStageButtons для стадии ' + nextActiveStage);
    
    const card = document.querySelector(`.protocol-card[data-stage="${nextActiveStage}"]`);
    if (!card) {
        console.log('  ❌ Карточка не найдена для стадии ' + nextActiveStage);
        return;
    }
    
    const goToBtn = card.querySelector('.btn-protocol');
    const addBtn = card.querySelector('.btn-add-comment');
    
    console.log('  🔍 goToBtn:', goToBtn ? 'найдена' : 'не найдена');
    console.log('  🔍 addBtn:', addBtn ? 'найдена' : 'не найдена');
    
    if (goToBtn) {
        goToBtn.disabled = false;
        goToBtn.classList.remove('locked');
        const span = goToBtn.querySelector('span');
        if (span) {
            span.textContent = 'Перейти';
        }
        console.log('  ✅ Кнопка "Перейти" разблокирована для стадии ' + nextActiveStage);
    }
    
    if (addBtn) {
        addBtn.disabled = false;
        addBtn.classList.remove('locked');
        console.log('  ✅ Кнопка "+ Добавить протокол" разблокирована для стадии ' + nextActiveStage);
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

// Применение протокола (кнопка "Применить протоколы")
window.applyProtocol = function(stageNumber) {
    if (!isConnected) {
        console.error('❌ Нет подключения к Firebase');
        alert('Нет подключения к Firebase');
        return;
    }
    
    // stageNumber: 2-6 (переход на следующую стадию)
    if (stageNumber < 2 || stageNumber > 6) {
        console.error('❌ Неверный номер стадии:', stageNumber);
        return;
    }
    
    const protocolKey = stageProtocols[stageNumber]?.key;
    if (!protocolKey) {
        console.error('❌ Неверный ключ протокола для стадии:', stageNumber);
        return;
    }
    
    // Проверяем, есть ли комментарии для этого протокола
    const commentsRef = database.ref(`rooms/${ROOM_ID}/protocols/${protocolKey}/comments`);
    commentsRef.once('value').then((snapshot) => {
        const comments = snapshot.val();
        
        if (!comments || Object.keys(comments).length === 0) {
            alert('⚠️ Сначала добавьте хотя бы один протокол в карточку!');
            return;
        }
        
        // Отмечаем протокол как выполненный
        return database.ref(`rooms/${ROOM_ID}/stages/${protocolKey}`).set(true);
    }).then(() => {
        // Обновляем текущую стадию растения
        return database.ref(`rooms/${ROOM_ID}/currentStage`).set(stageNumber);
    }).then(() => {
        console.log(`✅ Стадия ${stageNumber} активирована`);
        // Принудительно обновляем UI для разблокировки кнопок следующей стадии
        const roomRef = database.ref(`rooms/${ROOM_ID}`);
        roomRef.once('value').then((snapshot) => {
            const data = snapshot.val();
            if (data) {
                updateStagesUI(data.stages || {}, data.currentStage || 1);
            }
        });
    }).catch((error) => {
        console.error('❌ Ошибка применения протокола:', error);
        alert('Ошибка: ' + error.message);
    });
};
