
const express = require("express");
const router = express.Router();
const offerController = require("../controllers/offerController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Public routes
router.get("/active", offerController.getActiveOffers);
router.post("/validate", offerController.validateOffer);

// Admin routes
router.post("/", protect, adminOnly, offerController.createOffer);
router.get("/", protect, adminOnly, offerController.getAllOffers);
router.put("/:id", protect, adminOnly, offerController.updateOffer);
router.delete("/:id", protect, adminOnly, offerController.deleteOffer);

module.exports = router;
