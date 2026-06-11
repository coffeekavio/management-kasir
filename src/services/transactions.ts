import { api } from './api';
import { Transaction } from '@/types';

export interface TransactionFromAPI {
  id: string;
  receipt_number: string;
  total_amount: number;
  payment_method: string;
  status: string;
  created_at: string;
}

export interface TransactionDetailFromAPI {
  id: string;
  receipt_number: string;
  cafe_id: string;
  cashier_id: string;
  member_id: string | null;
  subtotal: number;
  discount_amount: number;
  voucher_discount_amount: number;
  total_amount: number;
  payment_method: string;
  amount_tendered: number;
  change_amount: number;
  status: string;
  created_at: string;
  items: Array<{
    transaction_id: string;
    menu_id: string;
    quantity: number;
    price: number;
    item_discount: number;
    subtotal: number;
  }>;
}

// GET semua transaksi
export const getTransactions = async (cafe_id?: string) => {
  const params = cafe_id ? { cafe_id } : {};
  const response = await api.get('/api/transactions/', { params });
  return response.data.data as TransactionFromAPI[];
};

// GET detail transaksi
export const getTransactionDetail = async (transaction_id: string) => {
  const response = await api.get(`/api/transactions/${transaction_id}`);
  return response.data.data as TransactionDetailFromAPI;
};

// DELETE transaksi
export const deleteTransaction = async (transaction_id: string) => {
  const response = await api.delete(`/api/transactions/${transaction_id}`);
  return response.data;
};

// UPDATE status transaksi (jika diperlukan)
export const updateTransactionStatus = async (
  transaction_id: string,
  status: string
) => {
  const response = await api.patch(`/api/transactions/${transaction_id}`, {
    status,
  });
  return response.data;
};

export const updateTransaction = async (
  transaction_id: string,
  updates: {
    discount_amount?: number;
    voucher_discount_amount?: number;
    payment_method?: string;
    amount_tendered?: number;
    status?: string;
  }
) => {
  const response = await api.patch(`/api/transactions/${transaction_id}`, updates);
  return response.data;
};