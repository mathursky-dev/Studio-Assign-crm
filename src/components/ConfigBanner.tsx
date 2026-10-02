import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, KeyRound, Globe, Settings, Database, Code2 } from 'lucide-react';
import { getSupabaseConfig, setRuntimeCredentials, clearRuntimeCredentials } from '../lib/supabase';

interface Props {
  onConfigChanged: () => void;
  onOpenSqlModal: () => void;
}

export const ConfigBanner: React.FC<Props> = ({ onConfigChanged, onOpenSqlModal }) => {
  const config = getSupabaseConfig();
  const [isEditing, setIsEditing] = useState(!config.isConfigured);
  const [inputUrl, setInputUrl] = useState(config.url || '');
  const [inputKey, setInputKey] = useState(config.anonKey || '');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const res = setRuntimeCredentials(inputUrl, inputKey);
    if (!res.success) {
      setValidationError(res.error || 'Failed to update credentials');
      return;
    }

    setIsEditing(false);
    onConfigChanged();
  };

  const handleReset = () => {
    clearRuntimeCredentials();
    setInputUrl('');
    setInputKey('');
    setValidationError(null);
    setIsEditing(true);
    onConfigChanged();
  };

  const maskKey = (key: string) => {
    if (!key) return 'None';
    if (key.length <= 16) return '••••••••••••';
    return `${key.slice(0, 8)}••••••••••••${key.slice(-6)}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg mb-6">
      {/* Top Banner Status Bar */}
      <div className="px-5 py-3.5 bg-slate-950/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-100">Supabase Production Gateway</span>
              <span
                className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                  config.isConfigured
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {config.isConfigured ? 'Configured' : 'Setup Required'}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Source: {config.source === 'env' ? 'Vercel / .env' : config.source === 'runtime' ? 'Runtime Session' : 'None'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Strict Single Source of Truth • No localStorage • Public Anon Key Only
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSqlModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <Code2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>View SQL Schema</span>
          </button>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <Settings className="w-3.5 h-3.5 text-blue-400" />
            <span>{isEditing ? 'Hide Config' : 'Configure Credentials'}</span>
          </button>
        </div>
      </div>

      {/* Security alert if violation */}
      {config.securityViolation && (
        <div className="p-4 bg-rose-950/40 border-b border-rose-800/60 text-rose-300 text-sm flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold block">Security Violation Detected:</strong>
            <p className="text-xs text-rose-200/90 mt-1">{config.securityMessage}</p>
            <p className="text-xs text-rose-300/80 mt-1">
              Frontend clients must NEVER contain a <code>service_role</code> or secret key. Replace it with your public <code>anon</code> key from Supabase Dashboard &gt; Project Settings &gt; API.
            </p>
          </div>
        </div>
      )}

      {/* Credential Details or Edit Form */}
      {isEditing ? (
        <form onSubmit={handleSave} className="p-5 bg-slate-900/90 space-y-4">
          <div className="text-xs text-slate-300">
            Set or override the Supabase connection parameters. In production on Vercel, set these in <strong>Project Settings &gt; Environment Variables</strong> as <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.
          </div>

          {validationError && (
            <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Supabase Project URL (VITE_SUPABASE_URL)
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="url"
                  placeholder="https://your-project.supabase.co"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Supabase Anon/Publishable Key (VITE_SUPABASE_ANON_KEY)</span>
                <span className="text-[10px] text-amber-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> No service_role
                </span>
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-[11px] text-slate-400">
              * Frontend enforces anon public key verification only. Secret keys are blocked automatically.
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Clear
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg shadow transition-colors"
              >
                Save &amp; Connect
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="px-5 py-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Supabase Project URL</span>
            <span className="font-mono text-slate-200 text-xs truncate block" title={config.url}>
              {config.url || 'Not set'}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">API Key Status</span>
            <span className="font-mono text-emerald-400 text-xs flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>{maskKey(config.anonKey)}</span>
              <span className="text-[10px] text-slate-400">(Anon Public)</span>
            </span>
          </div>

          <div>
            <span className="text-slate-400 block text-[11px]">Environment &amp; Security</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-emerald-400 text-xs font-medium">Zero Service Role Leaks</span>
              <span className="text-slate-400 text-[11px]">|</span>
              <span className="text-slate-300 text-xs">PostgreSQL Single Source</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
