import { useEffect, useRef, useState, useCallback } from 'react';
import {
  Usb,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  Building2,
  Fingerprint,
  Wifi,
  WifiOff,
  RefreshCw,
  AlertTriangle,
  History,
  Smartphone,
  HardDrive,
  Monitor,
  UserPlus,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import type { UsbDeviceInfo, UsbLogEntry } from '../types';
import { evaluateUsbRisk, type UsbRiskEvaluation } from '../lib/riskEngine';
import { RiskBadge } from '../components/ui/Badges';
import { RiskGauge } from '../components/ui/RiskGauge';

// ── Constants ──────────────────────────────────────────────────────────────────
const USB_BRIDGE_URL = 'http://localhost:3579';
const USB_TABLE = 'usb_logs';

// ── Types ──────────────────────────────────────────────────────────────────────
interface LiveDevice {
  info: UsbDeviceInfo;
  evaluation: UsbRiskEvaluation;
  isRegistered: boolean;
  logId: string | null; // Supabase row id
  accepting?: boolean;  // loading state for accept action
}

type FilterType = 'all' | 'authorized' | 'unauthorized';

// ── Helpers ────────────────────────────────────────────────────────────────────
function deviceIcon(type: string) {
  if (type.includes('Android') || type.includes('iOS') || type.includes('Portable')) return Smartphone;
  if (type.includes('Mass Storage') || type.includes('Drive')) return HardDrive;
  return Monitor;
}

function decisionColor(decision: string) {
  if (decision === 'Authorized') return { text: 'text-success-400', bg: 'bg-success-500/10', border: 'border-success-500/30' };
  if (decision === 'Unauthorized Device') return { text: 'text-danger-400', bg: 'bg-danger-500/10', border: 'border-danger-500/30' };
  return { text: 'text-warning-400', bg: 'bg-warning-500/10', border: 'border-warning-500/30' };
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function USBMonitorPage() {
  const [bridgeOnline, setBridgeOnline] = useState(false);
  const [bridgeChecking, setBridgeChecking] = useState(true);
  const [liveDevices, setLiveDevices] = useState<LiveDevice[]>([]);
  const [logs, setLogs] = useState<UsbLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());

  const eventSourceRef = useRef<EventSource | null>(null);

  // ── Load registered device IDs from Supabase devices table ──────────────────
  const loadRegisteredDevices = useCallback(async () => {
    const { data } = await supabase.from('devices').select('device_id, device_name');
    if (data) {
      setRegisteredIds(new Set(data.map((d) => d.device_id.toUpperCase())));
    }
  }, []);

  // ── Load historical USB logs from Supabase ──────────────────────────────────
  const loadLogs = useCallback(async () => {
    setLogsLoading(true);
    const { data } = await supabase
      .from(USB_TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    setLogs((data as UsbLogEntry[]) || []);
    setLogsLoading(false);
  }, []);

  // ── Evaluate a newly connected USB device ────────────────────────────────────
  const processDevice = useCallback(
    async (info: UsbDeviceInfo): Promise<LiveDevice> => {
      // Check registration: compare device_id against known registered IDs
      const isRegistered =
        registeredIds.has(info.deviceId.toUpperCase()) ||
        registeredIds.has(info.serialNumber.toUpperCase());

      const evaluation = evaluateUsbRisk({
        isRegistered,
        deviceType: info.deviceType,
        manufacturer: info.manufacturer,
        deviceId: info.deviceId,
        serialNumber: info.serialNumber,
      });

      // Persist to Supabase
      const payload = {
        device_name: info.deviceName,
        device_type: info.deviceType,
        manufacturer: info.manufacturer || null,
        device_id: info.deviceId || null,
        serial_number: info.serialNumber || null,
        connection_time: info.connectedAt,
        status: 'Connected',
        is_registered: isRegistered,
        risk_score: evaluation.totalScore,
        risk_level: evaluation.riskLevel,
        decision: evaluation.decision,
        risk_reasons: evaluation.riskReasons,
        security_alert: evaluation.securityAlert,
      };

      const { data: inserted } = await supabase
        .from(USB_TABLE)
        .insert(payload)
        .select('id')
        .single();

      // Show toast
      if (evaluation.decision === 'Authorized') {
        toast.success(`✔ Authorized: ${info.deviceName}`, { duration: 4000 });
      } else if (evaluation.decision === 'Unauthorized Device') {
        toast.error(`⚠ UNAUTHORIZED USB: ${info.deviceName}`, { duration: 6000 });
      } else {
        toast(`⚠ Review Required: ${info.deviceName}`, { icon: '🔍', duration: 5000 });
      }

      return {
        info,
        evaluation,
        isRegistered,
        logId: inserted?.id || null,
      };
    },
    [registeredIds]
  );

  // ── Handle USB disconnect ────────────────────────────────────────────────────
  const handleDisconnect = useCallback(
    async (instanceId: string, deviceName: string) => {
      setLiveDevices((prev) => prev.filter((d) => d.info.instanceId !== instanceId));
      toast(`🔌 Disconnected: ${deviceName}`, { duration: 3000 });

      // Update status in Supabase — find the most recent Connected log for this device
      const { data: rows } = await supabase
        .from(USB_TABLE)
        .select('id')
        .eq('status', 'Connected')
        .order('created_at', { ascending: false })
        .limit(1);

      if (rows && rows.length > 0) {
        await supabase
          .from(USB_TABLE)
          .update({
            status: 'Disconnected',
            disconnection_time: new Date().toISOString(),
          })
          .eq('id', rows[0].id);
      }

      // Refresh history
      loadLogs();
    },
    [loadLogs]
  );

  // ── Connect SSE stream ───────────────────────────────────────────────────────
  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const es = new EventSource(`${USB_BRIDGE_URL}/events`);
    eventSourceRef.current = es;

    es.addEventListener('snapshot', async (e: MessageEvent) => {
      const devices: UsbDeviceInfo[] = JSON.parse(e.data);
      const processed = await Promise.all(devices.map((d) => processDevice(d)));
      setLiveDevices(processed);
      setBridgeOnline(true);
      setBridgeChecking(false);
    });

    es.addEventListener('usb-connect', async (e: MessageEvent) => {
      const device: UsbDeviceInfo = JSON.parse(e.data);
      const live = await processDevice(device);
      setLiveDevices((prev) => [live, ...prev.filter((d) => d.info.instanceId !== device.instanceId)]);
      loadLogs();
    });

    es.addEventListener('usb-disconnect', (e: MessageEvent) => {
      const { instanceId, deviceName } = JSON.parse(e.data);
      handleDisconnect(instanceId, deviceName);
    });

    es.onerror = () => {
      setBridgeOnline(false);
      setBridgeChecking(false);
      es.close();
      eventSourceRef.current = null;
      // Retry after 5s
      setTimeout(connectSSE, 5000);
    };

    es.onopen = () => {
      setBridgeOnline(true);
      setBridgeChecking(false);
    };
  }, [processDevice, handleDisconnect, loadLogs]);

  // ── Accept / Trust a device ──────────────────────────────────────────────────
  const acceptDevice = useCallback(
    async (instanceId: string) => {
      // Mark as accepting (shows spinner on button)
      setLiveDevices((prev) =>
        prev.map((d) => (d.info.instanceId === instanceId ? { ...d, accepting: true } : d))
      );

      const target = liveDevices.find((d) => d.info.instanceId === instanceId);
      if (!target) return;

      const { info } = target;

      // Map USB device type → devices table type enum
      const mapType = (t: string): string => {
        if (t.includes('Android') || t.includes('iOS') || t.includes('Portable')) return 'Mobile';
        if (t.includes('Mass Storage') || t.includes('Drive')) return 'Laptop';
        return 'Laptop';
      };

      const devicePayload = {
        device_id: info.serialNumber || info.instanceId.slice(-20),
        device_name: info.deviceName,
        device_type: mapType(info.deviceType),
        trusted: true,
        device_health: 'Good' as const,
        os_status: 'Updated' as const,
        antivirus_status: 'Active' as const,
        assigned_user_id: null,
      };

      // Upsert into devices table (safe if device_id already exists)
      const { error } = await supabase
        .from('devices')
        .upsert(devicePayload, { onConflict: 'device_id' });

      if (error) {
        toast.error('Failed to register device: ' + error.message);
        setLiveDevices((prev) =>
          prev.map((d) => (d.info.instanceId === instanceId ? { ...d, accepting: false } : d))
        );
        return;
      }

      // Add to local registered set so this session recognises it immediately
      const newId = info.serialNumber?.toUpperCase() || '';
      const newInstanceId = info.instanceId.toUpperCase();
      setRegisteredIds((prev) => {
        const next = new Set(prev);
        if (newId) next.add(newId);
        next.add(newInstanceId);
        return next;
      });

      // Re-evaluate risk — now isRegistered = true
      const newEvaluation = evaluateUsbRisk({
        isRegistered: true,
        deviceType: info.deviceType,
        manufacturer: info.manufacturer,
        deviceId: info.deviceId,
        serialNumber: info.serialNumber,
      });

      // Update the live device card in state
      setLiveDevices((prev) =>
        prev.map((d) =>
          d.info.instanceId === instanceId
            ? { ...d, isRegistered: true, evaluation: newEvaluation, accepting: false }
            : d
        )
      );

      // Update the usb_logs row to reflect the new decision
      if (target.logId) {
        await supabase
          .from(USB_TABLE)
          .update({
            is_registered: true,
            risk_score: newEvaluation.totalScore,
            risk_level: newEvaluation.riskLevel,
            decision: newEvaluation.decision,
            security_alert: newEvaluation.securityAlert,
            risk_reasons: newEvaluation.riskReasons,
          })
          .eq('id', target.logId);
      }

      toast.success(`✔ ${info.deviceName} trusted and registered!`, { duration: 4000 });
      loadLogs();
    },
    [liveDevices, loadLogs]
  );

  // ── Effects ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    loadRegisteredDevices();
    loadLogs();
  }, [loadRegisteredDevices, loadLogs]);

  useEffect(() => {
    connectSSE();
    return () => {
      eventSourceRef.current?.close();
    };
  }, [connectSSE]);

  // ── Filtered logs ────────────────────────────────────────────────────────────
  const filteredLogs = logs.filter((l) => {
    if (filter === 'authorized') return l.decision === 'Authorized';
    if (filter === 'unauthorized') return l.decision === 'Unauthorized Device' || l.security_alert;
    return true;
  });

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center">
            <Usb size={20} className="text-accent-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-100">USB Device Monitor</h3>
            <p className="text-sm text-gray-500">Real-time Zero Trust evaluation of physical USB connections</p>
          </div>
        </div>

        {/* Bridge status */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
          bridgeChecking
            ? 'bg-base-800 border-base-600/50 text-gray-400'
            : bridgeOnline
              ? 'bg-success-500/10 border-success-500/30 text-success-400'
              : 'bg-danger-500/10 border-danger-500/30 text-danger-400'
        }`}>
          {bridgeChecking ? (
            <><RefreshCw size={14} className="animate-spin" /> Connecting to bridge…</>
          ) : bridgeOnline ? (
            <><Wifi size={14} className="animate-pulse" /> USB Monitor Active</>
          ) : (
            <><WifiOff size={14} /> Bridge Offline — Start USB bridge</>
          )}
        </div>
      </div>

      {/* ── Bridge offline help ── */}
      {!bridgeChecking && !bridgeOnline && (
        <div className="card p-5 border-warning-500/30 bg-warning-500/5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-warning-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-warning-400 mb-1">USB Bridge is not running</p>
              <p className="text-xs text-gray-400 mb-3">
                The USB bridge is a local Node.js service that reads real USB device information from Windows.
                Open a new terminal in the project folder and run:
              </p>
              <div className="space-y-2">
                <code className="block px-3 py-2 bg-base-900 rounded-lg text-xs text-accent-300 font-mono">
                  cd usb-bridge &amp;&amp; npm install &amp;&amp; cd ..
                </code>
                <code className="block px-3 py-2 bg-base-900 rounded-lg text-xs text-accent-300 font-mono">
                  npm run dev:usb-bridge
                </code>
                <p className="text-xs text-gray-500">
                  Or use <code className="text-accent-400">npm run dev:full</code> to start both Vite and the USB bridge together.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Live devices panel ── */}
      <div>
        <h4 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse" />
          Currently Connected USB Devices
          <span className="ml-auto text-xs text-gray-500 font-normal">{liveDevices.length} device{liveDevices.length !== 1 ? 's' : ''}</span>
        </h4>

        <AnimatePresence>
          {liveDevices.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="card p-10 flex flex-col items-center justify-center text-center"
            >
              <Usb size={40} className="text-gray-700 mb-3" />
              <p className="text-sm text-gray-400">No USB devices currently connected</p>
              <p className="text-xs text-gray-600 mt-1">Connect a USB device to see real-time Zero Trust evaluation</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {liveDevices.map((live) => (
                <LiveDeviceCard
                  key={live.info.instanceId}
                  live={live}
                  onAccept={acceptDevice}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* ── History ── */}
      <div className="card overflow-hidden">
        {/* History header + filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-5 border-b border-base-600/50">
          <div className="flex items-center gap-2">
            <History size={16} className="text-accent-400" />
            <h4 className="text-sm font-semibold text-gray-200">USB Connection History</h4>
          </div>
          <div className="flex gap-2 sm:ml-auto">
            {(['all', 'authorized', 'unauthorized'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition-all ${
                  filter === f
                    ? 'bg-accent-500/20 text-accent-400 border border-accent-500/30'
                    : 'text-gray-500 hover:text-gray-300 hover:bg-base-700'
                }`}
              >
                {f}
              </button>
            ))}
            <button
              onClick={loadLogs}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-base-700 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-base-600/50 bg-base-850/50">
                <th className="px-4 py-3 font-medium">Device</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Manufacturer</th>
                <th className="px-4 py-3 font-medium">Connected</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Risk</th>
                <th className="px-4 py-3 font-medium">Decision</th>
              </tr>
            </thead>
            <tbody>
              {logsLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center">
                    <div className="w-6 h-6 border-2 border-accent-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    No USB events found
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const col = decisionColor(log.decision);
                  return (
                    <tr key={log.id} className="table-row-hover border-b border-base-600/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Usb size={14} className="text-gray-500 flex-shrink-0" />
                          <span className="text-gray-200 font-medium truncate max-w-[160px]">{log.device_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{log.device_type}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{log.manufacturer || '—'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {new Date(log.connection_time).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${
                          log.status === 'Connected' ? 'text-success-400' : 'text-gray-500'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${log.status === 'Connected' ? 'bg-success-400 animate-pulse' : 'bg-gray-500'}`} />
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3"><RiskBadge level={log.risk_level} /></td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${col.bg} ${col.text} ${col.border}`}>
                          {log.security_alert && <AlertTriangle size={10} />}
                          {log.decision}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Live Device Card ───────────────────────────────────────────────────────────
function LiveDeviceCard({
  live,
  onAccept,
}: {
  live: LiveDevice;
  onAccept: (instanceId: string) => void;
}) {
  const { info, evaluation, isRegistered } = live;
  const col = decisionColor(evaluation.decision);
  const DevIcon = deviceIcon(info.deviceType);

  const factorIcons = [Fingerprint, Usb, Building2, Cpu];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.97 }}
      transition={{ duration: 0.3 }}
      className={`card p-5 border ${evaluation.securityAlert ? 'border-danger-500/40' : 'border-base-600/50'} relative overflow-hidden`}
    >
      {/* Glowing bg for high risk */}
      {evaluation.securityAlert && (
        <div className="absolute inset-0 bg-danger-500/5 pointer-events-none" />
      )}

      {/* Device header */}
      <div className="flex items-start gap-3 mb-4 relative z-10">
        <div className={`w-11 h-11 rounded-xl ${col.bg} border ${col.border} flex items-center justify-center flex-shrink-0`}>
          <DevIcon size={20} className={col.text} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-100 truncate">{info.deviceName}</p>
          <p className="text-xs text-gray-500">{info.deviceType}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success-400 animate-pulse" />
            <span className="text-xs text-success-400">Connected</span>
          </div>
        </div>
        {/* Decision badge */}
        <span className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${col.bg} ${col.text} ${col.border}`}>
          {evaluation.decision === 'Authorized' ? <ShieldCheck size={11} /> : <ShieldX size={11} />}
          {evaluation.decision}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 relative z-10">
        {/* Left: gauge */}
        <div className="flex flex-col items-center justify-center">
          <RiskGauge score={evaluation.totalScore} level={evaluation.riskLevel} size={150} />
        </div>

        {/* Right: factors */}
        <div className="space-y-2">
          {evaluation.factors.map((f, i) => {
            const Icon = factorIcons[i] || Cpu;
            return (
              <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-base-900/60">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${f.passed ? 'bg-success-500/10' : 'bg-danger-500/10'}`}>
                  <Icon size={12} className={f.passed ? 'text-success-400' : 'text-danger-400'} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-300 leading-tight">{f.label}</p>
                  <p className="text-[10px] text-gray-500 truncate">{f.status}</p>
                </div>
                {f.passed
                  ? <CheckCircle2 size={12} className="text-success-400 flex-shrink-0" />
                  : <XCircle size={12} className="text-danger-400 flex-shrink-0" />
                }
              </div>
            );
          })}
        </div>
      </div>

      {/* Device metadata strip */}
      <div className="mt-4 pt-3 border-t border-base-600/40 grid grid-cols-2 gap-x-4 gap-y-1 text-xs relative z-10">
        {info.manufacturer && (
          <div className="flex items-center gap-1.5 text-gray-500">
            <Building2 size={11} />
            <span className="truncate">{info.manufacturer}</span>
          </div>
        )}
        {info.serialNumber && (
          <div className="flex items-center gap-1.5 text-gray-500">
            <Cpu size={11} />
            <span className="truncate font-mono">{info.serialNumber.slice(0, 18)}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5 text-gray-500 col-span-2">
          <Clock size={11} />
          <span>Connected {new Date(info.connectedAt).toLocaleTimeString()}</span>
          <span className="ml-auto">
            {isRegistered
              ? <span className="text-success-400">✔ Registered Device</span>
              : <span className="text-danger-400">✘ Unknown Device</span>
            }
          </span>
        </div>
      </div>

      {/* Security alert + Accept button */}
      {evaluation.securityAlert && (
        <div className="mt-3 relative z-10 space-y-2">
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-danger-500/10 border border-danger-500/30">
            <ShieldAlert size={14} className="text-danger-400 flex-shrink-0 mt-0.5" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-danger-400">Security Alert</p>
              {evaluation.riskReasons.slice(0, 2).map((r, i) => (
                <p key={i} className="text-[10px] text-danger-300/80">{r}</p>
              ))}
            </div>
          </div>

          {/* Accept button — only shown for unregistered devices */}
          {!isRegistered && (
            <button
              onClick={() => onAccept(info.instanceId)}
              disabled={live.accepting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                         bg-success-500/10 border border-success-500/30 text-success-400
                         text-sm font-semibold hover:bg-success-500/20 hover:border-success-500/50
                         transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait"
            >
              {live.accepting ? (
                <><Loader2 size={15} className="animate-spin" /> Registering…</>
              ) : (
                <><UserPlus size={15} /> Trust &amp; Accept this Device</>
              )}
            </button>
          )}
        </div>
      )}

      {/* Accept button for restricted (medium-risk) devices that aren't registered */}
      {!evaluation.securityAlert && !isRegistered && (
        <div className="mt-3 relative z-10">
          <button
            onClick={() => onAccept(info.instanceId)}
            disabled={live.accepting}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg
                       bg-warning-500/10 border border-warning-500/30 text-warning-400
                       text-sm font-medium hover:bg-warning-500/20 transition-all duration-200
                       active:scale-[0.98] disabled:opacity-60 disabled:cursor-wait"
          >
            {live.accepting ? (
              <><Loader2 size={15} className="animate-spin" /> Registering…</>
            ) : (
              <><UserPlus size={15} /> Trust &amp; Accept this Device</>
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
}
