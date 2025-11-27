import express from 'express';
import { registerUser, loginUser, getUserProfile } from '../controllers/authController.js'; // Import getUserProfile
import { protect } from '../middleware/authMiddleware.js'; // Import protect middleware

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

// **NEW ROUTE:** Allows the frontend to fetch the latest user details (including rating)
router.get('/me', protect, getUserProfile);

export default router;