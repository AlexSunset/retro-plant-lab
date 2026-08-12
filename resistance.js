// ============================================
// ОТДЕЛЕНИЕ РЕЗИСТЕНТНОСТИ | T-KAT Retro
// ============================================

// Конфигурация Firebase
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
const db = firebase.database();

// Текущий пользователь
let currentUserName = null;
let currentSessionId = null;

// ============================================
// ПРОВЕРКА ИМЕНИ
// ============================================

currentUserName = localStorage.getItem('scientistName');

// Проверка имени
if (!currentUserName || currentUserName === 'undefined' || currentUserName === 'null') {
    console.error('❌ Нет имени учёного, возврат на титульную');
    window.location.href = 'index.html';
} else {
    // Весь код внутри else
    
    currentSessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    console.log('🛡️ Отделение Резистентности загружено');
    console.log(`👨‍🔬 Учёный: ${currentUserName} | Session: ${currentSessionId}`);
    
    // ============================================
    // ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
    // ============================================
    
    document.addEventListener('DOMContentLoaded', () => {
        // Отображаем имя пользователя
        document.getElementById('userBadge').textContent = '👤 ' + currentUserName;
        
        // Загружаем отзывы
        loadReviews();
        
        // Настраиваем модальные окна
        setupReviewModal();
        setupCommentModal();
    });
    
    // ============================================
    // ЗАГРУЗКА ОТЗЫВОВ
    // ============================================
    
    function loadReviews() {
        const reviewsRef = db.ref('resistance');
        const grid = document.getElementById('resistanceGrid');
        
        reviewsRef.on('value', (snapshot) => {
            const data = snapshot.val();
            
            if (!data || Object.keys(data).length === 0) {
                grid.innerHTML = '<div class="no-data">Пока нет отзывов. Будьте первым!</div>';
                return;
            }
            
            grid.innerHTML = '';
            
            // Сортируем по времени (новые сверху)
            const reviews = Object.entries(data).sort((a, b) => b[1].timestamp - a[1].timestamp);
            
            reviews.forEach(([reviewId, review]) => {
                const card = createReviewCard(reviewId, review);
                grid.appendChild(card);
            });
        });
    }
    
    // ============================================
    // СОЗДАНИЕ КАРТОЧКИ ОТЗЫВА
    // ============================================
    
    function createReviewCard(reviewId, review) {
        const card = document.createElement('div');
        card.className = 'review-card';
        
        // Заголовок с автором и временем
        const header = document.createElement('div');
        header.className = 'review-header';
        
        const authorInfo = document.createElement('div');
        authorInfo.className = 'review-author-info';
        
        const authorIcon = document.createElement('span');
        authorIcon.className = 'author-icon';
        authorIcon.textContent = '💫';
        
        const authorName = document.createElement('span');
        authorName.className = 'author-name';
        authorName.textContent = review.author;
        
        const timeAgo = document.createElement('span');
        timeAgo.className = 'time-ago';
        timeAgo.textContent = formatTime(review.timestamp);
        
        authorInfo.appendChild(authorIcon);
        authorInfo.appendChild(authorName);
        authorInfo.appendChild(timeAgo);
        
        // Кнопка удаления (только для автора и в течение 24 часов)
        const canDelete = review.author === currentUserName && 
                          (Date.now() - review.timestamp < 24 * 60 * 60 * 1000);
        
        if (canDelete) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-delete-review';
            deleteBtn.textContent = '🗑️';
            deleteBtn.title = 'Удалить отзыв';
            deleteBtn.onclick = () => deleteReview(reviewId);
            header.appendChild(deleteBtn);
        }
        
        header.appendChild(authorInfo);
        
        // Текст отзыва
        const text = document.createElement('div');
        text.className = 'review-text';
        text.textContent = review.text;
        
        // Секция комментариев
        const commentsSection = document.createElement('div');
        commentsSection.className = 'comments-section';
        
        const commentsHeader = document.createElement('div');
        commentsHeader.className = 'comments-header';
        
        const commentsTitle = document.createElement('span');
        commentsTitle.textContent = '💬 Поддержка';
        
        const addCommentBtn = document.createElement('button');
        addCommentBtn.className = 'btn-add-comment';
        addCommentBtn.textContent = '+ Комментарий';
        addCommentBtn.onclick = () => openCommentModal(reviewId);
        
        commentsHeader.appendChild(commentsTitle);
        commentsHeader.appendChild(addCommentBtn);
        
        const commentsList = document.createElement('div');
        commentsList.className = 'comments-list';
        commentsList.id = 'comments-' + reviewId;
        commentsList.innerHTML = '<div class="loading-comments">Загрузка...</div>';
        
        commentsSection.appendChild(commentsHeader);
        commentsSection.appendChild(commentsList);
        
        // Собираем карточку
        card.appendChild(header);
        card.appendChild(text);
        card.appendChild(commentsSection);
        
        // Загружаем комментарии для этого отзыва
        loadComments(reviewId);
        
        return card;
    }
    
    // ============================================
    // КОММЕНТАРИИ
    // ============================================
    
    function loadComments(reviewId) {
        const commentsRef = db.ref('resistance/' + reviewId + '/comments');
        const container = document.getElementById('comments-' + reviewId);
        
        if (!container) return;
        
        commentsRef.on('value', (snapshot) => {
            const data = snapshot.val();
            
            if (!data || Object.keys(data).length === 0) {
                container.innerHTML = '<div class="no-comments">Нет комментариев</div>';
                return;
            }
            
            container.innerHTML = '';
            
            // Сортируем по времени (новые сверху)
            const comments = Object.entries(data).sort((a, b) => b[1].timestamp - a[1].timestamp);
            
            comments.forEach(([commentId, comment]) => {
                const commentEl = createCommentElement(reviewId, commentId, comment);
                container.appendChild(commentEl);
            });
        });
    }
    
    function createCommentElement(reviewId, commentId, comment) {
        const div = document.createElement('div');
        div.className = 'comment-item';
        
        const author = document.createElement('div');
        author.className = 'comment-author';
        
        const icon = document.createElement('span');
        icon.className = 'comment-icon';
        icon.textContent = '💚';
        
        const name = document.createElement('span');
        name.className = 'comment-name';
        name.textContent = comment.author;
        
        const date = document.createElement('span');
        date.className = 'comment-date';
        date.textContent = formatTime(comment.timestamp);
        
        author.appendChild(icon);
        author.appendChild(name);
        author.appendChild(date);
        
        // Кнопка удаления (только для автора и в течение 24 часов)
        const canDelete = comment.author === currentUserName && 
                          (Date.now() - comment.timestamp < 24 * 60 * 60 * 1000);
        
        if (canDelete) {
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn-delete-comment';
            deleteBtn.textContent = '🗑️';
            deleteBtn.title = 'Удалить комментарий';
            deleteBtn.onclick = () => deleteComment(reviewId, commentId);
            author.appendChild(deleteBtn);
        }
        
        const text = document.createElement('div');
        text.className = 'comment-text';
        text.textContent = comment.text;
        
        div.appendChild(author);
        div.appendChild(text);
        
        return div;
    }
    
    function addReview(text) {
        const newReviewRef = db.ref('resistance').push();
        newReviewRef.set({
            author: currentUserName,
            text: text,
            timestamp: Date.now(),
            comments: {}
        }).then(() => {
            console.log('✅ Отзыв добавлен');
            closeModal('reviewModal');
        }).catch(error => {
            console.error('❌ Ошибка добавления отзыва:', error);
            alert('Ошибка добавления отзыва: ' + error.message);
        });
    }
    
    function deleteReview(reviewId) {
        db.ref('resistance/' + reviewId).remove()
          .then(() => {
              console.log('✅ Отзыв удалён');
          })
          .catch(error => {
              console.error('❌ Ошибка удаления отзыва:', error);
          });
    }
    
    function addComment(reviewId, text) {
        const newCommentRef = db.ref('resistance/' + reviewId + '/comments').push();
        newCommentRef.set({
            author: currentUserName,
            text: text,
            timestamp: Date.now()
        }).then(() => {
            console.log('✅ Комментарий добавлен');
            closeModal('commentModal');
        }).catch(error => {
            console.error('❌ Ошибка добавления комментария:', error);
            alert('Ошибка добавления комментария: ' + error.message);
        });
    }
    
    function deleteComment(reviewId, commentId) {
        db.ref('resistance/' + reviewId + '/comments/' + commentId).remove()
          .then(() => {
              console.log('✅ Комментарий удалён');
          })
          .catch(error => {
              console.error('❌ Ошибка удаления комментария:', error);
          });
    }
    
    // ============================================
    // МОДАЛЬНОЕ ОКНО (ОТЗЫВ)
    // ============================================
    
    let currentReviewId = null;
    
    function setupReviewModal() {
        const modal = document.getElementById('reviewModal');
        const closeBtn = document.getElementById('modalClose');
        const cancelBtn = document.getElementById('cancelBtn');
        const submitBtn = document.getElementById('submitBtn');
        const addBtn = document.getElementById('addReviewBtn');
        const textarea = document.getElementById('reviewText');
        const charCount = document.getElementById('charCount');
        
        addBtn.onclick = () => {
            textarea.value = '';
            charCount.textContent = '0';
            modal.classList.add('modal-active');
            textarea.focus();
        };
        
        closeBtn.onclick = () => closeModal('reviewModal');
        cancelBtn.onclick = () => closeModal('reviewModal');
        
        submitBtn.onclick = () => {
            const text = textarea.value.trim();
            if (!text) {
                alert('Введите текст отзыва');
                return;
            }
            addReview(text);
        };
        
        textarea.oninput = () => {
            charCount.textContent = textarea.value.length;
        };
        
        // Ctrl+Enter для отправки
        textarea.onkeydown = (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                submitBtn.click();
            }
        };
    }
    
    // ============================================
    // МОДАЛЬНОЕ ОКНО (КОММЕНТАРИЙ)
    // ============================================
    
    function setupCommentModal() {
        const modal = document.getElementById('commentModal');
        const closeBtn = document.getElementById('commentModalClose');
        const cancelBtn = document.getElementById('commentCancelBtn');
        const submitBtn = document.getElementById('commentSubmitBtn');
        const textarea = document.getElementById('commentText');
        const charCount = document.getElementById('commentCharCount');
        const reviewInfo = document.getElementById('modalReviewInfo');
        
        closeBtn.onclick = () => closeModal('commentModal');
        cancelBtn.onclick = () => closeModal('commentModal');
        
        submitBtn.onclick = () => {
            const text = textarea.value.trim();
            if (!text) {
                alert('Введите текст комментария');
                return;
            }
            if (!currentReviewId) {
                alert('Ошибка: отзыв не выбран');
                return;
            }
            addComment(currentReviewId, text);
        };
        
        textarea.oninput = () => {
            charCount.textContent = textarea.value.length;
        };
        
        // Ctrl+Enter для отправки
        textarea.onkeydown = (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                submitBtn.click();
            }
        };
    }
    
    function openCommentModal(reviewId) {
        currentReviewId = reviewId;
        
        const modal = document.getElementById('commentModal');
        const textarea = document.getElementById('commentText');
        const charCount = document.getElementById('commentCharCount');
        
        textarea.value = '';
        charCount.textContent = '0';
        
        modal.classList.add('modal-active');
        textarea.focus();
    }
    
    // ============================================
    // УТИЛИТЫ
    // ============================================
    
    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        modal.classList.remove('modal-active');
    }
    
    function formatTime(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        if (diff < 60000) return 'только что';
        if (diff < 3600000) return Math.floor(diff / 60000) + ' мин. назад';
        if (diff < 86400000) return Math.floor(diff / 3600000) + ' ч. назад';
        return Math.floor(diff / 86400000) + ' дн. назад';
    }
    
    // Закрытие по клику вне модального окна
    window.onclick = (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.remove('modal-active');
        }
    };

} // Конец else
