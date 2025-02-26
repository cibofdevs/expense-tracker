import React from 'react';
import { format } from 'date-fns';
import { Pencil, Trash2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import type { Expense, IncomeRecord } from '../types';

type Transaction = (Expense | IncomeRecord) & {
  type: 'expense' | 'income';
};

type TransactionListProps = {
  transactions: Transaction[];
  onEditExpense: (expense: Expense) => void;
  onEditIncome: (income: IncomeRecord) => void;
  onDelete: () => void;
  formatCurrency: (amount: number, currency: string) => string;
};

export function TransactionList({ transactions, onEditExpense, onEditIncome, onDelete, formatCurrency }: TransactionListProps) {
  const handleDelete = async (transaction: Transaction) => {
    try {
      const { error } = await supabase
        .from(transaction.type === 'expense' ? 'expenses' : 'income_records')
        .delete()
        .eq('id', transaction.id);

      if (error) throw error;
      onDelete();
      toast.success(`${transaction.type === 'expense' ? 'Expense' : 'Income'} deleted successfully`);
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error(`Failed to delete ${transaction.type}`);
    }
  };

  const getCategoryDisplay = (transaction: Transaction) => {
    if (!transaction.category) return '-';
    
    return (
      <div className="flex items-center">
        <span className="mr-2" style={{ color: transaction.category.color }}>
          {transaction.category.icon}
        </span>
        <span>{transaction.category.name}</span>
      </div>
    );
  };

  const getTypeIcon = (type: 'expense' | 'income') => {
    if (type === 'expense') {
      return <ArrowDownCircle className="w-4 h-4 text-red-500" />;
    }
    return <ArrowUpCircle className="w-4 h-4 text-green-500" />;
  };

  return (
    <div className="overflow-x-auto rounded-xl">
      <table className="min-w-full">
        <thead>
          <tr className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
            <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">
              Type
            </th>
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
          {transactions.map((transaction) => (
            <tr 
              key={`${transaction.type}-${transaction.id}`} 
              className={`
                transition-all duration-200 
                ${transaction.type === 'expense' 
                  ? 'hover:bg-red-50 dark:hover:bg-red-900/10' 
                  : 'hover:bg-green-50 dark:hover:bg-green-900/10'
                }
              `}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {transaction.type === 'expense' 
                    ? <ArrowDownCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
                    : <ArrowUpCircle className="w-8 h-8 text-green-500 dark:text-green-400" />
                  }
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {format(new Date(transaction.date), 'MMM d, yyyy')}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {transaction.category && (
                    <div 
                      className={`
                        w-8 h-8 rounded-lg mr-3 flex items-center justify-center text-white
                        ${transaction.type === 'expense' 
                          ? 'bg-gradient-to-br from-red-400 to-red-500'
                          : 'bg-gradient-to-br from-green-400 to-green-500'
                        }
                      `}
                      style={{ backgroundColor: transaction.category.color }}
                    >
                      {transaction.category.icon}
                    </div>
                  )}
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {transaction.category?.name || '-'}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 dark:text-white line-clamp-1">
                  {transaction.description || '-'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`
                  text-sm font-semibold px-4 py-2 rounded-full
                  ${transaction.type === 'expense'
                    ? 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
                    : 'text-green-700 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
                  }
                `}>
                  {transaction.type === 'expense' ? '-' : '+'}{formatCurrency(transaction.amount, transaction.currency)}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                <div className="flex items-center justify-end space-x-3">
                  <button
                    onClick={() => transaction.type === 'expense' ? onEditExpense(transaction as Expense) : onEditIncome(transaction as IncomeRecord)}
                    className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors duration-200
                             dark:text-blue-400 dark:hover:bg-blue-900/20"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(transaction)}
                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors duration-200
                             dark:text-red-400 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          {transactions.length === 0 && (
            <tr>
              <td colSpan={6} className="px-6 py-8 text-center">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="text-gray-400 dark:text-gray-500">
                    No transactions found
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