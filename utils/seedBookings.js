const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const User = require('../models/User');
require('dotenv').config();

async function seedBookings() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB, seeding bookings...');

        // Get all rooms
        const rooms = await Room.find({});
        if (rooms.length === 0) {
            console.log('No rooms found. Please seed rooms first!');
            process.exit(1);
        }

        // Get all users (or create a demo user)
        let users = await User.find({});
        if (users.length === 0) {
            console.log('No users found. Creating demo users for bookings...');
            const demoUsers = await User.insertMany([
                {
                    name: "John Doe",
                    email: "john@example.com",
                    password: "hashedPassword123",
                    phone: "+1234567890",
                    role: "user"
                },
                {
                    name: "Jane Smith",
                    email: "jane@example.com",
                    password: "hashedPassword456",
                    phone: "+0987654321",
                    role: "user"
                },
                {
                    name: "Bob Wilson",
                    email: "bob@example.com",
                    password: "hashedPassword789",
                    phone: "+1122334455",
                    role: "user"
                }
            ]);
            users = demoUsers;
        }

        // Clear existing bookings
        await Booking.deleteMany({});

        // Create sample bookings
        const bookings = [];
        const today = new Date();
        
        for (let i = 0; i < 5; i++) {
            const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
            const randomUser = users[Math.floor(Math.random() * users.length)];
            
            // Create varied booking dates
            const checkInDate = new Date(today);
            checkInDate.setDate(checkInDate.getDate() + (i * 3) + 1);
            
            const checkOutDate = new Date(checkInDate);
            checkOutDate.setDate(checkOutDate.getDate() + Math.floor(Math.random() * 5) + 1);
            
            const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
            const totalPrice = randomRoom.pricePerNight * nights;
            
            const statuses = ['confirmed', 'pending', 'completed', 'cancelled'];
            const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
            
            bookings.push({
                roomId: randomRoom._id,
                userId: randomUser._id,
                checkInDate: checkInDate,
                checkOutDate: checkOutDate,
                numberOfGuests: Math.floor(Math.random() * randomRoom.capacity) + 1,
                pricePerNight: randomRoom.pricePerNight,
                numberOfNights: nights,
                totalPrice: totalPrice,
                status: randomStatus,
                paymentStatus: randomStatus === 'cancelled' ? 'cancelled' : 'paid',
                specialRequests: [
                    "Early check-in if possible",
                    "Late check-out arrangements available",
                    "High floor room preferred",
                    "Non-smoking room",
                    ""
                ][Math.floor(Math.random() * 5)],
                bookingReference: `BK${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
                createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000) // Random date within last 60 days
            });
        }

        await Booking.insertMany(bookings);
        console.log(`✓ Inserted ${bookings.length} sample bookings for ${rooms.length} rooms`);
        
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
}

seedBookings();
