const Razorpay = require("razorpay");
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});
const Booking = require("../models/Booking");
const { sendPaymentReceipt } = require("../utils/sendEmail");

// Create Order (Razorpay)
exports.createPaymentIntent = async (req, res) => {
    try {
        const { amount, bookingId, currency = "INR" } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100), // Razorpay uses paise (1 INR = 100 paise)
            currency,
            receipt: bookingId || `order_${Date.now()}`,
            notes: {
                bookingId: bookingId || ""
            }
        });

        res.json({
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            receipt: order.receipt
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Verify & Confirm Payment
exports.confirmPayment = async (req, res) => {
    try {
        const { razorpayPaymentId, razorpayOrderId, razorpaySignature, bookingId } = req.body;

        if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature || !bookingId) {
            return res.status(400).json({ message: "Missing required payment details" });
        }

        // Verify payment signature
        const crypto = require("crypto");
        const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
        hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
        const generated_signature = hmac.digest("hex");

        if (generated_signature !== razorpaySignature) {
            return res.status(400).json({ message: "Payment verification failed" });
        }

        // Fetch payment details from Razorpay to verify
        const payment = await razorpay.payments.fetch(razorpayPaymentId);

        if (payment.status !== "captured") {
            return res.status(400).json({
                message: "Payment not successful",
                status: payment.status
            });
        }

        // Update booking
        const booking = await Booking.findByIdAndUpdate(
            bookingId,
            {
                paymentStatus: "paid",
                bookingStatus: "confirmed",
                razorpayPaymentId: razorpayPaymentId,
                razorpayOrderId: razorpayOrderId,
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

        // Send payment receipt
        await sendPaymentReceipt(booking);

        res.json({
            message: "Payment confirmed successfully",
            booking
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Payment Status
exports.getPaymentStatus = async (req, res) => {
    try {
        const { paymentId } = req.params;

        const payment = await razorpay.payments.fetch(paymentId);

        res.json({
            status: payment.status,
            amount: payment.amount / 100, // Convert paise to INR
            currency: payment.currency,
            method: payment.method,
            email: payment.email,
            contact: payment.contact
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Refund Payment
exports.refundPayment = async (req, res) => {
    try {
        const { bookingId, reason } = req.body;

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ message: "Booking not found" });
        }

        if (booking.paymentStatus !== "paid") {
            return res.status(400).json({ message: "Only paid bookings can be refunded" });
        }

        if (!booking.razorpayPaymentId) {
            return res.status(400).json({ message: "No payment ID found for refund" });
        }

        // Create refund with Razorpay
        const refund = await razorpay.payments.refund(booking.razorpayPaymentId, {
            amount: Math.round(booking.totalPrice * 100), // Paise
            notes: {
                reason: reason || "requested_by_customer",
                bookingId: bookingId
            }
        });

        // Update booking
        booking.paymentStatus = "refunded";
        booking.bookingStatus = "cancelled";
        await booking.save();

        res.json({
            message: "Refund processed successfully",
            refundId: refund.id,
            refundAmount: refund.amount / 100, // Convert to INR
            status: refund.status,
            booking
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Webhook for Razorpay Events
exports.handleRazorpayWebhook = async (req, res) => {
    try {
        const crypto = require("crypto");
        const event = req.body;

        // Verify webhook signature
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "";
        if (webhookSecret) {
            const hmac = crypto.createHmac("sha256", webhookSecret);
            hmac.update(JSON.stringify(event));
            const digest = hmac.digest("hex");
            const signature = req.headers["x-razorpay-signature"];

            if (digest !== signature) {
                return res.status(400).json({ message: "Webhook verification failed" });
            }
        }

        switch (event.event) {
            case "order.paid":
                console.log("Order paid:", event.payload.order.entity.id);
                break;
            case "payment.authorized":
                console.log("Payment authorized:", event.payload.payment.entity.id);
                break;
            case "payment.failed":
                console.log("Payment failed:", event.payload.payment.entity.id);
                break;
            case "refund.created":
                console.log("Refund created:", event.payload.refund.entity.id);
                break;
            default:
                console.log("Unhandled event type:", event.event);
        }

        res.json({ received: true });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
