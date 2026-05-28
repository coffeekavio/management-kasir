// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'supervisor' | 'kasir'; 
  cafe_id?: string;
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

// Transaction types
export interface Transaction {
  id: string;
  date: Date;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'digital';
  items: TransactionItem[];
  cashierId: string;
  cashierName: string;
}

export interface TransactionItem {
  id: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

// Product types
export interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  cost: number;
  stock: number;
  category: string;
}

// Dashboard Analytics types
export interface DashboardStats {
  totalRevenue: number;
  totalTransactions: number;
  totalProducts: number;
  lowStockItems: number;
}

export interface ChartData {
  date: string;
  revenue: number;
  transactions: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface Ingredient {
  id: string;
  name: string;
  stock: number;
  unit: string;
  cost?: number; 
}

// Stock Opname types
export interface StockOpname {
  id: string;
  cafe_id: string;
  date: Date | string;
  products: StockOpnameItem[];
  totalValue: number;
  notes: string;
}

// Stock Opname from Supabase
export interface StockOpnameFromDB {
  id: string;
  cafe_id: string;
  created_at: string;
  total_value: number;
  notes: string;
}

export interface StockOpnameItemFromDB {
  id: string;
  stock_opname_id: string;
  ingredient_id: string;
  ingredient_name: string;
  unit: string;
  system_stock: number;
  physical_stock: number;
  difference: number;
  cost: number;
}

export interface StockOpnameItem {
  ingredientId: string;
  ingredientName: string;
  unit: string;
  systemStock: number;
  physicalStock: number;
  difference: number;
  cost: number;
}

// Voucher types
export interface Voucher {
  id: string;
  cafe_id: string;
  name: string;
  discount_percentage: number;
  min_purchase: number;
  start_date: string | Date;
  end_date: string | Date;
  is_active: boolean;
  created_at?: string;
}

export interface VoucherCreatePayload {
  cafe_id: string;
  name: string;
  discount_percentage: number;
  min_purchase: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export interface VoucherUpdatePayload {
  name?: string;
  discount_percentage?: number;
  min_purchase?: number;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}