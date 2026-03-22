
const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
    code: { type: String, unique: true, required: true, uppercase: true },
    title: { type: String, required: true },
    description: { type: String },
    discountType: { type: String, enum: ["percentage", "fixed"], required: true },
    discount: { type: Number, required: true },
    minAmount: { type: Number, default: 0 },
    maxDiscount: { type: Number }, // for percentage discounts
    validFrom: { type: Date, default: Date.now },
    validTill: { type: Date, required: true },
    usageLimit: { type: Number },
    usedCount: { type: Number, default: 0 },
    applicableRoomTypes: [String],
    isActive: { type: Boolean, default: true },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Offer", offerSchema);
