import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck } from '../components/Icons';

const VerificationPage = ({ setPage }) => {
    const { user, token } = useAuth();
    const [name, setName] = useState(user?.name || '');
    const [dlNumber, setDlNumber] = useState('');
    const [rcNumber, setRcNumber] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !dlNumber || !rcNumber) {
            setError('Please fill all fields.');
            return;
        }
        setLoading(true);
        setError('');
        setMessage('');

        try {
            const res = await fetch('https://steer-backend.onrender.com/api/users/request-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, dlNumber, rcNumber })
            });
            const data = await res.json();
            if (res.ok) {
                setMessage('Your verification request has been submitted. You will be notified upon approval.');
            } else {
                throw new Error(data.message);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-slate-50 min-h-[calc(100vh-68px)] p-8 flex items-center justify-center">
            <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8">
                <div className="text-center mb-6">
                    <ShieldCheck className="w-16 h-16 text-blue-500 mx-auto" />
                    <h1 className="text-3xl font-bold text-gray-800 mt-2">Driver Verification</h1>
                    <p className="text-gray-600 mt-2">Please provide your details to offer rides on STEER.</p>
                </div>

                {message ? (
                    <div className="bg-green-100 text-green-800 p-4 rounded-lg text-center">
                        <p>{message}</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && <p className="bg-red-100 text-red-700 p-3 rounded-lg text-center">{error}</p>}
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Full Name</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 w-full p-2 border rounded-md" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Driving License Number</label>
                            <input type="text" value={dlNumber} onChange={(e) => setDlNumber(e.target.value.toUpperCase())} required className="mt-1 w-full p-2 border rounded-md" placeholder="e.g., KA0120200012345" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Vehicle RC Number</label>
                            <input type="text" value={rcNumber} onChange={(e) => setRcNumber(e.target.value.toUpperCase())} required className="mt-1 w-full p-2 border rounded-md" placeholder="e.g., KA01AB1234" />
                        </div>
                        <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition duration-300 disabled:bg-blue-300">
                            {loading ? 'Submitting...' : 'Submit for Verification'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default VerificationPage;