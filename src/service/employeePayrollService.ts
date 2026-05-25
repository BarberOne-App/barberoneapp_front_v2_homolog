import api from "./api";

export type EmployeePaymentStatus = "pending" | "partial" | "paid" | "empty";

export interface EmployeeVale {
  id: string;
  employeeId: string;
  employeeName?: string | null;
  valor: number;
  descricao?: string | null;
  motivo?: string | null;
  observacao?: string | null;
  data: string;
  createdAt?: string;
  createdByName?: string | null;
}

export interface EmployeePayment {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  salarioFixo: number;
  baseSalary: number;
  commission: number;
  totalVales: number;
  liquido: number;
  netAmount: number;
  paidAt: string;
  paidByName?: string | null;
}

export interface EmployeePayrollRow {
  employeeId: string;
  employeeName: string;
  employeeEmail?: string | null;
  photoUrl?: string | null;
  role: string;
  roleLabel: string;
  functionType: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  baseSalary: number;
  salarioFixo: number;
  commission: number;
  commissions: number;
  totalVales: number;
  discounts: number;
  grossAmount: number;
  totalToReceive: number;
  netAmount: number;
  liquido: number;
  paidAmount: number;
  amountDue: number;
  status: EmployeePaymentStatus;
  paidAt?: string | null;
  paymentId?: string | null;
  appointmentsCount: number;
  servicesCount: number;
  vales: EmployeeVale[];
  payments: EmployeePayment[];
  paymentHistory: EmployeePayment[];
}

export interface PayrollSummaryResponse {
  periodStart: string;
  periodEnd: string;
  totals: {
    employees: number;
    grossAmount: number;
    commission: number;
    totalVales: number;
    netAmount: number;
    paidAmount: number;
    amountDue: number;
    pending: number;
    partial: number;
    paid: number;
  };
  items: EmployeePayrollRow[];
}

export interface PayrollSummaryParams {
  periodStart: string;
  periodEnd: string;
  employeeId?: string;
  role?: string;
  status?: string;
}

export interface CreateEmployeeValePayload {
  employeeId: string;
  valor: number;
  data: string;
  descricao: string;
  observacao?: string | null;
}

export interface CreateEmployeePaymentPayload {
  employeeId: string;
  period: "semanal" | "quinzenal" | "mensal";
  periodStart: string;
  periodEnd: string;
}

export async function getEmployeePayrollSummary(params: PayrollSummaryParams) {
  const response = await api.get<PayrollSummaryResponse>("/employeePayments/summary", {
    params,
  });

  return response.data;
}

export async function createEmployeeVale(data: CreateEmployeeValePayload) {
  const response = await api.post<EmployeeVale>("/employeeVales", data);

  return response.data;
}

export async function createEmployeePayment(data: CreateEmployeePaymentPayload) {
  const response = await api.post<EmployeePayment>("/employeePayments", data);

  return response.data;
}
