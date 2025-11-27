import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import ChatWindow from '../components/ChatWindow';
import { SteeringWheel, Users, MapPin, CalendarDays, User, Route, Trash2, MessageCircle, CalendarClock, Car, Motorcycle, Star, CheckCircle, CreditCard, CheckSquare, AlertTriangle } from '../components/Icons';

const API_URL = process.env.REACT_APP_API_URL;

const DashboardPage = () => {
    const { token, user } = useAuth();
    const [rides, setRides] = useState({ driving: [], riding: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('driving');
    const [activeChatRide, setActiveChatRide] = useState(null);
    
    // Rating Modal State
    const [ratingModalOpen, setRatingModalOpen] = useState(false);
    const [ratingRideId, setRatingRideId] = useState(null);
    const [ratingValue, setRatingValue] = useState(5);
    const [ratingComment, setRatingComment] = useState('');

    const fetchRides = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/rides/my-rides`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setRides(data);
            }
        } catch (error) {
            console.error("Failed to fetch user rides", error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchRides();
    }, [fetchRides]);

    const handleCancelBooking = async (rideId) => {
        if (!window.confirm("Are you sure you want to cancel your booking for this ride?")) return;
        
        try {
            const res = await fetch(`${API_URL}/api/rides/cancel-booking/${rideId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                alert('Booking cancelled successfully!');
                fetchRides();
            } else {
                const data = await res.json();
                throw new Error(data.message);
            }
        } catch (error) {
            alert(`Failed to cancel booking: ${error.message}`);
        }
    };

    const handleCancelRide = async (rideId) => {
        if (!window.confirm("Are you sure you want to permanently cancel this ride for all passengers? This cannot be undone.")) return;

        try {
             const res = await fetch(`${API_URL}/api/rides/cancel-ride/${rideId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
             if (res.ok) {
                alert('Ride cancelled successfully!');
                fetchRides();
            } else {
                const data = await res.json();
                throw new Error(data.message);
            }
        } catch (error) {
            alert(`Failed to cancel ride: ${error.message}`);
        }
    };

    const handleEditTime = async (rideId, currentTime) => {
        const newTimeInput = prompt("Enter new date and time (YYYY-MM-DDTHH:MM):", currentTime.substring(0, 16));
        
        if (newTimeInput) {
            try {
                const res = await fetch(`${API_URL}/api/rides/update-time/${rideId}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` 
                    },
                    body: JSON.stringify({ newTime: newTimeInput })
                });
                
                if (res.ok) {
                    alert("Time updated successfully! Riders have been notified.");
                    fetchRides();
                } else {
                    throw new Error("Failed to update time");
                }
            } catch (error) {
                alert(error.message);
            }
        }
    };

    // Handle Status Update (Picked Up / Dropped Off)
    const handleUpdateStatus = async (rideId, riderId, newStatus) => {
        try {
            const res = await fetch(`${API_URL}/api/rides/rider-status`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ rideId, riderId, status: newStatus })
            });
            if (res.ok) {
                alert(`Status updated to ${newStatus.replace('_', ' ')}`);
                fetchRides();
            }
        } catch (error) {
            console.error("Error updating status", error);
        }
    };

    // Submit Rating
    const submitRating = async () => {
        try {
            const res = await fetch(`${API_URL}/api/rides/rate-driver`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ rideId: ratingRideId, rating: ratingValue, comment: ratingComment })
            });
            if (res.ok) {
                alert("Thank you for your feedback!");
                setRatingModalOpen(false);
            } else {
                const d = await res.json();
                alert(d.message);
            }
        } catch (error) {
             console.error("Error submitting rating", error);
        }
    };

    // Handle Reporting No-Show
    const handleReportNoShow = async (rideId) => {
        if (!window.confirm("Are you sure you want to report that the driver did not show up? This will penalize the driver.")) return;
        
        try {
            const res = await fetch(`${API_URL}/api/rides/report-no-show`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ rideId })
            });
            
            const data = await res.json();
            if (res.ok) {
                alert(data.message);
                fetchRides(); // Refresh status
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            alert(`Failed to submit report: ${error.message}`);
        }
    };

    // **NEW: Handle Payment (Rider side)**
    const handlePayRide = async (rideId) => {
        if (!window.confirm("Mark this ride as paid? Ensure you have paid the driver via Cash/UPI.")) return;
        try {
            const res = await fetch(`${API_URL}/api/rides/pay`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ rideId })
            });
            if (res.ok) {
                alert("Payment marked as sent. Waiting for driver confirmation.");
                fetchRides();
            } else {
                const d = await res.json();
                alert(d.message);
            }
        } catch (error) {
            alert("Error processing payment.");
        }
    };

    // **NEW: Confirm Payment (Driver side)**
    const handleConfirmPayment = async (rideId, riderId) => {
        if (!window.confirm("Confirm that you have received payment from this rider?")) return;
        try {
            const res = await fetch(`${API_URL}/api/rides/confirm-payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ rideId, riderId })
            });
            if (res.ok) {
                alert("Payment confirmed.");
                fetchRides();
            } else {
                const d = await res.json();
                alert(d.message);
            }
        } catch (error) {
            alert("Error confirming payment.");
        }
    };

    const handleSOS = async (rideId) => {
        const confirmed = window.confirm("🚨 ARE YOU SURE? 🚨\n\nThis will trigger an EMERGENCY ALERT to the driver, all passengers, and the system administrators.\n\nOnly use this in a real emergency.");
        
        if (confirmed) {
            if (!navigator.geolocation) {
                alert("Geolocation is not supported. Sending SOS without precise location.");
                sendSOSRequest(rideId, "Location unavailable");
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = `${position.coords.latitude}, ${position.coords.longitude}`;
                    sendSOSRequest(rideId, location);
                },
                (error) => {
                    console.error("Location error:", error);
                    sendSOSRequest(rideId, "Location permission denied");
                }
            );
        }
    };

    const sendSOSRequest = async (rideId, location) => {
        try {
            const res = await fetch(`${API_URL}/api/rides/sos`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({ rideId, location })
            });
            
            if (res.ok) {
                alert("SOS Alert Sent! Help has been notified.");
            } else {
                alert("Failed to send SOS alert.");
            }
        } catch (error) {
            alert("Network error sending SOS.");
        }
    };

    const RideCard = ({ ride, isDriving }) => {
        const rideDate = new Date(ride.departureTime);
        const isUpcoming = rideDate > new Date();
        const hasPassed = rideDate < new Date(); 
        
        // Find current user's status if they are a rider. Added safety check.
        const myRiderEntry = !isDriving 
            ? ride.riders.find(r => (r.user?._id === user._id || r.user === user._id))
            : null;
        
        const myRiderStatus = myRiderEntry?.status;
        const myPaymentStatus = myRiderEntry?.paymentStatus;
        const displayFare = isDriving ? ride.fare : (myRiderEntry?.bookedFare || ride.fare);

        return (
            <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col">
                <div className="p-5 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <p className="text-sm font-semibold text-gray-500">
                            {rideDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                        <div className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${isUpcoming ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {isUpcoming ? 'Upcoming' : 'Completed'}
                        </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mt-2 truncate">
                        To: {ride.destination.address.split(',')[0]}
                    </h3>
                </div>
                <div className="p-5 text-sm text-gray-600 space-y-3">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center">
                             <p className="font-bold text-lg text-gray-800">₹{displayFare}</p>
                             {!isDriving && myRiderEntry?.bookedFare && <span className="text-xs text-gray-500 ml-1">(Your Fare)</span>}
                         </div>
                         <div className="flex items-center text-gray-500 text-xs">
                            {ride.vehicleType === 'Car' ? <Car className="w-4 h-4 mr-2" /> : <Motorcycle className="w-4 h-4 mr-2" />}
                            <span>{ride.vehicleType}</span>
                         </div>
                    </div>
                    <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-3 text-gray-400" />
                        <span><strong>From:</strong> {ride.origin.address}</span>
                    </div>
                    <div className="flex items-center">
                        <Route className="w-4 h-4 mr-3 text-gray-400" />
                        <span><strong>Distance:</strong> {ride.distance.toFixed(1)} km</span>
                    </div>
                     <div className="flex items-center">
                        <CalendarDays className="w-4 h-4 mr-3 text-gray-400" />
                        <span><strong>Time:</strong> {rideDate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                     {/* Rider List for Drivers (With Status Actions) */}
                     {isDriving && ride.riders.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <p className="font-semibold mb-2 text-gray-700">Passengers:</p>
                            {ride.riders.map(riderObj => {
                                if (!riderObj.user) return null;
                                return (
                                    <div key={riderObj.user._id || riderObj.user} className="flex flex-col mb-2 bg-gray-50 p-2 rounded border border-gray-100">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="font-medium text-gray-800">{riderObj.user.name || 'Unknown User'}</span>
                                                <span className={`ml-2 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${riderObj.status === 'picked_up' ? 'bg-blue-100 text-blue-700' : riderObj.status === 'dropped_off' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                                    {riderObj.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <div className="flex space-x-1">
                                                {riderObj.status === 'booked' && (
                                                    <button onClick={() => handleUpdateStatus(ride._id, riderObj.user._id, 'picked_up')} title="Mark Picked Up" className="p-1 hover:bg-blue-100 rounded">
                                                        <Car className="w-5 h-5 text-blue-500" />
                                                    </button>
                                                )}
                                                {riderObj.status === 'picked_up' && (
                                                    <button onClick={() => handleUpdateStatus(ride._id, riderObj.user._id, 'dropped_off')} title="Mark Dropped Off" className="p-1 hover:bg-green-100 rounded">
                                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        {/* **NEW: Driver Payment Confirmation** */}
                                        <div className="mt-2 flex justify-between items-center text-xs border-t border-gray-200 pt-2">
                                            <span className="text-gray-500">Fare: ₹{riderObj.bookedFare}</span>
                                            {riderObj.paymentStatus === 'confirmed' ? (
                                                <span className="text-green-600 font-bold flex items-center bg-green-50 px-2 py-0.5 rounded"><CheckSquare className="w-3 h-3 mr-1"/> Paid</span>
                                            ) : riderObj.paymentStatus === 'paid' ? (
                                                <button onClick={() => handleConfirmPayment(ride._id, riderObj.user._id)} className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600 flex items-center">
                                                    <CheckSquare className="w-3 h-3 mr-1" /> Confirm Pay
                                                </button>
                                            ) : (
                                                <span className="text-gray-400 italic">Payment Pending</span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                     )}

                     {isDriving ? (
                         <div className="flex items-center">
                            <User className="w-4 h-4 mr-3 text-gray-400" />
                            <span><strong>Driver:</strong> You</span>
                        </div>
                     ) : (
                         <div className="flex items-center">
                            <User className="w-4 h-4 mr-3 text-gray-400" />
                            <span><strong>Driver:</strong> {ride.driver ? ride.driver.name : 'Unknown Driver'}</span>
                        </div>
                     )}
                     
                     <div className="flex items-center text-gray-500 text-xs pt-2 border-t border-gray-100 mt-2">
                        <span className="font-mono bg-gray-100 px-1 rounded">Reg: {ride.vehicleNumber}</span>
                     </div>
                </div>

                 {/* Actions Footer */}
                 <div className="p-4 border-t border-gray-200 mt-auto flex flex-wrap gap-2">
                    {/* Chat Button (Always visible for active rides) */}
                    {isUpcoming && (
                        <button 
                            onClick={() => setActiveChatRide(ride)}
                            className="flex-1 flex items-center justify-center bg-blue-100 text-blue-600 hover:bg-blue-200 py-2 rounded-lg font-semibold text-sm transition-colors"
                        >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Chat
                        </button>
                    )}
                    
                    {/* **NEW: Rider Payment Button** */}
                    {!isDriving && (myRiderStatus === 'dropped_off' || !isUpcoming) && myPaymentStatus !== 'confirmed' && (
                         <button 
                            onClick={() => handlePayRide(ride._id)}
                            disabled={myPaymentStatus === 'paid'}
                            className={`flex-1 flex items-center justify-center py-2 rounded-lg font-semibold text-sm transition-colors ${myPaymentStatus === 'paid' ? 'bg-green-100 text-green-700 cursor-default' : 'bg-green-500 text-white hover:bg-green-600'}`}
                        >
                            <CreditCard className="w-4 h-4 mr-2" />
                            {myPaymentStatus === 'paid' ? 'Waiting' : 'Pay Now'}
                        </button>
                    )}

                    {/* Rating Button for Riders (If dropped off OR completed) */}
                    {!isDriving && (myRiderStatus === 'dropped_off' || (!isUpcoming && myRiderStatus !== 'no_show')) && (
                        <button 
                            onClick={() => { setRatingRideId(ride._id); setRatingModalOpen(true); }}
                            className="flex-1 flex items-center justify-center bg-yellow-100 text-yellow-700 hover:bg-yellow-200 py-2 rounded-lg font-semibold text-sm transition-colors"
                        >
                            <Star className="w-4 h-4 mr-2" />
                            Rate
                        </button>
                    )}

                    {/* Report No-Show Button */}
                    {!isDriving && hasPassed && myRiderStatus === 'booked' && (
                        <button 
                            onClick={() => handleReportNoShow(ride._id)}
                            className="flex-1 flex items-center justify-center bg-red-100 text-red-700 hover:bg-red-200 py-2 rounded-lg font-semibold text-sm transition-colors"
                            title="Report driver did not arrive"
                        >
                            Report No-Show
                        </button>
                    )}
                    
                    {/* SOS Button */}
                    {isUpcoming && (
                        <div className="mt-2 pt-2 border-t border-red-100 w-full">
                            <button 
                                onClick={() => handleSOS(ride._id)}
                                className="w-full flex items-center justify-center bg-red-600 text-white hover:bg-red-700 py-2 rounded-lg font-bold text-sm shadow-md animate-pulse"
                            >
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                SOS - EMERGENCY
                            </button>
                        </div>
                    )}

                    {/* Cancel/Edit Buttons (Only if upcoming) */}
                    {isUpcoming && (
                        <>
                            {isDriving ? (
                                <>
                                    <button onClick={() => handleEditTime(ride._id, ride.departureTime)} className="flex-1 flex items-center justify-center bg-yellow-100 text-yellow-700 hover:bg-yellow-200 py-2 rounded-lg font-semibold text-sm transition-colors"><CalendarClock className="w-4 h-4 mr-2" />Edit</button>
                                    <button onClick={() => handleCancelRide(ride._id)} className="flex-1 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 py-2 rounded-lg font-semibold text-sm transition-colors"><Trash2 className="w-4 h-4 mr-2" />Cancel</button>
                                </>
                            ) : (
                                <button onClick={() => handleCancelBooking(ride._id)} className="flex-1 flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 py-2 rounded-lg font-semibold text-sm transition-colors"><Trash2 className="w-4 h-4 mr-2" />Cancel</button>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    };

    const ridesToShow = activeTab === 'driving' ? rides.driving : rides.riding;

    return (
        <div className="bg-slate-50 min-h-[calc(100vh-68px)] p-4 sm:p-8">
            <div className="container mx-auto max-w-6xl">
                <h1 className="text-4xl font-bold text-gray-800 mb-2">Your Dashboard</h1>
                <p className="text-lg text-gray-500 mb-8">Manage all your carpooling activity in one place.</p>
                
                <div className="flex border-b border-gray-200 mb-8">
                    <button 
                        onClick={() => setActiveTab('driving')}
                        className={`flex items-center py-4 px-6 text-lg font-semibold transition-colors duration-300 ${activeTab === 'driving' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                    >
                        <SteeringWheel className="w-5 h-5 mr-2" />
                        Driving ({rides.driving.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('riding')}
                        className={`flex items-center py-4 px-6 text-lg font-semibold transition-colors duration-300 ${activeTab === 'riding' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-blue-600'}`}
                    >
                        <Users className="w-5 h-5 mr-2" />
                        Riding ({rides.riding.length})
                    </button>
                </div>

                {loading ? (
                    <p className="text-center text-gray-600">Loading your rides...</p>
                ) : ridesToShow.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {ridesToShow.map(ride => (
                            <RideCard key={ride._id} ride={ride} isDriving={activeTab === 'driving'} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center bg-white p-12 rounded-lg shadow">
                        <h3 className="text-xl font-semibold text-gray-700">No rides to show</h3>
                        <p className="text-gray-500 mt-2">
                            {activeTab === 'driving' ? "You haven't offered any rides yet." : "You haven't booked any rides."}
                        </p>
                    </div>
                )}

                {activeChatRide && (
                    <ChatWindow 
                        rideId={activeChatRide._id}
                        rideName={`Trip to ${activeChatRide.destination.address.split(',')[0]}`}
                        currentUser={user}
                        onClose={() => setActiveChatRide(null)}
                    />
                )}

                {ratingModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[3000] p-4">
                        <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
                            <h3 className="text-lg font-bold mb-4 text-center text-gray-800">Rate Your Driver</h3>
                            <div className="flex justify-center space-x-2 mb-6">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button key={star} onClick={() => setRatingValue(star)} className="focus:outline-none transform hover:scale-110 transition-transform">
                                        <Star className={`w-8 h-8 ${star <= ratingValue ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                    </button>
                                ))}
                            </div>
                            <textarea 
                                className="w-full border border-gray-300 rounded-lg p-3 mb-4 outline-none" 
                                placeholder="Comments..." 
                                rows="3" 
                                value={ratingComment} 
                                onChange={(e) => setRatingComment(e.target.value)} 
                            />
                            <div className="flex justify-end space-x-3">
                                <button onClick={() => setRatingModalOpen(false)} className="text-gray-600 px-4 py-2 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
                                <button onClick={submitRating} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 shadow-md">Submit</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;