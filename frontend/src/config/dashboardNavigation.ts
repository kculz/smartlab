export type DashboardNavItem = {
  label: string;
  path: string;
  roles?: string[];
  end?: boolean;
};

const dashboardRoutesByRole: Record<string, DashboardNavItem[]> = {
  patient: [
    { label: 'Overview', path: '/dashboard', end: true },
    { label: 'My Results', path: '/dashboard/patient/results' },
    { label: 'My Invoices', path: '/dashboard/patient/invoices' },
    { label: 'My Account', path: '/dashboard/patient/account' },
  ],
  receptionist: [
    { label: 'Overview', path: '/dashboard', end: true },
    { label: 'Reception Desk', path: '/dashboard/reception' },
    { label: 'Patient Intake', path: '/dashboard/reception/patients' },
    { label: 'Sample Registration', path: '/dashboard/reception/samples' },
    { label: 'Payments', path: '/dashboard/reception/payments' },
    { label: 'Invoices', path: '/dashboard/reception/invoices' },
  ],
  lab_technician: [
    { label: 'Overview', path: '/dashboard', end: true },
    { label: 'Lab Queue', path: '/dashboard/lab/queue' },
    { label: 'Results Entry', path: '/dashboard/lab/results' },
    { label: 'Samples', path: '/dashboard/lab/samples' },
  ],
  doctor: [
    { label: 'Overview', path: '/dashboard', end: true },
    { label: 'Approvals', path: '/dashboard/doctor/approvals' },
    { label: 'Reviews', path: '/dashboard/doctor/reviews' },
    { label: 'Patients', path: '/dashboard/doctor/patients' },
  ],
  manager: [
    { label: 'Overview', path: '/dashboard', end: true },
    { label: 'Operations', path: '/dashboard/manager/operations' },
    { label: 'Revenue', path: '/dashboard/manager/revenue' },
    { label: 'Performance', path: '/dashboard/manager/performance' },
  ],
  admin: [
    { label: 'Overview', path: '/dashboard', end: true },
    { label: 'Reception Desk', path: '/dashboard/reception' },
    { label: 'Lab Queue', path: '/dashboard/lab/queue' },
    { label: 'Doctor Approvals', path: '/dashboard/doctor/approvals' },
    { label: 'Operations', path: '/dashboard/manager/operations' },
    { label: 'Users', path: '/dashboard/admin/users' },
    { label: 'System Health', path: '/dashboard/admin/system' },
  ],
};

export const getDashboardNavItems = (role?: string): DashboardNavItem[] => {
  if (!role) {
    return dashboardRoutesByRole.patient;
  }

  return dashboardRoutesByRole[role] || dashboardRoutesByRole.patient;
};

export const getDashboardDefaultRoute = (role?: string) => {
  switch (role) {
    case 'receptionist':
      return '/dashboard/reception';
    case 'lab_technician':
      return '/dashboard/lab/queue';
    case 'doctor':
      return '/dashboard/doctor/approvals';
    case 'manager':
      return '/dashboard/manager/operations';
    case 'admin':
      return '/dashboard/admin/system';
    case 'patient':
    default:
      return '/dashboard/patient/results';
  }
};
