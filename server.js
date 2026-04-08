const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// ==================== ENVIRONMENT VALIDATION ====================
const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// Warn if critical variables are missing (but don't crash)
if (!MONGO_URI) {
    console.warn("⚠️  WARNING: MONGO_URI environment variable is not set");
}
if (!JWT_SECRET) {
    console.warn("⚠️  WARNING: JWT_SECRET environment variable is not set");
}

// ==================== MIDDLEWARE ====================
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true
}));

// Serve static files from public folder (for uploaded images)
app.use("/images", express.static("public/images"));

// ==================== ROOT & HEALTH CHECK ROUTES ====================
// Root route - critical for Render health checks
app.get("/", (req, res) => {
    res.json({
        status: "API is running",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development"
    });
});

// Health check endpoint
app.get("/api/health", (req, res) => {
    res.json({
        status: "Server is running",
        mongoConnected: mongoose.connection.readyState === 1,
        timestamp: new Date().toISOString()
    });
});

// ==================== DATABASE CONNECTION ====================
let dbConnected = false;

const connectDatabase = async () => {
    try {
        if (!MONGO_URI) {
            throw new Error("MONGO_URI environment variable is not defined");
        }

        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            retryWrites: true,
            w: "majority"
        });

        dbConnected = true;
        console.log("✓ MongoDB Connected Successfully");
        return true;
    } catch (err) {
        console.error("✗ MongoDB Connection Error:", err.message);
        dbConnected = false;
        // Don't process.exit() - keep server running, can retry connection
        return false;
    }
};

// ==================== API ROUTES ====================
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/rooms", require("./routes/roomRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/offers", require("./routes/offerRoutes"));
app.use("/api/payments", require("./routes/paymentRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));

// ==================== ERROR HANDLING ====================
// Error handling middleware
app.use((err, req, res, next) => {
    console.error("❌ Error caught:", {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method
    });

    res.status(err.status || 500).json({
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "production" ? undefined : err.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found",
        path: req.url
    });
});

// ==================== PROCESS ERROR HANDLERS ====================
// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
    console.error("💥 Uncaught Exception:", err);
    // Log but don't crash - let the process continue
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
    console.error("⚠️  Unhandled Rejection at:", promise, "reason:", reason);
    // Log but don't crash - let the process continue
});

// ==================== SERVER STARTUP ====================
const startServer = async () => {
    // Try to connect to database
    const connected = await connectDatabase();

    if (!connected && MONGO_URI) {
        console.log("⏳ MongoDB connection failed, but server will start anyway");
        console.log("   Attempting to reconnect...");
    }

    const server = app.listen(PORT, () => {
        console.log(`✓ Server running on port ${PORT}`);
        console.log(`✓ Environment: ${process.env.NODE_ENV || "development"}`);
        console.log(`✓ MongoDB: ${dbConnected ? "Connected" : "Connecting..."}`);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
        console.log("SIGTERM received, shutting down gracefully");
        server.close(() => {
            console.log("Server closed");
            process.exit(0);
        });
    });

    return server;
};

// Start the server
startServer().catch(err => {
    console.error("Failed to start server:", err);
});
