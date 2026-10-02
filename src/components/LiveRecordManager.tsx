import React, { useState } from 'react';
import { Plus, Trash2, Edit3, RefreshCw, Radio, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import { Phase1TestRecord, RealtimeEventLog } from '../types/database';
import { databaseService } from '../services/databaseService';

interface Props {
  records: Phase1TestRecord[];
  isLoading: boolean;
  error: string | null;
  realtimeStatus: string;
  realtimeLogs: RealtimeEventLog[];
  onRefresh: () => void;
}

export const LiveRecordManager: React.FC<Props> = ({
  records,
  isLoading,
  error,
  realtimeStatus,
  realtimeLogs,
  onRefresh,
}) => {
  const [newRecordName, setNewRecordName] = useState('');
  const [newRecordStatus, setNewRecordStatus] = useState<Phase1TestRecord['status']>('active');
  const [newRecordNotes, setNewRecordNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [operatingId, setOperatingId] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecordName.trim()) return;

    setIsSubmitting(true);
    setActionError(null);
    setActionSuccess(null);

    // Call Supabase service directly — NO optimistic fake state!
    const res = await databaseService.insertRecord({
      name: newRecordName.trim(),
      status: newRecordStatus,
      notes: newRecordNotes.trim() || undefined,
    });

    setIsSubmitting(false);

    if (res.error) {
      setActionError(`PostgreSQL INSERT Rejected: ${res.error}`);
    } else {
      setActionSuccess(`Record saved to Supabase PostgreSQL (${res.durationMs}ms)`);
      setNewRecordName('');
      setNewRecordNotes('');
      // Trigger a clean reload from the single source of truth
      onRefresh();
      setTimeout(() => setActionSuccess(null), 3000);
    }
  };

  const handleStatusToggle = async (record: Phase1TestRecord) => {
    const nextStatusMap: Record<Phase1TestRecord['status'], Phase1TestRecord['status']> = {
      active: 'assigned',
      assigned: 'converted',
      converted: 'archived',
      archived: 'active',
    };

    const nextStatus = nextStatusMap[record.status];
    setOperatingId(record.id);
    setActionError(null);

    // Call Supabase service directly — NO optimistic fake state!
    const res = await databaseService.updateRecord(record.id, { status: nextStatus });
    setOperatingId(null);

    if (res.error) {
      setActionError(`PostgreSQL UPDATE Rejected: ${res.error}`);
    } else {
      setActionSuccess(`Record updated in Supabase (${res.durationMs}ms)`);
      onRefresh();
      setTimeout(() => setActionSuccess(null), 2500);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Permanently delete this record from Supabase PostgreSQL?')) return;

    setOperatingId(id);
    setActionError(null);

    // Call Supabase service directly — NO optimistic fake state!
    const res = await databaseService.deleteRecord(id);
    setOperatingId(null);

    if (!res.success) {
      setActionError(`PostgreSQL DELETE Rejected: ${res.error}`);
    } else {
      setActionSuccess(`Record permanently deleted from Supabase (${res.durationMs}ms)`);
      onRefresh();
      setTimeout(() => setActionSuccess(null), 2500);
    }
  };

  const statusBadge = (status: Phase1TestRecord['status']) => {
    const styles: Record<Phase1TestRecord['status'], string> = {
      active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      assigned: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
      converted: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
      archived: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    };

    return (
      <span className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-full border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg mb-6">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-950">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-100">Live PostgreSQL Workbench (CRUD)</h2>
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border bg-slate-800/80 border-slate-700">
              <Radio
                className={`w-3 h-3 ${
                  realtimeStatus === 'SUBSCRIBED'
                    ? 'text-emerald-400 animate-pulse'
                    : realtimeStatus === 'CONNECTING'
                    ? 'text-amber-400 animate-spin'
                    : 'text-slate-500'
                }`}
              />
              <span className="text-slate-300 font-mono text-[11px]">
                Realtime: {realtimeStatus}
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Direct PostgREST queries with strict server-side confirmation. Zero optimistic deception.
          </p>
        </div>

        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          <span>Refresh SELECT</span>
        </button>
      </div>

      {/* Action Banners */}
      {actionError && (
        <div className="p-3 bg-rose-950/40 border-b border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3 bg-emerald-950/40 border-b border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-amber-950/30 border-b border-amber-800/50 text-xs text-amber-200 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Database Query Notice:</strong>
            <p className="text-amber-300/80 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Insert Record Form */}
      <form onSubmit={handleCreate} className="p-5 border-b border-slate-800 bg-slate-900/60">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
          Create Test Record (INSERT)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5">
            <input
              type="text"
              placeholder="Record Name (e.g. Lead Alpha Probe)"
              value={newRecordName}
              onChange={(e) => setNewRecordName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              required
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={newRecordStatus}
              onChange={(e) => setNewRecordStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="active">Status: Active</option>
              <option value="assigned">Status: Assigned</option>
              <option value="converted">Status: Converted</option>
              <option value="archived">Status: Archived</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <input
              type="text"
              placeholder="Notes (optional)"
              value={newRecordNotes}
              onChange={(e) => setNewRecordNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="sm:col-span-1">
            <button
              type="submit"
              disabled={isSubmitting || !newRecordName.trim()}
              className="w-full h-full min-h-[34px] flex items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg transition-colors text-xs font-medium"
              title="Insert into Supabase"
            >
              {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </form>

      {/* Table of Records */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="px-5 py-3">UUID (Primary Key)</th>
              <th className="px-5 py-3">Record Name</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Notes</th>
              <th className="px-5 py-3">Created / Updated</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {records.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
                      <span>Querying Supabase PostgreSQL...</span>
                    </div>
                  ) : (
                    <span>No test records found in PostgreSQL. Insert a record above or run the automated suite.</span>
                  )}
                </td>
              </tr>
            ) : (
              records.map((r) => (
                <tr key={r.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="px-5 py-3 font-mono text-[11px] text-slate-400">
                    <span title={r.id}>{r.id.slice(0, 8)}…{r.id.slice(-4)}</span>
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-100">
                    {r.name}
                  </td>
                  <td className="px-5 py-3">
                    {statusBadge(r.status)}
                  </td>
                  <td className="px-5 py-3 text-slate-400 italic">
                    {r.notes || '—'}
                  </td>
                  <td className="px-5 py-3 text-slate-400 text-[11px] font-mono">
                    {new Date(r.created_at).toLocaleTimeString()}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => handleStatusToggle(r)}
                        disabled={operatingId === r.id}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors text-[11px] flex items-center gap-1"
                        title="Rotate Status (UPDATE)"
                      >
                        <Edit3 className="w-3 h-3 text-blue-400" />
                        <span>Advance</span>
                      </button>
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={operatingId === r.id}
                        className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors"
                        title="Delete (DELETE)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Realtime Event Stream Footer */}
      {realtimeLogs.length > 0 && (
        <div className="p-3 bg-slate-950 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-1.5">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              Realtime WebSocket Event Log
            </span>
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto font-mono text-[10px]">
            {realtimeLogs.slice(0, 5).map((log) => (
              <div key={log.id} className="text-slate-400 flex items-center gap-2">
                <Clock className="w-2.5 h-2.5 text-slate-500" />
                <span className="text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span
                  className={`px-1 rounded text-[9px] font-bold ${
                    log.eventType === 'INSERT'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : log.eventType === 'UPDATE'
                      ? 'bg-blue-500/20 text-blue-400'
                      : log.eventType === 'DELETE'
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {log.eventType}
                </span>
                <span className="text-slate-300 truncate">{log.details}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
