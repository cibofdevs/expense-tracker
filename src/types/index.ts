export type Expense = {
  id: string;
  amount: number;
  category: string;
  description?: string;
  date: string;
  created_at?: string;
};

export type Category = {
  name: string;
  percentage: number;
  actualPercentage: number;
  difference: number;
  color: string;
};