import {
  Brain,
  ShieldCheck,
  Fingerprint,
  Laptop,
  MapPin,
  Clock,
  AppWindow,
  Network,
  User as UserIcon,
  ChevronRight,
  Info,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface Factor {
  icon: typeof Brain;
  label: string;
  weight: number;
  passCondition: string;
  passScore: string;
  failCondition: string;
  failScore: string;
  description: string;
  color: string;
}

const FACTORS: Factor[] = [
  {
    icon: UserIcon,
    label: 'Identity Verification',
    weight: 15,
    passCondition: 'Account is Active',
    passScore: '0 pts',
    failCondition: 'Account Suspended or Locked',
    failScore: '80 pts',
    description:
      'Verifies the user\'s account status in the directory. Suspended or locked accounts immediately flag as high-risk.',
    color: '#06b6d4',
  },
  {
    icon: Fingerprint,
    label: 'Biometric Verification',
    weight: 15,
    passCondition: 'Biometric Verified',
    passScore: '0 pts',
    failCondition: 'Biometric Failed (80) or Not Available (40)',
    failScore: '40–80 pts',
    description:
      'Simulates facial recognition or fingerprint scan. "Not Available" gives partial risk; "Failed" is treated nearly as bad as a rejected identity.',
    color: '#a855f7',
  },
  {
    icon: Laptop,
    label: 'Device Health',
    weight: 10,
    passCondition: 'Health status: Good',
    passScore: '0 pts',
    failCondition: 'Fair (30 pts) or Poor (70 pts)',
    failScore: '30–70 pts',
    description:
      'Checks the overall health of the device — OS patches, antivirus currency, and system integrity.',
    color: '#22c55e',
  },
  {
    icon: ShieldCheck,
    label: 'Device Trust',
    weight: 15,
    passCondition: 'Device is company-issued and trusted',
    passScore: '0 pts',
    failCondition: 'Untrusted or personal device',
    failScore: '60 pts',
    description:
      'Differentiates between corporate-managed devices (enrolled in MDM) and personal or unknown devices.',
    color: '#06b6d4',
  },
  {
    icon: MapPin,
    label: 'Location Analysis',
    weight: 15,
    passCondition: 'Login from registered normal location',
    passScore: '0 pts',
    failCondition: 'Login from unfamiliar location',
    failScore: '70 pts',
    description:
      'Compares the current login location against the user\'s behaviorally-established normal location. Geographic anomalies flag as high risk.',
    color: '#f97316',
  },
  {
    icon: Clock,
    label: 'Time Analysis',
    weight: 10,
    passCondition: 'Login within normal working hours',
    passScore: '0 pts',
    failCondition: 'Login outside normal working hours',
    failScore: '50 pts',
    description:
      'Checks whether the access time falls within the user\'s configured normal start/end hour. Supports overnight shifts.',
    color: '#eab308',
  },
  {
    icon: AppWindow,
    label: 'Application Sensitivity',
    weight: 10,
    passCondition: 'Low or Medium sensitivity app',
    passScore: '0–10 pts',
    failCondition: 'High (20 pts) or Critical (30 pts) app',
    failScore: '20–30 pts',
    description:
      'Adds inherent risk based on the sensitivity of the resource being accessed. Critical apps always raise the baseline risk.',
    color: '#ef4444',
  },
  {
    icon: Network,
    label: 'Microsegmentation Policy',
    weight: 10,
    passCondition: "App is in user's department-allowed segment",
    passScore: '0 pts',
    failCondition: 'App is in a restricted segment — instant Deny',
    failScore: '90 pts → Deny',
    description:
      'Enforces network microsegmentation: each department can only access applications in their allowed network segments. Violations auto-deny regardless of score.',
    color: '#ec4899',
  },
];

const DECISIONS = [
  {
    range: '0 – 29',
    level: 'Low',
    decision: 'Allow Access',
    color: 'text-success-400',
    border: 'border-success-500/30',
    bg: 'bg-success-500/5',
    icon: CheckCircle2,
  },
  {
    range: '30 – 59',
    level: 'Medium',
    decision: 'Additional Verification Required',
    color: 'text-warning-400',
    border: 'border-warning-500/30',
    bg: 'bg-warning-500/5',
    icon: AlertCircle,
  },
  {
    range: '60 – 79',
    level: 'High',
    decision: 'Restricted Access + Security Alert',
    color: 'text-danger-400',
    border: 'border-danger-500/30',
    bg: 'bg-danger-500/5',
    icon: XCircle,
  },
  {
    range: '≥ 80',
    level: 'High',
    decision: 'Deny Access + Security Alert',
    color: 'text-danger-400',
    border: 'border-danger-500/30',
    bg: 'bg-danger-500/5',
    icon: XCircle,
  },
];

export function AIModelPage() {
  const totalWeight = FACTORS.reduce((s, f) => s + f.weight, 0);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Brain size={24} className="text-accent-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-100">AI Risk Scoring Model</h3>
          <p className="text-sm text-gray-400 mt-1 max-w-2xl">
            Every access request is evaluated in real-time against 8 security factors using a
            weighted deterministic model inspired by Zero Trust principles. No request is trusted
            by default — every request must prove its legitimacy.
          </p>
        </div>
      </div>

      {/* Philosophy Banner */}
      <div className="relative overflow-hidden rounded-xl border border-accent-500/20 bg-accent-500/5 p-6">
        <div className="absolute inset-0 grid-bg opacity-30" />
        <div className="relative flex items-center gap-4">
          <ShieldCheck size={36} className="text-accent-400 flex-shrink-0" />
          <div>
            <h4 className="text-lg font-bold text-accent-400">"Never Trust, Always Verify"</h4>
            <p className="text-sm text-gray-400 mt-1">
              Unlike traditional perimeter security that grants access after a single login, Zero
              Trust continuously re-evaluates every request. Even authenticated users must prove
              trustworthiness on each access attempt based on identity, device, location, time, and
              policy.
            </p>
          </div>
        </div>
      </div>

      {/* Score Formula */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <Info size={16} className="text-accent-400" />
          <h4 className="text-sm font-semibold text-gray-200">How the Score is Calculated</h4>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-mono text-sm">
          <div className="px-4 py-3 rounded-lg bg-base-850 border border-accent-500/20 text-accent-400">
            Risk Score (0–100)
          </div>
          <span className="text-gray-500 text-lg">=</span>
          <div className="px-4 py-3 rounded-lg bg-base-850 border border-base-600/50 text-gray-300">
            Σ (Factor Score × Weight) / 100
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-4">
          Each factor produces a raw score (0–100). That score is multiplied by its weight
          percentage, divided by 100 to get the weighted contribution. All 8 weighted scores are
          summed to produce the final risk score. Total weights sum to{' '}
          <span className="text-accent-400 font-medium">{totalWeight}%</span>.
        </p>
      </div>

      {/* Factors Grid */}
      <div>
        <h4 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
          <ChevronRight size={16} className="text-accent-400" />
          The 8 Security Factors
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FACTORS.map((factor, i) => {
            const Icon = factor.icon;
            return (
              <div
                key={i}
                className="card card-hover p-5 space-y-3 animate-slide-up"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                {/* Factor header */}
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${factor.color}15`, border: `1px solid ${factor.color}30` }}
                  >
                    <Icon size={18} style={{ color: factor.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-200">{factor.label}</p>
                    <p className="text-xs text-gray-500">{factor.description.slice(0, 55)}…</p>
                  </div>
                  <div
                    className="text-xl font-bold flex-shrink-0"
                    style={{ color: factor.color }}
                  >
                    {factor.weight}%
                  </div>
                </div>

                {/* Weight bar */}
                <div className="w-full h-1.5 rounded-full bg-base-700">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${factor.weight * 6.667}%`, backgroundColor: factor.color }}
                  />
                </div>

                {/* Description */}
                <p className="text-xs text-gray-400">{factor.description}</p>

                {/* Pass / Fail */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-success-500/5 border border-success-500/20 p-2.5">
                    <p className="text-xs font-medium text-success-400 mb-0.5">✓ Pass</p>
                    <p className="text-xs text-gray-400">{factor.passCondition}</p>
                    <p className="text-xs font-mono text-success-400 mt-1">{factor.passScore}</p>
                  </div>
                  <div className="rounded-lg bg-danger-500/5 border border-danger-500/20 p-2.5">
                    <p className="text-xs font-medium text-danger-400 mb-0.5">✗ Fail</p>
                    <p className="text-xs text-gray-400">{factor.failCondition}</p>
                    <p className="text-xs font-mono text-danger-400 mt-1">{factor.failScore}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Decision Table */}
      <div className="card p-6">
        <h4 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
          <ChevronRight size={16} className="text-accent-400" />
          Decision Table — Score → Action
        </h4>
        <div className="space-y-3">
          {DECISIONS.map((d, i) => {
            const Icon = d.icon;
            return (
              <div
                key={i}
                className={`flex items-center gap-4 p-4 rounded-xl border ${d.border} ${d.bg}`}
              >
                <Icon size={20} className={d.color} />
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Score Range</p>
                    <p className={`text-sm font-bold font-mono ${d.color}`}>{d.range}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Risk Level</p>
                    <p className={`text-sm font-semibold ${d.color}`}>{d.level}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Final Decision</p>
                    <p className={`text-sm font-semibold ${d.color}`}>{d.decision}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 p-3 rounded-lg bg-danger-500/5 border border-danger-500/20">
          <p className="text-xs text-danger-400 font-medium">
            ⚠ Override Rule: Suspended accounts OR microsegmentation policy violations automatically
            result in <strong>Deny</strong> regardless of the total score.
          </p>
        </div>
      </div>

      {/* Comparison to Real ML */}
      <div className="card p-6">
        <h4 className="text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
          <ChevronRight size={16} className="text-accent-400" />
          How This Compares to Real AI/ML Systems
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-base-600/50">
                <th className="pb-3 font-medium pr-4">Aspect</th>
                <th className="pb-3 font-medium pr-4">This Model (Rule-Based)</th>
                <th className="pb-3 font-medium">Real ML System</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-600/30">
              {[
                ['Training', 'Fixed expert-defined weights', 'Learned from millions of real access events'],
                ['Adaptability', 'Static — same weights always', 'Dynamic — weights adjust as patterns change'],
                ['Explainability', '✅ Fully explainable', 'Often a "black box" (XAI needed)'],
                ['Speed', '✅ Instant (pure math)', 'Fast, but needs inference server'],
                ['Accuracy', 'Good for simulation', 'Better at catching novel attack patterns'],
                ['Biometrics', 'Simulated (button click)', 'Real hardware SDK integration'],
              ].map(([aspect, rule, ml], i) => (
                <tr key={i} className="table-row-hover">
                  <td className="py-3 text-gray-400 font-medium pr-4">{aspect}</td>
                  <td className="py-3 text-accent-400 pr-4">{rule}</td>
                  <td className="py-3 text-gray-400">{ml}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
