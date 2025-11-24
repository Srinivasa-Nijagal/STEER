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

router.route('/add').post(protect, addRide);
router.route('/search').post(protect, searchRides);
router.route('/my-rides').get(protect, getUserRides);
router.route('/book/:id').post(protect, bookRide);
router.route('/cancel-booking/:id').post(protect, cancelBooking);
router.route('/cancel-ride/:id').delete(protect, cancelRide);

export default router;
