import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';
import type { Category } from '../types';

interface CategoryFormProps {
  onSuccess: () => void;
  onClose: () => void;
  type: 'income' | 'expense';
  theme?: 'light' | 'dark' | 'system';
  category?: Category;
}

interface FormData {
  name: string;
  icon: string;
  color: string;
  budget_percentage?: number;
}

const DEFAULT_COLORS = [
  '#FF9F8F', '#86E594', '#D8B4FE', '#93C5FD', '#FDE047', '#F052B6',
  '#34D399', '#60A5FA', '#F472B6', '#A78BFA'
] as const;

const DEFAULT_ICONS = ['💰', '💳', '🏦', '💵', '📈', '🎯', '🛒', '🏠', '🚗', '✈️', '🍽️', '🎮', '📚', '💊', '🎵'] as const;

export function CategoryForm({ onSuccess, onClose, type, theme = 'light', category }: CategoryFormProps): JSX.Element {
  const [loading, setLoading] = useState<boolean>(false);
  const [totalPercentage, setTotalPercentage] = useState<number>(0);
  const [formData, setFormData] = useState<FormData>({
    name: category?.name || '',
    icon: category?.icon || DEFAULT_ICONS[0],
    color: category?.color || DEFAULT_COLORS[0],
    budget_percentage: type === 'expense' ? (category?.budget_percentage || 0) : undefined
  });

  useEffect(() => {
    if (type === 'expense') {
      void fetchTotalPercentage();
    }
  }, [type]);

  const fetchTotalPercentage = async (): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('categories')
        .select('budget_percentage')
        .eq('type', 'expense')
        .eq('user_id', user.id);

      if (error) throw error;

      const total = data?.reduce((sum, cat) => sum + (cat.budget_percentage || 0), 0) || 0;
      if (category) {
        setTotalPercentage(total - (category.budget_percentage || 0));
      } else {
        setTotalPercentage(total);
      }
    } catch (error) {
      console.error('Error fetching total percentage:', error);
      toast.error('Failed to fetch budget percentages');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (type === 'expense' && formData.budget_percentage !== undefined) {
      const newTotal = totalPercentage + formData.budget_percentage;
      if (newTotal > 100) {
        toast.error('Total budget percentage cannot exceed 100%');
        return;
      }
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Please login first');
      }

      const categoryData = {
        ...formData,
        type,
        user_id: user.id,
        updated_at: new Date().toISOString()
      };

      let error;
      if (category) {
        ({ error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', category.id));
      } else {
        ({ error } = await supabase
          .from('categories')
          .insert([categoryData]));
      }

      if (error) throw error;
      toast.success(`Category ${category ? 'updated' : 'added'} successfully`);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error(`Failed to ${category ? 'update' : 'add'} category`);
    } finally {
      setLoading(false);
    }
  };

  const handleIconSelect = (icon: typeof DEFAULT_ICONS[number]): void => {
    setFormData(prev => ({ ...prev, icon }));
  };

  const handleColorSelect = (color: typeof DEFAULT_COLORS[number]): void => {
    setFormData(prev => ({ ...prev, color }));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const name = e.target.value.trim();
    setFormData(prev => ({ ...prev, name }));
  };

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = parseFloat(e.target.value) || 0;
    setFormData(prev => ({ ...prev, budget_percentage: value }));
  };

  const remainingPercentage = type === 'expense' 
    ? (100 - totalPercentage + (formData.budget_percentage || 0)).toFixed(1)
    : '100.0';

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div 
          className={`bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md relative ${theme === 'dark' ? 'dark' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="category-form-title"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            type="button"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <h2 id="category-form-title" className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
            {category ? 'Edit' : 'Add New'} {type === 'income' ? 'Income' : 'Expense'} Category
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="category-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                id="category-name"
                type="text"
                value={formData.name}
                onChange={handleNameChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
                minLength={1}
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Icon
              </label>
              <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Select icon">
                {DEFAULT_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => handleIconSelect(icon)}
                    className={`p-2 text-xl rounded-md ${
                      formData.icon === icon
                        ? 'bg-blue-100 dark:bg-blue-900'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    aria-label={`Select icon ${icon}`}
                    aria-pressed={formData.icon === icon}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Color
              </label>
              <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-label="Select color">
                {DEFAULT_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorSelect(color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color ? 'border-blue-500' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                    aria-pressed={formData.color === color}
                  />
                ))}
              </div>
            </div>

            {type === 'expense' && (
              <div>
                <label htmlFor="budget-percentage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Budget Percentage
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    id="budget-percentage"
                    type="number"
                    min="0"
                    max={100 - totalPercentage + (formData.budget_percentage || 0)}
                    value={formData.budget_percentage}
                    onChange={handleBudgetChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    required
                    step="0.1"
                  />
                  <span className="text-gray-700 dark:text-gray-300">%</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Remaining: {remainingPercentage}%
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Saving...' : category ? 'Update Category' : 'Add Category'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
