
# 🏨 MERN Stack - Hotel Booking System - Backend

> Express.js & MongoDB backend for the MERN Hotel Booking System. Provides RESTful APIs for authentication, room management, booking processing, payment handling, and admin analytics.

---

## 🔐 Demo Credentials

Use these credentials to test the application:

### Regular User
```
Email: user@demo.com
Password: demo123
```

### Admin User
```
Email: admin@demo.com
Password: admin123
```

### Test Payment Credentials (Razorpay)

#### Network  | #### Card Number  | #### CVV & Expiry Date

Visa		      4100 2800 0000 1007	
Mastercard	  5500 6700 0000 1002
RuPay		      6527 6589 0000 1005   Use a random CVV and any future date
Diners		    3608 280009 1007
Amex		      3402 560004 01007

#### Example :
- **Card Number:** 6527 6589 0000 1005
- **Expiry:** Any future date (e.g., 12/30)
- **CVV:** Any 3 digits (e.g., 123)
- **OTP:** 123456

---

## 📋 Overview

The backend is a robust Node.js/Express API server that handles:
- User authentication and authorization (JWT-based)
- Room catalog management
- Booking creation and status tracking
- Razorpay payment processing
- Email notifications via Brevo
- Admin analytics and reporting
- Offer/discount management
- Review moderation

**Base URL:** `http://localhost:5000/api`

---

## 🛠️ Tech Stack

```
Server & Framework:
- Node.js 18+
- Express.js 5.2.1

Database:
- MongoDB 9.1.3
- Mongoose 9.1.3 (ODM)

Authentication & Security:
- JWT (JSON Web Tokens)
- bcryptjs 3.0.3 (Password hashing)
- CORS 2.8.5

Payment & Services:
- Razorpay 2.8.2 (Payment gateway)
- Axios 1.8.0 (HTTP client for Brevo)
- dotenv 17.2.3 (Environment variables)

Development:
- Nodemon 3.1.11 (Auto-reload)
```

---

## 📁 Project Structure

```
backend/
├── config/
│   └── db.js                  # MongoDB connection
├── controllers/
│   ├── authController.js      # Login, Register, Profile
│   ├── roomController.js      # Room CRUD operations
│   ├── bookingController.js   # Booking management
│   ├── paymentController.js   # Razorpay integration
│   ├── reviewController.js    # Review operations
│   ├── offerController.js     # Offers/discounts
│   └── adminController.js     # Analytics & reporting
├── models/
│   ├── User.js                # User schema
│   ├── Room.js                # Room schema
│   ├── Booking.js             # Booking schema
│   ├── Review.js              # Review schema
│   └── Offer.js               # Offer schema
├── routes/
│   ├── authRoutes.js
│   ├── roomRoutes.js
│   ├── bookingRoutes.js
│   ├── paymentRoutes.js
│   ├── reviewRoutes.js
│   ├── offerRoutes.js
│   └── adminRoutes.js
├── middleware/
│   └── authMiddleware.js      # JWT verification
├── utils/
│   ├── seed.js                # Database seeding (rooms)
│   ├── seedUsers.js           # User seeding with demo accounts
│   ├── seedBookings.js        # Booking seeding
│   ├── seedOffers.js          # Offer seeding
│   ├── seedReviews.js         # Review seeding
│   ├── mockRooms.js           # Sample room data
│   └── sendEmail.js           # Brevo email service
├── server.js                  # Express app entry point
├── package.json
└── .env                       # Environment variables
```

---

## 🚀 Installation & Setup

### Prerequisites

- Node.js 18.0.0+
- npm or yarn
- MongoDB (local or Atlas)
- Git

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Create `.env` File

Create `backend/.env` with:

```env
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/hotel-booking

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production

# Razorpay API Keys
RAZORPAY_KEY_ID=rzp_test_your_test_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret_key

# Brevo Email Service
BREVO_API_KEY=your_brevo_api_key_here
EMAIL_FROM=noreply@yourdomain.com

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Server Configuration
PORT=5000
NODE_ENV=development
```

### Step 3: Seed Demo Data

```bash
# Seed all data (rooms, users, bookings, offers, reviews)
npm run seed:all

# Or seed individually:
npm run seed                # Just rooms
npm run seed:users          # Demo user accounts
npm run seed:bookings       # Sample bookings
npm run seed:offers         # Discount offers
npm run seed:reviews        # Sample reviews
```

### Step 4: Start the Server

```bash
# Development with auto-reload
npm start

# Or use nodemon directly
npx nodemon server.js
```

The backend will be available at: **http://localhost:5000**

---

## 📚 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|----------------|
| POST | `/auth/register` | Register new user | ❌ |
| POST | `/auth/login` | Login user | ❌ |
| GET | `/auth/profile` | Get user profile | ✅ |
| PUT | `/auth/profile` | Update profile | ✅ |

**Login Request:**
```json
{
  "email": "user@demo.com",
  "password": "demo123"
}
```

**Login Response:**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "650a1b2c3d4e5f6g7h8i",
    "name": "John Doe",
    "email": "user@demo.com",
    "role": "user"
  }
}
```

---

### Rooms

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/rooms` | Get all rooms | ❌ |
| GET | `/rooms/:id` | Get room details | ❌ |
| POST | `/rooms` | Create room | ✅ Admin |
| PUT | `/rooms/:id` | Update room | ✅ Admin |
| DELETE | `/rooms/:id` | Delete room | ✅ Admin |

---

### Bookings

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/bookings` | Get user bookings | ✅ |
| POST | `/bookings` | Create booking | ✅ |
| GET | `/bookings/:id` | Get booking details | ✅ |
| PUT | `/bookings/:id/cancel` | Cancel booking | ✅ |
| PUT | `/bookings/:id/status` | Update status | ✅ Admin |

---

### Payments

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/payments/create-order` | Create order | ✅ |
| POST | `/payments/verify` | Verify payment | ✅ |
| GET | `/payments/:id/status` | Check status | ✅ |

---

### Reviews

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/reviews` | Get all reviews | ❌ |
| GET | `/reviews/room/:roomId` | Get room reviews | ❌ |
| POST | `/reviews` | Submit review | ✅ |
| PUT | `/reviews/:id/approve` | Approve review | ✅ Admin |

---

### Offers

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/offers` | Get active offers | ❌ |
| POST | `/offers/validate` | Validate code | ✅ |
| POST | `/offers` | Create offer | ✅ Admin |
| PUT | `/offers/:id` | Update offer | ✅ Admin |
| DELETE | `/offers/:id` | Delete offer | ✅ Admin |

---

### Admin Analytics

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/admin/dashboard` | Dashboard summary | ✅ Admin |
| GET | `/admin/revenue/monthly` | Monthly revenue | ✅ Admin |
| GET | `/admin/occupancy` | Occupancy rates | ✅ Admin |
| GET | `/admin/trends/booking` | Booking trends | ✅ Admin |
| GET | `/admin/performance/rooms` | Room performance | ✅ Admin |

---

## 🗄️ Database Schemas

### User
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  phone: String,
  role: "user" | "admin",
  avatar: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Room
```javascript
{
  name: String,
  roomType: String,
  price: Number,
  bedType: String,
  maxGuests: Number,
  amenities: [String],
  images: [String],
  description: String,
  totalRooms: Number,
  availableRooms: Number,
  rating: Number,
  ratingCount: Number,
  createdAt: Date
}
```

### Booking
```javascript
{
  userId: ObjectId (ref: User),
  roomId: ObjectId (ref: Room),
  checkIn: Date,
  checkOut: Date,
  numberOfNights: Number,
  numberOfGuests: Number,
  bookingStatus: String,
  paymentStatus: String,
  totalPrice: Number,
  originalPrice: Number,
  discountCode: String,
  discountAmount: Number,
  specialRequests: String,
  createdAt: Date
}
```

---

## 🔐 Authentication Flow

1. User logs in with email/password
2. Backend verifies credentials against hashed password
3. JWT token generated with userId and role
4. Token sent to frontend and stored in localStorage
5. Token included in Authorization header for protected routes
6. Backend middleware verifies JWT on each request
7. Token expires after 7 days

---

## 💳 Payment Flow

1. Frontend requests order creation
2. Backend creates Razorpay order
3. Razorpay modal opens for payment
4. User enters card details
5. Razorpay processes payment
6. Frontend verifies with backend
7. Backend verifies signature and updates booking
8. Confirmation email sent to user

---

## 📧 Email Notifications

Sends emails via Brevo for:
- Booking confirmations
- Payment receipts
- Booking cancellations
- Review approvals

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| MongoDB Connection Error | Verify MONGO_URI and IP whitelist in MongoDB Atlas |
| JWT Token Errors | Ensure JWT_SECRET is correct |
| Payment Fails | Verify Razorpay keys and amount currency |
| Email Not Sending | Check Brevo API key and sender email approval |
| CORS Errors | Update FRONTEND_URL in .env |
| Port Already in Use | Change PORT in .env |

---

## 📦 Available Scripts

```bash
npm start              # Start development server
npm run seed           # Seed rooms data
npm run seed:all       # Seed everything
npm run seed:users     # Seed demo users
npm run seed:bookings  # Seed bookings
npm run seed:offers    # Seed offers
npm run seed:reviews   # Seed reviews
```

---

## 🚀 Deployment

### Deploy to Render/Heroku/Railway

1. Push code to GitHub
2. Connect repository to platform
3. Set environment variables
4. Deploy on push

**Production Variables:**
```env
MONGO_URI=mongodb+srv://prod:pass@cluster.mongodb.net/db_name
JWT_SECRET=strong-random-key-min-32-chars
NODE_ENV=production
RAZORPAY_KEY_ID=rzp_live_key
RAZORPAY_KEY_SECRET=live_secret
FRONTEND_URL=https://yourdomain.com
```

---

## 🙏 Support

For issues:
- Check troubleshooting section
- Review API documentation
- Verify environment variables

---

## 📄 License

This project is open-source and free to use for educational and personal projects. For commercial use, please contact the author for licensing options.

---
