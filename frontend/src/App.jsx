import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';

import Header from './components/Header';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import AddRidePage from './pages/AddRidePage';
import SearchRidePage from './pages/SearchRidePage';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';

const PageRenderer = ({ page, setPage }) => {
    switch (page) {
        case 'login':
            return <AuthPage isLogin={true} setPage={setPage} />;
        case 'register':
            return <AuthPage isLogin={false} setPage={setPage} />;
        case 'add-ride':
            return <ProtectedRoute setPage={setPage}><AddRidePage setPage={setPage} /></ProtectedRoute>;
        case 'search-ride':
            return <ProtectedRoute setPage={setPage}><SearchRidePage setPage={setPage} /></ProtectedRoute>;
        case 'dashboard':
            return <ProtectedRoute setPage={setPage}><DashboardPage /></ProtectedRoute>;
        case 'home':
        default:
            return <HomePage setPage={setPage} />;
    }
};

export default function App() {
    const [page, setPage] = useState('home');

    return (
        <AuthProvider>
            <div className="font-sans">
                <Header setPage={setPage} />
                <main>
                    <PageRenderer page={page} setPage={setPage} />
                </main>
            </div>
        </AuthProvider>
    );
}

