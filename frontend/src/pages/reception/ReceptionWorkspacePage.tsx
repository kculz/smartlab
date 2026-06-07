import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Button, Card, Input } from '../../components/common/FormElements.js';
import { invoiceService, patientService, receptionService, sampleService } from '../../services/index.js';
import type { Patient, ReceptionDashboardSummary } from '../../types/index.js';

export type ReceptionWorkspaceMode = 'full' | 'patients' | 'samples' | 'payments' | 'invoices';

interface ReceptionWorkspacePageProps {
  mode: ReceptionWorkspaceMode;
}

const specimenTypeOptions = ['Blood', 'Urine', 'Stool', 'Swab', 'Sputum', 'Saliva', 'Tissue', 'Other'];
const priorityOptions = ['Routine', 'Urgent', 'STAT'];
const paymentMethodOptions = ['Cash', 'Card', 'Mobile Money', 'Bank Transfer'];

const formatMoney = (value: number | string | undefined | null) => {
  const numericValue = Number(value ?? 0);
  return Number.isFinite(numericValue) ? numericValue.toFixed(2) : '0.00';
};

// ── Patient Search Autocomplete Component ────────────────────────────────────
const PatientSearchInput: React.FC<{
  label: string;
  value: string;
  onChange: (patientId: string, patient: Patient | null) => void;
  required?: boolean;
}> = ({ label, onChange, required }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Patient[]>([]);
  const [searching, setSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setSearching(true);
    try {
      const res = await patientService.searchPatients(q, 10);
      const patients: Patient[] = Array.isArray(res.data) ? res.data : (res as any).data?.data || [];
      setResults(patients);
      setShowDropdown(patients.length > 0);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setQuery(q);
    setSelectedLabel('');
    onChange('', null);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(q), 300);
  };

  const handleSelect = (patient: Patient) => {
    setQuery('');
    setSelectedLabel(`${patient.first_name} ${patient.last_name} · ${patient.phone}`);
    setResults([]);
    setShowDropdown(false);
    onChange(String(patient.id), patient);
  };

  const handleClear = () => {
    setQuery('');
    setSelectedLabel('');
    setResults([]);
    setShowDropdown(false);
    onChange('', null);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="mb-2 block text-sm font-medium text-slate-200/90">
        {label} {required && <span className="text-rose-400">*</span>}
      </label>

      {selectedLabel ? (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-400/5 px-4 py-3">
          <span className="text-emerald-300 flex-1 text-sm">{selectedLabel}</span>
          <button
            type="button"
            onClick={handleClear}
            className="text-slate-400 hover:text-white text-xs transition-colors"
          >
            ✕ Change
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => query.length >= 2 && setShowDropdown(results.length > 0)}
            placeholder="Search by name or phone..."
            className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-slate-100 transition duration-300 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-400/30 pr-10"
          />
          {searching && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
              Searching...
            </span>
          )}
        </div>
      )}

      {showDropdown && (
        <div className="absolute z-50 mt-1 w-full rounded-2xl border border-white/10 bg-slate-800 shadow-2xl overflow-hidden">
          {results.map((patient) => (
            <button
              key={patient.id}
              type="button"
              onClick={() => handleSelect(patient)}
              className="w-full text-left px-4 py-3 hover:bg-white/10 transition-colors duration-150 border-b border-white/5 last:border-0"
            >
              <p className="font-medium text-slate-100 text-sm">
                {patient.first_name} {patient.last_name}
              </p>
              <p className="text-xs text-slate-400">{patient.phone} · {patient.email}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ── Main Reception Workspace ─────────────────────────────────────────────────
export const ReceptionWorkspacePage: React.FC<ReceptionWorkspacePageProps> = ({ mode }) => {
  const [dashboardSummary, setDashboardSummary] = useState<ReceptionDashboardSummary | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [savingPatient, setSavingPatient] = useState(false);
  const [savingSample, setSavingSample] = useState(false);
  const [savingInvoice, setSavingInvoice] = useState(false);
  const [savingPayment, setSavingPayment] = useState(false);
  const [patientSuccess, setPatientSuccess] = useState('');
  const [sampleSuccess, setSampleSuccess] = useState('');
  const [invoiceSuccess, setInvoiceSuccess] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');
  const [patientCredentials, setPatientCredentials] = useState<{ email: string; temporary_password: string } | null>(null);
  const [error, setError] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [_samplePatient, setSamplePatient] = useState<Patient | null>(null);
  const [_invoicePatient, setInvoicePatient] = useState<Patient | null>(null);

  const [patientForm, setPatientForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    gender: '',
    address: '',
    city: '',
  });
  const [sampleForm, setSampleForm] = useState({
    patient_id: '',
    test_ids: [] as number[],
    specimen_type: 'Blood',
    priority: 'Routine',
    notes: '',
  });
  const [invoiceForm, setInvoiceForm] = useState({
    patient_id: '',
    test_ids: [] as number[],
    currency: 'USD',
  });
  const [paymentForm, setPaymentForm] = useState({
    payer_name: '',
    amount_tendered: '',
    payment_method: 'Cash',
    reference_number: '',
    notes: '',
  });

  const loadDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    try {
      const response = await receptionService.getDashboard();
      const summary = response.data;
      setDashboardSummary(summary);

      if (summary.recentInvoices.length > 0) {
        setSelectedInvoiceId((current) => current || String(summary.recentInvoices[0].id));
      }
    } catch (loadError) {
      console.error('Failed to load reception dashboard summary:', loadError);
      setError('Could not load dashboard data. Please refresh and try again.');
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePatientChange = (field: keyof typeof patientForm, value: string) => {
    setPatientForm((current) => ({ ...current, [field]: value }));
  };

  const handlePatientSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingPatient(true);
    setError('');
    setPatientSuccess('');
    setPatientCredentials(null);

    try {
      const response = await patientService.createPatient({
        first_name: patientForm.first_name.trim(),
        last_name: patientForm.last_name.trim(),
        phone: patientForm.phone.trim(),
        email: patientForm.email.trim(),
        date_of_birth: patientForm.date_of_birth || undefined,
        gender: patientForm.gender || undefined,
        address: patientForm.address || undefined,
        city: patientForm.city || undefined,
      });

      const credentials = response.data?.credentials;
      setPatientSuccess(
        credentials?.temporary_password
          ? `Patient registered. Default password: ${credentials.temporary_password}`
          : 'Patient registered successfully.'
      );
      setPatientCredentials(credentials || null);
      setPatientForm({ first_name: '', last_name: '', phone: '', email: '', date_of_birth: '', gender: '', address: '', city: '' });
      await loadDashboard();
    } catch (submitError: any) {
      const msg = submitError?.response?.data?.message || 'Could not register patient. Please check the details and try again.';
      setError(msg);
    } finally {
      setSavingPatient(false);
    }
  };

  const handleSampleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingSample(true);
    setError('');
    setSampleSuccess('');

    try {
      if (!sampleForm.patient_id || sampleForm.test_ids.length === 0) {
        setError('Search and select a patient, then choose at least one test.');
        return;
      }

      await sampleService.createSample({
        patient_id: Number(sampleForm.patient_id),
        test_ids: sampleForm.test_ids,
        specimen_type: sampleForm.specimen_type,
        priority: sampleForm.priority,
        notes: sampleForm.notes.trim() || undefined,
      });

      setSampleSuccess('Sample registered and sent to the lab.');
      setSampleForm((current) => ({ ...current, test_ids: [], specimen_type: 'Blood', priority: 'Routine', notes: '' }));
      await loadDashboard();
    } catch (submitError: any) {
      setError(submitError?.response?.data?.message || 'Could not register the sample. Please try again.');
    } finally {
      setSavingSample(false);
    }
  };

  const handleInvoiceSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingInvoice(true);
    setError('');
    setInvoiceSuccess('');

    try {
      if (!invoiceForm.patient_id || invoiceForm.test_ids.length === 0) {
        setError('Search and select a patient, then choose at least one test.');
        return;
      }

      await invoiceService.createInvoice({
        patient_id: Number(invoiceForm.patient_id),
        test_ids: invoiceForm.test_ids,
        currency: invoiceForm.currency,
      });

      setInvoiceSuccess('Invoice created and emailed to patient.');
      setInvoiceForm((current) => ({ ...current, test_ids: [] }));
      await loadDashboard();
    } catch (submitError: any) {
      setError(submitError?.response?.data?.message || 'Could not create the invoice. Please try again.');
    } finally {
      setSavingInvoice(false);
    }
  };

  const handlePaymentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingPayment(true);
    setError('');
    setPaymentSuccess('');

    try {
      if (!selectedInvoiceId) { setError('Please choose an invoice first.'); return; }
      const tenderedAmount = Number(paymentForm.amount_tendered);
      if (!paymentForm.payer_name.trim()) { setError('Please enter the payer name.'); return; }
      if (!Number.isFinite(tenderedAmount) || tenderedAmount <= 0) { setError('Please enter a valid tendered amount.'); return; }

      const response = await invoiceService.recordPayment(Number(selectedInvoiceId), {
        payer_name: paymentForm.payer_name.trim(),
        amount_tendered: tenderedAmount,
        payment_method: paymentForm.payment_method,
        reference_number: paymentForm.reference_number.trim() || undefined,
        notes: paymentForm.notes.trim() || undefined,
      });

      const payment = response.data?.payment;
      const invoice = response.data?.invoice;
      setPaymentSuccess(
        `${payment?.payment_status || 'Payment recorded'}. Applied ${formatMoney(payment?.amount_applied)} ${invoice?.currency || 'USD'}, change ${formatMoney(payment?.change_given)} ${invoice?.currency || 'USD'}.`
      );
      setPaymentForm((current) => ({ ...current, payer_name: '', amount_tendered: '', reference_number: '', notes: '' }));
      await loadDashboard();
    } catch (submitError: any) {
      setError(submitError?.response?.data?.message || 'Could not record the payment. Please try again.');
    } finally {
      setSavingPayment(false);
    }
  };

  const dashboard = dashboardSummary?.summary;
  const recentPatients = dashboardSummary?.recentPatients || [];
  const recentInvoices = dashboardSummary?.recentInvoices || [];
  const recentSamples = dashboardSummary?.recentSamples || [];
  const availableTests = dashboardSummary?.availableTests || [];
  const selectedInvoice = recentInvoices.find((invoice) => invoice.id === Number(selectedInvoiceId));
  const selectedInvoicePatient = (selectedInvoice as any)?.Patient;
  const selectedInvoiceBalanceDue = Number(selectedInvoice?.balance_due ?? selectedInvoice?.total_amount ?? 0);
  const tenderedAmount = Number(paymentForm.amount_tendered || 0);
  const appliedAmount = Math.min(tenderedAmount || 0, selectedInvoiceBalanceDue || 0);
  const changeAmount = Math.max(tenderedAmount - appliedAmount, 0);
  const paymentOutcome =
    selectedInvoiceBalanceDue <= 0
      ? 'Paid in full'
      : tenderedAmount <= 0
        ? 'Awaiting payment'
        : appliedAmount < selectedInvoiceBalanceDue
          ? 'Partial payment'
          : changeAmount > 0
            ? 'Paid with change'
            : 'Paid in full';

  const selectedSampleTests = availableTests.filter((test) => sampleForm.test_ids.includes(test.id));
  const selectedInvoiceTests = availableTests.filter((test) => invoiceForm.test_ids.includes(test.id));
  const invoicePreviewTotal = selectedInvoiceTests.reduce((sum, test) => sum + Number(test.price), 0);

  useEffect(() => {
    if (!selectedInvoicePatient) return;
    const name = `${selectedInvoicePatient.first_name} ${selectedInvoicePatient.last_name}`.trim();
    setPaymentForm((current) =>
      current.payer_name.trim() ? current : { ...current, payer_name: name }
    );
  }, [selectedInvoiceId, selectedInvoicePatient]);

  const showPatientSection = mode === 'full' || mode === 'patients';
  const showSampleSection = mode === 'full' || mode === 'samples';
  const showInvoiceSection = mode === 'full' || mode === 'invoices';
  const showPaymentSection = mode === 'full' || mode === 'payments';
  const showPatientList = mode === 'full' || mode === 'patients';
  const showSampleList = mode === 'full' || mode === 'samples';
  const showInvoiceList = mode === 'full' || mode === 'payments' || mode === 'invoices';
  const layoutClassName = mode === 'full' ? 'grid gap-6 xl:grid-cols-[1.1fr_0.9fr]' : 'grid gap-6 xl:grid-cols-1';

  const selectStyleBase = 'w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-slate-100 transition duration-300 focus:border-sky-400/60 focus:outline-none focus:ring-2 focus:ring-sky-400/30';

  return (
    <div className={layoutClassName}>
      {/* Left column: Forms */}
      <div className="space-y-6">
        {/* Summary cards */}
        {dashboard && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <SummaryCard label="Patients today" value={dashboard.patientsToday} color="sky" />
            <SummaryCard label="Open invoices" value={dashboard.openInvoices} color="amber" />
            <SummaryCard label="Paid invoices" value={dashboard.paidInvoices} color="emerald" />
            <SummaryCard label="Samples today" value={dashboard.samplesToday} color="rose" />
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

        {/* Register Patient */}
        {showPatientSection && (
          <Card className="border-white/10 bg-slate-900/75">
            <SectionHeader label="Reception desk" title="Register Patient" chipText="New patient" chipColor="emerald" />
            <form onSubmit={handlePatientSubmit} className="grid gap-4 sm:grid-cols-2">
              <Input label="First name" value={patientForm.first_name} onChange={(e) => handlePatientChange('first_name', e.target.value)} placeholder="First name" required />
              <Input label="Last name" value={patientForm.last_name} onChange={(e) => handlePatientChange('last_name', e.target.value)} placeholder="Last name" required />
              <Input label="Phone" value={patientForm.phone} onChange={(e) => handlePatientChange('phone', e.target.value)} placeholder="+263..." required />
              <Input label="Email" type="email" value={patientForm.email} onChange={(e) => handlePatientChange('email', e.target.value)} placeholder="patient@email.com" required />
              <Input label="Date of birth" type="date" value={patientForm.date_of_birth} onChange={(e) => handlePatientChange('date_of_birth', e.target.value)} />
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200/90">Gender</label>
                <select value={patientForm.gender} onChange={(e) => handlePatientChange('gender', e.target.value)} className={selectStyleBase}>
                  <option value="">Select gender</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <Input label="Address" value={patientForm.address} onChange={(e) => handlePatientChange('address', e.target.value)} placeholder="Home address" />
              <Input label="City" value={patientForm.city} onChange={(e) => handlePatientChange('city', e.target.value)} placeholder="Town / city" />
              <div className="flex items-center gap-3 sm:col-span-2">
                <Button type="submit" loading={savingPatient} loadingText="Registering..." className="rounded-full px-6 py-3 shadow-[0_18px_40px_rgba(59,130,246,0.28)]">
                  Register Patient
                </Button>
                {patientSuccess && <p className="text-sm text-emerald-300">{patientSuccess}</p>}
              </div>
              {patientCredentials && (
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100 sm:col-span-2">
                  <p className="font-medium">Patient account created</p>
                  <p className="mt-1">Email: {patientCredentials.email}</p>
                  <p>Temporary password: <span className="font-mono font-bold">{patientCredentials.temporary_password}</span></p>
                </div>
              )}
            </form>
          </Card>
        )}

        {/* Register Sample */}
        {showSampleSection && (
          <Card className="border-white/10 bg-slate-900/75">
            <SectionHeader label="Samples" title="Register Sample" chipText="Sample intake" chipColor="sky" />
            <form onSubmit={handleSampleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <PatientSearchInput
                  label="Patient"
                  value={sampleForm.patient_id}
                  onChange={(id, patient) => {
                    setSampleForm((c) => ({ ...c, patient_id: id }));
                    setSamplePatient(patient);
                  }}
                  required
                />
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200/90">Specimen type</label>
                  <select value={sampleForm.specimen_type} onChange={(e) => setSampleForm((c) => ({ ...c, specimen_type: e.target.value }))} className={selectStyleBase}>
                    {specimenTypeOptions.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200/90">Priority</label>
                  <select value={sampleForm.priority} onChange={(e) => setSampleForm((c) => ({ ...c, priority: e.target.value }))} className={selectStyleBase}>
                    {priorityOptions.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200/90">Notes</label>
                  <input value={sampleForm.notes} onChange={(e) => setSampleForm((c) => ({ ...c, notes: e.target.value }))} placeholder="Collection notes" className={selectStyleBase} />
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-200/90">Tests to request</p>
                <div className="grid max-h-56 gap-3 overflow-y-auto rounded-3xl border border-white/10 bg-white/5 p-4 sm:grid-cols-2">
                  {availableTests.map((test) => (
                    <label key={test.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-3 text-sm text-slate-100 transition duration-300 hover:border-sky-400/30">
                      <input
                        type="checkbox"
                        checked={sampleForm.test_ids.includes(test.id)}
                        onChange={() => setSampleForm((c) => ({
                          ...c,
                          test_ids: c.test_ids.includes(test.id)
                            ? c.test_ids.filter((v) => v !== test.id)
                            : [...c.test_ids, test.id],
                        }))}
                        className="mt-0.5 h-4 w-4 rounded border-white/20 bg-transparent text-sky-400"
                      />
                      <span className="flex flex-col gap-0.5">
                        <span>{test.name}</span>
                        <span className="text-xs text-slate-400">
                          {test.currency} {test.price}
                          {test.unit && <span className="ml-1">· {test.unit}</span>}
                          {test.turnaround_hours && <span className="ml-1">· {test.turnaround_hours}h TAT</span>}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4 text-sm text-sky-100">
                <p className="font-medium">Collection preview</p>
                <p className="mt-1">Specimen: {sampleForm.specimen_type} · Priority: <span className={sampleForm.priority === 'STAT' ? 'text-rose-300 font-bold' : sampleForm.priority === 'Urgent' ? 'text-amber-300 font-semibold' : ''}>{sampleForm.priority}</span></p>
                <p>Tests selected: {selectedSampleTests.length}</p>
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" loading={savingSample} loadingText="Saving..." className="rounded-full px-6 py-3 shadow-[0_18px_40px_rgba(59,130,246,0.28)]">
                  Register Sample
                </Button>
                {sampleSuccess && <p className="text-sm text-emerald-300">{sampleSuccess}</p>}
              </div>
            </form>
          </Card>
        )}

        {/* Create Invoice */}
        {showInvoiceSection && (
          <Card className="border-white/10 bg-slate-900/75">
            <SectionHeader label="Billing" title="Create Invoice" chipText="Front desk billing" chipColor="amber" />
            <form onSubmit={handleInvoiceSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <PatientSearchInput
                  label="Patient"
                  value={invoiceForm.patient_id}
                  onChange={(id, patient) => {
                    setInvoiceForm((c) => ({ ...c, patient_id: id }));
                    setInvoicePatient(patient);
                  }}
                  required
                />
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200/90">Currency</label>
                  <select value={invoiceForm.currency} onChange={(e) => setInvoiceForm((c) => ({ ...c, currency: e.target.value }))} className={selectStyleBase}>
                    <option value="USD">USD</option>
                    <option value="ZWL">ZWL</option>
                  </select>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-slate-200/90">Tests to bill</p>
                <div className="grid max-h-56 gap-3 overflow-y-auto rounded-3xl border border-white/10 bg-white/5 p-4 sm:grid-cols-2">
                  {availableTests.map((test) => (
                    <label key={test.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-slate-900/60 p-3 text-sm text-slate-100 transition duration-300 hover:border-sky-400/30">
                      <input
                        type="checkbox"
                        checked={invoiceForm.test_ids.includes(test.id)}
                        onChange={() => setInvoiceForm((c) => ({
                          ...c,
                          test_ids: c.test_ids.includes(test.id)
                            ? c.test_ids.filter((v) => v !== test.id)
                            : [...c.test_ids, test.id],
                        }))}
                        className="mt-0.5 h-4 w-4 rounded border-white/20 bg-transparent text-sky-400"
                      />
                      <span className="flex flex-col gap-0.5">
                        <span>{test.name}</span>
                        <span className="text-xs text-slate-400">{test.currency} {test.price}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
                <p className="font-medium">Invoice preview</p>
                <div className="mt-2 space-y-1">
                  {selectedInvoiceTests.map((test) => (
                    <div key={test.id} className="flex items-center justify-between gap-4">
                      <span>{test.name}</span>
                      <span>{invoiceForm.currency} {formatMoney(test.price)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 border-t border-amber-400/20 pt-3 flex items-center justify-between font-semibold">
                  <span>Total</span>
                  <span>{invoiceForm.currency} {formatMoney(invoicePreviewTotal)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" loading={savingInvoice} loadingText="Creating..." className="rounded-full px-6 py-3 shadow-[0_18px_40px_rgba(59,130,246,0.28)]">
                  Create Invoice
                </Button>
                {invoiceSuccess && <p className="text-sm text-emerald-300">{invoiceSuccess}</p>}
              </div>
            </form>
          </Card>
        )}

        {/* Record Payment */}
        {showPaymentSection && (
          <Card className="border-white/10 bg-slate-900/75">
            <SectionHeader label="Payments" title="Record Payment" chipText="Cash / card / mobile" chipColor="sky" />
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200/90">Invoice</label>
                  <select value={selectedInvoiceId} onChange={(e) => setSelectedInvoiceId(e.target.value)} className={selectStyleBase}>
                    <option value="">Select an invoice</option>
                    {recentInvoices.map((invoice) => (
                      <option key={invoice.id} value={invoice.id}>
                        {invoice.invoice_number} — {invoice.status} — {invoice.currency} {formatMoney(invoice.balance_due ?? invoice.total_amount)} due
                      </option>
                    ))}
                  </select>
                </div>

                <Input label="Payer name" value={paymentForm.payer_name} onChange={(e) => setPaymentForm((c) => ({ ...c, payer_name: e.target.value }))} placeholder="Name of person paying" required />
                <Input label="Amount tendered" type="number" min="0" step="0.01" value={paymentForm.amount_tendered} onChange={(e) => setPaymentForm((c) => ({ ...c, amount_tendered: e.target.value }))} placeholder="0.00" required />

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200/90">Payment method</label>
                  <select value={paymentForm.payment_method} onChange={(e) => setPaymentForm((c) => ({ ...c, payment_method: e.target.value }))} className={selectStyleBase}>
                    {paymentMethodOptions.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>

                <Input label="Reference number" value={paymentForm.reference_number} onChange={(e) => setPaymentForm((c) => ({ ...c, reference_number: e.target.value }))} placeholder="Receipt / transaction ref" />

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-200/90">Notes</label>
                  <input value={paymentForm.notes} onChange={(e) => setPaymentForm((c) => ({ ...c, notes: e.target.value }))} placeholder="Optional notes" className={selectStyleBase} />
                </div>
              </div>

              {/* Payment preview */}
              <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4 text-sm text-sky-100">
                <p className="font-medium">Payment preview</p>
                {selectedInvoice ? (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between"><span className="text-slate-400">Invoice</span><span>{selectedInvoice.invoice_number}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Balance due</span><span className="font-semibold">{selectedInvoice.currency} {formatMoney(selectedInvoiceBalanceDue)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Tendered</span><span>{selectedInvoice.currency} {formatMoney(tenderedAmount)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Applied</span><span className="text-emerald-300">{selectedInvoice.currency} {formatMoney(appliedAmount)}</span></div>
                    {changeAmount > 0 && (
                      <div className="flex justify-between"><span className="text-slate-400">Change due</span><span className="text-amber-300 font-semibold">{selectedInvoice.currency} {formatMoney(changeAmount)}</span></div>
                    )}
                    <div className="flex justify-between border-t border-sky-400/20 pt-2 mt-2">
                      <span className="text-slate-400">Outcome</span>
                      <span className="font-semibold">{paymentOutcome}</span>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 text-sky-100/80">Choose an invoice to see payment preview.</p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" loading={savingPayment} loadingText="Saving..." className="rounded-full px-6 py-3 shadow-[0_18px_40px_rgba(59,130,246,0.28)]">
                  Record Payment
                </Button>
                {paymentSuccess && <p className="text-sm text-emerald-300">{paymentSuccess}</p>}
              </div>
            </form>
          </Card>
        )}
      </div>

      {/* Right column: Lists */}
      <div className="space-y-6">
        {showPatientList && (
          <Card className="border-white/10 bg-slate-900/75">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Recent Patients</h3>
              <span className="text-xs text-slate-400">{loadingDashboard ? 'Loading...' : `${recentPatients.length} loaded`}</span>
            </div>
            <div className="space-y-2">
              {recentPatients.map((patient) => (
                <div key={patient.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition duration-300 hover:border-sky-400/30 hover:bg-white/[0.07]">
                  <p className="font-medium text-white">{patient.first_name} {patient.last_name}</p>
                  <p className="text-sm text-slate-300">{patient.phone}</p>
                  <p className="text-xs text-slate-500">{patient.email}</p>
                </div>
              ))}
              {recentPatients.length === 0 && !loadingDashboard && (
                <p className="text-sm text-slate-400">No patients registered yet.</p>
              )}
            </div>
          </Card>
        )}

        {showSampleList && (
          <Card className="border-white/10 bg-slate-900/75">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Recent Samples</h3>
              <span className="text-xs text-slate-400">{recentSamples.length} loaded</span>
            </div>
            <div className="space-y-2">
              {recentSamples.map((sample) => {
                const patient = (sample as any).Patient || (sample as any).patient;
                return (
                  <div key={sample.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition duration-300 hover:border-sky-400/30 hover:bg-white/[0.07]">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-white">{sample.sample_id}</p>
                        <p className="text-sm text-slate-400">{patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown'} · {sample.specimen_type}</p>
                        <p className="text-xs text-slate-500">{sample.priority}</p>
                      </div>
                      <span className={`rounded-full px-3 py-1 text-xs ${sample.priority === 'STAT' ? 'bg-rose-500/20 text-rose-300' : sample.priority === 'Urgent' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-700/40 text-slate-300'}`}>
                        {sample.current_status}
                      </span>
                    </div>
                  </div>
                );
              })}
              {recentSamples.length === 0 && !loadingDashboard && (
                <p className="text-sm text-slate-400">No samples registered yet.</p>
              )}
            </div>
          </Card>
        )}

        {showInvoiceList && (
          <Card className="border-white/10 bg-slate-900/75">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white">Recent Invoices</h3>
              <span className="text-xs text-slate-400">{recentInvoices.length} loaded</span>
            </div>
            <div className="space-y-2">
              {recentInvoices.map((invoice) => {
                const patient = (invoice as any).Patient || (invoice as any).patient;
                const statusStyle =
                  invoice.status === 'Paid'
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : invoice.status === 'Partially Paid'
                      ? 'bg-sky-500/15 text-sky-300'
                      : invoice.status === 'Cancelled'
                        ? 'bg-slate-600/30 text-slate-400'
                        : 'bg-amber-500/15 text-amber-300';
                return (
                  <div key={invoice.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 transition duration-300 hover:border-sky-400/30 hover:bg-white/[0.07]">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">{invoice.invoice_number}</p>
                        <p className="text-sm text-slate-400 truncate">{patient ? `${patient.first_name} ${patient.last_name}` : 'Unknown'}</p>
                        <p className="text-xs text-slate-500">
                          Total {invoice.currency} {formatMoney(invoice.total_amount)} · Due {invoice.currency} {formatMoney(invoice.balance_due)}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs ${statusStyle}`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                );
              })}
              {recentInvoices.length === 0 && !loadingDashboard && (
                <p className="text-sm text-slate-400">No invoices yet.</p>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

// Small sub-components for cleanliness
const SectionHeader: React.FC<{
  label: string;
  title: string;
  chipText: string;
  chipColor: 'emerald' | 'sky' | 'amber';
}> = ({ label, title, chipText, chipColor }) => {
  const dotColors = { emerald: 'bg-emerald-400', sky: 'bg-sky-400', amber: 'bg-amber-400' };
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-sky-300/70">{label}</p>
        <h3 className="mt-2 text-2xl font-semibold text-white">{title}</h3>
      </div>
      <div className="section-chip">
        <span className={`h-2 w-2 rounded-full ${dotColors[chipColor]}`} />
        {chipText}
      </div>
    </div>
  );
};

const SummaryCard: React.FC<{ label: string; value: number; color: 'sky' | 'amber' | 'emerald' | 'rose' }> = ({ label, value, color }) => {
  const textColors = { sky: 'text-sky-300', amber: 'text-amber-300', emerald: 'text-emerald-300', rose: 'text-rose-300' };
  return (
    <Card className="border-white/10 bg-slate-900/75">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${textColors[color]}`}>{value}</p>
    </Card>
  );
};
