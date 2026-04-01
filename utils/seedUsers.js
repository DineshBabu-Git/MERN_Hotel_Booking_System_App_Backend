
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

async function seedUsers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('Connected to MongoDB, seeding demo users...');

        // Clear existing users (optional - comment out to keep existing users)
        await User.deleteMany({});

        // Hash demo passwords
        const userPassword = await bcrypt.hash('demo123', 10);
        const adminPassword = await bcrypt.hash('admin123', 10);

        // Create demo users
        const demoUsers = [
            {
                name: 'John Doe',
                email: 'user@demo.com',
                password: userPassword,
                phone: '+1-234-567-8900',
                role: 'user'
            },
            {
                name: 'Admin User',
                email: 'admin@demo.com',
                password: adminPassword,
                phone: '+1-234-567-8901',
                role: 'admin'
            }
        ];

        await User.insertMany(demoUsers);

        console.log('✓ Demo users seeded successfully!');
        console.log('\n📋 Demo Credentials:');
        console.log('---');
        console.log('Regular User:');
        console.log('  Email: user@demo.com');
        console.log('  Password: demo123');
        console.log('---');
        console.log('Admin User:');
        console.log('  Email: admin@demo.com');
        console.log('  Password: admin123');
        console.log('---\n');

        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
}

seedUsers();
