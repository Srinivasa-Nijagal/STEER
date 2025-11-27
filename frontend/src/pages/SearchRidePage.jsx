import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import LocationInput from '../components/LocationInput';
import MapPicker from '../components/MapPicker';
import { User, SearchX, Route, GitCommitVertical, Car, Motorcycle, CornerRightUp } from '../components/Icons';

const API_URL = process.env.REACT_APP_API_URL;

const SearchRidePage = ({ setPage }) => {
    const [startPoint, setStartPoint] = useState({ address: '', lat: null, lon: null });
    const [endPoint, setEndPoint] = useState({ address: '', lat: null, lon: null });
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    const { token } = useAuth();
    const [selectedRide, setSelectedRide] = useState(null);
    
    // State for the map's current display distance vs the rider's actual trip distance
    const [currentMapDistance, setCurrentMapDistance] = useState(0); 
    const [riderTripDistance, setRiderTripDistance] = useState(0); 

    const [detourInfo, setDetourInfo] = useState({ distance: null, loading: false });
    const [pickupInfo, setPickupInfo] = useState({ path: [], distance: null, loading: false });
    const [vehicleFilter, setVehicleFilter] = useState('All');

    // Helper to calculate fare
    const calculateFare = (distance, vehicleType) => {
        let baseFare = 50;
        let ratePerKm = 8;
        if (vehicleType === '2-Wheeler') {
            baseFare = 25;
            ratePerKm = 5;
        }
        return Math.round(baseFare + (distance * ratePerKm));
    };

    useEffect(() => {
        if (!selectedRide || !startPoint.lat || !endPoint.lat) {
            setDetourInfo({ distance: null, loading: false });
            setPickupInfo({ path: [], distance: null, loading: false });
            return;
        }

        const calculateDetails = async () => {
            setDetourInfo({ distance: null, loading: true });
            setPickupInfo({ path: [], distance: null, loading: true });

            try {
                const detourRouteCoords = [
                    [selectedRide.origin.lon, selectedRide.origin.lat],
                    [startPoint.lon, startPoint.lat],
                    [endPoint.lon, endPoint.lat],
                    [selectedRide.destination.lon, selectedRide.destination.lat]
                ];
                const detourPromise = fetch(`${API_URL}/api/proxy/route`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ "coordinates": detourRouteCoords })
                });

                const pickupRouteCoords = [
                    [selectedRide.origin.lon, selectedRide.origin.lat],
                    [startPoint.lon, startPoint.lat]
                ];
                const pickupPromise = fetch(`${API_URL}/api/proxy/route`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ "coordinates": pickupRouteCoords })
                });

                const [detourResponse, pickupResponse] = await Promise.all([detourPromise, pickupPromise]);

                const processResponse = async (response) => {
                    const contentType = response.headers.get("content-type");
                    if (response.ok && contentType && contentType.indexOf("application/json") !== -1) {
                        return response.json();
                    } else {
                        const errorText = await response.text();
                        throw new Error(`Server returned an unexpected response: ${errorText}`);
                    }
                };

                const detourData = await processResponse(detourResponse);
                const newDistance = detourData.features[0].properties.summary.distance / 1000;
                const detourDistance = newDistance - selectedRide.distance;
                setDetourInfo({ distance: detourDistance > 0 ? detourDistance : 0, loading: false });


                const pickupData = await processResponse(pickupResponse);
                const pickupPath = pickupData.features[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
                const pickupDistance = pickupData.features[0].properties.summary.distance / 1000;
                setPickupInfo({ path: pickupPath, distance: pickupDistance, loading: false });

            } catch (error) {
                console.error("Route calculation error:", error);
                setDetourInfo({ distance: null, loading: false });
                setPickupInfo({ path: [], distance: null, loading: false });
            }
        };

        calculateDetails();

    }, [selectedRide, startPoint, endPoint, token]);
    
    const handleSearch = async () => {
        if (!startPoint.lat || !endPoint.lat) {
            alert('Please select a start and end point.');
            return;
        }
        setLoading(true);
        setSearched(true);
        setRides([]); 
        setSelectedRide(null);
        // Reset rider distance on new search
        setRiderTripDistance(0); 
        
        try {
            const res = await fetch(`${API_URL}/api/rides/search`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
                body: JSON.stringify({ 
                    start: startPoint, 
                    end: endPoint,
                    vehicleType: vehicleFilter
                }),
            });
            const data = await res.json();
            if (res.ok) {
                setRides(data);
            } else {
                throw new Error(data.message || 'An unknown error occurred.');
            }
        } catch (error) {
            console.error(error);
            alert(`Failed to search for rides: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };
    
     const handleBookRide = async (rideId, fare) => {
        if (!window.confirm(`Book this ride for ₹${fare}?`)) return;
        try {
            const res = await fetch(`${API_URL}/api/rides/book/${rideId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
                body: JSON.stringify({ fare }) 
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

    const handleRouteCalculated = (dist) => {
        setCurrentMapDistance(dist);
        // FIX: Save the rider's specific trip distance ONLY when we are searching (i.e., no ride is selected yet).
        // This ensures riderTripDistance holds the user's A->B distance, even after they click a ride and the map changes.
        if (!selectedRide) {
            setRiderTripDistance(dist);
        }
    };

    return (
        <div className="min-h-[calc(100vh-68px)] flex flex-col">
            <div className="grid grid-cols-1 lg:grid-cols-12 flex-grow">
                <div className="lg:col-span-4 xl:col-span-3 p-6 bg-white flex flex-col">
                    <h1 className="text-2xl font-bold text-gray-800 mb-4">Find Your Ride</h1>
                    <div className="space-y-4 mb-4">
                        <LocationInput label="Starting Point" value={startPoint.address} onLocationSelect={setStartPoint} />
                        <LocationInput label="Destination" value={endPoint.address} onLocationSelect={setEndPoint} />
                    </div>
                    
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Vehicle</label>
                        <div className="flex space-x-2">
                            {['All', 'Car', '2-Wheeler'].map(type => (
                                <button key={type} onClick={() => setVehicleFilter(type)} className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors duration-200 ${vehicleFilter === type ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                                    {type}
                                </button>
                            ))}
                        </div>
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
                                <p className="text-gray-500 mt-2">Try adjusting your locations or search filter.</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            {rides.map(ride => {
                                // **FIX:** Correctly prioritize the rider's trip distance for fare calculation.
                                // If riderTripDistance is set (which happens on initial search route calculation), use it.
                                // Fallback to ride.fare ONLY if riderTripDistance is 0 (e.g., map loading issue).
                                const distanceToUse = riderTripDistance > 0 ? riderTripDistance : currentMapDistance;
                                const riderFare = distanceToUse > 0 
                                    ? calculateFare(distanceToUse, ride.vehicleType) 
                                    : ride.fare;
                                
                                return (
                                    <div 
                                        key={ride._id} 
                                        onClick={() => setSelectedRide(ride)}
                                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${selectedRide?._id === ride._id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                {/* Show the rider's specific fare */}
                                                <p className="font-bold text-lg text-gray-800">₹{riderFare}</p>
                                                <p className="text-sm text-gray-500">{ride.distance.toFixed(1)} km (Route)</p>
                                            </div>
                                            <div className="text-right flex items-center">
                                                <div className="mr-2">
                                                    <p className="font-semibold text-gray-700">{ride.driver.name}</p>
                                                    <p className="text-xs text-gray-400">{ride.vehicleNumber}</p>
                                                </div>
                                                {ride.vehicleType === 'Car' ? <Car className="w-6 h-6 text-blue-500" /> : <Motorcycle className="w-6 h-6 text-blue-500" />}
                                            </div>
                                        </div>
                                        <div className="mt-3 text-sm text-gray-600 space-y-1">
                                            <p><strong>From:</strong> {ride.origin.address}</p>
                                            <p><strong>To:</strong> {ride.destination.address}</p>
                                            <p><strong>Time:</strong> {new Date(ride.departureTime).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', weekday: 'short' })}</p>
                                        </div>
                                        <div className="flex justify-between items-center mt-3">
                                            <p className="text-sm font-semibold text-green-600">{ride.availableSeats} seat(s) available</p>
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    handleBookRide(ride._id, riderFare); 
                                                }} 
                                                className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-semibold hover:bg-blue-600"
                                            >
                                                Book Now
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="relative z-0 lg:col-span-8 xl:col-span-9 bg-gray-100 flex flex-col p-4 gap-4">
                    <div className="h-96 lg:h-auto lg:flex-grow rounded-lg overflow-hidden border-2 border-gray-200 shadow-md">
                         <MapPicker 
                            onLocationSelect={() => {}}
                            onRouteCalculated={handleRouteCalculated}
                            startPoint={selectedRide ? selectedRide.origin : (startPoint.lat ? startPoint : null)}
                            endPoint={selectedRide ? selectedRide.destination : (endPoint.lat ? endPoint : null)}
                            pickupPath={pickupInfo.path}
                            riderStartPoint={selectedRide ? startPoint : null}
                        />
                    </div>
                    <div className="bg-white rounded-lg shadow-md p-4 h-auto md:h-32">
                         <h2 className="font-bold text-xl text-gray-800 mb-3">
                            {selectedRide ? `Details for ride with ${selectedRide.driver.name}` : 'Your Search Details'}
                         </h2>
                         {selectedRide ? (
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center">
                                    <Route className="w-8 h-8 text-blue-500 mr-3 flex-shrink-0"/>
                                    <div>
                                        <p className="text-sm text-gray-500">Driver's Route</p>
                                        <p className="font-bold text-lg">{selectedRide.distance.toFixed(1)} km</p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <CornerRightUp className="w-8 h-8 text-green-500 mr-3 flex-shrink-0"/>
                                    <div>
                                        <p className="text-sm text-gray-500">Pickup Distance</p>
                                        <p className="font-bold text-lg">
                                            {pickupInfo.loading ? '...' : pickupInfo.distance !== null ? `~${pickupInfo.distance.toFixed(1)} km` : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <GitCommitVertical className="w-8 h-8 text-orange-500 mr-3 flex-shrink-0"/>
                                    <div>
                                        <p className="text-sm text-gray-500">Total Added Detour</p>
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
                                    {/* Show riderTripDistance if available, otherwise currentMapDistance */}
                                    <p className="font-bold text-lg">{(riderTripDistance || currentMapDistance) > 0 ? `${(riderTripDistance || currentMapDistance).toFixed(1)} km` : 'Select start and end points'}</p>
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