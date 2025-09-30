import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  Users,
  PlusCircle,
  X,
  Settings,
  Shield,
  Eye,
  Edit,
  Download,
  UserCheck,
  Trash2,
} from "lucide-react";
import RegisterPage from "./RegisterPage";
import ConfirmationDialog from "../components/ConfirmationDialog";
import { usePermissions } from "../hooks/usePermissions.jsx";

const AdminUsersPage = () => {
  const [admins, setAdmins] = useState([]);
  const [adminPermissions, setAdminPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [editingPermissions, setEditingPermissions] = useState({
    canViewAttendance: false,
    canWriteAttendance: false,
    canExportData: false,
    canManageEmployees: false,
    canManageAdmins: false,
    isSuperAdmin: false,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const navigate = useNavigate();
  const {
    isSuperAdmin,
    canManageAdmins,
    updatePermissions,
    loading: permissionsLoading,
  } = usePermissions();

  // Fetch admin users and their permissions
  useEffect(() => {
    const fetchAdmins = async () => {
      setLoading(true);
      setError("");

      try {
        // Use the RPC function to get admin users with emails
        const { data: adminUsers, error } = await supabase.rpc(
          "get_admin_users"
        );

        if (error) throw error;

        // Transform the data to match our expected format
        const formattedAdmins =
          adminUsers?.map((user) => ({
            id: user.user_id,
            email: user.email,
            created_at: user.user_created_at,
            email_confirmed_at: null, // We don't have this from the function
            last_sign_in_at: user.last_sign_in_at,
          })) || [];

        // Create permissions map
        const permissionsMap =
          adminUsers?.reduce((acc, user) => {
            acc[user.user_id] = {
              id: user.user_id, // This would be the permission record ID
              user_id: user.user_id,
              can_view_attendance: user.can_view_attendance,
              can_write_attendance: user.can_write_attendance,
              can_export_data: user.can_export_data,
              can_manage_employees: user.can_manage_employees,
              can_manage_admins: user.can_manage_admins,
              is_super_admin: user.is_super_admin,
              created_at: user.permission_created_at,
              updated_at: user.permission_created_at,
            };
            return acc;
          }, {}) || {};

        setAdmins(formattedAdmins);
        setAdminPermissions(permissionsMap);
      } catch (error) {
        setError("Failed to load admin users: " + error.message);
      } finally {
        setLoading(false);
      }
    };

    if (isSuperAdmin) {
      fetchAdmins();
    } else {
      setLoading(false);
    }
  }, [isSuperAdmin]);

  const handleDeleteAdmin = (admin) => {
    setSelectedAdmin(admin);
    setShowDeleteDialog(true);
  };

  const confirmDeleteAdmin = async () => {
    if (!selectedAdmin) return;

    setDeleteLoading(true);
    try {
      // Remove admin permissions instead of deleting the user
      const { error } = await supabase
        .from('admin_permissions')
        .delete()
        .eq('user_id', selectedAdmin.id);

      if (error) throw error;

      // Refresh the list
      setAdmins((prev) => prev.filter((admin) => admin.id !== selectedAdmin.id));
      setAdminPermissions((prev) => {
        const newPerms = { ...prev };
        delete newPerms[selectedAdmin.id];
        return newPerms;
      });

      setShowDeleteDialog(false);
      setSelectedAdmin(null);
    } catch (error) {
      setError("Failed to remove admin permissions: " + error.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditPermissions = (admin) => {
    const permissions = adminPermissions[admin.id] || {
      can_view_attendance: false,
      can_write_attendance: false,
      can_export_data: false,
      can_manage_employees: false,
      can_manage_admins: false,
      is_super_admin: false,
    };

    setSelectedAdmin(admin);
    setEditingPermissions({
      canViewAttendance: permissions.can_view_attendance,
      canWriteAttendance: permissions.can_write_attendance,
      canExportData: permissions.can_export_data,
      canManageEmployees: permissions.can_manage_employees,
      canManageAdmins: permissions.can_manage_admins,
      isSuperAdmin: permissions.is_super_admin,
    });
    setShowPermissionsModal(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedAdmin) return;

    setSavingPermissions(true);
    const result = await updatePermissions(
      selectedAdmin.id,
      editingPermissions
    );

    if (result.success) {
      // Update local permissions map
      setAdminPermissions((prev) => ({
        ...prev,
        [selectedAdmin.id]: {
          user_id: selectedAdmin.id,
          can_view_attendance: editingPermissions.canViewAttendance,
          can_write_attendance: editingPermissions.canWriteAttendance,
          can_export_data: editingPermissions.canExportData,
          can_manage_employees: editingPermissions.canManageEmployees,
          can_manage_admins: editingPermissions.canManageAdmins,
          is_super_admin: editingPermissions.isSuperAdmin,
        },
      }));
      setShowPermissionsModal(false);
      setSelectedAdmin(null);
    } else {
      setError("Failed to update permissions: " + result.error);
    }
    setSavingPermissions(false);
  };

  // Check permissions
  if (!permissionsLoading && !isSuperAdmin && !canManageAdmins) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-red-500 text-lg font-medium mb-2">
              Access Denied
            </div>
            <p className="text-gray-600">
              You do not have permission to manage admin users.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Header */}
          <div className="px-6 py-6 sm:px-8 sm:py-8 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Admin Users
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Manage administrator accounts for the system
                  </p>
                </div>
              </div>

              <div className="mt-4 sm:mt-0">
                <button
                  onClick={() => setShowRegisterForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Register New Admin
                </button>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="rounded-md bg-red-50 p-4 m-6">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          {/* Registration Form Modal */}
          {showRegisterForm && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div
                  className="fixed inset-0 transition-opacity"
                  aria-hidden="true"
                >
                  <div
                    className="absolute inset-0 bg-gray-500 opacity-75"
                    onClick={() => setShowRegisterForm(false)}
                  ></div>
                </div>

                <span
                  className="hidden sm:inline-block sm:align-middle sm:h-screen"
                  aria-hidden="true"
                >
                  &#8203;
                </span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
                  <div className="absolute top-0 right-0 pt-4 pr-4">
                    <button
                      onClick={() => setShowRegisterForm(false)}
                      className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <RegisterPage />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Delete Confirmation Dialog */}
          <ConfirmationDialog
            isOpen={showDeleteDialog}
            onClose={() => setShowDeleteDialog(false)}
            onConfirm={confirmDeleteAdmin}
            title="Remove Admin Permissions"
            message={`Are you sure you want to remove admin permissions from ${selectedAdmin?.email}? This will revoke their access to the admin panel but won't delete their user account.`}
            confirmText="Remove Permissions"
            cancelText="Cancel"
            type="danger"
            loading={deleteLoading}
          />

          {/* Permissions Modal */}
          {showPermissionsModal && selectedAdmin && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div
                  className="fixed inset-0 transition-opacity"
                  aria-hidden="true"
                >
                  <div
                    className="absolute inset-0 bg-gray-500 opacity-75"
                    onClick={() => setShowPermissionsModal(false)}
                  ></div>
                </div>

                <span
                  className="hidden sm:inline-block sm:align-middle sm:h-screen"
                  aria-hidden="true"
                >
                  &#8203;
                </span>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                  <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                        <Settings className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Edit Permissions
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Manage permissions for {selectedAdmin.email}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      <div className="flex items-center">
                        <input
                          id="super-admin"
                          type="checkbox"
                          checked={editingPermissions.isSuperAdmin}
                          onChange={(e) =>
                            setEditingPermissions((prev) => ({
                              ...prev,
                              isSuperAdmin: e.target.checked,
                            }))
                          }
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label
                          htmlFor="super-admin"
                          className="ml-3 flex items-center text-sm font-medium text-gray-700"
                        >
                          <Shield className="h-4 w-4 mr-2 text-purple-500" />
                          Super Admin (Full Access)
                        </label>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center">
                          <input
                            id="view-attendance"
                            type="checkbox"
                            checked={editingPermissions.canViewAttendance}
                            onChange={(e) =>
                              setEditingPermissions((prev) => ({
                                ...prev,
                                canViewAttendance: e.target.checked,
                              }))
                            }
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            disabled={editingPermissions.isSuperAdmin}
                          />
                          <label
                            htmlFor="view-attendance"
                            className="ml-3 flex items-center text-sm text-gray-700"
                          >
                            <Eye className="h-4 w-4 mr-2 text-blue-500" />
                            View Employee Attendance
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            id="write-attendance"
                            type="checkbox"
                            checked={editingPermissions.canWriteAttendance}
                            onChange={(e) =>
                              setEditingPermissions((prev) => ({
                                ...prev,
                                canWriteAttendance: e.target.checked,
                              }))
                            }
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            disabled={editingPermissions.isSuperAdmin}
                          />
                          <label
                            htmlFor="write-attendance"
                            className="ml-3 flex items-center text-sm text-gray-700"
                          >
                            <Edit className="h-4 w-4 mr-2 text-green-500" />
                            Write Attendance Records
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            id="export-data"
                            type="checkbox"
                            checked={editingPermissions.canExportData}
                            onChange={(e) =>
                              setEditingPermissions((prev) => ({
                                ...prev,
                                canExportData: e.target.checked,
                              }))
                            }
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            disabled={editingPermissions.isSuperAdmin}
                          />
                          <label
                            htmlFor="export-data"
                            className="ml-3 flex items-center text-sm text-gray-700"
                          >
                            <Download className="h-4 w-4 mr-2 text-orange-500" />
                            Export Data
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            id="manage-employees"
                            type="checkbox"
                            checked={editingPermissions.canManageEmployees}
                            onChange={(e) =>
                              setEditingPermissions((prev) => ({
                                ...prev,
                                canManageEmployees: e.target.checked,
                              }))
                            }
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            disabled={editingPermissions.isSuperAdmin}
                          />
                          <label
                            htmlFor="manage-employees"
                            className="ml-3 flex items-center text-sm text-gray-700"
                          >
                            <UserCheck className="h-4 w-4 mr-2 text-indigo-500" />
                            Manage Employees
                          </label>
                        </div>

                        <div className="flex items-center">
                          <input
                            id="manage-admins"
                            type="checkbox"
                            checked={editingPermissions.canManageAdmins}
                            onChange={(e) =>
                              setEditingPermissions((prev) => ({
                                ...prev,
                                canManageAdmins: e.target.checked,
                              }))
                            }
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            disabled={editingPermissions.isSuperAdmin}
                          />
                          <label
                            htmlFor="manage-admins"
                            className="ml-3 flex items-center text-sm text-gray-700"
                          >
                            <Users className="h-4 w-4 mr-2 text-red-500" />
                            Manage Admin Users
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      onClick={handleSavePermissions}
                      disabled={savingPermissions}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      {savingPermissions ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Saving...
                        </>
                      ) : (
                        'Save Permissions'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPermissionsModal(false)}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admins List */}
          <div className="px-6 py-6 sm:px-8">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Email
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Last Sign In
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Permissions
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Created At
                      </th>
                      <th
                        scope="col"
                        className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {admins.length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-6 py-4 text-center text-sm text-gray-500"
                        >
                          No admin users found
                        </td>
                      </tr>
                    ) : (
                      admins.map((admin) => {
                        const permissions = adminPermissions[admin.id];
                        return (
                          <tr key={admin.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                  <span className="text-indigo-800 font-medium">
                                    {admin.email.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {admin.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {admin.last_sign_in_at
                                ? new Date(
                                    admin.last_sign_in_at
                                  ).toLocaleDateString()
                                : "Never"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex flex-wrap gap-1">
                                {permissions?.is_super_admin && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    <Shield className="h-3 w-3 mr-1" />
                                    Super Admin
                                  </span>
                                )}
                                {permissions?.can_view_attendance && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    <Eye className="h-3 w-3 mr-1" />
                                    View
                                  </span>
                                )}
                                {permissions?.can_write_attendance && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <Edit className="h-3 w-3 mr-1" />
                                    Write
                                  </span>
                                )}
                                {permissions?.can_export_data && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                    <Download className="h-3 w-3 mr-1" />
                                    Export
                                  </span>
                                )}
                                {!permissions && (
                                  <span className="text-xs text-gray-500">
                                    No permissions set
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(admin.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                              {isSuperAdmin && (
                                <button
                                  onClick={() => handleEditPermissions(admin)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  <Settings className="h-4 w-4 inline mr-1" />
                                  Permissions
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteAdmin(admin)}
                                className="text-red-600 hover:text-red-900 flex items-center"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
