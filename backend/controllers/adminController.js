import User from '../models/User.js';
import Notification from '../models/Notification.js';

// Fetches users with 'pending' status
export const getPendingVerifications = async (req, res) => {
    try {
        const users = await User.find({ verificationStatus: 'pending' });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// NEW: Fetches users with 'verified' status
export const getVerifiedUsers = async (req, res) => {
    try {
        const users = await User.find({ verificationStatus: 'verified', isAdmin: false });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// NEW: Fetches users with 'rejected' status
export const getRejectedUsers = async (req, res) => {
    try {
        const users = await User.find({ verificationStatus: 'rejected' });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// Sets a user's status to 'verified'
export const verifyUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.verificationStatus = 'verified';
            await user.save();
            await Notification.create({
                user: user._id,
                message: 'Congratulations! Your verification request has been approved. You can now offer rides.'
            });
            res.json({ message: 'User verified successfully' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// UPDATED: Sets a user's status to 'rejected'
export const rejectUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user) {
            user.verificationStatus = 'rejected'; // Update status
            await user.save();
            await Notification.create({
                user: user._id,
                message: 'Your verification request has been rejected. Please review your details.'
            });
            res.json({ message: 'User verification rejected' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};