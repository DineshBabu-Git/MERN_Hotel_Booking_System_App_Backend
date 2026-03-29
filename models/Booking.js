
const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    roomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Room",
        required: true
    },
    checkIn: { type: Date, required: true },
    checkOut: { type: Date, required: true },
    numberOfGuests: { type: Number, required: true },
    numberOfNights: { type: Number },
    totalPrice: { type: Number, required: true },
    originalPrice: { type: Number },
    discountCode: { type: String },
    discountAmount: { type: Number, default: 0 },
    paymentStatus: {
        type: String,
        enum: ["pending", "paid", "refunded"],
        default: "pending"
    },
    paymentMethod: { type: String }, // "razorpay", "wallet", etc
    razorpayPaymentId: { type: String },
    razorpayOrderId: { type: String },
    bookingStatus: {
        type: String,
        enum: ["pending", "confirmed", "cancelled", "completed"],
        default: "pending"
    },
    specialRequests: { type: String },
    guestEmail: { type: String, required: true },
    guestPhone: { type: String, required: true },
    cancellationReason: { type: String },
    cancelledAt: { type: Date },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Booking", bookingSchema);
