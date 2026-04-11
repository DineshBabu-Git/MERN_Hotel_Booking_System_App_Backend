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
        // Validate Razorpay credentials
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            return res.status(500).json({
                success: false,
                message: "Payment gateway not configured. Please contact support.",
                data: null
            });
        }

        const { amount, bookingId, currency = "INR" } = req.body;

        // Validate required fields
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid amount. Amount must be greater than 0.",
                data: null
            });
        }

        const order = await razorpay.orders.create({
            amount: Math.round(amount * 100), // Razorpay uses Paise (1 Rupee = 100 Paise)
            currency,
            receipt: bookingId || `order_${Date.now()}`,
            notes: {
                bookingId: bookingId || ""
            }
        });

        res.status(201).json({
            success: true,
            message: "Payment order created successfully",
            data: {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                receipt: order.receipt
            },
            count: 1
        });
    } catch (err) {
        console.error("Error creating payment intent:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Failed to create payment order",
            data: null
        });
    }
};

// Verify & Confirm Payment
exports.confirmPayment = async (req, res) => {
    try {
        const { razorpayPaymentId, razorpayOrderId, razorpaySignature, bookingId } = req.body;

        console.log("Payment verification attempt:", { razorpayPaymentId, razorpayOrderId, razorpaySignature, bookingId });

        // Validate required fields
        if (!razorpayPaymentId || !razorpayOrderId || !razorpaySignature || !bookingId) {
            console.error("Missing payment fields:", {
                razorpayPaymentId: !!razorpayPaymentId,
                razorpayOrderId: !!razorpayOrderId,
                razorpaySignature: !!razorpaySignature,
                bookingId: !!bookingId
            });
            return res.status(400).json({
                success: false,
                message: "Missing required payment details",
                data: null
            });
        }

        // Verify payment signature
        const crypto = require("crypto");
        const hmac = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
        hmac.update(razorpayOrderId + "|" + razorpayPaymentId);
        const generated_signature = hmac.digest("hex");

        if (generated_signature !== razorpaySignature) {
            console.error("Signature mismatch:", {
                expected: generated_signature,
                received: razorpaySignature
            });
            return res.status(400).json({
                success: false,
                message: "Payment verification failed - Invalid signature",
                data: null
            });
        }

        // Fetch payment details from Razorpay to verify
        const payment = await razorpay.payments.fetch(razorpayPaymentId);

        console.log("Payment status from Razorpay:", payment.status);

        if (payment.status !== "captured") {
            console.error("Payment not captured. Status:", payment.status);
            return res.status(400).json({
                success: false,
                message: `Payment not successful. Status: ${payment.status}`,
                data: {
                    status: payment.status
                }
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
            console.error("Booking not found for ID:", bookingId);
            return res.status(404).json({
                success: false,
                message: "Booking not found",
                data: null
            });
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

        console.log("Payment confirmed successfully for booking:", bookingId);

        res.status(200).json({
            success: true,
            message: "Payment confirmed successfully",
            data: booking,
            count: 1
        });
    } catch (err) {
        console.error("Error confirming payment:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Failed to confirm payment",
            data: null
        });
    }
};

// Get Payment Status
exports.getPaymentStatus = async (req, res) => {
    try {
        const { paymentId } = req.params;

        if (!paymentId) {
            return res.status(400).json({
                success: false,
                message: "Payment ID is required",
                data: null
            });
        }

        const payment = await razorpay.payments.fetch(paymentId);

        res.status(200).json({
            success: true,
            message: "Payment status retrieved successfully",
            data: {
                status: payment.status,
                amount: payment.amount / 100, // Convert Paise to Rupee
                currency: payment.currency,
                method: payment.method,
                email: payment.email,
                contact: payment.contact
            },
            count: 1
        });
    } catch (err) {
        console.error("Error fetching payment status:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Failed to fetch payment status",
            data: null
        });
    }
};

// Refund Payment
exports.refundPayment = async (req, res) => {
    try {
        const { bookingId, reason } = req.body;

        if (!bookingId) {
            return res.status(400).json({
                success: false,
                message: "Booking ID is required",
                data: null
            });
        }

        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: "Booking not found",
                data: null
            });
        }

        if (booking.paymentStatus !== "paid") {
            return res.status(400).json({
                success: false,
                message: "Only paid bookings can be refunded",
                data: null
            });
        }

        if (!booking.razorpayPaymentId) {
            return res.status(400).json({
                success: false,
                message: "No payment ID found for refund",
                data: null
            });
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

        res.status(200).json({
            success: true,
            message: "Refund processed successfully",
            data: {
                refundId: refund.id,
                refundAmount: refund.amount / 100, // Convert to USD
                status: refund.status,
                booking
            },
            count: 1
        });
    } catch (err) {
        console.error("Error processing refund:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Failed to process refund",
            data: null
        });
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
                return res.status(400).json({
                    success: false,
                    message: "Webhook verification failed",
                    data: null
                });
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

        res.status(200).json({
            success: true,
            message: "Webhook processed successfully",
            data: { received: true }
        });
    } catch (err) {
        console.error("Error processing webhook:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Failed to process webhook",
            data: null
        });
    }
};
