// Telegram Web App SDK integratsiyasi
const tg = window.Telegram?.WebApp;

// Backend Render Server havolasi
const BACKEND_URL = 'https://cybernova-backend.onrender.com';

// Sahifa yuklanganda ishga tushuvchi logika
document.addEventListener("DOMContentLoaded", () => {
    // WebApp interfeysini kengaytirish
    if (tg) {
        tg.ready();
        tg.expand();
    }

    // Telegram foydalanuvchisi ma'lumotlarini avtomatik to'ldirish
    if (tg?.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        const nameInput = document.getElementById("userName");
        if (nameInput && !nameInput.value) {
            const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
            nameInput.value = fullName;
        }
    }
});

// Tablar o'rtasida o'tish
function openTab(tabId) {
    // Barcha tab mazmunlarini yashirish
    const contents = document.querySelectorAll('.tab-content');
    contents.forEach(content => content.classList.remove('active'));

    // Barcha tab tugmalaridan active sinfini olib tashlash
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));

    // Tanlangan tab va tugmani faollashtirish
    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.add('active');
    }

    // Bosilgan tugmaga active sinfini qo'shish
    const activeBtn = Array.from(buttons).find(btn => 
        btn.getAttribute('onclick')?.includes(tabId)
    );
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

// Xizmatlar ro'yxatidan tanlanganda to'g'ridan-to'g'ri Ariza oynasiga o'tkazish
function selectServiceForOrder(serviceName) {
    const serviceSelect = document.getElementById('serviceType');
    if (serviceSelect) {
        serviceSelect.value = serviceName;
    }
    
    // Ariza berish tabiga avtomatik o'tish
    openTab('orderTab');

    // Telegram haptic feedback (vibratsiya)
    if (tg?.HapticFeedback) {
        tg.HapticFeedback.impactOccurred('light');
    }
}

// Ariza formasini serverga yuborish
async function submitLeadForm(event) {
    event.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const name = document.getElementById('userName').value.trim();
    const phone = document.getElementById('userPhone').value.trim();
    const service = document.getElementById('serviceType').value;
    const message = document.getElementById('userMessage').value.trim();

    if (!name || !phone) {
        showToast("⚠️ Iltimos, ismingiz va telefon raqamingizni kiriting!");
        return;
    }

    // Tugma holatini o'zgartirish (Yuklanmoqda)
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Yuborilmoqda...`;

    try {
        const response = await fetch(`${BACKEND_URL}/api/submit-lead`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, phone, service, message })
        });

        const data = await response.json();

        if (data.success) {
            showToast("✅ Arizangiz muvaffaqiyatli yuborildi!");
            document.getElementById('userMessage').value = '';

            // Muvaffaqiyatli tebranish effekti
            if (tg?.HapticFeedback) {
                tg.HapticFeedback.notificationOccurred('success');
            }

            // 2 soniyadan so'ng Telegram WebApp'ni avtomatik yopish
            setTimeout(() => {
                if (tg) tg.close();
            }, 2000);
        } else {
            showToast("❌ Xatolik: " + (data.error || "Arizani yuborib bo'lmadi."));
        }
    } catch (error) {
        console.error('Fetch API xatosi:', error);
        showToast("🌐 Server bilan aloqa o'rnatilmadi!");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<i class="fa-solid fa-paper-plane"></i> Yuborish`;
    }
}

// Toast bildirishnomasini ko'rsatish
function showToast(text) {
    const toast = document.getElementById('toastNotification');
    if (!toast) return;

    toast.textContent = text;
    toast.className = 'toast-visible';

    setTimeout(() => {
        toast.className = 'toast-hidden';
    }, 3500);
}