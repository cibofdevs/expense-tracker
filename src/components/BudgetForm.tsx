import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import type { Category } from '../types';

type BudgetFormProps = {
  categories: Category[];
  onClose: () => void;
  onSuccess: () => void;
};

export function BudgetForm({ categories, onClose, onSuccess }: BudgetFormProps) {
  const [budgets, setBudgets] = useState(
    categories
      .filter(cat => cat.type === 'expense')
      .map(cat => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        percentage: cat.budget_percentage || 0
      }))
  );

  const handlePercentageChange = (id: string, value: string) => {
    const newValue = Math.max(0, Math.min(100, Number(value) || 0));
    setBudgets(prev => 
      prev.map(budget => 
        budget.id === id 
          ? { ...budget, percentage: newValue }
          : budget
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate total percentage is 100%
    const total = budgets.reduce((sum, budget) => sum + budget.percentage, 0);
    if (Math.abs(total - 100) > 0.01) {
      toast.error('Total budget allocation must equal 100%');
      return;
    }

    try {
      // Update each category's budget percentage
      const promises = budgets.map(budget => 
        supabase
          .from('categories')
          .update({ budget_percentage: budget.percentage })
          .eq('id', budget.id)
      );

      const results = await Promise.all(promises);
      const errors = results.filter(result => result.error);

      if (errors.length > 0) {
        throw new Error('Failed to update some budget allocations');
      }

      toast.success('Budget allocations updated successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating budget allocations:', error);
      toast.error('Failed to update budget allocations');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-lg w-full p-6 transition-colors duration-300">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Manage Budget Allocation
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Allocate your budget across expense categories. Total must equal 100%.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 mb-6">
            {budgets.map(budget => (
              <div key={budget.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="mr-2">{budget.icon}</span>
                  <span className="text-gray-700 dark:text-gray-200">{budget.name}</span>
                </div>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={budget.percentage}
                    onChange={(e) => handlePercentageChange(budget.id, e.target.value)}
                    className="w-20 px-3 py-2 text-right border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                  <span className="ml-2 text-gray-600 dark:text-gray-300">%</span>
                </div>
              </div>
            ))}

            <div className="flex items-center justify-between font-medium pt-4 border-t">
              <span className="text-gray-900 dark:text-white">Total</span>
              <span className={`${
                Math.abs(budgets.reduce((sum, b) => sum + b.percentage, 0) - 100) > 0.01
                  ? 'text-red-500'
                  : 'text-green-500'
              }`}>
                {budgets.reduce((sum, b) => sum + b.percentage, 0).toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-300"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
