import React from 'react';

export type Expense = {
  id: string;
  amount: number;
  category: string;
  description?: string;
  date: string;
  created_at?: string;
};

export type ExpenseFormData = Omit<Expense, 'id' | 'created_at'>;

export type Category = {
  name: string;
  percentage: number;
  actualPercentage: number;
  difference: number;
  color: string;
};

export type UserPreferences = {
  id: string;
  user_id: string;
  currency: string;
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  created_at?: string;
  updated_at?: string;
};

export type UserDetails = {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address: string;
  avatar_url: string | null;
  created_at?: string;
  updated_at?: string;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'expense_alert' | 'budget_alert' | 'system';
  read: boolean;
  created_at: string;
};

export type BudgetAllocation = {
  id: string;
  category: string;
  percentage: number;
  created_at?: string;
  updated_at?: string;
};

export type IncomeRecord = {
  id: string;
  user_id: string;
  amount: number;
  source: string;
  date: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
};

export type SavingsGoal = {
  id: string;
  user_id: string;
  target_amount: number;
  current_amount: number;
  title: string;
  description?: string;
  target_date?: string;
  created_at?: string;
  updated_at?: string;
};