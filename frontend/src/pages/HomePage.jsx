import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Car, User, Money, Leaf, Community, ClipboardList, PlusCircle, MapPin, CalendarClock, Sun, Cloud, CloudRain, CalendarDays } from '../components/Icons';

const LoggedOutHome = ({ setPage }) => (
    <>
        <div className="relative text-center">
            <div 
                className="absolute inset-0 bg-blue-500 bg-cover bg-center" 
                style={{backgroundImage: "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=2070&auto-format&fit=crop')"}}
            ></div>
            <div className="relative min-h-[calc(85vh)] flex flex-col items-center justify-center text-white p-6">
                <h1 className="text-5xl md:text-6xl font-extrabold mb-4 leading-tight shadow-text">Share Your Ride, Share the Cost</h1>
                <p className="text-lg md:text-xl mb-8 max-w-2xl shadow-text">
                    Join a community of commuters. Find a ride or offer one with STEER - the smart, simple, and sustainable way to travel.
                </p>
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <button onClick={() => setPage('search-ride')} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full text-lg hover:bg-blue-700 transition duration-300 transform hover:scale-105 shadow-lg">
                        Find a Ride
                    </button>
                    <button onClick={() => setPage('add-ride')} className="bg-white text-blue-600 font-bold py-3 px-8 rounded-full text-lg hover:bg-gray-200 transition duration-300 transform hover:scale-105 shadow-lg">
                        Offer a Ride
                    </button>
                </div>
            </div>
        </div>
        
        <section className="bg-white py-16 px-4">
            <div className="container mx-auto text-center">
                <h2 className="text-3xl font-bold text-gray-800 mb-8">Why STEER?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="flex flex-col items-center">
                        <div className="bg-blue-100 p-5 rounded-full mb-4">
                            <Money className="w-10 h-10 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Save Money</h3>
                        <p className="text-gray-600">Split fuel costs and reduce wear and tear on your car. Commuting just got a lot cheaper.</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="bg-blue-100 p-5 rounded-full mb-4">
                            <Leaf className="w-10 h-10 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Eco-Friendly</h3>
                        <p className="text-gray-600">Fewer cars on the road means a smaller carbon footprint. Do your part for the environment.</p>
                    </div>
                    <div className="flex flex-col items-center">
                        <div className="bg-blue-100 p-5 rounded-full mb-4">
                            <Community className="w-10 h-10 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Build Community</h3>
                        <p className="text-gray-600">Meet new people, network, and make your daily commute more enjoyable and social.</p>
                    </div>
                </div>
            </div>
        </section>
    </>
);

const WeatherCard = () => {
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWeather = async (lat, lon) => {
            try {
                const locationQuery = lat && lon ? `${lat},${lon}` : 'Bengaluru';
                const response = await fetch(`https://wttr.in/${locationQuery}?format=j1`);
                const data = await response.json();
                setWeather(data);
            } catch (error) {
                console.error("Failed to fetch weather", error);
            } finally {
                setLoading(false);
            }
        };

        navigator.geolocation.getCurrentPosition(
            (position) => fetchWeather(position.coords.latitude, position.coords.longitude),
            () => fetchWeather(null, null)
        );
    }, []);

    const getWeatherIcon = () => {
        if (!weather) return <Cloud className="w-10 h-10 text-gray-500" />;
        const desc = weather.current_condition[0].weatherDesc[0].value.toLowerCase();
        if (desc.includes('rain') || desc.includes('shower')) return <CloudRain className="w-10 h-10 text-blue-500" />;
        if (desc.includes('cloudy') || desc.includes('overcast')) return <Cloud className="w-10 h-10 text-gray-500" />;
        return <Sun className="w-10 h-10 text-yellow-500" />;
    };

    const today = new Date();

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
            <h2 className="text-2xl font-bold text-gray-700 mb-4 flex items-center">
                <CalendarDays className="w-6 h-6 mr-3 text-blue-500" />
                Today's Outlook
            </h2>
            {loading ? <p>Loading weather...</p> : weather ? (
                <div>
                    <p className="text-sm text-gray-500 mb-2">
                        {today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-4xl font-bold text-gray-800">{weather.current_condition[0].temp_C}°C</p>
                            <p className="font-semibold text-gray-600">{weather.nearest_area[0].areaName[0].value}</p>
                        </div>
                        <div className="text-center">
                             {getWeatherIcon()}
                             <p className="text-xs text-gray-500 mt-1">{weather.current_condition[0].weatherDesc[0].value}</p>
                        </div>
                    </div>
                </div>
            ) : <p>Could not load weather data.</p>}
        </div>
    );
};

const LoggedInHome = ({ setPage, user }) => {
    const { token } = useAuth();
    const [stats, setStats] = useState({ driving: 0, riding: 0 });
    const [upcomingRides, setUpcomingRides] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRideData = async () => {
            try {
                const res = await fetch(`http://localhost:5000/api/rides/my-rides`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok) {
                    setStats({ driving: data.driving.length, riding: data.riding.length });

                    const allRides = [
                        ...data.driving.map(ride => ({ ...ride, type: 'driving' })),
                        ...data.riding.map(ride => ({ ...ride, type: 'riding' }))
                    ];

                    const futureRides = allRides
                        .filter(ride => new Date(ride.departureTime) > new Date())
                        .sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime));

                    setUpcomingRides(futureRides.slice(0, 3));
                }
            } catch (error) {
                console.error("Failed to fetch user ride data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchRideData();
    }, [token]);

    return (
     <div className="bg-slate-100 min-h-[calc(100vh-68px)] p-4 sm:p-8">
        <div className="container mx-auto max-w-7xl">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Column */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Welcome back, {user.name}!</h1>
                        <p className="text-lg text-gray-600 mt-1">Here's your carpooling summary.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white rounded-lg shadow p-5 flex items-center">
                            <div className="bg-blue-100 p-3 rounded-full mr-4">
                                <Car className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Rides You're Driving</p>
                                <p className="text-2xl font-bold text-gray-800">{loading ? '...' : stats.driving}</p>
                            </div>
                        </div>
                         <div className="bg-white rounded-lg shadow p-5 flex items-center">
                            <div className="bg-green-100 p-3 rounded-full mr-4">
                                <User className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Rides You've Booked</p>
                                <p className="text-2xl font-bold text-gray-800">{loading ? '...' : stats.riding}</p>
                            </div>
                        </div>
                    </div>

                    <div>
                         <h2 className="text-2xl font-bold text-gray-700 mb-4">Quick Actions</h2>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div onClick={() => setPage('search-ride')} className="bg-white rounded-lg shadow p-6 text-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-transform duration-300">
                                <MapPin className="w-12 h-12 text-blue-500 mx-auto mb-3" />
                                <h3 className="text-xl font-semibold text-gray-800">Find a Ride</h3>
                            </div>
                            <div onClick={() => setPage('add-ride')} className="bg-white rounded-lg shadow p-6 text-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-transform duration-300">
                                <PlusCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                                <h3 className="text-xl font-semibold text-gray-800">Offer a New Ride</h3>
                            </div>
                            <div onClick={() => setPage('dashboard')} className="bg-white rounded-lg shadow p-6 text-center cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-transform duration-300">
                                <ClipboardList className="w-12 h-12 text-purple-500 mx-auto mb-3" />
                                <h3 className="text-xl font-semibold text-gray-800">View My Dashboard</h3>
                            </div>
                         </div>
                    </div>
                </div>
                
                {/* Right Sidebar */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24">
                        <div className="bg-white rounded-lg shadow-md p-6">
                            <h2 className="text-2xl font-bold text-gray-700 mb-4 flex items-center">
                                <CalendarClock className="w-6 h-6 mr-3 text-blue-500" />
                                Upcoming Rides
                            </h2>
                            {loading ? (
                                <p className="text-gray-500">Loading rides...</p>
                            ) : upcomingRides.length > 0 ? (
                                <ul className="space-y-4">
                                    {upcomingRides.map(ride => (
                                        <li key={ride._id} className="border-l-4 border-blue-500 pl-4 py-2 bg-slate-100 rounded-r-lg">
                                            <p className="font-semibold text-gray-800">
                                                {ride.type === 'driving' ? `Driving to ${ride.destination.address.split(',')[0]}` : `Riding with ${ride.driver.name}`}
                                            </p>
                                            <p className="text-sm text-gray-500">
                                                {new Date(ride.departureTime).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-gray-500">You have no upcoming rides scheduled.</p>
                            )}
                        </div>
                        <WeatherCard />
                    </div>
                </div>
            </div>
        </div>
    </div>
    );
};


const HomePage = ({ setPage }) => {
    const { isAuthenticated, user } = useAuth();
    return isAuthenticated ? <LoggedInHome setPage={setPage} user={user} /> : <LoggedOutHome setPage={setPage} />;
};

export default HomePage;

