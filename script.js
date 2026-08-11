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
const ROOM_ID = 'retro-main'; // Общая комната для всех
let localCounters = {
    water: 0,
    sunlight: 0,
    nitrogen: 0,
    phosphorus: 0,
    potassium: 0,
    compost: 0
};
let isUpdating = false;
let isConnected = false;

// Стадии роста растения
const plantStages = [
    { threshold: 0, emoji: '🌱', name: 'Росток' },
    { threshold: 10, emoji: '🌿', name: 'Всходы' },
    { threshold: 25, emoji: '🪴', name: 'Растение' },
    { threshold: 50, emoji: '🌳', name: 'Дерево' },
    { threshold: 100, emoji: '🌺', name: 'Цветущее' },
    { threshold: 150, emoji: '🌻', name: 'Подсолнух' },
    { threshold: 200, emoji: '🌸', name: 'Сакура' },
    { threshold: 300, emoji: '🌹', name: 'Роза' },
    { threshold: 500, emoji: '🌷', name: 'Тюльпан' },
    { threshold: 1000, emoji: '👑', name: 'Легендарное' }
];

// ============================================
// СТАРТ ПРИЛОЖЕНИЯ
// ============================================
function startRetro() {
    console.log('🚀 Начинаем ретро!');
    
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
    
    // Подключаемся к общей комнате
    connectToRoom(ROOM_ID);
}

// ============================================
// ФУНКЦИИ FIREBASE
// ============================================

function connectToRoom(roomId) {
    updateConnectionStatus(false);
    
    const roomRef = database.ref(`rooms/${roomId}`);
    
    // Проверяем, существует ли комната
    roomRef.once('value').then((snapshot) => {
        if (!snapshot.exists()) {
            // Создаём новую комнату
            console.log('📝 Создаём новую комнату');
            roomRef.set({
                counters: { ...localCounters },
                totalScore: 0,
                createdAt: firebase.database.ServerValue.TIMESTAMP,
                updatedAt: firebase.database.ServerValue.TIMESTAMP
            });
        }
        
        // Загружаем текущие данные
        const data = snapshot.val() || { counters: { ...localCounters }, totalScore: 0 };
        localCounters = { ...data.counters };
        updateUI();
        
        // Подписываемся на изменения
        subscribeToRoom(roomId);
        
        // Отслеживание участников
        trackPresence(roomId);
        
    }).catch((error) => {
        console.error('❌ Ошибка подключения:', error);
        updateConnectionStatus(false);
        alert('Ошибка подключения к серверу. Проверьте интернет-соединение.');
    });
}

function subscribeToRoom(roomId) {
    const roomRef = database.ref(`rooms/${roomId}`);
    
    roomRef.on('value', (snapshot) => {
        if (!snapshot.exists()) return;
        
        const data = snapshot.val();
        
        if (!isUpdating) {
            localCounters = { ...data.counters };
            updateUI();
        }
        
        if (!isConnected) {
            isConnected = true;
            updateConnectionStatus(true);
        }
    }, (error) => {
        console.error('❌ Ошибка подписки:', error);
        updateConnectionStatus(false);
    });
}

function trackPresence(roomId) {
    const presenceRef = database.ref(`rooms/${roomId}/participants`);
    const myPresenceRef = presenceRef.push();
    
    myPresenceRef.set(true);
    myPresenceRef.onDisconnect().remove();
    
    presenceRef.on('value', (snapshot) => {
        const count = snapshot.numChildren();
        document.getElementById('participantsCount').textContent = count;
    });
}

function updateFirebase() {
    if (!isConnected) return;
    
    isUpdating = true;
    
    const totalScore = Object.values(localCounters).reduce((sum, count) => sum + count, 0);
    
    database.ref(`rooms/${ROOM_ID}`).update({
        counters: { ...localCounters },
        totalScore: totalScore,
        updatedAt: firebase.database.ServerValue.TIMESTAMP
    }).catch((error) => {
        console.error('❌ Ошибка обновления:', error);
        updateConnectionStatus(false);
    }).finally(() => {
        setTimeout(() => {
            isUpdating = false;
        }, 100);
    });
}

// ============================================
// ФУНКЦИИ UI
// ============================================

function updateConnectionStatus(connected) {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.getElementById('statusText');
    
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
    plantDisplay.title = `${currentStage.name} (${total} очков)`;
    
    plantDisplay.style.transform = 'scale(1.15)';
    setTimeout(() => {
        plantDisplay.style.transform = 'scale(1)';
    }, 200);
}

function updateUI() {
    Object.keys(localCounters).forEach(key => {
        const counterElement = document.getElementById(`${key}Counter`);
        counterElement.textContent = localCounters[key];
    });
    
    const totalScore = Object.values(localCounters).reduce((sum, count) => sum + count, 0);
    document.getElementById('totalScore').textContent = totalScore;
    
    updatePlant();
}

function increaseCounter(fertilizer) {
    if (!isConnected) {
        alert('Нет соединения с сервером. Проверьте интернет.');
        return;
    }
    
    localCounters[fertilizer]++;
    
    const counterElement = document.getElementById(`${fertilizer}Counter`);
    counterElement.classList.add('counter-updated');
    setTimeout(() => {
        counterElement.classList.remove('counter-updated');
    }, 300);
    
    updateUI();
    updateFirebase();
}

function resetAll() {
    if (!isConnected) {
        alert('Нет соединения с сервером.');
        return;
    }
    
    if (confirm('Вы уверены, что хотите сбросить все счётчики?')) {
        Object.keys(localCounters).forEach(key => {
            localCounters[key] = 0;
        });
        
        updateUI();
        updateFirebase();
    }
}

// ============================================
// КЛИК ПО СТРОКЕ ТАБЛИЦЫ
// ============================================
document.querySelectorAll('#fertilizersBody tr').forEach(row => {
    row.addEventListener('click', (e) => {
        if (!e.target.classList.contains('btn-increase')) {
            const fertilizer = row.dataset.fertilizer;
            increaseCounter(fertilizer);
        }
    });
});

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌱 Приложение загружено!');
    console.log('Firebase:', typeof firebase !== 'undefined' ? 'OK' : 'НЕ ЗАГРУЖЕН');
    
    updateUI();
    updateConnectionStatus(false);
    
    if (typeof firebase === 'undefined') {
        console.error('❌ Firebase SDK не загружен!');
        document.getElementById('statusText').textContent = 'Ошибка загрузки';
    }
});
