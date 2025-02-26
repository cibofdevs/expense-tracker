export type UserPreferences = {
  id?: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  default_currency: string;
  created_at?: string;
  updated_at: string;
};

export type UserDetails = {
  id?: string;
  user_id?: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  address: string | null;
  created_at?: string;
  updated_at?: string;
};

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  budget_percentage?: number;
  created_at?: string;
  updated_at?: string;
}

export interface IncomeRecord {
  id: string;
  user_id: string;
  category_id: string;
  category?: Category;  // Optional category object when joined
  amount: number;
  currency: string;
  description: string;
  date: string;
  is_recurring: boolean;
  recurring_period: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Expense {
  id: string;
  user_id: string;
  category_id: string;
  category?: Category;  // Optional category object when joined
  amount: number;
  currency: string;
  description: string;
  date: string;
  payment_method?: string;
  receipt_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExpenseFormData extends Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'> {
  category_id: string;
}

export type Notification = {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};
