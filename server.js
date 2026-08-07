// 1. Modullarni yuklash
const TelegramBotModule = require('node-telegram-bot-api');
const TelegramBot = typeof TelegramBotModule === 'function' ? TelegramBotModule : (TelegramBotModule.default || TelegramBotModule);

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const https = require('https');

// SOZLAMALAR (Render va lokal muhit uchun)
const BOT_TOKEN = process.env.BOT_TOKEN || '8923412278:AAEKnRhIPHXVEYOg-b88DcHhsbTcRQXcESA'; 
const ADMIN_ID = process.env.ADMIN_ID || 8810905742; 

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const app = express();

app.use(express.json());
app.use(cors());

// 2. SQLite Bazani ulashtirish
const db = new sqlite3.Database('./cybernova.db', (err) => {
    if (err) {
        console.error("Database ulashda xatolik:", err.message);
    } else {
        console.log("Cybernova ma'lumotlar bazasiga muvaffaqiyatli ulandi.");
    }
});

// Murojaatlar va Foydalanuvchilar jadvali
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        user_id INTEGER PRIMARY KEY,
        first_name TEXT,
        username TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS inquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        contact TEXT,
        service TEXT,
        message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// 3. Telegram Bot `/start` komandasi
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const firstName = msg.from.first_name || 'Foydalanuvchi';
    const username = msg.from.username || '';

    db.run(
        `INSERT OR IGNORE INTO users (user_id, first_name, username) VALUES (?, ?, ?)`,
        [chatId, firstName, username]
    );

    bot.sendMessage(chatId, `Assalomu alaykum, ${firstName}! 👋\n\n**Cybernova** rasmiy botiga xush kelibsiz. Bizning kiberxavfsizlik va IT xizmatlarimiz bilan tanishish uchun tugmani bosing:`, {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: "🌐 Cybernova Saytini Ochish", web_app: { url: "https://odiljonradjabov41-ship-it.github.io/cybernova-webapp/" } }]
            ]
        }
    });
});

// 4. Veb-saytdan keladigan murojaatlarni qabul qilish (Ikkala route uchun ham moslashtirildi)
const handleLeadSubmission = (req, res) => {
    const name = req.body.name;
    const contact = req.body.phone || req.body.contact; // Har ikki maydonni ham qabul qiladi
    const service = req.body.service;
    const message = req.body.message;

    if (!name || !contact) {
        return res.status(400).json({ success: false, error: "Ism va aloqa ma'lumoti kiritilishi shart." });
    }

    db.run(
        `INSERT INTO inquiries (name, contact, service, message) VALUES (?, ?, ?, ?)`,
        [name, contact, service || 'Umumiy', message || ''],
        function (err) {
            if (err) {
                console.error("Murojaat saqlashda xatolik:", err);
                return res.status(500).json({ success: false, error: "Server xatoligi" });
            }

            const inquiryId = this.lastID;

            // Telegram orqali Adminga xabar yuborish
            if (ADMIN_ID) {
                const adminMsg = `🛡️ *CYBERNOVA — YANGI MUROJAAT! №${inquiryId}*\n\n👤 *Ism:* ${name}\n📞 *Aloqa:* \`${contact}\`\n🔧 *Xizmat:* ${service || 'Ko\'rsatilmadi'}\n💬 *Izoh:* ${message || 'Mavjud emas'}`;
                
                bot.sendMessage(ADMIN_ID, adminMsg, { parse_mode: 'Markdown' })
                    .catch(err => console.error("Telegram xabar yuborishda xato:", err.message));
            }

            res.json({ success: true, message: "Murojaatingiz muvaffaqiyatli yuborildi!" });
        }
    );
};

// Frontenddagi barcha endpoint so'rovlariga javob berish
app.post('/api/submit-lead', handleLeadSubmission);
app.post('/api/contact', handleLeadSubmission);

// Server holatini tekshirish (Healthcheck)
app.get('/', (req, res) => {
    res.send("Cybernova Server Active 24/7");
});

// Serverni ishga tushirish
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Cybernova Server ${PORT}-portda ishlamoqda...`);
});

// Render server uqlab qolmasligi uchun self-ping (Har 10 daqiqada bir)
setInterval(() => {
    https.get('https://cybernova-backend.onrender.com', (res) => {
        console.log('Self-ping muvaffaqiyatli bajarildi.');
    }).on('error', (err) => {
        console.log('Self-ping xatosi:', err.message);
    });
}, 10 * 60 * 1000);