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
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ
// ============================================
let scientistName = '';
let sessionId = '';
let selectedAvatar = null;

// Список аватарок
const avatars = [
    { emoji: '🧑‍🔬', name: 'Учёный' },
    { emoji: '👨‍🔬', name: 'Учёный М' },
    { emoji: '👩‍🔬', name: 'Учёный Ж' },
    { emoji: '🧙‍♂️', name: 'Алхимик' },
    { emoji: '🧙‍♀️', name: 'Алхимик Ж' },
    { emoji: '🦸‍♂️', name: 'Герой' },
    { emoji: '🦸‍♀️', name: 'Героиня' },
    { emoji: '🤖', name: 'Робот' },
    { emoji: '👽', name: 'Пришелец' },
    { emoji: '🦖', name: 'Динозавр' },
    { emoji: '🦄', name: 'Единорог' },
    { emoji: '🐱‍🚀', name: 'Котокосмонавт' },
    { emoji: '🧟‍♂️', name: 'Зомби' },
    { emoji: '🧞‍♂️', name: 'Джинн' },
    { emoji: '👻', name: 'Призрак' },
    { emoji: '🦹‍♂️', name: 'Злодей' },
    { emoji: '🦹‍♀️', name: 'Злодейка' },
    { emoji: '🕵️‍♂️', name: 'Детектив' },
    { emoji: '🕵️‍♀️', name: 'Детектив Ж' },
    { emoji: '🧑‍💼', name: 'Менеджер' }
];

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    console.log('👔 Зона Экипировки загружена');
    
    // Получаем имя учёного из localStorage
    scientistName = localStorage.getItem('scientistName');
    sessionId = localStorage.getItem('scientistSessionId');
    
    if (!scientistName) {
        console.warn('⚠️ Имя не найдено, возврат на титульную');
        window.location.href = 'index.html';
        return;
    }
    
    // Если sessionId нет — генерируем новый
    if (!sessionId) {
        sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('scientistSessionId', sessionId);
    }
    
    console.log('👨‍🔬 Учёный в зоне экипировки:', scientistName);
    console.log('🆕 SessionId:', sessionId);
    
    // Рендеринг аватарок
    renderAvatars();
    
    // Подписка на текущую экипировку
    subscribeToEquip();
    
    // Кнопка "Надеть экипировку"
    document.getElementById('equipBtn').addEventListener('click', equipAvatar);
});

// ============================================
// РЕНДЕРИНГ АВАТАРОК
// ============================================
function renderAvatars() {
    const avatarGrid = document.getElementById('avatarGrid');
    
    avatars.forEach(avatar => {
        const avatarEl = document.createElement('div');
        avatarEl.className = 'avatar-card';
        avatarEl.innerHTML = `
            <span class="avatar-emoji">${avatar.emoji}</span>
            <span class="avatar-name">${avatar.name}</span>
        `;
        avatarEl.addEventListener('click', () => {
            selectAvatar(avatar, avatarEl);
        });
        avatarGrid.appendChild(avatarEl);
    });
}

// ============================================
// ВЫБОР АВАТАРКИ
// ============================================
function selectAvatar(avatar, element) {
    // Снять выделение со всех
    document.querySelectorAll('.avatar-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Выделить текущую
    element.classList.add('selected');
    selectedAvatar = avatar;
    
    // Активировать кнопку
    document.getElementById('equipBtn').disabled = false;
    
    console.log('🎨 Выбрана аватарка:', avatar);
}

// ============================================
// ПОДПИСКА НА ЭКИПИРОВКУ
// ============================================
function subscribeToEquip() {
    const equipRef = database.ref(`equip/${sessionId}`);
    
    equipRef.on('value', (snapshot) => {
        const data = snapshot.val();
        if (data && data.avatar) {
            document.getElementById('currentEquip').style.display = 'block';
            document.getElementById('currentAvatarDisplay').textContent = data.avatar.emoji;
            document.getElementById('currentAvatarName').textContent = data.avatar.name;
            console.log('✅ Текущая экипировка:', data.avatar);
        }
    });
}

// ============================================
// НАДЕТЬ ЭКИПИРОВКУ
// ============================================
function equipAvatar() {
    if (!selectedAvatar) {
        alert('Выберите аватарку!');
        return;
    }
    
    const equipRef = database.ref(`equip/${sessionId}`);
    
    equipRef.set({
        name: scientistName,
        avatar: selectedAvatar,
        equippedAt: Date.now()
    }).then(() => {
        console.log('✅ Экипировка надета:', selectedAvatar);
        
        // Показать текущую экипировку
        document.getElementById('currentEquip').style.display = 'block';
        document.getElementById('currentAvatarDisplay').textContent = selectedAvatar.emoji;
        document.getElementById('currentAvatarName').textContent = selectedAvatar.name;
        
        alert(`Экипировка надета: ${selectedAvatar.emoji} ${selectedAvatar.name}`);
    }).catch((error) => {
        console.error('❌ Ошибка сохранения экипировки:', error);
        alert('Ошибка сохранения экипировки');
    });
}
