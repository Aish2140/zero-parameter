/*
# Seed Data for Zero Trust Engine

Populates departments, segments, mappings, applications, users, and devices
with realistic sample data for the simulation.
*/

-- Departments
INSERT INTO departments (name, description) VALUES
  ('HR', 'Human Resources department'),
  ('Finance', 'Finance and accounting'),
  ('Engineering', 'Software engineering and R&D'),
  ('Admin', 'IT administration and security')
ON CONFLICT (name) DO NOTHING;

-- Segments
INSERT INTO segments (name, description) VALUES
  ('HR-Segment', 'Isolated network segment for HR resources'),
  ('Finance-Segment', 'Isolated network segment for Finance resources'),
  ('Engineering-Segment', 'Isolated network segment for Engineering resources'),
  ('Admin-Segment', 'Isolated network segment for Admin resources')
ON CONFLICT (name) DO NOTHING;

-- Department-Segment mappings
INSERT INTO department_segments (department_id, segment_id)
SELECT d.id, s.id FROM departments d, segments s
WHERE (d.name = 'HR' AND s.name = 'HR-Segment')
   OR (d.name = 'Finance' AND s.name = 'Finance-Segment')
   OR (d.name = 'Engineering' AND s.name = 'Engineering-Segment')
   OR (d.name = 'Admin' AND s.name = 'Admin-Segment')
ON CONFLICT DO NOTHING;

-- Applications
INSERT INTO applications (name, segment_id, sensitivity_level, description)
SELECT 'HR Portal', s.id, 'Medium', 'Employee self-service portal for HR' FROM segments s WHERE s.name = 'HR-Segment'
ON CONFLICT DO NOTHING;

INSERT INTO applications (name, segment_id, sensitivity_level, description)
SELECT 'Payroll System', s.id, 'Critical', 'Salary and payroll management' FROM segments s WHERE s.name = 'HR-Segment'
ON CONFLICT DO NOTHING;

INSERT INTO applications (name, segment_id, sensitivity_level, description)
SELECT 'Finance Dashboard', s.id, 'High', 'Financial reporting and analytics' FROM segments s WHERE s.name = 'Finance-Segment'
ON CONFLICT DO NOTHING;

INSERT INTO applications (name, segment_id, sensitivity_level, description)
SELECT 'Source Repository', s.id, 'High', 'Git source code repositories' FROM segments s WHERE s.name = 'Engineering-Segment'
ON CONFLICT DO NOTHING;

INSERT INTO applications (name, segment_id, sensitivity_level, description)
SELECT 'Admin Console', s.id, 'Critical', 'System administration console' FROM segments s WHERE s.name = 'Admin-Segment'
ON CONFLICT DO NOTHING;

-- Users
INSERT INTO users (employee_id, name, email, department_id, role, normal_start_hour, normal_end_hour, normal_location, account_status) VALUES
  ('EMP001', 'Sarah Johnson', 'sarah.johnson@company.com', (SELECT id FROM departments WHERE name='HR'), 'Manager', 8, 17, 'New York, US', 'Active'),
  ('EMP002', 'Mike Chen', 'mike.chen@company.com', (SELECT id FROM departments WHERE name='Engineering'), 'Senior Engineer', 9, 18, 'San Francisco, US', 'Active'),
  ('EMP003', 'Emily Davis', 'emily.davis@company.com', (SELECT id FROM departments WHERE name='Finance'), 'Analyst', 9, 17, 'New York, US', 'Active'),
  ('EMP004', 'James Wilson', 'james.wilson@company.com', (SELECT id FROM departments WHERE name='Admin'), 'System Admin', 8, 20, 'New York, US', 'Active'),
  ('EMP005', 'Lisa Anderson', 'lisa.anderson@company.com', (SELECT id FROM departments WHERE name='Engineering'), 'Engineer', 10, 19, 'Austin, US', 'Active'),
  ('EMP006', 'Robert Brown', 'robert.brown@company.com', (SELECT id FROM departments WHERE name='Finance'), 'Manager', 9, 17, 'Chicago, US', 'Active'),
  ('EMP007', 'Jennifer Taylor', 'jennifer.taylor@company.com', (SELECT id FROM departments WHERE name='HR'), 'HR Specialist', 8, 17, 'New York, US', 'Suspended'),
  ('EMP008', 'David Martinez', 'david.martinez@company.com', (SELECT id FROM departments WHERE name='Engineering'), 'DevOps Engineer', 11, 22, 'Seattle, US', 'Active')
ON CONFLICT DO NOTHING;

-- Devices
INSERT INTO devices (device_id, device_name, device_type, assigned_user_id, trusted, device_health, os_status, antivirus_status) VALUES
  ('DEV001', 'Sarah-MacBook-Pro', 'Laptop', (SELECT id FROM users WHERE employee_id='EMP001'), true, 'Good', 'Updated', 'Active'),
  ('DEV002', 'Mike-ThinkPad-X1', 'Laptop', (SELECT id FROM users WHERE employee_id='EMP002'), true, 'Good', 'Updated', 'Active'),
  ('DEV003', 'Emily-Dell-Latitude', 'Laptop', (SELECT id FROM users WHERE employee_id='EMP003'), true, 'Fair', 'Updated', 'Active'),
  ('DEV004', 'James-HP-EliteBook', 'Laptop', (SELECT id FROM users WHERE employee_id='EMP004'), true, 'Good', 'Updated', 'Active'),
  ('DEV005', 'Lisa-MacBook-Air', 'Laptop', (SELECT id FROM users WHERE employee_id='EMP005'), true, 'Good', 'Updated', 'Active'),
  ('DEV006', 'Robert-Surface-Pro', 'Tablet', (SELECT id FROM users WHERE employee_id='EMP006'), false, 'Fair', 'Outdated', 'Active'),
  ('DEV007', 'Unknown-Device-X', 'Mobile', NULL, false, 'Poor', 'Critical', 'Not Installed'),
  ('DEV008', 'David-Workstation', 'Desktop', (SELECT id FROM users WHERE employee_id='EMP008'), true, 'Good', 'Updated', 'Active')
ON CONFLICT DO NOTHING;
