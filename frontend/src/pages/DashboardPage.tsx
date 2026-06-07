import React, { useEffect, useState } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { Sidebar } from '../components/layout/Header.js';
import { useRequireAuth } from '../hooks/useAuth.js';
import { getDashboardDefaultRoute, getDashboardNavItems } from '../config/dashboardNavigation.js';
import { Card } from '../components/common/FormElements.js';
import { reportService } from '../services/index.js';
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

const PatientResultsRoute: React.FC = () => (
  <RoleRoutePanel
    title="My Results"
    description="Patients can see their completed work, approvals, and next steps here."
    metrics={[
      { label: 'Completed tests', value: '0', tone: 'sky' },
      { label: 'Pending results', value: '0', tone: 'amber' },
      { label: 'Ready to collect', value: '0', tone: 'emerald' },
      { label: 'Outstanding balance', value: '$0.00', tone: 'rose' },
    ]}
    bullets={[
      'Show approved results once the doctor signs off.',
      'Keep invoice status visible for collection visits.',
      'Make the workflow simple and readable on mobile.',
    ]}
  />
);

const PatientInvoicesRoute: React.FC = () => (
  <RoleRoutePanel
    title="My Invoices"
    description="Patients can review invoice history and payment status from one place."
    metrics={[
      { label: 'Open invoices', value: '0', tone: 'amber' },
      { label: 'Paid invoices', value: '0', tone: 'emerald' },
      { label: 'Cancelled', value: '0', tone: 'rose' },
      { label: 'Total due', value: '$0.00', tone: 'sky' },
    ]}
    bullets={[
      'Keep all payment history easy to find.',
      'Show the current balance clearly.',
      'Use this view for patient follow-up discussions.',
    ]}
  />
);

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


