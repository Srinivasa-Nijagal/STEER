import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Car, LogOut } from './Icons';

const Header = ({ setPage }) => {
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setPage('home');
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
              <span className="text-gray-700 hidden md:block">Welcome, {user.name}!</span>
               <button onClick={() => setPage('dashboard')} className="text-gray-600 hover:text-blue-600">Dashboard</button>
              <button onClick={handleLogout} className="flex items-center text-red-500 hover:text-red-700">
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
