import React, { useState } from 'react';
import { Copy, Check, Terminal, X, ExternalLink } from 'lucide-react';
import { TEST_TABLE_NAME } from '../services/databaseService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const SQL_SCHEMA_SCRIPT = `-- ==============================================================
-- PHASE 1: LEAD ASSIGNMENT CRM — FOUNDATION TEST SCHEMA
-- Execute in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================

-- 1. Create the verification test table
create table if not exists ${TEST_TABLE_NAME} (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null default 'active' check (status in ('active', 'assigned', 'converted', 'archived')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Enable Row Level Security (RLS)
alter table ${TEST_TABLE_NAME} enable row level security;

-- 3. Create permissive policy for testing (Anon & Authenticated)
drop policy if exists "Allow anon full access for phase 1 testing" on ${TEST_TABLE_NAME};
create policy "Allow anon full access for phase 1 testing"
  on ${TEST_TABLE_NAME} for all
  to anon, authenticated
  using (true)
  with check (true);

-- 4. Enable Supabase Realtime for table changes
alter publication supabase_realtime add table ${TEST_TABLE_NAME};
`;

export const SqlSchemaModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SQL_SCHEMA_SCRIPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-100">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">Supabase SQL Setup Script</h2>
              <p className="text-xs text-slate-400">Phase 1 verification table with RLS & Realtime enabled</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <div className="bg-blue-950/30 border border-blue-800/40 rounded-lg p-3 text-xs text-blue-300">
            <strong>How to run:</strong>
            <ol className="list-decimal ml-4 mt-1 space-y-1 text-slate-300">
              <li>Open your Supabase project dashboard at <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer" className="text-blue-400 underline inline-flex items-center gap-0.5">supabase.com <ExternalLink className="w-3 h-3" /></a></li>
              <li>Navigate to the <strong>SQL Editor</strong> tab on the left navigation bar.</li>
              <li>Paste this script and click <strong>Run</strong>.</li>
            </ol>
          </div>

          <div className="relative">
            <pre className="bg-slate-950 border border-slate-800 rounded-lg p-4 font-mono text-xs text-emerald-300 overflow-x-auto leading-relaxed max-h-72">
              {SQL_SCHEMA_SCRIPT}
            </pre>
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-md border border-slate-700 shadow transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy SQL</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
