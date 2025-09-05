export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiError {
  success: boolean;
  statusCode: number;
  message: string;
  error: string;
}

// Auth types
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    username: string;
  };
}

// Client types
export enum ClientType {
  PROSPECT = 'PROSPECT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export interface Client {
  id: number;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  contractStartDate: string;
  contractDurationDays: number;
  type: ClientType;
  lockedAmountNrs: number;
  advanceAmountNrs: number;
  dueAmountNrs: number;
  contractPdfPath?: string;
  createdAt: string;
  updatedAt: string;
  incomes?: Income[];
  staffWorks?: StaffWork[];
}

export interface CreateClientRequest {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  contractStartDate: string;
  contractDurationDays: number;
  type?: ClientType;
  lockedAmountNrs?: number;
  advanceAmountNrs?: number;
  dueAmountNrs?: number;
}

export interface AdjustAccountRequest {
  lockedDelta?: number;
  advanceDelta?: number;
  dueDelta?: number;
}

// Staff types
export enum StaffType {
  MONTHLY = 'MONTHLY',
  WORK_BASIS = 'WORK_BASIS',
}

export interface Staff {
  id: number;
  name: string;
  type: StaffType;
  monthlySalaryNrs?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  staffWorks?: StaffWork[];
  expenses?: Expense[];
}

export interface CreateStaffRequest {
  name: string;
  type: StaffType;
  monthlySalaryNrs?: number;
  isActive?: boolean;
}

export interface MonthlyPayoutRequest {
  amountNrs: number;
  note?: string;
  paidAt?: string;
}

// Work Item types
export interface WorkItem {
  id: number;
  title: string;
  rateNrs: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  staffWorks?: StaffWork[];
}

export interface CreateWorkItemRequest {
  title: string;
  rateNrs: number;
  isActive?: boolean;
}

// Staff Work types
export interface StaffWork {
  id: number;
  staffId: number;
  workItemId?: number;
  clientId?: number;
  quantity?: number;
  unitRateNrs?: number;
  performedAt: string;
  title?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  staff?: Staff;
  workItem?: WorkItem;
  client?: Client;
}

export interface CreateStaffWorkRequest {
  staffId: number;
  workItemId?: number;
  clientId?: number;
  quantity?: number;
  unitRateNrs?: number;
  performedAt?: string;
  title?: string;
  description?: string;
}

// Income types
export interface Income {
  id: number;
  clientId: number;
  amountNrs: number;
  note?: string;
  receivedAt: string;
  createdAt: string;
  updatedAt: string;
  client?: Client;
}

export interface CreateIncomeRequest {
  clientId: number;
  amountNrs: number;
  note?: string;
  receivedAt?: string;
}

// Expense types
export enum ExpenseSource {
  STAFF_MONTHLY = 'STAFF_MONTHLY',
  STAFF_WORK_BASIS = 'STAFF_WORK_BASIS',
  GENERAL = 'GENERAL',
}

export interface Expense {
  id: number;
  staffId?: number;
  amountNrs: number;
  source: ExpenseSource;
  note?: string;
  paidAt: string;
  createdAt: string;
  updatedAt: string;
  staff?: Staff;
}

export interface CreateExpenseRequest {
  staffId?: number;
  amountNrs: number;
  source: ExpenseSource;
  note?: string;
  paidAt?: string;
}

// Account Summary types
export interface AccountSummary {
  totals: {
    totalIncomeNrs: number;
    totalExpenseNrs: number;
    netNrs: number;
  };
  incomeByClient: {
    clientId: number;
    name: string;
    total: number;
  }[];
  expenseBySource: {
    source: ExpenseSource;
    total: number;
  }[];
  counts: {
    activeClients: number;
    activeStaff: number;
    openContracts: number;
    contractsExpiringIn30Days: number;
    contractsExpiringIn7Days: number;
    contractsExpiringIn1Day: number;
  };
}

// Staff Work Payout Preview types
export interface StaffWorkPayoutPreview {
  staffId: number;
  staffName: string;
  totalAmount: number;
  works: {
    id: number;
    workItem: string;
    client: string;
    quantity: number;
    unitRate: number;
    total: number;
    performedAt: string;
  }[];
}

// Reminder types
export enum ReminderType {
  CONTRACT_EXPIRY = 'CONTRACT_EXPIRY',
  STAFF_CONTRACT = 'STAFF_CONTRACT',
  PAYMENT_DUE = 'PAYMENT_DUE',
  GENERAL = 'GENERAL'
}

export enum ReminderPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface AdminReminder {
  id: number;
  title: string;
  description?: string | null;
  type: ReminderType;
  priority: ReminderPriority;
  dueDate: string;
  isCompleted: boolean;
  
  clientId?: number | null;
  staffId?: number | null;
  
  client?: Client | null;
  staff?: Staff | null;
  
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderRequest {
  title: string;
  description?: string;
  type: ReminderType;
  priority?: ReminderPriority;
  dueDate: string;
  clientId?: number;
  staffId?: number;
}

// Influencer Management Types
export enum SocialPlatform {
  INSTAGRAM = 'INSTAGRAM',
  FACEBOOK = 'FACEBOOK',
  YOUTUBE = 'YOUTUBE',
  TIKTOK = 'TIKTOK',
  TWITTER = 'TWITTER',
  LINKEDIN = 'LINKEDIN',
  SNAPCHAT = 'SNAPCHAT',
  PINTEREST = 'PINTEREST',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH = 'CASH',
  CHEQUE = 'CHEQUE',
  DIGITAL_WALLET = 'DIGITAL_WALLET',
  CREDIT_CARD = 'CREDIT_CARD',
  OTHER = 'OTHER',
}

export interface SocialHandle {
  id: number;
  platform: SocialPlatform;
  handle: string;
  url?: string;
  followers?: number;
  isVerified: boolean;
  isPrimary: boolean;
}

export interface Influencer {
  id: number;
  name: string;
  email: string;
  contactNumber?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  socialHandles: SocialHandle[];
  collaborations?: Collaboration[];
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInfluencerRequest {
  name: string;
  email: string;
  contactNumber?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
  socialHandles?: CreateSocialHandleRequest[];
}

export interface CreateSocialHandleRequest {
  platform: SocialPlatform;
  handle: string;
  url?: string;
  followers?: number;
  isVerified?: boolean;
  isPrimary?: boolean;
}

export interface Collaboration {
  id: number;
  influencerId: number;
  campaignName: string;
  description?: string;
  deliverables: string;
  agreedAmountNrs: number;
  startDate: string;
  endDate: string;
  status: string;
  notes?: string;
  influencer?: Influencer;
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCollaborationRequest {
  influencerId: number;
  campaignName: string;
  description?: string;
  deliverables: string;
  agreedAmountNrs: number;
  startDate: string;
  endDate: string;
  status?: string;
  notes?: string;
}

export interface Payment {
  id: number;
  influencerId: number;
  collaborationId?: number;
  amountNrs: number;
  status: PaymentStatus;
  paymentMethod: PaymentMethod;
  transactionId?: string;
  paymentDate?: string;
  dueDate?: string;
  notes?: string;
  influencer?: Influencer;
  collaboration?: Collaboration;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentRequest {
  influencerId: number;
  collaborationId?: number;
  amountNrs: number;
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  transactionId?: string;
  paymentDate?: string;
  dueDate?: string;
  notes?: string;
}

export interface SearchInfluencersRequest {
  query?: string;
  platform?: SocialPlatform;
  isActive?: boolean;
}

export interface FilterCollaborationsRequest {
  campaignName?: string;
  status?: string;
  influencerId?: number;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface FilterPaymentsRequest {
  status?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  influencerId?: number;
  collaborationId?: number;
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
}

export interface PaymentReportRequest {
  reportType: string;
  influencerId?: number;
  startDate?: string;
  endDate?: string;
}

export interface InfluencerStats {
  influencer: Influencer;
  stats: {
    totalCollaborations: number;
    totalEarnings: number;
    pendingPayments: number;
    overduePayments: number;
  };
}