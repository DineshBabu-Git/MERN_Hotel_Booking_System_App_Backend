
const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// More specific routes first
router.get("/my-bookings", protect, bookingController.getMyBookings);
router.put("/:id/confirm", protect, bookingController.confirmBooking);
router.put("/:id/cancel", protect, bookingController.cancelBooking);
router.put("/:id/status", protect, adminOnly, bookingController.updateBookingStatus);

// Less specific routes last
router.post("/", protect, bookingController.createBooking);
router.get("/:id", protect, bookingController.getBookingById);
router.get("/", protect, adminOnly, bookingController.getAllBookings);

module.exports = router;
