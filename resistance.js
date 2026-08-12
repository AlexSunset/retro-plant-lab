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
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ============================================

let reviewModal, reviewText, reviewCharCount, reviewsGrid;

// ============================================
// ИНИЦИАЛИЗАЦИЯ ПОСЛЕ ЗАГРУЗКИ DOM
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    reviewModal = document.getElementById('reviewModal');
    reviewText = document.getElementById('reviewText');
    reviewCharCount = document.getElementById('reviewCharCount');
    reviewsGrid = document.getElementById('reviewsGrid');
    
    // Закрытие по клику вне окна
    reviewModal.addEventListener('click', (e) => {
        if (e.target === reviewModal) {
            closeReviewModal();
        }
    });
    
    // Отображение имени пользователя
    document.getElementById('userDisplay').textContent = `👤 ${scientistName}`;
    
    // Подключение к Firebase
    connectToFirebase();
});

// ============================================
// МОДАЛЬНОЕ ОКНО
// ============================================

window.openReviewModal = function() {
    reviewText.value = '';
    reviewCharCount.textContent = '0';
    reviewModal.classList.add('modal-active');
    reviewText.focus();
};

window.closeReviewModal = function() {
    reviewModal.classList.remove('modal-active');
};

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
    const now = Date.now();
    const reviewData = {
        text: text,
        author: scientistName,
        timestamp: now,
        createdAt: now
    };
    
    console.log('📝 Добавление отзыва:', reviewData);
    
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
    if (!timestamp || isNaN(timestamp)) {
        return 'недавно';
    }
    
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'только что';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} мин. назад`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} час. назад`;
    return `${Math.floor(seconds / 86400)} дн. назад`;
}

// ============================================
// ОТОБРАЖЕНИЕ ОТЗЫВОВ
// ============================================

function renderReviews(data) {
    reviewsGrid.innerHTML = '';
    
    const reviewList = [];
    
    console.log('📊 Получены отзывы:', data);
    
    // Преобразуем объект в массив
    Object.entries(data).forEach(([id, review]) => {
        console.log('  👤 Отзыв:', id, review);
        reviewList.push({
            id: id,
            text: review.text || '',
            author: review.author || 'Аноним',
            timestamp: review.timestamp || review.createdAt || 0
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
        
        console.log('  📝 Рендер:', review.text, 'автор:', review.author, 'время:', time);
        
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

function connectToFirebase() {
    const resistanceRef = database.ref('resistance');
    
    resistanceRef.on('value', (snapshot) => {
        const data = snapshot.val();
        
        if (!data) {
            reviewsGrid.innerHTML = '<div class="no-data">Пока нет отзывов. Будьте первым! 💚</div>';
            return;
        }
        
        renderReviews(Object.entries(data));
    });
}
