import { useEffect, useState } from 'react';
import {
  Users,
  Laptop,
  AppWindow,
  Activity,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Ban,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { AccessLog } from '../types';
import { DonutChart, BarChart, LineChart } from '../components/ui/Charts';
import { RiskBadge, DecisionBadge } from '../components/ui/Badges';

interface Stats {
  totalUsers: number;
  totalDevices: number;
  totalApplications: number;
  totalRequests: number;
  lowRisk: number;
  mediumRisk: number;
  highRisk: number;
  denied: number;
}

export function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalDevices: 0,
    totalApplications: 0,
    totalRequests: 0,
    lowRisk: 0,
    mediumRisk: 0,
    highRisk: 0,
    denied: 0,
  });
  const [deptData, setDeptData] = useState<{ label: string; value: number }[]>([]);
  const [trendData, setTrendData] = useState<{ label: string; value: number }[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<AccessLog[]>([]);
  const [recentRequests, setRecentRequests] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    const [usersRes, devicesRes, appsRes, logsRes] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('devices').select('*', { count: 'exact', head: true }),
      supabase.from('applications').select('*', { count: 'exact', head: true }),
      supabase.from('access_logs').select('*').order('created_at', { ascending: false }).limit(200),
    ]);

    const logs = logsRes.data || [];
    const lowRisk = logs.filter((l) => l.risk_level === 'Low').length;
    const mediumRisk = logs.filter((l) => l.risk_level === 'Medium').length;
    const highRisk = logs.filter((l) => l.risk_level === 'High').length;
    const denied = logs.filter((l) => l.decision === 'Deny').length;

    setStats({
      totalUsers: usersRes.count || 0,
      totalDevices: devicesRes.count || 0,
      totalApplications: appsRes.count || 0,
      totalRequests: logs.length,
      lowRisk,
      mediumRisk,
      highRisk,
      denied,
    });

    // Department-wise requests
    const deptMap = new Map<string, number>();
    logs.forEach((l) => {
      if (l.department_name) {
        deptMap.set(l.department_name, (deptMap.get(l.department_name) || 0) + 1);
      }
    });
    setDeptData(
      Array.from(deptMap.entries()).map(([label, value]) => ({
        label,
        value,
        color: label === 'HR' ? '#06b6d4' : label === 'Finance' ? '#22c55e' : label === 'Engineering' ? '#eab308' : '#ef4444',
      }))
    );

    // Trend data (last 7 entries grouped by time)
    const trendMap = new Map<string, number>();
    logs
      .slice()
      .reverse()
      .forEach((l) => {
        const d = new Date(l.access_time);
        const label = `${d.getMonth() + 1}/${d.getDate()}`;
        trendMap.set(label, (trendMap.get(label) || 0) + 1);
      });
    const trendArr = Array.from(trendMap.entries()).map(([label, value]) => ({ label, value }));
    setTrendData(trendArr.slice(-7));

    // Recent alerts
    setRecentAlerts(logs.filter((l) => l.security_alert).slice(0, 6));
    setRecentRequests(logs.slice(0, 8));

    setLoading(false);
  }

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-accent-400', bg: 'bg-accent-500/10' },
    { label: 'Total Devices', value: stats.totalDevices, icon: Laptop, color: 'text-accent-400', bg: 'bg-accent-500/10' },
    { label: 'Applications', value: stats.totalApplications, icon: AppWindow, color: 'text-accent-400', bg: 'bg-accent-500/10' },
    { label: 'Access Requests', value: stats.totalRequests, icon: Activity, color: 'text-accent-400', bg: 'bg-accent-500/10' },
    { label: 'Low Risk', value: stats.lowRisk, icon: ShieldCheck, color: 'text-success-400', bg: 'bg-success-500/10' },
    { label: 'Medium Risk', value: stats.mediumRisk, icon: ShieldAlert, color: 'text-warning-400', bg: 'bg-warning-500/10' },
    { label: 'High Risk', value: stats.highRisk, icon: ShieldX, color: 'text-danger-400', bg: 'bg-danger-500/10' },
    { label: 'Denied Requests', value: stats.denied, icon: Ban, color: 'text-danger-400', bg: 'bg-danger-500/10' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="stat-card" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-100">{card.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${card.bg} flex items-center justify-center`}>
                  <Icon size={20} className={card.color} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk distribution */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-200 mb-4">Risk Distribution</h3>
          <div className="flex justify-center py-4">
            <DonutChart
              data={[
                { label: 'Low Risk', value: stats.lowRisk, color: '#22c55e' },
                { label: 'Medium Risk', value: stats.mediumRisk, color: '#eab308' },
                { label: 'High Risk', value: stats.highRisk, color: '#ef4444' },
              ]}
              centerLabel="Total"
              centerValue={stats.totalRequests}
            />
          </div>
        </div>

        {/* Department-wise */}
        <div className="card p-6">
          <h3 className="text-sm font-semibold text-gray-200 mb-4">Department-wise Access Requests</h3>
          {deptData.length > 0 ? (
            <BarChart data={deptData} height={220} />
          ) : (
            <p className="text-gray-500 text-sm text-center py-12">No data available</p>
          )}
        </div>
      </div>

      {/* Trend + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-accent-400" />
            <h3 className="text-sm font-semibold text-gray-200">Access Request Trends</h3>
          </div>
          {trendData.length > 0 ? (
            <LineChart data={trendData} height={200} />
          ) : (
            <p className="text-gray-500 text-sm text-center py-12">No trend data</p>
          )}
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={16} className="text-danger-400" />
            <h3 className="text-sm font-semibold text-gray-200">Recent Suspicious Activities</h3>
          </div>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {recentAlerts.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-8">No suspicious activities detected</p>
            ) : (
              recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-base-850 border border-base-600/30 hover:border-danger-500/30 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-danger-400 animate-pulse-glow flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-200 truncate">
                      {alert.user_name} → {alert.application_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {alert.location} · {new Date(alert.access_time).toLocaleString()}
                    </p>
                  </div>
                  <RiskBadge level={alert.risk_level} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent requests table */}
      <div className="card p-6">
        <h3 className="text-sm font-semibold text-gray-200 mb-4">Recent Access Requests</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-base-600/50">
                <th className="pb-3 font-medium">User</th>
                <th className="pb-3 font-medium">Application</th>
                <th className="pb-3 font-medium">Location</th>
                <th className="pb-3 font-medium">Time</th>
                <th className="pb-3 font-medium">Risk</th>
                <th className="pb-3 font-medium">Decision</th>
              </tr>
            </thead>
            <tbody>
              {recentRequests.length === 0 && <tr><td colSpan={6} className="text-center text-gray-500 py-4">No recent requests</td></tr>}
              {recentRequests.map((log) => (
                <tr key={log.id} className="table-row-hover border-b border-base-600/30">
                  <td className="py-3 text-gray-200">{log.user_name || 'Unknown'}</td>
                  <td className="py-3 text-gray-400">{log.application_name || 'N/A'}</td>
                  <td className="py-3 text-gray-400">{log.location}</td>
                  <td className="py-3 text-gray-400">{new Date(log.access_time).toLocaleString()}</td>
                  <td className="py-3"><RiskBadge level={log.risk_level} /></td>
                  <td className="py-3"><DecisionBadge decision={log.decision} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
