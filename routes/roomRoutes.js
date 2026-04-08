

const express = require("express");
const router = express.Router();
const roomController = require("../controllers/roomController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Admin routes - POST, PUT, DELETE before GET
router.post("/", protect, adminOnly, roomController.createRoom);

// Public routes - specific routes BEFORE parameterized routes
router.get("/mock", roomController.getMockRooms);
router.get("/availability", roomController.checkAvailability);
router.get("/", roomController.getAllRooms);
router.get("/:id/reviews", roomController.getRoomReviews);
router.get("/:id", roomController.getRoomById);

// Admin routes - parameterized
router.put("/:id", protect, adminOnly, roomController.updateRoom);
router.delete("/:id", protect, adminOnly, roomController.deleteRoom);

module.exports = router;
