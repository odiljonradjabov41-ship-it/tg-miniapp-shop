lucide.createIcons();

const tg = window.Telegram?.WebApp;
if (tg) {
    tg.expand();
    tg.ready();
}

const BACKEND_URL = 'https://cybernova-backend.onrender.com';

document.addEventListener("DOMContentLoaded", () => {
    if (tg?.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        const nameInput = document.getElementById("name");
        if (nameInput && !nameInput.value) {
            nameInput.value = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        }
    }
});

function selectService(cardElement, serviceName) {
    document.querySelectorAll('.service-card').forEach(card => card.classList.remove('active'));
    cardElement.classList.add('active');
    
    const selectedInput = document.getElementById('selectedService');
    if (selectedInput) {
        selectedInput.value = serviceName;
    }
}

async function handleFormSubmit(event) {
    event.preventDefault();

    const submitBtn = document.getElementById('submitBtn');
    const btnText = document.getElementById('btnText');
    
    const nameEl = document.getElementById('name');
    const phoneEl = document.getElementById('phone');
    const serviceEl = document.getElementById('selectedService');
    const messageEl = document.getElementById('message');

    const name = nameEl ? nameEl.value.trim() : '';
    const phone = phoneEl ? phoneEl.value.trim() : '';
    const service = serviceEl ? serviceEl.value : 'Umumiy';
    const message = messageEl ? messageEl.value.trim() : '';

    if (!name || !phone) {
        showToast("⚠️ Ism va telefon raqamingizni kiriting!");
        return;
    }

    if (submitBtn) submitBtn.disabled = true;
    if (btnText) btnText.textContent = "Yuborilmoqda...";

    try {
        const response = await fetch(`${BACKEND_URL}/api/submit-lead`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ name, phone, service, message })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            showToast("✅ Arizangiz muvaffaqiyatli yuborildi!");
            if (messageEl) messageEl.value = '';
            
            if (tg?.HapticFeedback) {
                tg.HapticFeedback.notificationOccurred('success');
            }
            
            setTimeout(() => {
                if (tg) tg.close();
            }, 1800);
        } else {
            showToast("❌ Xatolik: " + (data.error || "Qayta urinib ko'ring"));
        }
    } catch (error) {
        console.error('Fetch xatosi:', error);
        showToast("🌐 Server bilan aloqa yo'q! Bir ozdan so'ng qayta urinib ko'ring.");
    } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (btnText) btnText.textContent = "Arizani Yuborish";
    }
}

function showToast(text) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = text;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    } else {
        alert(text);
    }
}