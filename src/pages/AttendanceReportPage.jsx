import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { usePermissions } from "../hooks/usePermissions.jsx";
import { useDepartments } from "../hooks/useDepartments";
import {
  FileText,
  Download,
  Calendar,
  Users,
  TrendingUp,
  Search,
} from "lucide-react";
import toast from "react-hot-toast";

const AttendanceReportPage = () => {
  const { canViewAttendance } = usePermissions();
  const { departments } = useDepartments();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Filter employees based on department and search
  useEffect(() => {
    let filtered = employees;

    if (selectedDepartment) {
      filtered = filtered.filter(
        (emp) => emp.department_id == selectedDepartment
      );
    }

    if (employeeSearch.trim()) {
      filtered = filtered.filter(
        (emp) =>
          emp.full_name.toLowerCase().includes(employeeSearch.toLowerCase()) ||
          emp.employee_id.toLowerCase().includes(employeeSearch.toLowerCase())
      );
    }

    setFilteredEmployees(filtered);
  }, [employees, selectedDepartment, employeeSearch]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowEmployeeDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select(
          `
          id,
          employee_id,
          full_name,
          mobile_number,
          departments!inner (
            name
          )
        `
        )
        .eq("is_active", true)
        .order("full_name");

      if (error) throw error;
      const formattedEmployees = (data || []).map((emp) => ({
        ...emp,
        department: emp.departments?.name || "",
      }));
      setEmployees(formattedEmployees);
      setFilteredEmployees(formattedEmployees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Error loading employees");
    }
  };

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select date range");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Start date cannot be after end date");
      return;
    }

    setLoading(true);
    try {
      // Convert empty string to null for "All Departments"
      const departmentId =
        selectedDepartment === "" ? null : selectedDepartment;
      const employeeId = selectedEmployee === "" ? null : selectedEmployee;

      // Get detailed report using RPC function
      const { data: reportData, error: reportError } = await supabase.rpc(
        "get_attendance_report",
        {
          p_department_id: departmentId,
          p_employee_id: employeeId,
          p_start_date: startDate,
          p_end_date: endDate,
        }
      );

      if (reportError) throw reportError;

      // Get summary data
      let summaryData = null;
      if (!selectedEmployee) {
        const { data: summary, error: summaryError } = await supabase.rpc(
          "get_department_summary",
          {
            p_department_id: departmentId,
            p_start_date: startDate,
            p_end_date: endDate,
          }
        );

        if (!summaryError && summary && summary.length > 0) {
          summaryData = summary[0];
        }
      }

      // Set report data
      setReportData(reportData || []);

      // Set summary based on report type
      if (selectedEmployee) {
        // Single employee report
        if (reportData && reportData.length > 0) {
          const empSummary = reportData[0];
          setSummary({
            totalDays: empSummary.total_days,
            Present: empSummary.present_days,
            Absent: empSummary.absent_days,
            Holiday: empSummary.holiday_days,
            "On Leave": empSummary.leave_days,
            Other: empSummary.other_days,
            attendancePercentage: empSummary.attendance_percentage,
          });
        } else {
          setSummary({
            totalDays: 0,
            Present: 0,
            Absent: 0,
            Holiday: 0,
            "On Leave": 0,
            Other: 0,
            attendancePercentage: 0,
          });
        }
      } else {
        // Department report (single or all departments)
        setSummary(
          summaryData
            ? {
                departmentReport: true,
                employeeCount: summaryData.total_employees,
                totalDays: summaryData.total_days,
                Present: summaryData.total_present,
                Absent: summaryData.total_absent,
                Holiday: summaryData.total_holidays,
                "On Leave": summaryData.total_leaves,
                attendancePercentage: summaryData.overall_attendance_percentage,
                isAllDepartments: !selectedDepartment, // Add flag for all departments
              }
            : {
                departmentReport: true,
                employeeCount: (reportData || []).length,
                isAllDepartments: !selectedDepartment, // Add flag for all departments
              }
        );
      }

      toast.success("Report generated successfully");
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Error generating report");
    } finally {
      setLoading(false);
    }
  };

  // const exportToCSV = () => {
  //   if (reportData.length === 0) {
  //     toast.error("No data to export");
  //     return;
  //   }

  //   setGenerating(true);
  //   try {
  //     let csvContent = "";
  //     const filename = selectedEmployee
  //       ? `attendance_report_${
  //           employees.find((emp) => emp.id == selectedEmployee)?.employee_id ||
  //           "unknown"
  //         }_${startDate}_to_${endDate}.csv`
  //       : `department_report_${
  //           departments.find((dept) => dept.id == selectedDepartment)?.name ||
  //           "unknown"
  //         }_${startDate}_to_${endDate}.csv`;

  //     if (summary.departmentReport) {
  //       // Department report export
  //       const headers = [
  //         "Employee ID",
  //         "Employee Name",
  //         "Department",
  //         "Total Days",
  //         "Present",
  //         "Absent",
  //         "Holiday",
  //         "On Leave",
  //         "Other",
  //         "Attendance %",
  //       ];
  //       const rows = reportData.map((employee) => [
  //         employee.employee_code,
  //         employee.full_name,
  //         employee.department_name,
  //         employee.total_days,
  //         employee.present_days,
  //         employee.absent_days,
  //         employee.holiday_days,
  //         employee.leave_days,
  //         employee.other_days,
  //         `${employee.attendance_percentage}%`,
  //       ]);

  //       csvContent = [headers, ...rows]
  //         .map((row) => row.map((field) => `"${field}"`).join(","))
  //         .join("\n");
  //     } else {
  //       // Single employee report export
  //       const selectedEmployeeData = employees.find(
  //         (emp) => emp.id == selectedEmployee
  //       );
  //       const employeeInfo = selectedEmployeeData
  //         ? {
  //             id: selectedEmployeeData.employee_id,
  //             name: selectedEmployeeData.full_name,
  //             mobile: selectedEmployeeData.mobile_number,
  //             department: selectedEmployeeData.department,
  //           }
  //         : {
  //             id: "Unknown",
  //             name: "Unknown",
  //             mobile: "",
  //             department: "",
  //           };

  //       const headers = [
  //         "Employee ID",
  //         "Employee Name",
  //         "Mobile Number",
  //         "Department",
  //         "Date",
  //         "Day",
  //         "Status",
  //       ];
  //       const rows = reportData.map((record) => [
  //         employeeInfo.id,
  //         employeeInfo.name,
  //         employeeInfo.mobile,
  //         employeeInfo.department,
  //         record.date,
  //         new Date(record.date).toLocaleDateString("en-US", {
  //           weekday: "long",
  //         }),
  //         record.status,
  //       ]);

  //       csvContent = [headers, ...rows]
  //         .map((row) => row.map((field) => `"${field}"`).join(","))
  //         .join("\n");
  //     }

  //     const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  //     const url = URL.createObjectURL(blob);
  //     const link = document.createElement("a");
  //     link.setAttribute("href", url);
  //     link.setAttribute("download", filename);
  //     link.style.visibility = "hidden";
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);

  //     toast.success("Report exported successfully");
  //   } catch (error) {
  //     console.error("Error exporting:", error);
  //     toast.error("Error exporting report");
  //   } finally {
  //     setGenerating(false);
  //   }
  // };

  const exportToCSV = () => {
    if (reportData.length === 0) {
      toast.error("No data to export");
      return;
    }

    setGenerating(true);
    try {
      let csvContent = "";

      // Generate appropriate filename
      let filename = "";
      if (selectedEmployee) {
        filename = `attendance_report_${
          employees.find((emp) => emp.id == selectedEmployee)?.employee_id ||
          "unknown"
        }_${startDate}_to_${endDate}.csv`;
      } else if (selectedDepartment) {
        filename = `department_report_${
          departments.find((dept) => dept.id == selectedDepartment)?.name ||
          "unknown"
        }_${startDate}_to_${endDate}.csv`;
      } else {
        filename = `all_departments_report_${startDate}_to_${endDate}.csv`;
      }

      if (summary.departmentReport) {
        // Department report export (single department or all departments)
        const headers = [
          "Employee ID",
          "Employee Name",
          "Department",
          "Total Days",
          "Present",
          "Absent",
          "Holiday",
          "On Leave",
          "Other",
          "Attendance %",
        ];
        const rows = reportData.map((employee) => [
          employee.employee_code,
          employee.full_name,
          employee.department_name,
          employee.total_days,
          employee.present_days,
          employee.absent_days,
          employee.holiday_days,
          employee.leave_days,
          employee.other_days,
          `${employee.attendance_percentage}%`,
        ]);

        csvContent = [headers, ...rows]
          .map((row) => row.map((field) => `"${field}"`).join(","))
          .join("\n");
      } else {
        // Single employee report export
        const selectedEmployeeData = employees.find(
          (emp) => emp.id == selectedEmployee
        );
        const employeeInfo = selectedEmployeeData
          ? {
              id: selectedEmployeeData.employee_id,
              name: selectedEmployeeData.full_name,
              mobile: selectedEmployeeData.mobile_number,
              department: selectedEmployeeData.department,
            }
          : {
              id: "Unknown",
              name: "Unknown",
              mobile: "",
              department: "",
            };

        const headers = [
          "Employee ID",
          "Employee Name",
          "Mobile Number",
          "Department",
          "Date",
          "Day",
          "Status",
        ];
        const rows = reportData.map((record) => [
          employeeInfo.id,
          employeeInfo.name,
          employeeInfo.mobile,
          employeeInfo.department,
          record.date,
          new Date(record.date).toLocaleDateString("en-US", {
            weekday: "long",
          }),
          record.status,
        ]);

        csvContent = [headers, ...rows]
          .map((row) => row.map((field) => `"${field}"`).join(","))
          .join("\n");
      }

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Report exported successfully");
    } catch (error) {
      console.error("Error exporting:", error);
      toast.error("Error exporting report");
    } finally {
      setGenerating(false);
    }
  };

  if (!canViewAttendance) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Access Denied
          </h1>
          <p className="text-gray-600">
            You do not have permission to view attendance reports.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <FileText className="mr-2" />
          Attendance Report
        </h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setSelectedEmployee("");
                setEmployeeSearch("");
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Employee
            </label>
            <div className="relative">
              <input
                type="text"
                value={employeeSearch}
                onChange={(e) => {
                  setEmployeeSearch(e.target.value);
                  setShowEmployeeDropdown(true);
                }}
                onFocus={() => setShowEmployeeDropdown(true)}
                placeholder="Search employee..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              {selectedEmployee && (
                <button
                  onClick={() => {
                    setSelectedEmployee("");
                    setEmployeeSearch("");
                  }}
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              )}
            </div>

            {showEmployeeDropdown && filteredEmployees.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                {filteredEmployees.slice(0, 10).map((employee) => (
                  <div
                    key={employee.id}
                    onClick={() => {
                      setSelectedEmployee(employee.id);
                      setEmployeeSearch(
                        `${employee.employee_id} - ${employee.full_name}`
                      );
                      setShowEmployeeDropdown(false);
                    }}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                  >
                    <div className="font-medium">
                      {employee.employee_id} - {employee.full_name}
                    </div>
                    <div className="text-gray-500 text-xs">
                      {employee.mobile_number} • {employee.department}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2" size={16} />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {Object.keys(summary).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {summary.departmentReport ? (
            <>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Employees
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.employeeCount}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-green-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Days
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.totalDays}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Attendance %
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.attendancePercentage}%
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-indigo-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      {summary.isAllDepartments
                        ? "All Departments"
                        : "Department Report"}
                    </p>
                    <p className="text-lg font-bold text-gray-900">
                      {summary.isAllDepartments
                        ? "All Departments"
                        : "Summary view"}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <Calendar className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">
                      Total Days
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {summary.totalDays}
                    </p>
                  </div>
                </div>
              </div>

              {Object.entries(summary)
                .filter(([key]) => key !== "totalDays")
                .map(([status, count]) => (
                  <div key={status} className="bg-white rounded-lg shadow p-4">
                    <div className="flex items-center">
                      <TrendingUp className="h-8 w-8 text-green-600" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">
                          {status}
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {count}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </>
          )}
        </div>
      )}

      {/* Report Table */}
      {/* Report Table */}
      {reportData.length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              Attendance Details
            </h2>
            <button
              onClick={exportToCSV}
              disabled={generating}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {generating ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2" size={16} />
                  Export CSV
                </>
              )}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                {summary.departmentReport ? (
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Days
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status Breakdown
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance %
                    </th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Day
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                )}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {summary.departmentReport
                  ? reportData.map((employee, index) => (
                      <tr
                        key={employee.employee_id}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {employee.employee_code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {employee.full_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {employee.department_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {employee.total_days}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="flex flex-wrap gap-2">
                            {employee.present_days > 0 && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                Present: {employee.present_days}
                              </span>
                            )}
                            {employee.absent_days > 0 && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                Absent: {employee.absent_days}
                              </span>
                            )}
                            {employee.holiday_days > 0 && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                Holiday: {employee.holiday_days}
                              </span>
                            )}
                            {employee.leave_days > 0 && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                On Leave: {employee.leave_days}
                              </span>
                            )}
                            {employee.other_days > 0 && (
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                                Other: {employee.other_days}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {employee.attendance_percentage}%
                        </td>
                      </tr>
                    ))
                  : reportData.map((record, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {new Date(record.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(record.date).toLocaleDateString("en-US", {
                            weekday: "long",
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              record.status === "Present"
                                ? "bg-green-100 text-green-800"
                                : record.status === "Absent"
                                ? "bg-red-100 text-red-800"
                                : record.status === "On Leave"
                                ? "bg-yellow-100 text-yellow-800"
                                : record.status === "Sick"
                                ? "bg-orange-100 text-orange-800"
                                : record.status === "An Excuse"
                                ? "bg-purple-100 text-purple-800"
                                : record.status === "Holiday"
                                ? "bg-blue-100 text-blue-800"
                                : record.status === "Maternity"
                                ? "bg-pink-100 text-pink-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportData.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No report data
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Select an employee and date range, then generate a report to view
            attendance data.
          </p>
        </div>
      )}
    </div>
  );
};

export default AttendanceReportPage;
