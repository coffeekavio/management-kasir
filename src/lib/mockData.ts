import { Transaction, Product, User, ChartData, StockOpname } from '@/types';

export const mockCashiers: User[] = [
  {
    id: '1',
    name: 'Ahmad',
    email: 'ahmad@kasir.com',
    role: 'kasir',
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Budi',
    email: 'budi@kasir.com',
    role: 'kasir',
    createdAt: new Date('2024-01-20'),
  },
  {
    id: '3',
    name: 'Citra',
    email: 'citra@kasir.com',
    role: 'kasir',
    createdAt: new Date('2024-02-01'),
  },
];

export const mockProducts: Product[] = [
  {
    id: 'p1',
    name: 'Beras Premium 5kg',
    sku: 'BRP-001',
    price: 75000,
    cost: 45000,
    stock: 25,
    category: 'Bahan Pokok',
  },
  {
    id: 'p2',
    name: 'Minyak Goreng 2L',
    sku: 'MGO-001',
    price: 35000,
    cost: 20000,
    stock: 5,
    category: 'Minyak',
  },
  {
    id: 'p3',
    name: 'Gula Pasir 1kg',
    sku: 'GPS-001',
    price: 12000,
    cost: 8000,
    stock: 100,
    category: 'Bahan Pokok',
  },
  {
    id: 'p4',
    name: 'Telur 30 butir',
    sku: 'TLR-001',
    price: 45000,
    cost: 28000,
    stock: 2,
    category: 'Ayam',
  },
  {
    id: 'p5',
    name: 'Susu UHT 1L',
    sku: 'SUH-001',
    price: 15000,
    cost: 9000,
    stock: 50,
    category: 'Susu',
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: 'txn-001',
    date: new Date('2024-05-05'),
    amount: 150000,
    paymentMethod: 'cash',
    items: [
      { id: 'i1', productName: 'Beras Premium 5kg', quantity: 2, price: 75000, total: 150000 },
    ],
    cashierId: '1',
    cashierName: 'Ahmad',
  },
  {
    id: 'txn-002',
    date: new Date('2024-05-05'),
    amount: 47000,
    paymentMethod: 'card',
    items: [
      { id: 'i2', productName: 'Minyak Goreng 2L', quantity: 1, price: 35000, total: 35000 },
      { id: 'i3', productName: 'Gula Pasir 1kg', quantity: 1, price: 12000, total: 12000 },
    ],
    cashierId: '2',
    cashierName: 'Budi',
  },
  {
    id: 'txn-003',
    date: new Date('2024-05-06'),
    amount: 90000,
    paymentMethod: 'cash',
    items: [
      { id: 'i4', productName: 'Telur 30 butir', quantity: 2, price: 45000, total: 90000 },
    ],
    cashierId: '1',
    cashierName: 'Ahmad',
  },
  {
    id: 'txn-004',
    date: new Date('2024-05-06'),
    amount: 75000,
    paymentMethod: 'digital',
    items: [
      { id: 'i5', productName: 'Beras Premium 5kg', quantity: 1, price: 75000, total: 75000 },
    ],
    cashierId: '3',
    cashierName: 'Citra',
  },
];

export const mockChartData: ChartData[] = [
  { date: '1 Mei', revenue: 500000, transactions: 12 },
  { date: '2 Mei', revenue: 620000, transactions: 15 },
  { date: '3 Mei', revenue: 450000, transactions: 10 },
  { date: '4 Mei', revenue: 780000, transactions: 18 },
  { date: '5 Mei', revenue: 650000, transactions: 16 },
  { date: '6 Mei', revenue: 890000, transactions: 21 },
  { date: '7 Mei', revenue: 720000, transactions: 17 },
];

export const mockStockOpname: StockOpname = {
  id: 'so-001',
  cafe_id: 'cafe-001',
  date: new Date('2024-05-07'),
  products: [
    {
      ingredientId: 'p1',
      ingredientName: 'Beras Premium 5kg',
      unit: 'kg',
      systemStock: 25,
      physicalStock: 24,
      difference: -1,
      cost: 45000,
    },
    {
      ingredientId: 'p2',
      ingredientName: 'Minyak Goreng 2L',
      unit: 'L',
      systemStock: 5,
      physicalStock: 5,
      difference: 0,
      cost: 20000,
    },
    {
      ingredientId: 'p3',
      ingredientName: 'Gula Pasir 1kg',
      unit: 'kg',
      systemStock: 100,
      physicalStock: 102,
      difference: 2,
      cost: 8000,
    },
    {
      ingredientId: 'p4',
      ingredientName: 'Telur 30 butir',
      unit: 'pcs',
      systemStock: 2,
      physicalStock: 2,
      difference: 0,
      cost: 28000,
    },
  ],
  totalValue: 0,
  notes: 'Pemeriksaan rutin mingguan',
};
