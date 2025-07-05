import {Chart as ChartJS, ArcElement, Tooltip, Legend, TooltipItem} from 'chart.js';
import { Pie } from 'react-chartjs-2';
import type { Category, Expense } from '../types';

ChartJS.register(ArcElement, Tooltip, Legend);

type ExpenseChartsProps = {
  categories: Category[];
  expenses: Expense[];
};

export function ExpenseCharts({ categories, expenses }: ExpenseChartsProps) {
  // Only use expense categories
  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  // Calculate actual percentages based on expenses
  const calculateActualPercentages = () => {
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    
    // If there are no expenses, return 0 for all categories
    if (totalExpenses === 0) {
      return expenseCategories.map(() => 0);
    }
    
    return expenseCategories.map(cat => {
      const categoryExpenses = expenses
        .filter(exp => exp.category_id === cat.id)
        .reduce((sum, exp) => sum + exp.amount, 0);
      
      return Number(((categoryExpenses / totalExpenses) * 100).toFixed(1));
    });
  };

  const actualPercentages = calculateActualPercentages();
  const budgetPercentages = expenseCategories.map(cat => Number((cat.budget_percentage || 0).toFixed(1)));

  const budgetData = {
    labels: expenseCategories.map(cat => cat.name),
    datasets: [
      {
        data: budgetPercentages,
        backgroundColor: expenseCategories.map(cat => cat.color),
        borderColor: expenseCategories.map(cat => cat.color),
        borderWidth: 1,
      },
    ],
  };

  const actualData = {
    labels: expenseCategories.map(cat => cat.name),
    datasets: [
      {
        data: actualPercentages,
        backgroundColor: expenseCategories.map(cat => cat.color),
        borderColor: expenseCategories.map(cat => cat.color),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: 12,
            weight: 500
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1F2937',
        bodyColor: '#1F2937',
        bodyFont: {
          size: 12,
          weight: 500
        },
        padding: 12,
        boxPadding: 8,
        cornerRadius: 8,
        boxWidth: 8,
        boxHeight: 8,
        usePointStyle: true,
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
        callbacks: {
          label: (context: TooltipItem<'pie'>) => {
            const label = context.label || '';
            const value = typeof context.raw === 'number' ? context.raw : 0;
            return `${label}: ${value.toFixed(1)}%`;
          },
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white transition-colors duration-300">
          Budget allocated by categories
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          How you plan to distribute your expenses
        </p>
        <div className="relative h-64 mb-6">
          <Pie data={budgetData} options={chartOptions} />
        </div>
        <div className="space-y-3">
          {expenseCategories.map((cat, index) => (
            <div key={cat.id} className="flex items-center justify-between p-2 rounded-xl bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors duration-200">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: cat.color + '20' }}
                >
                  <span className="text-lg" style={{ color: cat.color }}>{cat.icon}</span>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{cat.name}</span>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <div className="w-24 h-2 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${budgetPercentages[index]}%`,
                      backgroundColor: cat.color 
                    }}
                  />
                </div>
                <span className="text-sm font-semibold w-12 text-right" style={{ color: cat.color }}>
                  {budgetPercentages[index]}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-2xl shadow-lg">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white transition-colors duration-300">
          Actual expenses by categories
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Your real spending distribution
        </p>
        <div className="relative h-64 mb-6">
          <Pie data={actualData} options={chartOptions} />
        </div>
        <div className="space-y-3">
          {expenseCategories.map((cat, index) => (
            <div key={cat.id} className="flex items-center justify-between p-2 rounded-xl bg-white/50 dark:bg-gray-800/50 hover:bg-white/80 dark:hover:bg-gray-800/80 transition-colors duration-200">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: cat.color + '20' }}
                >
                  <span className="text-lg" style={{ color: cat.color }}>{cat.icon}</span>
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{cat.name}</span>
              </div>
              <div className="flex items-center gap-3 ml-4">
                <div className="w-24 h-2 rounded-full bg-gray-200 dark:bg-gray-600 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-300"
                    style={{ 
                      width: `${actualPercentages[index]}%`,
                      backgroundColor: cat.color 
                    }}
                  />
                </div>
                <span className="text-sm font-semibold w-12 text-right" style={{ color: cat.color }}>
                  {actualPercentages[index]}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}