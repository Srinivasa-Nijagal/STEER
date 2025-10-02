import User from '../models/User.js';

// @desc    Request driver verification
// @route   POST /api/users/request-verification
// @access  Private
export const requestVerification = async (req, res) => {
    const { name, dlNumber, rcNumber } = req.body;

    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = name; // Allow user to update their name during verification
            user.dlNumber = dlNumber;
            user.rcNumber = rcNumber;
            user.verificationStatus = 'pending';
            await user.save();
            res.json({ message: 'Verification request submitted successfully.' });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};
