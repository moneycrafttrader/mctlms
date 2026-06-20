import { fetchApi } from '@/lib/api-client';
import { API_ROUTES } from '@/lib/constants';

export interface PaymentPlan {
  id: string;
  student_id: string;
  course_id: string;
  total_amount: number;
  installment_count: number;
  status: string;
  notes?: string;
  created_at: string;
  course?: { id: string; name: string };
  installments: PaymentInstallment[];
}

export interface PaymentInstallment {
  id: string;
  payment_plan_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: 'pending' | 'paid' | 'overdue' | 'waived';
  paid_at?: string;
  payment_id?: string;
}

/**
 * Fetch own payment plans with installments (student dashboard).
 * GET /payments/my
 */
export async function getMyPaymentPlans(token?: string) {
  return fetchApi<PaymentPlan[]>(`${API_ROUTES.PAYMENTS.MY}`, { token });
}

/**
 * Create a new payment plan with EMI installments.
 */
export async function createPaymentPlan(
  data: {
    studentId: string;
    courseId: string;
    totalAmount: number;
    numberOfInstallments: number;
    startDate?: string;
  },
  token?: string,
) {
  return fetchApi<PaymentPlan>(`${API_ROUTES.PAYMENTS.PLANS}`, {
    method: 'POST',
    body: JSON.stringify(data),
    token,
  });
}

/**
 * Fetch all payment plans and installments for a student.
 */
export async function getStudentPlans(studentId: string, token?: string) {
  return fetchApi<PaymentPlan[]>(
    `${API_ROUTES.PAYMENTS.PLANS}/student/${studentId}`,
    { token },
  );
}

/**
 * Mark an installment as paid. Backend auto-generates receipt PDF + email.
 */
export async function markInstallmentPaid(
  installmentId: string,
  data: { paymentMethod: string; transactionId?: string },
  token?: string,
) {
  return fetchApi<any>(
    `${API_ROUTES.PAYMENTS.INSTALLMENTS}/${installmentId}/pay`,
    {
      method: 'PATCH',
      body: JSON.stringify(data),
      token,
    },
  );
}
