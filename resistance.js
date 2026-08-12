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

// Проверка имени
if (!scientistName || scientistName === 'undefined' || scientistName === 'null') {
    console.error('❌ Нет имени учёного, возврат на титульную');
    window.location.href = 'index.html';
} else {
    // Весь код внутри else
    document.getElementById('scientistName').textContent = `👨‍🔬 ${scientistName}`;

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
    // Модальное окно отзыва
    // ============================================

    const reviewModal = document.getElementById('reviewModal');
    const reviewModalBtn = document.getElementById('reviewModalBtn');
    const modalClose = document.getElementById('modalClose');
    const cancelBtn = document.getElementById('cancelBtn');
    const submitReviewBtn = document.getElementById('submitReviewBtn');
    const reviewText = document.getElementById('reviewText');
    const reviewCharCount = document.getElementById('reviewCharCount');

    reviewModalBtn.addEventListener('click', () => {
        reviewModal.classList.add('modal-active');
        reviewText.focus();
    });

    modalClose.addEventListener('click', () => {
        reviewModal.classList.remove('modal-active');
    });

    cancelBtn.addEventListener('click', () => {
        reviewModal.classList.remove('modal-active');
    });

    reviewText.addEventListener('input', () => {
        reviewCharCount.textContent = reviewText.value.length;
    });

    // Ctrl+Enter для отправки
    reviewText.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            submitReviewBtn.click();
        }
    });

    // ============================================
    // Добавление отзыва
    // ============================================

    submitReviewBtn.addEventListener('click', async () => {
        const text = reviewText.value.trim();
        if (!text) {
            alert('Введите текст отзыва');
            return;
        }

        try {
            const newRef = database.ref('resistance').push();
            await newRef.set({
                text: text,
                author: scientistName,
                timestamp: Date.now()
            });
            console.log('✅ Отзыв добавлен');
            reviewModal.classList.remove('modal-active');
            reviewText.value = '';
            reviewCharCount.textContent = '0';
        } catch (error) {
            console.error('❌ Ошибка добавления отзыва:', error);
            alert('Ошибка при добавлении отзыва');
        }
    });

    // ============================================
    // Удаление отзыва
    // ============================================

    window.deleteReview = async function(reviewId, timestamp) {
        if (!canDelete(timestamp)) {
            alert('Можно удалить только в течение 24 часов');
            return;
        }

        if (!confirm('Удалить этот отзыв?')) return;

        try {
            await database.ref(`resistance/${reviewId}`).remove();
            console.log('✅ Отзыв удалён');
        } catch (error) {
            console.error('❌ Ошибка удаления отзыва:', error);
            alert('Ошибка при удалении отзыва');
        }
    };

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
    // Загрузка и отображение отзывов
    // ============================================

    const reviewsGrid = document.getElementById('reviewsGrid');

    // Слушаем изменения в Firebase
    database.ref('resistance').on('value', (snapshot) => {
        const data = snapshot.val();
        console.log('📊 Получены отзывы:', data);

        if (!data) {
            reviewsGrid.innerHTML = '<div class="no-items">Пока нет отзывов. Будьте первым! 💚</div>';
            return;
        }

        // Сортируем: новые сверху
        const sorted = Object.entries(data).sort((a, b) => b[1].timestamp - a[1].timestamp);

        reviewsGrid.innerHTML = sorted.map(([id, review]) => renderReview(id, review)).join('');
    });

    console.log('🛡️ Отделение резистентности загружено');
    console.log('👨‍🔬 Учёный в отделении:', scientistName);

} // Конец else
