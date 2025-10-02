import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  
  // Replaced the old isVerified field with this more detailed status
  verificationStatus: {
    type: String,
    enum: ['unverified', 'pending', 'verified','rejected'],
    default: 'unverified',
  },
  // New fields to store information submitted by the user
  dlNumber: { type: String, default: '' },
  rcNumber: { type: String, default: '' },
}, {
  timestamps: true,
});

// Middleware to hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare entered password with the hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;

