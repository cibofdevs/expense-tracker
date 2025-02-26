import React from 'react';
import { format, subMonths, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Wallet, Wallet2, BarChart3 } from 'lucide-react';
import type { Expense, IncomeRecord, Category } from '../types';

type AnalyticsProps = {
  expenses: Expense[];
  incomeRecords: IncomeRecord[];
  categories: Category[];
  formatCurrency: (amount: number) => string;
};

export function Analytics({ expenses, incomeRecords, categories, formatCurrency }: AnalyticsProps) {
  // Calculate total income and expenses
  const totalIncome = incomeRecords.reduce((sum, income) => sum + income.amount, 0);
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  // Get data for the last 6 months
  const getLastSixMonthsData = () => {
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const start = startOfMonth(date);
      const end = endOfMonth(date);

      const monthExpenses = expenses.filter(expense =>
        isWithinInterval(new Date(expense.date), { start, end })
      ).reduce((sum, expense) => sum + expense.amount, 0);

      const monthIncome = incomeRecords.filter(income =>
        isWithinInterval(new Date(income.date), { start, end })
      ).reduce((sum, income) => sum + income.amount, 0);

      data.push({
        month: format(date, 'MMM'),
        expenses: monthExpenses,
        income: monthIncome,
        savings: monthIncome - monthExpenses
      });
    }
    return data;
  };

  // Calculate category-wise spending
  const getCategorySpending = () => {
    const expenseCategories = categories.filter(cat => cat.type === 'expense');
    return expenseCategories.map(category => {
      const total = expenses
        .filter(expense => expense.category_id === category.id)
        .reduce((sum, expense) => sum + expense.amount, 0);
      return {
        name: category.name,
        value: total,
        color: category.color || '#93C5FD' // Default color if none set
      };
    }).filter(cat => cat.value > 0);
  };

  // Calculate income by category
  const getIncomeByCategory = () => {
    const incomeCategories = categories.filter(cat => cat.type === 'income');
    return incomeCategories.map(category => {
      const total = incomeRecords
        .filter(income => income.category_id === category.id)
        .reduce((sum, income) => sum + income.amount, 0);
      return {
        name: category.name,
        value: total,
        color: category.color || '#34D399' // Default color if none set
      };
    }).filter(cat => cat.value > 0);
  };

  const monthlyData = getLastSixMonthsData();
  const categorySpending = getCategorySpending();
  const incomeByCategory = getIncomeByCategory();

  // If there's no data, show a message
  if (expenses.length === 0 && incomeRecords.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No transaction data available. Add some income and expenses to see analytics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl shadow-lg border border-green-100 dark:border-gray-600">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-500 dark:text-green-400" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Income</h4>
              <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                {formatCurrency(totalIncome)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl shadow-lg border border-red-100 dark:border-gray-600">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg">
              <Wallet className="w-6 h-6 text-red-500 dark:text-red-400" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Expenses</h4>
              <p className="text-2xl font-semibold text-red-600 dark:text-red-400">
                {formatCurrency(totalExpenses)}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl shadow-lg border border-blue-100 dark:border-gray-600">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/80 dark:bg-gray-800/80 rounded-lg">
              <Wallet2 className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Savings Rate</h4>
              <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                {savingsRate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trend */}
      {monthlyData.length > 0 && (
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl shadow-lg border border-violet-100 dark:border-gray-600">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/80 dark:bg-gray-800/80 rounded-lg">
                <BarChart3 className="w-5 h-5 text-violet-500 dark:text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Monthly Trend</h3>
            </div>
          </div>
          <div className="h-[300px] sm:h-[400px] lg:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ left: 15, right: 15, top: 10, bottom: 20 }}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34D399" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#34D399" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F87171" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#F87171" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="savingsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#60A5FA" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#6B7280' }}
                  axisLine={{ stroke: '#9CA3AF' }}
                />
                <YAxis 
                  width={80}
                  tick={{ fill: '#6B7280' }}
                  axisLine={{ stroke: '#9CA3AF' }}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    padding: '8px 12px'
                  }}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  iconType="circle"
                  iconSize={8}
                />
                <Line 
                  type="monotone" 
                  dataKey="income" 
                  stroke="#34D399" 
                  strokeWidth={2}
                  name="Income"
                  dot={{ stroke: '#34D399', strokeWidth: 2, r: 4, fill: '#fff' }}
                  activeDot={{ r: 6, stroke: '#34D399', strokeWidth: 2, fill: '#fff' }}
                  fill="url(#incomeGradient)"
                />
                <Line 
                  type="monotone" 
                  dataKey="expenses" 
                  stroke="#F87171" 
                  strokeWidth={2}
                  name="Expenses"
                  dot={{ stroke: '#F87171', strokeWidth: 2, r: 4, fill: '#fff' }}
                  activeDot={{ r: 6, stroke: '#F87171', strokeWidth: 2, fill: '#fff' }}
                  fill="url(#expenseGradient)"
                />
                <Line 
                  type="monotone" 
                  dataKey="savings" 
                  stroke="#60A5FA" 
                  strokeWidth={2}
                  name="Savings"
                  dot={{ stroke: '#60A5FA', strokeWidth: 2, r: 4, fill: '#fff' }}
                  activeDot={{ r: 6, stroke: '#60A5FA', strokeWidth: 2, fill: '#fff' }}
                  fill="url(#savingsGradient)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Distribution */}
        {categorySpending.length > 0 && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 p-4 sm:p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">Expense Distribution</h3>
              <div className="bg-white dark:bg-gray-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium text-purple-600 dark:text-purple-400">
                {formatCurrency(totalExpenses)}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              {categorySpending.slice(0, 4).map((category, index) => (
                <div 
                  key={index}
                  className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div 
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ 
                        background: `linear-gradient(135deg, ${category.color}, ${category.color}dd)`
                      }}
                    >
                      <span className="text-base sm:text-lg text-white">{categories.find(cat => cat.name === category.name)?.icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{category.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {((category.value / totalExpenses) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold whitespace-nowrap ml-2" style={{ color: category.color }}>
                    {formatCurrency(category.value)}
                  </p>
                </div>
              ))}
            </div>
            <div className="h-[250px] sm:h-[300px] lg:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Pie
                    data={categorySpending}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="85%"
                    paddingAngle={2}
                    label={({ name, percent }) => (
                      `${name} (${(percent * 100).toFixed(1)}%)`
                    )}
                    labelLine={{ strokeWidth: 1, stroke: '#8884d8', strokeDasharray: "2 2" }}
                  >
                    {categorySpending.map((entry, index) => (
                      <Cell 
                        key={index} 
                        fill={entry.color} 
                        stroke={entry.color}
                        strokeWidth={1}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      padding: '8px 12px',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Income Sources */}
        {incomeByCategory.length > 0 && (
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 p-4 sm:p-6 rounded-xl shadow-lg">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">Income Sources</h3>
              <div className="bg-white dark:bg-gray-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-400">
                {formatCurrency(totalIncome)}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              {incomeByCategory.slice(0, 4).map((category, index) => (
                <div 
                  key={index}
                  className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                    <div 
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ 
                        background: `linear-gradient(135deg, ${category.color}, ${category.color}dd)`
                      }}
                    >
                      <span className="text-base sm:text-lg text-white">{categories.find(cat => cat.name === category.name)?.icon}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{category.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {((category.value / totalIncome) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold whitespace-nowrap ml-2" style={{ color: category.color }}>
                    {formatCurrency(category.value)}
                  </p>
                </div>
              ))}
            </div>
            <div className="h-[250px] sm:h-[300px] lg:h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeByCategory} margin={{ left: 0, right: 20, top: 20, bottom: 20 }}>
                  <defs>
                    {incomeByCategory.map((entry, index) => (
                      <linearGradient key={index} id={`colorGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={entry.color} stopOpacity={0.8}/>
                        <stop offset="95%" stopColor={entry.color} stopOpacity={0.4}/>
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.1} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ 
                      fill: '#6B7280',
                      fontSize: '12px'
                    }}
                    axisLine={{ stroke: '#9CA3AF' }}
                    tickLine={false}
                    interval={0}
                    height={50}
                    angle={-45}
                    textAnchor="end"
                  />
                  <YAxis 
                    width={80}
                    tick={{ 
                      fill: '#6B7280',
                      fontSize: '12px'
                    }}
                    axisLine={{ stroke: '#9CA3AF' }}
                    tickLine={false}
                    tickFormatter={(value) => {
                      if (value >= 1000000) {
                        return `${(value / 1000000).toFixed(1)}M`;
                      } else if (value >= 1000) {
                        return `${(value / 1000).toFixed(1)}K`;
                      }
                      return value;
                    }}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: 'none',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      padding: '8px 12px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {incomeByCategory.map((entry, index) => (
                      <Cell 
                        key={index} 
                        fill={`url(#colorGradient${index})`}
                        stroke={entry.color}
                        strokeWidth={1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
