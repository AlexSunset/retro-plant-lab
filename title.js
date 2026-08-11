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
// ЭЛЕМЕНТЫ
// ============================================
const nameInput = document.getElementById('scientistName');
const enterBtn = document.getElementById('enterBtn');
const statusDot = document.querySelector('.status-dot');
const statusText = document.getElementById('statusText');

let isConnected = false;

// ============================================
// ПРОВЕРКА ПОДКЛЮЧЕНИЯ
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('🧬 Ретро Лаборатория: загрузка...');
    
    if (typeof firebase === 'undefined') {
        statusText.textContent = 'Ошибка загрузки';
        statusDot.classList.add('disconnected');
        console.error('❌ Firebase не загружен');
        return;
    }
    
    // Проверка доступности базы данных
    const testRef = database.ref('.info/connected');
    testRef.on('value', (snapshot) => {
        if (snapshot.val() === true) {
            statusDot.classList.add('connected');
            statusDot.classList.remove('disconnected');
            statusText.textContent = 'Сеть активна';
            isConnected = true;
            checkReady();
            console.log('✅ Сеть Firebase активна');
        } else {
            statusDot.classList.add('disconnected');
            statusDot.classList.remove('connected');
            statusText.textContent = 'Ожидание сети...';
            isConnected = false;
            checkReady();
            console.log('⏳ Ожидание соединения...');
        }
    });
    
    // Обработка ввода имени
    nameInput.addEventListener('input', () => {
        checkReady();
    });
    
    // Обработка Enter
    nameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !enterBtn.disabled) {
            enterLaboratory();
        }
    });
    
    // Клик по кнопке
    enterBtn.addEventListener('click', () => {
        enterLaboratory();
    });
});

// Проверка готовности к входу
function checkReady() {
    const name = nameInput.value.trim();
    
    if (isConnected && name.length > 0) {
        enterBtn.disabled = false;
        enterBtn.classList.add('ready');
        nameInput.classList.remove('error');
    } else {
        enterBtn.disabled = true;
        enterBtn.classList.remove('ready');
    }
}

// Валидация при потере фокуса
nameInput.addEventListener('blur', () => {
    const name = nameInput.value.trim();
    if (name.length === 0 && isConnected) {
        nameInput.classList.add('error');
    } else {
        nameInput.classList.remove('error');
    }
});

// Убираем ошибку при начале ввода
nameInput.addEventListener('input', () => {
    nameInput.classList.remove('error');
    checkReady();
});

// Вход в лабораторию
function enterLaboratory() {
    const name = nameInput.value.trim();
    
    if (!name) {
        alert('⚠️ Пожалуйста, введите ваше имя!');
        nameInput.focus();
        return;
    }
    
    // Сохраняем имя в localStorage
    localStorage.setItem('scientistName', name);
    
    // Генерируем уникальный ID для этого сеанса
    const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('scientistSessionId', sessionId);
    
    console.log(`👨‍🔬 Учёный "${name}" входит в лабораторию (сессия: ${sessionId})`);
    
    // Переход на страницу сада
    window.location.href = 'garden.html';
}
