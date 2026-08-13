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
const scientistName = localStorage.getItem('scientistName');

// Глобальные переменные
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
// Добавление протокола
// ============================================

function addProtocol() {
    const protocolText = document.getElementById('protocolText');
    const text = protocolText.value.trim();
    
    if (!text) {
        alert('Введите текст протокола');
        return;
    }

    // Добавляем только протокол (без завершения стадии)
    database.ref('growth').push({
        text: text,
        author: scientistName,
        timestamp: Date.now(),
        comments: {}
    }).then(() => {
        console.log('✅ Протокол добавлен');
        protocolText.value = '';
        closeModal('protocolModal');
    }).catch(err => {
        console.error('❌ Ошибка добавления протокола:', err);
        alert('Ошибка при добавлении протокола');
    });
}

// ============================================
// Добавление комментария
// ============================================

function openCommentModal(protocolId, protocolText) {
    currentProtocolId = protocolId;
    document.getElementById('modalProtocolInfo').textContent = `Протокол: ${protocolText.substring(0, 50)}...`;
    document.getElementById('commentModal').classList.add('modal-active');
    document.getElementById('commentText').focus();
}

function addComment() {
    if (!currentProtocolId) return;

    const text = document.getElementById('commentText').value.trim();
    if (!text) {
        alert('Введите текст комментария');
        return;
    }

    database.ref(`growth/${currentProtocolId}/comments`).push({
        author: scientistName,
        text: text,
        timestamp: Date.now()
    }).then(() => {
        console.log('✅ Комментарий добавлен');
        closeModal('commentModal');
        document.getElementById('commentText').value = '';
    }).catch(err => {
        console.error('❌ Ошибка добавления комментария:', err);
        alert('Ошибка при добавлении комментария');
    });
}

// ============================================
// Удаление протокола
// ============================================

function deleteProtocol(protocolId, timestamp) {
    if (!canDelete(timestamp)) {
        alert('Можно удалить только в течение 24 часов');
        return;
    }

    if (!confirm('Удалить этот протокол?')) return;

    database.ref(`growth/${protocolId}`).remove().then(() => {
        console.log('✅ Протокол удалён');
    }).catch(err => {
        console.error('❌ Ошибка удаления протокола:', err);
        alert('Ошибка при удалении протокола');
    });
}

// ============================================
// Удаление комментария
// ============================================

function deleteComment(protocolId, commentId, timestamp) {
    if (!canDelete(timestamp)) {
        alert('Можно удалить только в течение 24 часов');
        return;
    }

    if (!confirm('Удалить этот комментарий?')) return;

    database.ref(`growth/${protocolId}/comments/${commentId}`).remove().then(() => {
        console.log('✅ Комментарий удалён');
    }).catch(err => {
        console.error('❌ Ошибка удаления комментария:', err);
        alert('Ошибка при удалении комментария');
    });
}

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

function loadProtocols() {
    const growthGrid = document.getElementById('growthGrid');

    database.ref('growth').on('value', (snapshot) => {
        const data = snapshot.val();
        console.log('📊 Получены протоколы:', data);

        if (!data) {
            growthGrid.innerHTML = '<div class="no-items">Пока нет протоколов роста. Будьте первым! 🚀</div>';
            return;
        }

        // Сортируем: новые сверху
        const sorted = Object.entries(data).sort((a, b) => b[1].timestamp - a[1].timestamp);

        growthGrid.innerHTML = sorted.map(([id, protocol]) => renderProtocol(id, protocol)).join('');
    });
}

function connectToGrowth() {
    database.ref('.info/connected').on('value', (snapshot) => {
        const connected = snapshot.val() === true;
        if (connected) {
            console.log('✅ Подключение к Firebase установлено');
            loadProtocols();
        }
    });
}

// ============================================
// Инициализация при загрузке DOM
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('📈 Модуляция Роста загружена');
    console.log('👨‍🔬 Учёный в модуляции:', scientistName);
    
    // Проверка имени
    if (!scientistName || scientistName === 'undefined' || scientistName === 'null') {
        console.error('❌ Нет имени учёного, возврат на титульную');
        window.location.href = 'index.html';
        return;
    }

    // Модальное окно протокола
    document.getElementById('addProtocolBtn').addEventListener('click', () => {
        document.getElementById('protocolModal').classList.add('modal-active');
        document.getElementById('protocolText').focus();
    });

    // Закрытие модального окна протокола
    document.getElementById('closeProtocolModal').addEventListener('click', () => {
        closeModal('protocolModal');
    });
    document.getElementById('cancelProtocolBtn').addEventListener('click', () => {
        closeModal('protocolModal');
    });

    // Отправка протокола
    document.getElementById('submitProtocolBtn').addEventListener('click', addProtocol);

    // Счётчик символов протокола
    document.getElementById('protocolText').addEventListener('input', () => {
        updateCharCount('protocolText', 'protocolCharCount');
    });

    // Ctrl+Enter для отправки протокола
    document.getElementById('protocolText').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            addProtocol();
        }
    });

    // Модальное окно комментария
    document.getElementById('closeCommentModal')?.addEventListener('click', () => {
        closeModal('commentModal');
    });
    document.getElementById('cancelCommentBtn')?.addEventListener('click', () => {
        closeModal('commentModal');
    });

    // Отправка комментария
    document.getElementById('submitCommentBtn')?.addEventListener('click', addComment);

    // Счётчик символов комментария
    document.getElementById('commentText')?.addEventListener('input', () => {
        updateCharCount('commentText', 'commentCharCount');
    });

    // Ctrl+Enter для отправки комментария
    document.getElementById('commentText')?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            addComment();
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
    connectToGrowth();
});

// Делаем функции глобальными
window.openCommentModal = openCommentModal;
window.deleteProtocol = deleteProtocol;
window.deleteComment = deleteComment;
