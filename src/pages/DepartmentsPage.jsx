import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { usePermissions } from "../hooks/usePermissions.jsx";
import { Plus, Edit, Trash2, Building, Search } from "lucide-react";
import ConfirmationDialog from "../components/ConfirmationDialog";

const DepartmentsPage = () => {
  const { canManageEmployees } = usePermissions();
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [editDepartmentName, setEditDepartmentName] = useState("");

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name");

      if (error) throw error;
      setDepartments(data || []);
      setFilteredDepartments(data || []);
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter departments based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredDepartments(departments);
    } else {
      const filtered = departments.filter((dept) =>
        dept.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDepartments(filtered);
    }
  }, [departments, searchTerm]);

  const handleAddDepartment = async () => {
    if (!newDepartmentName.trim()) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase.from("departments").insert([
        {
          name: newDepartmentName.trim(),
          created_by: user.id,
          updated_by: user.id,
        },
      ]);

      if (error) throw error;

      setNewDepartmentName("");
      setShowAddDialog(false);
      fetchDepartments();
    } catch (error) {
      console.error("Error adding department:", error);
      alert("Error adding department. It might already exist.");
    }
  };

  const handleEditDepartment = async () => {
    if (!editDepartmentName.trim() || !selectedDepartment) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("departments")
        .update({
          name: editDepartmentName.trim(),
          updated_by: user.id,
        })
        .eq("id", selectedDepartment.id);

      if (error) throw error;

      setEditDepartmentName("");
      setShowEditDialog(false);
      setSelectedDepartment(null);
      fetchDepartments();
    } catch (error) {
      console.error("Error updating department:", error);
      alert("Error updating department. It might already exist.");
    }
  };

  const handleDeleteDepartment = async () => {
    if (!selectedDepartment) return;

    try {
      // First check if any employees are using this department
      const { data: employeesUsingDept, error: checkError } = await supabase
        .from("employees")
        .select("id", { count: "exact" })
        .eq("department_id", selectedDepartment.id);

      if (checkError) throw checkError;

      if (employeesUsingDept && employeesUsingDept.length > 0) {
        alert(
          `Cannot delete department "${selectedDepartment.name}" because it is currently assigned to ${employeesUsingDept.length} employee(s). Please reassign or remove these employees first.`
        );
        setShowDeleteDialog(false);
        setSelectedDepartment(null);
        return;
      }

      // If no employees are using it, proceed with deletion
      const { error } = await supabase
        .from("departments")
        .delete()
        .eq("id", selectedDepartment.id);

      if (error) throw error;

      setShowDeleteDialog(false);
      setSelectedDepartment(null);
      fetchDepartments();
    } catch (error) {
      console.error("Error deleting department:", error);
      alert("Error deleting department. Please try again.");
    }
  };

  const openEditDialog = (department) => {
    setSelectedDepartment(department);
    setEditDepartmentName(department.name);
    setShowEditDialog(true);
  };

  const openDeleteDialog = (department) => {
    setSelectedDepartment(department);
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
          <Building className="mr-2" />
          Departments Management
        </h1>
        {canManageEmployees && (
          <button
            onClick={() => setShowAddDialog(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
          >
            <Plus className="mr-2" size={20} />
            Add Department
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
            placeholder="Search departments..."
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
                Department Name
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
            {filteredDepartments.map((department) => (
              <tr key={department.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {department.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      department.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {department.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(department.created_at).toLocaleDateString()}
                </td>
                {canManageEmployees && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditDialog(department)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => openDeleteDialog(department)}
                      className="text-red-600 hover:text-red-900"
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

      {/* Add Department Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add New Department
              </h3>
              <input
                type="text"
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
                placeholder="Department name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === "Enter" && handleAddDepartment()}
              />
              <div className="flex justify-end mt-4 space-x-2">
                <button
                  onClick={() => setShowAddDialog(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddDepartment}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Department Dialog */}
      {showEditDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Edit Department
              </h3>
              <input
                type="text"
                value={editDepartmentName}
                onChange={(e) => setEditDepartmentName(e.target.value)}
                placeholder="Department name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                onKeyPress={(e) => e.key === "Enter" && handleEditDepartment()}
              />
              <div className="flex justify-end mt-4 space-x-2">
                <button
                  onClick={() => setShowEditDialog(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditDepartment}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        title="Delete Department"
        message={`Are you sure you want to delete "${selectedDepartment?.name}"? This action cannot be undone and may affect employees assigned to this department.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteDepartment}
        onCancel={() => setShowDeleteDialog(false)}
        type="danger"
      />
    </div>
  );
};

export default DepartmentsPage;
