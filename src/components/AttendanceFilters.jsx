import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, Download, UserPlus, MoreVertical, Building } from 'lucide-react';
import ConfirmationDialog from './ConfirmationDialog';

const AttendanceFilters = ({
  currentYear,
  currentMonth,
  searchTerm,
  departmentFilter,
  employees,
  filteredEmployees,
  onYearChange,
  onMonthChange,
  onSearchChange,
  onDepartmentFilterChange,
  onPrevMonth,
  onNextMonth,
  onToday,
  onAddEmployee,
  onExportData,
  getCurrentMonthDays,
  yearOptions,
  monthOptions,
  departments,
  canManageEmployees,
  canExportData
}) => {
  const [isActionOpen, setIsActionOpen] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsActionOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = () => {
    setIsActionOpen(false);
    setShowExportDialog(true);
  };

  const confirmExport = () => {
    setShowExportDialog(false);
    onExportData?.();
  };

  const handleAddEmployee = () => {
    setIsActionOpen(false);
    onAddEmployee();
  };
  
  // Refactored Stat Card Component for cleaner code and design consistency
  const StatCard = ({ title, value, color }) => {
      const colorClasses = {
          green: { text: 'text-green-600', border: 'hover:border-green-400', title: 'text-green-800' },
          blue: { text: 'text-blue-600', border: 'hover:border-blue-400', title: 'text-blue-800' },
          orange: { text: 'text-orange-600', border: 'hover:border-orange-400', title: 'text-orange-800' },
          purple: { text: 'text-purple-600', border: 'hover:border-purple-400', title: 'text-purple-800' },
      }[color];
      
      return (
        <div 
          className={`text-center p-4 bg-white rounded-xl border border-gray-200 shadow-md hover:shadow-lg ${colorClasses.border} transition-all duration-300 transform hover:-translate-y-0.5`}
        >
          <div className="text-xs text-gray-500 font-medium mb-1">{title}</div>
          <div className={`text-3xl font-extrabold ${colorClasses.text}`}>
            {value}
          </div>
        </div>
      );
  };


  return (
    <>
      {/* Export Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onConfirm={confirmExport}
        title="Export Attendance Data"
        message="This will download a CSV file containing all attendance data for the current month. Do you want to proceed?"
        confirmText="Export CSV"
        cancelText="Cancel"
        type="info"
      />

      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-5 sm:p-8 mb-8">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 sm:space-y-6 lg:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0"> 
        </div>
        
        {/* Controls Section */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Search Box */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10 pr-4 py-2 sm:py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 w-full sm:w-64 md:w-80 bg-white text-sm sm:text-base shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 rounded-full p-1 transition-colors"
              >
                <svg className="h-3 w-3 text-gray-400 hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Department Filter */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building className="h-4 w-4 text-gray-400" />
            </div>
            <select
              value={departmentFilter}
              onChange={(e) => onDepartmentFilterChange(e.target.value)}
              className="pl-10 pr-8 py-2 sm:py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 w-full sm:w-48 bg-white text-sm sm:text-base shadow-sm appearance-none"
            >
              <option value="">All Departments</option>
              {departments?.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          {/* Month/Year Navigation (Simplified styling) */}
          <div className="flex items-center space-x-2 sm:space-x-3 rounded-xl p-1">
            <button
              onClick={onPrevMonth}
              className="p-1.5 sm:p-2 rounded-lg text-gray-600 hover:bg-white hover:text-indigo-600 hover:shadow-md transition-all duration-200 transform hover:scale-105"
              title="Previous month"
            >
              <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            
            <div className="flex items-center space-x-1 sm:space-x-2">
              <div className="relative">
                <select
                  value={currentMonth}
                  onChange={(e) => onMonthChange(Number(e.target.value))}
                  // Use light gray background for selects, remove internal shadow/border
                  className="appearance-none border-0 py-1.5 sm:py-2.5 pl-2 sm:pl-3 pr-6 sm:pr-8 rounded-lg text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  {monthOptions.map((month, index) => (
                    <option key={month} value={index}>{month.substring(0, 3)}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 sm:px-2 text-gray-400">
                  <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              <span className="text-gray-400 font-bold text-xs sm:text-sm">/</span>
              
              <div className="relative">
                <select
                  value={currentYear}
                  onChange={(e) => onYearChange(Number(e.target.value))}
                  // Use light gray background for selects, remove internal shadow/border
                  className="appearance-none border-0 py-1.5 sm:py-2.5 pl-2 sm:pl-3 pr-6 sm:pr-8 rounded-lg text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                >
                  {yearOptions.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 sm:px-2 text-gray-400">
                  <svg className="h-3 w-3 sm:h-4 sm:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
            
            <button
              onClick={onNextMonth}
              className="p-1.5 sm:p-2 rounded-lg text-gray-600 hover:bg-white hover:text-indigo-600 hover:shadow-md transition-all duration-200 transform hover:scale-105"
              title="Next month"
            >
              <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            <button
              onClick={onToday}
              className="px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 flex items-center shadow-sm hover:shadow-md"
              title="Jump to current date"
            >
              <svg className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="hidden xs:inline">Today</span>
            </button>
            
            {/* Action Dropdown (Updated Button Style) */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsActionOpen(!isActionOpen)}
                className="px-3 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors duration-200 shadow-lg hover:shadow-xl flex items-center focus:ring-4 focus:ring-indigo-300"
                title="More actions"
              >
                <MoreVertical className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden xs:inline">Actions</span>
                <svg
                  className={`h-3 w-3 sm:h-4 sm:w-4 ml-1 transition-transform duration-200 ${isActionOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isActionOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 py-1 z-10 origin-top-right animate-in fade-in-0 zoom-in-95">
                  {canManageEmployees && onAddEmployee && (
                    <button
                      onClick={handleAddEmployee}
                      className="w-full px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-150 flex items-center"
                    >
                      <UserPlus className="h-4 w-4 mr-3 text-indigo-500" />
                      Add Employee
                    </button>
                  )}
                  {canExportData && onExportData && (
                    <button
                      onClick={handleExport}
                      className="w-full px-4 py-3 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors duration-150 flex items-center"
                    >
                      <Download className="h-4 w-4 mr-3 text-indigo-500" />
                      Export Data (CSV)
                    </button>
                  )}
                  {(!canManageEmployees || !canExportData) && (
                    <div className="px-4 py-3 text-sm text-gray-500 text-center">
                      No actions available
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Bar (Refactored for cleaner look) */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
              title="Total Employees" 
              value={employees.length} 
              color="green" 
          />
          
          <StatCard 
              title="Filtered Results" 
              value={filteredEmployees.length} 
              color="blue" 
          />
          
          <StatCard 
              title="Working Days" 
              value={getCurrentMonthDays()} 
              color="orange" 
          />
          
          <StatCard 
              title="Current Day" 
              value={new Date().getDate()} 
              color="purple" 
          />
        </div>
      </div>
    </div>
    </>
  );
};

export default AttendanceFilters;