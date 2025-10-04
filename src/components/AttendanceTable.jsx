import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Edit, Trash2 } from "lucide-react";
import AttendanceStatusSelector from "./AttendanceStatusSelector";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

const AttendanceTable = ({
  employees,
  attendanceData,
  currentYear,
  currentMonth,
  saving,
  onStatusChange,
  currentPage,
  itemsPerPage,
  canWriteAttendance,
  canManageEmployees,
  onDeleteEmployee, // Add this prop
  statusMap,
  statuses,
}) => {
  const navigate = useNavigate();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Helper function to get status class
  const getStatusClass = (statusName) => {
    switch (statusName) {
      case 'Present':
        return 'bg-green-100 text-green-800';
      case 'Absent':
        return 'bg-red-100 text-red-800';
      case 'On Leave':
        return 'bg-yellow-100 text-yellow-800';
      case 'Sick':
        return 'bg-orange-100 text-orange-800';
      case 'An Excuse':
        return 'bg-purple-100 text-purple-800';
      case 'Holiday':
        return 'bg-yellow-100 text-yellow-800';
      case 'Maternity':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Format date as YYYY-MM-DD
  const formatDate = (year, month, day) => {
    const monthStr = String(month + 1).padStart(2, "0");
    const dayStr = String(day).padStart(2, "0");
    return `${year}-${monthStr}-${dayStr}`;
  };

  // Get status for a specific employee and date
  const getStatus = (employeeId, date) => {
    return attendanceData[employeeId]?.[date] || "";
  };

  // Handle delete confirmation
  const handleDeleteClick = (employee) => {
    setEmployeeToDelete(employee);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;

    setDeleting(true);
    try {
      await onDeleteEmployee(employeeToDelete.id);
      setDeleteModalOpen(false);
      setEmployeeToDelete(null);
    } catch (error) {
      console.error("Error deleting employee:", error);
    } finally {
      setDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setEmployeeToDelete(null);
  };

  // Calculate paginated employees
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = employees.slice(
    startIndex,
    startIndex + itemsPerPage
  );
  const totalDays = getDaysInMonth(currentYear, currentMonth);

  if (employees.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
            />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No employees</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by adding employees to see attendance records.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10"
              >
                Employee
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                ID
              </th>
              <th
                scope="col"
                className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Department
              </th>
              {Array.from({ length: totalDays }, (_, i) => (
                <th
                  key={i}
                  scope="col"
                  className="px-2 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[80px] md:min-w-[100px]"
                >
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-semibold">{i + 1}</span>
                    <span className="text-xs text-gray-400 mt-1 hidden md:inline">
                      {new Date(
                        currentYear,
                        currentMonth,
                        i + 1
                      ).toLocaleDateString("en-US", { weekday: "short" })}
                    </span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedEmployees.map((employee) => (
              <tr
                key={employee.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white z-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-indigo-800 font-medium">
                        {employee.full_name.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {employee.full_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {employee.position}
                      </div>
                    </div>
                    {canManageEmployees && (
                      <div className="flex space-x-1">
                        <button
                          onClick={() =>
                            navigate(`/edit-employee/${employee.id}`)
                          }
                          className="p-1 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Edit employee"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(employee)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete employee"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {employee.employee_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {employee.department}
                </td>
                {Array.from({ length: totalDays }, (_, i) => {
                  const date = formatDate(currentYear, currentMonth, i + 1);
                  const status = getStatus(employee.id, date);
                  const isWeekend = [0, 6].includes(
                    new Date(currentYear, currentMonth, i + 1).getDay()
                  );

                  return (
                    <td
                      key={i}
                      className={`px-1 py-2 whitespace-nowrap text-center ${
                        isWeekend ? "bg-gray-50" : ""
                      }`}
                    >
                      <div className="flex justify-center">
                        {canWriteAttendance ? (
                          <AttendanceStatusSelector
                            employeeId={employee.id}
                            date={date}
                            status={status}
                            onSave={onStatusChange}
                            saving={saving}
                            statuses={statuses}
                          />
                        ) : (
                          <div className="flex items-center justify-center w-28 h-9 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-600">
                            {status ? (
                              <span
                                className={`px-2 py-1 rounded text-xs font-medium ${getStatusClass(statusMap[status])}`}
                              >
                                {statusMap[status]}
                              </span>
                            ) : (
                              <span className="text-gray-400">No data</span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        title="Delete Employee"
        message={`Are you sure you want to delete ${employeeToDelete?.full_name} (${employeeToDelete?.employee_id})? This action will also delete all attendance records for this employee and cannot be undone.`}
        confirmText="Delete Employee"
        isLoading={deleting}
      />
    </>
  );
};

export default AttendanceTable;
