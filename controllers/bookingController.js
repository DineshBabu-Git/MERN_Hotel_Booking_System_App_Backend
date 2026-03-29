const Booking = require("../models/Booking");
const Room = require("../models/Room");
const { sendBookingConfirmation, sendCancellationEmail } = require("../utils/sendEmail");

// Helper function to check room availability
const isRoomAvailable = async (roomId, checkIn, checkOut, excludeBookingId = null) => {
    let query = {
        roomId,
        checkIn: { $lt: new Date(checkOut) },
        checkOut: { $gt: new Date(checkIn) },
        bookingStatus: { $ne: "cancelled" }
    };

    if (excludeBookingId) {
        query._id = { $ne: excludeBookingId };
    }

    const overlappingBookings = await Booking.find(query);
    return overlappingBookings.length === 0;
};

// Create Booking
exports.createBooking = async (req, res) => {
    try {
        const { roomId, checkIn, checkOut, numberOfGuests, specialRequests, guestEmail, guestPhone, discountCode } = req.body;

        // Validate input
        if (!roomId || !checkIn || !checkOut || !numberOfGuests || !guestEmail || !guestPhone) {
            return res.status(400).json({ message: "Missing required fields (Email and Phone are mandatory)" });
        }

        // Check if room exists (allow mock rooms stored in DB)
        let room;
        try {
            room = await Room.findById(roomId);
        } catch (e) {
            // invalid ObjectId, try fallback
            room = null;
        }
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        // Check availability
        const available = await isRoomAvailable(roomId, checkIn, checkOut);
        if (!available) {
            return res.status(400).json({ message: "Room not available for selected dates" });
        }

        // Calculate number of nights
        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const numberOfNights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));

        if (numberOfNights <= 0) {
            return res.status(400).json({ message: "Check-out date must be after check-in date" });
        }

        // limit guests per room and global cap
        if (numberOfGuests > 6 || (room.maxGuests && numberOfGuests > room.maxGuests)) {
            return res.status(400).json({ message: `Number of guests exceeds allowed limit (max ${room.maxGuests} guests)` });
        }

        // Calculate price
        let totalPrice = room.price * numberOfNights;
        let discountAmount = 0;

        // Apply discount if provided
        if (discountCode) {
            const Offer = require("../models/Offer");
            const offer = await Offer.findOne({
                code: discountCode.toUpperCase(),
                isActive: true,
                validTill: { $gte: new Date() },
                $expr: { $lt: ["$usedCount", "$usageLimit"] }
            });

            if (offer) {
                if (offer.discountType === "percentage") {
                    discountAmount = (totalPrice * offer.discount) / 100;
                    if (offer.maxDiscount) {
                        discountAmount = Math.min(discountAmount, offer.maxDiscount);
                    }
                } else {
                    discountAmount = offer.discount;
                }
                totalPrice -= discountAmount;
            }
        }

        // Create booking
        const booking = await Booking.create({
            userId: req.user.id,
            roomId,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            numberOfGuests,
            numberOfNights,
            totalPrice: Math.max(totalPrice, 0),
            originalPrice: room.price * numberOfNights,
            discountCode,
            discountAmount,
            specialRequests,
            guestEmail: guestEmail || req.user.email,
            guestPhone,
            paymentStatus: "pending",
            bookingStatus: "pending"
        });

        res.status(201).json({
            message: "Booking created successfully",
            booking: await booking.populate("roomId")
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get My Bookings
exports.getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.user.id })
            .populate("roomId")
            .sort({ createdAt: -1 });

        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Booking by ID
exports.getBookingById = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate("roomId")
            .populate("userId", "name email phone");

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Check authorization
        if (booking.userId._id.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized" });
        }

        res.json(booking);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Confirm Booking (After Payment)
exports.confirmBooking = async (req, res) => {
    try {
        const { razorpayPaymentId, razorpayOrderId } = req.body;

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            {
                paymentStatus: "paid",
                bookingStatus: "confirmed",
                razorpayPaymentId,
                razorpayOrderId,
                updatedAt: Date.now()
            },
            { new: true }
        ).populate("roomId");

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Increment offer usage count if discount code was used
        if (booking.discountCode) {
            const Offer = require("../models/Offer");
            await Offer.findOneAndUpdate(
                { code: booking.discountCode.toUpperCase() },
                { $inc: { usedCount: 1 } },
                { new: true }
            );
        }

        // Send confirmation email
        try {
            await sendBookingConfirmation(booking);
        } catch (emailErr) {
            console.error("Error sending booking confirmation email:", emailErr.message);
            // Don't fail the booking confirmation if email fails
        }

        res.json({
            message: "Booking confirmed successfully",
            booking
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Cancel Booking
exports.cancelBooking = async (req, res) => {
    try {
        // Safely get cancellation reason with fallback
        const cancellationReason = req.body?.cancellationReason || "No reason provided";

        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Check authorization - properly compare ObjectId with string
        const bookingUserId = booking.userId ? booking.userId.toString() : null;
        const currentUserId = req.user?.id;
        const isOwner = bookingUserId === currentUserId;
        const isAdmin = req.user?.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({ message: "Not authorized to cancel this booking" });
        }

        // Check if booking can be cancelled
        if (["cancelled", "completed"].includes(booking.bookingStatus)) {
            return res.status(400).json({ message: "This booking cannot be cancelled" });
        }

        booking.bookingStatus = "cancelled";
        booking.cancellationReason = cancellationReason;
        booking.cancelledAt = Date.now();

        // Refund if payment was made
        if (booking.paymentStatus === "paid") {
            booking.paymentStatus = "refunded";
        }

        await booking.save();

        // Send cancellation email
        try {
            await sendCancellationEmail(booking);
        } catch (emailErr) {
            console.error("Email sending failed:", emailErr);
            // Don't fail the cancellation if email fails
        }

        res.json({
            message: "Booking cancelled successfully",
            booking
        });
    } catch (err) {
        console.error("Cancel booking error:", err);
        res.status(500).json({ message: err.message });
    }
};

// Admin - Get All Bookings
exports.getAllBookings = async (req, res) => {
    try {
        const { status, paymentStatus, roomId } = req.query;

        let filter = {};
        if (status) filter.bookingStatus = status;
        if (paymentStatus) filter.paymentStatus = paymentStatus;
        if (roomId) filter.roomId = roomId;

        const bookings = await Booking.find(filter)
            .populate("userId", "name email phone")
            .populate("roomId")
            .sort({ createdAt: -1 });

        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Admin - Update Booking Status
exports.updateBookingStatus = async (req, res) => {
    try {
        const { bookingStatus, paymentStatus } = req.body;

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            {
                bookingStatus,
                paymentStatus,
                updatedAt: Date.now()
            },
            { new: true }
        ).populate("roomId").populate("userId", "name email phone");

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        // Send status update email
        try {
            const statusEmailContent = {
                pending: { title: "Booking Pending", message: "Your booking is awaiting confirmation from the hotel." },
                confirmed: { title: "Booking Confirmed!", message: "Your booking has been confirmed. You can now proceed with payment if not already done." },
                cancelled: { title: "Booking Cancelled", message: "Your booking has been cancelled. If you had made a payment, it will be refunded shortly." },
                completed: { title: "Booking Completed", message: "Your stay is complete. Thank you for choosing us! Please consider leaving a review." }
            };

            const content = statusEmailContent[bookingStatus] || { title: "Booking Update", message: `Your booking status has been updated to ${bookingStatus}` };

            const { sendCustomEmail } = require("../utils/sendEmail");
            await sendCustomEmail({
                to: booking.guestEmail,
                subject: `${content.title} - Hotel Booking System (ID: ${booking._id})`,
                html: `
                    <h2>${content.title}</h2>
                    <p>Dear ${booking.userId.name},</p>
                    <p>${content.message}</p>
                    <h3>Booking Details:</h3>
                    <ul>
                        <li><strong>Booking ID:</strong> ${booking._id}</li>
                        <li><strong>Room:</strong> ${booking.roomId.name}</li>
                        <li><strong>Check-in:</strong> ${new Date(booking.checkIn).toLocaleDateString()}</li>
                        <li><strong>Check-out:</strong> ${new Date(booking.checkOut).toLocaleDateString()}</li>
                        <li><strong>Total Price:</strong> $${booking.totalPrice.toFixed(2)}</li>
                        <li><strong>Status:</strong> ${bookingStatus.charAt(0).toUpperCase() + bookingStatus.slice(1)}</li>
                    </ul>
                    <p>Best regards,<br>Hotel Management Team</p>
                `
            });
        } catch (emailErr) {
            console.error("Error sending status update email:", emailErr);
        }

        res.json({
            message: "Booking status updated successfully",
            booking
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
