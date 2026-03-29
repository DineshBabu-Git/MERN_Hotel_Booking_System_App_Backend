const Offer = require("../models/Offer");

// Create Offer (Admin only)
exports.createOffer = async (req, res) => {
    try {
        const { code, title, description, discountType, discount, minAmount, maxDiscount, validTill, usageLimit, applicableRoomTypes } = req.body;

        // Validate input
        if (!code || !title || !discountType || !discount || !validTill) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        if (discountType === "percentage" && (discount < 0 || discount > 100)) {
            return res.status(400).json({ message: "Percentage discount must be between 0 and 100" });
        }

        // Check if code already exists
        const existingOffer = await Offer.findOne({ code: code.toUpperCase() });
        if (existingOffer) {
            return res.status(400).json({ message: "Offer code already exists" });
        }

        const offer = await Offer.create({
            code: code.toUpperCase(),
            title,
            description,
            discountType,
            discount,
            minAmount: minAmount || 0,
            maxDiscount,
            validFrom: new Date(),
            validTill: new Date(validTill),
            usageLimit,
            applicableRoomTypes: applicableRoomTypes || [],
            isActive: true,
            createdBy: req.user.id
        });

        res.status(201).json({
            message: "Offer created successfully",
            offer
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get All Offers
exports.getAllOffers = async (req, res) => {
    try {
        const { isActive } = req.query;

        let filter = {};
        if (isActive !== undefined) {
            filter.isActive = isActive === "true";
        }

        const offers = await Offer.find(filter)
            .populate("createdBy", "name email")
            .sort({ createdAt: -1 });

        res.json(offers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Active Offers
exports.getActiveOffers = async (req, res) => {
    try {
        const offers = await Offer.find({
            isActive: true,
            validTill: { $gte: new Date() },
            validFrom: { $lte: new Date() }
        }).sort({ createdAt: -1 });

        res.json(offers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Validate Offer Code
exports.validateOffer = async (req, res) => {
    try {
        const { code, totalAmount, roomType } = req.body;

        if (!code) {
            return res.status(400).json({ message: "Offer code is required" });
        }

        const offer = await Offer.findOne({
            code: code.toUpperCase(),
            isActive: true,
            validTill: { $gte: new Date() },
            validFrom: { $lte: new Date() }
        });

        if (!offer) {
            return res.status(400).json({ message: "Invalid or expired offer code" });
        }

        // Check usage limit
        if (offer.usedCount >= offer.usageLimit) {
            return res.status(400).json({ message: "Offer usage limit exceeded" });
        }

        // Check minimum amount requirement
        if (totalAmount < offer.minAmount) {
            return res.status(400).json({
                message: `Minimum amount of ${offer.minAmount} required for this offer`,
                minAmount: offer.minAmount
            });
        }

        // Check if applicable to room type
        if (offer.applicableRoomTypes && offer.applicableRoomTypes.length > 0 && roomType) {
            if (!offer.applicableRoomTypes.includes(roomType)) {
                return res.status(400).json({ message: "This offer is not applicable to this room type" });
            }
        }

        // Calculate discount
        let discountAmount = 0;
        if (totalAmount) {
            if (offer.discountType === "percentage") {
                discountAmount = (totalAmount * offer.discount) / 100;
                if (offer.maxDiscount) {
                    discountAmount = Math.min(discountAmount, offer.maxDiscount);
                }
            } else {
                discountAmount = offer.discount;
            }
        }

        res.json({
            message: "Offer is valid",
            offer: {
                code: offer.code,
                title: offer.title,
                discountType: offer.discountType,
                discount: offer.discount,
                discountAmount,
                maxDiscount: offer.maxDiscount
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update Offer (Admin only)
exports.updateOffer = async (req, res) => {
    try {
        const { code, title, description, discountType, discount, minAmount, maxDiscount, validTill, usageLimit, isActive, applicableRoomTypes } = req.body;

        const offer = await Offer.findByIdAndUpdate(
            req.params.id,
            {
                code: code ? code.toUpperCase() : undefined,
                title,
                description,
                discountType,
                discount,
                minAmount,
                maxDiscount,
                validTill: validTill ? new Date(validTill) : undefined,
                usageLimit,
                applicableRoomTypes,
                isActive,
                updatedAt: Date.now()
            },
            { new: true }
        );

        if (!offer) {
            return res.status(404).json({ message: "Offer not found" });
        }

        res.json({
            message: "Offer updated successfully",
            offer
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete Offer (Admin only)
exports.deleteOffer = async (req, res) => {
    try {
        const offer = await Offer.findByIdAndDelete(req.params.id);

        if (!offer) {
            return res.status(404).json({ message: "Offer not found" });
        }

        res.json({ message: "Offer deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
