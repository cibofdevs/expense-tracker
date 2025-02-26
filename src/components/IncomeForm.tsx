import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';
import type { IncomeRecord, Category } from '../types';
import { getStoredCurrency, setStoredCurrency } from '../lib/currency';

type IncomeFormProps = {
  onSuccess: () => void;
  initialData?: IncomeRecord;
  onClose: () => void;
  theme?: 'light' | 'dark' | 'system';
};

export function IncomeForm({ onSuccess, initialData, onClose, theme }: IncomeFormProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<Omit<IncomeRecord, 'id' | 'created_at' | 'updated_at'>>({
    amount: initialData?.amount || 0,
    category_id: initialData?.category_id || '',
    description: initialData?.description || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    currency: initialData?.currency || getStoredCurrency(),
    user_id: '',
    is_recurring: initialData?.is_recurring || false,
    recurring_period: initialData?.recurring_period || null
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

        setFormData(prev => ({ ...prev, user_id: user.id }));
        
        // Fetch user's income categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'income');
        
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

      if (initialData?.id) {
        const { error } = await supabase
          .from('income_records')
          .update(formData)
          .eq('id', initialData.id);

        if (error) throw error;
        toast.success('Income record updated successfully');
      } else {
        const { error } = await supabase
          .from('income_records')
          .insert([formData]);

        if (error) throw error;
        toast.success('Income record added successfully');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error saving income record:', error);
      toast.error(error.message || 'Failed to save income record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md ${theme === 'dark' ? 'dark' : ''}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {initialData ? 'Edit' : 'Add'} Income
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
                  {category.name}
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

          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              checked={formData.is_recurring}
              onChange={(e) => setFormData({ ...formData, is_recurring: e.target.checked })}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:focus:ring-blue-600"
            />
            <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              Recurring Income
            </label>
          </div>

          {formData.is_recurring && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Recurring Period
              </label>
              <select
                value={formData.recurring_period}
                onChange={(e) => setFormData({ ...formData, recurring_period: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select period</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-colors duration-200"
          >
            {loading ? 'Saving...' : initialData ? 'Update Income' : 'Add Income'}
          </button>
        </form>
      </div>
    </div>
  );
}