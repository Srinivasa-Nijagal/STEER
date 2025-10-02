import express from 'express';
import { getNotifications, markNotificationsAsRead ,clearAllNotifications} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(protect, getNotifications);
router.route('/read').post(protect, markNotificationsAsRead);
router.route('/clear-all').delete(protect, clearAllNotifications);

export default router;
