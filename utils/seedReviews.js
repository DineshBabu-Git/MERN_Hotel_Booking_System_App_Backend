const mongoose = require('mongoose');
const Review = require('../models/Review');
const Room = require('../models/Room');
const User = require('../models/User');
require('dotenv').config();

const sampleReviewsData = [
    {
        rating: 5,
        comment: "Absolutely amazing stay! The room was immaculate, very spacious, and had all the amenities we needed. The staff was incredibly helpful and friendly. Will definitely come back!",
        cleanlinessRating: 5,
        serviceRating: 5,
        amenitiesRating: 5
    },
    {
        rating: 4,
        comment: "Great location and comfortable beds. The room was clean and well-maintained. Only minor issue was that the WiFi could be a bit faster, but overall excellent experience!",
        cleanlinessRating: 4,
        serviceRating: 4,
        amenitiesRating: 4
    },
    {
        rating: 5,
        comment: "Beautiful room with an amazing view. Everything was perfect - from the comfortable furniture to the excellent bathroom. The breakfast was also outstanding. Highly recommend!",
        cleanlinessRating: 5,
        serviceRating: 5,
        amenitiesRating: 5
    },
    {
        rating: 4,
        comment: "Good value for money. The room was clean and comfortable. The staff was polite and helpful. Would have liked more amenities in the room, but overall satisfied.",
        cleanlinessRating: 4,
        serviceRating: 5,
        amenitiesRating: 3
    },
    {
        rating: 5,
        comment: "Excellent hotel! The room was luxurious and the service was top-notch. Everything was taken care of perfectly. Special mention to the front desk team for being so accommodating!",
        cleanlinessRating: 5,
        serviceRating: 5,
        amenitiesRating: 5
    },
    {
        rating: 3,
        comment: "Decent room but could use some updates. The furniture is a bit old but functional. Cleanliness was good. Service was okay. Would be perfect with some renovations.",
        cleanlinessRating: 3,
        serviceRating: 3,
        amenitiesRating: 3
    },
    {
        rating: 4,
        comment: "Very nice stay! The room was spacious and well-equipped. Excellent customer service. Only minor issue was the noise from the corridor but nothing major.",
        cleanlinessRating: 4,
        serviceRating: 5,
        amenitiesRating: 4
    },
    {
        rating: 5,
        comment: "Fantastic experience! The room exceeded our expectations. Everything was perfect - cleanliness, comfort, service. The view from the window was breathtaking!",
        cleanlinessRating: 5,
        serviceRating: 5,
        amenitiesRating: 5
    }
];

async function seedReviews() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB, seeding reviews...');

        // Get all rooms
        const rooms = await Room.find({});
        if (rooms.length === 0) {
            console.log('No rooms found. Please seed rooms first!');
            process.exit(1);
        }

        // Get all users (or create a demo user review)
        let users = await User.find({});
        if (users.length === 0) {
            console.log('No users found. Creating a demo user for reviews...');
            const demoUser = await User.create({
                name: "Guest Reviewer",
                email: "guest@reviewhotel.com",
                password: "hashedPassword123",
                phone: "+1234567890",
                role: "user"
            });
            users = [demoUser];
        }

        // Clear existing reviews
        await Review.deleteMany({});

        // Create reviews for each room
        const reviews = [];
        for (const room of rooms) {
            // Create 2-4 reviews per room
            const reviewCount = Math.floor(Math.random() * 3) + 2;
            
            for (let i = 0; i < reviewCount; i++) {
                const randomUser = users[Math.floor(Math.random() * users.length)];
                const randomReviewData = sampleReviewsData[Math.floor(Math.random() * sampleReviewsData.length)];
                
                reviews.push({
                    roomId: room._id,
                    userId: randomUser._id,
                    rating: randomReviewData.rating,
                    comment: randomReviewData.comment,
                    cleanlinessRating: randomReviewData.cleanlinessRating,
                    serviceRating: randomReviewData.serviceRating,
                    amenitiesRating: randomReviewData.amenitiesRating,
                    isApproved: true,
                    adminResponse: null,
                    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
                });
            }
        }

        await Review.insertMany(reviews);
        console.log(`✓ Inserted ${reviews.length} sample reviews for ${rooms.length} rooms`);
        
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
}

seedReviews();
