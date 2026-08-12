/**
 * Зона Экипировки - страница для подготовки учёных
 */

// Firebase конфигурация
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

// Константы
const ROOM_ID = 'retro-main';

// Получаем имя учёного
const scientistName = localStorage.getItem('scientistName');

// Проверка имени
if (!scientistName || scientistName === 'undefined' || scientistName === 'null') {
    console.error('❌ Нет имени учёного, возврат на титульную');
    window.location.href = 'index.html';
} else {
    // Весь код внутри else
    console.log('👔 Зона экипировки загружена');
    console.log('👨‍🔬 Учёный в зоне экипировки:', scientistName);

    // Элементы DOM
    const equipContent = document.getElementById('equipContent');

    // Инициализация страницы
    function initEquip() {
        // Пока просто заглушка - концепция в разработке
        equipContent.innerHTML = `
            <div class="empty-state">
                <p>🚧 Раздел в разработке</p>
                <p class="hint">Скоро здесь появится функционал для подготовки к ретро</p>
            </div>
        `;
    }

    // Запуск при загрузке
    document.addEventListener('DOMContentLoaded', initEquip);
}
