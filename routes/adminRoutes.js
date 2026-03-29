
const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Dashboard and Analytics
router.get("/dashboard", protect, adminOnly, adminController.getDashboardStats);
router.get("/revenue/monthly", protect, adminOnly, adminController.getMonthlyRevenue);
router.get("/occupancy", protect, adminOnly, adminController.getOccupancyRate);
router.get("/trends/booking", protect, adminOnly, adminController.getBookingTrends);
router.get("/performance/rooms", protect, adminOnly, adminController.getRoomPerformance);
router.get("/analytics/reviews", protect, adminOnly, adminController.getReviewAnalytics);
router.get("/demographics/users", protect, adminOnly, adminController.getUserDemographics);

module.exports = router;
