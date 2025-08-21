import React, { useState } from "react";
import axios from "../api/axios";
import Navbar from "../components/Navbar";

const BookRide = () => {
  const [rideDetails, setRideDetails] = useState({
    from: "",
    to: "",
    time: "",
    seats: "",
    price: "",
    vehicle: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setRideDetails({ ...rideDetails, [name]: value });
  };

  const handleAddRide = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    try {
      await axios.post("/rides", rideDetails, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Ride added successfully!");
    } catch (error) {
      console.error(error.response?.data?.message || "Something went wrong");
      alert(error.response?.data?.message || "Failed to add ride");
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center">
        <div className="bg-white p-8 shadow-md rounded-lg w-full max-w-lg">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Add a Ride
          </h1>
          <form onSubmit={handleAddRide} className="space-y-4">
            <input
              type="text"
              name="from"
              placeholder="From"
              value={rideDetails.from}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="to"
              placeholder="To"
              value={rideDetails.to}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="time"
              placeholder="Time (e.g., 10:00 AM)"
              value={rideDetails.time}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              name="seats"
              placeholder="Seats Available"
              value={rideDetails.seats}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              name="price"
              placeholder="Price (INR)"
              value={rideDetails.price}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="text"
              name="vehicle"
              placeholder="Vehicle Name (e.g., Honda City)"
              value={rideDetails.vehicle}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
            >
              Add Ride
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default BookRide;
