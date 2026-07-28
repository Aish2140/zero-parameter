import { useEffect, useState } from 'react';
import { Search, ScrollText, Filter, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { AccessLog, RiskLevel, Decision } from '../types';
import { RiskBadge, DecisionBadge } from '../components/ui/Badges';

export function AccessLogsPage() {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<'all' | RiskLevel>('all');
  const [decisionFilter, setDecisionFilter] = useState<'all' | Decision>('all');
  const [deptFilter, setDeptFilter] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data } = await supabase
      .from('access_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    setLogs(data || []);
    setLoading(false);
  }

  const departments = [...new Set(logs.map((l) => l.department_name).filter(Boolean))] as string[];

  const filtered = logs.filter((log) => {
    const matchSearch =
      !search ||
      log.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.application_name?.toLowerCase().includes(search.toLowerCase()) ||
      log.location.toLowerCase().includes(search.toLowerCase()) ||
      log.device_name?.toLowerCase().includes(search.toLowerCase());

    const matchRisk = riskFilter === 'all' || log.risk_level === riskFilter;
    const matchDecision = decisionFilter === 'all' || log.decision === decisionFilter;
    const matchDept = deptFilter === 'all' || log.department_name === deptFilter;

    return matchSearch && matchRisk && matchDecision && matchDept;
  });

  function exportCSV() {
    const headers = ['User', 'Department', 'Device', 'Location', 'Access Time', 'Application', 'Risk Score', 'Risk Level', 'Decision', 'Security Alert'];
    const rows = filtered.map((l) => [
      l.user_name || '',
      l.department_name || '',
      l.device_name || '',
      l.location,
      new Date(l.access_time).toISOString(),
      l.application_name || '',
      l.risk_score,
      l.risk_level,
      l.decision,
      l.security_alert ? 'Yes' : 'No',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'access_logs.csv';
    a.click();
    URL.revokeObjectURL(url);
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
          <ScrollText size={20} className="text-accent-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-100">Access Logs</h3>
          <p className="text-sm text-gray-500">{logs.length} total access records</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search by user, app, location, device..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value as 'all' | RiskLevel)}
              className="input min-w-[130px]"
            >
              <option value="all">All Risk Levels</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
            </select>
            <select
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value as 'all' | Decision)}
              className="input min-w-[160px]"
            >
              <option value="all">All Decisions</option>
              <option value="Allow">Allow</option>
              <option value="Additional Verification Required">Additional Verification</option>
              <option value="Restricted Access">Restricted Access</option>
              <option value="Deny">Deny</option>
            </select>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="input min-w-[130px]"
            >
              <option value="all">All Departments</option>
              {departments.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 whitespace-nowrap">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
          <Filter size={12} />
          Showing {filtered.length} of {logs.length} records
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-base-600/50 bg-base-850/50">
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Device</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Access Time</th>
                <th className="px-4 py-3 font-medium">Application</th>
                <th className="px-4 py-3 font-medium">Risk Score</th>
                <th className="px-4 py-3 font-medium">Risk Level</th>
                <th className="px-4 py-3 font-medium">Decision</th>
                <th className="px-4 py-3 font-medium">Alert</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="text-center text-gray-500 py-8">No matching records found</td></tr>
              )}
              {filtered.slice(0, 100).map((log) => (
                <tr key={log.id} className="table-row-hover border-b border-base-600/30">
                  <td className="px-4 py-3 text-gray-200 font-medium">{log.user_name || 'Unknown'}</td>
                  <td className="px-4 py-3 text-gray-400">{log.department_name || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-400">{log.device_name || 'N/A'}</td>
                  <td className="px-4 py-3 text-gray-400">{log.location}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{new Date(log.access_time).toLocaleString()}</td>
                  <td className="px-4 py-3 text-gray-400">{log.application_name || 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${log.risk_score >= 60 ? 'text-danger-400' : log.risk_score >= 30 ? 'text-warning-400' : 'text-success-400'}`}>
                      {log.risk_score}
                    </span>
                  </td>
                  <td className="px-4 py-3"><RiskBadge level={log.risk_level} /></td>
                  <td className="px-4 py-3"><DecisionBadge decision={log.decision} /></td>
                  <td className="px-4 py-3">
                    {log.security_alert ? (
                      <span className="w-2 h-2 rounded-full bg-danger-400 inline-block animate-pulse-glow" />
                    ) : (
                      <span className="text-gray-700">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 100 && (
          <div className="p-3 text-center text-xs text-gray-500 border-t border-base-600/30">
            Showing first 100 of {filtered.length} filtered results. Refine your search to see more.
          </div>
        )}
      </div>
    </div>
  );
}
