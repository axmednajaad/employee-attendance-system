import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { usePermissions } from "../hooks/usePermissions.jsx";
import { Plus, Edit, Trash2, Clock, Search } from "lucide-react";
import ConfirmationDialog from "../components/ConfirmationDialog";
import toast from "react-hot-toast";

const AttendanceStatusesPage = () => {
  const { canManageEmployees } = usePermissions();
  const [statuses, setStatuses] = useState([]);
  const [filteredStatuses, setFilteredStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [newStatusName, setNewStatusName] = useState("");
  const [editStatusName, setEditStatusName] = useState("");
  const [editStatusActive, setEditStatusActive] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      const { data, error } = await supabase
        .from("attendance_statuses")
        .select("*")
        .order("name");

      if (error) throw error;
      setStatuses(data || []);
      setFilteredStatuses(data || []);
    } catch (error) {
      console.error("Error fetching attendance statuses:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter statuses based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredStatuses(statuses);
    } else {
      const filtered = statuses.filter((status) =>
        status.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStatuses(filtered);
    }
  }, [statuses, searchTerm]);

  const handleAddStatus = async () => {
    if (!newStatusName.trim()) return;

    setAdding(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase.from("attendance_statuses").insert([
        {
          name: newStatusName.trim(),
          created_by: user.id,
          updated_by: user.id,
        },
      ]);

      if (error) throw error;

      setNewStatusName("");
      setShowAddDialog(false);
      fetchStatuses();
      toast.success("Attendance status added successfully!");
    } catch (error) {
      console.error("Error adding attendance status:", error);
      toast.error("Error adding attendance status. It might already exist.");
    } finally {
      setAdding(false);
    }
  };

  const handleEditStatus = async () => {
    if (!editStatusName.trim() || !selectedStatus) return;

    setEditing(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // If disabling, check if attendance records are using it
      if (selectedStatus.is_active && !editStatusActive) {
        const { data: attendanceUsingStatus, error: checkError } = await supabase
          .from("attendance")
          .select("id", { count: "exact" })
          .eq("status_id", selectedStatus.id);

        if (checkError) throw checkError;

        if (attendanceUsingStatus && attendanceUsingStatus.length > 0) {
          toast.error(
            `Cannot disable attendance status "${selectedStatus.name}" because it is currently used in ${attendanceUsingStatus.length} attendance record(s). Please update or remove these records first.`
          );
          setEditing(false);
          return;
        }
      }

      const { error } = await supabase
        .from("attendance_statuses")
        .update({
          name: editStatusName.trim(),
          is_active: editStatusActive,
          updated_by: user.id,
        })
        .eq("id", selectedStatus.id);

      if (error) throw error;

      setEditStatusName("");
      setEditStatusActive(true);
      setShowEditDialog(false);
      setSelectedStatus(null);
      fetchStatuses();
      toast.success("Attendance status updated successfully!");
    } catch (error) {
      console.error("Error updating attendance status:", error);
      toast.error("Error updating attendance status. It might already exist.");
    } finally {
      setEditing(false);
    }
  };

  const handleDeleteStatus = async () => {
    if (!selectedStatus) return;

    setDeleting(true);
    try {
      // First check if any attendance records are using this status
      const { data: attendanceUsingStatus, error: checkError } = await supabase
        .from("attendance")
        .select("id", { count: "exact" })
        .eq("status_id", selectedStatus.id);

      if (checkError) throw checkError;

      if (attendanceUsingStatus && attendanceUsingStatus.length > 0) {
        toast.error(
          `Cannot delete attendance status "${selectedStatus.name}" because it is currently used in ${attendanceUsingStatus.length} attendance record(s). Please update or remove these records first.`
        );
        setShowDeleteDialog(false);
        setSelectedStatus(null);
        return;
      }

      // If no attendance records are using it, proceed with deletion
      const { error } = await supabase
        .from("attendance_statuses")
        .delete()
        .eq("id", selectedStatus.id);

      if (error) throw error;

      setShowDeleteDialog(false);
      setSelectedStatus(null);
      fetchStatuses();
      toast.success("Attendance status deleted successfully!");
    } catch (error) {
      console.error("Error deleting attendance status:", error);
      toast.error("Error deleting attendance status. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const openEditDialog = (status) => {
    setSelectedStatus(status);
    setEditStatusName(status.name);
    setEditStatusActive(status.is_active);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (status) => {
    setSelectedStatus(status);
    setShowDeleteDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Clock className="mr-2" />
          Attendance Statuses Management
        </h1>
        {canManageEmployees && (
          <button
            onClick={() => setShowAddDialog(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="mr-2" size={20} />
            Add Status
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search attendance statuses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center hover:bg-gray-100 rounded-full p-1"
            >
              <svg
                className="h-4 w-4 text-gray-400 hover:text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              {canManageEmployees && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredStatuses.map((status) => (
              <tr key={status.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {status.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      status.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {status.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(status.created_at).toLocaleDateString()}
                </td>
                {canManageEmployees && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditDialog(status)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => openDeleteDialog(status)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Status Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add New Attendance Status
              </h3>
              <input
                type="text"
                value={newStatusName}
                onChange={(e) => setNewStatusName(e.target.value)}
                placeholder="Status name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === "Enter" && handleAddStatus()}
              />
              <div className="flex justify-end mt-4 space-x-2">
                <button
                  onClick={() => setShowAddDialog(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddStatus}
                  disabled={adding}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {adding && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {adding ? "Adding..." : "Add"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Status Dialog */}
      {showEditDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Edit Attendance Status
              </h3>
              <input
                type="text"
                value={editStatusName}
                onChange={(e) => setEditStatusName(e.target.value)}
                placeholder="Status name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                onKeyPress={(e) => e.key === "Enter" && handleEditStatus()}
              />
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="editStatusActive"
                  checked={editStatusActive}
                  onChange={(e) => setEditStatusActive(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="editStatusActive" className="ml-2 text-sm text-gray-900">
                  Active
                </label>
              </div>
              <div className="flex justify-end mt-4 space-x-2">
                <button
                  onClick={() => setShowEditDialog(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditStatus}
                  disabled={editing}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {editing && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {editing ? "Updating..." : "Update"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        title="Delete Attendance Status"
        message={`Are you sure you want to delete "${selectedStatus?.name}"? This action cannot be undone and may affect attendance records using this status.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteStatus}
        onCancel={() => setShowDeleteDialog(false)}
        type="danger"
        isLoading={deleting}
      />
    </div>
  );
};

export default AttendanceStatusesPage;