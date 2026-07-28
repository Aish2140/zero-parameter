/*
# Seed Access Logs

Populates access_logs with realistic sample entries covering all risk levels
and decision types for initial dashboard display.
*/

INSERT INTO access_logs (user_name, department_name, device_id, device_name, location, access_time, application_name, application_sensitivity, biometric_status, identity_verified, device_trusted, device_health, location_anomaly, time_anomaly, segment_allowed, risk_score, risk_level, decision, security_alert)
VALUES
  ('Sarah Johnson', 'HR', 'DEV001', 'Sarah-MacBook-Pro', 'New York, US', now() - interval '1 hour', 'HR Portal', 'Medium', 'Verified', true, true, 'Good', false, false, true, 10, 'Low', 'Allow', false),
  ('Mike Chen', 'Engineering', 'DEV002', 'Mike-ThinkPad-X1', 'San Francisco, US', now() - interval '2 hours', 'Source Repository', 'High', 'Verified', true, true, 'Good', false, false, true, 15, 'Low', 'Allow', false),
  ('Emily Davis', 'Finance', 'DEV003', 'Emily-Dell-Latitude', 'New York, US', now() - interval '3 hours', 'Finance Dashboard', 'High', 'Verified', true, true, 'Fair', false, false, true, 25, 'Low', 'Allow', false),
  ('James Wilson', 'Admin', 'DEV004', 'James-HP-EliteBook', 'New York, US', now() - interval '4 hours', 'Admin Console', 'Critical', 'Verified', true, true, 'Good', false, false, true, 20, 'Low', 'Allow', false),
  ('Lisa Anderson', 'Engineering', 'DEV005', 'Lisa-MacBook-Air', 'Austin, US', now() - interval '5 hours', 'Source Repository', 'High', 'Verified', true, true, 'Good', false, false, true, 15, 'Low', 'Allow', false),
  ('Robert Brown', 'Finance', 'DEV006', 'Robert-Surface-Pro', 'Chicago, US', now() - interval '6 hours', 'Finance Dashboard', 'High', 'Not Available', true, false, 'Fair', false, false, true, 45, 'Medium', 'Additional Verification Required', false),
  ('Jennifer Taylor', 'HR', 'DEV001', 'Sarah-MacBook-Pro', 'Los Angeles, US', now() - interval '7 hours', 'Payroll System', 'Critical', 'Failed', false, true, 'Good', true, false, true, 75, 'High', 'Restricted Access', true),
  ('Unknown User', 'Engineering', 'DEV007', 'Unknown-Device-X', 'Unknown Location', now() - interval '8 hours', 'Admin Console', 'Critical', 'Failed', false, false, 'Poor', true, true, false, 95, 'High', 'Deny', true),
  ('David Martinez', 'Engineering', 'DEV008', 'David-Workstation', 'Seattle, US', now() - interval '10 hours', 'Source Repository', 'High', 'Verified', true, true, 'Good', false, false, true, 12, 'Low', 'Allow', false),
  ('Sarah Johnson', 'HR', 'DEV001', 'Sarah-MacBook-Pro', 'New York, US', now() - interval '12 hours', 'HR Portal', 'Medium', 'Verified', true, true, 'Good', false, false, true, 10, 'Low', 'Allow', false),
  ('Mike Chen', 'Engineering', 'DEV002', 'Mike-ThinkPad-X1', 'San Francisco, US', now() - interval '14 hours', 'Source Repository', 'High', 'Verified', true, true, 'Good', false, false, true, 15, 'Low', 'Allow', false),
  ('Emily Davis', 'Finance', 'DEV003', 'Emily-Dell-Latitude', 'Boston, US', now() - interval '16 hours', 'Payroll System', 'Critical', 'Not Available', true, true, 'Fair', true, false, false, 65, 'Medium', 'Additional Verification Required', false),
  ('James Wilson', 'Admin', 'DEV004', 'James-HP-EliteBook', 'New York, US', now() - interval '18 hours', 'Admin Console', 'Critical', 'Verified', true, true, 'Good', false, false, true, 20, 'Low', 'Allow', false),
  ('Robert Brown', 'Finance', 'DEV006', 'Robert-Surface-Pro', 'Miami, US', now() - interval '20 hours', 'Finance Dashboard', 'High', 'Failed', false, false, 'Fair', true, true, true, 80, 'High', 'Restricted Access', true),
  ('Lisa Anderson', 'Engineering', 'DEV005', 'Lisa-MacBook-Air', 'Austin, US', now() - interval '22 hours', 'Source Repository', 'High', 'Verified', true, true, 'Good', false, false, true, 15, 'Low', 'Allow', false),
  ('Unknown User', 'Admin', 'DEV007', 'Unknown-Device-X', 'Unknown Location', now() - interval '24 hours', 'Admin Console', 'Critical', 'Failed', false, false, 'Poor', true, true, false, 95, 'High', 'Deny', true),
  ('David Martinez', 'Engineering', 'DEV008', 'David-Workstation', 'Seattle, US', now() - interval '26 hours', 'Source Repository', 'High', 'Verified', true, true, 'Good', false, false, true, 12, 'Low', 'Allow', false),
  ('Sarah Johnson', 'HR', 'DEV001', 'Sarah-MacBook-Pro', 'New York, US', now() - interval '28 hours', 'HR Portal', 'Medium', 'Verified', true, true, 'Good', false, false, true, 10, 'Low', 'Allow', false),
  ('Mike Chen', 'Engineering', 'DEV002', 'Mike-ThinkPad-X1', 'San Francisco, US', now() - interval '30 hours', 'Source Repository', 'High', 'Verified', true, true, 'Good', false, false, true, 15, 'Low', 'Allow', false),
  ('Jennifer Taylor', 'HR', 'DEV001', 'Sarah-MacBook-Pro', 'London, UK', now() - interval '32 hours', 'Payroll System', 'Critical', 'Failed', false, true, 'Good', true, true, true, 85, 'High', 'Deny', true)
ON CONFLICT DO NOTHING;
