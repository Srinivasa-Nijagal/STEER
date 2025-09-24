import Ride from '../models/Ride.js';
import User from '../models/User.js';
import { haversineDistance, calculateFare, findClosestPointOnRoute } from '../utils/rideUtils.js';
import fetch from 'node-fetch'; // Make sure to install node-fetch: npm install node-fetch

// Configurable thresholds for matching logic
const MATCHING_THRESHOLD = 20; // Max distance a rider can be from the path (in km)
const DETOUR_THRESHOLD = 3;   // Max extra distance the driver is willing to travel (in km)

// IMPORTANT: Add your OpenRouteService API key here
const OPENROUTESERVICE_API_KEY = process.env.OPENROUTESERVICE_API_KEY;
// @desc    Add a new ride
// @route   POST /api/rides/add
// @access  Private
export const addRide = async (req, res) => {
    const { origin, destination, departureTime, seats } = req.body;
    
    try {
        const driver = await User.findById(req.user._id);
        if (!driver) return res.status(404).json({ message: 'User not found' });

        const routeResponse = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
            method: 'POST',
            headers: {
                'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
                'Content-Type': 'application/json',
                'Authorization': OPENROUTESERVICE_API_KEY
            },
            body: JSON.stringify({ "coordinates": [[origin.lon, origin.lat], [destination.lon, destination.lat]] })
        });
        
        if (!routeResponse.ok) {
             const errorData = await routeResponse.json();
             console.error("ORS Error:", errorData);
             throw new Error('Failed to fetch route from routing service');
        }

        const routeData = await routeResponse.json();
        const routePath = routeData.features[0].geometry;
        const distance = routeData.features[0].properties.summary.distance / 1000; // in km

        const fare = calculateFare(distance);

        const ride = new Ride({
            driver: req.user._id,
            origin,
            destination,
            departureTime,
            totalSeats: seats,
            availableSeats: seats,
            fare,
            routePath: routePath,
            distance: distance, // Save original distance
        });

        await ride.save();
        res.status(201).json(ride);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while adding ride' });
    }
};

// @desc    Search for available rides with advanced detour check
// @route   POST /api/rides/search
// @access  Private
export const searchRides = async (req, res) => {
    const { start, end } = req.body;
    const riderStartPoint = { lat: start.lat, lon: start.lon };
    const riderEndPoint = { lat: end.lat, lon: end.lon };

    try {
        const availableRides = await Ride.find({
            departureTime: { $gt: new Date() },
            availableSeats: { $gt: 0 },
            driver: { $ne: req.user._id }
        }).populate('driver', 'name');

        const matchedRides = [];

        for (const ride of availableRides) {
            if (!ride.routePath || !ride.routePath.coordinates) continue;

            const driverRoute = ride.routePath.coordinates;
            const pickup = findClosestPointOnRoute(riderStartPoint, driverRoute);
            const dropoff = findClosestPointOnRoute(riderEndPoint, driverRoute);

            const isPickupCloseEnough = pickup.distance <= MATCHING_THRESHOLD;
            const isDropoffCloseEnough = dropoff.distance <= MATCHING_THRESHOLD;
            const isOrderCorrect = dropoff.index > pickup.index;

            // **STEP 1: Initial check**
            if (isPickupCloseEnough && isDropoffCloseEnough && isOrderCorrect) {
                // **STEP 2: Advanced Detour Check**
                const detourRouteCoords = [
                    [ride.origin.lon, ride.origin.lat],
                    [riderStartPoint.lon, riderStartPoint.lat],
                    [riderEndPoint.lon, riderEndPoint.lat],
                    [ride.destination.lon, ride.destination.lat]
                ];

                const routeResponse = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
                     method: 'POST',
                     headers: {
                         'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
                         'Content-Type': 'application/json',
                         'Authorization': OPENROUTESERVICE_API_KEY
                     },
                     body: JSON.stringify({ "coordinates": detourRouteCoords })
                });

                if (routeResponse.ok) {
                    const routeData = await routeResponse.json();
                    const newDistance = routeData.features[0].properties.summary.distance / 1000;
                    const detourDistance = newDistance - ride.distance;

                    // Only consider it a match if the detour is within the acceptable threshold
                    if (detourDistance <= DETOUR_THRESHOLD) {
                        matchedRides.push(ride);
                    }
                }
            }
        }

        res.json(matchedRides);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while searching rides' });
    }
};


// @desc    Book a seat on a ride
// @route   POST /api/rides/book/:id
// @access  Private
export const bookRide = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id);

        if (ride) {
            if (ride.availableSeats > 0) {
                if (ride.riders.includes(req.user._id)) {
                    return res.status(400).json({ message: 'You have already booked this ride' });
                }
                if (ride.driver.equals(req.user._id)) {
                    return res.status(400).json({ message: 'You cannot book your own ride' });
                }
                ride.availableSeats -= 1;
                ride.riders.push(req.user._id);
                await ride.save();
                res.json({ message: 'Ride booked successfully' });
            } else {
                res.status(400).json({ message: 'No available seats' });
            }
        } else {
            res.status(404).json({ message: 'Ride not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get rides for the logged-in user
// @route   GET /api/rides/my-rides
// @access  Private
export const getUserRides = async (req, res) => {
    try {
        const driving = await Ride.find({ driver: req.user._id }).populate('riders', 'name');
        const riding = await Ride.find({ riders: req.user._id }).populate('driver', 'name');
        res.json({ driving, riding });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

