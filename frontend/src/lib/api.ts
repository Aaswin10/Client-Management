import axios, { type AxiosResponse } from 'axios';
import type {
  ApiResponse,
  LoginRequest,
  LoginResponse,
  Client,
  CreateClientRequest,
  AdjustAccountRequest,
  Staff,
  CreateStaffRequest,
  MonthlyPayoutRequest,
  WorkItem,
  CreateWorkItemRequest,
  StaffWork,
  CreateStaffWorkRequest,
  Income,
  CreateIncomeRequest,
  Expense,
  CreateExpenseRequest,
  AccountSummary,
  StaffWorkPayoutPreview,
  AdminReminder,
  CreateReminderRequest,
} from '../types/api';

const API_BASE_URL = `${import.meta.env.VITE_API_URL}`;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  login: (data: LoginRequest): Promise<AxiosResponse<ApiResponse<LoginResponse>>> =>
    api.post('/auth/login', data),
};

// Clients API
export const clientsApi = {
  getAll: (): Promise<AxiosResponse<ApiResponse<Client[]>>> =>
    api.get('/clients'),
  
  getById: (id: number): Promise<AxiosResponse<ApiResponse<Client>>> =>
    api.get(`/clients/${id}`),
  
  create: (data: CreateClientRequest, file?: File): Promise<AxiosResponse<ApiResponse<Client>>> => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });
    if (file) {
      formData.append('contractPdf', file);
    }
    return api.post('/clients', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  update: (id: number, data: Partial<CreateClientRequest>, file?: File): Promise<AxiosResponse<ApiResponse<Client>>> => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });
    if (file) {
      formData.append('contractPdf', file);
    }
    return api.patch(`/clients/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  
  delete: (id: number): Promise<AxiosResponse<ApiResponse<Client>>> =>
    api.delete(`/clients/${id}`),
  
  adjustAccount: (id: number, data: AdjustAccountRequest): Promise<AxiosResponse<ApiResponse<Client>>> =>
    api.post(`/clients/${id}/account/adjust`, data),
};

// Staff API
export const staffApi = {
  getAll: (): Promise<AxiosResponse<ApiResponse<Staff[]>>> =>
    api.get('/staff'),
  
  getById: (id: number, params?: { startDate?: string; endDate?: string }): Promise<AxiosResponse<ApiResponse<Staff>>> =>
    api.get(`/staff/${id}`, { params }),
  
  create: (data: CreateStaffRequest): Promise<AxiosResponse<ApiResponse<Staff>>> =>
    api.post('/staff', data),
  
  update: (id: number, data: Partial<CreateStaffRequest>): Promise<AxiosResponse<ApiResponse<Staff>>> =>
    api.patch(`/staff/${id}`, data),
  
  delete: (id: number): Promise<AxiosResponse<ApiResponse<Staff>>> =>
    api.delete(`/staff/${id}`),
  
  monthlyPayout: (id: number, data: MonthlyPayoutRequest): Promise<AxiosResponse<ApiResponse<Expense>>> =>
    api.post(`/staff/${id}/payout/monthly`, data),
};

// Work Items API
export const workItemsApi = {
  getAll: (): Promise<AxiosResponse<ApiResponse<WorkItem[]>>> =>
    api.get('/work-items'),
  
  getById: (id: number): Promise<AxiosResponse<ApiResponse<WorkItem>>> =>
    api.get(`/work-items/${id}`),
  
  create: (data: CreateWorkItemRequest): Promise<AxiosResponse<ApiResponse<WorkItem>>> =>
    api.post('/work-items', data),
  
  update: (id: number, data: Partial<CreateWorkItemRequest>): Promise<AxiosResponse<ApiResponse<WorkItem>>> =>
    api.patch(`/work-items/${id}`, data),
  
  delete: (id: number): Promise<AxiosResponse<ApiResponse<WorkItem>>> =>
    api.delete(`/work-items/${id}`),
};

// Staff Works API
export const staffWorksApi = {
  getAll: (): Promise<AxiosResponse<ApiResponse<StaffWork[]>>> =>
    api.get('/staff-works'),
  
  getById: (id: number): Promise<AxiosResponse<ApiResponse<StaffWork>>> =>
    api.get(`/staff-works/${id}`),
  
  create: (data: CreateStaffWorkRequest): Promise<AxiosResponse<ApiResponse<StaffWork>>> =>
    api.post('/staff-works', data),
  
  update: (id: number, data: Partial<CreateStaffWorkRequest>): Promise<AxiosResponse<ApiResponse<StaffWork>>> =>
    api.patch(`/staff-works/${id}`, data),
  
  delete: (id: number): Promise<AxiosResponse<ApiResponse<StaffWork>>> =>
    api.delete(`/staff-works/${id}`),
};

// Income API
export const incomeApi = {
  getAll: (): Promise<AxiosResponse<ApiResponse<Income[]>>> =>
    api.get('/income'),
  
  getById: (id: number): Promise<AxiosResponse<ApiResponse<Income>>> =>
    api.get(`/income/${id}`),
  
  create: (data: CreateIncomeRequest): Promise<AxiosResponse<ApiResponse<Income>>> =>
    api.post('/income', data),
  
  update: (id: number, data: Partial<CreateIncomeRequest>): Promise<AxiosResponse<ApiResponse<Income>>> =>
    api.patch(`/income/${id}`, data),
  
  delete: (id: number): Promise<AxiosResponse<ApiResponse<Income>>> =>
    api.delete(`/income/${id}`),
};

// Expenses API
export const expensesApi = {
  getAll: (): Promise<AxiosResponse<ApiResponse<Expense[]>>> =>
    api.get('/expenses'),
  
  getById: (id: number): Promise<AxiosResponse<ApiResponse<Expense>>> =>
    api.get(`/expenses/${id}`),
  
  create: (data: CreateExpenseRequest): Promise<AxiosResponse<ApiResponse<Expense>>> =>
    api.post('/expenses', data),
  
  update: (id: number, data: Partial<CreateExpenseRequest>): Promise<AxiosResponse<ApiResponse<Expense>>> =>
    api.patch(`/expenses/${id}`, data),
  
  delete: (id: number): Promise<AxiosResponse<ApiResponse<Expense>>> =>
    api.delete(`/expenses/${id}`),
};

// Accounts API
export const accountsApi = {
  getSummary: (): Promise<AxiosResponse<ApiResponse<AccountSummary>>> =>
    api.get('/accounts/summary'),
  
  getStaffWorkPayoutPreview: (
    month: number,
    year: number,
    staffId?: number
  ): Promise<AxiosResponse<ApiResponse<StaffWorkPayoutPreview[]>>> =>
    api.get('/accounts/staff-work-payout-preview', {
      params: { month, year, ...(staffId && { staffId }) },
    }),
};

// Reminders API
export const remindersApi = {
  // Get dry run reminders (for testing)
  getDryRunReminders: () => api.get<ApiResponse<{
    clientReminders: Client[];
    activeReminders: AdminReminder[];
  }>>('/reminders/dry-run'),

  // Get active reminders
  getActive: () => api.get<ApiResponse<AdminReminder[]>>('/reminders/active'),

  // Create a new reminder
  create: (data: CreateReminderRequest) => 
    api.post<ApiResponse<AdminReminder>>('/reminders', data),

  // Update an existing reminder
  update: (id: number, data: Partial<CreateReminderRequest>) => 
    api.patch<ApiResponse<AdminReminder>>(`/reminders/${id}`, data),

  // Delete a reminder
  delete: (id: number) => 
    api.delete<ApiResponse<AdminReminder>>(`/reminders/${id}`),

  // Mark a reminder as completed
  markAsCompleted: (id: number) => 
    api.patch<ApiResponse<AdminReminder>>(`/reminders/${id}/complete`),
};