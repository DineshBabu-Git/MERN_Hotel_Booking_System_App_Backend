
const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

// Razorpay order routes
router.post("/create-order", protect, paymentController.createPaymentIntent);
router.post("/verify", protect, paymentController.confirmPayment);
router.get("/:paymentId/status", protect, paymentController.getPaymentStatus);
router.post("/refund", protect, paymentController.refundPayment);

// Webhook
router.post("/webhook", paymentController.handleRazorpayWebhook);

module.exports = router;
