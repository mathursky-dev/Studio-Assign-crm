import React, { useState } from 'react';
import { RefreshCw, Laptop2, Sparkles, Check, Copy, ExternalLink, ShieldCheck, Database } from 'lucide-react';

export const PersistenceGuide: React.FC = () => {
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg mb-6 text-slate-200">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
          <Database className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-semibold text-slate-100">
          Manual Persistence &amp; Realtime Dual-Browser Verification
        </h3>
      </div>
      <p className="text-xs text-slate-400 mb-4">
        Follow these steps to physically verify persistence across independent browser sessions and multi-user realtime sync:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {/* Step 1: Refresh Browser */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-semibold mb-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px]">
                1
              </span>
              <span>Refresh Browser Test</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Create a test record in the workbench, then reload the page. The record must load directly from Supabase PostgreSQL.
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="mt-3 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md border border-slate-700 transition-colors"
          >
            <RefreshCw className="w-3 h-3 text-blue-400" />
            <span>Reload Browser Page</span>
          </button>
        </div>

        {/* Step 2: Incognito / 2nd Device */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-purple-400 font-semibold mb-1.5">
              <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px]">
                2
              </span>
              <span>Incognito / 2nd Browser</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Open an Incognito window or second device. Because Supabase is the single source of truth, records persist without localStorage.
            </p>
          </div>
          <button
            onClick={handleCopyUrl}
            className="mt-3 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-md border border-slate-700 transition-colors"
          >
            {copiedUrl ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">URL Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy App URL</span>
              </>
            )}
          </button>
        </div>

        {/* Step 3: Realtime Browser A & B */}
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]">
                3
              </span>
              <span>Realtime Dual Tab Sync</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Open two tabs side-by-side. Click <strong>Advance</strong> or <strong>Insert</strong> in Tab A; Tab B updates live without refreshing.
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800 font-mono">
            <span className="text-emerald-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Active Channel
            </span>
            <span>postgres_changes</span>
          </div>
        </div>
      </div>
    </div>
  );
};
