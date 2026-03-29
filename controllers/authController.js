const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Register User
exports.register = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({ message: "Name, email and password are required" });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            role: "user"
        });

        // Generate token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET
        );

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Login User
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        // Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Profile
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
            .select("-password")
            .populate("savedRooms");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json(user);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Update Profile
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, address, city, state, zipCode, profilePhoto, preferences } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            {
                name,
                phone,
                address,
                city,
                state,
                zipCode,
                profilePhoto,
                preferences,
                updatedAt: Date.now()
            },
            { new: true }
        ).select("-password");

        res.json({
            message: "Profile updated successfully",
            user
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Save Room to Favorites
exports.saveRoom = async (req, res) => {
    try {
        const { roomId } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $addToSet: { savedRooms: roomId } },
            { new: true }
        ).populate("savedRooms");

        res.json({
            message: "Room saved successfully",
            user
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Remove Saved Room
exports.removeSavedRoom = async (req, res) => {
    try {
        const { roomId } = req.body;

        const user = await User.findByIdAndUpdate(
            req.user.id,
            { $pull: { savedRooms: roomId } },
            { new: true }
        ).populate("savedRooms");

        res.json({
            message: "Room removed from favorites",
            user
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
