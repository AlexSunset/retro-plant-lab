// ============================================
// 📈 МОДУЛЯЦИЯ РОСТА - Протоколы улучшения
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
const scientistName = localStorage.getItem('scientistName') || 'Аноним';
document.getElementById('scientistName').textContent = `👨‍🔬 ${scientistName}`;

let currentProtocolId = null;

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
// Модальное окно протокола
// ============================================

const protocolModal = document.getElementById('protocolModal');
const protocolModalBtn = document.getElementById('protocolModalBtn');
const modalClose = document.getElementById('modalClose');
const cancelBtn = document.getElementById('cancelBtn');
const submitProtocolBtn = document.getElementById('submitProtocolBtn');
const protocolText = document.getElementById('protocolText');
const protocolCharCount = document.getElementById('protocolCharCount');

protocolModalBtn.addEventListener('click', () => {
    protocolModal.classList.add('modal-active');
    protocolText.focus();
});

modalClose.addEventListener('click', () => {
    protocolModal.classList.remove('modal-active');
});

cancelBtn.addEventListener('click', () => {
    protocolModal.classList.remove('modal-active');
});

protocolText.addEventListener('input', () => {
    protocolCharCount.textContent = protocolText.value.length;
});

// Ctrl+Enter для отправки
protocolText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        submitProtocolBtn.click();
    }
});

// ============================================
// Модальное окно комментария
// ============================================

const commentModal = document.getElementById('commentModal');
const commentModalClose = document.getElementById('commentModalClose');
const commentCancelBtn = document.getElementById('commentCancelBtn');
const submitCommentBtn = document.getElementById('submitCommentBtn');
const commentText = document.getElementById('commentText');
const commentCharCount = document.getElementById('commentCharCount');
const modalProtocolInfo = document.getElementById('modalProtocolInfo');

commentModalClose.addEventListener('click', () => {
    commentModal.classList.remove('modal-active');
});

commentCancelBtn.addEventListener('click', () => {
    commentModal.classList.remove('modal-active');
});

commentText.addEventListener('input', () => {
    commentCharCount.textContent = commentText.value.length;
});

// Ctrl+Enter для отправки комментария
commentText.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        submitCommentBtn.click();
    }
});

// ============================================
// Добавление протокола
// ============================================

submitProtocolBtn.addEventListener('click', async () => {
    const text = protocolText.value.trim();
    if (!text) {
        alert('Введите текст протокола');
        return;
    }

    try {
        const newRef = database.ref('growth').push();
        await newRef.set({
            text: text,
            author: scientistName,
            timestamp: Date.now(),
            comments: {}
        });
        console.log('✅ Протокол добавлен');
        protocolModal.classList.remove('modal-active');
        protocolText.value = '';
        protocolCharCount.textContent = '0';
    } catch (error) {
        console.error('❌ Ошибка добавления протокола:', error);
        alert('Ошибка при добавлении протокола');
    }
});

// ============================================
// Добавление комментария
// ============================================

window.openCommentModal = function(protocolId, protocolText) {
    currentProtocolId = protocolId;
    modalProtocolInfo.textContent = `Протокол: ${protocolText.substring(0, 50)}...`;
    commentModal.classList.add('modal-active');
    commentText.focus();
};

submitCommentBtn.addEventListener('click', async () => {
    if (!currentProtocolId) return;

    const text = commentText.value.trim();
    if (!text) {
        alert('Введите текст комментария');
        return;
    }

    try {
        const newRef = database.ref(`growth/${currentProtocolId}/comments`).push();
        await newRef.set({
            author: scientistName,
            text: text,
            timestamp: Date.now()
        });
        console.log('✅ Комментарий добавлен');
        commentModal.classList.remove('modal-active');
        commentText.value = '';
        commentCharCount.textContent = '0';
    } catch (error) {
        console.error('❌ Ошибка добавления комментария:', error);
        alert('Ошибка при добавлении комментария');
    }
});

// ============================================
// Удаление протокола
// ============================================

window.deleteProtocol = async function(protocolId, timestamp) {
    if (!canDelete(timestamp)) {
        alert('Можно удалить только в течение 24 часов');
        return;
    }

    if (!confirm('Удалить этот протокол?')) return;

    try {
        await database.ref(`growth/${protocolId}`).remove();
        console.log('✅ Протокол удалён');
    } catch (error) {
        console.error('❌ Ошибка удаления протокола:', error);
        alert('Ошибка при удалении протокола');
    }
};

// ============================================
// Удаление комментария
// ============================================

window.deleteComment = async function(protocolId, commentId, timestamp) {
    if (!canDelete(timestamp)) {
        alert('Можно удалить только в течение 24 часов');
        return;
    }

    if (!confirm('Удалить этот комментарий?')) return;

    try {
        await database.ref(`growth/${protocolId}/comments/${commentId}`).remove();
        console.log('✅ Комментарий удалён');
    } catch (error) {
        console.error('❌ Ошибка удаления комментария:', error);
        alert('Ошибка при удалении комментария');
    }
};

// ============================================
// Отрисовка протоколов
// ============================================

function renderProtocol(protocolId, data) {
    const canDeleteProtocol = canDelete(data.timestamp);
    const comments = data.comments || {};

    let commentsHTML = '';
    if (Object.keys(comments).length > 0) {
        commentsHTML = `
            <div class="strategies-list">
                ${Object.entries(comments).map(([commentId, comment]) => {
                    const canDeleteComment = (comment.author === scientistName) && canDelete(comment.timestamp);
                    return `
                        <div class="strategy-item">
                            <div class="strategy-header">
                                <span class="strategy-author">${comment.author}</span>
                                <span class="strategy-time">${formatTime(comment.timestamp)}</span>
                                ${canDeleteComment ? `<button class="btn-delete-strategy" onclick="deleteComment('${protocolId}', '${commentId}', ${comment.timestamp})">🗑️</button>` : ''}
                            </div>
                            <div class="strategy-text">${comment.text}</div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    } else {
        commentsHTML = '<div class="no-strategies">Пока нет комментариев</div>';
    }

    return `
        <div class="defect-card">
            <div class="defect-header">
                <div class="defect-main">
                    <div class="defect-icon">📈</div>
                    <div class="defect-info">
                        <div class="defect-author-row">
                            <span class="author-name">${data.author}</span>
                            <span class="genome-time">${formatTime(data.timestamp)}</span>
                        </div>
                        <div class="defect-text">${data.text}</div>
                    </div>
                </div>
                ${canDeleteProtocol ? `<button class="btn-delete-defect" onclick="deleteProtocol('${protocolId}', ${data.timestamp})">🗑️</button>` : ''}
            </div>
            
            <div class="strategies-section">
                <div class="strategies-header">
                    <span class="strategies-title">💬 Обсуждение</span>
                    <button class="btn-add-strategy" onclick="openCommentModal('${protocolId}', '${data.text.replace(/'/g, "\\'")}')">+ Комментарий</button>
                </div>
                ${commentsHTML}
            </div>
        </div>
    `;
}

// ============================================
// Загрузка и отображение протоколов
// ============================================

const protocolsGrid = document.getElementById('protocolsGrid');

// Слушаем изменения в Firebase
database.ref('growth').on('value', (snapshot) => {
    const data = snapshot.val();
    console.log('📊 Получены протоколы:', data);

    if (!data) {
        protocolsGrid.innerHTML = '<div class="no-items">Пока нет протоколов роста. Будьте первым! 🚀</div>';
        return;
    }

    // Сортируем: новые сверху
    const sorted = Object.entries(data).sort((a, b) => b[1].timestamp - a[1].timestamp);

    protocolsGrid.innerHTML = sorted.map(([id, protocol]) => renderProtocol(id, protocol)).join('');
});

console.log('📈 Модуляция Роста загружена');
console.log('👨‍🔬 Учёный в модуляции:', scientistName);
