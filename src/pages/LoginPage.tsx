import { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  User,
  Eye,
  EyeOff,
  Fingerprint,
  ArrowRight,
  CheckSquare,
  Square,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import type { UserRole } from '../types';
import { motion } from 'framer-motion';

export function LoginPage() {
  const { login } = useAuth();
  const [role, setRole] = useState<UserRole>('Admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotClicked, setForgotClicked] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setForgotClicked(false);
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      const name = email
        .split('@')[0]
        .replace(/[._]/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase());
      login(role, email, name);
      setLoading(false);
    }, 800);
  };

  const fillDemo = (demoRole: UserRole) => {
    setRole(demoRole);
    setForgotClicked(false);
    setEmail(demoRole === 'Admin' ? 'admin@company.com' : 'employee@company.com');
    setPassword(demoRole === 'Admin' ? 'admin123' : 'employee123');
  };

  const handleForgotPassword = () => {
    setForgotClicked(true);
    setTimeout(() => setForgotClicked(false), 4000);
  };

  const ROLE_PERMS: Record<UserRole, { items: string[]; color: string; borderActive: string; bgActive: string; icon: typeof Lock }> = {
    Admin: {
      items: ['All 9 pages', 'User & Device CRUD', 'AI Risk Model'],
      color: 'text-accent-400',
      borderActive: 'border-accent-500/60',
      bgActive: 'bg-accent-500/10',
      icon: Lock,
    },
    Employee: {
      items: ['Dashboard', 'Access Evaluation', 'Logs & Monitoring'],
      color: 'text-success-400',
      borderActive: 'border-success-500/50',
      bgActive: 'bg-success-500/10',
      icon: User,
    },
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-base-900">
      
      {/* ── LAYER 1 (z-0): Background Video ───────────────── */}
      <video
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ zIndex: 0 }}
        src="/bg-video.mp4"
        autoPlay
        muted
        loop
        playsInline
      />

      {/* ── LAYER 2 (z-10): Dark overlay for extreme contrast and readability */}
      <div
        className="absolute inset-0"
        style={{
          zIndex: 10,
          background: 'linear-gradient(135deg, rgba(7, 10, 15, 0.82) 0%, rgba(7, 10, 15, 0.65) 50%, rgba(7, 10, 15, 0.82) 100%)',
        }}
      />

      {/* ── LAYER 2b (z-10): Cyberpunk Grid overlay ────────── */}
      <div
        className="absolute inset-0 pointer-events-none grid-bg"
        style={{ zIndex: 10 }}
      />
      
      {/* ── LAYER 2c (z-10): Floating Orbs ───────────── */}
      <div className="bg-orbs" style={{ zIndex: 10 }}>
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>

      {/* ── LAYER 3 (z-20): Frosted Glass Card ────────────── */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md px-4" 
        style={{ position: 'relative', zIndex: 20 }}
      >
        
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-16 h-16 rounded-2xl flex items-center justify-center mb-3"
            style={{ 
              background: 'rgba(6, 182, 212, 0.12)', 
              border: '1px solid rgba(6, 182, 212, 0.3)', 
              backdropFilter: 'blur(10px)',
              boxShadow: '0 8px 32px 0 rgba(6, 182, 212, 0.2)'
            }}
          >
            <ShieldAlert className="text-accent-400" size={32} />
            <div className="absolute inset-0 rounded-2xl border border-accent-500/20 animate-pulse-glow" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight" style={{ textShadow: '0 4px 16px rgba(0,0,0,0.6)' }}>ZeroTrust Engine</h1>
          <p className="text-sm text-gray-300 mt-1 font-medium tracking-wide">AI-Driven Microsegmentation Platform</p>
        </div>

        {/* Premium Glassmorphic Card Container */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(10, 15, 24, 0.65)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), inset 0 1px 1px 0 rgba(255, 255, 255, 0.15)',
          }}
        >
          {/* Role selector heading */}
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Select Your Role
          </p>

          {/* Role toggle cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {(['Admin', 'Employee'] as UserRole[]).map((r) => {
              const cfg = ROLE_PERMS[r];
              const Icon = cfg.icon;
              const isSelected = role === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  aria-pressed={isSelected}
                  className={`relative flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-left cursor-pointer select-none focus:outline-none ${
                    isSelected
                      ? `${cfg.bgActive} ${cfg.borderActive} shadow-lg`
                      : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                  }`}
                  style={{ background: isSelected ? undefined : 'rgba(255,255,255,0.02)' }}
                >
                  {isSelected && (
                    <span className={`absolute top-2 right-2 ${cfg.color}`}>
                      <CheckCircle2 size={14} />
                    </span>
                  )}
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isSelected ? cfg.bgActive : 'bg-white/5'}`}>
                    <Icon size={17} className={isSelected ? cfg.color : 'text-gray-400'} />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${isSelected ? cfg.color : 'text-gray-300'}`}>{r}</p>
                    <p className={`text-[10px] leading-tight mt-0.5 ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                      {r === 'Admin' ? 'Full system access' : 'Limited access'}
                    </p>
                  </div>
                  <ul className="space-y-1 mt-0.5">
                    {cfg.items.map((item) => (
                      <li key={item} className={`text-[10px] flex items-center gap-1.5 ${isSelected ? cfg.color + '/85' : 'text-gray-400'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isSelected ? 'bg-current' : 'bg-gray-500'}`} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </button>
              );
            })}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="login-email" className="label">Email Address</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="input pl-10"
                  style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.1)' }}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="text-sm font-medium text-gray-400">Password</label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-accent-400/80 hover:text-accent-400 transition-colors duration-150 flex items-center gap-1"
                >
                  <HelpCircle size={11} />
                  Forgot password?
                </button>
              </div>
              {forgotClicked && (
                <div className="mb-2 text-xs text-warning-400 bg-warning-500/10 border border-warning-500/20 rounded-lg px-3 py-2 animate-fade-in">
                  💡 Simulated app — use any email + password, or click a demo button below.
                </div>
              )}
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input pl-10 pr-11"
                  style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.1)' }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-200 transition-colors p-0.5 rounded"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setRememberMe(!rememberMe)}
                className="flex items-center gap-2 group"
              >
                {rememberMe
                  ? <CheckSquare size={16} className="text-accent-400" />
                  : <Square size={16} className="text-gray-500 group-hover:text-gray-300 transition-colors" />
                }
                <span className="text-xs text-gray-400 group-hover:text-gray-200 transition-colors select-none">
                  Remember me
                </span>
              </button>
              <span className="text-[10px] text-gray-500 italic">
                {rememberMe ? 'Session will persist' : 'Session ends on close'}
              </span>
            </div>

            {/* Error */}
            {error && (
              <div className="text-sm text-danger-400 bg-danger-500/10 border border-danger-500/20 rounded-lg px-3 py-2 animate-fade-in flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-danger-400 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 mt-1">
              {loading ? (
                <><Fingerprint size={18} className="animate-pulse" />Authenticating...</>
              ) : (
                <>Sign In Securely<ArrowRight size={18} /></>
              )}
            </button>
          </form>

          {/* Demo buttons */}
          <div className="mt-6 pt-5 border-t border-white/10">
            <p className="text-xs text-gray-500 mb-3 text-center flex items-center justify-center gap-1.5">
              <span className="flex-1 h-px bg-white/10" />
              ⚡ Quick Demo Login
              <span className="flex-1 h-px bg-white/10" />
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => fillDemo('Admin')}
                className="group flex flex-col items-center gap-1 px-3 py-3 rounded-xl border border-accent-500/30 bg-accent-500/5 hover:bg-accent-500/15 hover:border-accent-500/50 transition-all duration-200"
              >
                <Lock size={13} className="text-accent-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-accent-400">Admin Demo</span>
                <span className="text-[10px] text-gray-400 font-mono">admin@company.com</span>
              </button>
              <button
                type="button"
                onClick={() => fillDemo('Employee')}
                className="group flex flex-col items-center gap-1 px-3 py-3 rounded-xl border border-success-500/30 bg-success-500/5 hover:bg-success-500/15 hover:border-success-500/50 transition-all duration-200"
              >
                <User size={13} className="text-success-400 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold text-success-400">Employee Demo</span>
                <span className="text-[10px] text-gray-400 font-mono">employee@company.com</span>
              </button>
            </div>
            <p className="text-[10px] text-gray-500 text-center mt-3">
              Authentication is simulated — any email + password combination works
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-5 flex items-center justify-center gap-1.5">
          <ShieldAlert size={11} className="text-gray-600" />
          Zero Trust Architecture — Never Trust, Always Verify
        </p>
      </motion.div>
    </div>
  );
}
