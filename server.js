import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DATA_FILE = path.resolve(process.cwd(), 'orders.json');

// --- TELEGRAM BOT-ის განახლებული PARAMS ---
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8511295199:AAEoCThYsPfzuJ0BkQu36sldDWaHaAQS-BY';
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || '2055975985';

// ტელეგრამზე შეტყობინების გაგზავნა ღილაკებით (Inline Keyboard)
async function sendTelegramNotification(order) {
  if (!TELEGRAM_BOT_TOKEN || !ADMIN_CHAT_ID) {
    console.error(`Telegram notification skipped for ${order.id}: TELEGRAM_BOT_TOKEN and ADMIN_CHAT_ID must be configured.`);
    return false;
  }

  const escapeHtml = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const message = `
<b>📦 ახალი შეკვეთა! (${escapeHtml(order.id)})</b>

<b>👤 მომხმარებელი:</b> ${escapeHtml(order.name)}
<b>📞 ტელეფონი:</b> ${escapeHtml(order.phone)}
<b>🛠️ სერვისი:</b> ${escapeHtml(order.service)}
<b>💰 ფასი:</b> ${escapeHtml(order.price)}₾
<b>📍 მისამართი:</b> ${escapeHtml(order.address)}
<b>📅 თარიღი:</b> ${escapeHtml(order.date)}
<b>📝 დეტალები:</b> ${escapeHtml(order.description || 'არ არის')}
<b>📊 სტატუსი:</b> ⏳ მუშავდება
  `;

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: ADMIN_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ დადასტურება', callback_data: `status_confirm_${order.id}` },
              { text: '🚗 გზაშია', callback_data: `status_ontheway_${order.id}` }
            ],
            [
              { text: '❌ გაუქმება', callback_data: `status_cancel_${order.id}` }
            ]
          ]
        }
      })
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      console.error(`Telegram API error for ${order.id}: ${data.description || response.statusText}`);
      return false;
    } else {
      console.log(`შეტყობინება წარმატებით გაიგზავნა Telegram-ში (${order.id})`);
      return true;
    }
  } catch (err) {
    console.error(`Telegram notification error for ${order.id}:`, err.message);
    return false;
  }
}

app.use(cors({
  origin: ["https://davit-tech.vercel.app", "https://davit-tech-api.onrender.com", "http://localhost:3000", "http://localhost"]
}));
app.use(express.json());
app.use(express.static(process.cwd()));

const sendError = (res, status, message) => res.status(status).json({ success: false, message });

async function loadOrders() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf8');
    const orders = JSON.parse(data);
    return Array.isArray(orders) ? orders : [];
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    console.error('Failed to read orders file:', err);
    throw err;
  }
}

async function saveOrders(orders) {
  const text = JSON.stringify(orders, null, 2);
  await fs.writeFile(DATA_FILE, text, 'utf8');
}

function generateOrderId(existingIds) {
  let id;
  do {
    id = `DT-${Math.floor(10000 + Math.random() * 90000)}`;
  } while (existingIds && existingIds.has(id));
  return id;
}

app.get('/', (req, res) => {
  res.send('Server is running');
});

// დაკავებული საათების/დროის მიღება
app.get('/api/booked-slots', async (req, res) => {
  const { date } = req.query;
  if (!date) return sendError(res, 400, 'Date is required');

  try {
    const orders = await loadOrders();
    const bookedTimes = orders
      .filter(o => o.date && o.date.startsWith(date) && o.status !== '❌ გაუქმებულია')
      .map(o => o.date);

    res.json({ success: true, bookedTimes });
  } catch (err) {
    sendError(res, 500, 'Failed to fetch booked slots');
  }
});

app.get('/api/orders', async (req, res) => {
  try {
    const orders = await loadOrders();
    res.json({ success: true, data: orders });
  } catch (err) {
    console.error('GET /api/orders error:', err);
    sendError(res, 500, 'Failed to load orders');
  }
});

app.post('/api/orders', async (req, res) => {
  const { name, phone, service, price, address, description, date } = req.body || {};

  if (!name || !phone || !service || !price || !address || !date) {
    return sendError(res, 400, 'Missing required order fields');
  }

  try {
    const orders = await loadOrders();
    const ids = new Set(orders.map((o) => o.id));
    const id = generateOrderId(ids);
    const createdAt = new Date().toISOString();

    const newOrder = { id, name, phone, service, price, address, description: description || '', date, status: '⏳ მუშავდება', createdAt };
    orders.push(newOrder);

    await saveOrders(orders);
    await sendTelegramNotification(newOrder);

    res.status(201).json({ success: true, data: newOrder });
  } catch (err) {
    console.error('POST /api/orders error:', err);
    sendError(res, 500, 'Failed to save order');
  }
});

// Telegram-ის ღილაკებზე დაჭერის დამუშავება (Webhook)
app.post('/api/telegram-webhook', async (req, res) => {
  const { callback_query } = req.body || {};
  if (!callback_query) return res.sendStatus(200);

  const data = callback_query.data;
  const messageId = callback_query.message.message_id;
  const chatId = callback_query.message.chat.id;

  if (data && data.startsWith('status_')) {
    const parts = data.split('_');
    const action = parts[1];
    const orderId = parts[2];

    let statusText = '';
    if (action === 'confirm') statusText = '✅ დადასტურებულია';
    if (action === 'ontheway') statusText = '🚗 ოსტატი გზაშია';
    if (action === 'cancel') statusText = '❌ გაუქმებულია';

    try {
      const orders = await loadOrders();
      const orderIndex = orders.findIndex(o => o.id === orderId);
      if (orderIndex !== -1) {
        orders[orderIndex].status = statusText;
        await saveOrders(orders);
      }

      const currentText = callback_query.message.text || '';
      const updatedText = currentText.replace(/📊 სტატუსი:.*/, `📊 სტატუსი: ${statusText}`);

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/editMessageText`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          message_id: messageId,
          text: updatedText,
          reply_markup: callback_query.message.reply_markup
        })
      });

      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: callback_query.id,
          text: `სტატუსი შეიცვალა: ${statusText}`
        })
      });
    } catch (err) {
      console.error('Webhook error:', err);
    }
  }

  res.sendStatus(200);
});

app.delete('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) return sendError(res, 400, 'Order ID is required');

  try {
    const orders = await loadOrders();
    const existing = orders.find((order) => order.id === id);
    if (!existing) return sendError(res, 404, 'Order not found');

    const filtered = orders.filter((order) => order.id !== id);
    await saveOrders(filtered);

    res.json({ success: true, message: `Order ${id} deleted` });
  } catch (err) {
    console.error('DELETE /api/orders/:id error:', err);
    sendError(res, 500, 'Failed to delete order');
  }
});

app.delete('/api/orders', async (req, res) => {
  try {
    await saveOrders([]);
    res.json({ success: true, message: 'All orders deleted' });
  } catch (err) {
    console.error('DELETE /api/orders error:', err);
    sendError(res, 500, 'Failed to delete all orders');
  }
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found' });
});

app.listen(PORT, '0.0.0.0', async () => {
  try {
    await fs.access(DATA_FILE);
  } catch (err) {
    if (err.code === 'ENOENT') {
      await saveOrders([]);
      console.log('Created missing orders.json file');
    }
  }

  const localUrl = `http://localhost:${PORT}`;
  const ip = Object.values(os.networkInterfaces())
    .flat()
    .find((i) => i && i.family === 'IPv4' && !i.internal);

  console.log(`Server running on ${localUrl}`);
  if (ip) console.log(`Accessible on network: http://${ip.address}:${PORT}`);
});