

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

-- Create attendance_statuses table
CREATE TABLE IF NOT EXISTS attendance_statuses (
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
  status_id INTEGER NOT NULL REFERENCES attendance_statuses(id),
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
CREATE INDEX IF NOT EXISTS idx_attendance_status_id ON attendance(status_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date_status_id ON attendance(date, status_id);
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON departments(is_active);

CREATE INDEX IF NOT EXISTS idx_attendance_statuses_name ON attendance_statuses(name);
CREATE INDEX IF NOT EXISTS idx_attendance_statuses_is_active ON attendance_statuses(is_active);

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

CREATE TRIGGER update_attendance_statuses_updated_at
    BEFORE UPDATE ON attendance_statuses
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

-- Attendance Report Functions
CREATE OR REPLACE FUNCTION get_attendance_report(
  p_department_id INTEGER DEFAULT NULL,
  p_employee_id INTEGER DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  employee_id INTEGER,
  employee_code VARCHAR,
  full_name VARCHAR,
  department_name VARCHAR,
  total_days INTEGER,
  present_days INTEGER,
  absent_days INTEGER,
  holiday_days INTEGER,
  leave_days INTEGER,
  other_days INTEGER,
  attendance_percentage DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH attendance_data AS (
    SELECT
      e.id as emp_id,
      e.employee_id as emp_code,
      e.full_name,
      d.name as dept_name,
      COUNT(a.id) as total_days,
      COUNT(CASE WHEN a.status_id = (SELECT id FROM attendance_statuses WHERE name = 'Present' LIMIT 1) THEN 1 END) as present_days,
      COUNT(CASE WHEN a.status_id = (SELECT id FROM attendance_statuses WHERE name = 'Absent' LIMIT 1) THEN 1 END) as absent_days,
      COUNT(CASE WHEN a.status_id = (SELECT id FROM attendance_statuses WHERE name = 'Holiday' LIMIT 1) THEN 1 END) as holiday_days,
      COUNT(CASE WHEN a.status_id = (SELECT id FROM attendance_statuses WHERE name = 'On Leave' LIMIT 1) THEN 1 END) as leave_days,
      COUNT(CASE WHEN a.status_id NOT IN (
        (SELECT id FROM attendance_statuses WHERE name IN ('Present', 'Absent', 'Holiday', 'On Leave'))
      ) THEN 1 END) as other_days
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN attendance a ON e.id = a.employee_id
      AND (p_start_date IS NULL OR a.date >= p_start_date)
      AND (p_end_date IS NULL OR a.date <= p_end_date)
    WHERE
      e.is_active = true
      AND (p_department_id IS NULL OR e.department_id = p_department_id)
      AND (p_employee_id IS NULL OR e.id = p_employee_id)
    GROUP BY e.id, e.employee_id, e.full_name, d.name
  )
  SELECT
    ad.emp_id,
    ad.emp_code,
    ad.full_name,
    ad.dept_name,
    ad.total_days,
    ad.present_days,
    ad.absent_days,
    ad.holiday_days,
    ad.leave_days,
    ad.other_days,
    CASE
      WHEN ad.total_days > 0 THEN
        ROUND((ad.present_days::DECIMAL / ad.total_days) * 100, 2)
      ELSE 0
    END as attendance_percentage
  FROM attendance_data ad
  ORDER BY ad.dept_name, ad.full_name;
END;
$$;

CREATE OR REPLACE FUNCTION get_department_summary(
  p_department_id INTEGER DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  total_employees BIGINT,
  total_days BIGINT,
  total_present BIGINT,
  total_absent BIGINT,
  total_holidays BIGINT,
  total_leaves BIGINT,
  overall_attendance_percentage DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH employee_counts AS (
    SELECT COUNT(*) as emp_count
    FROM employees
    WHERE is_active = true
      AND (p_department_id IS NULL OR department_id = p_department_id)
  ),
  attendance_summary AS (
    SELECT
      COUNT(a.id) as total_records,
      COUNT(CASE WHEN a.status_id = (SELECT id FROM attendance_statuses WHERE name = 'Present' LIMIT 1) THEN 1 END) as present_count,
      COUNT(CASE WHEN a.status_id = (SELECT id FROM attendance_statuses WHERE name = 'Absent' LIMIT 1) THEN 1 END) as absent_count,
      COUNT(CASE WHEN a.status_id = (SELECT id FROM attendance_statuses WHERE name = 'Holiday' LIMIT 1) THEN 1 END) as holiday_count,
      COUNT(CASE WHEN a.status_id = (SELECT id FROM attendance_statuses WHERE name = 'On Leave' LIMIT 1) THEN 1 END) as leave_count
    FROM attendance a
    INNER JOIN employees e ON a.employee_id = e.id
    WHERE e.is_active = true
      AND (p_department_id IS NULL OR e.department_id = p_department_id)
      AND (p_start_date IS NULL OR a.date >= p_start_date)
      AND (p_end_date IS NULL OR a.date <= p_end_date)
  )
  SELECT
    ec.emp_count,
    COALESCE(ats.total_records, 0),
    COALESCE(ats.present_count, 0),
    COALESCE(ats.absent_count, 0),
    COALESCE(ats.holiday_count, 0),
    COALESCE(ats.leave_count, 0),
    CASE
      WHEN COALESCE(ats.total_records, 0) > 0 THEN
        ROUND((COALESCE(ats.present_count, 0)::DECIMAL / ats.total_records) * 100, 2)
      ELSE 0
    END
  FROM employee_counts ec, attendance_summary ats;
END;
$$;



INSERT INTO attendance_statuses (name) VALUES
  ('Present'),
  ('Absent'),
  ('On Leave'),
  ('Holiday');

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


-- select id,name from departments;
select id,name from attendance_statuses;


INSERT INTO attendance (employee_id, date, status_id, created_by, updated_by)
SELECT 
    id, 
    '2025-10-03'::DATE, 
    7,  -- Holiday status ID
    auth.uid(),
    auth.uid()
FROM employees 
WHERE is_active = true
ON CONFLICT (employee_id, date) 
DO UPDATE SET 
    status_id = 7,
    updated_by = auth.uid(),
    updated_at = NOW();


    