import React from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
    return (
        <nav className="bg-white shadow-md py-4 px-6">
            <div className="flex justify-between items-center">
                <Link to="/">
                    <h1 className="text-2xl font-bold text-blue-700">STEER</h1>
                </Link>

                <ul className="flex space-x-6">
                    <li>
                        <Link
                            to="/create-ride"
                            className="text-gray-700 hover:text-blue-700 transition duration-300"
                        >
                            Create Ride
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/profile"
                            className="text-gray-700 hover:text-blue-700 transition duration-300"
                        >
                            Profile
                        </Link>
                    </li>
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;
