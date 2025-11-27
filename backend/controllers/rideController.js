import Ride from '../models/Ride.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { calculateFare, findClosestPointOnRoute } from '../utils/rideUtils.js';
import fetch from 'node-fetch';

const MATCHING_THRESHOLD = 20; // Max distance a rider can be from the path (in km)
const OPENROUTESERVICE_API_KEY = process.env.OPENROUTESERVICE_API_KEY;

// @desc    Add a new ride
// @route   POST /api/rides/add
// @access  Private
export const addRide = async (req, res) => {
    // Verification Check
    const driver = await User.findById(req.user._id);
    if (driver.verificationStatus !== 'verified') {
        return res.status(403).json({ message: 'Forbidden: You must be a verified driver to offer a ride.' });
    }

    const { origin, destination, departureTime, seats, maxDetour, vehicleType, vehicleNumber } = req.body;
    
    try {
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
        
        // Calculate fare based on vehicle type
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

// @desc    Search for available rides
// @route   POST /api/rides/search
// @access  Private
export const searchRides = async (req, res) => {
    const { start, end, vehicleType } = req.body;
    const riderStartPoint = { lat: start.lat, lon: start.lon };
    const riderEndPoint = { lat: end.lat, lon: end.lon };

    try {
        const query = {
            departureTime: { $gt: new Date() },
            availableSeats: { $gt: 0 },
            driver: { $ne: req.user._id },
            status: 'scheduled' // Only show scheduled rides
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

// @desc    Book a seat on a ride
// @route   POST /api/rides/book/:id
// @access  Private
export const bookRide = async (req, res) => {
    const { fare } = req.body; // Get the fare calculated by the frontend

    try {
        const ride = await Ride.findById(req.params.id);

        if (ride) {
            if (ride.availableSeats > 0) {
                // Check if user is already a rider
                const isAlreadyRider = ride.riders.some(r => r.user.toString() === req.user._id.toString());
                if (isAlreadyRider) {
                    return res.status(400).json({ message: 'You have already booked this ride' });
                }
                
                if (ride.driver.equals(req.user._id)) {
                    return res.status(400).json({ message: 'You cannot book your own ride' });
                }

                ride.availableSeats -= 1;
                // **UPDATED:** Save the rider's specific fare
                ride.riders.push({ 
                    user: req.user._id, 
                    status: 'booked',
                    bookedFare: fare || ride.fare // Fallback to full fare if not provided
                });
                await ride.save();

                // Notify driver
                await Notification.create({
                    user: ride.driver,
                    message: `${req.user.name} booked a seat on your ride.`,
                    rideId: ride._id
                });

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
        const driving = await Ride.find({ driver: req.user._id }).populate('riders.user', 'name email');
        const riding = await Ride.find({ 'riders.user': req.user._id }).populate('driver', 'name');
        res.json({ driving, riding });
    } catch (error) {
        console.error("Error in getUserRides:", error);
        res.status(500).json({ message: 'Server error while fetching user rides.' });
    }
};

// @desc    Allow a rider to cancel their booking
// @route   POST /api/rides/cancel-booking/:id
// @access  Private
export const cancelBooking = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id).populate('driver', 'name');
        if (!ride) return res.status(404).json({ message: 'Ride not found' });
        if (new Date(ride.departureTime) < new Date()) return res.status(400).json({ message: 'Cannot cancel a past ride' });

        const riderIndex = ride.riders.findIndex(r => r.user.equals(req.user._id));
        
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

// @desc    Allow a driver to cancel their offered ride
// @route   DELETE /api/rides/cancel-ride/:id
// @access  Private
export const cancelRide = async (req, res) => {
    try {
        const ride = await Ride.findById(req.params.id).populate('driver', 'name');
        if (!ride) return res.status(404).json({ message: 'Ride not found' });
        if (!ride.driver.equals(req.user._id)) return res.status(401).json({ message: 'Not authorized' });
        if (new Date(ride.departureTime) < new Date()) return res.status(400).json({ message: 'Cannot cancel a past ride' });

        const riderNotificationPromises = ride.riders.map(riderObj => {
            return Notification.create({
                user: riderObj.user,
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

// @desc    Update ride departure time
// @route   PUT /api/rides/update-time/:id
// @access  Private (Driver only)
export const updateRideTime = async (req, res) => {
    const { newTime } = req.body;

    try {
        const ride = await Ride.findById(req.params.id).populate('driver', 'name');

        if (!ride) return res.status(404).json({ message: 'Ride not found' });
        if (!ride.driver._id.equals(req.user._id)) return res.status(401).json({ message: 'Not authorized' });

        ride.departureTime = newTime;
        await ride.save();

        if (ride.riders.length > 0) {
            const notifications = ride.riders.map(riderObj => ({
                user: riderObj.user,
                message: `ALERT: Time Changed! Your ride to ${ride.destination.address.split(',')[0]} has been rescheduled to ${new Date(newTime).toLocaleString('en-IN')}.`,
                rideId: ride._id,
                isRead: false
            }));
            await Notification.insertMany(notifications);
        }

        res.json({ message: 'Ride time updated and riders notified.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update rider status (picked_up, dropped_off, etc.)
// @route   PUT /api/rides/rider-status
// @access  Private (Driver only)
export const updateRiderStatus = async (req, res) => {
    const { rideId, riderId, status } = req.body;

    try {
        const ride = await Ride.findById(rideId);
        if (!ride) return res.status(404).json({ message: 'Ride not found' });

        if (!ride.driver.equals(req.user._id)) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const riderEntry = ride.riders.find(r => r.user.toString() === riderId);
        if (riderEntry) {
            riderEntry.status = status;
            if (status === 'picked_up') riderEntry.pickupTime = new Date();
            if (status === 'dropped_off') riderEntry.dropoffTime = new Date();
            
            const allDroppedOff = ride.riders.every(r => r.status === 'dropped_off' || r.status === 'cancelled' || r.status === 'no_show');
            if (allDroppedOff && ride.riders.length > 0) {
                ride.status = 'completed';
            }

            await ride.save();

            await Notification.create({
                user: riderId,
                message: `Your ride status updated to: ${status.replace('_', ' ')}`,
                rideId: ride._id
            });

            res.json({ message: 'Rider status updated' });
        } else {
            res.status(404).json({ message: 'Rider not found in this ride' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Rate a driver
// @route   POST /api/rides/rate-driver
// @access  Private
export const rateDriver = async (req, res) => {
    const { rideId, rating, comment } = req.body;

    try {
        const ride = await Ride.findById(rideId).populate('driver');
        if (!ride) return res.status(404).json({ message: 'Ride not found' });

        const driver = await User.findById(ride.driver._id);
        
        const alreadyRated = driver.ratings.find(r => r.rider.toString() === req.user._id.toString());
        if (alreadyRated) {
            return res.status(400).json({ message: 'You have already rated this driver' });
        }

        const review = {
            rider: req.user._id,
            rating: Number(rating),
            comment,
        };

        driver.ratings.push(review);
        driver.averageRating = driver.ratings.reduce((acc, item) => item.rating + acc, 0) / driver.ratings.length;

        await driver.save();
        res.status(201).json({ message: 'Review added' });

    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Report that the driver did not pick up the rider
// @route   POST /api/rides/report-no-show
// @access  Private (Rider only)
export const reportNoShow = async (req, res) => {
    const { rideId } = req.body;

    try {
        const ride = await Ride.findById(rideId).populate('driver');
        if (!ride) return res.status(404).json({ message: 'Ride not found' });

        const riderEntry = ride.riders.find(r => r.user.toString() === req.user._id.toString());
        if (!riderEntry) {
            return res.status(403).json({ message: 'You are not a passenger on this ride.' });
        }

        const rideTime = new Date(ride.departureTime);
        const currentTime = new Date();
        const timeDiff = (currentTime - rideTime) / (1000 * 60); 

        if (timeDiff < 15) {
             return res.status(400).json({ message: 'Please wait at least 15 minutes after departure time before reporting.' });
        }

        riderEntry.status = 'no_show';
        await ride.save();

        const driver = await User.findById(ride.driver._id);
        
        const penaltyReview = {
            rider: req.user._id,
            rating: 1,
            comment: 'SYSTEM: Automatic penalty for reported no-show.',
            createdAt: new Date()
        };
        
        driver.ratings.push(penaltyReview);
        driver.averageRating = driver.ratings.reduce((acc, item) => item.rating + acc, 0) / driver.ratings.length;
        await driver.save();

        await Notification.create({
            user: ride.driver._id,
            message: `ALERT: Rider ${req.user.name} has reported a NO-SHOW for your ride. Your rating has been penalized.`,
            rideId: ride._id
        });

        res.json({ message: 'Report submitted. Driver has been penalized.' });

    } catch (error) {
        console.error("Error reporting no-show:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// **NEW:** Rider marks payment as done
// @route   POST /api/rides/pay
// @access  Private
export const markPaymentPaid = async (req, res) => {
    const { rideId } = req.body;
    try {
        const ride = await Ride.findById(rideId);
        if (!ride) return res.status(404).json({ message: 'Ride not found' });

        const riderEntry = ride.riders.find(r => r.user.equals(req.user._id));
        if (!riderEntry) return res.status(403).json({ message: 'Not a passenger' });

        riderEntry.paymentStatus = 'paid';
        await ride.save();

        // Notify Driver
        await Notification.create({
            user: ride.driver,
            message: `${req.user.name} has marked their payment of ₹${riderEntry.bookedFare} as sent. Please confirm receipt.`,
            rideId: ride._id
        });

        res.json({ message: 'Payment marked as sent. Waiting for driver confirmation.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// **NEW:** Driver confirms payment
// @route   POST /api/rides/confirm-payment
// @access  Private
export const confirmPayment = async (req, res) => {
    const { rideId, riderId } = req.body;
    try {
        const ride = await Ride.findById(rideId);
        if (!ride) return res.status(404).json({ message: 'Ride not found' });

        if (!ride.driver.equals(req.user._id)) return res.status(401).json({ message: 'Not authorized' });

        const riderEntry = ride.riders.find(r => r.user.toString() === riderId);
        if (riderEntry) {
            riderEntry.paymentStatus = 'confirmed';
            await ride.save();

            // Notify Rider
            await Notification.create({
                user: riderId,
                message: `Driver has confirmed your payment. Thank you!`,
                rideId: ride._id
            });

            res.json({ message: 'Payment confirmed successfully.' });
        } else {
            res.status(404).json({ message: 'Rider not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
// @desc    Trigger SOS alert
// @route   POST /api/rides/sos
// @access  Private
export const triggerSOS = async (req, res) => {
    const { rideId, location } = req.body;

    try {
        // Find the ride to identify all participants
        const ride = await Ride.findById(rideId).populate('driver', 'name _id').populate('riders.user', 'name _id');
        if (!ride) return res.status(404).json({ message: 'Ride not found' });

        const sender = await User.findById(req.user._id);

        // 1. Identify Recipients: Driver + All Riders + Admins
        // Get all rider IDs
        const riderIds = ride.riders.map(r => r.user._id);
        
        // Combine driver and riders into one list
        const rideParticipants = [ride.driver._id, ...riderIds];
        
        // Filter out the sender (so they don't get their own notification)
        const recipients = rideParticipants.filter(id => !id.equals(sender._id));

        // 2. Create Notifications for Ride Participants
        const participantNotifications = recipients.map(userId => ({
            user: userId,
            message: `🚨 SOS ALERT! ${sender.name} has triggered an EMERGENCY during the ride to ${ride.destination.address.split(',')[0]}. Location: ${location || 'Unknown'}`,
            rideId: ride._id,
            isRead: false
        }));

        // 3. Create Notifications for Admins
        const admins = await User.find({ isAdmin: true });
        const adminNotifications = admins.map(admin => ({
            user: admin._id,
            message: `🚨 ADMIN ALERT: SOS triggered by user ${sender.name} (ID: ${sender._id}) in ride ${ride._id}. Coordinates: ${location || 'Unknown'}`,
            rideId: ride._id,
            isRead: false
        }));

        // Save all notifications
        await Notification.insertMany([...participantNotifications, ...adminNotifications]);

        res.json({ message: 'SOS Alert sent to all ride participants and administrators.' });

    } catch (error) {
        console.error("SOS Error:", error);
        res.status(500).json({ message: 'Failed to send SOS' });
    }
};