import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import LocationInput from '../components/LocationInput';
import MapPicker from '../components/MapPicker';
import { Route } from '../components/Icons'; 

const AddRidePage = ({ setPage }) => {
    const [startPoint, setStartPoint] = useState({ address: '', lat: null, lon: null });
    const [endPoint, setEndPoint] = useState({ address: '', lat: null, lon: null });
    const [departureTime, setDepartureTime] = useState('');
    const [seats, setSeats] = useState(1);
    const [activeMapForInput, setActiveMapForInput] = useState('start');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { token } = useAuth();
    const [distance, setDistance] = useState(0);
    
    const handleMapSelect = (location) => {
        if (activeMapForInput === 'start') {
            setStartPoint(location);
        } else {
            setEndPoint(location);
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!startPoint.lat || !endPoint.lat || !departureTime || seats < 1) {
            setError('Please fill all fields and select locations on the map.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`http://localhost:5000/api/rides/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    origin: startPoint,
                    destination: endPoint,
                    departureTime,
                    seats: parseInt(seats),
                }),
            });
            const data = await res.json();
            if (res.ok) {
                alert('Ride created successfully!');
                setPage('dashboard');
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            setError(err.message || 'Failed to create ride.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="min-h-[calc(100vh-68px)] bg-cover bg-center p-4 sm:p-8 flex items-center justify-center bg-blue-50"
        >
            <div className="container mx-auto max-w-6xl bg-white bg-opacity-95 rounded-xl shadow-2xl p-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">Offer a Ride</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg text-center">{error}</p>}
                        <div onFocus={() => setActiveMapForInput('start')}>
                            <LocationInput 
                                label="Starting Point" 
                                value={startPoint.address}
                                onLocationSelect={setStartPoint}
                            />
                        </div>
                        <div onFocus={() => setActiveMapForInput('end')}>
                            <LocationInput 
                                label="Destination" 
                                value={endPoint.address}
                                onLocationSelect={setEndPoint}
                            />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700">Departure Time</label>
                            <input type="datetime-local" value={departureTime} onChange={(e) => setDepartureTime(e.target.value)} required className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Available Seats</label>
                            <input type="number" min="1" max="8" value={seats} onChange={(e) => setSeats(e.target.value)} required className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm" />
                        </div>

                        {distance > 0 && (
                            <div className="bg-slate-100 p-4 rounded-lg flex items-center">
                                <Route className="w-8 h-8 text-blue-500 mr-4 flex-shrink-0" />
                                <div>
                                    <p className="text-sm text-gray-600">Estimated Trip Distance</p>
                                    <p className="font-bold text-xl text-gray-800">{distance.toFixed(1)} km</p>
                                </div>
                            </div>
                        )}
                        
                        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 disabled:bg-blue-300">
                             {loading ? 'Creating Ride...' : 'Create Ride'}
                        </button>
                    </form>
                    <div className="h-96 md:h-full rounded-lg overflow-hidden border-2 border-gray-300 shadow-md">
                       <MapPicker 
                           onLocationSelect={handleMapSelect}
                           startPoint={startPoint.lat ? startPoint : null}
                           endPoint={endPoint.lat ? endPoint : null}
                           onRouteCalculated={setDistance}
                       />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddRidePage;

