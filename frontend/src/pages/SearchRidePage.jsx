import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LocationInput from '../components/LocationInput';
import MapPicker from '../components/MapPicker';
import { SearchX, Route, GitCommitVertical } from '../components/Icons';

const SearchRidePage = ({ setPage }) => {
    const [startPoint, setStartPoint] = useState({ address: '', lat: null, lon: null });
    const [endPoint, setEndPoint] = useState({ address: '', lat: null, lon: null });
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const { token } = useAuth();
    const [selectedRide, setSelectedRide] = useState(null);
    const [searchDistance, setSearchDistance] = useState(0);
    const [detourInfo, setDetourInfo] = useState({ distance: null, loading: false });
    const OPENROUTESERVICE_API_KEY = process.env.REACT_APP_OPENROUTESERVICE_API_KEY;

    // Effect to calculate detour when a ride is selected
    useEffect(() => {
        if (!selectedRide || !startPoint.lat || !endPoint.lat) {
            setDetourInfo({ distance: null, loading: false });
            return;
        }

        const calculateDetour = async () => {
            setDetourInfo({ distance: null, loading: true });
            try {
                const detourRouteCoords = [
                    [selectedRide.origin.lon, selectedRide.origin.lat],
                    [startPoint.lon, startPoint.lat],
                    [endPoint.lon, endPoint.lat],
                    [selectedRide.destination.lon, selectedRide.destination.lat]
                ];

                const response = await fetch('https://api.openrouteservice.org/v2/directions/driving-car/geojson', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
                        'Content-Type': 'application/json',
                        'Authorization': OPENROUTESERVICE_API_KEY
                    },
                    body: JSON.stringify({ "coordinates": detourRouteCoords })
                });

                if (response.ok) {
                    const routeData = await response.json();
                    const newDistance = routeData.features[0].properties.summary.distance / 1000;
                    const detourDistance = newDistance - selectedRide.distance;
                    setDetourInfo({ distance: detourDistance > 0 ? detourDistance : 0, loading: false });
                } else {
                     setDetourInfo({ distance: null, loading: false });
                }
            } catch (error) {
                console.error("Detour calculation error:", error);
                setDetourInfo({ distance: null, loading: false });
            }
        };

        calculateDetour();

    }, [selectedRide, startPoint, endPoint]);
    
    const handleSearch = async () => {
        if (!startPoint.lat || !endPoint.lat) {
            alert('Please select a start and end point.');
            return;
        }
        setLoading(true);
        setSearched(true);
        setRides([]); 
        setSelectedRide(null);
        try {
            const res = await fetch(`http://localhost:5000/api/rides/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
                body: JSON.stringify({ start: startPoint, end: endPoint }),
            });
            const data = await res.json();
            if (res.ok) setRides(data);
            else throw new Error(data.message);
        } catch (error) {
            console.error(error);
            alert('Failed to search for rides.');
        } finally {
            setLoading(false);
        }
    };
    
     const handleBookRide = async (rideId) => {
        if (!window.confirm("Are you sure you want to book this ride?")) return;
        try {
            const res = await fetch(`http://localhost:5000/api/rides/book/${rideId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
            });
            const data = await res.json();
            if (res.ok) {
                alert('Ride booked successfully!');
                handleSearch();
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            alert(`Booking failed: ${error.message}`);
        }
    };

    return (
        <div className="min-h-[calc(100vh-68px)] flex flex-col">
            <div className="grid grid-cols-1 lg:grid-cols-12 flex-grow">
                {/* Left Column: Search Form and Results */}
                <div className="lg:col-span-4 xl:col-span-3 p-6 bg-white flex flex-col">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Find Your Ride</h1>
                    <div className="space-y-4 mb-4">
                        <LocationInput 
                            label="Starting Point" 
                            value={startPoint.address} 
                            onLocationSelect={setStartPoint} 
                        />
                        <LocationInput 
                            label="Destination" 
                            value={endPoint.address} 
                            onLocationSelect={setEndPoint} 
                        />
                    </div>
                    <button onClick={handleSearch} disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 disabled:bg-blue-300">
                        {loading ? 'Searching...' : 'Search Rides'}
                    </button>
                    
                    <div className="mt-6 flex-grow overflow-y-auto pr-2">
                        {loading && <p className="text-center text-gray-600">Loading rides...</p>}
                        
                        {!loading && searched && rides.length === 0 && (
                            <div className="text-center p-8">
                                <SearchX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-700">No Rides Found</h3>
                                <p className="text-gray-500 mt-2">Try adjusting your locations or search radius.</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            {rides.map(ride => (
                                <div 
                                    key={ride._id} 
                                    onClick={() => setSelectedRide(ride)}
                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${selectedRide?._id === ride._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold text-lg text-gray-800">₹{ride.fare}</p>
                                            <p className="text-sm text-gray-500">{ride.distance.toFixed(1)} km</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-700">{ride.driver.name}</p>
                                            <p className="text-xs text-gray-400">Driver</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 text-sm text-gray-600 space-y-1">
                                        <p><strong>From:</strong> {ride.origin.address}</p>
                                        <p><strong>To:</strong> {ride.destination.address}</p>
                                        <p><strong>Time:</strong> {new Date(ride.departureTime).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', weekday: 'short' })}</p>
                                    </div>
                                    <div className="flex justify-between items-center mt-3">
                                        <p className="text-sm font-semibold text-green-600">{ride.availableSeats} seat(s) available</p>
                                        <button onClick={(e) => { e.stopPropagation(); handleBookRide(ride._id); }} className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold hover:bg-blue-600">
                                            Book Now
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Map and Details */}
                <div className="lg:col-span-8 xl:col-span-9 bg-gray-100 flex flex-col p-4 gap-4">
                    <div className="flex-grow rounded-lg overflow-hidden border-2 border-gray-200 shadow-md">
                         <MapPicker 
                            onLocationSelect={() => {}} // Click handler is disabled on this map
                            onRouteCalculated={setSearchDistance}
                            startPoint={selectedRide ? selectedRide.origin : (startPoint.lat ? startPoint : null)}
                            endPoint={selectedRide ? selectedRide.destination : (endPoint.lat ? endPoint : null)}
                        />
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4 h-auto md:h-32">
                         <h2 className="font-bold text-xl text-gray-800 mb-3">
                            {selectedRide ? `Details for ride with ${selectedRide.driver.name}` : 'Your Search Details'}
                         </h2>
                         {selectedRide ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center">
                                    <Route className="w-8 h-8 text-blue-500 mr-3 flex-shrink-0"/>
                                    <div>
                                        <p className="text-sm text-gray-500">Driver's Route</p>
                                        <p className="font-bold text-lg">{selectedRide.distance.toFixed(1)} km</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <GitCommitVertical className="w-8 h-8 text-orange-500 mr-3 flex-shrink-0"/>
                                    <div>
                                        <p className="text-sm text-gray-500">Added Detour</p>
                                        <p className="font-bold text-lg">
                                            {detourInfo.loading ? '...' : detourInfo.distance !== null ? `${detourInfo.distance.toFixed(1)} km` : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                             </div>
                         ) : (
                             <div className="flex items-center">
                                 <Route className="w-8 h-8 text-blue-500 mr-3 flex-shrink-0"/>
                                 <div>
                                    <p className="text-sm text-gray-500">Your trip distance</p>
                                    <p className="font-bold text-lg">{searchDistance > 0 ? `${searchDistance.toFixed(1)} km` : 'Select start and end points'}</p>
                                 </div>
                             </div>
                         )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SearchRidePage;

