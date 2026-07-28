/*
# Zero Trust Microsegmentation Engine - Core Schema

## Overview
Creates the full schema for an AI-Driven Zero Trust Microsegmentation Engine simulation.
This is a single-tenant prototype (simulated admin/employee login, not real Supabase auth),
so all tables use `TO anon, authenticated` policies for full CRUD access.

## New Tables
1. `departments` — Company departments (HR, Finance, Engineering, Admin)
2. `segments` — Network microsegments for isolation
3. `department_segments` — Maps departments to their allowed segments
4. `applications` — Company apps/resources with sensitivity levels
5. `users` — Employee records with behavioral baselines
6. `devices` — Employee devices with trust/health status
7. `access_logs` — Every access request with risk evaluation results

## Security
- RLS enabled on all tables
- All tables allow full CRUD for anon + authenticated (single-tenant simulation)
*/

-- Departments
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Segments (microsegments)
CREATE TABLE IF NOT EXISTS segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Department-Segment mapping (many-to-many)
CREATE TABLE IF NOT EXISTS department_segments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  segment_id uuid NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(department_id, segment_id)
);

-- Applications
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  segment_id uuid NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  sensitivity_level text NOT NULL CHECK (sensitivity_level IN ('Low', 'Medium', 'High', 'Critical')),
  description text,
  created_at timestamptz DEFAULT now()
);

-- Users (employees)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id text NOT NULL UNIQUE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  department_id uuid NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'Employee',
  normal_start_hour int NOT NULL DEFAULT 9,
  normal_end_hour int NOT NULL DEFAULT 17,
  normal_location text NOT NULL DEFAULT 'New York, US',
  account_status text NOT NULL DEFAULT 'Active' CHECK (account_status IN ('Active', 'Suspended', 'Locked')),
  created_at timestamptz DEFAULT now()
);

-- Devices
CREATE TABLE IF NOT EXISTS devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id text NOT NULL UNIQUE,
  device_name text NOT NULL,
  device_type text NOT NULL DEFAULT 'Laptop',
  assigned_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  trusted boolean NOT NULL DEFAULT false,
  device_health text NOT NULL DEFAULT 'Fair' CHECK (device_health IN ('Good', 'Fair', 'Poor')),
  os_status text NOT NULL DEFAULT 'Updated' CHECK (os_status IN ('Updated', 'Outdated', 'Critical')),
  antivirus_status text NOT NULL DEFAULT 'Active' CHECK (antivirus_status IN ('Active', 'Inactive', 'Not Installed')),
  created_at timestamptz DEFAULT now()
);

-- Access logs
CREATE TABLE IF NOT EXISTS access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  user_name text,
  department_name text,
  device_id text,
  device_name text,
  location text NOT NULL,
  access_time timestamptz NOT NULL DEFAULT now(),
  application_name text,
  application_sensitivity text,
  biometric_status text NOT NULL DEFAULT 'Not Available',
  identity_verified boolean NOT NULL DEFAULT false,
  device_trusted boolean NOT NULL DEFAULT false,
  device_health text,
  location_anomaly boolean NOT NULL DEFAULT false,
  time_anomaly boolean NOT NULL DEFAULT false,
  segment_allowed boolean NOT NULL DEFAULT false,
  risk_score int NOT NULL DEFAULT 0,
  risk_level text NOT NULL DEFAULT 'Low',
  decision text NOT NULL DEFAULT 'Allow',
  security_alert boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_access_logs_user ON access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_access_logs_risk_level ON access_logs(risk_level);
CREATE INDEX IF NOT EXISTS idx_access_logs_created ON access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);
CREATE INDEX IF NOT EXISTS idx_devices_user ON devices(assigned_user_id);
CREATE INDEX IF NOT EXISTS idx_applications_segment ON applications(segment_id);

-- Enable RLS on all tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE department_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_logs ENABLE ROW LEVEL SECURITY;

-- Policies: departments (full CRUD for anon+authenticated)
DROP POLICY IF EXISTS "anon_select_departments" ON departments;
CREATE POLICY "anon_select_departments" ON departments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_departments" ON departments;
CREATE POLICY "anon_insert_departments" ON departments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_departments" ON departments;
CREATE POLICY "anon_update_departments" ON departments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_departments" ON departments;
CREATE POLICY "anon_delete_departments" ON departments FOR DELETE TO anon, authenticated USING (true);

-- Policies: segments
DROP POLICY IF EXISTS "anon_select_segments" ON segments;
CREATE POLICY "anon_select_segments" ON segments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_segments" ON segments;
CREATE POLICY "anon_insert_segments" ON segments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_segments" ON segments;
CREATE POLICY "anon_update_segments" ON segments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_segments" ON segments;
CREATE POLICY "anon_delete_segments" ON segments FOR DELETE TO anon, authenticated USING (true);

-- Policies: department_segments
DROP POLICY IF EXISTS "anon_select_dept_segments" ON department_segments;
CREATE POLICY "anon_select_dept_segments" ON department_segments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_dept_segments" ON department_segments;
CREATE POLICY "anon_insert_dept_segments" ON department_segments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_dept_segments" ON department_segments;
CREATE POLICY "anon_update_dept_segments" ON department_segments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_dept_segments" ON department_segments;
CREATE POLICY "anon_delete_dept_segments" ON department_segments FOR DELETE TO anon, authenticated USING (true);

-- Policies: applications
DROP POLICY IF EXISTS "anon_select_applications" ON applications;
CREATE POLICY "anon_select_applications" ON applications FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_applications" ON applications;
CREATE POLICY "anon_insert_applications" ON applications FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_applications" ON applications;
CREATE POLICY "anon_update_applications" ON applications FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_applications" ON applications;
CREATE POLICY "anon_delete_applications" ON applications FOR DELETE TO anon, authenticated USING (true);

-- Policies: users
DROP POLICY IF EXISTS "anon_select_users" ON users;
CREATE POLICY "anon_select_users" ON users FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_users" ON users;
CREATE POLICY "anon_insert_users" ON users FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_users" ON users;
CREATE POLICY "anon_update_users" ON users FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_users" ON users;
CREATE POLICY "anon_delete_users" ON users FOR DELETE TO anon, authenticated USING (true);

-- Policies: devices
DROP POLICY IF EXISTS "anon_select_devices" ON devices;
CREATE POLICY "anon_select_devices" ON devices FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_devices" ON devices;
CREATE POLICY "anon_insert_devices" ON devices FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_devices" ON devices;
CREATE POLICY "anon_update_devices" ON devices FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_devices" ON devices;
CREATE POLICY "anon_delete_devices" ON devices FOR DELETE TO anon, authenticated USING (true);

-- Policies: access_logs
DROP POLICY IF EXISTS "anon_select_access_logs" ON access_logs;
CREATE POLICY "anon_select_access_logs" ON access_logs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_access_logs" ON access_logs;
CREATE POLICY "anon_insert_access_logs" ON access_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_access_logs" ON access_logs;
CREATE POLICY "anon_update_access_logs" ON access_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_access_logs" ON access_logs;
CREATE POLICY "anon_delete_access_logs" ON access_logs FOR DELETE TO anon, authenticated USING (true);
