const mongoose = require("mongoose");

const RideSchema = new mongoose.Schema({
  from: { type: String, required: true },
  to: { type: String, required: true },
  time: { type: String, required: true },
  seats: { type: Number, required: true },
  price: { type: Number, required: true },
  vehicle: { type: String, required: true },
  driver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  bookedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }]
});

module.exports = mongoose.model("Ride", RideSchema);
