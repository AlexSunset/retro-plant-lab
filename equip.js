// ============================================
// КОНФИГУРАЦИЯ FIREBASE
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyA7Zpsng2b6I02RZr7VtwXzzN-gR_kNmk",
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

// Список аватарок (картинки из папки avatars/)
const avatars = [
    { image: 'avatars/avatar1.png', name: 'Учёный 1' },
    { image: 'avatars/avatar2.png', name: 'Учёный 2' },
    { image: 'avatars/avatar3.png', name: 'Учёный 3' },
    { image: 'avatars/avatar4.png', name: 'Учёный 4' },
    { image: 'avatars/avatar5.png', name: 'Учёный 5' },
    { image: 'avatars/avatar6.png', name: 'Учёный 6' },
    { image: 'avatars/avatar7.png', name: 'Учёный 7' },
    { image: 'avatars/avatar8.png', name: 'Учёный 8' },
    { image: 'avatars/avatar9.png', name: 'Учёный 9' },
    { image: 'avatars/avatar10.png', name: 'Учёный 10' },
    { image: 'avatars/avatar11.png', name: 'Учёный 11' },
    { image: 'avatars/avatar12.png', name: 'Учёный 12' },
    { image: 'avatars/avatar13.png', name: 'Учёный 13' },
    { image: 'avatars/avatar14.png', name: 'Учёный 14' },
    { image: 'avatars/avatar15.png', name: 'Учёный 15' },
    { image: 'avatars/avatar16.png', name: 'Учёный 16' },
    { image: 'avatars/avatar17.png', name: 'Учёный 17' }
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
            <img src="${avatar.image}" alt="${avatar.name}" class="avatar-image">
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
            // Проверяем, есть ли image (новая аватарка) или emoji (старая)
            if (typeof data.avatar === 'string') {
                // Это путь к картинке
                document.getElementById('currentAvatarDisplay').innerHTML = `<img src="${data.avatar}" alt="avatar" class="avatar-image-small">`;
                document.getElementById('currentAvatarName').textContent = 'Выбрана аватарка';
            } else if (data.avatar.image) {
                // Это объект с image
                document.getElementById('currentAvatarDisplay').innerHTML = `<img src="${data.avatar.image}" alt="${data.avatar.name}" class="avatar-image-small">`;
                document.getElementById('currentAvatarName').textContent = data.avatar.name;
            } else {
                // Это старый формат с emoji
                document.getElementById('currentAvatarDisplay').textContent = data.avatar.emoji;
                document.getElementById('currentAvatarName').textContent = data.avatar.name;
            }
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
    
    // Сохраняем экипировку (только путь к картинке)
    equipRef.set({
        name: scientistName,
        avatar: selectedAvatar.image,
        equippedAt: Date.now()
    }).then(() => {
        console.log('✅ Экипировка надета:', selectedAvatar.image);
        
        // Сохраняем аватарку в localStorage для использования на других страницах
        localStorage.setItem('scientistAvatar', selectedAvatar.image);
        console.log('💾 Аватарка сохранена в localStorage:', selectedAvatar.image);
        
        // Перенаправляем в лабораторию через небольшую задержку
        alert(`✅ Экипировка надета!\n\nПереход в лабораторию...`);
        
        setTimeout(() => {
            window.location.href = 'garden.html';
        }, 1000);
    }).catch((error) => {
        console.error('❌ Ошибка сохранения экипировки:', error);
        alert('Ошибка сохранения экипировки');
    });
}
