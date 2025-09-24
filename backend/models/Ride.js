import mongoose from 'mongoose';

const pointSchema = new mongoose.Schema({
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
});

// New schema to store the route path as GeoJSON LineString
const routePathSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['LineString'],
        required: true
    },
    coordinates: {
        type: [[Number]], // Array of [lon, lat] pairs
        required: true
    }
});

const rideSchema = new mongoose.Schema({
    driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    origin: { type: pointSchema, required: true },
    destination: { type: pointSchema, required: true },
    departureTime: { type: Date, required: true },
    totalSeats: { type: Number, required: true },
    availableSeats: { type: Number, required: true },
    fare: { type: Number, required: true },
    riders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    routePath: { type: routePathSchema, required: true }, 
    // **NEW:** Store the original route distance for detour calculation
    distance: { type: Number, required: true },
}, { timestamps: true });

const Ride = mongoose.model('Ride', rideSchema);
export default Ride;

