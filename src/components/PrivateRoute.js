import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const PrivateRoute = ({ role }) => {
  // Retrieve token and user data from localStorage
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('userData');

  // Parse the userData, if exists
  const user = token && userData ? JSON.parse(userData) : null;

  // Debugging log for user state
  console.log('PrivateRoute: user:', user);

  // If no token or user data, redirect to login
  if (!token || !user) {
    console.log('No user or token found. Redirecting to login.');
    return <Navigate to="/login" />;
  }

  
  

  // If the role is provided and user doesn't have the required role, redirect to unauthorized page
  if (role && user.role !== role) {
    console.log(`Access Denied. User role: ${user.role}, Required role: ${role}`);
    return <Navigate to="/unauthorized" />;
  }

  // Render the protected component if user is authenticated and has the correct role
  return <Outlet />;
};

export default PrivateRoute;
