import {React} from 'react';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import LocationInput from '../components/LocationInput';
import MapPicker from '../components/MapPicker';
import { Route } from '../components/Icons';

const AddRidePage = ({ setPage }) => {
    const [startPoint, setStartPoint] = useState({ address: '', lat: null, lon: null });
    const [endPoint, setEndPoint] = useState({ address: '', lat: null, lon: null });
    const [departureTime, setDepartureTime] = useState('');
    const [seats, setSeats] = useState(1);
    const [maxDetour, setMaxDetour] = useState(3);
    const [distance, setDistance] = useState(0);
    const [activeMapForInput, setActiveMapForInput] = useState('start');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { token } = useAuth();
    const [vehicleType, setVehicleType] = useState('Car');
    const [vehicleNumber, setVehicleNumber] = useState('');
    
    const handleMapSelect = (location) => {
        if (activeMapForInput === 'start') {
            setStartPoint(location);
        } else {
            setEndPoint(location);
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!startPoint.lat || !endPoint.lat || !departureTime || seats < 1 || !vehicleNumber) {
            setError('Please fill all fields, including vehicle number.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`https://steer-backend.onrender.com/api/rides/add`, {
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
                    maxDetour: parseInt(maxDetour),
                    vehicleType,
                    vehicleNumber,
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
        <div className="bg-slate-50 min-h-[calc(100vh-68px)] p-4 sm:p-8 flex items-center justify-center">
            <div className="container mx-auto max-w-6xl bg-white rounded-xl shadow-2xl p-8">
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
                            <label className="block text-sm font-medium text-gray-700">Vehicle Type</label>
                            <div className="flex space-x-4 mt-1">
                                <label className="flex items-center">
                                    <input type="radio" value="Car" checked={vehicleType === 'Car'} onChange={(e) => setVehicleType(e.target.value)} className="form-radio h-4 w-4 text-blue-600"/>
                                    <span className="ml-2 text-gray-700">Car</span>
                                </label>
                                <label className="flex items-center">
                                    <input type="radio" value="2-Wheeler" checked={vehicleType === '2-Wheeler'} onChange={(e) => setVehicleType(e.target.value)} className="form-radio h-4 w-4 text-blue-600"/>
                                    <span className="ml-2 text-gray-700">2-Wheeler</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Vehicle Number</label>
                            <input type="text" value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())} required className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm" placeholder="e.g., KA01AB1234" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Available Seats</label>
                            <input type="number" min="1" max="8" value={seats} onChange={(e) => setSeats(e.target.value)} required className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Max Detour You're Willing to Make</label>
                            <div className="flex items-center space-x-4 mt-1">
                                <input 
                                    type="range" 
                                    min="1" 
                                    max="10" 
                                    value={maxDetour}
                                    onChange={(e) => setMaxDetour(e.target.value)}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                />
                                <span className="font-semibold text-blue-600 w-12 text-center">{maxDetour} km</span>
                            </div>
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
                    <div className="relative z-0 h-96 md:h-full rounded-lg overflow-hidden border-2 border-gray-300 shadow-md">
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

