import User from '../models/User.js';

export const requestVerification = async (req, res) => {
    const { name, dlNumber, rcNumber } = req.body;

    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = name; 
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
