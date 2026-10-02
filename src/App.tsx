import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Database, ShieldCheck, RefreshCw, Terminal, CheckCircle2 } from 'lucide-react';
import { ConfigBanner } from './components/ConfigBanner';
import { SqlSchemaModal } from './components/SqlSchemaModal';
import { TestReportView } from './components/TestReportView';
import { LiveRecordManager } from './components/LiveRecordManager';
import { PersistenceGuide } from './components/PersistenceGuide';
import { databaseService } from './services/databaseService';
import { getSupabaseConfig } from './lib/supabase';
import { Phase1TestRecord, TestCaseResult, RealtimeEventLog } from './types/database';

export default function App() {
  const [records, setRecords] = useState<Phase1TestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const [testResults, setTestResults] = useState<TestCaseResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  
  const [realtimeStatus, setRealtimeStatus] = useState<string>('DISCONNECTED');
  const [realtimeLogs, setRealtimeLogs] = useState<RealtimeEventLog[]>([]);
  const [isSqlModalOpen, setIsSqlModalOpen] = useState(false);

  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Fetch records from Supabase
  const loadRecords = useCallback(async () => {
    const config = getSupabaseConfig();
    if (!config.isConfigured) {
      setRecords([]);
      return;
    }

    setIsLoading(true);
    setFetchError(null);

    const res = await databaseService.fetchRecords();
    setIsLoading(false);

    if (res.error) {
      setFetchError(res.error);
    } else if (res.data) {
      setRecords(res.data);
    }
  }, []);

  // Run the automated diagnostic test suite
  const runTestSuite = useCallback(async () => {
    setIsRunningTests(true);

    const results = await databaseService.runFullDiagnosticSuite((_id, result) => {
      setTestResults((prev) => {
        const index = prev.findIndex((r) => r.id === result.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = result;
          return updated;
        }
        return [...prev, result];
      });
    });

    setTestResults(results);
    setIsRunningTests(false);

    // Refresh records after running tests
    loadRecords();
  }, [loadRecords]);

  // Set up realtime subscription
  const setupRealtime = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    const config = getSupabaseConfig();
    if (!config.isConfigured) {
      setRealtimeStatus('DISCONNECTED');
      return;
    }

    const unsub = databaseService.subscribeToRealtime({
      onStatusChange: (status) => {
        setRealtimeStatus(status);
        if (status === 'SUBSCRIBED') {
          setRealtimeLogs((prev) => [
            {
              id: String(Date.now()),
              eventType: 'SUBSCRIBE',
              timestamp: new Date().toISOString(),
              details: 'Channel connected and subscribed to phase1_test_records',
            },
            ...prev.slice(0, 19),
          ]);
        }
      },
      onInsert: (newRecord) => {
        setRecords((prev) => {
          if (prev.some((r) => r.id === newRecord.id)) return prev;
          return [newRecord, ...prev];
        });
        setRealtimeLogs((prev) => [
          {
            id: String(Date.now()),
            eventType: 'INSERT',
            recordId: newRecord.id,
            timestamp: new Date().toISOString(),
            details: `Received new record: "${newRecord.name}" [${newRecord.id.slice(0, 8)}]`,
          },
          ...prev.slice(0, 19),
        ]);
      },
      onUpdate: (updatedRecord) => {
        setRecords((prev) => prev.map((r) => (r.id === updatedRecord.id ? updatedRecord : r)));
        setRealtimeLogs((prev) => [
          {
            id: String(Date.now()),
            eventType: 'UPDATE',
            recordId: updatedRecord.id,
            timestamp: new Date().toISOString(),
            details: `Updated record "${updatedRecord.name}" to status: ${updatedRecord.status}`,
          },
          ...prev.slice(0, 19),
        ]);
      },
      onDelete: (oldRecord) => {
        setRecords((prev) => prev.filter((r) => r.id !== oldRecord.id));
        setRealtimeLogs((prev) => [
          {
            id: String(Date.now()),
            eventType: 'DELETE',
            recordId: oldRecord.id,
            timestamp: new Date().toISOString(),
            details: `Deleted record ID: ${oldRecord.id.slice(0, 8)}`,
          },
          ...prev.slice(0, 19),
        ]);
      },
      onError: (err) => {
        setRealtimeLogs((prev) => [
          {
            id: String(Date.now()),
            eventType: 'ERROR',
            timestamp: new Date().toISOString(),
            details: `Channel error: ${err?.message || String(err)}`,
          },
          ...prev.slice(0, 19),
        ]);
      },
    });

    unsubscribeRef.current = unsub;
  }, []);

  // Initial load and auto-run
  useEffect(() => {
    loadRecords();
    setupRealtime();
    runTestSuite();

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [loadRecords, setupRealtime, runTestSuite]);

  const handleConfigChanged = () => {
    loadRecords();
    setupRealtime();
    runTestSuite();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-100 tracking-tight">
                  Lead Assignment CRM
                </h1>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                  PHASE 1 FOUNDATION
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Production Reliability &amp; Supabase Verification Suite
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Target: Vercel + Supabase</span>
            </div>

            <button
              onClick={() => setIsSqlModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors"
            >
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>SQL Schema</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Supabase Connection & Credentials Banner */}
        <ConfigBanner
          onConfigChanged={handleConfigChanged}
          onOpenSqlModal={() => setIsSqlModalOpen(true)}
        />

        {/* Phase 1 Automated Test Suite & Report */}
        <div className="mb-6">
          <TestReportView
            results={testResults}
            isRunning={isRunningTests}
            onRunSuite={runTestSuite}
          />
        </div>

        {/* Live Database Workbench (SELECT, INSERT, UPDATE, DELETE) */}
        <LiveRecordManager
          records={records}
          isLoading={isLoading}
          error={fetchError}
          realtimeStatus={realtimeStatus}
          realtimeLogs={realtimeLogs}
          onRefresh={loadRecords}
        />

        {/* Manual Persistence & Multi-Browser Verification Guide */}
        <PersistenceGuide />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 text-xs text-slate-500 text-center">
        Lead Assignment CRM • Phase 1 Production Foundation • Strict Supabase Single Source of Truth
      </footer>

      {/* SQL Migration Modal */}
      <SqlSchemaModal
        isOpen={isSqlModalOpen}
        onClose={() => setIsSqlModalOpen(false)}
      />
    </div>
  );
}
