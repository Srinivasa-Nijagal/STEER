import express from 'express';
import {
    getPendingVerifications,
    getVerifiedUsers,
    getRejectedUsers,
    verifyUser,
    rejectUser
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.route('/pending-verifications').get(protect, admin, getPendingVerifications);
router.route('/verified-users').get(protect, admin, getVerifiedUsers);
router.route('/rejected-users').get(protect, admin, getRejectedUsers);

// Routes for performing actions
router.route('/verify-user/:id').post(protect, admin, verifyUser);
router.route('/reject-user/:id').post(protect, admin, rejectUser);

export default router;