import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  LogOut, 
  UserPlus, 
  Home,
  Menu,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, toggleSidebar, onLogout }) => {
  const location = useLocation();
  
  const navItems = [
    { name: 'Dashboard', path: '/attendance', icon: Home },
    { name: 'Employees', path: '/employee-registration', icon: Users },
    { name: 'Admin Users', path: '/admin-users', icon: UserPlus },
  ];

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        ></div>
      )}
      
      {/* Sidebar */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-2">
              <Calendar className="h-8 w-8 text-indigo-600" />
              <span className="text-xl font-bold text-gray-800">Attendance</span>
            </div>
            <button 
              onClick={toggleSidebar}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-2 py-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                // Hide Register Admin for non-admin users (we'll implement this logic later)
                if (item.path === '/admin-users') {
                  // For now, we'll show it to all authenticated users
                  // In a real app, you would check user role/permissions here
                }
                
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={toggleSidebar}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          {/* Logout button */}
          <div className="p-4 border-t">
            <button
              onClick={onLogout}
              className="flex items-center w-full px-4 py-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu button */}
      {!isOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed top-4 left-4 z-30 p-2 rounded-md bg-white shadow-md lg:hidden"
        >
          <Menu className="h-6 w-6 text-gray-600" />
        </button>
      )}
    </>
  );
};

export default Sidebar;