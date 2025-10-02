import express from 'express';
import { requestVerification } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/request-verification').post(protect, requestVerification);

export default router;
