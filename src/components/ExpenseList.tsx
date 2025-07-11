import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import type { Expense } from '../types';

type ExpenseListProps = {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  formatCurrency: (amount: number, currency: string) => string;
};

export function ExpenseList({ expenses, onEdit, onDelete, formatCurrency }: ExpenseListProps) {
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      onDelete(id);
      toast.success('Expense deleted successfully');
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast.error('Failed to delete expense');
    }
  };
  return (
    <div className="overflow-x-auto rounded-xl">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gradient-to-r from-red-500 to-rose-600 text-white">
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
              Amount
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
          {expenses.map((expense) => (
            <tr key={expense.id} className="transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/10">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {format(new Date(expense.date), 'MMM d, yyyy')}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {expense.category && (
                    <div 
                      className="w-8 h-8 rounded-lg mr-3 flex items-center justify-center text-white"
                      style={{ 
                        background: `linear-gradient(135deg, ${expense.category.color}, ${expense.category.color}dd)`
                      }}
                    >
                      {expense.category.icon}
                    </div>
                  )}
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {expense.category?.name || '-'}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 dark:text-white line-clamp-1">
                  {expense.description || '-'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="text-sm font-semibold px-4 py-2 rounded-full bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                  {formatCurrency(expense.amount, expense.currency)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => onEdit(expense)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200
                             dark:text-blue-400 dark:hover:bg-blue-900/20"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200
                             dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {expenses.length === 0 && (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="text-gray-400 dark:text-gray-500">
                    No expenses found
                  </div>
                </div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}