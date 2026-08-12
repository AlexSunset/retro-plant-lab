// ============================================
// ОТДЕЛЕНИЕ РЕЗИСТЕНТНОСТИ
// ============================================

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

// Проверка имени учёного
const scientistName = localStorage.getItem('scientistName');

if (!scientistName || scientistName === 'undefined' || scientistName === 'null') {
    console.error('❌ Нет имени учёного, возврат на титульную');
    window.location.href = 'index.html';
}

console.log('🛡️ Отделение резистентности загружено');
console.log('👨‍🔬 Учёный в отделении:', scientistName);

// ============================================
// МОДАЛЬНОЕ ОКНО
// ============================================

const reviewModal = document.getElementById('reviewModal');
const reviewText = document.getElementById('reviewText');
const reviewCharCount = document.getElementById('reviewCharCount');

function openReviewModal() {
    reviewText.value = '';
    reviewCharCount.textContent = '0';
    reviewModal.classList.add('modal-active');
    reviewText.focus();
}

function closeReviewModal() {
    reviewModal.classList.remove('modal-active');
}

// Закрытие по клику вне окна
reviewModal.addEventListener('click', (e) => {
    if (e.target === reviewModal) {
        closeReviewModal();
    }
});

// Обновление счётчика символов
window.updateCharCount = function(textareaId, countId) {
    const textarea = document.getElementById(textareaId);
    const count = document.getElementById(countId);
    count.textContent = textarea.value.length;
};

// ============================================
// ДОБАВЛЕНИЕ ОТЗЫВА
// ============================================

window.addReview = function() {
    const text = reviewText.value.trim();
    
    if (!text) {
        alert('⚠️ Введите текст отзыва');
        return;
    }
    
    const reviewRef = database.ref('resistance').push();
    const reviewData = {
        text: text,
        author: scientistName,
        timestamp: Date.now()
    };
    
    reviewRef.set(reviewData)
        .then(() => {
            console.log('✅ Отзыв добавлен');
            closeReviewModal();
        })
        .catch((error) => {
            console.error('❌ Ошибка добавления отзыва:', error);
            alert('⚠️ Ошибка добавления отзыва');
        });
};

// ============================================
// УДАЛЕНИЕ ОТЗЫВА
// ============================================

window.deleteReview = function(reviewId, author) {
    if (author !== scientistName) {
        alert('⚠️ Можно удалить только свой отзыв');
        return;
    }
    
    if (!confirm('Удалить этот отзыв?')) return;
    
    database.ref(`resistance/${reviewId}`).remove()
        .then(() => {
            console.log('✅ Отзыв удалён');
        })
        .catch((error) => {
            console.error('❌ Ошибка удаления:', error);
        });
};

// ============================================
// ФОРМАТИРОВАНИЕ ВРЕМЕНИ
// ============================================

function timeAgo(timestamp) {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'только что';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} мин. назад`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} час. назад`;
    return `${Math.floor(seconds / 86400)} дн. назад`;
}

// ============================================
// ОТОБРАЖЕНИЕ ОТЗЫВОВ
// ============================================

const reviewsGrid = document.getElementById('reviewsGrid');

function renderReviews(reviews) {
    reviewsGrid.innerHTML = '';
    
    const reviewList = [];
    reviews.forEach((snapshot) => {
        reviewList.push({
            id: snapshot.key,
            ...snapshot.val()
        });
    });
    
    // Сортировка: новые сверху
    reviewList.sort((a, b) => b.timestamp - a.timestamp);
    
    if (reviewList.length === 0) {
        reviewsGrid.innerHTML = '<div class="no-data">Пока нет отзывов. Будьте первым! 💚</div>';
        return;
    }
    
    reviewList.forEach((review) => {
        const canDelete = review.author === scientistName;
        const time = timeAgo(review.timestamp);
        
        const card = document.createElement('div');
        card.className = 'review-card';
        card.innerHTML = `
            <div class="review-header">
                <div class="review-author-info">
                    <span class="author-icon">👤</span>
                    <div>
                        <div class="author-name">${escapeHtml(review.author)}</div>
                        <div class="time-ago">${time}</div>
                    </div>
                </div>
                ${canDelete ? `<button class="btn-delete-review" onclick="deleteReview('${review.id}', '${escapeHtml(review.author)}')" title="Удалить">🗑️</button>` : ''}
            </div>
            <div class="review-text">${escapeHtml(review.text)}</div>
        `;
        
        reviewsGrid.appendChild(card);
    });
}

// Экранирование HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// ПОДКЛЮЧЕНИЕ К FIREBASE
// ============================================

const resistanceRef = database.ref('resistance');

resistanceRef.on('value', (snapshot) => {
    const data = snapshot.val();
    
    if (!data) {
        reviewsGrid.innerHTML = '<div class="no-data">Пока нет отзывов. Будьте первым! 💚</div>';
        return;
    }
    
    renderReviews(Object.entries(data));
});

// Отображение имени пользователя
document.getElementById('userDisplay').textContent = `👤 ${scientistName}`;
