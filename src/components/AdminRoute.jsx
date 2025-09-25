import React from 'react';
import { Navigate } from 'react-router-dom';

// In a real application, you would check user roles/permissions here
// For now, we'll assume any authenticated user is an admin
const AdminRoute = ({ children }) => {
  // Get user authentication status from localStorage or context
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  
  // In a real app, you would also check if the user has admin privileges
  // const isAdmin = user.role === 'admin';
  
  // For demonstration, we'll allow access to authenticated users only
  // In a production app, you would implement proper role checking
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default AdminRoute;