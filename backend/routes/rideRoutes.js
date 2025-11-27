import express from 'express';
import { 
    addRide, 
    searchRides, 
    bookRide, 
    getUserRides, 
    cancelBooking, 
    cancelRide,
    updateRideTime,
    updateRiderStatus,
    rateDriver,
    reportNoShow,
    markPaymentPaid, // Import the new payment functions
    confirmPayment,   // Import the new payment functions
    triggerSOS 
} from '../controllers/rideController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route to add a new ride
router.route('/add').post(protect, addRide);

// Route to search for available rides
router.route('/search').post(protect, searchRides);

// Route to get all rides associated with the logged-in user
router.route('/my-rides').get(protect, getUserRides);

// Route for a user to book a seat on a specific ride
router.route('/book/:id').post(protect, bookRide);

// Route for a rider to cancel their booking on a specific ride
router.route('/cancel-booking/:id').post(protect, cancelBooking);

// Route for a driver to cancel a ride they have offered
router.route('/cancel-ride/:id').delete(protect, cancelRide);

// Route for a driver to update the time of their ride
router.route('/update-time/:id').put(protect, updateRideTime);

// Route for a driver to update a specific rider's status (e.g. picked up)
router.route('/rider-status').put(protect, updateRiderStatus);

// Route for a rider to rate their driver
router.route('/rate-driver').post(protect, rateDriver);

// Route for reporting a no-show
router.route('/report-no-show').post(protect, reportNoShow);

// **NEW ROUTES** for payment tracking
router.route('/pay').post(protect, markPaymentPaid);
router.route('/confirm-payment').post(protect, confirmPayment);
router.route('/sos').post(protect, triggerSOS);

export default router;