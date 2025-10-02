import express from 'express';
import { 
    addRide, 
    searchRides, 
    bookRide, 
    getUserRides, 
    cancelBooking, 
    cancelRide 
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

export default router;
