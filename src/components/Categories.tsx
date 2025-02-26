import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Category } from '../types';

interface CategoriesProps {
  theme?: 'light' | 'dark' | 'system';
  onShowForm: () => void;
  onEditCategory: (category: Category) => void;
}

interface CategoryType {
  type: 'income' | 'expense';
  label: string;
}

const CATEGORY_TYPES: CategoryType[] = [
  { type: 'expense', label: 'Expense Categories' },
  { type: 'income', label: 'Income Categories' }
];

export function Categories({ onShowForm, onEditCategory }: CategoriesProps): JSX.Element {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedType, setSelectedType] = useState<'income' | 'expense'>('expense');
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCategories = async (): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please login first');
        return;
      }

      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCategories();
  }, []);

  const handleDelete = async (id: string): Promise<void> => {
    const confirmDelete = window.confirm('Are you sure you want to delete this category?');
    if (!confirmDelete) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Category deleted successfully');
      void fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  };

  const handleTypeChange = (type: 'income' | 'expense'): void => {
    setSelectedType(type);
  };

  const filteredCategories = categories.filter(cat => cat.type === selectedType);

  return (
    <div className="w-full">
      {/* Header section with responsive layout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="w-full sm:w-auto flex flex-wrap gap-2">
          {CATEGORY_TYPES.map(({ type, label }) => (
            <button
              key={type}
              onClick={() => handleTypeChange(type)}
              className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                selectedType === type
                  ? type === 'expense'
                    ? 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg shadow-red-500/30'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30'
                  : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
              aria-pressed={selectedType === type}
              aria-label={`Show ${label.toLowerCase()}`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => onShowForm()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-300 shadow-lg shadow-blue-500/30 font-medium"
          aria-label="Add new category"
        >
          <Plus className="w-5 h-5" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Content section */}
      <div className="w-full">
        {loading ? (
          <div className="text-center py-8" role="status">
            <div className="flex items-center justify-center space-x-2 animate-pulse">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            </div>
            <span className="sr-only">Loading categories...</span>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <Plus className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">
              No {selectedType} categories found. Add some categories to get started!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className={`p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl ${
                  category.type === 'expense'
                    ? 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-gray-800 dark:to-gray-700'
                    : 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700'
                }`}
                role="listitem"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                        category.type === 'expense'
                          ? 'bg-gradient-to-br from-red-500 to-rose-600'
                          : 'bg-gradient-to-br from-green-500 to-emerald-600'
                      }`}
                      style={{ 
                        color: 'white',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                      }}
                      aria-hidden="true"
                    >
                      {category.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white truncate text-lg">
                        {category.name}
                      </h3>
                      {category.type === 'expense' && category.budget_percentage && (
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {category.budget_percentage.toFixed(1)}%
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditCategory(category)}
                      className={`p-2 rounded-lg transition-colors duration-300 ${
                        category.type === 'expense'
                          ? 'text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20'
                          : 'text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/20'
                      }`}
                      aria-label={`Edit ${category.name}`}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className={`p-2 rounded-lg transition-colors duration-300 ${
                        category.type === 'expense'
                          ? 'text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-900/20'
                          : 'text-green-600 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900/20'
                      }`}
                      aria-label={`Delete ${category.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {category.type === 'expense' && category.budget_percentage && (
                  <div className="mt-2">
                    <div className="w-full bg-red-100 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-red-500 to-rose-600 h-2 rounded-full"
                        style={{ width: `${Math.min(100, category.budget_percentage)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
