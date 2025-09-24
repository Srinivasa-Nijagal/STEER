import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, setPage }) => {
    const { isAuthenticated, loading } = useAuth();

    useEffect(() => {
      if (!loading && !isAuthenticated) {
          setPage('login');
      }
    }, [isAuthenticated, loading, setPage]);

    if (loading) {
      return <div className="flex justify-center items-center h-[calc(100vh-68px)]">Loading session...</div>;
    }
    
    return isAuthenticated ? children : null;
};

export default ProtectedRoute;
