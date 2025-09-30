

-- Employee Attendance Management System - Database Schema

-- Drop the tables if needed 
-- drop table employees;
-- drop table attendance;
-- drop table admin_permissions;

-- Drop function if needed 
-- DROP FUNCTION get_admin_users()

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  employee_id VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  mobile_number VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id), -- Link to Supabase auth
  updated_by UUID REFERENCES auth.users(id)  -- Link to Supabase auth
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  employee_id VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'on_duty','on_leave', 'sick', 'an_excuse', 'holiday')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id), -- Link to Supabase auth
  updated_by UUID REFERENCES auth.users(id),  -- Link to Supabase auth
  UNIQUE(employee_id, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);

-- 1. Foreign Key Constraint
ALTER TABLE attendance
ADD CONSTRAINT fk_attendance_employee
FOREIGN KEY (employee_id) REFERENCES employees(employee_id)
ON DELETE CASCADE;

-- 2. Additional Useful Indexes
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON employees(is_active);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_date_status ON attendance(date, status);

-- 3. Trigger for Updated Timestamp
-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create admin_permissions table
CREATE TABLE IF NOT EXISTS admin_permissions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  can_view_attendance BOOLEAN DEFAULT true,
  can_write_attendance BOOLEAN DEFAULT false,
  can_export_data BOOLEAN DEFAULT false,
  can_manage_employees BOOLEAN DEFAULT false,
  can_manage_admins BOOLEAN DEFAULT false,
  is_super_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(user_id)
);

-- Create trigger for admin_permissions
CREATE TRIGGER update_admin_permissions_updated_at
    BEFORE UPDATE ON admin_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for admin_permissions
CREATE INDEX IF NOT EXISTS idx_admin_permissions_user_id ON admin_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_is_super_admin ON admin_permissions(is_super_admin);

-- Create a function to get admin users with emails (for super admins only)
CREATE OR REPLACE FUNCTION get_admin_users()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  user_created_at TIMESTAMP,
  last_sign_in_at TIMESTAMP,
  can_view_attendance BOOLEAN,
  can_write_attendance BOOLEAN,
  can_export_data BOOLEAN,
  can_manage_employees BOOLEAN,
  can_manage_admins BOOLEAN,
  is_super_admin BOOLEAN,
  permission_created_at TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if the current user is a super admin
  IF NOT EXISTS (
    SELECT 1 FROM admin_permissions
    WHERE user_id = auth.uid()
    AND is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT
    ap.user_id,
    au.email::TEXT,
    au.created_at as user_created_at,
    au.last_sign_in_at,
    ap.can_view_attendance,
    ap.can_write_attendance,
    ap.can_export_data,
    ap.can_manage_employees,
    ap.can_manage_admins,
    ap.is_super_admin,
    ap.created_at as permission_created_at
  FROM admin_permissions ap
  JOIN auth.users au ON ap.user_id = au.id
  ORDER BY ap.created_at DESC;
END;
$$;

-- Create triggers for both tables
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
    BEFORE UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();




-- Sample data for testing (optional)
INSERT INTO employees (employee_id, full_name, department, mobile_number) VALUES
('GMDQS00001', 'Ahmed Maxamed', 'Engineering', '+252613656021'),
('GMDQS00002', 'Liibaan', 'Marketing', '+252612663427'),
('GMDQS00003', 'Usaame Xassan', 'Sales', '+252616709856');


INSERT INTO admin_permissions (user_id, can_view_attendance, can_write_attendance, can_export_data, can_manage_employees, can_manage_admins, is_super_admin, created_by, updated_by)
VALUES ('3b668863-727c-4877-b1f5-ef81a206d892', true, true, true, true, true, false, '07cb8955-76ca-4aa2-ac85-55902d56a0c3', '07cb8955-76ca-4aa2-ac85-55902d56a0c3');

INSERT INTO admin_permissions (user_id, can_view_attendance, can_write_attendance, can_export_data, can_manage_employees, can_manage_admins, is_super_admin, created_by, updated_by)
VALUES ('07cb8955-76ca-4aa2-ac85-55902d56a0c3', true, true, true, true, true, true, '07cb8955-76ca-4aa2-ac85-55902d56a0c3', '07cb8955-76ca-4aa2-ac85-55902d56a0c3');