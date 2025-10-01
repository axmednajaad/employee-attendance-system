

-- Employee Attendance Management System - Database Schema

-- Drop the tables if needed (in reverse dependency order)
-- DROP TABLE IF EXISTS attendance CASCADE;
-- DROP TABLE IF EXISTS employees CASCADE;
-- DROP TABLE IF EXISTS admin_permissions CASCADE;
-- DROP TABLE IF EXISTS departments CASCADE;

-- Drop function if needed
-- DROP FUNCTION IF EXISTS get_admin_users();

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  employee_id VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  department_id INTEGER REFERENCES departments(id),
  mobile_number VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create attendance table with integer foreign key
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'on_duty','on_leave', 'sick', 'an_excuse', 'holiday')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE(employee_id, date)
);

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);

-- Additional Useful Indexes
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON employees(is_active);
CREATE INDEX IF NOT EXISTS idx_employees_department_id ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_date_status ON attendance(date, status);
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON departments(is_active);

-- Trigger for Updated Timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_departments_updated_at
    BEFORE UPDATE ON departments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
    BEFORE UPDATE ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_permissions_updated_at
    BEFORE UPDATE ON admin_permissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for admin_permissions
CREATE INDEX IF NOT EXISTS idx_admin_permissions_user_id ON admin_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_is_super_admin ON admin_permissions(is_super_admin);

-- Create the corrected function
CREATE OR REPLACE FUNCTION get_admin_users()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  user_created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
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
    SELECT 1 FROM admin_permissions ap
    WHERE ap.user_id = auth.uid()
    AND ap.is_super_admin = true
  ) THEN
    RAISE EXCEPTION 'Access denied. Super admin privileges required.';
  END IF;

  RETURN QUERY
  SELECT
    ap.user_id,
    au.email::TEXT,
    au.created_at,
    au.last_sign_in_at,
    ap.can_view_attendance,
    ap.can_write_attendance,
    ap.can_export_data,
    ap.can_manage_employees,
    ap.can_manage_admins,
    ap.is_super_admin,
    ap.created_at
  FROM admin_permissions ap
  JOIN auth.users au ON ap.user_id = au.id
  ORDER BY ap.created_at DESC;
END;
$$;


-- test the function
-- SELECT * FROM get_admin_users();

-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'admin_permissions';

-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' AND table_schema = 'auth';


-- Sample data for testing (optional)
INSERT INTO departments (name) VALUES
('FMS COORDINATION'),
('HRM'),
('Outreach'),
('Media'),
('OPPR'),
('Boundary'),
('Legal'),
('Procurement'),
('Planning'),
('Voter Registration'),
('Electoral security'),
('ICT'),
('M&E'),
('Gender'),
('SG OFFICE'),
('Xafiiska xubnaha gudiga'),
('Admin & Finance'),
('Engineering'),
('Training'),
('Geospatial');

INSERT INTO employees (employee_id, full_name, department_id, mobile_number) VALUES
('GMDQS00001', 'Ahmed Maxamed', (SELECT id FROM departments WHERE name = 'Engineering'), '+252613656021'),
('GMDQS00002', 'Liibaan', (SELECT id FROM departments WHERE name = 'Marketing'), '+252612663427'),
('GMDQS00003', 'Usaame Xassan', (SELECT id FROM departments WHERE name = 'Sales'), '+252616709856');

INSERT INTO admin_permissions (user_id, can_view_attendance, can_write_attendance, can_export_data, can_manage_employees, can_manage_admins, is_super_admin, created_by, updated_by)
VALUES ('3b668863-727c-4877-b1f5-ef81a206d892', true, true, true, true, true, false, '07cb8955-76ca-4aa2-ac85-55902d56a0c3', '07cb8955-76ca-4aa2-ac85-55902d56a0c3');

-- Axmed Najaad User
INSERT INTO admin_permissions (user_id, can_view_attendance, can_write_attendance, can_export_data, can_manage_employees, can_manage_admins, is_super_admin, created_by, updated_by)
VALUES ('07cb8955-76ca-4aa2-ac85-55902d56a0c3', true, true, true, true, true, true, '07cb8955-76ca-4aa2-ac85-55902d56a0c3', '07cb8955-76ca-4aa2-ac85-55902d56a0c3');

-- Liibaann user
INSERT INTO admin_permissions (user_id, can_view_attendance, can_write_attendance, can_export_data, can_manage_employees, can_manage_admins, is_super_admin, created_by, updated_by)
VALUES ('71920949-0a0a-48e8-b944-d34886e656c7', true, true, true, true, true, true, '71920949-0a0a-48e8-b944-d34886e656c7', '71920949-0a0a-48e8-b944-d34886e656c7');