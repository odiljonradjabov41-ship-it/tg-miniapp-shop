// Lucide ikonkalarni faollashtirish
lucide.createIcons();

// Telegram Web App ob'ekti
const tg = window.Telegram?.WebApp;
if (tg) {
    tg.expand(); // Ekran bo'ylab yoyish
}

// Render Backend Server havolangiz
const BACKEND_URL = 'https://cybernova-backend.onrender.com';

// Telegram foydalanuvchi ismini avtomatik to'ldirish
document.addEventListener("DOMContentLoaded", () => {
    if (tg?.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        const nameInput = document.getElementById("name");
        if (nameInput && !nameInput.value) {
            nameInput.value = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        }
    }
});

// Xizmatni tanlash
function selectService(cardElement, serviceName) {
    document.querySelectorAll('.service-card').forEach(card => card.classList.remove('active'));
    cardElement.classList.add('active');
    document.getElementById('selectedService').value = serviceName;
}

// Formani yuborish
async function handleFormSubmit(event) {
    event.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const service = document.getElementById('selectedService').value;
    const message = document.getElementById('message').value.trim();

    if (!name || !phone) {
        showToast("⚠️ Iltimos, ism va telefon raqamingizni kiriting!");
        return;
    }

    // Yuklanish holati
    submitBtn.disabled = true;
    btnText.textContent = "Yuborilmoqda...";

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
            document.getElementById('message').value = '';
            
            // Telegram vibratsiya va yopilish effekti
            if (tg?.HapticFeedback) {
                tg.HapticFeedback.notificationOccurred('success');
            }
            
            setTimeout(() => {
                if (tg) tg.close();
            }, 2000);
        } else {
            showToast("❌ Xatolik yuz berdi. Qayta urinib ko'ring.");
        }
    } catch (error) {
        console.error('Fetch xatosi:', error);
        showToast("🌐 Server bilan aloqa o'rnatilmadi!");
    } finally {
        submitBtn.disabled = false;
        btnText.textContent = "Arizani Yuborish";
    }
}

// Bildirishnoma ko'rsatish
function showToast(text) {
    const toast = document.getElementById('toast');
    toast.textContent = text;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}