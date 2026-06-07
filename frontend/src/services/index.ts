import apiClient from './api.js';
import { DoctorDashboardSummary, LabDashboardSummary, Patient, ReceptionDashboardSummary, ReportSummary } from '../types/index.js';

export const authService = {
  register: async (data: any) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  getProfile: async () => {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  },

  changePassword: async (data: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }) => {
    const response = await apiClient.put('/auth/password', data);
    return response.data;
  },
};

export const patientService = {
  createPatient: async (data: Omit<Patient, 'id'>) => {
    const response = await apiClient.post('/patients', data);
    return response.data;
  },

  getPatients: async (search?: string, limit = 10, offset = 0) => {
    const response = await apiClient.get('/patients', {
      params: { search, limit, offset },
    });
    return response.data;
  },

  searchPatients: async (query: string, limit = 20): Promise<{ success: boolean; data: Patient[] }> => {
    const response = await apiClient.get('/patients', {
      params: { search: query, limit, offset: 0 },
    });
    return response.data;
  },

  getPatient: async (id: number) => {
    const response = await apiClient.get(`/patients/${id}`);
    return response.data;
  },

  updatePatient: async (id: number, data: Partial<Patient>) => {
    const response = await apiClient.put(`/patients/${id}`, data);
    return response.data;
  },
};

export const sampleService = {
  createSample: async (data: any) => {
    const response = await apiClient.post('/samples', data);
    return response.data;
  },

  getSamples: async (filters?: any) => {
    const response = await apiClient.get('/samples', { params: filters });
    return response.data;
  },

  getSample: async (id: number) => {
    const response = await apiClient.get(`/samples/${id}`);
    return response.data;
  },

  trackSample: async (sample_id: string) => {
    const response = await apiClient.get(`/samples/track/${sample_id}`);
    return response.data;
  },

  updateSampleStatus: async (id: number, data: any) => {
    const response = await apiClient.put(`/samples/${id}/status`, data);
    return response.data;
  },
};

export const testService = {
  getTests: async (filters?: any) => {
    const response = await apiClient.get('/tests', { params: filters });
    return response.data;
  },

  getTest: async (id: number) => {
    const response = await apiClient.get(`/tests/${id}`);
    return response.data;
  },
};

export const receptionService = {
  getDashboard: async () => {
    const response = await apiClient.get('/reception/dashboard');
    return response.data as { success: boolean; data: ReceptionDashboardSummary };
  },
};

export const labService = {
  getDashboard: async () => {
    const response = await apiClient.get('/lab/dashboard');
    return response.data as { success: boolean; data: LabDashboardSummary };
  },
};

export const doctorService = {
  getDashboard: async () => {
    const response = await apiClient.get('/doctor/dashboard');
    return response.data as { success: boolean; data: DoctorDashboardSummary };
  },
};

export const resultService = {
  createResult: async (data: any) => {
    const response = await apiClient.post('/results', data);
    return response.data;
  },

  getResults: async (filters?: any) => {
    const response = await apiClient.get('/results', { params: filters });
    return response.data;
  },

  getResult: async (id: number) => {
    const response = await apiClient.get(`/results/${id}`);
    return response.data;
  },

  updateResult: async (id: number, data: any) => {
    const response = await apiClient.put(`/results/${id}`, data);
    return response.data;
  },

  approveResult: async (id: number, data?: { final_status?: string; doctor_note?: string }) => {
    const response = await apiClient.put(`/results/${id}/approve`, data || {});
    return response.data;
  },

  rejectResult: async (id: number, doctor_note?: string) => {
    const response = await apiClient.put(`/results/${id}/reject`, { doctor_note });
    return response.data;
  },
};

export const invoiceService = {
  createInvoice: async (data: any) => {
    const response = await apiClient.post('/invoices', data);
    return response.data;
  },

  getInvoices: async (filters?: any) => {
    const response = await apiClient.get('/invoices', { params: filters });
    return response.data;
  },

  getInvoice: async (id: number) => {
    const response = await apiClient.get(`/invoices/${id}`);
    return response.data;
  },

  updateInvoiceStatus: async (id: number, status: string) => {
    const response = await apiClient.put(`/invoices/${id}/status`, { status });
    return response.data;
  },

  recordPayment: async (
    id: number,
    data: {
      payer_name: string;
      amount_tendered: number;
      payment_method: string;
      reference_number?: string;
      notes?: string;
    }
  ) => {
    const response = await apiClient.post(`/invoices/${id}/payments`, data);
    return response.data;
  },
};

export const reportService = {
  getSummary: async (): Promise<{ success: boolean; data: ReportSummary }> => {
    const response = await apiClient.get('/reports/summary');
    return response.data;
  },
};
