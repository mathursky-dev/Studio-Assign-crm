import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Play, Copy, Check, AlertTriangle, RefreshCw } from 'lucide-react';
import { TestCaseResult } from '../types/database';

interface Props {
  results: TestCaseResult[];
  isRunning: boolean;
  onRunSuite: () => void;
}

export const TestReportView: React.FC<Props> = ({ results, isRunning, onRunSuite }) => {
  const [copied, setCopied] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Expected 13 test categories
  const testMap = new Map(results.map((r) => [r.id, r]));

  const testCategories: Array<{ id: string; label: string }> = [
    { id: 'supabase_connection', label: 'Supabase Connection' },
    { id: 'vercel_build', label: 'Vercel Production Build' },
    { id: 'database_read', label: 'Database Read' },
    { id: 'database_insert', label: 'Database Insert' },
    { id: 'database_update', label: 'Database Update' },
    { id: 'database_delete', label: 'Database Delete' },
    { id: 'refresh_persistence', label: 'Refresh Persistence' },
    { id: 'auth_persistence', label: 'Logout/Login Persistence' },
    { id: 'second_browser_persistence', label: 'Second Browser Persistence' },
    { id: 'basic_realtime', label: 'Basic Realtime' },
    { id: 'no_localstorage', label: 'No localStorage Persistence' },
    { id: 'no_mock_persistence', label: 'No Mock Persistence' },
    { id: 'env_variables', label: 'Environment Variables' },
  ];

  const passCount = testCategories.filter((cat) => testMap.get(cat.id)?.status === 'pass').length;
  const failCount = testCategories.filter((cat) => testMap.get(cat.id)?.status === 'fail').length;
  const totalCount = testCategories.length;

  const generateReportText = () => {
    let text = `==================================================\n`;
    text += `PHASE 1 TEST REPORT\n`;
    text += `==================================================\n\n`;

    testCategories.forEach((cat) => {
      const result = testMap.get(cat.id);
      const statusStr = result ? (result.status === 'pass' ? 'PASS' : result.status === 'fail' ? 'FAIL' : 'PENDING') : 'PENDING';
      text += `${cat.label}: ${statusStr}\n`;
    });

    const failedItems = testCategories
      .map((cat) => testMap.get(cat.id))
      .filter((res): res is TestCaseResult => Boolean(res && res.status === 'fail'));

    if (failedItems.length > 0) {
      text += `\n==================================================\n`;
      text += `FAILURES & DIAGNOSTIC DETAILS\n`;
      text += `==================================================\n\n`;

      failedItems.forEach((fail) => {
        text += `Test: ${fail.name}\n`;
        text += `Error: ${fail.error || 'Unknown error'}\n`;
        text += `Root Cause: ${fail.rootCause || 'Unspecified'}\n`;
        text += `File: ${fail.file || 'N/A'}\n`;
        text += `Function: ${fail.func || 'N/A'}\n`;
        text += `Database Table: ${fail.table || 'N/A'}\n`;
        text += `Fix Applied: ${fail.fixApplied || 'N/A'}\n`;
        text += `Retest Result: ${fail.retestResult || 'Pending re-evaluation'}\n`;
        text += `--------------------------------------------------\n`;
      });
    }

    return text;
  };

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(generateReportText());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
      <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-bold text-slate-100 uppercase tracking-wider">
              Phase 1 Test Suite &amp; Report
            </h2>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                passCount === totalCount
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : failCount > 0
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              {passCount}/{totalCount} PASS
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated compliance verification across Supabase, PostgreSQL, and Vercel build standards.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyReport}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Report</span>
              </>
            )}
          </button>

          <button
            onClick={onRunSuite}
            disabled={isRunning}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold text-white shadow transition-colors ${
              isRunning ? 'bg-blue-700 opacity-80 cursor-wait' : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running Suite...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Run Automated Tests</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid of Results */}
      <div className="divide-y divide-slate-800/80">
        {testCategories.map((cat, idx) => {
          const result = testMap.get(cat.id);
          const status = result?.status || 'idle';
          const isExpanded = expandedId === cat.id;

          return (
            <div key={cat.id} className="hover:bg-slate-850/40 transition-colors">
              <div
                onClick={() => setExpandedId(isExpanded ? null : cat.id)}
                className="px-5 py-3 flex items-center justify-between gap-4 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-xs font-mono w-5">
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <span className="text-sm font-medium text-slate-200">{cat.label}</span>
                    {result?.durationMs !== undefined && (
                      <span className="text-[11px] text-slate-500 ml-2 font-mono">
                        ({result.durationMs}ms)
                      </span>
                    )}
                    {result?.message && !isExpanded && (
                      <p className="text-xs text-slate-400 truncate max-w-md mt-0.5">
                        {result.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {status === 'pass' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      PASS
                    </span>
                  )}
                  {status === 'fail' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <XCircle className="w-3.5 h-3.5" />
                      FAIL
                    </span>
                  )}
                  {status === 'running' && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      RUNNING
                    </span>
                  )}
                  {status === 'idle' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-400">
                      <Clock className="w-3 h-3" />
                      PENDING
                    </span>
                  )}
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && result && (
                <div className="px-5 pb-4 pt-1 bg-slate-950/60 border-t border-slate-800/40 text-xs space-y-2">
                  {result.message && (
                    <div>
                      <span className="text-slate-400 font-medium">Outcome:</span>{' '}
                      <span className="text-slate-200">{result.message}</span>
                    </div>
                  )}

                  {result.status === 'fail' && (
                    <div className="space-y-1.5 p-3 rounded-lg bg-rose-950/30 border border-rose-800/50 text-rose-200">
                      <div className="flex items-center gap-1.5 text-rose-400 font-semibold">
                        <AlertTriangle className="w-4 h-4" />
                        Diagnostic Breakdown:
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono mt-1">
                        <div>
                          <strong className="text-rose-400">Error:</strong> {result.error}
                        </div>
                        <div>
                          <strong className="text-rose-400">Root Cause:</strong> {result.rootCause}
                        </div>
                        <div>
                          <strong className="text-rose-400">File:</strong> {result.file}
                        </div>
                        <div>
                          <strong className="text-rose-400">Function:</strong> {result.func}
                        </div>
                        <div>
                          <strong className="text-rose-400">Table:</strong> {result.table}
                        </div>
                        <div>
                          <strong className="text-rose-400">Fix:</strong> {result.fixApplied}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
