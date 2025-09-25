-- Employee Attendance Management System - Database Schema

-- Create employees table
CREATE TABLE IF NOT EXISTS employees (
  id SERIAL PRIMARY KEY,
  employee_id VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  department VARCHAR(255) NOT NULL,
  mobile_number VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  employee_id VARCHAR(255) NOT NULL,
  date DATE NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'on_leave')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);

-- Sample data for testing (optional)
-- INSERT INTO employees (employee_id, full_name, department, mobile_number) VALUES 
-- ('EMP23100001', 'John Doe', 'Engineering', '+1234567890'),
-- ('EMP23100002', 'Jane Smith', 'Marketing', '+1234567891'),
-- ('EMP23100003', 'Robert Johnson', 'Sales', '+1234567892');