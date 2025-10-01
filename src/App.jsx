import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import ResetPasswordPage from "./pages/ResetPasswordPage"; // Add this import
import EmployeeRegistrationPage from "./pages/EmployeeRegistrationPage";
import EditEmployeePage from "./pages/EditEmployeePage";
import AttendancePage from "./pages/AttendancePage";
import AdminUsersPage from "./pages/AdminUsersPage";
import DepartmentsPage from "./pages/DepartmentsPage";
import Sidebar from "./components/Sidebar";
import { supabase } from "./lib/supabase";
import { PermissionsProvider } from "./hooks/usePermissions.jsx";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setIsLoggedIn(true);
        setUser(user);
        // Store authentication status in localStorage for persistence
        localStorage.setItem("isAuthenticated", "true");
      } else {
        // Check localStorage for authentication status
        const storedAuth = localStorage.getItem("isAuthenticated");
        if (storedAuth === "true") {
          setIsLoggedIn(true);
        }
      }
    };

    checkUser();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsLoggedIn(true);
        setUser(session.user);
        localStorage.setItem("isAuthenticated", "true");
      } else {
        setIsLoggedIn(false);
        setUser(null);
        localStorage.removeItem("isAuthenticated");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUser(null);
    localStorage.removeItem("isAuthenticated");
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Layout component for authenticated routes
  const AuthenticatedLayout = ({ children }) => (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        onLogout={handleLogout}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );

  return (
    <PermissionsProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <Routes>
            <Route
              path="/login"
              element={
                isLoggedIn ? <Navigate to="/attendance" /> : <LoginPage />
              }
            />
            {/* Add the reset password route - accessible without authentication */}
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route
              path="/admin-users"
              element={
                isLoggedIn ? (
                  <AuthenticatedLayout>
                    <AdminUsersPage />
                  </AuthenticatedLayout>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/departments"
              element={
                isLoggedIn ? (
                  <AuthenticatedLayout>
                    <DepartmentsPage />
                  </AuthenticatedLayout>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/employee-registration"
              element={
                isLoggedIn ? (
                  <AuthenticatedLayout>
                    <EmployeeRegistrationPage />
                  </AuthenticatedLayout>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/edit-employee/:id"
              element={
                isLoggedIn ? (
                  <AuthenticatedLayout>
                    <EditEmployeePage />
                  </AuthenticatedLayout>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/attendance"
              element={
                isLoggedIn ? (
                  <AuthenticatedLayout>
                    <AttendancePage />
                  </AuthenticatedLayout>
                ) : (
                  <Navigate to="/login" />
                )
              }
            />
            <Route
              path="/"
              element={<Navigate to={isLoggedIn ? "/attendance" : "/login"} />}
            />
          </Routes>
        </div>
      </Router>
    </PermissionsProvider>
  );
}

export default App;
