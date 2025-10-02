import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
    // The user who will receive the notification
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false, required: true },
    // Optional: A link to the ride this notification is about
    rideId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ride' },
}, { timestamps: true });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
