import Ride from '../models/Ride.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { calculateFare, findClosestPointOnRoute } from '../utils/rideUtils.js';
import fetch from 'node-fetch';

const MATCHING_THRESHOLD = 20; 
const OPENROUTESERVICE_API_KEY = process.env.OPENROUTESERVICE_API_KEY;

export const addRide = async (req, res) => {
    try {
        const driver = await User.findById(req.user._id);
        if (driver.verificationStatus !== 'verified') {
            return res.status(403).json({ message: 'Forbidden: You must be a verified driver to offer a ride.' });
        }

        const { origin, destination, departureTime, seats, maxDetour, vehicleType, vehicleNumber } = req.body;
        
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
        const distance = routeData.features[0].properties.summary.distance / 1000;
        const fare = calculateFare(distance, vehicleType);

        const ride = new Ride({
            driver: req.user._id,
            origin,
            destination,
            departureTime,
            totalSeats: seats,
            availableSeats: seats,
            fare,
            routePath,
            distance,
            maxDetourDistance: maxDetour,
            vehicleType,
            vehicleNumber,
        });

        await ride.save();
        res.status(201).json(ride);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error while adding ride' });
    }
};

export const searchRides = async (req, res) => {
    const { start, end, vehicleType } = req.body;
    const riderStartPoint = { lat: start.lat, lon: start.lon };
    const riderEndPoint = { lat: end.lat, lon: end.lon };

    try {
        const query = {
            departureTime: { $gt: new Date() },
            availableSeats: { $gt: 0 },
            driver: { $ne: req.user._id }
        };

        if (vehicleType && vehicleType !== 'All') {
            query.vehicleType = vehicleType;
        }

        const availableRides = await Ride.find(query).populate('driver', 'name');
        const matchedRides = [];

        for (const ride of availableRides) {
            if (!ride.routePath || !ride.routePath.coordinates) continue;

            const driverRoute = ride.routePath.coordinates;
            const pickup = findClosestPointOnRoute(riderStartPoint, driverRoute);
            const dropoff = findClosestPointOnRoute(riderEndPoint, driverRoute);

            const isPickupCloseEnough = pickup.distance <= MATCHING_THRESHOLD;
            const isDropoffCloseEnough = dropoff.distance <= MATCHING_THRESHOLD;
            const isOrderCorrect = dropoff.index > pickup.index;

            if (isPickupCloseEnough && isDropoffCloseEnough && isOrderCorrect) {
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

                    if (detourDistance <= ride.maxDetourDistance) {
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

export const getUserRides = async (req, res) => {
    try {
        const driving = await Ride.find({ driver: req.user._id }).populate('riders', 'name');
        const riding = await Ride.find({ riders: req.user._id }).populate('driver', 'name');
        res.json({ driving, riding });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

export const cancelBooking = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id).populate('driver', 'name');
        if (!ride) return res.status(404).json({ message: 'Ride not found' });
        if (new Date(ride.departureTime) < new Date()) return res.status(400).json({ message: 'Cannot cancel a past ride' });

        const riderIndex = ride.riders.findIndex(id => id.equals(req.user._id));
        if (riderIndex > -1) {
            ride.riders.splice(riderIndex, 1);
            ride.availableSeats += 1;
            await ride.save();

            await Notification.create({
                user: ride.driver._id,
                message: `${req.user.name} has canceled their booking for your ride to ${ride.destination.address.split(',')[0]}.`,
                rideId: ride._id,
            });

            res.json({ message: 'Booking cancelled successfully' });
        } else {
            res.status(400).json({ message: 'You have not booked this ride' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


export const cancelRide = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id).populate('driver', 'name');
        if (!ride) return res.status(404).json({ message: 'Ride not found' });
        if (!ride.driver.equals(req.user._id)) return res.status(401).json({ message: 'Not authorized to cancel this ride' });
        if (new Date(ride.departureTime) < new Date()) return res.status(400).json({ message: 'Cannot cancel a past ride' });

        const riderNotificationPromises = ride.riders.map(riderId => {
            return Notification.create({
                user: riderId,
                message: `Your driver, ${ride.driver.name}, has canceled the ride to ${ride.destination.address.split(',')[0]}.`,
                rideId: ride._id,
            });
        });
        await Promise.all(riderNotificationPromises);

        await Ride.deleteOne({ _id: req.params.id });
        res.json({ message: 'Ride cancelled successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

