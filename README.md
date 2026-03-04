# Davit-Tech Order System

A complete order management system with customer-facing frontend and backend server for the Davit-Tech service company.

## Features

### Customer Features
- **Service Selection**: Browse 7 different services (Windows installation, virus cleanup, PC repair, office software, Adobe packages, diagnostics)
- **Order Placement**: Submit service orders with customer details, address, and date
- **Price Display**: Real-time price updates based on selected service
- **Order Confirmation**: Unique Order ID generated for each order

### Admin Features
- **Order Management**: View all submitted orders in a dashboard
- **Order Deletion**: Remove orders from the system
- **Password Protected**: Admin login with username and password
- **Persistent Storage**: All orders saved on the server

## Project Structure

```
davit-tech-main/
├── index.html          # Main HTML file with service cards and forms
├── style.css           # Styling with modern gradient background
├── script.js           # Client-side logic with API integration
├── server.js           # Express backend server
├── package.json        # Node.js dependencies
├── orders.json         # Order database (auto-created)
└── images/             # Service images
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. Navigate to the project directory:
```bash
cd davit-tech-main
```

2. Install dependencies:
```bash
npm install
```

### Running the Server

**Production mode:**
```bash
npm start
```

**Development mode (with auto-reload):**
```bash
npm run dev
```

The server will start on `http://localhost:3000` by default.
It listens on `0.0.0.0` so devices on the same local network can reach it.  
Watch the console log for an additional line showing the machine's IP (e.g. `http://192.168.1.100:3000`).

#### Accessing from other devices

- **Desktop (host)**: open `http://localhost:3000` in a browser.
- **Smartphone/tablet on same Wi‑Fi**: open `http://<PC_IP>:3000` replacing `<PC_IP>` with the address printed in the server log.

> ⚠️ If you cannot connect from mobile:
> * ensure both devices are on the same network
> * check your PC firewall allows inbound TCP on the chosen port
> * confirm the server process is running and listening
> * you can also use a tunneling service (e.g. [ngrok](https://ngrok.com/)) to expose the server

### Accessing the Application

1. **Customer Interface**: Use one of the URLs above to browse services, submit orders, and receive a confirmation ID.

2. **Admin Panel**: 
   - Navigate to `http://localhost:3000#admin` (or `http://<PC_IP>:3000#admin` from another device)
   - Login with:
     - **Username**: `admin`
     - **Password**: `2003`
   - View and manage all orders

## API Endpoints

### Orders Management

**GET /api/orders**
- Fetch all orders
- Response: `{ success: boolean, data: Order[] }`

**POST /api/orders**
- Submit a new order
- Body: `{ name, phone, service, price, address, description, date }`
- Response: `{ success: boolean, data: Order, message: string }`

**DELETE /api/orders/:id**
- Delete a specific order by ID
- Response: `{ success: boolean, message: string }`

**DELETE /api/orders**
- Clear all orders
- Response: `{ success: boolean, message: string }`

## Order Data Structure

```javascript
{
  id: "DT-12345",           // Auto-generated Order ID
  name: "John Doe",         // Customer name
  phone: "+995591234567",   // Customer phone
  service: "Windows ინსტალაცია",  // Service selected
  price: "20",              // Service price in Georgian Lari
  address: "123 Main St",   // Customer address
  description: "Need Windows 11 installed",  // Service description
  date: "2026-03-05  14:30",  // Scheduled date and time
  createdAt: "2026-03-05T14:30:00.000Z"  // Server creation timestamp
}
```

## Services Available

1. **Windows ინსტალაცია** (Windows Installation) - 20₾
2. **აქტივაციების გაქტიურება** (Activation) - 10₾
3. **დიაგნოსტიკა** (Diagnostics) - 20₾
4. **ვირუსის გაწმენდა** (Virus Cleanup) - 30₾
5. **PC/Laptop შეკეთება** (PC/Laptop Repair) - 60₾
6. **საოფისე პროგრამები** (Office Software) - 30₾
7. **Adobe პაკეტი** (Adobe Package) - 50₾

## File Storage

Orders are persisted in `orders.json` file on the server. The file is automatically created on first startup if it doesn't exist.

To backup orders:
```bash
cp orders.json orders.backup.json
```

To restore orders:
```bash
cp orders.backup.json orders.json
```

## CORS Configuration

The server is configured with CORS enabled to allow requests from the front-end application. The current configuration allows all origins.

## Security Notes

- Admin credentials are hardcoded for demonstration purposes only
- For production, implement:
  - Database (PostgreSQL, MongoDB, etc.)
  - Authentication with JWT tokens
  - HTTPS/SSL encryption
  - User role management
  - Input validation and sanitization
  - Rate limiting

## Troubleshooting

**"Cannot load orders. Server is not running."**
- Ensure the server is running with `npm start`
- Check that port 3000 is not in use

**Orders not persisting**
- Check write permissions for the project directory
- Verify `orders.json` file exists

**CORS errors**
- Ensure client is accessing `http://localhost:3000`
- Check server CORS configuration

## Future Enhancements

- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] Email notifications for orders
- [ ] SMS notifications
- [ ] Payment processing
- [ ] Order status tracking
- [ ] Customer portal
- [ ] Multi-language support
- [ ] Mobile app
- [ ] Analytics dashboard

## License

ISC
