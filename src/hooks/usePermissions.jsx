import { useState, useEffect, useContext, createContext } from 'react';
import { supabase } from '../lib/supabase';

const PermissionsContext = createContext();

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
};

export const PermissionsProvider = ({ children }) => {
  const [permissions, setPermissions] = useState({
    canViewAttendance: false,
    canWriteAttendance: false,
    canExportData: false,
    canManageEmployees: false,
    canManageAdmins: false,
    isSuperAdmin: false,
    loading: true
  });

  useEffect(() => {
    const loadPermissions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setPermissions(prev => ({ ...prev, loading: false }));
          return;
        }

        const { data, error } = await supabase
          .from('admin_permissions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
          console.error('Error loading permissions:', error);
          setPermissions(prev => ({ ...prev, loading: false }));
          return;
        }

        if (data) {
          setPermissions({
            canViewAttendance: data.can_view_attendance,
            canWriteAttendance: data.can_write_attendance,
            canExportData: data.can_export_data,
            canManageEmployees: data.can_manage_employees,
            canManageAdmins: data.can_manage_admins,
            isSuperAdmin: data.is_super_admin,
            loading: false
          });
        } else {
          // No permissions found, set default (no permissions)
          setPermissions(prev => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error('Error loading permissions:', error);
        setPermissions(prev => ({ ...prev, loading: false }));
      }
    };

    loadPermissions();
  }, []);

  const updatePermissions = async (userId, newPermissions) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('admin_permissions')
        .upsert({
          user_id: userId,
          can_view_attendance: newPermissions.canViewAttendance,
          can_write_attendance: newPermissions.canWriteAttendance,
          can_export_data: newPermissions.canExportData,
          can_manage_employees: newPermissions.canManageEmployees,
          can_manage_admins: newPermissions.canManageAdmins,
          is_super_admin: newPermissions.isSuperAdmin,
          updated_by: user?.id
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      // If updating current user's permissions, update local state
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser && userId === currentUser.id) {
        setPermissions({
          canViewAttendance: newPermissions.canViewAttendance,
          canWriteAttendance: newPermissions.canWriteAttendance,
          canExportData: newPermissions.canExportData,
          canManageEmployees: newPermissions.canManageEmployees,
          canManageAdmins: newPermissions.canManageAdmins,
          isSuperAdmin: newPermissions.isSuperAdmin,
          loading: false
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Error updating permissions:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    ...permissions,
    updatePermissions
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
};