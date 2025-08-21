import React, { useEffect, useState } from "react";
import axios from "../api/axios";
import Navbar from "../components/Navbar"; // Import Navbar

const Home = () => {
  const [rides, setRides] = useState([]);
  const [selectedRide, setSelectedRide] = useState(null);

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const response = await axios.get("/rides");
        setRides(response.data);
      } catch (error) {
        console.error("Failed to fetch rides:", error.response?.data?.message || error.message);
      }
    };

    fetchRides();
  }, []);

  const handleBookRide = async (rideId) => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.post(
        `/rides/book-ride/${rideId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert(response.data.message);
    } catch (error) {
      console.error("Failed to book ride:", error.response?.data?.message || error.message);
      alert(error.response?.data?.message || "Failed to book ride");
    }
  };

  const handleShowRideDetails = (ride) => {
    setSelectedRide(ride);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      <Navbar /> {/* Add Navbar here */}

      <header className="mb-8 text-center mt-6">
        <h1 className="text-3xl font-bold text-blue-700">Available Rides</h1>
        <p className="text-gray-600 mt-2">
          Choose your ride and enjoy your journey with STEER!
        </p>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-6">
        {rides.map((ride) => (
          <div
            key={ride._id}
            className="p-4 bg-white shadow-md rounded-lg hover:shadow-lg transition duration-300"
          >
            <h3 className="text-xl font-semibold text-gray-800">
              {ride.from} ➡️ {ride.to}
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              <span className="font-bold">Time:</span> {ride.time}
            </p>
            <p className="text-sm text-gray-500">
              <span className="font-bold">Price:</span> ₹{ride.price}
            </p>
            <p className="text-sm text-gray-500">
              <span className="font-bold">Seats Available:</span> {ride.seats}
            </p>
            <p className="text-sm text-gray-500">
              <span className="font-bold">Vehicle:</span> {ride.vehicle}
            </p>
            <button
              onClick={() => handleBookRide(ride._id)}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Book Ride
            </button>
            <button
              onClick={() => handleShowRideDetails(ride)}
              className="mt-2 px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              View Details
            </button>
          </div>
        ))}
      </main>

      {rides.length === 0 && (
        <div className="text-center mt-12">
          <p className="text-lg text-gray-600">No rides available at the moment. Please check back later!</p>
        </div>
      )}

      {/* Show Ride Details Modal */}
      {selectedRide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <h2 className="text-xl font-bold mb-4">Ride Details</h2>
            <p><span className="font-bold">From:</span> {selectedRide.from}</p>
            <p><span className="font-bold">To:</span> {selectedRide.to}</p>
            <p><span className="font-bold">Time:</span> {selectedRide.time}</p>
            <p><span className="font-bold">Price:</span> ₹{selectedRide.price}</p>
            <p><span className="font-bold">Seats Available:</span> {selectedRide.seats}</p>
            <p><span className="font-bold">Vehicle:</span> {selectedRide.vehicle}</p>
            
            <h3 className="font-semibold mt-4">Driver Details:</h3>
            <p><span className="font-bold">Name:</span> {selectedRide.driver?.name}</p>
            <p><span className="font-bold">Email:</span> {selectedRide.driver?.email}</p>

            <h3 className="font-semibold mt-4">Booked Users:</h3>
            {selectedRide.bookedUsers.length > 0 ? (
              selectedRide.bookedUsers.map((user, index) => (
                <p key={index}>{user.name} - {user.email}</p>
              ))
            ) : (
              <p>No users have booked this ride yet.</p>
            )}

            <div className="flex justify-end space-x-4 mt-4">
              <button
                onClick={() => setSelectedRide(null)}
                className="px-6 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
