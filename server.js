import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
// bind to 0.0.0.0 to accept requests from other devices on the network
const HOST = process.env.HOST || '0.0.0.0';
const ORDERS_FILE = path.join(__dirname, 'orders.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Initialize orders file if it doesn't exist
function ensureOrdersFile() {
  if (!fs.existsSync(ORDERS_FILE)) {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify([], null, 2));
  }
}

// Read orders from file
function readOrders() {
  try {
    ensureOrdersFile();
    const data = fs.readFileSync(ORDERS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading orders:', error);
    return [];
  }
}

// Write orders to file
function writeOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2));
  } catch (error) {
    console.error('Error writing orders:', error);
  }
}

// ========== API ENDPOINTS ==========

// GET all orders (admin only)
app.get('/api/orders', (req, res) => {
  const orders = readOrders();
  res.json({ success: true, data: orders });
});

// POST new order
app.post('/api/orders', (req, res) => {
  try {
    const { name, phone, service, price, address, description, date } = req.body;

    // Validation
    if (!name || !phone || !service || !address || !description || !date) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    // Create order
    const orderID = 'DT-' + Math.floor(Math.random() * 100000);
    const order = {
      id: orderID,
      name,
      phone,
      service,
      price: price || 'N/A',
      address,
      description,
      date,
      createdAt: new Date().toISOString()
    };

    // Save to file
    const orders = readOrders();
    orders.push(order);
    writeOrders(orders);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating order'
    });
  }
});

// DELETE order by ID
app.delete('/api/orders/:id', (req, res) => {
  try {
    const { id } = req.params;
    const orders = readOrders();
    const filteredOrders = orders.filter(order => order.id !== id);

    if (filteredOrders.length === orders.length) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    writeOrders(filteredOrders);
    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting order:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting order'
    });
  }
});

// DELETE all orders (admin reset)
app.delete('/api/orders', (req, res) => {
  try {
    writeOrders([]);
    res.json({
      success: true,
      message: 'All orders deleted'
    });
  } catch (error) {
    console.error('Error clearing orders:', error);
    res.status(500).json({
      success: false,
      message: 'Error clearing orders'
    });
  }
});

// Start server
ensureOrdersFile();
app.listen(PORT, HOST, () => {
  console.log(`🚀 Davit-Tech Order Server running on https://davitprotech.vercel.app/#orders`);
  console.log(`🚀 Also accessible on local network at http://localhost:${PORT}`);
  console.log(`📝 Orders stored in: ${ORDERS_FILE}`);
});

// helper to get local IP address for instructions
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}
