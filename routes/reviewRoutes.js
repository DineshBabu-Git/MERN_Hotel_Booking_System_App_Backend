
const express = require("express");
const router = express.Router();
const reviewController = require("../controllers/reviewController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Non-parameterized routes first
router.post("/", protect, reviewController.createReview);
router.get("/my-reviews", protect, reviewController.getMyReviews);
router.get("/", protect, adminOnly, reviewController.getAllReviews);

// Routes with specific parameter pattern before generic :id
router.get("/room/:roomId", reviewController.getRoomReviews);

// Generic parameter routes last
router.put("/:id/approve", protect, adminOnly, reviewController.approveReview);
router.put("/:id/response", protect, adminOnly, reviewController.addAdminResponse);
router.put("/:id", protect, reviewController.updateReview);
router.delete("/:id", protect, reviewController.deleteReview);

module.exports = router;
