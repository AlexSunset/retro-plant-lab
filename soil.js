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
const db = firebase.database();

// ============================================
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ============================================
let currentAgreementId = null;
let scientistName = '';
let isConnected = false;

// Договорённости по умолчанию
const defaultAgreements = [
    {
        id: 'agreement_1',
        text: 'Перед тем как отдавать в работу смежным командам валидировать требования через ИИ / проговаривать в команде',
        status: 'pending',
        icon: '🤖'
    },
    {
        id: 'agreement_2',
        text: 'Начать работать над автоматизацией в q4',
        status: 'pending',
        icon: '⚙️'
    },
    {
        id: 'agreement_3',
        text: 'Проверить настройки бота',
        status: 'pending',
        icon: '🔧'
    }
];

// ============================================
// ПРОВЕРКА ИМЕНИ
// ============================================
scientistName = localStorage.getItem('scientistName');

// Проверка имени
if (!scientistName || scientistName === 'undefined' || scientistName === 'null') {
    console.error('❌ Нет имени учёного, возврат на титульную');
    window.location.href = 'index.html';
} else {
    // Весь код внутри else
    
    console.log('🧫 Отсек почвы загружен');
    console.log('👨‍🔬 Учёный в отсеке почвы:', scientistName);
    
    // ============================================
    // ИНИЦИАЛИЗАЦИЯ
    // ============================================
    document.addEventListener('DOMContentLoaded', () => {
        if (typeof firebase === 'undefined') {
            console.error('❌ Firebase не загружен');
            return;
        }
        
        connectToSoil();
        setupCommentModal();
    });
    
    // ============================================
    // ПОДКЛЮЧЕНИЕ К ОТСЕКУ
    // ============================================
    function connectToSoil() {
        updateConnectionStatus(false);
        
        // Инициализируем договорённости
        const soilRef = db.ref('soil');
        
        soilRef.once('value').then((snapshot) => {
            const data = snapshot.val();
            
            if (!data) {
                // Создаём договорённости по умолчанию
                const initData = {};
                defaultAgreements.forEach(agreement => {
                    initData[agreement.id] = {
                        text: agreement.text,
                        status: 'pending',
                        icon: agreement.icon,
                        comments: {}
                    };
                });
                
                soilRef.set(initData).then(() => {
                    console.log('✅ Договорённости созданы');
                    loadAgreements();
                });
            } else {
                // Проверяем, есть ли все договорённости
                const existingIds = Object.keys(data);
                const missingAgreements = defaultAgreements.filter(a => !existingIds.includes(a.id));
                
                if (missingAgreements.length > 0) {
                    const updates = {};
                    missingAgreements.forEach(agreement => {
                        updates[agreement.id] = {
                            text: agreement.text,
                            status: 'pending',
                            icon: agreement.icon,
                            comments: {}
                        };
                    });
                    soilRef.update(updates);
                }
                
                loadAgreements();
            }
            
            isConnected = true;
            updateConnectionStatus(true);
        }).catch((error) => {
            console.error('❌ Ошибка подключения:', error);
            updateConnectionStatus(false);
        });
        
        // Слушаем изменения
        soilRef.on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                renderAgreements(data);
            }
        });
    }
    
    // ============================================
    // ОТРИСОВКА ДОГОВОРЁННОСТЕЙ
    // ============================================
    function loadAgreements() {
        db.ref('soil').once('value').then((snapshot) => {
            const data = snapshot.val();
            if (data) {
                renderAgreements(data);
            }
        });
    }
    
    function renderAgreements(data) {
        const grid = document.getElementById('soilGrid');
        
        if (!grid) return;
        
        const agreements = defaultAgreements.map(defaultAgreement => {
            const agreementData = data[defaultAgreement.id] || {
                text: defaultAgreement.text,
                status: 'pending',
                icon: defaultAgreement.icon,
                comments: {}
            };
            
            return {
                id: defaultAgreement.id,
                text: agreementData.text,
                status: agreementData.status || 'pending',
                icon: agreementData.icon || '📌',
                comments: agreementData.comments || {}
            };
        });
        
        grid.innerHTML = agreements.map(agreement => {
            const commentsArray = Object.entries(agreement.comments || {}).map(([id, comment]) => ({
                id,
                ...comment
            })).sort((a, b) => b.timestamp - a.timestamp);
            
            const canDelete = (comment) => {
                if (comment.author !== scientistName) return false;
                const now = Date.now();
                const age = now - comment.timestamp;
                return age < 24 * 60 * 60 * 1000; // 24 часа
            };
            
            return `
                <div class="agreement-card ${agreement.status === 'completed' ? 'completed' : ''}" data-id="${agreement.id}">
                    <div class="agreement-header">
                        <div class="agreement-icon">${agreement.icon}</div>
                        <div class="agreement-title">
                            <h3>Договорённость</h3>
                            <p>${agreement.text}</p>
                        </div>
                        <div class="agreement-actions">
                            <button class="btn-status" onclick="toggleStatus('${agreement.id}')">
                                ${agreement.status === 'completed' ? '✅ Выполнено' : '⏳ В процессе'}
                            </button>
                        </div>
                    </div>
                    
                    <div class="comments-section">
                        <div class="comments-header">
                            <span>💬 Комментарии (${commentsArray.length})</span>
                            <button class="btn-add-comment" onclick="openCommentModal('${agreement.id}', '${escapeHtml(agreement.text)}')">
                                + Комментарий
                            </button>
                        </div>
                        
                        <div class="comments-list">
                            ${commentsArray.length === 0 ? 
                                '<p class="no-comments">Пока нет комментариев</p>' : 
                                commentsArray.map(comment => `
                                    <div class="comment" data-id="${comment.id}">
                                        <div class="comment-header">
                                            <span class="comment-author">${escapeHtml(comment.author)}</span>
                                            <span class="comment-time">${formatTime(comment.timestamp)}</span>
                                            ${canDelete(comment) ? `<button class="btn-delete-comment" onclick="deleteComment('${agreement.id}', '${comment.id}')">🗑️</button>` : ''}
                                        </div>
                                        <p class="comment-text">${escapeHtml(comment.text)}</p>
                                    </div>
                                `).join('')
                            }
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // ============================================
    // МОДАЛЬНОЕ ОКНО
    // ============================================
    function setupCommentModal() {
        const modal = document.getElementById('commentModal');
        const closeBtn = document.getElementById('modalClose');
        const cancelBtn = document.getElementById('cancelBtn');
        const submitBtn = document.getElementById('submitBtn');
        const textarea = document.getElementById('commentText');
        const charCount = document.getElementById('charCount');
        
        if (!modal || !closeBtn || !cancelBtn || !submitBtn || !textarea || !charCount) {
            console.error('❌ Элементы модального окна не найдены');
            return;
        }
        
        closeBtn.onclick = () => closeModal();
        cancelBtn.onclick = () => closeModal();
        
        submitBtn.onclick = () => {
            const text = textarea.value.trim();
            if (!text) {
                alert('Введите текст комментария');
                return;
            }
            if (!currentAgreementId) {
                alert('Ошибка: договорённость не выбрана');
                return;
            }
            addComment(currentAgreementId, text);
        };
        
        textarea.oninput = () => {
            charCount.textContent = textarea.value.length;
        };
        
        textarea.onkeydown = (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                submitBtn.click();
            }
        };
        
        // Закрытие по клику вне модального окна
        modal.onclick = (e) => {
            if (e.target === modal) {
                closeModal();
            }
        };
    }
    
    function openCommentModal(agreementId, agreementText) {
        console.log('📝 Открытие модального окна:', agreementId, agreementText);
        currentAgreementId = agreementId;
        
        const modal = document.getElementById('commentModal');
        const agreementInfo = document.getElementById('modalAgreementInfo');
        const textarea = document.getElementById('commentText');
        const charCount = document.getElementById('charCount');
        
        console.log('🔍 modal:', modal);
        console.log('🔍 agreementInfo:', agreementInfo);
        console.log('🔍 textarea:', textarea);
        console.log('🔍 charCount:', charCount);
        
        if (!modal || !agreementInfo || !textarea || !charCount) {
            console.error('❌ Элементы модального окна не найдены');
            return;
        }
        
        agreementInfo.textContent = agreementText;
        textarea.value = '';
        charCount.textContent = '0';
        
        console.log('🔓 Добавляю класс modal-active, было классов:', modal.classList.toString());
        modal.classList.add('modal-active');
        console.log('✅ После добавления классов:', modal.classList.toString());
        console.log('✅ modal.style.display:', modal.style.display);
        console.log('✅ modal.offsetHeight:', modal.offsetHeight);
        
        textarea.focus();
    }
    
    function closeModal() {
        const modal = document.getElementById('commentModal');
        if (modal) {
            modal.classList.remove('modal-active');
        }
        currentAgreementId = null;
    }
    
    // ============================================
    // ДОБАВЛЕНИЕ КОММЕНТАРИЯ
    // ============================================
    function addComment(agreementId, text) {
        const commentId = 'comment_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Добавляем только комментарий (без завершения стадии)
        db.ref(`soil/${agreementId}/comments/${commentId}`).set({
            author: scientistName,
            text: text,
            timestamp: Date.now()
        }).then(() => {
            console.log('✅ Комментарий добавлен');
            closeModal();
        }).catch((error) => {
            console.error('❌ Ошибка добавления комментария:', error);
            alert('Ошибка: ' + error.message);
        });
    }
    
    // ============================================
    // УДАЛЕНИЕ КОММЕНТАРИЯ
    // ============================================
    function deleteComment(agreementId, commentId) {
        if (!confirm('Удалить этот комментарий?')) return;
        
        db.ref(`soil/${agreementId}/comments/${commentId}`).remove().then(() => {
            console.log('✅ Комментарий удалён');
        }).catch((error) => {
            console.error('❌ Ошибка удаления:', error);
            alert('Ошибка: ' + error.message);
        });
    }
    
    // ============================================
    // ИЗМЕНЕНИЕ СТАТУСА
    // ============================================
    function toggleStatus(agreementId) {
        db.ref(`soil/${agreementId}`).once('value').then((snapshot) => {
            const data = snapshot.val();
            const newStatus = data.status === 'completed' ? 'pending' : 'completed';
            
            db.ref(`soil/${agreementId}`).update({
                status: newStatus
            }).then(() => {
                console.log('✅ Статус обновлён');
            }).catch((error) => {
                console.error('❌ Ошибка обновления статуса:', error);
            });
        });
    }
    
    // ============================================
    // ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
    // ============================================
    function updateConnectionStatus(connected) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.getElementById('statusText');
        
        if (!statusDot || !statusText) return;
        
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
    
    function formatTime(timestamp) {
        if (!timestamp) return '';
        
        const now = Date.now();
        const diff = now - timestamp;
        
        if (diff < 60000) return 'только что';
        if (diff < 3600000) return Math.round(diff / 60000) + ' мин. назад';
        if (diff < 86400000) return Math.round(diff / 3600000) + ' ч. назад';
        return new Date(timestamp).toLocaleDateString('ru-RU');
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Делаем функции глобальными
    window.openCommentModal = openCommentModal;
    window.deleteComment = deleteComment;
    window.toggleStatus = toggleStatus;

} // Конец else
