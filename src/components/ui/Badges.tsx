import type { RiskLevel, Decision, AccountStatus } from '../../types';

export function RiskBadge({ level }: { level: RiskLevel }) {
  const cls = level === 'Low' ? 'badge-low' : level === 'Medium' ? 'badge-medium' : 'badge-high';
  const dot = level === 'Low' ? 'bg-success-400' : level === 'Medium' ? 'bg-warning-400' : 'bg-danger-400';
  return (
    <span className={`badge ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {level} Risk
    </span>
  );
}

export function DecisionBadge({ decision }: { decision: Decision }) {
  let cls = 'badge-low';
  if (decision === 'Deny') cls = 'badge-high';
  else if (decision === 'Restricted Access') cls = 'badge-high';
  else if (decision === 'Additional Verification Required') cls = 'badge-medium';
  return <span className={`badge ${cls}`}>{decision}</span>;
}

export function StatusBadge({ status }: { status: AccountStatus }) {
  const cls =
    status === 'Active' ? 'badge-active' : status === 'Suspended' ? 'badge-suspended' : 'badge-locked';
  return <span className={`badge ${cls}`}>{status}</span>;
}

export function TrustBadge({ trusted }: { trusted: boolean }) {
  return (
    <span className={`badge ${trusted ? 'badge-trusted' : 'badge-untrusted'}`}>
      {trusted ? 'Trusted' : 'Untrusted'}
    </span>
  );
}

export function SensitivityBadge({ level }: { level: string }) {
  const cls =
    level === 'Critical'
      ? 'badge-high'
      : level === 'High'
        ? 'badge-high'
        : level === 'Medium'
          ? 'badge-medium'
          : 'badge-low';
  return <span className={`badge ${cls}`}>{level}</span>;
}
