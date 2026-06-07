import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Input } from '../../components/common/FormElements.js';
import { labService, resultService, sampleService, testService } from '../../services/index.js';
import type { LabDashboardSummary, Sample, Test } from '../../types/index.js';

export type LabWorkspaceMode = 'full' | 'queue' | 'results' | 'samples';

interface LabWorkspacePageProps {
  mode: LabWorkspaceMode;
}

type SampleTestOption = {
  id: number;
  sampleLabel: string;
  testLabel: string;
  patientLabel: string;
  priority: string;
  referenceRange: string | null;
  unit: string | null;
};

const sampleStatusOptions = ['Pending', 'In Progress', 'Completed', 'Reported', 'Released'];
const sampleStageOptions = ['Reception', 'Lab', 'Doctor Review', 'Pharmacy', 'Completed'];
const interpretationOptions = ['Normal', 'Abnormal', 'Borderline', 'Critical', 'Inconclusive'];
const PRIORITY_ORDER: Record<string, number> = { STAT: 0, Urgent: 1, Routine: 2 };

const formatElapsed = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ${mins % 60}m ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const getPriorityStyle = (priority?: string) => {
  switch (priority) {
    case 'STAT':
      return { badge: 'bg-rose-500/20 text-rose-300 border border-rose-500/30', dot: 'bg-rose-400' };
    case 'Urgent':
      return { badge: 'bg-amber-500/20 text-amber-300 border border-amber-500/30', dot: 'bg-amber-400' };
    default:
      return { badge: 'bg-slate-700/40 text-slate-300 border border-slate-600/30', dot: 'bg-slate-400' };
  }
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'In Progress':
      return 'bg-sky-500/15 text-sky-200';
    case 'Completed':
    case 'Released':
    case 'Reported':
      return 'bg-emerald-500/15 text-emerald-200';
    case 'Pending':
      return 'bg-slate-700/40 text-slate-300';
    default:
      return 'bg-slate-700/40 text-slate-300';
  }
};

export const LabWorkspacePage: React.FC<LabWorkspacePageProps> = ({ mode }) => {
  const [dashboardSummary, setDashboardSummary] = useState<LabDashboardSummary | null>(null);
  const [availableTests, setAvailableTests] = useState<Test[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [savingSample, setSavingSample] = useState(false);
  const [savingResult, setSavingResult] = useState(false);
  const [error, setError] = useState('');
  const [sampleSuccess, setSampleSuccess] = useState('');
  const [resultSuccess, setResultSuccess] = useState('');
  const [selectedSampleId, setSelectedSampleId] = useState('');
  const [selectedSampleTestId, setSelectedSampleTestId] = useState('');
  const [sampleForm, setSampleForm] = useState({
    current_status: 'In Progress',
    current_stage: 'Lab',
    notes: '',
  });
  const [resultForm, setResultForm] = useState({
    value: '',
    unit: '',
    interpretation: '',
    status: 'Pending Review',
  });
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoadingDashboard(true);
    setError('');

    try {
      const [dashboardResponse, testsResponse] = await Promise.all([
        labService.getDashboard(),
        testService.getTests({ is_active: true, limit: 100 }),
      ]);

      const summary = dashboardResponse.data;
      setDashboardSummary(summary);
      setAvailableTests(Array.isArray(testsResponse.data) ? testsResponse.data : testsResponse.data?.data || []);

      if (!selectedSampleId && summary.recentSamples.length > 0) {
        setSelectedSampleId(String(summary.recentSamples[0].id));
      }

      const initialSampleTestId = getSampleTestOptions(summary.recentSamples, []).find(() => true)?.id;
      if (!selectedSampleTestId && initialSampleTestId) {
        setSelectedSampleTestId(String(initialSampleTestId));
      }
    } catch (loadError) {
      console.error('Failed to load lab dashboard summary:', loadError);
      if (!silent) setError('Could not load lab dashboard data. Please refresh and try again.');
    } finally {
      if (!silent) setLoadingDashboard(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void loadData();
    // Auto-refresh every 30 seconds
    autoRefreshRef.current = setInterval(() => void loadData(true), 30000);
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const recentSamples = useMemo(() => {
    const samples = dashboardSummary?.recentSamples || [];
    return [...samples].sort(
      (a, b) => (PRIORITY_ORDER[a.priority || 'Routine'] ?? 2) - (PRIORITY_ORDER[b.priority || 'Routine'] ?? 2)
    );
  }, [dashboardSummary]);

  const recentResults = dashboardSummary?.recentResults || [];
  const dashboard = dashboardSummary?.summary;

  const sampleTestOptions = useMemo(
    () => getSampleTestOptions(recentSamples, availableTests),
    [recentSamples, availableTests]
  );

  // When a sample-test is selected, pre-fill unit from its test definition
  const selectedSampleTest = useMemo(
    () => sampleTestOptions.find((o) => String(o.id) === selectedSampleTestId),
    [sampleTestOptions, selectedSampleTestId]
  );

  useEffect(() => {
    if (selectedSampleTest) {
      setResultForm((f) => ({
        ...f,
        unit: f.unit || selectedSampleTest.unit || '',
      }));
    }
  }, [selectedSampleTestId]); // eslint-disable-line react-hooks/exhaustive-deps

  const showQueueSection = mode === 'full' || mode === 'queue';
  const showResultSection = mode === 'full' || mode === 'results';
  const showSamplesSection = mode === 'full' || mode === 'samples';

  const handleSampleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingSample(true);
    setError('');
    setSampleSuccess('');

    try {
      if (!selectedSampleId) {
        setError('Choose a sample before updating its status.');
        return;
      }

      await sampleService.updateSampleStatus(Number(selectedSampleId), {
        current_status: sampleForm.current_status,
        current_stage: sampleForm.current_stage,
        notes: sampleForm.notes.trim() || undefined,
      });

      setSampleSuccess('Sample status updated successfully.');
      setSampleForm((current) => ({ ...current, notes: '' }));
      await loadData();
    } catch (submitError) {
      console.error('Update sample status failed:', submitError);
      setError('Could not update the sample. Please try again.');
    } finally {
      setSavingSample(false);
    }
  };

  const handleResultSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingResult(true);
    setError('');
    setResultSuccess('');

    try {
      if (!selectedSampleTestId) {
        setError('Choose a sample test before saving results.');
        return;
      }
      if (!resultForm.value.trim()) {
        setError('Result value is required.');
        return;
      }

      await resultService.createResult({
        sample_test_id: Number(selectedSampleTestId),
        value: resultForm.value.trim(),
        unit: resultForm.unit.trim() || undefined,
        interpretation: resultForm.interpretation || undefined,
        status: resultForm.status,
      });

      setResultSuccess('Result saved and sent for doctor review.');
      setResultForm({ value: '', unit: '', interpretation: '', status: 'Pending Review' });
      await loadData();
    } catch (submitError: any) {
      const msg = submitError?.response?.data?.message || 'Could not save the result. Please check the details and try again.';
      setError(msg);
    } finally {
      setSavingResult(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics */}
      {dashboard && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          <MetricCard label="In progress" value={dashboard.samplesInProgress} tone="sky" />
          <MetricCard label="Awaiting review" value={dashboard.samplesAwaitingReview} tone="amber" />
          <MetricCard label="Completed today" value={dashboard.samplesCompletedToday} tone="emerald" />
          <MetricCard label="Pending review" value={dashboard.resultsPendingReview} tone="rose" />
          <MetricCard label="Results today" value={dashboard.resultsCompletedToday} tone="sky" />
          <MetricCard label="Active tests" value={dashboard.activeTests} tone="emerald" />
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

      {/* Queue Section */}
      {showQueueSection && (
        <Card className="border-white/10 bg-slate-900/75">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-sky-300/70">Lab queue</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Update sample status</h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="section-chip">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Auto-refresh 30s
              </span>
            </div>
          </div>

          <form onSubmit={handleSampleSubmit} className="grid gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200/90">Sample</label>
              <select
                value={selectedSampleId}
                onChange={(event) => setSelectedSampleId(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-slate-100 transition duration-300 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
              >
                <option value="">Select sample</option>
                {recentSamples.map((sample) => (
                  <option key={sample.id} value={sample.id}>
                    [{sample.priority || 'Routine'}] {sample.sample_id} — {formatPatientLabel(sample)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200/90">Status</label>
              <select
                value={sampleForm.current_status}
                onChange={(event) => setSampleForm((current) => ({ ...current, current_status: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-slate-100 transition duration-300 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
              >
                {sampleStatusOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200/90">Stage</label>
              <select
                value={sampleForm.current_stage}
                onChange={(event) => setSampleForm((current) => ({ ...current, current_stage: event.target.value }))}
                className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-slate-100 transition duration-300 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
              >
                {sampleStageOptions.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>

            <div>
              <Input
                label="Notes"
                value={sampleForm.notes}
                onChange={(event) => setSampleForm((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Add a short lab note"
              />
            </div>

            <div className="lg:col-span-2 flex items-center gap-4">
              <Button type="submit" disabled={savingSample} loading={savingSample} loadingText="Saving...">
                Update Sample
              </Button>
              {sampleSuccess && <p className="text-sm text-emerald-300">{sampleSuccess}</p>}
            </div>
          </form>
        </Card>
      )}

      {/* Result Entry Section */}
      {showResultSection && (
        <Card className="border-white/10 bg-slate-900/75">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-sky-300/70">Results entry</p>
              <h3 className="mt-2 text-2xl font-semibold text-white">Capture test result</h3>
            </div>
            <div className="section-chip">
              <span className="h-2 w-2 rounded-full bg-sky-400" />
              {availableTests.length} tests available
            </div>
          </div>

          <form onSubmit={handleResultSubmit} className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200/90">Sample test</label>
                <select
                  value={selectedSampleTestId}
                  onChange={(event) => setSelectedSampleTestId(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-slate-100 transition duration-300 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                >
                  <option value="">Select sample test</option>
                  {sampleTestOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      [{option.priority}] {option.sampleLabel} — {option.patientLabel} — {option.testLabel}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200/90">Interpretation</label>
                <select
                  value={resultForm.interpretation}
                  onChange={(event) => setResultForm((current) => ({ ...current, interpretation: event.target.value }))}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-slate-100 transition duration-300 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
                >
                  <option value="">Select interpretation</option>
                  {interpretationOptions.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <Input
                  label="Result value"
                  value={resultForm.value}
                  onChange={(event) => setResultForm((current) => ({ ...current, value: event.target.value }))}
                  placeholder="e.g. 5.6"
                  required
                />
              </div>

              <div>
                <Input
                  label="Unit"
                  value={resultForm.unit}
                  onChange={(event) => setResultForm((current) => ({ ...current, unit: event.target.value }))}
                  placeholder={selectedSampleTest?.unit || 'e.g. mmol/L'}
                />
              </div>
            </div>

            {/* Clinical reference box */}
            {selectedSampleTest && (
              <div className="rounded-2xl border border-sky-400/20 bg-sky-400/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-sky-300/70">Reference guide</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-3 text-sm">
                  <div>
                    <span className="text-slate-400">Test: </span>
                    <span className="text-slate-100">{selectedSampleTest.testLabel}</span>
                  </div>
                  {selectedSampleTest.unit && (
                    <div>
                      <span className="text-slate-400">Unit: </span>
                      <span className="text-sky-200 font-medium">{selectedSampleTest.unit}</span>
                    </div>
                  )}
                  {selectedSampleTest.referenceRange && (
                    <div>
                      <span className="text-slate-400">Normal range: </span>
                      <span className="text-emerald-300 font-medium">{selectedSampleTest.referenceRange}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4">
              <Button type="submit" disabled={savingResult} loading={savingResult} loadingText="Saving...">
                Save Result
              </Button>
              {resultSuccess && <p className="text-sm text-emerald-300">{resultSuccess}</p>}
            </div>
          </form>
        </Card>
      )}

      {/* Sample & Results Lists */}
      {showSamplesSection && (
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Lab queue list */}
          <Card className="border-white/10 bg-slate-900/75">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Lab queue</h3>
              <span className="text-xs text-slate-400">{recentSamples.length} samples</span>
            </div>
            <div className="space-y-3">
              {recentSamples.map((sample) => {
                const ps = getPriorityStyle(sample.priority);
                return (
                  <div
                    key={sample.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 transition duration-300 hover:border-sky-400/30 hover:bg-white/[0.07]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-white truncate">{sample.sample_id}</p>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ps.badge}`}>
                            {sample.priority || 'Routine'}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-slate-300 truncate">{formatPatientLabel(sample)}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {sample.specimen_type} · {sample.current_stage} · {formatElapsed(sample.created_at)}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs ${getStatusStyle(sample.current_status)}`}>
                        {sample.current_status}
                      </span>
                    </div>
                  </div>
                );
              })}
              {!loadingDashboard && recentSamples.length === 0 && (
                <p className="text-sm text-slate-400">No samples in queue.</p>
              )}
            </div>
          </Card>

          {/* Recent results */}
          <Card className="border-white/10 bg-slate-900/75">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Recent results</h3>
              <span className="text-xs text-slate-400">{recentResults.length} results</span>
            </div>
            <div className="space-y-3">
              {recentResults.map((result) => {
                const sampleTest = (result as any).SampleTest || (result as any).sampleTest;
                const testName = sampleTest?.Test?.name || sampleTest?.test?.name || 'Unknown test';
                const patient = sampleTest?.Sample?.Patient || sampleTest?.sample?.patient;
                const patientLabel = patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown';

                return (
                  <div key={result.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">{testName}</p>
                        <p className="text-sm text-slate-400 truncate">{patientLabel}</p>
                        <div className="mt-1 flex items-center gap-2 flex-wrap text-sm">
                          <span className="text-slate-200 font-medium">{result.value}</span>
                          {result.unit && <span className="text-slate-500">{result.unit}</span>}
                          {result.reference_range && (
                            <span className="text-xs text-slate-500">ref: {result.reference_range}</span>
                          )}
                        </div>
                        {result.interpretation && (
                          <p className="text-xs mt-1 text-amber-300">{result.interpretation}</p>
                        )}
                      </div>
                      <ResultStatusBadge status={result.status} />
                    </div>
                  </div>
                );
              })}
              {!loadingDashboard && recentResults.length === 0 && (
                <p className="text-sm text-slate-400">No results available.</p>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

const ResultStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    'Pending Review': 'bg-amber-500/15 text-amber-200',
    Normal: 'bg-emerald-500/15 text-emerald-200',
    Abnormal: 'bg-rose-500/15 text-rose-300',
    Rejected: 'bg-slate-600/30 text-slate-400',
  };
  return (
    <span className={`shrink-0 rounded-full px-3 py-1 text-xs ${styles[status] || 'bg-slate-700/40 text-slate-300'}`}>
      {status}
    </span>
  );
};

const MetricCard: React.FC<{ label: string; value: number; tone: 'sky' | 'emerald' | 'amber' | 'rose' }> = ({
  label,
  value,
  tone,
}) => {
  const toneClassMap = {
    sky: 'text-sky-300',
    emerald: 'text-emerald-300',
    amber: 'text-amber-300',
    rose: 'text-rose-300',
  };

  return (
    <Card className="border-white/10 bg-slate-900/75">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${toneClassMap[tone]}`}>{value}</p>
    </Card>
  );
};

const getSampleTestOptions = (samples: Sample[], tests: Test[]): SampleTestOption[] => {
  const options: SampleTestOption[] = [];
  const testsById = new Map(tests.map((t) => [t.id, t]));

  samples.forEach((sample) => {
    const sampleTests =
      (sample as any).SampleTests ||
      (sample as any).sampleTests ||
      (sample as any).SampleTest ||
      [];
    const normalizedSampleTests = Array.isArray(sampleTests) ? sampleTests : [sampleTests];

    normalizedSampleTests.forEach((sampleTest: any) => {
      const test = sampleTest?.Test || sampleTest?.test || testsById.get(sampleTest?.test_id);
      if (sampleTest?.id && test?.name) {
        const patient = (sample as any).Patient || (sample as any).patient;
        options.push({
          id: sampleTest.id,
          sampleLabel: sample.sample_id,
          testLabel: test.name,
          patientLabel: patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown',
          priority: sample.priority || 'Routine',
          referenceRange: test.reference_range ?? null,
          unit: test.unit ?? null,
        });
      }
    });
  });

  // Sort by priority: STAT first
  return options.sort(
    (a, b) => (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2)
  );
};

const formatPatientLabel = (sample: Sample) => {
  const patient = (sample as any).Patient || (sample as any).patient;
  return patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown patient';
};
