import React, { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { Sidebar } from '../components/layout/Header.js';
import { useRequireAuth } from '../hooks/useAuth.js';
import { getDashboardDefaultRoute, getDashboardNavItems } from '../config/dashboardNavigation.js';
import { Card } from '../components/common/FormElements.js';
import { reportService, sampleService, invoiceService } from '../services/index.js';
import type { ReportSummary } from '../types/index.js';
import { ReceptionDeskPage } from './reception/ReceptionDeskPage.js';
import { PatientIntakePage } from './reception/PatientIntakePage.js';
import { SampleRegistrationPage } from './reception/SampleRegistrationPage.js';
import { PaymentsPage } from './reception/PaymentsPage.js';
import { InvoicesPage } from './reception/InvoicesPage.js';
import { PatientAccountPage } from './patient/PatientAccountPage.js';
import { LabQueuePage } from './lab/LabQueuePage.js';
import { LabResultsPage } from './lab/LabResultsPage.js';
import { LabSamplesPage } from './lab/LabSamplesPage.js';
import { DoctorApprovalsPage } from './doctor/DoctorApprovalsPage.js';
import { DoctorReviewsPage } from './doctor/DoctorReviewsPage.js';
import { DoctorPatientsPage } from './doctor/DoctorPatientsPage.js';

export type ReceptionWorkspaceMode = 'full' | 'patients' | 'samples' | 'payments' | 'invoices';

type OverviewMetric = {
  label: string;
  value: string;
  tone: 'sky' | 'emerald' | 'amber' | 'rose';
};

const toneClasses: Record<OverviewMetric['tone'], string> = {
  sky: 'text-sky-300',
  emerald: 'text-emerald-300',
  amber: 'text-amber-300',
  rose: 'text-rose-300',
};

export const DashboardPage: React.FC = () => {
  const { user } = useRequireAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  const dashboardRole = user?.role ?? 'patient';
  const menuItems = getDashboardNavItems(dashboardRole);

  return (
    <div className="h-[calc(100vh-80px)] overflow-hidden animate-fade-up">
      <div className="flex h-full">
        <Sidebar
          menuItems={menuItems}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-white/10 bg-slate-950/70 px-4 py-4 text-white backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="section-chip mb-3 w-fit">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Macheke Medical Lab
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  Staff Dashboard
                </h1>
                <p className="mt-2 text-sm text-slate-300">
                  The same workspace for every team, tailored by role and access level.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-3 text-sm font-medium text-white transition duration-300 hover:-translate-y-0.5 hover:bg-white/15 lg:hidden"
                >
                  <span className="text-base">☰</span>
                  Menu
                </button>
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3 text-sm text-slate-200">
                  Signed in as <span className="font-semibold text-white">{user?.full_name}</span>
                  <span className="ml-2 rounded-full bg-sky-400/15 px-3 py-1 text-xs text-sky-200">
                    {dashboardRole}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <main className="min-h-0 flex-1 overflow-y-auto">
            <div className="container py-6 lg:py-8">
              <Routes>
                <Route index element={<DashboardOverviewRoute role={dashboardRole} />} />
                <Route path="reception" element={<ReceptionDeskPage />} />
                <Route path="reception/patients" element={<PatientIntakePage />} />
                <Route path="reception/samples" element={<SampleRegistrationPage />} />
                <Route path="reception/payments" element={<PaymentsPage />} />
                <Route path="reception/invoices" element={<InvoicesPage />} />
                <Route path="lab/queue" element={<LabQueuePage />} />
                <Route path="lab/results" element={<LabResultsPage />} />
                <Route path="lab/samples" element={<LabSamplesPage />} />
                <Route path="doctor/approvals" element={<DoctorApprovalsPage />} />
                <Route path="doctor/reviews" element={<DoctorReviewsPage />} />
                <Route path="doctor/patients" element={<DoctorPatientsPage />} />
                <Route path="manager/operations" element={<ManagerOperationsRoute />} />
                <Route path="manager/revenue" element={<ManagerRevenueRoute />} />
                <Route path="manager/performance" element={<ManagerPerformanceRoute />} />
                <Route path="admin/users" element={<AdminUsersRoute />} />
                <Route path="admin/system" element={<AdminSystemRoute />} />
                <Route path="patient/results" element={<PatientResultsRoute />} />
                <Route path="patient/invoices" element={<PatientInvoicesRoute />} />
                <Route path="patient/account" element={<PatientAccountPage />} />
                <Route
                  path="*"
                  element={<Navigate to={getDashboardDefaultRoute(dashboardRole)} replace />}
                />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

const DashboardOverviewRoute: React.FC<{ role: string }> = ({ role }) => {
  const metrics = getOverviewMetrics(role);
  const quickLinks = getDashboardNavItems(role).slice(1, 4);
  const roleTitle = getRoleTitle(role);
  const roleDescription = getRoleDescription(role);

  return (
    <section className="space-y-6">
      <Card className="border-white/10 bg-slate-900/75">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-sky-300/70">Overview</p>
            <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">{roleTitle}</h2>
            <p className="mt-3 max-w-2xl text-sm text-slate-300">{roleDescription}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            {quickLinks.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-slate-100 transition duration-300 hover:-translate-y-0.5 hover:bg-white/15"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border-white/10 bg-slate-900/75">
            <p className="text-sm text-slate-400">{metric.label}</p>
            <p className={`mt-3 text-3xl font-bold ${toneClasses[metric.tone]}`}>{metric.value}</p>
          </Card>
        ))}
      </div>

      <Card className="border-white/10 bg-slate-900/75">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white">Role access</h3>
            <p className="mt-1 text-sm text-slate-300">
              Sidebar items and routes are filtered to the signed-in staff role.
            </p>
          </div>
          <span className="section-chip w-fit">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            {role}
          </span>
        </div>
      </Card>
    </section>
  );
};

const ManagerOperationsRoute: React.FC = () => {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportService.getSummary()
      .then((res) => setSummary(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const metrics = summary ? [
    { label: 'Samples today', value: String(summary.samples.today), tone: 'sky' as const },
    { label: 'In progress', value: String(summary.samples.in_progress), tone: 'amber' as const },
    { label: 'Pending approvals', value: String(summary.samples.pending_approvals), tone: 'rose' as const },
    { label: 'Avg TAT (hrs)', value: summary.lab.avg_tat_hours ?? 'N/A', tone: 'emerald' as const },
  ] : [];

  return (
    <RoleRoutePanel
      title="Operations"
      description="Keep an eye on turnaround, throughput, and daily workload distribution."
      metrics={metrics}
      loading={loading}
      bullets={[
        'Monitor patient flow from reception to release.',
        'Track bottlenecks before they affect turnaround time.',
        'Use this view for staffing and planning decisions.',
      ]}
    />
  );
};

const ManagerRevenueRoute: React.FC = () => {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportService.getSummary()
      .then((res) => setSummary(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const metrics = summary ? [
    { label: 'Revenue today', value: `$${summary.financial.revenue_today}`, tone: 'emerald' as const },
    { label: 'Revenue this week', value: `$${summary.financial.revenue_this_week}`, tone: 'sky' as const },
    { label: 'Outstanding', value: `$${summary.financial.outstanding_balance}`, tone: 'amber' as const },
    { label: 'Paid invoices', value: String(summary.financial.paid_invoices), tone: 'rose' as const },
  ] : [];

  return (
    <RoleRoutePanel
      title="Revenue"
      description="Follow payment trends, cash collection, and outstanding balances."
      metrics={metrics}
      loading={loading}
      bullets={[
        'Compare cash, card, and mobile money collections.',
        'Review balances that still need follow-up.',
        'Keep the reception team aligned with finance workflows.',
      ]}
    />
  );
};

const ManagerPerformanceRoute: React.FC = () => {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportService.getSummary()
      .then((res) => setSummary(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const metrics = summary ? [
    { label: 'Completed samples', value: String(summary.samples.completed), tone: 'sky' as const },
    { label: 'In progress', value: String(summary.samples.in_progress), tone: 'amber' as const },
    { label: 'Critical alerts', value: String(summary.samples.critical_alerts), tone: 'rose' as const },
    { label: 'Patients this week', value: String(summary.patients.this_week), tone: 'emerald' as const },
  ] : [];

  return (
    <RoleRoutePanel
      title="Performance"
      description="Understand how quickly work moves through the lab and where delays happen."
      metrics={metrics}
      loading={loading}
      bullets={[
        'Use this view for workload planning.',
        'Spot recurring delays in the process.',
        'Keep teams aligned on daily targets.',
      ]}
    />
  );
};

const AdminUsersRoute: React.FC = () => (
  <RoleRoutePanel
    title="Users"
    description="Manage staff accounts, role assignments, and access levels."
    metrics={[
      { label: 'Active users', value: '0', tone: 'sky' },
      { label: 'Locked accounts', value: '0', tone: 'amber' },
      { label: 'Admin actions', value: '0', tone: 'emerald' },
      { label: 'Audit flags', value: '0', tone: 'rose' },
    ]}
    bullets={[
      'Assign roles carefully to keep access clean.',
      'Deactivate unused accounts instead of deleting history.',
      'Audit permissions regularly.',
    ]}
  />
);

const AdminSystemRoute: React.FC = () => (
  <RoleRoutePanel
    title="System Health"
    description="Track the overall condition of the platform and watch for operational issues."
    metrics={[
      { label: 'System health', value: 'Healthy', tone: 'emerald' },
      { label: 'Background jobs', value: '0', tone: 'sky' },
      { label: 'Warnings', value: '0', tone: 'amber' },
      { label: 'Critical errors', value: '0', tone: 'rose' },
    ]}
    bullets={[
      'Watch logs and alerts for backend issues.',
      'Validate service uptime after deploys.',
      'Keep a close eye on error spikes.',
    ]}
  />
);

const PatientResultsRoute: React.FC = () => {
  const [samples, setSamples] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [samplesRes, invoicesRes] = await Promise.all([
          sampleService.getSamples(),
          invoiceService.getInvoices(),
        ]);
        setSamples(samplesRes.data || []);
        setInvoices(invoicesRes.data || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load your lab results. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    void fetchData();
  }, []);

  const metrics = React.useMemo(() => {
    let completedCount = 0;
    let pendingCount = 0;
    let readyCount = 0;
    let outstandingAmount = 0;

    samples.forEach((sample) => {
      const tests = sample.SampleTests || sample.sampleTests || [];
      tests.forEach((st: any) => {
        const result = st.Result || st.result;
        if (result && (result.status === 'Normal' || result.status === 'Abnormal')) {
          completedCount++;
          readyCount++;
        } else {
          pendingCount++;
        }
      });
    });

    invoices.forEach((inv) => {
      const bal = Number(inv.balance_due ?? (inv.total_amount - (inv.amount_paid ?? 0)));
      if (inv.status !== 'Cancelled') {
        outstandingAmount += bal;
      }
    });

    return [
      { label: 'Completed tests', value: String(completedCount), tone: 'sky' as const },
      { label: 'Pending results', value: String(pendingCount), tone: 'amber' as const },
      { label: 'Ready to collect', value: String(readyCount), tone: 'emerald' as const },
      { label: 'Outstanding balance', value: `$${outstandingAmount.toFixed(2)}`, tone: 'rose' as const },
    ];
  }, [samples, invoices]);

  if (loading) {
    return (
      <RoleRoutePanel
        title="My Results"
        description="Patients can see their completed work, approvals, and next steps here."
        metrics={[
          { label: 'Completed tests', value: '...', tone: 'sky' },
          { label: 'Pending results', value: '...', tone: 'amber' },
          { label: 'Ready to collect', value: '...', tone: 'emerald' },
          { label: 'Outstanding balance', value: '...', tone: 'rose' },
        ]}
        bullets={[]}
        loading={true}
      />
    );
  }

  return (
    <section className="space-y-6">
      <Card className="border-white/10 bg-slate-900/75">
        <p className="text-xs uppercase tracking-[0.25em] text-sky-300/70">My Results</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Your Lab Test Records</h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">
          Track the status of your biological samples, view test status updates, and download clinical results once they have been signed off by a doctor.
        </p>
      </Card>

      {error && (
        <Card className="border-rose-400/30 bg-rose-500/10 text-rose-100">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠</span>
            <span>{error}</span>
          </div>
        </Card>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border-white/10 bg-slate-900/75">
            <p className="text-sm text-slate-400">{metric.label}</p>
            <p className={`mt-3 text-3xl font-bold ${toneClasses[metric.tone]}`}>{metric.value}</p>
          </Card>
        ))}
      </div>

      {/* Samples List */}
      <Card className="border-white/10 bg-slate-900/75">
        <h3 className="text-xl font-semibold text-white mb-6">Test Packages & Samples</h3>

        {samples.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-slate-800/10 py-12 text-center">
            <p className="text-4xl">🔬</p>
            <p className="mt-3 font-medium text-slate-300">No test records found</p>
            <p className="mt-1 text-sm text-slate-500">Your registered laboratory samples will show up here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {samples.map((sample) => {
              const tests = sample.SampleTests || sample.sampleTests || [];
              return (
                <div key={sample.id} className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4 hover:border-sky-400/30 transition-colors duration-300">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-semibold text-sky-300 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-400/20">
                          {sample.sample_id}
                        </span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                          sample.priority === 'STAT' ? 'bg-rose-500/20 text-rose-300' :
                          sample.priority === 'Urgent' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700/40 text-slate-300'
                        }`}>
                          {sample.priority || 'Routine'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Specimen: <span className="text-slate-300 font-medium">{sample.specimen_type}</span> · 
                        Registered: <span className="text-slate-300 font-medium">{new Date(sample.created_at).toLocaleDateString()}</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-start sm:items-end gap-1.5">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        sample.current_status === 'Released' || sample.current_status === 'Completed' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/20' :
                        sample.current_status === 'In Progress' ? 'bg-sky-500/15 text-sky-200 border border-sky-400/10' : 'bg-slate-700/40 text-slate-300'
                      }`}>
                        Status: {sample.current_status}
                      </span>
                      <span className="text-xs text-slate-400">
                        Workflow Stage: <span className="text-white font-medium">{sample.current_stage}</span>
                      </span>
                    </div>
                  </div>

                  {/* Stage Progress Bar */}
                  <div className="pt-2">
                    <div className="relative flex justify-between text-xs text-slate-400">
                      {['Reception', 'Lab', 'Doctor Review', 'Completed'].map((stage, i) => {
                        const stagesList = ['Reception', 'Lab', 'Doctor Review', 'Completed'];
                        const currentIdx = stagesList.indexOf(sample.current_stage);
                        const stageIdx = stagesList.indexOf(stage);
                        const isCurrent = currentIdx === stageIdx;
                        const isPast = currentIdx > stageIdx || sample.current_status === 'Released';

                        return (
                          <div key={stage} className="flex flex-col items-center gap-1.5 flex-1 relative z-10">
                            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${
                              isPast ? 'bg-emerald-500 text-white' :
                              isCurrent ? 'bg-sky-500 text-white ring-4 ring-sky-500/20' : 'bg-slate-800 text-slate-500 border border-white/5'
                            }`}>
                              {isPast ? '✓' : i + 1}
                            </div>
                            <span className={`font-medium ${isCurrent ? 'text-sky-300' : isPast ? 'text-slate-300' : 'text-slate-500'}`}>
                              {stage}
                            </span>
                          </div>
                        );
                      })}
                      {/* Line connecting stages */}
                      <div className="absolute top-3 left-[12.5%] right-[12.5%] h-0.5 bg-slate-800 -z-10" />
                    </div>
                  </div>

                  {/* Tests List inside Sample */}
                  <div className="border-t border-white/5 pt-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tests & Results</p>
                    <div className="grid gap-3 md:grid-cols-2">
                      {tests.map((st: any) => {
                        const test = st.Test || st.test;
                        const result = st.Result || st.result;
                        const isApproved = result && (result.status === 'Normal' || result.status === 'Abnormal');

                        return (
                          <div key={st.id} className="rounded-xl border border-white/5 bg-slate-900/60 p-4 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-white text-sm">{test?.name || 'Lab Test'}</p>
                              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide ${
                                isApproved ? (result.status === 'Abnormal' ? 'bg-rose-500/15 text-rose-300' : 'bg-emerald-500/15 text-emerald-300') :
                                result ? 'bg-amber-500/15 text-amber-300' : 'bg-slate-700/40 text-slate-300'
                              }`}>
                                {isApproved ? 'Approved' : result ? 'Awaiting Doctor Review' : 'Processing'}
                              </span>
                            </div>

                            {isApproved ? (
                              <div className="space-y-2 pt-1">
                                <div className="flex items-end justify-between">
                                  <div>
                                    <p className="text-2xl font-bold text-white tracking-tight">
                                      {result.value} <span className="text-sm font-medium text-slate-400">{result.unit || ''}</span>
                                    </p>
                                    <p className="text-[11px] text-slate-500">Normal Ref Range: {result.reference_range || 'N/A'}</p>
                                  </div>
                                  <span className={`text-xs font-bold uppercase tracking-wider ${result.status === 'Abnormal' ? 'text-rose-400' : 'text-emerald-400'}`}>
                                    {result.status}
                                  </span>
                                </div>
                                {result.doctor_note && (
                                  <div className="rounded-lg bg-white/5 p-2.5 border-l-2 border-sky-400/40 text-xs text-slate-300 italic">
                                    <span className="font-semibold text-[10px] uppercase tracking-wider text-sky-300 block not-italic mb-0.5">Doctor's Clinical Note:</span>
                                    "{result.doctor_note}"
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="pt-2 text-xs text-slate-500 flex items-center gap-2">
                                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                                {result ? 'Result captured, pending medical verification.' : 'Sample processing inside the lab.'}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </section>
  );
};

const PatientInvoicesRoute: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await invoiceService.getInvoices();
        setInvoices(response.data || []);
      } catch (err) {
        console.error(err);
        setError('Failed to load your invoice records.');
      } finally {
        setLoading(false);
      }
    };
    void fetchInvoices();
  }, []);

  const metrics = React.useMemo(() => {
    let openCount = 0;
    let paidCount = 0;
    let cancelledCount = 0;
    let totalDueAmount = 0;

    invoices.forEach((inv) => {
      const bal = Number(inv.balance_due ?? (inv.total_amount - (inv.amount_paid ?? 0)));
      if (inv.status === 'Paid') {
        paidCount++;
      } else if (inv.status === 'Cancelled') {
        cancelledCount++;
      } else {
        openCount++;
        totalDueAmount += bal;
      }
    });

    return [
      { label: 'Open invoices', value: String(openCount), tone: 'amber' as const },
      { label: 'Paid invoices', value: String(paidCount), tone: 'emerald' as const },
      { label: 'Cancelled', value: String(cancelledCount), tone: 'rose' as const },
      { label: 'Total due', value: `$${totalDueAmount.toFixed(2)}`, tone: 'sky' as const },
    ];
  }, [invoices]);

  if (loading) {
    return (
      <RoleRoutePanel
        title="My Invoices"
        description="Patients can review invoice history and payment status from one place."
        metrics={[
          { label: 'Open invoices', value: '...', tone: 'amber' },
          { label: 'Paid invoices', value: '...', tone: 'emerald' },
          { label: 'Cancelled', value: '...', tone: 'rose' },
          { label: 'Total due', value: '...', tone: 'sky' },
        ]}
        bullets={[]}
        loading={true}
      />
    );
  }

  return (
    <section className="space-y-6">
      <Card className="border-white/10 bg-slate-900/75">
        <p className="text-xs uppercase tracking-[0.25em] text-sky-300/70">My Invoices</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Your Payment Records</h2>
        <p className="mt-3 max-w-2xl text-sm text-slate-300">
          Review your laboratory test bills, cash receipts, and remaining balances due.
        </p>
      </Card>

      {error && (
        <Card className="border-rose-400/30 bg-rose-500/10 text-rose-100">
          <div className="flex items-center gap-3">
            <span className="text-xl">⚠</span>
            <span>{error}</span>
          </div>
        </Card>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label} className="border-white/10 bg-slate-900/75">
            <p className="text-sm text-slate-400">{metric.label}</p>
            <p className={`mt-3 text-3xl font-bold ${toneClasses[metric.tone]}`}>{metric.value}</p>
          </Card>
        ))}
      </div>

      {/* Invoices List */}
      <Card className="border-white/10 bg-slate-900/75">
        <h3 className="text-xl font-semibold text-white mb-6">Invoice History</h3>

        {invoices.length === 0 ? (
          <div className="rounded-2xl border border-white/5 bg-slate-800/10 py-12 text-center">
            <p className="text-4xl">💳</p>
            <p className="mt-3 font-medium text-slate-300">No invoices found</p>
            <p className="mt-1 text-sm text-slate-500">Your billing statements will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {invoices.map((inv) => (
              <div key={inv.id} className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4 hover:border-sky-400/30 transition-colors duration-300 animate-fade-up">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-sm">
                  <div>
                    <p className="font-semibold text-white text-base">{inv.invoice_number}</p>
                    <p className="text-xs text-slate-500 mt-1">Date Billed: {new Date(inv.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                    inv.status === 'Paid' ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/20' :
                    inv.status === 'Partially Paid' ? 'bg-amber-500/20 text-amber-300 border border-amber-400/20' :
                    inv.status === 'Cancelled' ? 'bg-rose-500/15 text-rose-300' : 'bg-slate-700/40 text-slate-300'
                  }`}>
                    {inv.status}
                  </span>
                </div>

                {/* Invoice Items */}
                <div className="rounded-xl bg-slate-900/50 p-4 text-xs text-slate-300 space-y-2">
                  <p className="font-semibold uppercase tracking-wider text-[10px] text-slate-500">Billed Tests</p>
                  <div className="divide-y divide-white/5">
                    {(inv.InvoiceItems || inv.items || []).map((item: any) => (
                      <div key={item.id} className="flex justify-between py-2 first:pt-0 last:pb-0">
                        <span>{item.test?.name || 'Lab Test'}</span>
                        <span className="font-medium text-white">{item.currency} {Number(item.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="flex flex-wrap gap-4 text-sm justify-between sm:justify-end">
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-slate-500">Total Billed</p>
                    <p className="font-medium text-white">{inv.currency} {Number(inv.total_amount).toFixed(2)}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-slate-500">Amount Paid</p>
                    <p className="font-medium text-emerald-400">{inv.currency} {Number(inv.amount_paid ?? 0).toFixed(2)}</p>
                  </div>
                  <div className="text-left sm:text-right border-l border-white/10 pl-4">
                    <p className="text-xs text-slate-500">Balance Due</p>
                    <p className="font-bold text-rose-400">{inv.currency} {Number(inv.balance_due ?? (inv.total_amount - (inv.amount_paid ?? 0))).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
};

const RoleRoutePanel: React.FC<{
  title: string;
  description: string;
  metrics: OverviewMetric[];
  bullets: string[];
  loading?: boolean;
}> = ({ title, description, metrics, bullets, loading }) => (
  <section className="space-y-6">
    <Card className="border-white/10 bg-slate-900/75">
      <p className="text-xs uppercase tracking-[0.25em] text-sky-300/70">{title}</p>
      <p className="mt-3 max-w-2xl text-sm text-slate-300">{description}</p>
    </Card>

    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
      {loading ? (
        Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-white/10 bg-slate-900/75 animate-pulse">
            <div className="h-4 w-24 rounded-full bg-white/10" />
            <div className="mt-3 h-8 w-16 rounded-full bg-white/10" />
          </Card>
        ))
      ) : (
        metrics.map((metric) => (
          <Card key={metric.label} className="border-white/10 bg-slate-900/75">
            <p className="text-sm text-slate-400">{metric.label}</p>
            <p className={`mt-3 text-3xl font-bold ${toneClasses[metric.tone]}`}>{metric.value}</p>
          </Card>
        ))
      )}
    </div>

    <Card className="border-white/10 bg-slate-900/75">
      <h3 className="text-lg font-semibold text-white">What this view supports</h3>
      <ul className="mt-4 space-y-3 text-sm text-slate-300">
        {bullets.map((bullet) => (
          <li key={bullet} className="flex items-start gap-3">
            <span className="mt-1 h-2 w-2 rounded-full bg-sky-400" />
            <span>{bullet}</span>
          </li>
        ))}
      </ul>
    </Card>
  </section>
);

const getRoleTitle = (role: string) => {
  switch (role) {
    case 'receptionist':
      return 'Reception workspace';
    case 'lab_technician':
      return 'Lab workspace';
    case 'doctor':
      return 'Doctor review workspace';
    case 'manager':
      return 'Operations workspace';
    case 'admin':
      return 'Administration workspace';
    case 'patient':
    default:
      return 'Patient portal';
  }
};

const getRoleDescription = (role: string) => {
  switch (role) {
    case 'receptionist':
      return 'Register patients, manage invoices, and record payments at the front desk.';
    case 'lab_technician':
      return 'Process samples, enter results, and keep the lab queue moving.';
    case 'doctor':
      return 'Review results, approve findings, and manage clinical follow-up.';
    case 'manager':
      return 'Monitor throughput, revenue, and team performance in one place.';
    case 'admin':
      return 'Control users, system health, and high-level operational access.';
    case 'patient':
    default:
      return 'View results, invoices, and your laboratory status from a mobile-friendly portal.';
  }
};

const getOverviewMetrics = (role: string): OverviewMetric[] => {
  switch (role) {
    case 'receptionist':
      return [
        { label: 'Patients today', value: '0', tone: 'sky' },
        { label: 'Invoices open', value: '0', tone: 'amber' },
        { label: 'Payments recorded', value: '0', tone: 'emerald' },
        { label: 'Follow-ups', value: '0', tone: 'rose' },
      ];
    case 'lab_technician':
      return [
        { label: 'Samples in queue', value: '0', tone: 'sky' },
        { label: 'Results ready', value: '0', tone: 'emerald' },
        { label: 'Awaiting review', value: '0', tone: 'amber' },
        { label: 'Flagged', value: '0', tone: 'rose' },
      ];
    case 'doctor':
      return [
        { label: 'Pending approvals', value: '0', tone: 'amber' },
        { label: 'Reviewed today', value: '0', tone: 'emerald' },
        { label: 'Critical cases', value: '0', tone: 'rose' },
        { label: 'Released', value: '0', tone: 'sky' },
      ];
    case 'manager':
      return [
        { label: 'Revenue today', value: '$0.00', tone: 'emerald' },
        { label: 'Turnaround', value: '0h', tone: 'sky' },
        { label: 'Backlog', value: '0', tone: 'amber' },
        { label: 'Escalations', value: '0', tone: 'rose' },
      ];
    case 'admin':
      return [
        { label: 'Active users', value: '0', tone: 'sky' },
        { label: 'System health', value: 'Healthy', tone: 'emerald' },
        { label: 'Open warnings', value: '0', tone: 'amber' },
        { label: 'Critical errors', value: '0', tone: 'rose' },
      ];
    case 'patient':
    default:
      return [
        { label: 'My tests', value: '0', tone: 'sky' },
        { label: 'Pending results', value: '0', tone: 'amber' },
        { label: 'Ready to collect', value: '0', tone: 'emerald' },
        { label: 'Balance', value: '$0.00', tone: 'rose' },
      ];
  }
};


