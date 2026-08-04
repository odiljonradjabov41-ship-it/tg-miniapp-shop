document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 1. NEON CANVAS BACKGROUND ANIMATION
    // ==========================================
    const canvas = document.getElementById('neonCanvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];

        function resizeCanvas() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 1;
                this.speedX = Math.random() * 1 - 0.5;
                this.speedY = Math.random() * 1 - 0.5;
                this.color = getComputedStyle(document.documentElement).getPropertyValue('--primary-cyan').trim() || '#00f2fe';
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;

                if (this.x > canvas.width) this.x = 0;
                if (this.x < 0) this.x = canvas.width;
                if (this.y > canvas.height) this.y = 0;
                if (this.y < 0) this.y = canvas.height;
            }
            draw() {
                ctx.fillStyle = this.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        function initParticles() {
            particles = [];
            const count = Math.floor((canvas.width * canvas.height) / 15000);
            for (let i = 0; i < count; i++) {
                particles.push(new Particle());
            }
        }
        initParticles();

        function animateCanvas() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            requestAnimationFrame(animateCanvas);
        }
        animateCanvas();
    }

    // ==========================================
    // 2. THEME SWITCHER (DARK / LIGHT MODE)
    // ==========================================
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        if (themeToggleBtn) themeToggleBtn.innerText = '🌙';
    } else {
        if (themeToggleBtn) themeToggleBtn.innerText = '☀️';
    }

    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            document.body.classList.toggle('light-mode');
            const isLight = document.body.classList.contains('light-mode');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            themeToggleBtn.innerText = isLight ? '🌙' : '☀️';
        });
    }

    // ==========================================
    // 3. INTERACTIVE PRICE CALCULATOR
    // ==========================================
    const typeRadios = document.querySelectorAll('input[name="projectType"]');
    const addonCheckboxes = document.querySelectorAll('.calc-addon');
    const totalPriceEl = document.getElementById('totalPrice');
    const totalTimeEl = document.getElementById('totalTime');
    const sendOrderBtn = document.getElementById('sendOrderBtn');

    function calculatePrice() {
        let basePrice = 0;
        let selectedTypeLabel = '';

        typeRadios.forEach(radio => {
            if (radio.checked) {
                basePrice = parseInt(radio.value) || 0;
                selectedTypeLabel = radio.parentElement.innerText.trim();
            }
        });

        let addonPrice = 0;
        let selectedAddons = [];

        addonCheckboxes.forEach(addon => {
            if (addon.checked) {
                addonPrice += parseInt(addon.value) || 0;
                selectedAddons.push(addon.parentElement.innerText.trim());
            }
        });

        const total = basePrice + addonPrice;

        if (totalPriceEl) totalPriceEl.innerText = total;

        if (totalTimeEl) {
            if (total <= 150) totalTimeEl.innerText = "2-4 kun";
            else if (total <= 300) totalTimeEl.innerText = "3-6 kun";
            else if (total <= 500) totalTimeEl.innerText = "5-10 kun";
            else totalTimeEl.innerText = "10-15 kun";
        }

        return { total, selectedTypeLabel, selectedAddons };
    }

    typeRadios.forEach(r => r.addEventListener('change', calculatePrice));
    addonCheckboxes.forEach(c => c.addEventListener('change', calculatePrice));

    if (sendOrderBtn) {
        sendOrderBtn.addEventListener('click', () => {
            const { total, selectedTypeLabel, selectedAddons } = calculatePrice();
            const orderData = {
                type: selectedTypeLabel,
                addons: selectedAddons,
                price: total
            };

            if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
                window.Telegram.WebApp.sendData(JSON.stringify(orderData));
            } else {
                const message = encodeURIComponent(`Salom! Men yangi loyiha hisobladim:\n\n📌 Turi: ${selectedTypeLabel}\n➕ Qo'shimchalar: ${selectedAddons.join(', ') || 'Yo\'q'}\n💰 Jami: $${total}`);
                window.open(`https://t.me/O_Obidovich?text=${message}`, '_blank');
            }
        });
    }

    // ==========================================
    // 4. PORTFOLIO FILTER
    // ==========================================
    const filterBtns = document.querySelectorAll('.filter-btn');
    const portfolioCards = document.querySelectorAll('.portfolio-card');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');

            portfolioCards.forEach(card => {
                const category = card.getAttribute('data-category') || '';
                if (filter === 'all' || category.includes(filter)) {
                    card.classList.remove('hide');
                } else {
                    card.classList.add('hide');
                }
            });
        });
    });

    // ==========================================
    // 5. MULTILINGUAL (i18n) SWITCHER SYSTEM
    // ==========================================
    const translations = {
        uz: {
            nav_services: "Xizmatlar",
            nav_calc: "Kalkulyator",
            nav_portfolio: "Portfolio",
            nav_faq: "FAQ",
            p1_title: "CyberNova E-Commerce Store",
            p1_desc: "Telegram ichidagi to'liq WebApp internet-do'kon. Payme integratsiyasi hamda kuryer paneli bilan.",
            btn_details: "Batafsil",
            faq_title: "Ko'p Beriladigan Savollar",
            faq_q1: "Buyurtma berish jarayoni qanday kechadi?",
            faq_a1: "Siz kalkulyator orqali kerakli modullarni tanlaysiz. Buyurtma botga yuborilgach, texnik topshiriq tuziladi va to'lovdan so'ng loyiha ustida ish boshlanadi.",
            faq_q2: "Kafolat va qo'llab-quvvatlash bormi?",
            faq_a2: "Ha! Barcha loyihalarimizga 1 oylik bepul texnik yordam va xatoliklarni bartaraf etish kafolati beriladi.",
            faq_q3: "To'lov usullari qanday?",
            faq_a3: "To'lovlarni Payme, Click yoki xalqaro kartalar orqali shartnoma asosida amalga oshirishingiz mumkin.",
            chat_welcome: "Salom! Savolingiz bo'lsa, adminga yozishingiz mumkin:",
            btn_view_project: "Demoni Ko'rish"
        },
        ru: {
            nav_services: "Услуги",
            nav_calc: "Калькулятор",
            nav_portfolio: "Портфолио",
            nav_faq: "FAQ",
            p1_title: "CyberNova E-Commerce Store",
            p1_desc: "Полноценный интернет-магазин WebApp в Telegram с интеграцией Payme и панелью курьера.",
            btn_details: "Подробнее",
            faq_title: "Часто Задаваемые Вопросы",
            faq_q1: "Как проходит процесс заказа?",
            faq_a1: "Вы выбираете нужные модули в калькуляторе. После отправки заказа формируется ТЗ, и работы начинаются после оплаты.",
            faq_q2: "Есть ли гарантия и поддержка?",
            faq_a2: "Да! Мы предоставляем 1 месяц бесплатной технической поддержки и гарантию устранения ошибок.",
            faq_q3: "Какие способы оплаты?",
            faq_a3: "Вы можете оплатить через Payme, Click или международные карты на основе договора.",
            chat_welcome: "Здравствуйте! Если у вас есть вопросы, напишите админу:",
            btn_view_project: "Смотреть демо"
        },
        en: {
            nav_services: "Services",
            nav_calc: "Calculator",
            nav_portfolio: "Portfolio",
            nav_faq: "FAQ",
            p1_title: "CyberNova E-Commerce Store",
            p1_desc: "Full WebApp e-commerce store inside Telegram with Payme integration and courier panel.",
            btn_details: "Details",
            faq_title: "Frequently Asked Questions",
            faq_q1: "How does the ordering process work?",
            faq_a1: "You select the required modules in the calculator. Once submitted, a technical specification is prepared, and work begins after payment.",
            faq_q2: "Is there any warranty or support?",
            faq_a2: "Yes! We provide 1 month of free technical support and a bug-fix guarantee on all projects.",
            faq_q3: "What payment methods are available?",
            faq_a3: "Payments can be made via Payme, Click, or international cards based on an official contract.",
            chat_welcome: "Hello! If you have any questions, feel free to message our admin:",
            btn_view_project: "View Demo"
        }
    };

    const langBtns = document.querySelectorAll('.lang-btn');

    function changeLanguage(lang) {
        langBtns.forEach(b => b.classList.remove('active'));
        const activeBtn = document.querySelector(`.lang-btn[data-lang="${lang}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (translations[lang] && translations[lang][key]) {
                element.innerText = translations[lang][key];
            }
        });

        localStorage.setItem('lang', lang);
    }

    langBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedLang = btn.getAttribute('data-lang');
            changeLanguage(selectedLang);
        });
    });

    const savedLang = localStorage.getItem('lang') || 'uz';
    changeLanguage(savedLang);

    // ==========================================
    // 6. FAQ ACCORDION LOGIC
    // ==========================================
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        if (question) {
            question.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                faqItems.forEach(i => i.classList.remove('active'));

                if (!isActive) {
                    item.classList.add('active');
                }
            });
        }
    });

    // ==========================================
    // 7. LIVE CHAT WIDGET TOGGLE LOGIC
    // ==========================================
    const chatToggleBtn = document.getElementById('chatToggleBtn');
    const chatBox = document.getElementById('chatBox');
    const closeChatBtn = document.getElementById('closeChatBtn');

    if (chatToggleBtn && chatBox) {
        chatToggleBtn.addEventListener('click', () => {
            chatBox.classList.toggle('hide');
        });
    }

    if (closeChatBtn && chatBox) {
        closeChatBtn.addEventListener('click', () => {
            chatBox.classList.add('hide');
        });
    }

    // ==========================================
    // 8. DYNAMIC PORTFOLIO MODAL LOGIC
    // ==========================================
    const projectsData = {
        'project-1': {
            title: "CyberNova E-Commerce Store",
            tags: "Telegram Mini App / E-Commerce",
            desc: "Telegram WebApp platformasida to'liq ishlaydigan zamonaviy internet do'kon. Ushbu loyiha mijozlarga tovarlarni qidirish, savatchaga qo'shish, Payme va Click orqali onlayn to'lash hamda geolokatsiya orqali yetkazib berish manzilini yuborish imkonini beradi.",
            tech: "HTML5, CSS3, JavaScript, Python (aiogram 3), PostgreSQL, Payme API",
            duration: "5-7 kun",
            link: "https://t.me/CyberNovaPortfolioBot"
        },
        'project-2': {
            title: "Hotel & Booking Automation System",
            tags: "CRM Tizim / Avtomatlashtirish",
            desc: "Mehmonxona va xonalarni bron qilish jarayonini avtomatlashtiruvchi CRM tizim va bot. Mijozlar band xonalarni ko'rishi, sana tanlab bron qilishi hamda to'lov chekini avtomatik yuborishi mumkin.",
            tech: "Node.js, Express, React, Telegram Bot API, MongoDB",
            duration: "7-10 kun",
            link: "https://t.me/CyberNovaPortfolioBot"
        },
        'project-3': {
            title: "Food Delivery & Order Bot",
            tags: "E-Commerce / Delivery",
            desc: "Restoran va taom yetkazib berish xizmatlari uchun yaratilgan tezkor buyurtma boti. Interaktiv menyu, aksiyalar bo'limi hamda buyurtma holatini (Tayyorlanmoqda, Yo'lda, Yetkazildi) real vaqt rejimida kuzatish imkoniyati bor.",
            tech: "Python, FastAPI, Telegram WebApp SDK, Click API",
            duration: "4-6 kun",
            link: "https://t.me/CyberNovaPortfolioBot"
        }
    };

    const modal = document.getElementById('portfolioModal');
    const modalCloseBtn = document.querySelector('.modal-close');
    const openModalBtns = document.querySelectorAll('.open-modal-btn');

    const modalTitle = document.getElementById('modalTitle');
    const modalTags = document.getElementById('modalTags');
    const modalDescription = document.getElementById('modalDescription');
    const modalTech = document.getElementById('modalTech');
    const modalDuration = document.getElementById('modalDuration');
    const modalLink = document.getElementById('modalLink');

    openModalBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const projectId = btn.getAttribute('data-modal');
            const data = projectsData[projectId];

            if (data && modal) {
                if (modalTitle) modalTitle.innerText = data.title;
                if (modalTags) modalTags.innerText = data.tags;
                if (modalDescription) modalDescription.innerText = data.desc;
                if (modalTech) modalTech.innerText = data.tech;
                if (modalDuration) modalDuration.innerText = data.duration;
                if (modalLink) modalLink.href = data.link;

                modal.classList.remove('hide');
            }
        });
    });

    if (modalCloseBtn && modal) {
        modalCloseBtn.addEventListener('click', () => {
            modal.classList.add('hide');
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hide');
            }
        });
    }

    // Telegram WebApp interfeysini moslashtirish
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
    }
});