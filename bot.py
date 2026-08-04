import os
import json
import sqlite3
import logging
import asyncio
from dotenv import load_dotenv

from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import (
    InlineKeyboardMarkup, 
    InlineKeyboardButton, 
    WebAppInfo, 
    LabeledPrice, 
    CallbackQuery
)

# 1. ATROF-MUHIT O'ZGARUVCHILARINI YUKLASH
load_dotenv()

API_TOKEN = os.getenv("BOT_TOKEN")
PAYME_PROVIDER_TOKEN = os.getenv("PAYME_TOKEN")
ADMIN_ID = int(os.getenv("ADMIN_ID", "0"))
WEB_APP_URL = os.getenv("WEB_APP_URL")

bot = Bot(token=API_TOKEN)
dp = Dispatcher()
logging.basicConfig(level=logging.INFO)

# --- FSM STATES (Ommaviy xabar uchun) ---
class AdminStates(StatesGroup):
    waiting_for_broadcast = State()

# 2. MA'LUMOTLAR BAZASI (SQLite)
def init_db():
    conn = sqlite3.connect("cybernova.db")
    cursor = conn.cursor()
    # Foydalanuvchilar jadvali
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY,
            full_name TEXT,
            username TEXT,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # Buyurtmalar jadvali
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            project_type TEXT,
            addons TEXT,
            price_usd INTEGER,
            price_uzs INTEGER,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

init_db()

def db_add_user(user_id: int, full_name: str, username: str):
    conn = sqlite3.connect("cybernova.db")
    cursor = conn.cursor()
    cursor.execute("INSERT OR IGNORE INTO users (user_id, full_name, username) VALUES (?, ?, ?)",
                   (user_id, full_name, username))
    conn.commit()
    conn.close()

def db_get_users_count():
    conn = sqlite3.connect("cybernova.db")
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) FROM users")
    count = cursor.fetchone()[0]
    conn.close()
    return count

def db_get_all_user_ids():
    conn = sqlite3.connect("cybernova.db")
    cursor = conn.cursor()
    cursor.execute("SELECT user_id FROM users")
    users = cursor.fetchall()
    conn.close()
    return [u[0] for u in users]

def db_add_order(user_id: int, project_type: str, addons: str, price_usd: int, price_uzs: int):
    conn = sqlite3.connect("cybernova.db")
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO orders (user_id, project_type, addons, price_usd, price_uzs) 
        VALUES (?, ?, ?, ?, ?)
    """, (user_id, project_type, addons, price_usd, price_uzs))
    order_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return order_id

# --- MENYULAR ---
def get_main_keyboard():
    return InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🛒 CyberNova Store (Mini App)", web_app=WebAppInfo(url=WEB_APP_URL))],
        [
            InlineKeyboardButton(text="📊 Natijalarimiz", callback_data="btn_stats"),
            InlineKeyboardButton(text="⭐ Mijozlar Fikri", callback_data="btn_reviews")
        ],
        [
            InlineKeyboardButton(text="❓ Ko'p Beriladigan Savollar", callback_data="btn_faq"),
            InlineKeyboardButton(text="💬 Adminga Yozish", url="https://t.me/O_Obidovich")
        ]
    ])

# 3. HANDLERLAR

@dp.message(Command("start"))
async def cmd_start(message: types.Message):
    db_add_user(
        user_id=message.from_user.id,
        full_name=message.from_user.full_name,
        username=message.from_user.username or ""
    )
    await message.answer(
        f"Xush kelibsiz, {message.from_user.first_name}!\n\n"
        "⚡ **CyberNova IT Studio** rasmiy botiga xush kelibsiz.\n\n"
        "Quyidagi tugmalar orqali WebApp do'konimizga kirishingiz yoki xizmatlarimiz bilan tanishishingiz mumkin:",
        reply_markup=get_main_keyboard(),
        parse_mode="Markdown"
    )

# --- ADMIN PANEL ---
@dp.message(Command("admin"))
async def cmd_admin(message: types.Message):
    if message.from_user.id != ADMIN_ID:
        return
    
    users_count = db_get_users_count()
    admin_kb = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="📢 Ommaviy Xabar Yuborish", callback_data="admin_broadcast")]
    ])
    
    await message.answer(
        f"🛠 **Admin Panel**\n\n"
        f"👥 **Jami foydalanuvchilar:** {users_count} ta",
        reply_markup=admin_kb,
        parse_mode="Markdown"
    )

@dp.callback_query(F.data == "admin_broadcast")
async def start_broadcast(call: CallbackQuery, state: FSMContext):
    if call.from_user.id != ADMIN_ID:
        return
    await call.message.answer("📝 Barcha foydalanuvchilarga yubormoqchi bo'lgan xabaringizni yozing (matn, rasm yoki media):")
    await state.set_state(AdminStates.waiting_for_broadcast)
    await call.answer()

@dp.message(AdminStates.waiting_for_broadcast)
async def process_broadcast(message: types.Message, state: FSMContext):
    user_ids = db_get_all_user_ids()
    sent_count = 0
    failed_count = 0

    await message.answer("🔄 Xabar barcha foydalanuvchilarga yuborilmoqda...")

    for u_id in user_ids:
        try:
            await message.copy_to(chat_id=u_id)
            sent_count += 1
            await asyncio.sleep(0.05) # Rate limit oldini olish uchun
        except Exception:
            failed_count += 1

    await message.answer(
        f"✅ **Ommaviy xabar yuborildi!**\n\n"
        f"🟢 Muvaffaqiyatli: {sent_count}\n"
        f"🔴 Yetib bormadi: {failed_count}",
        parse_mode="Markdown"
    )
    await state.clear()

# --- CALLBACK TUGMALARI ---
@dp.callback_query(F.data == "btn_stats")
async def show_stats(call: CallbackQuery):
    stats_text = (
        "📈 **CyberNova IT Studio ko'rsatkichlari:**\n\n"
        "🚀 **50+** Muvaffaqiyatli topshirilgan loyihalar\n"
        "⭐ **99%** Mamnun mijozlar ulushi\n"
        "💻 **24/7** Texnik qo'llab-quvvatlash va monitoring\n"
        "⚡ **100%** Kafolatlangan va sifatli kod"
    )
    back_kb = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="⬅️ Orqaga", callback_data="btn_back")]])
    await call.message.edit_text(stats_text, reply_markup=back_kb, parse_mode="Markdown")
    await call.answer()

@dp.callback_query(F.data == "btn_reviews")
async def show_reviews(call: CallbackQuery):
    reviews_text = (
        "💬 **Mijozlarimiz biz haqimizda:**\n\n"
        "⭐️⭐️⭐️⭐️⭐️\n"
        "\"CyberNova jamoasi bizning e-commerce loyihamizni o'z vaqtida va yuqori sifatda topshirdi. Tavsiya qilaman!\"\n"
        "— **Jasur K.** (CEO, TechStore)\n\n"
        "⭐️⭐️⭐️⭐️⭐️\n"
        "\"Telegram Mini App va bot integratsiyasi judayam qulay ishlandi. Ishonchli hamkor!\"\n"
        "— **Malika A.** (Marketing Directori)"
    )
    back_kb = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="⬅️ Orqaga", callback_data="btn_back")]])
    await call.message.edit_text(reviews_text, reply_markup=back_kb, parse_mode="Markdown")
    await call.answer()

@dp.callback_query(F.data == "btn_faq")
async def show_faq(call: CallbackQuery):
    faq_text = (
        "❓ **Ko'p Beriladigan Savollar (FAQ):**\n\n"
        "📌 **Loyiha qancha vaqtda tayyor bo'ladi?**\n"
        "└ Oddiy landing sahifalar 3-5 kun, murakkab WebApp va botlar 10-20 kun davomida tayyorlanadi.\n\n"
        "📌 **To'lov qanday amalga oshiriladi?**\n"
        "└ Botimiz orqali Payme tizimidan yoki shartnoma bo'yicha to'lov qilishingiz mumkin.\n\n"
        "📌 **Kafolat beriladimi?**\n"
        "└ Ha, barcha loyihalarimizga texnik kafolat va bepul monitoring taqdim etiladi."
    )
    back_kb = InlineKeyboardMarkup(inline_keyboard=[[InlineKeyboardButton(text="⬅️ Orqaga", callback_data="btn_back")]])
    await call.message.edit_text(faq_text, reply_markup=back_kb, parse_mode="Markdown")
    await call.answer()

@dp.callback_query(F.data == "btn_back")
async def back_to_main(call: CallbackQuery):
    await call.message.edit_text(
        f"Xush kelibsiz, {call.from_user.first_name}!\n\n"
        "⚡ **CyberNova IT Studio** rasmiy botiga xush kelibsiz.\n\n"
        "Quyidagi menyudan kerakli bo'limni tanlang:",
        reply_markup=get_main_keyboard(),
        parse_mode="Markdown"
    )
    await call.answer()

# --- WEBAPP VA TO'LOV HANDLERLARI ---
@dp.message(F.web_app_data)
async def handle_web_app_data(message: types.Message):
    try:
        data = json.loads(message.web_app_data.data)
        
        user = message.from_user
        username_str = f"@{user.username}" if user.username else "Mavjud emas"
        
        project_type = data.get("projectType", "Noma'lum")
        addons = ", ".join(data.get("addons", [])) if data.get("addons") else "Yo'q"
        total_price_str = str(data.get("totalPrice", "0")).replace("$", "")
        time_text = data.get("estimatedTime", "Noma'lum")

        price_in_usd = int(total_price_str)
        usd_to_uzs_rate = 12800
        total_uzs = price_in_usd * usd_to_uzs_rate
        amount_in_tiyin = total_uzs * 100

        # Bazaga buyurtmani saqlash
        order_id = db_add_order(user.id, project_type, addons, price_in_usd, total_uzs)

        # Adminga xabar yuborish
        admin_alert = (
            f"🚀 **YANGI BUYURTMA #{order_id} (Mini App)!**\n\n"
            f"👤 **Mijoz:** {user.first_name} ({username_str})\n"
            f"🆔 **ID:** `{user.id}`\n\n"
            f"📌 **Loyiha:** {project_type}\n"
            f"🔌 **Qo'shimchalar:** {addons}\n"
            f"⏱ **Muddat:** {time_text}\n"
            f"💰 **Summa:** ${price_in_usd} (~{total_uzs:,} UZS)"
        )
        await bot.send_message(chat_id=ADMIN_ID, text=admin_alert, parse_mode="Markdown")

        # Payme Invoice yuborish
        prices = [LabeledPrice(label=f"Order #{order_id}: {project_type[:15]}", amount=amount_in_tiyin)]

        await bot.send_invoice(
            chat_id=message.chat.id,
            title=f"CyberNova Loyiha #{order_id}",
            description=f"{project_type} xizmati uchun to'lov",
            provider_token=PAYME_PROVIDER_TOKEN,
            currency="UZS",
            prices=prices,
            start_parameter=f"order-{order_id}",
            payload=f"order_{order_id}"
        )

    except Exception as e:
        logging.error(f"WebAppData xatosi: {e}")
        await message.answer("⚠️ Ma'lumotlarni qayta ishlashda xatolik yuz berdi.")

@dp.pre_checkout_query()
async def process_pre_checkout(pre_checkout_query: types.PreCheckoutQuery):
    await bot.answer_pre_checkout_query(pre_checkout_query.id, ok=True)

@dp.message(F.successful_payment)
async def process_successful_payment(message: types.Message):
    payment_info = message.successful_payment
    user = message.from_user
    username_str = f"@{user.username}" if user.username else "Mavjud emas"
    paid_sum = payment_info.total_amount // 100

    admin_pay_alert = (
        "✅ **TO'LOV MUVAFFAQIYATLI AMALGA OSHIRILDI!**\n\n"
        f"👤 **Mijoz:** {user.first_name} ({username_str})\n"
        f"💳 **To'langan summa:** {paid_sum:,} UZS\n"
        f"🧾 **Tranzaksiya ID:** `{payment_info.telegram_payment_charge_id}`"
    )
    await bot.send_message(chat_id=ADMIN_ID, text=admin_pay_alert, parse_mode="Markdown")

    await message.answer(
        f"✅ **To'lovingiz muvaffaqiyatli qabul qilindi!**\n\n"
        f"💳 To'langan summa: {paid_sum:,} UZS\n"
        f"Tez orada mutaxassisimiz siz bilan bog'lanadi.",
        parse_mode="Markdown"
    )

async def main():
    await dp.start_polling(bot)

if __name__ == '__main__':
    asyncio.run(main())