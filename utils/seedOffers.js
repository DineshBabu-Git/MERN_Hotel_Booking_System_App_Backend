const mongoose = require('mongoose');
const Offer = require('../models/Offer');
const Room = require('../models/Room');
require('dotenv').config();

const sampleOffers = [
    {
        title: "Early Bird Discount",
        description: "Book 30 days in advance and get 20% discount",
        discountPercentage: 20,
        discountType: "percentage"
    },
    {
        title: "Weekend Special",
        description: "Enjoy 15% off on weekend stays",
        discountPercentage: 15,
        discountType: "percentage"
    },
    {
        title: "Extended Stay Offer",
        description: "Stay 5 nights or more and get 25% discount",
        discountPercentage: 25,
        discountType: "percentage"
    },
    {
        title: "Group Booking",
        description: "Book 3 or more rooms and get 30% discount",
        discountPercentage: 30,
        discountType: "percentage"
    },
    {
        title: "Monsoon Special",
        description: "Relax during monsoons with 18% off plus complimentary breakfast",
        discountPercentage: 18,
        discountType: "percentage"
    },
    {
        title: "Summer Getaway",
        description: "Summer vacation special - 22% discount on all rooms",
        discountPercentage: 22,
        discountType: "percentage"
    },
    {
        title: "Loyalty Rewards",
        description: "Returning guests get 10% discount on all bookings",
        discountPercentage: 10,
        discountType: "percentage"
    },
    {
        title: "Last Minute Deal",
        description: "Book for dates within 7 days and save 35%",
        discountPercentage: 35,
        discountType: "percentage"
    }
];

async function seedOffers() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB, seeding offers...');

        // Get all rooms
        const rooms = await Room.find({});
        if (rooms.length === 0) {
            console.log('No rooms found. Please seed rooms first!');
            process.exit(1);
        }

        // Clear existing offers
        await Offer.deleteMany({});

        // Create sample offers
        const offers = [];
        const today = new Date();

        // Create 2-3 offers per room category, plus some general offers
        for (let i = 0; i < 4; i++) {
            const randomOffer = sampleOffers[i];
            const startDate = new Date(today);
            const endDate = new Date(today);
            endDate.setDate(endDate.getDate() + 30 + i * 10);

            // Apply to all rooms or specific category
            if (i % 2 === 0) {
                // General offer for all rooms
                offers.push({
                    title: randomOffer.title,
                    description: randomOffer.description,
                    discountPercentage: randomOffer.discountPercentage,
                    discountType: randomOffer.discountType,
                    startDate: startDate,
                    endDate: endDate,
                    isActive: true,
                    roomTypes: [], // Empty means applicable to all
                    minNights: Math.floor(Math.random() * 3) + 1,
                    maxNights: 30,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            } else {
                // Specific room type offer
                const roomType = rooms[i % rooms.length].roomType;
                offers.push({
                    title: randomOffer.title + ` - ${roomType}`,
                    description: randomOffer.description,
                    discountPercentage: randomOffer.discountPercentage,
                    discountType: randomOffer.discountType,
                    startDate: startDate,
                    endDate: endDate,
                    isActive: true,
                    roomTypes: [roomType],
                    minNights: Math.floor(Math.random() * 2) + 1,
                    maxNights: 28,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }
        }

        // Add some inactive offers
        for (let i = 4; i < 6; i++) {
            const randomOffer = sampleOffers[i];
            const startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 30);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 15);

            offers.push({
                title: randomOffer.title + " (Expired)",
                description: randomOffer.description,
                discountPercentage: randomOffer.discountPercentage,
                discountType: randomOffer.discountType,
                startDate: startDate,
                endDate: endDate,
                isActive: false,
                roomTypes: [],
                minNights: 1,
                maxNights: 30,
                createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
                updatedAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000)
            });
        }

        // Add upcoming offers
        for (let i = 6; i < 8; i++) {
            const randomOffer = sampleOffers[i];
            const startDate = new Date(today);
            startDate.setDate(startDate.getDate() + 15);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 20);

            offers.push({
                title: randomOffer.title + " (Coming Soon)",
                description: randomOffer.description,
                discountPercentage: randomOffer.discountPercentage,
                discountType: randomOffer.discountType,
                startDate: startDate,
                endDate: endDate,
                isActive: false,
                roomTypes: [],
                minNights: 2,
                maxNights: 30,
                createdAt: new Date(),
                updatedAt: new Date()
            });
        }

        await Offer.insertMany(offers);
        console.log(`✓ Inserted ${offers.length} sample offers`);
        console.log(`  - ${offers.filter(o => o.isActive).length} active offers`);
        console.log(`  - ${offers.filter(o => !o.isActive).length} inactive/expired offers`);
        
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
}

seedOffers();
