const express = require("express");
const Ride = require("../models/Ride");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// Get all rides
router.get("/", async (req, res) => {
    const rides = await Ride.find().populate("bookedUsers").populate("driver");
    res.json(rides);
});

// Add a ride
router.post("/", authMiddleware, async (req, res) => {
    const { from, to, time, seats, price, vehicle } = req.body;

    try {
        const ride = await Ride.create({
            from,
            to,
            time,
            seats,
            price,
            vehicle,
            driver: req.user._id,
        });
        res.status(201).json(ride);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


router.post("/book-ride/:rideId", authMiddleware, async (req, res) => {
    const { rideId } = req.params;
    const userId = req.user.id;

    try {
        const ride = await Ride.findById(rideId);
        if (!ride) {
            return res.status(404).json({ message: "Ride not found" });
        }

        if (ride.seats < 1) {
            return res.status(400).json({ message: "No seats available" });
        }

        // Update the ride details
        ride.seats -= 1;
        ride.bookedUsers.push(userId);

        await ride.save();

        res.status(200).json({ message: "Ride booked successfully!", ride });
    } catch (error) {
        console.error("Error booking ride:", error);
        res.status(500).json({ message: "Internal server error" });
    }
});

module.exports = router;
