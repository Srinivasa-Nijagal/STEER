import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    // If token doesn't exist, redirect to login page
    return <Navigate to="/login" />;
  }

  return children; // If authenticated, render the protected component
};

export default ProtectedRoute;
