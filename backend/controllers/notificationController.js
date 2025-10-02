import Notification from '../models/Notification.js';

// @desc    Get all notifications for the logged-in user
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
    try {
        // Failsafe check to ensure req.user exists before proceeding
        if (!req.user) {
            return res.status(401).json({ message: 'User not found for this request.' });
        }

        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 }); // Show newest notifications first
        res.json(notifications);
    } catch (error) {
        // Added detailed error logging for better debugging
        console.error("Error in getNotifications:", error);
        res.status(500).json({ message: 'Server error while fetching notifications.' });
    }
};

// @desc    Mark all of a user's notifications as read
// @route   POST /api/notifications/read
// @access  Private
export const markNotificationsAsRead = async (req, res) => {
    try {
        // Failsafe check
        if (!req.user) {
            return res.status(401).json({ message: 'User not found for this request.' });
        }

        await Notification.updateMany(
            { user: req.user._id, isRead: false },
            { $set: { isRead: true } }
        );
        res.json({ message: 'Notifications marked as read' });
    } catch (error) {
        // Added detailed error logging for better debugging
        console.error("Error in markNotificationsAsRead:", error);
        res.status(500).json({ message: 'Server error while marking notifications as read.' });
    }
};
export const clearAllNotifications = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'User not found for this request.' });
        }
        await Notification.deleteMany({ user: req.user._id });
        res.json({ message: 'All notifications cleared' });
    } catch (error) {
        console.error("Error in clearAllNotifications:", error);
        res.status(500).json({ message: 'Server error while clearing notifications.' });
    }
};

