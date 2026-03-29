const mongoose = require('mongoose');
const Room = require('../models/Room');
const mockRooms = require('./mockRooms');
require('dotenv').config();

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        console.log('Connected to MongoDB, seeding rooms...');

        // prepare documents: retain _id if present and valid, cast numeric fields
        const roomsToInsert = mockRooms.map(r => {
            const room = { ...r };
            // cast _id to ObjectId if it's a valid hex string
            if (room._id && mongoose.Types.ObjectId.isValid(room._id)) {
                room._id = new mongoose.Types.ObjectId(room._id);
            } else {
                delete room._id; // let mongo generate one otherwise
            }
            room.totalRooms = room.totalRooms != null ? room.totalRooms : 5;
            room.availableRooms = room.availableRooms != null ? room.availableRooms : 5;
            return room;
        });

        // clear existing rooms so seeding is idempotent
        await Room.deleteMany({});
        await Room.insertMany(roomsToInsert);

        console.log(`Inserted ${roomsToInsert.length} mock rooms into the database.`);
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
}

seed();
