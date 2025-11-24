import{ React, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SteeringWheel, Users, MapPin, CalendarDays, User, Route, Trash2 } from '../components/Icons';

const DashboardPage = () => {
    const { token } = useAuth();
    const [rides, setRides] = useState({ driving: [], riding: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('driving'); 

    const fetchRides = async () => {
        setLoading(true);
        try {
            const res = await fetch(`https://steer-backend.onrender.com/api/rides/my-rides`, {
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
    };

    useEffect(() => {
        fetchRides();
    }, [token]);

    const handleCancelBooking = async (rideId) => {
        if (!window.confirm("Are you sure you want to cancel your booking for this ride?")) return;
        
        try {
            const res = await fetch(`https://steer-backend.onrender.com/api/rides/cancel-booking/${rideId}`, {
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
             const res = await fetch(`https://steer-backend.onrender.com/api/rides/cancel-ride/${rideId}`, {
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

    const RideCard = ({ ride, isDriving }) => {
        const isUpcoming = new Date(ride.departureTime) > new Date();
        return (
            <div className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col">
                <div className="p-5 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <p className="text-sm font-semibold text-gray-500">
                            {new Date(ride.departureTime).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
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
                        <span><strong>Time:</strong> {new Date(ride.departureTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                     {isDriving ? (
                         <div className="flex items-center">
                            <Users className="w-4 h-4 mr-3 text-gray-400" />
                            <span><strong>Riders:</strong> {ride.riders.length > 0 ? ride.riders.map(r => r.name).join(', ') : 'None'}</span>
                        </div>
                     ) : (
                         <div className="flex items-center">
                            <User className="w-4 h-4 mr-3 text-gray-400" />
                            <span><strong>Driver:</strong> {ride.driver.name}</span>
                        </div>
                     )}
                </div>
                 {isUpcoming && (
                    <div className="p-4 border-t border-gray-200 mt-auto">
                        {isDriving ? (
                            <button onClick={() => handleCancelRide(ride._id)} className="w-full flex items-center justify-center text-red-500 hover:text-red-700 font-semibold text-sm transition-colors duration-200">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Cancel This Ride
                            </button>
                        ) : (
                             <button onClick={() => handleCancelBooking(ride._id)} className="w-full flex items-center justify-center text-red-500 hover:text-red-700 font-semibold text-sm transition-colors duration-200">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Cancel My Booking
                            </button>
                        )}
                    </div>
                )}
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
            </div>
        </div>
    );
};

export default DashboardPage;

