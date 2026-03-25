import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const app = express();
const PORT = Number(process.env.PORT || 3000);
const DATA_FILE = path.resolve(process.cwd(), 'orders.json');

app.use(cors({
  origin: ["https://davitprotech.vercel.app", "http://localhost:3000", "http://localhost"]
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

    const newOrder = { id, name, phone, service, price, address, description: description || '', date, createdAt };
    orders.push(newOrder);

    await saveOrders(orders);

    res.status(201).json({ success: true, data: newOrder });
  } catch (err) {
    console.error('POST /api/orders error:', err);
    sendError(res, 500, 'Failed to save order');
  }
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