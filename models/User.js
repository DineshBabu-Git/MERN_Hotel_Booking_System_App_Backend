
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    profilePhoto: { type: String, default: null },
    savedRooms: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room"
    }],
    preferences: {
        roomType: String,
        priceRange: { min: Number, max: Number },
        amenities: [String]
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
