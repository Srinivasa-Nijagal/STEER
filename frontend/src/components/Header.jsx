import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Car, LogOut, Bell, Trash, UserCog } from './Icons';

const Header = ({ setPage }) => {
    const { isAuthenticated, user, logout, token } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!token) return;
        try {
            const res = await fetch('http://localhost:5000/api/notifications', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setNotifications(data);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    }, [token]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
            return () => clearInterval(interval);
        }
    }, [isAuthenticated, fetchNotifications]);
    
    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleBellClick = async () => {
        setShowNotifications(prev => !prev);
        if (unreadCount > 0) {
            try {
                 await fetch('http://localhost:5000/api/notifications/read', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                setNotifications(currentNotifications => 
                    currentNotifications.map(n => ({ ...n, isRead: true }))
                );
            } catch (error) {
                console.error("Failed to mark notifications as read", error);
            }
        }
    };

    const handleClearAll = async () => {
        if (!window.confirm("Are you sure you want to clear all your notifications?")) return;
        try {
            const res = await fetch('http://localhost:5000/api/notifications/clear-all', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setNotifications([]);
                setShowNotifications(false);
            } else {
                const data = await res.json();
                throw new Error(data.message);
            }
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    return (
        <header className="bg-white shadow-md sticky top-0 z-50">
            <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
                <div onClick={() => setPage('home')} className="cursor-pointer">
                    <h1 className="text-3xl font-bold text-blue-600 flex items-center">
                        <Car className="w-8 h-8 mr-2"/> STEER
                    </h1>
                </div>
                <div className="flex items-center space-x-4">
                    {isAuthenticated ? (
                        <>
                            <div className="relative">
                                <button onClick={handleBellClick} className="relative text-gray-600 hover:text-blue-600">
                                    <Bell className="w-6 h-6" />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white animate-pulse">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                                {showNotifications && (
                                    <div className="absolute right-0 mt-2 w-screen max-w-sm md:w-80 bg-white rounded-lg shadow-xl border overflow-hidden">
                                        <div className="p-3 flex justify-between items-center border-b">
                                            <span className="font-semibold text-gray-700">Notifications</span>
                                            {notifications.length > 0 && (
                                                <button onClick={handleClearAll} className="text-xs text-red-500 hover:text-red-700 flex items-center">
                                                    <Trash className="w-3 h-3 mr-1" /> Clear All
                                                </button>
                                            )}
                                        </div>
                                        <ul className="max-h-96 overflow-y-auto">
                                            {notifications.length > 0 ? (
                                                notifications.slice(0, 4).map(n => (
                                                    <li key={n._id} className="border-b p-3 text-sm text-gray-600">
                                                        {n.message}
                                                        <div className="text-xs text-gray-400 mt-1">
                                                            {new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </li>
                                                ))
                                            ) : (
                                                <li className="p-4 text-center text-gray-500">You have no notifications.</li>
                                            )}
                                        </ul>
                                        <div className="p-2 bg-gray-50 text-center border-t">
                                            <button 
                                                onClick={() => {
                                                    setPage('all-notifications');
                                                    setShowNotifications(false);
                                                }} 
                                                className="text-sm font-semibold text-blue-600 hover:underline"
                                            >
                                                View All Notifications
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {user && user.isAdmin && (
                                <button onClick={() => setPage('admin-dashboard')} className="flex items-center text-gray-600 hover:text-blue-600">
                                    <UserCog className="w-5 h-5 mr-1"/> Admin
                                </button>
                            )}

                            <span className="text-gray-700 hidden md:block">Welcome, {user.name}!</span>
                            <button onClick={() => setPage('dashboard')} className="text-gray-600 hover:text-blue-600">Dashboard</button>
                            <button onClick={logout} className="flex items-center text-red-500 hover:text-red-700">
                                <LogOut className="w-5 h-5 mr-1"/> Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setPage('login')} className="text-gray-600 hover:text-blue-600">Login</button>
                            <button onClick={() => setPage('register')} className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition duration-300">
                                Sign Up
                            </button>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
};

export default Header;

