const Review = require("../models/Review");
const Booking = require("../models/Booking");
const Room = require("../models/Room");
const User = require("../models/User");
const { sendReviewApprovalEmail } = require("../utils/sendEmail");

// Create Review
exports.createReview = async (req, res) => {
    try {
        const { roomId, bookingId, rating, comment, cleanlinessRating, serviceRating, amenitiesRating } = req.body;

        // Validate input
        if (!roomId || !rating || !comment) {
            return res.status(400).json({ message: "Room, rating and comment are required" });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }

        // Check if user has booked this room
        const hasBooked = await Booking.findOne({
            userId: req.user.id,
            roomId,
            bookingStatus: "completed"
        });

        // Allow review even if booking is confirmed (for completed stays)
        if (!hasBooked) {
            // Check if at least booking exists
            const booking = await Booking.find({
                userId: req.user.id,
                roomId,
                bookingStatus: { $in: ["confirmed", "completed"] }
            });

            if (booking.length === 0) {
                return res.status(403).json({ message: "You must book this room to review it" });
            }
        }

        // Check if user already reviewed this room
        const existingReview = await Review.findOne({
            userId: req.user.id,
            roomId
        });

        if (existingReview) {
            return res.status(400).json({ message: "You have already reviewed this room" });
        }

        // Create review
        const review = await Review.create({
            userId: req.user.id,
            roomId,
            bookingId,
            rating,
            comment,
            cleanlinessRating,
            serviceRating,
            amenitiesRating,
            isApproved: false
        });

        res.status(201).json({
            message: "Review submitted successfully. Admin will approve it soon.",
            review: await review.populate("userId", "name profilePhoto")
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Room Reviews
exports.getRoomReviews = async (req, res) => {
    try {
        const reviews = await Review.find({
            roomId: req.params.roomId,
            isApproved: true
        })
            .populate("userId", "name profilePhoto")
            .sort({ createdAt: -1 });

        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get My Reviews
exports.getMyReviews = async (req, res) => {
    try {
        const reviews = await Review.find({ userId: req.user.id })
            .populate("roomId", "name")
            .sort({ createdAt: -1 });

        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update Review
exports.updateReview = async (req, res) => {
    try {
        const { rating, comment, cleanlinessRating, serviceRating, amenitiesRating } = req.body;

        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        // Check authorization
        if (review.userId.toString() !== req.user.id) {
            return res.status(403).json({ message: "Not authorized" });
        }

        // Update review
        review.rating = rating || review.rating;
        review.comment = comment || review.comment;
        review.cleanlinessRating = cleanlinessRating || review.cleanlinessRating;
        review.serviceRating = serviceRating || review.serviceRating;
        review.amenitiesRating = amenitiesRating || review.amenitiesRating;
        review.isApproved = false; // Reset approval after edit
        review.updatedAt = Date.now();

        await review.save();

        res.json({
            message: "Review updated successfully",
            review: await review.populate("userId", "name profilePhoto")
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Delete Review
exports.deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);

        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        // Check authorization
        if (review.userId.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized" });
        }

        await Review.findByIdAndDelete(req.params.id);

        res.json({ message: "Review deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Admin - Approve Review
exports.approveReview = async (req, res) => {
    try {
        // Fetch review with full user and room details
        const review = await Review.findById(req.params.id)
            .populate("userId", "name email")
            .populate("roomId", "roomNumber roomType name price");

        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        // Check if user and email exist
        if (!review.userId || !review.userId.email) {
            console.error("Review user or email not found for review:", req.params.id);
            return res.status(400).json({ message: "Cannot approve review: User email not found" });
        }

        // Update review approval status
        review.isApproved = true;
        review.updatedAt = Date.now();
        await review.save();

        // Update room rating
        await updateRoomRating(review.roomId._id);

        // Send approval notification email to user
        let emailSent = false;
        try {
            const user = review.userId;
            const room = review.roomId;
            
            console.log(`Sending review approval email to: ${user.email}`);
            
            await sendReviewApprovalEmail(
                user.email,
                user.name || "Guest",
                room.roomType || room.roomNumber || "Your Stayed Room",
                review.comment
            );
            
            emailSent = true;
            console.log(`✓ Email sent successfully to ${user.email}`);
        } catch (emailError) {
            console.error("⚠ Email sending failed for review approval:", emailError.message);
            // Continue with response even if email fails
        }

        res.json({
            message: emailSent 
                ? "Review approved successfully! Notification email sent to user."
                : "Review approved successfully. (Email notification encountered an issue)",
            review: {
                _id: review._id,
                isApproved: review.isApproved,
                userId: review.userId,
                rating: review.rating,
                comment: review.comment
            },
            emailSent
        });
    } catch (err) {
        console.error("Error in approveReview:", err);
        res.status(500).json({ message: "Error approving review: " + err.message });
    }
};

// Admin - Add Response to Review
exports.addAdminResponse = async (req, res) => {
    try {
        const { response } = req.body;

        if (!response) {
            return res.status(400).json({ message: "Response is required" });
        }

        const review = await Review.findByIdAndUpdate(
            req.params.id,
            { adminResponse: response, updatedAt: Date.now() },
            { new: true }
        ).populate("userId", "name profilePhoto");

        if (!review) {
            return res.status(404).json({ message: "Review not found" });
        }

        res.json({
            message: "Response added successfully",
            review
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Admin - Get All Reviews
exports.getAllReviews = async (req, res) => {
    try {
        const { isApproved, roomId } = req.query;

        let filter = {};
        if (isApproved !== undefined) filter.isApproved = isApproved === "true";
        if (roomId) filter.roomId = roomId;

        const reviews = await Review.find(filter)
            .populate("userId", "name profilePhoto")
            .populate("roomId", "name")
            .sort({ createdAt: -1 });

        res.json(reviews);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Helper function to update room rating
async function updateRoomRating(roomId) {
    try {
        const reviews = await Review.find({
            roomId,
            isApproved: true
        });

        if (reviews.length === 0) {
            await Room.findByIdAndUpdate(roomId, {
                rating: 0,
                ratingCount: 0
            });
            return;
        }

        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = totalRating / reviews.length;

        await Room.findByIdAndUpdate(roomId, {
            rating: Math.round(averageRating * 10) / 10,
            ratingCount: reviews.length
        });
    } catch (err) {
        console.error("Error updating room rating:", err);
    }
}
