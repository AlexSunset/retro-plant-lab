// ============================================
// 🛡️ ОТДЕЛЕНИЕ РЕЗИСТЕНТНОСТИ - Отзывы
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
const database = firebase.database();

// Получаем имя учёного
const scientistName = localStorage.getItem('scientistName');

// ============================================
// Утилиты
// ============================================

function formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'только что';
    if (minutes < 60) return `${minutes} мин. назад`;
    if (hours < 24) return `${hours} ч. назад`;
    return `${days} дн. назад`;
}

function canDelete(timestamp) {
    const now = Date.now();
    const hours = (now - timestamp) / 3600000;
    return hours < 24;
}

// ============================================
// Добавление отзыва
// ============================================

function addReview() {
    const reviewText = document.getElementById('reviewText');
    const text = reviewText.value.trim();
    
    if (!text) {
        alert('Введите текст отзыва');
        return;
    }

    // Добавляем только отзыв (без завершения стадии)
    database.ref('resistance').push({
        text: text,
        author: scientistName,
        timestamp: Date.now()
    }).then(() => {
        console.log('✅ Отзыв добавлен');
        reviewText.value = '';
        closeModal('reviewModal');
    }).catch(err => {
        console.error('❌ Ошибка добавления отзыва:', err);
        alert('Ошибка при добавлении отзыва');
    });
}

// ============================================
// Удаление отзыва
// ============================================

function deleteReview(reviewId, timestamp) {
    if (!canDelete(timestamp)) {
        alert('Можно удалить только в течение 24 часов');
        return;
    }

    if (!confirm('Удалить этот отзыв?')) return;

    database.ref(`resistance/${reviewId}`).remove().then(() => {
        console.log('✅ Отзыв удалён');
    }).catch(err => {
        console.error('❌ Ошибка удаления отзыва:', err);
        alert('Ошибка при удалении отзыва');
    });
}

// ============================================
// Отрисовка отзывов
// ============================================

function renderReview(reviewId, data) {
    const canDeleteReview = canDelete(data.timestamp);

    return `
        <div class="review-card">
            <div class="review-header">
                <div class="review-main">
                    <div class="review-icon">💚</div>
                    <div class="review-info">
                        <div class="review-author-row">
                            <span class="author-name">${data.author}</span>
                            <span class="review-time">${formatTime(data.timestamp)}</span>
                        </div>
                        <div class="review-text">${data.text}</div>
                    </div>
                </div>
                ${canDeleteReview ? `<button class="btn-delete-review" onclick="deleteReview('${reviewId}', ${data.timestamp})">🗑️</button>` : ''}
            </div>
        </div>
    `;
}

// ============================================
// Модальное окно - утилиты
// ============================================

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('modal-active');
}

function updateCharCount(textareaId, counterId) {
    const textarea = document.getElementById(textareaId);
    const counter = document.getElementById(counterId);
    if (counter) {
        counter.textContent = textarea.value.length;
    }
}

// ============================================
// Подключение и загрузка
// ============================================

function loadReviews() {
    const resistanceGrid = document.getElementById('resistanceGrid');

    database.ref('resistance').on('value', (snapshot) => {
        const data = snapshot.val();
        console.log('📊 Получены отзывы:', data);

        if (!data) {
            resistanceGrid.innerHTML = '<div class="no-items">Пока нет отзывов. Будьте первым! 💚</div>';
            return;
        }

        // Сортируем: новые сверху
        const sorted = Object.entries(data).sort((a, b) => b[1].timestamp - a[1].timestamp);

        resistanceGrid.innerHTML = sorted.map(([id, review]) => renderReview(id, review)).join('');
    });
}

function connectToResistance() {
    database.ref('.info/connected').on('value', (snapshot) => {
        const connected = snapshot.val() === true;
        if (connected) {
            console.log('✅ Подключение к Firebase установлено');
            loadReviews();
        }
    });
}

// ============================================
// Инициализация при загрузке DOM
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🛡️ Отделение резистентности загружено');
    console.log('👨‍🔬 Учёный в отделении:', scientistName);
    
    // Проверка имени
    if (!scientistName || scientistName === 'undefined' || scientistName === 'null') {
        console.error('❌ Нет имени учёного, возврат на титульную');
        window.location.href = 'index.html';
        return;
    }

    // Модальное окно отзыва
    document.getElementById('addReviewBtn').addEventListener('click', () => {
        document.getElementById('reviewModal').classList.add('modal-active');
        document.getElementById('reviewText').focus();
    });

    // Закрытие модального окна отзыва
    document.getElementById('closeReviewModal').addEventListener('click', () => {
        closeModal('reviewModal');
    });
    document.getElementById('cancelReviewBtn').addEventListener('click', () => {
        closeModal('reviewModal');
    });

    // Отправка отзыва
    document.getElementById('submitReviewBtn').addEventListener('click', addReview);

    // Счётчик символов отзыва
    document.getElementById('reviewText').addEventListener('input', () => {
        updateCharCount('reviewText', 'reviewCharCount');
    });

    // Ctrl+Enter для отправки отзыва
    document.getElementById('reviewText').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            addReview();
        }
    });

    // Закрытие по клику вне модального окна
    document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('modal-active');
            }
        });
    });

    // Подключение
    connectToResistance();
});

// Делаем функцию удаления глобальной
window.deleteReview = deleteReview;
