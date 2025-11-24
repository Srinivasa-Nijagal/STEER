import express from 'express';
import { getRoute } from '../controllers/proxyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/route').post(protect, getRoute);

export default router;

