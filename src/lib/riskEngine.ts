import type {
  BiometricStatus,
  Decision,
  DeviceHealth,
  RiskLevel,
  SensitivityLevel,
} from '../types';

export interface RiskFactor {
  label: string;
  status: string;
  score: number;
  weight: number;
  weightedScore: number;
  passed: boolean;
}

export interface RiskEvaluation {
  factors: RiskFactor[];
  totalScore: number;
  riskLevel: RiskLevel;
  decision: Decision;
  securityAlert: boolean;
}

export interface EvaluationInput {
  identityVerified: boolean;
  biometricStatus: BiometricStatus;
  deviceHealth: DeviceHealth;
  deviceTrusted: boolean;
  locationAnomaly: boolean;
  timeAnomaly: boolean;
  applicationSensitivity: SensitivityLevel;
  segmentAllowed: boolean;
  accountSuspended: boolean;
}

const WEIGHTS = {
  identity: 15,
  biometric: 15,
  deviceHealth: 10,
  deviceTrust: 15,
  location: 15,
  time: 10,
  appSensitivity: 10,
  segment: 10,
};

export function evaluateRisk(input: EvaluationInput): RiskEvaluation {
  const factors: RiskFactor[] = [];

  // 1. Identity verification
  const identityScore = input.identityVerified ? 0 : 80;
  factors.push({
    label: 'Identity Verification',
    status: input.identityVerified ? 'Verified' : 'Failed',
    score: identityScore,
    weight: WEIGHTS.identity,
    weightedScore: (identityScore * WEIGHTS.identity) / 100,
    passed: input.identityVerified,
  });

  // 2. Biometric verification
  let bioScore = 0;
  let bioStatus = 'Verified';
  if (input.biometricStatus === 'Failed') {
    bioScore = 80;
    bioStatus = 'Failed';
  } else if (input.biometricStatus === 'Not Available') {
    bioScore = 40;
    bioStatus = 'Not Available';
  }
  factors.push({
    label: 'Biometric Verification',
    status: bioStatus,
    score: bioScore,
    weight: WEIGHTS.biometric,
    weightedScore: (bioScore * WEIGHTS.biometric) / 100,
    passed: input.biometricStatus === 'Verified',
  });

  // 3. Device health
  let healthScore = 0;
  if (input.deviceHealth === 'Poor') healthScore = 70;
  else if (input.deviceHealth === 'Fair') healthScore = 30;
  factors.push({
    label: 'Device Health',
    status: input.deviceHealth,
    score: healthScore,
    weight: WEIGHTS.deviceHealth,
    weightedScore: (healthScore * WEIGHTS.deviceHealth) / 100,
    passed: input.deviceHealth === 'Good',
  });

  // 4. Device trust
  const trustScore = input.deviceTrusted ? 0 : 60;
  factors.push({
    label: 'Device Trust',
    status: input.deviceTrusted ? 'Trusted' : 'Untrusted',
    score: trustScore,
    weight: WEIGHTS.deviceTrust,
    weightedScore: (trustScore * WEIGHTS.deviceTrust) / 100,
    passed: input.deviceTrusted,
  });

  // 5. Location analysis
  const locScore = input.locationAnomaly ? 70 : 0;
  factors.push({
    label: 'Location Analysis',
    status: input.locationAnomaly ? 'Anomaly Detected' : 'Normal Location',
    score: locScore,
    weight: WEIGHTS.location,
    weightedScore: (locScore * WEIGHTS.location) / 100,
    passed: !input.locationAnomaly,
  });

  // 6. Time analysis
  const timeScore = input.timeAnomaly ? 50 : 0;
  factors.push({
    label: 'Time Analysis',
    status: input.timeAnomaly ? 'Unusual Time' : 'Normal Hours',
    score: timeScore,
    weight: WEIGHTS.time,
    weightedScore: (timeScore * WEIGHTS.time) / 100,
    passed: !input.timeAnomaly,
  });

  // 7. Application sensitivity
  let appScore = 0;
  if (input.applicationSensitivity === 'Critical') appScore = 30;
  else if (input.applicationSensitivity === 'High') appScore = 20;
  else if (input.applicationSensitivity === 'Medium') appScore = 10;
  factors.push({
    label: 'Application Sensitivity',
    status: input.applicationSensitivity,
    score: appScore,
    weight: WEIGHTS.appSensitivity,
    weightedScore: (appScore * WEIGHTS.appSensitivity) / 100,
    passed: input.applicationSensitivity === 'Low' || input.applicationSensitivity === 'Medium',
  });

  // 8. Microsegmentation
  const segScore = input.segmentAllowed ? 0 : 90;
  factors.push({
    label: 'Microsegmentation Policy',
    status: input.segmentAllowed ? 'Access Allowed' : 'Access Denied',
    score: segScore,
    weight: WEIGHTS.segment,
    weightedScore: (segScore * WEIGHTS.segment) / 100,
    passed: input.segmentAllowed,
  });

  const totalScore = Math.round(factors.reduce((sum, f) => sum + f.weightedScore, 0));

  let riskLevel: RiskLevel;
  if (totalScore >= 60) riskLevel = 'High';
  else if (totalScore >= 30) riskLevel = 'Medium';
  else riskLevel = 'Low';

  let decision: Decision;
  let securityAlert = false;

  if (input.accountSuspended || !input.segmentAllowed || totalScore >= 80) {
    decision = 'Deny';
    securityAlert = true;
  } else if (totalScore >= 60) {
    decision = 'Restricted Access';
    securityAlert = true;
  } else if (totalScore >= 30) {
    decision = 'Additional Verification Required';
  } else {
    decision = 'Allow';
  }

  return { factors, totalScore, riskLevel, decision, securityAlert };
}

export function isWithinNormalHours(startHour: number, endHour: number, currentHour: number): boolean {
  if (startHour <= endHour) {
    return currentHour >= startHour && currentHour < endHour;
  }
  // Overnight shift
  return currentHour >= startHour || currentHour < endHour;
}

// ── USB Device Risk Evaluation ────────────────────────────────────────────────

export interface UsbRiskInput {
  isRegistered: boolean;         // found in the devices table?
  deviceType: string;            // e.g. 'Mass Storage (USB Drive)', 'Android Device'
  manufacturer: string;          // blank = unknown
  deviceId: string;              // hardware/instance ID
  serialNumber: string;          // extracted serial
}

export interface UsbRiskFactor {
  label: string;
  status: string;
  score: number;
  weight: number;
  weightedScore: number;
  passed: boolean;
}

export interface UsbRiskEvaluation {
  factors: UsbRiskFactor[];
  totalScore: number;
  riskLevel: RiskLevel;
  decision: string;
  securityAlert: boolean;
  riskReasons: string[];
}

const USB_WEIGHTS = {
  registration: 40,
  deviceType: 25,
  manufacturer: 20,
  identity: 15,
};

/** High-risk USB device types that warrant elevated scores */
const HIGH_RISK_TYPES = [
  'Mass Storage (USB Drive)',
  'Android Device',
  'Apple iOS Device',
  'Portable Device (MTP)',
  'USB Network Adapter',
];

/** Medium-risk types */
const MEDIUM_RISK_TYPES = [
  'Camera / Webcam',
  'Printer',
  'Audio Device',
];

export function evaluateUsbRisk(input: UsbRiskInput): UsbRiskEvaluation {
  const factors: UsbRiskFactor[] = [];
  const riskReasons: string[] = [];

  // 1. Device Registration (most important — is it in our trusted device list?)
  const regScore = input.isRegistered ? 0 : 90;
  factors.push({
    label: 'Device Registration',
    status: input.isRegistered ? 'Registered & Trusted' : 'Unknown / Unregistered',
    score: regScore,
    weight: USB_WEIGHTS.registration,
    weightedScore: (regScore * USB_WEIGHTS.registration) / 100,
    passed: input.isRegistered,
  });
  if (!input.isRegistered) riskReasons.push('Device not registered in trusted device list');

  // 2. Device Type Risk
  let typeScore = 0;
  let typePassed = true;
  if (HIGH_RISK_TYPES.includes(input.deviceType)) {
    typeScore = 70;
    typePassed = false;
    riskReasons.push(`High-risk device type: ${input.deviceType}`);
  } else if (MEDIUM_RISK_TYPES.includes(input.deviceType)) {
    typeScore = 35;
    typePassed = false;
    riskReasons.push(`Moderate-risk device type: ${input.deviceType}`);
  }
  factors.push({
    label: 'Device Type',
    status: input.deviceType || 'Unknown',
    score: typeScore,
    weight: USB_WEIGHTS.deviceType,
    weightedScore: (typeScore * USB_WEIGHTS.deviceType) / 100,
    passed: typePassed,
  });

  // 3. Manufacturer Verification
  const mfrKnown = !!(input.manufacturer && input.manufacturer.trim().length > 0);
  const mfrScore = mfrKnown ? 0 : 50;
  factors.push({
    label: 'Manufacturer',
    status: mfrKnown ? input.manufacturer : 'Unknown / Not Reported',
    score: mfrScore,
    weight: USB_WEIGHTS.manufacturer,
    weightedScore: (mfrScore * USB_WEIGHTS.manufacturer) / 100,
    passed: mfrKnown,
  });
  if (!mfrKnown) riskReasons.push('Manufacturer identity not verifiable');

  // 4. Device Identity (has a device ID / serial)
  const hasIdentity = !!(input.deviceId && input.deviceId.length > 0) ||
                      !!(input.serialNumber && input.serialNumber.length > 0);
  const idScore = hasIdentity ? 0 : 60;
  factors.push({
    label: 'Device Identity',
    status: hasIdentity
      ? `ID: ${input.serialNumber || input.deviceId.slice(0, 30)}`
      : 'No Serial / ID',
    score: idScore,
    weight: USB_WEIGHTS.identity,
    weightedScore: (idScore * USB_WEIGHTS.identity) / 100,
    passed: hasIdentity,
  });
  if (!hasIdentity) riskReasons.push('No device serial number or hardware ID available');

  const totalScore = Math.round(factors.reduce((sum, f) => sum + f.weightedScore, 0));

  let riskLevel: RiskLevel;
  if (totalScore >= 60) riskLevel = 'High';
  else if (totalScore >= 30) riskLevel = 'Medium';
  else riskLevel = 'Low';

  let decision: string;
  let securityAlert = false;

  if (!input.isRegistered || totalScore >= 60) {
    decision = 'Unauthorized Device';
    securityAlert = true;
  } else if (totalScore >= 30) {
    decision = 'Restricted — Admin Review Required';
  } else {
    decision = 'Authorized';
  }

  return { factors, totalScore, riskLevel, decision, securityAlert, riskReasons };
}
