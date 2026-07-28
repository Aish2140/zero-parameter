import { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Fingerprint,
  Laptop,
  MapPin,
  Clock,
  AppWindow,
  Network,
  User as UserIcon,
  ScanLine,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  FileDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import type {
  User,
  Device,
  Application,
  Department,
  Segment,
  DepartmentSegment,
  BiometricStatus,
  AccessLog,
} from '../types';
import { evaluateRisk, isWithinNormalHours, type RiskEvaluation } from '../lib/riskEngine';
import { RiskBadge, DecisionBadge } from '../components/ui/Badges';
import { RiskGauge } from '../components/ui/RiskGauge';

export function AccessEvaluationPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [mappings, setMappings] = useState<DepartmentSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);

  const [selectedUser, setSelectedUser] = useState('');
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedApp, setSelectedApp] = useState('');
  const [location, setLocation] = useState('New York, US');
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus>('Verified');
  const [accessHour, setAccessHour] = useState(new Date().getHours());

  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<RiskEvaluation | null>(null);

  // Store last evaluation context for PDF
  const [evalContext, setEvalContext] = useState<{
    user: User;
    device: Device | undefined;
    app: Application;
    location: string;
    accessHour: number;
    biometricStatus: BiometricStatus;
    timestamp: string;
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [u, d, a, dep, seg, map] = await Promise.all([
      supabase.from('users').select('*').order('name'),
      supabase.from('devices').select('*').order('device_name'),
      supabase.from('applications').select('*').order('name'),
      supabase.from('departments').select('*'),
      supabase.from('segments').select('*'),
      supabase.from('department_segments').select('*'),
    ]);
    setUsers(u.data || []);
    setDevices(d.data || []);
    setApps(a.data || []);
    setDepartments(dep.data || []);
    setSegments(seg.data || []);
    setMappings(map.data || []);
    setLoading(false);
  }

  function handleEvaluate() {
    if (!selectedUser || !selectedApp) return;
    setEvaluating(true);
    setResult(null);
    setEvalContext(null);

    setTimeout(() => {
      const user = users.find((u) => u.id === selectedUser);
      const device = devices.find((d) => d.id === selectedDevice);
      const app = apps.find((a) => a.id === selectedApp);

      if (!user || !app) {
        setEvaluating(false);
        return;
      }

      const userDept = departments.find((d) => d.id === user.department_id);
      const appSegment = segments.find((s) => s.id === app.segment_id);
      const userSegments = mappings
        .filter((m) => m.department_id === user.department_id)
        .map((m) => m.segment_id);
      const segmentAllowed = appSegment ? userSegments.includes(appSegment.id) : false;

      const locationAnomaly = location !== user.normal_location;
      const timeAnomaly = !isWithinNormalHours(user.normal_start_hour, user.normal_end_hour, accessHour);

      const evaluation = evaluateRisk({
        identityVerified: user.account_status === 'Active',
        biometricStatus,
        deviceHealth: device?.device_health || 'Poor',
        deviceTrusted: device?.trusted || false,
        locationAnomaly,
        timeAnomaly,
        applicationSensitivity: app.sensitivity_level,
        segmentAllowed,
        accountSuspended: user.account_status !== 'Active',
      });

      setResult(evaluation);
      setEvalContext({
        user,
        device,
        app,
        location,
        accessHour,
        biometricStatus,
        timestamp: new Date().toISOString(),
      });

      if (evaluation.riskLevel === 'Low') {
        toast.success(`Access ${evaluation.decision}`);
      } else if (evaluation.riskLevel === 'Medium') {
        toast(`Access ${evaluation.decision}: Verification Required`, { icon: '⚠️' });
      } else {
        toast.error(`SECURITY ALERT: ${evaluation.decision}`, { duration: 5000 });
      }

      // Save to access_logs
      const logEntry: Omit<AccessLog, 'id' | 'created_at'> = {
        user_id: user.id,
        user_name: user.name,
        department_name: userDept?.name || null,
        device_id: device?.device_id || null,
        device_name: device?.device_name || null,
        location,
        access_time: new Date().toISOString(),
        application_name: app.name,
        application_sensitivity: app.sensitivity_level,
        biometric_status: biometricStatus,
        identity_verified: user.account_status === 'Active',
        device_trusted: device?.trusted || false,
        device_health: device?.device_health || null,
        location_anomaly: locationAnomaly,
        time_anomaly: timeAnomaly,
        segment_allowed: segmentAllowed,
        risk_score: evaluation.totalScore,
        risk_level: evaluation.riskLevel,
        decision: evaluation.decision,
        security_alert: evaluation.securityAlert,
      };

      supabase.from('access_logs').insert(logEntry).then();
      setEvaluating(false);
    }, 2000);
  }

  async function handleExportPDF() {
    if (!result || !evalContext) return;
    setExportingPdf(true);

    try {
      // Dynamic import so jspdf is only loaded when needed
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();

      // ── Header bar ──────────────────────────────────────────────
      doc.setFillColor(10, 14, 20);
      doc.rect(0, 0, pageW, 28, 'F');
      doc.setTextColor(6, 182, 212);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('ZeroTrust Microsegmentation Engine', 14, 12);
      doc.setFontSize(9);
      doc.setTextColor(150, 160, 175);
      doc.setFont('helvetica', 'normal');
      doc.text('AI Risk Evaluation Report', 14, 20);
      doc.text(`Generated: ${new Date(evalContext.timestamp).toLocaleString()}`, pageW - 14, 20, { align: 'right' });

      let y = 36;

      // ── Summary section ──────────────────────────────────────────
      doc.setFontSize(11);
      doc.setTextColor(200, 210, 220);
      doc.setFont('helvetica', 'bold');
      doc.text('EVALUATION SUMMARY', 14, y);
      y += 2;
      doc.setDrawColor(6, 182, 212, 0.4);
      doc.setLineWidth(0.3);
      doc.line(14, y, pageW - 14, y);
      y += 6;

      const summaryRows = [
        ['User', evalContext.user.name + ' (' + evalContext.user.employee_id + ')'],
        ['Device', evalContext.device?.device_name || 'No device selected'],
        ['Application', evalContext.app.name + ' — ' + evalContext.app.sensitivity_level],
        ['Login Location', evalContext.location],
        ['Access Hour', `${evalContext.accessHour}:00`],
        ['Biometric', evalContext.biometricStatus],
      ];

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      summaryRows.forEach(([label, value]) => {
        doc.setTextColor(140, 150, 165);
        doc.text(label + ':', 14, y);
        doc.setTextColor(210, 220, 230);
        doc.text(value, 70, y);
        y += 6;
      });

      y += 4;

      // ── Risk score box ────────────────────────────────────────────
      const scoreColor =
        result.riskLevel === 'Low' ? [34, 197, 94] :
        result.riskLevel === 'Medium' ? [234, 179, 8] : [239, 68, 68];

      doc.setFillColor(20, 26, 35);
      doc.roundedRect(14, y, pageW - 28, 22, 3, 3, 'F');
      doc.setTextColor(...(scoreColor as [number, number, number]));
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(String(result.totalScore), 28, y + 14);
      doc.setFontSize(9);
      doc.text('/100', 40, y + 14);
      doc.setFontSize(13);
      doc.text(result.riskLevel + ' Risk', 65, y + 9);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('→  ' + result.decision, 65, y + 17);
      if (result.securityAlert) {
        doc.setTextColor(239, 68, 68);
        doc.setFontSize(8);
        doc.text('⚠  SECURITY ALERT GENERATED', pageW - 14, y + 13, { align: 'right' });
      }
      y += 30;

      // ── Factor table ──────────────────────────────────────────────
      doc.setFontSize(11);
      doc.setTextColor(200, 210, 220);
      doc.setFont('helvetica', 'bold');
      doc.text('SECURITY FACTOR ANALYSIS', 14, y);
      y += 2;
      doc.line(14, y, pageW - 14, y);
      y += 6;

      // Table header
      doc.setFillColor(17, 22, 29);
      doc.rect(14, y - 4, pageW - 28, 7, 'F');
      doc.setFontSize(8);
      doc.setTextColor(100, 120, 140);
      doc.setFont('helvetica', 'bold');
      doc.text('FACTOR', 16, y);
      doc.text('STATUS', 90, y);
      doc.text('SCORE', 140, y);
      doc.text('WEIGHT', 162, y);
      doc.text('WEIGHTED', 180, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      result.factors.forEach((factor) => {
        const rowColor = factor.passed ? [34, 197, 94] : [239, 68, 68];
        doc.setTextColor(200, 210, 220);
        doc.text(factor.label, 16, y);
        doc.setTextColor(...(rowColor as [number, number, number]));
        doc.text(factor.status, 90, y);
        doc.text(String(factor.score), 140, y);
        doc.setTextColor(160, 170, 185);
        doc.text(factor.weight + '%', 162, y);
        doc.text(factor.weightedScore.toFixed(1), 180, y);
        y += 6;
        doc.setDrawColor(30, 38, 48);
        doc.line(14, y - 2, pageW - 14, y - 2);
      });

      y += 6;

      // ── Footer ────────────────────────────────────────────────────
      doc.setFillColor(10, 14, 20);
      doc.rect(0, doc.internal.pageSize.getHeight() - 14, pageW, 14, 'F');
      doc.setFontSize(7);
      doc.setTextColor(80, 90, 105);
      doc.text(
        'CONFIDENTIAL — Simulation Only. AI-Driven Zero Trust Microsegmentation Engine — College Major Project',
        pageW / 2,
        doc.internal.pageSize.getHeight() - 5,
        { align: 'center' },
      );

      doc.save(`ZeroTrust_Risk_Report_${evalContext.user.name.replace(/\s+/g, '_')}_${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setExportingPdf(false);
    }
  }

  function resetForm() {
    setResult(null);
    setEvalContext(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center">
          <ShieldCheck size={20} className="text-accent-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-100">Access Evaluation Engine</h3>
          <p className="text-sm text-gray-500">AI-driven zero trust access request evaluation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request form */}
        <div className="card p-6">
          <h4 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <ScanLine size={16} className="text-accent-400" />
            Access Request Parameters
          </h4>
          <div className="space-y-4">
            <div>
              <label className="label">User Identity</label>
              <select value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)} className="input">
                <option value="">Select user</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.employee_id}) — {u.account_status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Device</label>
              <select value={selectedDevice} onChange={(e) => setSelectedDevice(e.target.value)} className="input">
                <option value="">Select device (optional)</option>
                {devices.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.device_name} ({d.device_id}) — {d.trusted ? 'Trusted' : 'Untrusted'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Application Being Accessed</label>
              <select value={selectedApp} onChange={(e) => setSelectedApp(e.target.value)} className="input">
                <option value="">Select application</option>
                {apps.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {a.sensitivity_level}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Login Location</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City, Country"
                  className="input"
                />
              </div>
              <div>
                <label className="label">Access Hour (0–23)</label>
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={accessHour}
                  onChange={(e) => setAccessHour(parseInt(e.target.value) || 0)}
                  className="input"
                />
              </div>
            </div>

            <div>
              <label className="label">Biometric Verification (Simulated)</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Verified', 'Failed', 'Not Available'] as BiometricStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => setBiometricStatus(status)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all ${
                      biometricStatus === status
                        ? status === 'Verified'
                          ? 'bg-success-500/10 border-success-500/40 text-success-400'
                          : status === 'Failed'
                            ? 'bg-danger-500/10 border-danger-500/40 text-danger-400'
                            : 'bg-warning-500/10 border-warning-500/40 text-warning-400'
                        : 'bg-base-850 border-base-600 text-gray-500 hover:border-base-500'
                    }`}
                  >
                    <Fingerprint size={14} />
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleEvaluate}
              disabled={!selectedUser || !selectedApp || evaluating}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {evaluating ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  AI Evaluating...
                </>
              ) : (
                <>
                  <ScanLine size={18} />
                  Evaluate Access Request
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scorecard */}
        <div className="card p-6">
          <h4 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
            <ShieldCheck size={16} className="text-accent-400" />
            AI Risk Scorecard
          </h4>

          {/* Evaluating animation */}
          {evaluating && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative w-20 h-20 mb-4">
                <div className="absolute inset-0 border-2 border-accent-500/20 rounded-full" />
                <div className="absolute inset-0 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
                <ScanLine size={24} className="absolute inset-0 m-auto text-accent-400 animate-pulse" />
              </div>
              <p className="text-sm text-gray-400">Analyzing security factors...</p>
              <p className="text-xs text-gray-600 mt-1">Running AI risk evaluation model</p>
            </div>
          )}

          {/* Empty state */}
          {!evaluating && !result && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShieldCheck size={48} className="text-gray-700 mb-3" />
              <p className="text-sm text-gray-500">No evaluation yet</p>
              <p className="text-xs text-gray-600 mt-1">Fill the form and click Evaluate to generate a risk scorecard</p>
            </div>
          )}

          {/* Result */}
          {result && !evaluating && (
            <div className="space-y-4 animate-slide-up">
              {/* Gauge hero */}
              <div className="flex justify-center py-2">
                <RiskGauge score={result.totalScore} level={result.riskLevel} size={200} />
              </div>

              {/* Factor rows */}
              <div className="space-y-2">
                {result.factors.map((factor, i) => {
                  const Icon = [UserIcon, Fingerprint, Laptop, ShieldCheck, MapPin, Clock, AppWindow, Network][i] || ShieldCheck;
                  return (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-base-850 border border-base-600/30">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${factor.passed ? 'bg-success-500/10' : 'bg-danger-500/10'}`}>
                        <Icon size={15} className={factor.passed ? 'text-success-400' : 'text-danger-400'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-200">{factor.label}</p>
                        <p className="text-xs text-gray-500">{factor.status}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-semibold ${factor.score < 30 ? 'text-success-400' : factor.score < 60 ? 'text-warning-400' : 'text-danger-400'}`}>
                          {factor.score}
                        </p>
                        <p className="text-xs text-gray-600">risk pts</p>
                      </div>
                      {factor.passed ? (
                        <CheckCircle2 size={16} className="text-success-400 flex-shrink-0" />
                      ) : (
                        <XCircle size={16} className="text-danger-400 flex-shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Decision row */}
              <div className="pt-3 border-t border-base-600/50 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Risk Level</span>
                  <RiskBadge level={result.riskLevel} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">Final Decision</span>
                  <DecisionBadge decision={result.decision} />
                </div>
              </div>

              {/* Security alert */}
              {result.securityAlert && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-danger-500/10 border border-danger-500/30 animate-fade-in">
                  <AlertCircle size={16} className="text-danger-400" />
                  <span className="text-sm text-danger-400 font-medium">Security Alert Generated</span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-1">
                <button onClick={resetForm} className="btn-secondary flex-1">
                  Evaluate Another
                </button>
                <button
                  onClick={handleExportPDF}
                  disabled={exportingPdf}
                  className="btn-primary flex items-center justify-center gap-2 flex-1"
                >
                  {exportingPdf ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <FileDown size={16} />
                  )}
                  {exportingPdf ? 'Generating...' : 'Export PDF'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Test scenarios */}
      <div className="card p-6">
        <h4 className="text-sm font-semibold text-gray-200 mb-3">Test Scenarios</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-success-500/5 border border-success-500/20">
            <p className="text-sm font-medium text-success-400 mb-1">Scenario 1: Low Risk (Expected Allow)</p>
            <p className="text-xs text-gray-400">
              Select an Active user with a trusted device, normal location, normal hours, biometric Verified, and an app from their department's segment.
            </p>
          </div>
          <div className="p-4 rounded-lg bg-danger-500/5 border border-danger-500/20">
            <p className="text-sm font-medium text-danger-400 mb-1">Scenario 2: High Risk (Expected Deny)</p>
            <p className="text-xs text-gray-400">
              Select any user, use an untrusted device, set a different location, set hour to 3 AM, biometric Failed, and access a Critical app from a different department's segment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
