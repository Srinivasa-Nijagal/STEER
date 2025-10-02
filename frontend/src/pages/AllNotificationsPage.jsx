import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell } from '../components/Icons';

const AllNotificationsPage = () => {
    const { token } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAllNotifications = async () => {
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
                console.error("Failed to fetch all notifications", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllNotifications();
    }, [token]);

    return (
        <div className="bg-slate-50 min-h-[calc(100vh-68px)] p-8">
            <div className="container mx-auto max-w-2xl">
                <h1 className="text-4xl font-bold text-gray-800 mb-6 flex items-center">
                    <Bell className="w-8 h-8 mr-3 text-blue-500" />
                    All Notifications
                </h1>
                {loading ? (
                    <p>Loading notifications...</p>
                ) : (
                    <div className="bg-white rounded-lg shadow-md">
                        <ul className="divide-y divide-gray-200">
                            {notifications.length > 0 ? (
                                notifications.map(n => (
                                    <li key={n._id} className="p-4">
                                        <p className="text-gray-700">{n.message}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {new Date(n.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                                        </p>
                                    </li>
                                ))
                            ) : (
                                <li className="p-6 text-center text-gray-500">You have no notifications.</li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AllNotificationsPage;
