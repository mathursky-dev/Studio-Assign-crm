export interface Phase1TestRecord {
  id: string;
  name: string;
  status: 'active' | 'assigned' | 'converted' | 'archived';
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export type TestStatus = 'idle' | 'running' | 'pass' | 'fail';

export interface TestCaseResult {
  id: string;
  name: string;
  status: TestStatus;
  durationMs?: number;
  message?: string;
  error?: string;
  rootCause?: string;
  file?: string;
  func?: string;
  table?: string;
  fixApplied?: string;
  retestResult?: string;
  timestamp?: string;
}

export interface RealtimeEventLog {
  id: string;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE' | 'SUBSCRIBE' | 'STATUS_CHANGE' | 'ERROR';
  recordId?: string;
  timestamp: string;
  details: string;
}
