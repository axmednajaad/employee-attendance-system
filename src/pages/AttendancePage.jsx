import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import AttendanceFilters from '../components/AttendanceFilters';
import AttendanceTable from '../components/AttendanceTable';
import Pagination from '../components/Pagination';
import { DEPARTMENTS } from '../constants/departments';
import { usePermissions } from '../hooks/usePermissions.jsx';

const AttendancePage = () => {
  const [employees, setEmployees] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const navigate = useNavigate();
  const { canViewAttendance, canWriteAttendance, canExportData, canManageEmployees, loading: permissionsLoading } = usePermissions();

  // Helper functions
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const formatDate = (year, month, day) => {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${monthStr}-${dayStr}`;
  };

  const getCurrentMonthDays = () => getDaysInMonth(currentYear, currentMonth);

  const getMonthName = (monthIndex) => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[monthIndex];
  };

  const yearOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
      years.push(i);
    }
    return years;
  };

  const monthOptions = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Filter employees based on search term and department
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.mobile_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = departmentFilter === '' || employee.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  // Check permissions and fetch data
  useEffect(() => {
    if (!permissionsLoading) {
      if (!canViewAttendance) {
        setError('You do not have permission to view attendance data.');
        setLoading(false);
        return;
      }

      const fetchData = async () => {
        setLoading(true);
        setError('');

        try {
          // Fetch employees
          const { data: employeesData, error: employeesError } = await supabase
            .from('employees')
            .select('*')
            .eq('is_active', true)
            .order('full_name');

          if (employeesError) throw employeesError;
          setEmployees(employeesData || []);

          // Fetch attendance data
          const startDate = formatDate(currentYear, currentMonth, 1);
          const endDate = formatDate(currentYear, currentMonth, getDaysInMonth(currentYear, currentMonth));

          const { data: attendanceData, error: attendanceError } = await supabase
            .from('attendance')
            .select('*')
            .gte('date', startDate)
            .lte('date', endDate);

          if (attendanceError) throw attendanceError;

          // Organize attendance data
          const organizedData = {};
          attendanceData?.forEach(record => {
            if (!organizedData[record.employee_id]) {
              organizedData[record.employee_id] = {};
            }
            organizedData[record.employee_id][record.date] = record.status;
          });

          setAttendanceData(organizedData);
        } catch (error) {
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };

      fetchData();
    }
  }, [currentYear, currentMonth, canViewAttendance, permissionsLoading]);

  // Handle attendance status change
  const handleStatusChange = async (employeeId, date, newStatus) => {
    setSaving(true);
    setError('');

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Update local state
      setAttendanceData(prev => ({
        ...prev,
        [employeeId]: {
          ...prev[employeeId],
          [date]: newStatus
        }
      }));

      // Save to Supabase
      const { error } = await supabase
        .from('attendance')
        .upsert({
          employee_id: employeeId,
          date: date,
          status: newStatus,
          created_by: user?.id,
          updated_by: user?.id
        }, {
          onConflict: ['employee_id', 'date']
        });

      if (error) throw error;
    } catch (error) {
      setError(error.message);
      // Revert on error
      setAttendanceData(prev => {
        const newData = { ...prev };
        if (newData[employeeId] && newData[employeeId][date]) {
          delete newData[employeeId][date];
        }
        return newData;
      });
    } finally {
      setSaving(false);
    }
  };

  // Export data to CSV
  const handleExportData = () => {
    try {
      // Create CSV content
      const headers = ['Employee ID', 'Full Name', 'Department', ...Array.from({ length: getDaysInMonth(currentYear, currentMonth) }, (_, i) => i + 1)];
      const rows = filteredEmployees.map(employee => {
        const rowData = [
          employee.employee_id,
          employee.full_name,
          employee.department,
          ...Array.from({ length: getDaysInMonth(currentYear, currentMonth) }, (_, i) => {
            const date = formatDate(currentYear, currentMonth, i + 1);
            return attendanceData[employee.employee_id]?.[date] || '';
          })
        ];
        return rowData;
      });

      // Convert to CSV format
      let csvContent = headers.join(',') + '\n';
      rows.forEach(row => {
        csvContent += row.map(field => `"${field}"`).join(',') + '\n';
      });

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `attendance_${getMonthName(currentMonth)}_${currentYear}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      setError('Failed to export data: ' + error.message);
    }
  };

  // Navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentYear(prev => prev - 1);
      setCurrentMonth(11);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
    setCurrentPage(1);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentYear(prev => prev + 1);
      setCurrentMonth(0);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
    setCurrentPage(1);
  };

  const handleToday = () => {
    setCurrentYear(new Date().getFullYear());
    setCurrentMonth(new Date().getMonth());
    setCurrentPage(1);
  };

  const handleAddEmployee = () => navigate('/employee-registration');

  const handlePageChange = (page, newItemsPerPage = itemsPerPage) => {
    setCurrentPage(page);
    if (newItemsPerPage !== itemsPerPage) {
      setItemsPerPage(newItemsPerPage);
    }
  };

  // Reset page on search or department filter
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, departmentFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Error Display */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        {/* Filters Component */}
        <AttendanceFilters
          currentYear={currentYear}
          currentMonth={currentMonth}
          searchTerm={searchTerm}
          departmentFilter={departmentFilter}
          employees={employees}
          filteredEmployees={filteredEmployees}
          onYearChange={setCurrentYear}
          onMonthChange={setCurrentMonth}
          onSearchChange={setSearchTerm}
          onDepartmentFilterChange={setDepartmentFilter}
          onPrevMonth={handlePrevMonth}
          onNextMonth={handleNextMonth}
          onToday={handleToday}
          onAddEmployee={canManageEmployees ? handleAddEmployee : null}
          onExportData={canExportData ? handleExportData : null}
          getMonthName={getMonthName}
          getCurrentMonthDays={getCurrentMonthDays}
          yearOptions={yearOptions()}
          monthOptions={monthOptions}
          departments={DEPARTMENTS}
          canManageEmployees={canManageEmployees}
          canExportData={canExportData}
        />

        {/* Table Section */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <>
              <AttendanceTable
                employees={filteredEmployees}
                attendanceData={attendanceData}
                currentYear={currentYear}
                currentMonth={currentMonth}
                saving={saving}
                onStatusChange={handleStatusChange}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
                canWriteAttendance={canWriteAttendance}
                canManageEmployees={canManageEmployees}
              />
              
              <Pagination
                currentPage={currentPage}
                totalItems={filteredEmployees.length}
                itemsPerPage={itemsPerPage}
                onPageChange={handlePageChange}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;