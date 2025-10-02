import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const AdminDashboardPage = () => {
    const { token } = useAuth();
    const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'verified', 'rejected'
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    const fetchUsers = async (status) => {
        setLoading(true);
        setMessage('');
        let endpoint = '';
        switch (status) {
            case 'verified':
                endpoint = 'verified-users';
                break;
            case 'rejected':
                endpoint = 'rejected-users';
                break;
            case 'pending':
            default:
                endpoint = 'pending-verifications';
                break;
        }

        try {
            const res = await fetch(`http://localhost:5000/api/admin/${endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setUsers(data);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            setMessage(`Error fetching users: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(activeTab);
    }, [token, activeTab]);

    const handleAction = async (action, userId) => {
        const confirmMessage = `Are you sure you want to ${action} this user's verification?`;
        if (!window.confirm(confirmMessage)) return;

        const endpoint = action === 'approve' ? 'verify-user' : 'reject-user';

        try {
            const res = await fetch(`http://localhost:5000/api/admin/${endpoint}/${userId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                setMessage(`User ${action}d successfully!`);
                fetchUsers(activeTab); // Refresh the current list
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            setMessage(`Error: ${error.message}`);
        }
    };

    const UserListItem = ({ user }) => (
        <li className="p-4 flex justify-between items-center">
            <div>
                <p className="font-semibold text-gray-800">{user.name}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
                {user.dlNumber && user.rcNumber && (
                    <div className="text-xs text-gray-400 mt-1 space-y-1">
                        <p><span className="font-semibold">DL:</span> {user.dlNumber}</p>
                        <p><span className="font-semibold">RC:</span> {user.rcNumber}</p>
                    </div>
                )}
            </div>
            <div className="flex space-x-2">
                {activeTab !== 'verified' && (
                    <button onClick={() => handleAction('approve', user._id)} className="bg-green-500 text-white px-3 py-1 rounded-md font-semibold hover:bg-green-600">
                        Approve
                    </button>
                )}
                {activeTab !== 'rejected' && (
                    <button onClick={() => handleAction('reject', user._id)} className="bg-red-500 text-white px-3 py-1 rounded-md font-semibold hover:bg-red-600">
                        Reject
                    </button>
                )}
            </div>
        </li>
    );

    return (
        <div className="bg-slate-50 min-h-[calc(100vh-68px)] p-8">
            <div className="container mx-auto max-w-5xl">
                <h1 className="text-4xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
                {message && <p className="bg-blue-100 text-blue-800 p-3 rounded-lg mb-4">{message}</p>}
                
                <div className="flex border-b border-gray-200 mb-6">
                    <button onClick={() => setActiveTab('pending')} className={`py-2 px-4 font-semibold ${activeTab === 'pending' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-blue-500'}`}>Pending</button>
                    <button onClick={() => setActiveTab('verified')} className={`py-2 px-4 font-semibold ${activeTab === 'verified' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-blue-500'}`}>Approved</button>
                    <button onClick={() => setActiveTab('rejected')} className={`py-2 px-4 font-semibold ${activeTab === 'rejected' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-blue-500'}`}>Rejected</button>
                </div>

                {loading ? <p>Loading users...</p> : (
                    <div className="bg-white rounded-lg shadow-md">
                        <ul className="divide-y divide-gray-200">
                            {users.length > 0 ? users.map(user => <UserListItem key={user._id} user={user} />) 
                            : <li className="p-6 text-center text-gray-500">No users found in this category.</li>}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboardPage;

