export type AccountStatus = 'Active' | 'Suspended' | 'Locked';
export type DeviceHealth = 'Good' | 'Fair' | 'Poor';
export type OsStatus = 'Updated' | 'Outdated' | 'Critical';
export type AntivirusStatus = 'Active' | 'Inactive' | 'Not Installed';
export type SensitivityLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type BiometricStatus = 'Verified' | 'Failed' | 'Not Available';
export type RiskLevel = 'Low' | 'Medium' | 'High';
export type Decision = 'Allow' | 'Additional Verification Required' | 'Restricted Access' | 'Deny';
export type UserRole = 'Admin' | 'Employee';

export interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface Segment {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
}

export interface DepartmentSegment {
  id: string;
  department_id: string;
  segment_id: string;
  created_at: string;
}

export interface Application {
  id: string;
  name: string;
  segment_id: string;
  sensitivity_level: SensitivityLevel;
  description: string | null;
  created_at: string;
}

export interface User {
  id: string;
  employee_id: string;
  name: string;
  email: string;
  department_id: string;
  role: string;
  normal_start_hour: number;
  normal_end_hour: number;
  normal_location: string;
  account_status: AccountStatus;
  created_at: string;
}

export interface Device {
  id: string;
  device_id: string;
  device_name: string;
  device_type: string;
  assigned_user_id: string | null;
  trusted: boolean;
  device_health: DeviceHealth;
  os_status: OsStatus;
  antivirus_status: AntivirusStatus;
  created_at: string;
}

export interface AccessLog {
  id: string;
  user_id: string | null;
  user_name: string | null;
  department_name: string | null;
  device_id: string | null;
  device_name: string | null;
  location: string;
  access_time: string;
  application_name: string | null;
  application_sensitivity: string | null;
  biometric_status: BiometricStatus;
  identity_verified: boolean;
  device_trusted: boolean;
  device_health: string | null;
  location_anomaly: boolean;
  time_anomaly: boolean;
  segment_allowed: boolean;
  risk_score: number;
  risk_level: RiskLevel;
  decision: Decision;
  security_alert: boolean;
  created_at: string;
}

export interface UserWithDepartment extends User {
  department_name?: string;
}

export interface DeviceWithUser extends Device {
  assigned_user_name?: string | null;
}

export interface ApplicationWithSegment extends Application {
  segment_name?: string;
}

export interface AuthUser {
  role: UserRole;
  name: string;
  email: string;
}
