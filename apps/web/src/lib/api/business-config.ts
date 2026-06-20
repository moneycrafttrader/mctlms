import { fetchApi } from '@/lib/api-client';

export interface BusinessConfig {
  id: string;
  business_name: string;
  address_line_1: string;
  address_line_2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  gstin?: string;
  pan?: string;
  email: string;
  phone: string;
  logo_url?: string;
  signature_url?: string;
  invoice_prefix: string;
  receipt_prefix: string;
  current_financial_year: string;
  next_invoice_number: number;
  next_receipt_number: number;
}

export async function getBusinessConfig(token?: string) {
  return fetchApi<BusinessConfig>('/business-config', { token });
}

export async function updateBusinessConfig(
  data: Partial<Omit<BusinessConfig, 'id' | 'next_invoice_number' | 'next_receipt_number'>>,
  token?: string,
) {
  return fetchApi<BusinessConfig>('/business-config', {
    method: 'PUT',
    body: JSON.stringify(data),
    token,
  });
}
