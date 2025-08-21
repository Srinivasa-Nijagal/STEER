const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Assuming you're using a User model to manage user data
const authMiddleware = require('../middlewares/authMiddleware'); // JWT verification middleware

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    // The user ID is available from the decoded JWT token (authMiddleware)
    const userId = req.user.id;

    // Find the user in the database
    const user = await User.findById(userId).select('-password'); // Exclude password from response
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Send the user data
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email, phone, address } = req.body; // You can add more fields to update as needed

    // Find and update the user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, email, phone, address },
      { new: true } // Return the updated user object
    ).select('-password'); // Exclude password from the response

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
