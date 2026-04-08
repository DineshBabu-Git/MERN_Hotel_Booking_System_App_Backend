const Room = require("../models/Room");
const Booking = require("../models/Booking");

// Get All Rooms (with filters)
exports.getAllRooms = async (req, res) => {
    try {
        const { minPrice, maxPrice, roomType, amenities, search, sortBy } = req.query;

        let filter = { isActive: true };

        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ];
        }

        if (roomType) {
            filter.roomType = roomType;
        }

        if (minPrice && maxPrice) {
            filter.price = { $gte: parseInt(minPrice), $lte: parseInt(maxPrice) };
        }

        if (amenities) {
            const amenitiesArray = typeof amenities === "string" ? amenities.split(",") : amenities;
            filter.amenities = { $all: amenitiesArray };
        }

        let query = Room.find(filter);

        // Sorting
        if (sortBy === "price_low") {
            query = query.sort({ price: 1 });
        } else if (sortBy === "price_high") {
            query = query.sort({ price: -1 });
        } else if (sortBy === "rating") {
            query = query.sort({ rating: -1 });
        }

        const rooms = await query;
        res.json(rooms);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Room by ID
exports.getRoomById = async (req, res) => {
    try {
        const room = await Room.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        res.json(room);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Create Room (Admin only)
exports.createRoom = async (req, res) => {
    try {
        const { name, roomType, price, bedType, roomSize, view, description, amenities, images, totalRooms, maxGuests } = req.body;

        if (!name || !roomType || !price || !totalRooms) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const room = await Room.create({
            name,
            roomType,
            price,
            bedType,
            roomSize,
            view,
            description,
            amenities: amenities || [],
            images: images || [],
            totalRooms,
            availableRooms: totalRooms,
            maxGuests: maxGuests || 2,
            originalPrice: price
        });

        res.status(201).json({
            message: "Room created successfully",
            room
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update Room (Admin only)
exports.updateRoom = async (req, res) => {
    try {
        const { name, roomType, price, bedType, roomSize, view, description, amenities, images, totalRooms, maxGuests, isActive } = req.body;

        const room = await Room.findByIdAndUpdate(
            req.params.id,
            {
                name,
                roomType,
                price,
                bedType,
                roomSize,
                view,
                description,
                amenities,
                images,
                totalRooms,
                maxGuests,
                isActive,
                updatedAt: Date.now()
            },
            { new: true }
        );

        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        res.json({
            message: "Room updated successfully",
            room
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete Room (Admin only)
exports.deleteRoom = async (req, res) => {
    try {
        const room = await Room.findByIdAndDelete(req.params.id);
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        res.json({ message: "Room deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Return static mock rooms (for frontend demo without DB)
exports.getMockRooms = async (req, res) => {
    try {
        const mockRooms = require("../utils/mockRooms");
        res.json(mockRooms);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Check Room Availability
exports.checkAvailability = async (req, res) => {
    try {
        const { roomType, checkIn, checkOut } = req.query;

        if (!checkIn || !checkOut) {
            return res.status(400).json({ message: "Check-in and check-out dates are required" });
        }

        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);

        // Find booked rooms
        const bookedRooms = await Booking.find({
            checkIn: { $lt: checkOutDate },
            checkOut: { $gt: checkInDate },
            bookingStatus: { $ne: "cancelled" }
        }).distinct("roomId");

        // Find available rooms
        let filter = { isActive: true, _id: { $nin: bookedRooms } };
        if (roomType) {
            filter.roomType = roomType;
        }

        const availableRooms = await Room.find(filter);

        res.json({
            checkIn: checkInDate,
            checkOut: checkOutDate,
            availableRooms,
            count: availableRooms.length
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Room Reviews
exports.getRoomReviews = async (req, res) => {
    try {
        const Review = require("../models/Review");
        const reviews = await Review.find({ roomId: req.params.id, isApproved: true })
            .populate("userId", "name profilePhoto")
            .sort({ createdAt: -1 });

        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Upload Room Image
exports.uploadImage = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "No image file provided",
                data: null
            });
        }

        // Return only the filename (or can return full path)
        const imageFilename = req.file.filename;
        const imagePath = `/images/${imageFilename}`;

        res.status(200).json({
            success: true,
            message: "Image uploaded successfully",
            data: {
                filename: imageFilename,
                path: imagePath,
                url: `${req.protocol}://${req.get("host")}${imagePath}`
            },
            count: 1
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message || "Failed to upload image",
            data: null
        });
    }
};
