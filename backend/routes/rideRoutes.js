import express from 'express';
import { addRide, searchRides, bookRide, getUserRides } from '../controllers/rideController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/add', protect, addRide);
router.post('/search', protect, searchRides);
router.post('/book/:id', protect, bookRide);
router.get('/my-rides', protect, getUserRides);

export default router;
