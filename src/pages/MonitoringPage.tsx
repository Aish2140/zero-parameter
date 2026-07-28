import { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Ban,
  ShieldAlert,
  Clock,
  MapPin,
  Monitor,
  Zap,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { AccessLog } from '../types';
import { RiskBadge } from '../components/ui/Badges';

export function MonitoringPage() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, highRisk: 0, denied: 0, alerts: 0 });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    const { data } = await supabase
      .from('access_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    const allLogs = data || [];
    setLogs(allLogs);
    setStats({
      total: allLogs.length,
      highRisk: allLogs.filter((l) => l.risk_level === 'High').length,
      denied: allLogs.filter((l) => l.decision === 'Deny').length,
      alerts: allLogs.filter((l) => l.security_alert).length,
    });
    setLoading(false);
  }

  const recentRequests = logs.slice(0, 10);
  const highRiskRequests = logs.filter((l) => l.risk_level === 'High').slice(0, 10);
  const deniedRequests = logs.filter((l) => l.decision === 'Deny').slice(0, 10);
  const securityAlerts = logs.filter((l) => l.security_alert).slice(0, 10);

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
        <div className="w-10 h-10 rounded-lg bg-accent-500/10 border border-accent-500/20 flex items-center justify-center relative">
          <Activity size={20} className="text-accent-400" />
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-success-400 animate-pulse-glow border-2 border-base-900" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-100">Continuous Monitoring</h3>
          <p className="text-sm text-gray-500">Real-time AI-based security monitoring</p>
        </div>
      </div>

      {/* Live stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MonitorCard icon={Activity} label="Total Requests" value={stats.total} color="text-accent-400" bg="bg-accent-500/10" />
        <MonitorCard icon={ShieldAlert} label="High Risk" value={stats.highRisk} color="text-danger-400" bg="bg-danger-500/10" />
        <MonitorCard icon={Ban} label="Denied" value={stats.denied} color="text-danger-400" bg="bg-danger-500/10" />
        <MonitorCard icon={AlertTriangle} label="Security Alerts" value={stats.alerts} color="text-warning-400" bg="bg-warning-500/10" />
      </div>

      {/* Grid of monitoring panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent access requests */}
        <MonitorPanel title="Recent Access Requests" icon={Clock} logs={recentRequests} emptyText="No recent requests" />

        {/* High-risk requests */}
        <MonitorPanel title="Recent High-Risk Requests" icon={ShieldAlert} logs={highRiskRequests} emptyText="No high-risk requests" highlight />

        {/* Denied requests */}
        <MonitorPanel title="Denied Requests" icon={Ban} logs={deniedRequests} emptyText="No denied requests" highlight />

        {/* Security alerts */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-warning-500/10 flex items-center justify-center">
              <AlertTriangle size={16} className="text-warning-400" />
            </div>
            <h4 className="text-sm font-semibold text-gray-200">Security Alerts</h4>
          </div>
          {securityAlerts.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No security alerts</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {securityAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 p-3 rounded-lg bg-danger-500/5 border border-danger-500/20 hover:border-danger-500/40 transition-colors"
                >
                  <Zap size={16} className="text-danger-400 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-200 truncate">
                      <span className="font-medium">{alert.user_name || 'Unknown'}</span> attempted access to{' '}
                      <span className="font-medium">{alert.application_name}</span>
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} /> {alert.location}
                      </span>
                      <span>{new Date(alert.access_time).toLocaleString()}</span>
                    </div>
                  </div>
                  <RiskBadge level={alert.risk_level} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MonitorCard({ icon: Icon, label, value, color, bg }: {
  icon: typeof Activity;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-100">{value}</p>
        </div>
        <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center`}>
          <Icon size={20} className={color} />
        </div>
      </div>
    </div>
  );
}

function MonitorPanel({ title, icon: Icon, logs, emptyText, highlight }: {
  title: string;
  icon: typeof Activity;
  logs: AccessLog[];
  emptyText: string;
  highlight?: boolean;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${highlight ? 'bg-danger-500/10' : 'bg-accent-500/10'}`}>
          <Icon size={16} className={highlight ? 'text-danger-400' : 'text-accent-400'} />
        </div>
        <h4 className="text-sm font-semibold text-gray-200">{title}</h4>
      </div>
      {logs.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-8">{emptyText}</p>
      ) : (
        <div className="space-y-2 max-h-[300px] overflow-y-auto">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-base-850 border border-base-600/30 hover:border-base-500/50 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm text-gray-200 truncate">
                  <span className="font-medium">{log.user_name || 'Unknown'}</span> → {log.application_name}
                </p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Monitor size={11} /> {log.device_name || 'Unknown'}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin size={11} /> {log.location}
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <RiskBadge level={log.risk_level} />
                <span className="text-xs text-gray-600">{new Date(log.access_time).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
