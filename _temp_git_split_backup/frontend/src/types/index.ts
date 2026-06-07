export interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
  phone?: string | null;
  is_active?: boolean;
  patient?: Patient | null;
}

export interface Patient {
  id: number;
  user_id?: number;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  created_at?: string;
}

export interface Sample {
  id: number;
  sample_id: string;
  patient_id: number;
  registered_by: number;
  specimen_type?: string;
  priority?: string;
  current_status: string;
  current_stage: string;
  notes?: string;
  collected_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Test {
  id: number;
  test_category_id: number;
  name: string;
  description?: string;
  price: number;
  currency: string;
  unit?: string | null;
  reference_range?: string | null;
  turnaround_hours?: number | null;
  is_active: boolean;
}

export interface Invoice {
  id: number;
  invoice_number: string;
  patient_id: number;
  total_amount: number;
  amount_paid?: number;
  balance_due?: number;
  currency: string;
  status: string;
  created_at: string;
}

export interface InvoiceItem {
  id: number;
  invoice_id: number;
  test_id: number;
  price: number;
  currency: string;
  test?: Test;
}

export interface InvoicePayment {
  id: number;
  invoice_id: number;
  payer_name: string;
  payment_method: string;
  amount_tendered: number;
  amount_applied: number;
  change_given: number;
  reference_number?: string | null;
  notes?: string | null;
  received_by?: number | null;
  paid_at: string;
  receivedBy?: Pick<User, 'id' | 'email' | 'full_name'> | null;
}

export interface TestOption {
  id: number;
  name: string;
  price: number;
  currency: string;
  unit?: string | null;
  reference_range?: string | null;
  turnaround_hours?: number | null;
}

export interface Result {
  id: number;
  sample_test_id: number;
  value: string;
  unit?: string | null;
  reference_range?: string | null;
  interpretation?: string | null;
  doctor_note?: string | null;
  status: string;
  approved_by?: number | null;
  approved_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ReceptionDashboardSummary {
  summary: {
    totalPatients: number;
    patientsToday: number;
    openInvoices: number;
    paidInvoices: number;
    samplesToday: number;
    pendingApprovals: number;
  };
  recentPatients: Patient[];
  recentInvoices: Array<
    Invoice & {
      Patient?: Patient;
      InvoiceItems?: InvoiceItem[];
      InvoicePayments?: InvoicePayment[];
      payment_summary?: {
        total_amount: number;
        amount_paid: number;
        balance_due: number;
      };
    }
  >;
  recentSamples: Array<Sample & { Patient?: Patient }>;
  availableTests: TestOption[];
}

export interface LabDashboardSummary {
  summary: {
    samplesInProgress: number;
    samplesAwaitingReview: number;
    samplesCompletedToday: number;
    resultsPendingReview: number;
    resultsCompletedToday: number;
    activeTests: number;
  };
  recentSamples: Array<Sample & { Patient?: Patient }>;
  recentResults: Array<Result & { SampleTest?: { Test?: Test; Sample?: Sample & { Patient?: Patient } } }>;
}

export interface DoctorDashboardSummary {
  summary: {
    pendingApprovals: number;
    reviewedToday: number;
    criticalAlerts: number;
    releasedToday: number;
  };
  recentResults: Array<
    Result & {
      SampleTest?: {
        Test?: Test;
        Sample?: Sample & { Patient?: Patient };
      };
    }
  >;
  recentPatients: Patient[];
}

export interface ReportSummary {
  patients: {
    total: number;
    today: number;
    this_week: number;
  };
  samples: {
    total: number;
    today: number;
    in_progress: number;
    completed: number;
    pending_approvals: number;
    critical_alerts: number;
    results_today: number;
  };
  financial: {
    total_invoices: number;
    open_invoices: number;
    paid_invoices: number;
    revenue_today: string;
    revenue_this_week: string;
    outstanding_balance: string;
  };
  lab: {
    active_tests: number;
    avg_tat_hours: string | null;
  };
}
