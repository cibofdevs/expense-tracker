import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { X } from 'lucide-react';
import type { Category } from '../types';

type BudgetAllocationFormProps = {
  onClose: () => void;
  onSuccess: () => void;
  theme?: 'light' | 'dark' | 'system';
};

export function BudgetAllocationForm({ onClose, onSuccess, theme }: BudgetAllocationFormProps) {
  const [allocations, setAllocations] = useState<{ category: string; percentage: number }[]>([
    { category: 'Food', percentage: 35 },
    { category: 'Utilities', percentage: 20 },
    { category: 'Entertainment', percentage: 15 },
    { category: 'Transportation', percentage: 15 },
    { category: 'Shopping', percentage: 10 },
    { category: 'Internet', percentage: 5 }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAllocations();
  }, []);

  const fetchAllocations = async () => {
    try {
      const { data, error } = await supabase
        .from('budget_allocations')
        .select('category, percentage')
        .order('category');

      if (error) throw error;

      if (data && data.length > 0) {
        setAllocations(data);
      }
    } catch (error) {
      console.error('Error fetching budget allocations:', error);
      toast.error('Failed to load budget allocations');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const total = allocations.reduce((sum, alloc) => sum + alloc.percentage, 0);
    if (Math.abs(total - 100) > 0.01) {
      toast.error('Total allocation must equal 100%');
      return;
    }

    setLoading(true);
    try {
      const { error: deleteError } = await supabase
        .from('budget_allocations')
        .delete()
        .neq('id', 'placeholder');

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase
        .from('budget_allocations')
        .insert(allocations);

      if (insertError) throw insertError;

      toast.success('Budget allocations saved successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving budget allocations:', error);
      toast.error('Failed to save budget allocations');
    } finally {
      setLoading(false);
    }
  };

  const handlePercentageChange = (index: number, value: number) => {
    const newAllocations = [...allocations];
    newAllocations[index].percentage = value;
    setAllocations(newAllocations);
  };

  const total = allocations.reduce((sum, alloc) => sum + alloc.percentage, 0);
  const isValid = Math.abs(total - 100) <= 0.01;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`${
        theme === 'dark' ? 'bg-gray-800' : 'bg-white'
      } p-6 rounded-2xl shadow-xl w-full max-w-sm border border-gray-100 dark:border-gray-700`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className={`text-xl font-semibold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              Budget Allocation
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Allocate your budget across categories
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors duration-200 ${
              theme === 'dark'
                ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {allocations.map((allocation, index) => (
            <div key={allocation.category} className="group">
              <div className="flex justify-between items-center mb-1.5">
                <label className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  {allocation.category}
                </label>
                <span className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {allocation.percentage}%
                </span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={allocation.percentage}
                  onChange={(e) => handlePercentageChange(index, parseFloat(e.target.value) || 0)}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full appearance-none cursor-pointer transition-all duration-200
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r [&::-webkit-slider-thumb]:from-blue-500 
                    [&::-webkit-slider-thumb]:to-indigo-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-200 [&::-webkit-slider-thumb]:hover:scale-110
                    group-hover:[&::-webkit-slider-thumb]:from-blue-600 group-hover:[&::-webkit-slider-thumb]:to-indigo-700"
                />
                <div className="absolute left-0 top-0 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"
                  style={{ width: `${allocation.percentage}%` }} />
              </div>
            </div>
          ))}

          <div className={`flex justify-between items-center py-3 px-4 rounded-xl text-sm font-medium ${
            isValid 
              ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-700 dark:text-green-400' 
              : 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 text-red-700 dark:text-red-400'
          }`}>
            <span>Total Allocation:</span>
            <span className="font-semibold">{total.toFixed(1)}%</span>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                theme === 'dark'
                  ? 'text-gray-200 bg-gray-700 hover:bg-gray-600'
                  : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !isValid}
              className="px-4 py-2.5 text-sm font-medium text-white rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 
                hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-500 disabled:hover:to-indigo-600 
                shadow-lg shadow-blue-500/25 transition-all duration-200"
            >
              {loading ? 'Saving...' : 'Save Allocations'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}