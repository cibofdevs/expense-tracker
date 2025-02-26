import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { getStoredCurrency, setStoredCurrency } from '../lib/currency';
import type { ExpenseFormData, Category, Expense } from '../types';
import { X } from 'lucide-react';

type ExpenseFormProps = {
  onSuccess: () => void;
  onCancel: () => void;
  expense?: Expense;
  theme?: 'light' | 'dark' | 'system';
};

export function ExpenseForm({ onSuccess, onCancel, expense, theme }: ExpenseFormProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<ExpenseFormData>({
    amount: expense?.amount || 0,
    category_id: expense?.category_id || '',
    description: expense?.description || '',
    date: expense?.date || format(new Date(), 'yyyy-MM-dd'),
    currency: expense?.currency || getStoredCurrency(),
    payment_method: expense?.payment_method || '',
    receipt_url: expense?.receipt_url || ''
  });

  useEffect(() => {
    const initialize = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          toast.error('Please login first');
          return;
        }

        // Fetch user's expense categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'expense');
        
        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // Get user preferences
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('default_currency')
          .eq('user_id', user.id)
          .single();
        
        if (preferences?.default_currency) {
          setFormData(prev => ({ ...prev, currency: preferences.default_currency }));
          setStoredCurrency(preferences.default_currency);
        }
      } catch (error) {
        console.error('Error initializing form:', error);
        toast.error('Failed to load form data');
      }
    };

    initialize();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.category_id) {
        throw new Error('Please select a category');
      }

      if (!formData.amount || formData.amount <= 0) {
        throw new Error('Please enter a valid amount');
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Please login first');
      }

      const expenseData = {
        ...formData,
        user_id: user.id
      };

      if (expense) {
        const { error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', expense.id);

        if (error) throw error;
        toast.success('Expense updated successfully');
      } else {
        const { error } = await supabase
          .from('expenses')
          .insert([expenseData]);

        if (error) throw error;
        toast.success('Expense added successfully');
      }

      onSuccess();
      onCancel();
    } catch (error: any) {
      console.error('Error saving expense:', error);
      toast.error(error.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${theme === 'dark' ? 'dark' : ''}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Category
          </label>
          <select
            value={formData.category_id}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Amount
          </label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            min="0"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Description
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Date
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Payment Method
          </label>
          <select
            value={formData.payment_method}
            onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
            className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select payment method</option>
            <option value="Cash">Cash</option>
            <option value="Credit Card">Credit Card</option>
            <option value="Debit Card">Debit Card</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="E-Wallet">E-Wallet</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors duration-200"
        >
          {loading ? 'Saving...' : expense ? 'Update Expense' : 'Add Expense'}
        </button>
      </form>
    </div>
  );
}