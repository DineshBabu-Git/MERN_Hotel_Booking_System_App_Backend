const Booking = require("../models/Booking");
const Review = require("../models/Review");
const Room = require("../models/Room");
const User = require("../models/User");

// Get Dashboard Stats
exports.getDashboardStats = async (req, res) => {
    try {
        const totalBookings = await Booking.countDocuments();
        const totalRevenue = await Booking.aggregate([
            { $match: { paymentStatus: "paid" } },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
        ]);
        const totalUsers = await User.countDocuments({ role: "user" });
        const totalRooms = await Room.countDocuments();
        const pendingReviews = await Review.countDocuments({ isApproved: false });
        const cancelledBookings = await Booking.countDocuments({ bookingStatus: "cancelled" });

        res.json({
            totalBookings,
            totalRevenue: totalRevenue[0]?.total || 0,
            totalUsers,
            totalRooms,
            pendingReviews,
            cancelledBookings
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Monthly Revenue Report
exports.getMonthlyRevenue = async (req, res) => {
    try {
        const revenue = await Booking.aggregate([
            {
                $match: { paymentStatus: "paid" }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" }
                    },
                    totalRevenue: { $sum: "$totalPrice" },
                    totalBookings: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": -1, "_id.month": -1 }
            },
            {
                $limit: 12 // Last 12 months
            }
        ]);

        // Transform to match frontend expectations
        const formatted = revenue.map(item => ({
            month: new Date(item._id.year, item._id.month - 1),
            revenue: item.totalRevenue
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Occupancy Rate
exports.getOccupancyRate = async (req, res) => {
    try {
        const totalRooms = await Room.countDocuments();
        const confirmedBookings = await Booking.countDocuments({
            bookingStatus: { $in: ["confirmed", "completed"] }
        });

        const occupancyRate = totalRooms > 0 ? (confirmedBookings / totalRooms) * 100 : 0;

        res.json({
            totalRooms,
            occupiedRooms: confirmedBookings,
            occupancyRate: Math.round(occupancyRate * 10) / 10
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Booking Trends
exports.getBookingTrends = async (req, res) => {
    try {
        const trends = await Booking.aggregate([
            {
                $group: {
                    _id: {
                        date: {
                            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                        }
                    },
                    bookingCount: { $sum: 1 },
                    revenue: {
                        $sum: {
                            $cond: [
                                { $eq: ["$paymentStatus", "paid"] },
                                "$totalPrice",
                                0
                            ]
                        }
                    }
                }
            },
            {
                $sort: { "_id.date": -1 }
            },
            {
                $limit: 30 // Last 30 days
            }
        ]);

        // Transform to match frontend expectations
        const formatted = trends.map(item => ({
            date: item._id.date,
            bookingCount: item.bookingCount,
            revenue: item.revenue
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Room Performance
exports.getRoomPerformance = async (req, res) => {
    try {
        const performance = await Booking.aggregate([
            {
                $match: { paymentStatus: "paid" }
            },
            {
                $group: {
                    _id: "$roomId",
                    bookingCount: { $sum: 1 },
                    totalRevenue: { $sum: "$totalPrice" },
                    averagePrice: { $avg: "$totalPrice" }
                }
            },
            {
                $lookup: {
                    from: "rooms",
                    localField: "_id",
                    foreignField: "_id",
                    as: "roomDetails"
                }
            },
            {
                $unwind: "$roomDetails"
            },
            {
                $sort: { totalRevenue: -1 }
            }
        ]);

        // Transform to match frontend expectations
        const formatted = performance.map(item => ({
            name: item.roomDetails.name,
            roomType: item.roomDetails.roomType,
            bookingCount: item.bookingCount,
            totalRevenue: item.totalRevenue,
            averageRating: item.roomDetails.rating || 0
        }));

        res.json(formatted);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Review Analytics
exports.getReviewAnalytics = async (req, res) => {
    try {
        const analytics = await Review.aggregate([
            {
                $group: {
                    _id: "$rating",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: -1 }
            }
        ]);

        const totalReviews = await Review.countDocuments();
        const approvedReviews = await Review.countDocuments({ isApproved: true });

        // Transform rating distribution to object with numeric keys
        const ratingDistribution = {};
        for (let i = 1; i <= 5; i++) {
            const found = analytics.find(a => a._id === i);
            ratingDistribution[i] = found ? found.count : 0;
        }

        res.json({
            ratingDistribution,
            totalReviews,
            approvedReviews,
            pendingReviews: totalReviews - approvedReviews,
            averageRating: await getAverageRating()
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get User Demographics
exports.getUserDemographics = async (req, res) => {
    try {
        const recentUsers = await User.aggregate([
            { $match: { role: "user" } },
            { $sort: { createdAt: -1 } },
            { $limit: 20 },
            {
                $lookup: {
                    from: "bookings",
                    localField: "_id",
                    foreignField: "userId",
                    as: "userBookings"
                }
            },
            {
                $project: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    phone: 1,
                    createdAt: 1,
                    totalBookings: { $size: "$userBookings" }
                }
            }
        ]);

        // Return as array directly since frontend expects array
        res.json(recentUsers);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Helper function to get average rating
async function getAverageRating() {
    const result = await Review.aggregate([
        { $match: { isApproved: true } },
        { $group: { _id: null, average: { $avg: "$rating" } } }
    ]);
    return result[0]?.average || 0;
}
