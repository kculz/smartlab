import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Card } from '../../components/common/FormElements.js';
import { doctorService, resultService } from '../../services/index.js';
import type { DoctorDashboardSummary, Sample, Test } from '../../types/index.js';

export type DoctorWorkspaceMode = 'full' | 'approvals' | 'reviews' | 'patients';

interface DoctorWorkspacePageProps {
  mode: DoctorWorkspaceMode;
}



const getResultStatusStyle = (status: string) => {
  switch (status) {
    case 'Pending Review':
      return { card: 'border-amber-400/30 bg-amber-400/5', badge: 'bg-amber-500/20 text-amber-200', icon: '⏳' };
    case 'Normal':
      return { card: 'border-emerald-400/20 bg-emerald-400/5', badge: 'bg-emerald-500/15 text-emerald-200', icon: '✓' };
    case 'Abnormal':
      return { card: 'border-rose-400/30 bg-rose-400/5', badge: 'bg-rose-500/15 text-rose-300', icon: '⚠' };
    case 'Rejected':
      return { card: 'border-slate-600/30 bg-slate-800/20', badge: 'bg-slate-600/30 text-slate-400', icon: '↩' };
    default:
      return { card: 'border-white/10 bg-white/5', badge: 'bg-slate-700/40 text-slate-300', icon: '·' };
  }
};

const formatElapsed = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const DoctorWorkspacePage: React.FC<DoctorWorkspacePageProps> = ({ mode }) => {
  const [dashboardSummary, setDashboardSummary] = useState<DoctorDashboardSummary | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [doctorNotes, setDoctorNotes] = useState<Record<number, string>>({});
  const [finalStatus, setFinalStatus] = useState<Record<number, string>>({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoadingDashboard(true);
    setError('');

    try {
      const response = await doctorService.getDashboard();
      setDashboardSummary(response.data);
    } catch (loadError) {
      console.error('Failed to load doctor dashboard summary:', loadError);
      if (!silent) setError('Could not load doctor dashboard data. Please refresh and try again.');
    } finally {
      if (!silent) setLoadingDashboard(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
    autoRefreshRef.current = setInterval(() => void loadDashboard(true), 30000);
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const dashboard = dashboardSummary?.summary;
  const recentResults = dashboardSummary?.recentResults || [];
  const recentPatients = dashboardSummary?.recentPatients || [];
  const pendingResults = recentResults.filter((r) => r.status === 'Pending Review');
  const reviewedResults = recentResults.filter((r) => r.status !== 'Pending Review');

  const showApprovals = mode === 'full' || mode === 'approvals';
  const showReviews = mode === 'full' || mode === 'reviews';
  const showPatients = mode === 'full' || mode === 'patients';

  const handleApprove = async (resultId: number) => {
    setProcessingId(resultId);
    setError('');
    setSuccess('');

    try {
      await resultService.approveResult(resultId, {
        final_status: finalStatus[resultId] || undefined,
        doctor_note: doctorNotes[resultId] || undefined,
      });
      setSuccess('Result approved and patient notified.');
      setExpandedId(null);
      setDoctorNotes((n) => { const m = { ...n }; delete m[resultId]; return m; });
      setFinalStatus((s) => { const m = { ...s }; delete m[resultId]; return m; });
      await loadDashboard();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not approve result. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (resultId: number) => {
    setProcessingId(resultId);
    setError('');
    setSuccess('');

    try {
      await resultService.rejectResult(resultId, doctorNotes[resultId] || undefined);
      setSuccess('Result rejected and sent back to lab for re-analysis.');
      setExpandedId(null);
      setDoctorNotes((n) => { const m = { ...n }; delete m[resultId]; return m; });
      await loadDashboard();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not reject result. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics */}
      {dashboard && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <MetricCard label="Pending approvals" value={dashboard.pendingApprovals} tone="amber" />
          <MetricCard label="Reviewed today" value={dashboard.reviewedToday} tone="emerald" />
          <MetricCard label="Critical alerts" value={dashboard.criticalAlerts} tone="rose" />
          <MetricCard label="Released today" value={dashboard.releasedToday} tone="sky" />
        </div>
      )}

      {error && (
        <Card className="border-rose-400/30 bg-rose-500/10 text-rose-100">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠</span>
            <span>{error}</span>
          </div>
        </Card>
      )}
      {success && (
        <Card className="border-emerald-400/30 bg-emerald-500/10 text-emerald-100">
          <div className="flex items-center gap-3">
            <span className="text-xl">✓</span>
            <span>{success}</span>
          </div>
        </Card>
      )}

      {/* Pending Approvals Queue */}
      {showApprovals && (
        <Card className="border-white/10 bg-slate-900/75">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-sky-300/70">Awaiting your review</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Pending approvals</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className={`section-chip ${pendingResults.length > 0 ? 'border-amber-400/30 text-amber-300' : ''}`}>
                <span className={`h-2 w-2 rounded-full ${pendingResults.length > 0 ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'}`} />
                {pendingResults.length} pending
              </span>
              <span className="section-chip">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Auto-refresh
              </span>
            </div>
          </div>

          {pendingResults.length === 0 && !loadingDashboard && (
            <div className="rounded-2xl border border-white/5 bg-emerald-400/5 py-10 text-center">
              <p className="text-3xl">✓</p>
              <p className="mt-2 font-medium text-emerald-300">All caught up</p>
              <p className="mt-1 text-sm text-slate-400">No results awaiting review right now.</p>
            </div>
          )}

          <div className="space-y-3">
            {pendingResults.map((result) => {
              const sampleTest = (result as any).SampleTest;
              const test = sampleTest?.Test as Test | undefined;
              const sample = sampleTest?.Sample as (Sample & { Patient?: any }) | undefined;
              const patient = sample?.Patient;
              const isExpanded = expandedId === result.id;
              const isProcessing = processingId === result.id;

              return (
                <div
                  key={result.id}
                  className="rounded-2xl border border-amber-400/20 bg-amber-400/5 overflow-hidden transition-all duration-300"
                >
                  {/* Header row */}
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : result.id)}
                    className="w-full flex items-center justify-between gap-4 p-4 text-left hover:bg-amber-400/5 transition-colors duration-200"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-white">{test?.name || 'Unknown test'}</p>
                        <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs text-amber-300 border border-amber-400/30">
                          ⏳ Pending Review
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-slate-300">
                        {patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown patient'}
                        {sample?.sample_id && <span className="ml-2 text-slate-500">· {sample.sample_id}</span>}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-3">
                      <div className="text-right hidden sm:block">
                        <p className="text-sm font-medium text-white">{result.value} {result.unit || ''}</p>
                        {result.reference_range && (
                          <p className="text-xs text-slate-500">ref: {result.reference_range}</p>
                        )}
                      </div>
                      <span className="text-slate-400 text-sm">{isExpanded ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {/* Expanded panel */}
                  {isExpanded && (
                    <div className="border-t border-amber-400/10 p-4 space-y-4">
                      {/* Clinical details */}
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                        <div className="rounded-xl bg-slate-900/60 p-3">
                          <p className="text-xs text-slate-500 mb-1">Result</p>
                          <p className="text-white font-semibold">{result.value} {result.unit || ''}</p>
                        </div>
                        {result.reference_range && (
                          <div className="rounded-xl bg-slate-900/60 p-3">
                            <p className="text-xs text-slate-500 mb-1">Reference range</p>
                            <p className="text-emerald-300 font-medium">{result.reference_range}</p>
                          </div>
                        )}
                        {result.interpretation && (
                          <div className="rounded-xl bg-slate-900/60 p-3">
                            <p className="text-xs text-slate-500 mb-1">Lab interpretation</p>
                            <p className={`font-medium ${
                              result.interpretation === 'Critical' || result.interpretation === 'Abnormal'
                                ? 'text-rose-300'
                                : result.interpretation === 'Borderline'
                                  ? 'text-amber-300'
                                  : 'text-emerald-300'
                            }`}>{result.interpretation}</p>
                          </div>
                        )}
                        <div className="rounded-xl bg-slate-900/60 p-3">
                          <p className="text-xs text-slate-500 mb-1">Captured</p>
                          <p className="text-slate-300">{formatElapsed(result.created_at)}</p>
                        </div>
                      </div>

                      {/* Doctor decision */}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-200/90">Your decision</label>
                          <select
                            value={finalStatus[result.id] || ''}
                            onChange={(e) => setFinalStatus((s) => ({ ...s, [result.id]: e.target.value }))}
                            className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-slate-100 transition duration-300 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                          >
                            <option value="">Auto-detect from interpretation</option>
                            <option value="Normal">Normal</option>
                            <option value="Abnormal">Abnormal</option>
                          </select>
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium text-slate-200/90">Doctor note (optional)</label>
                          <input
                            type="text"
                            value={doctorNotes[result.id] || ''}
                            onChange={(e) => setDoctorNotes((n) => ({ ...n, [result.id]: e.target.value }))}
                            placeholder="Add a clinical note..."
                            className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-slate-100 transition duration-300 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                          />
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap gap-3 pt-1">
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleApprove(result.id)}
                          className="flex items-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-400/30 px-5 py-2.5 text-sm font-medium text-emerald-300 transition-all duration-200 hover:bg-emerald-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? '...' : '✓'} Approve
                        </button>
                        <button
                          type="button"
                          disabled={isProcessing}
                          onClick={() => handleReject(result.id)}
                          className="flex items-center gap-2 rounded-full bg-rose-500/10 border border-rose-400/20 px-5 py-2.5 text-sm font-medium text-rose-300 transition-all duration-200 hover:bg-rose-500/20 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isProcessing ? '...' : '↩'} Send back to lab
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedId(null)}
                          className="rounded-full border border-white/10 px-5 py-2.5 text-sm text-slate-400 hover:text-white transition-colors duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Reviewed results history */}
      {showReviews && reviewedResults.length > 0 && (
        <Card className="border-white/10 bg-slate-900/75">
          <h3 className="mb-4 text-xl font-semibold text-white">Recent reviews</h3>
          <div className="space-y-3">
            {reviewedResults.map((result) => {
              const sampleTest = (result as any).SampleTest;
              const test = sampleTest?.Test as Test | undefined;
              const sample = sampleTest?.Sample as (Sample & { Patient?: any }) | undefined;
              const patient = sample?.Patient;
              const st = getResultStatusStyle(result.status);

              return (
                <div key={result.id} className={`rounded-2xl border p-4 ${st.card}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-white truncate">{test?.name || 'Unknown test'}</p>
                      <p className="text-sm text-slate-400 truncate">
                        {patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown patient'}
                        {sample?.sample_id && <span className="ml-2">· {sample.sample_id}</span>}
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-sm">
                        <span className="text-slate-200">{result.value} {result.unit || ''}</span>
                        {result.reference_range && (
                          <span className="text-xs text-slate-500">ref: {result.reference_range}</span>
                        )}
                      </div>
                      {result.doctor_note && (
                        <p className="mt-1 text-xs text-slate-400 italic">Note: {result.doctor_note}</p>
                      )}
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs ${st.badge}`}>
                      {st.icon} {result.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Patient context */}
      {showPatients && (
        <Card className="border-white/10 bg-slate-900/75">
          <h3 className="mb-4 text-xl font-semibold text-white">Recent patients</h3>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recentPatients.map((patient) => (
              <div key={patient.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 hover:border-sky-400/30 transition-colors duration-300">
                <p className="font-medium text-white">{patient.first_name} {patient.last_name}</p>
                <p className="text-sm text-slate-300 mt-1">{patient.phone}</p>
                <p className="text-sm text-slate-400">{patient.email}</p>
              </div>
            ))}
            {!loadingDashboard && recentPatients.length === 0 && (
              <p className="text-sm text-slate-400 col-span-full">No patient records available.</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: number; tone: 'sky' | 'emerald' | 'amber' | 'rose' }> = ({
  label, value, tone,
}) => {
  const toneClassMap = { sky: 'text-sky-300', emerald: 'text-emerald-300', amber: 'text-amber-300', rose: 'text-rose-300' };
  return (
    <Card className="border-white/10 bg-slate-900/75">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-3 text-3xl font-bold ${toneClassMap[tone]}`}>{value}</p>
    </Card>
  );
};
