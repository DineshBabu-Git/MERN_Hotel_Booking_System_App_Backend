
const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
    name: { type: String, required: true },
    roomType: { type: String, enum: ["single", "double", "suite"], required: true },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    bedType: { type: String, enum: ["single", "double", "queen", "king"] },
    roomSize: { type: Number }, // in sq ft
    view: { type: String }, // e.g., "ocean view", "city view"
    description: { type: String },
    amenities: [String], // e.g., ["wifi", "AC", "hot water", "TV"]
    images: [String],
    totalRooms: { type: Number, required: true },
    availableRooms: { type: Number, required: true },
    maxGuests: { type: Number, default: 2 },
    isActive: { type: Boolean, default: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Room", roomSchema);
