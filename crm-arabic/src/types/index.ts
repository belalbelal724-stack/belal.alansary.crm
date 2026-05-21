export type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: 'admin' | 'manager' | 'user';
  created_at: string;
};

export type Branch = {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  manager_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ClientStatus = 'active' | 'inactive' | 'lead' | 'vip';

export type Client = {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  branch_id: string | null;
  status: ClientStatus;
  notes: string | null;
  total_value: number;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  branch?: Branch | null;
};

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid';

export type Order = {
  id: string;
  order_number: string;
  client_id: string;
  branch_id: string | null;
  amount: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  description: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  client?: Client | null;
  branch?: Branch | null;
};

export type Notification = {
  id: string;
  user_id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
};

export const STATUS_LABELS: Record<ClientStatus, string> = {
  active: 'نشط',
  inactive: 'غير نشط',
  lead: 'محتمل',
  vip: 'VIP',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'قيد الانتظار',
  processing: 'قيد المعالجة',
  completed: 'مكتمل',
  cancelled: 'ملغي',
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: 'غير مدفوع',
  partial: 'دفع جزئي',
  paid: 'مدفوع',
};
