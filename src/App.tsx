import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  X as XIcon, 
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Settings,
  LogOut,
  BarChart3,
  Bell,
  List,
  PieChart,
  Plus,
  User,
  Wallet,
  DollarSign,
  Tags,
  CalendarDays
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { supabase } from './lib/supabase';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { ExpenseCharts } from './components/ExpenseCharts';
import { Auth } from './components/Auth';
import { SettingsPage } from './pages/SettingsPage';
import { UserProfile } from './components/UserProfile';
import { setTheme } from './lib/theme';
import { NotificationList } from './components/NotificationList';
import { BudgetAllocationForm } from './components/BudgetAllocationForm';
import { IncomeForm } from './components/IncomeForm';
import { IncomeList } from './components/IncomeList';
import { TransactionList } from './components/TransactionList';
import { BudgetForm } from './components/BudgetForm';
import { Categories } from './components/Categories';
import { Analytics } from './components/Analytics';
import { CategoryForm } from './components/CategoryForm';
import { ResetPassword } from './components/ResetPassword';
import { ResetPasswordError } from './components/ResetPasswordError';
import type { Category, Expense, UserPreferences, Notification, UserDetails, IncomeRecord } from './types';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

type ActiveMenu = 'summary' | 'transactions' | 'analytics' | 'income' | 'expenses' | 'budget' | 'settings' | 'categories';

const MENUS_WITH_DATE = ['summary', 'transactions', 'expenses', 'income', 'analytics'];

const AppWrapper = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/reset-password" element={
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
          <ResetPassword />
        </div>
      } />
      <Route path="/reset-password-error" element={
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
          <ResetPasswordError />
        </div>
      } />
      <Route path="/" element={<MainApp initialMenu="summary" />} />
      <Route path="/transactions" element={<MainApp initialMenu="transactions" />} />
      <Route path="/expenses" element={<MainApp initialMenu="expenses" />} />
      <Route path="/income" element={<MainApp initialMenu="income" />} />
      <Route path="/analytics" element={<MainApp initialMenu="analytics" />} />
      <Route path="/categories" element={<MainApp initialMenu="categories" />} />
      <Route path="/settings" element={<MainApp initialMenu="settings" />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

interface MainAppProps {
  initialMenu: ActiveMenu;
}

const MainApp = ({ initialMenu }: MainAppProps) => {
  const [dateRange, setDateRange] = useState<{
    start: string;
    end: string;
    selecting?: boolean;
  }>({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    selecting: false
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>(initialMenu);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([]);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [showBudgetForm, setShowBudgetForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeRecord | null>(null);
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [filteredIncome, setFilteredIncome] = useState<IncomeRecord[]>([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const dateDropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handlePasswordResetError = () => {
      const hash = location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1));
        const error = params.get('error');
        
        if (error === 'access_denied' && params.get('error_code') === 'otp_expired') {
          navigate('/reset-password-error' + hash);
        }
      }
    };

    handlePasswordResetError();
  }, [location, navigate]);

  useEffect(() => {
    // Filter expenses based on date range
    const filtered = expenses.filter(expense => {
      const expenseDate = expense.date;
      return expenseDate >= dateRange.start && expenseDate <= dateRange.end;
    });
    setFilteredExpenses(filtered);
  }, [expenses, dateRange]);

  useEffect(() => {
    // Filter income records based on date range
    const filtered = incomeRecords.filter(record => {
      const recordDate = record.date;
      return recordDate >= dateRange.start && recordDate <= dateRange.end;
    });
    setFilteredIncome(filtered);
  }, [incomeRecords, dateRange]);

  useEffect(() => {
    // Update activeMenu based on current route
    const path = location.pathname.substring(1); // Remove leading slash
    if (path === '') {
      setActiveMenu('summary');
    } else if (path === 'settings' || path === 'transactions' || path === 'expenses' || 
               path === 'income' || path === 'analytics' || path === 'categories') {
      setActiveMenu(path as ActiveMenu);
    }
  }, [location]);

  useEffect(() => {
    // Set initial theme based on system preference
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null;
    setTheme(savedTheme || 'system');

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!
        });
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email!
        });
      } else {
        setUser(null);
        setUserPreferences(null);
        setUserDetails(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchCategories();
      fetchUserDetails();
      fetchUserPreferences();
      fetchExpenses();
      fetchIncomeRecords();
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
      if (dateDropdownRef.current && !dateDropdownRef.current.contains(event.target as Node)) {
        setShowDateDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchUserDetails = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_details')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setUserDetails(data);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const fetchUserPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user preferences:', error);
        return;
      }

      if (data) {
        setUserPreferences(data);
        setTheme(data.theme || 'system');
      } else {
        // Create default preferences if none exist
        const { data: newPrefs, error: createError } = await supabase
          .from('user_preferences')
          .insert([{
            user_id: user.id,
            default_currency: 'USD',
            theme: 'system',
            notification_enabled: true
          }])
          .select()
          .single();

        if (createError) {
          console.error('Error creating user preferences:', createError);
          return;
        }

        if (newPrefs) {
          setUserPreferences(newPrefs);
          setTheme(newPrefs.theme || 'system');
        }
      }
    } catch (error) {
      console.error('Error in fetchUserPreferences:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select(`
          *,
          category:categories(
            id,
            name,
            icon,
            color
          )
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const fetchIncomeRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('income_records')
        .select(`
          *,
          category:categories(
            id,
            name,
            icon,
            color
          )
        `)
        .order('date', { ascending: false });

      if (error) throw error;
      setIncomeRecords(data || []);
    } catch (error) {
      console.error('Error fetching income records:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchCategories = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleExpenseSuccess = () => {
    setShowAddExpense(false);
    setEditingExpense(null);
    fetchExpenses();
  };

  const handleIncomeSuccess = () => {
    setShowIncomeForm(false);
    setEditingIncome(null);
    fetchIncomeRecords();
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setShowUserDropdown(false);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out');
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;
      
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    const localeMap: Record<string, string> = {
      'IDR': 'id-ID',
      'AED': 'ar-AE',
      'USD': 'en-US'
    };

    const locale = localeMap[currency] || 'en-US';
    
    // Special handling for IDR to show without decimal places
    const options: Intl.NumberFormatOptions = {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'IDR' ? 0 : 2,
      maximumFractionDigits: currency === 'IDR' ? 0 : 2,
      currencyDisplay: 'symbol'
    };

    return new Intl.NumberFormat(locale, options).format(amount);
  };

  const formatCurrencyWithPreferences = (amount: number) => {
    if (!userPreferences) return formatCurrency(amount, 'IDR');
    return formatCurrency(amount, userPreferences.default_currency);
  };

  const handleDateClick = (date: string) => {
    if (!dateRange.selecting) {
      // First click - start date
      setDateRange({
        start: date,
        end: date,
        selecting: true
      });
    } else {
      // Second click - end date
      const start = new Date(dateRange.start);
      const end = new Date(date);
      
      setDateRange({
        start: format(start <= end ? start : end, 'yyyy-MM-dd'),
        end: format(start <= end ? end : start, 'yyyy-MM-dd'),
        selecting: false
      });
      setShowDateDropdown(false);
    }
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }

    // Add the days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = format(new Date(year, month, day), 'yyyy-MM-dd');
      days.push(date);
    }

    // Add empty cells for the remaining days to complete the grid
    const totalCells = Math.ceil((firstDayOfMonth + daysInMonth) / 7) * 7;
    for (let i = days.length; i < totalCells; i++) {
      days.push(null);
    }

    return days;
  };

  const renderCalendar = () => {
    const days = generateCalendarDays();
    const weeks = [];
    let week = [];

    for (let i = 0; i < days.length; i++) {
      week.push(days[i]);
      if (week.length === 7 || i === days.length - 1) {
        weeks.push(
          <tr key={`week-${weeks.length}`}>
            {week.map((day, index) => (
              <td key={index} className="p-2 text-center cursor-pointer transition-colors duration-300">
                {day && (
                  <button
                    onClick={() => handleDateClick(day)}
                    className={`p-2 text-sm rounded-lg text-gray-700 dark:text-gray-200
                      ${!day ? 'invisible' : 'hover:bg-blue-100 dark:hover:bg-blue-900/50'}
                      ${day && isWithinInterval(new Date(day), {
                        start: new Date(dateRange.start),
                        end: new Date(dateRange.end)
                      }) ? 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700' : ''}
                    `}
                  >
                    {day ? format(new Date(day), 'd') : ''}
                  </button>
                )}
              </td>
            ))}
          </tr>
        );
        week = [];
      }
    }

    return weeks;
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'expenses':
        return (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm transition-colors duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold dark:text-white">Expenses</h3>
              <button
                onClick={() => {
                  setShowAddExpense(true);
                  setEditingExpense(null);
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-300"
              >
                Add Expense
              </button>
            </div>
            <ExpenseList
              expenses={filteredExpenses}
              onEdit={setEditingExpense}
              onDelete={() => fetchExpenses()}
              formatCurrency={formatCurrencyWithPreferences}
            />
          </div>
        );
      case 'income':
        return (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm transition-colors duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold dark:text-white">Income Records</h3>
              <button
                onClick={() => setShowIncomeForm(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-300"
              >
                Add Income
              </button>
            </div>
            <IncomeList
              records={filteredIncome}
              onEdit={setEditingIncome}
              onDelete={() => fetchIncomeRecords()}
              formatCurrency={formatCurrencyWithPreferences}
            />
          </div>
        );
      case 'transactions':
        const allTransactions = [
          ...filteredExpenses.map(expense => ({ ...expense, type: 'expense' as const })),
          ...filteredIncome.map(income => ({ ...income, type: 'income' as const }))
        ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm transition-colors duration-300">
            <h3 className="text-lg font-semibold mb-6 dark:text-white">All Transactions</h3>
            <TransactionList
              transactions={allTransactions}
              onEditExpense={setEditingExpense}
              onEditIncome={setEditingIncome}
              onDelete={() => {
                fetchExpenses();
                fetchIncomeRecords();
              }}
              formatCurrency={formatCurrencyWithPreferences}
            />
          </div>
        );
      case 'budget':
        const totalIncome = filteredIncome.reduce((sum, inc) => sum + inc.amount, 0);
        
        return (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm transition-colors duration-300">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold dark:text-white">Budget Management</h3>
              <button
                onClick={() => setShowBudgetForm(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors duration-300"
              >
                Manage Budget Allocation
              </button>
            </div>
            <div className="grid gap-6">
              {categories
                .filter(cat => cat.type === 'expense')
                .map(category => {
                  const totalSpent = filteredExpenses
                    .filter(exp => exp.category_id === category.id)
                    .reduce((sum, exp) => sum + exp.amount, 0);
                  
                  const monthlyBudget = category.budget_percentage 
                    ? (totalIncome * (category.budget_percentage / 100))
                    : 0;
                  
                  const percentage = monthlyBudget > 0 
                    ? (totalSpent / monthlyBudget) * 100
                    : 0;

                  return (
                    <div key={category.id} className="p-4 border dark:border-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span style={{ color: category.color }}>{category.icon}</span>
                          <span className="font-medium dark:text-white">{category.name}</span>
                        </div>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatCurrencyWithPreferences(totalSpent)} / {formatCurrencyWithPreferences(monthlyBudget)}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            percentage > 100 ? 'bg-red-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1 text-sm">
                        <span className={`font-medium ${
                          percentage > 100 ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {percentage.toFixed(1)}% used
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {category.budget_percentage}% of income
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm transition-colors duration-300">
            <h3 className="text-lg font-semibold mb-6 dark:text-white">Financial Analytics</h3>
            <Analytics
              expenses={filteredExpenses}
              incomeRecords={filteredIncome}
              categories={categories}
              formatCurrency={formatCurrencyWithPreferences}
            />
          </div>
        );
      case 'settings':
        return (
          <div className="space-y-6">
            <SettingsPage 
              user={user} 
              onUpdatePreferences={handleUpdatePreferences}
            />
          </div>
        );
      case 'categories':
        return (
          <div className="p-4">
            <h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-white">Categories</h1>
            <Categories 
              theme={userPreferences?.theme}
              onShowForm={() => {
                setShowCategoryForm(true);
                setEditingCategory(null);
              }}
              onEditCategory={(category) => {
                setEditingCategory(category);
                setShowCategoryForm(true);
              }}
            />
          </div>
        );
      default:
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-500 dark:to-emerald-600 p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium">Income</h3>
                  <DollarSign className="w-6 h-6 text-white/80" />
                </div>
                <p className="text-2xl font-bold text-white mb-2">
                  {formatCurrencyWithPreferences(filteredIncome.reduce((sum, inc) => sum + inc.amount, 0))}
                </p>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm text-white/90">
                    <span>Average</span>
                    <span className="font-medium">
                      {formatCurrencyWithPreferences(
                        filteredIncome.length > 0
                          ? filteredIncome.reduce((sum, inc) => sum + inc.amount, 0) / filteredIncome.length
                          : 0
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-white/90">
                    <span>Highest</span>
                    <span className="font-medium">
                      {formatCurrencyWithPreferences(
                        Math.max(...(filteredIncome.length > 0 
                          ? filteredIncome.map(inc => inc.amount) 
                          : [0]))
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-white/80 mt-2">
                    {format(new Date(dateRange.start), 'MMM d')} - {format(new Date(dateRange.end), 'MMM d')}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-red-400 to-rose-500 dark:from-red-500 dark:to-rose-600 p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium">Expenses</h3>
                  <Wallet className="w-6 h-6 text-white/80" />
                </div>
                <p className="text-2xl font-bold text-white mb-2">
                  {formatCurrencyWithPreferences(filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0))}
                </p>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm text-white/90">
                    <span>Average</span>
                    <span className="font-medium">
                      {formatCurrencyWithPreferences(
                        filteredExpenses.length > 0
                          ? filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0) / filteredExpenses.length
                          : 0
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-white/90">
                    <span>Top Category</span>
                    <span className="font-medium">
                      {filteredExpenses.length > 0
                        ? Object.entries(
                            filteredExpenses.reduce((acc, exp) => {
                              const categoryName = categories.find(cat => cat.id === exp.category_id)?.name || 'Uncategorized';
                              acc[categoryName] = (acc[categoryName] || 0) + exp.amount;
                              return acc;
                            }, {} as Record<string, number>)
                          )
                            .sort(([, a], [, b]) => b - a)[0][0]
                        : 'N/A'}
                    </span>
                  </div>
                  <p className="text-xs text-white/80 mt-2">
                    {format(new Date(dateRange.start), 'MMM d')} - {format(new Date(dateRange.end), 'MMM d')}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-400 to-indigo-500 dark:from-blue-500 dark:to-indigo-600 p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium">Balance</h3>
                  <BarChart3 className="w-6 h-6 text-white/80" />
                </div>
                <p className="text-2xl font-bold text-white mb-2">
                  {formatCurrencyWithPreferences(
                    filteredIncome.reduce((sum, inc) => sum + inc.amount, 0) -
                    filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)
                  )}
                </p>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm text-white/90">
                    <span>Savings Rate</span>
                    <span className="font-medium">
                      {filteredIncome.reduce((sum, inc) => sum + inc.amount, 0) > 0
                        ? Math.round(
                            ((filteredIncome.reduce((sum, inc) => sum + inc.amount, 0) -
                              filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0)) /
                              filteredIncome.reduce((sum, inc) => sum + inc.amount, 0)) *
                              100
                          )
                        : 0}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-500" 
                      style={{ 
                        width: `${(filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0) / 
                          (filteredIncome.reduce((sum, inc) => sum + inc.amount, 0) || 1)) * 100}%` 
                      }} 
                    />
                  </div>
                  <p className="text-xs text-white/80 mt-2">
                    {format(new Date(dateRange.start), 'MMM d')} - {format(new Date(dateRange.end), 'MMM d')}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-purple-400 to-violet-500 dark:from-purple-500 dark:to-violet-600 p-6 rounded-xl shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium">Transactions</h3>
                  <List className="w-6 h-6 text-white/80" />
                </div>
                <p className="text-2xl font-bold text-white mb-2">
                  {filteredExpenses.length + filteredIncome.length}
                </p>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm text-white/90">
                    <span>Expenses</span>
                    <span className="font-medium">{filteredExpenses.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-white/90">
                    <span>Income</span>
                    <span className="font-medium">{filteredIncome.length}</span>
                  </div>
                  <div className="h-1.5 bg-white/20 rounded-full mt-2 overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-500" 
                      style={{ 
                        width: `${(filteredExpenses.length / (filteredExpenses.length + filteredIncome.length || 1)) * 100}%` 
                      }} 
                    />
                  </div>
                  <p className="text-xs text-white/80 mt-2">
                    {format(new Date(dateRange.start), 'MMM d')} - {format(new Date(dateRange.end), 'MMM d')}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg mb-8 transition-all duration-300">
              <h3 className="text-lg font-semibold mb-6 dark:text-white">Recent Transactions</h3>
              <TransactionList
                transactions={[
                  ...filteredExpenses.map(expense => ({ ...expense, type: 'expense' as const })),
                  ...filteredIncome.map(income => ({ ...income, type: 'income' as const }))
                ]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 5)}
                onEditExpense={setEditingExpense}
                onEditIncome={setEditingIncome}
                onDelete={() => {
                  fetchExpenses();
                  fetchIncomeRecords();
                }}
                formatCurrency={formatCurrencyWithPreferences}
              />
            </div>
            <ExpenseCharts categories={categories} expenses={filteredExpenses} />
          </>
        );
    }
  };

  const handleBudgetSuccess = () => {
    fetchCategories();
  };

  const handleUpdatePreferences = async (newPreferences: UserPreferences) => {
    setUserPreferences(newPreferences);
    await Promise.all([
      fetchExpenses(),
      fetchIncomeRecords()
    ]);
  };

  const handleMenuChange = (menu: ActiveMenu) => {
    setActiveMenu(menu);
    setShowUserDropdown(false);
    setIsMobileMenuOpen(false);
    
    // Update URL based on menu
    switch (menu) {
      case 'settings':
        navigate('/settings', { replace: true });
        break;
      case 'summary':
        navigate('/', { replace: true });
        break;
      case 'transactions':
        navigate('/transactions', { replace: true });
        break;
      case 'expenses':
        navigate('/expenses', { replace: true });
        break;
      case 'income':
        navigate('/income', { replace: true });
        break;
      case 'analytics':
        navigate('/analytics', { replace: true });
        break;
      case 'categories':
        navigate('/categories', { replace: true });
        break;
      default:
        navigate('/', { replace: true });
    }
  };

  const renderHeader = () => (
    <div className="flex justify-between items-center mb-8 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 p-6 rounded-2xl shadow-lg">
      <h1 className="text-3xl font-bold text-white capitalize tracking-wide">
        {activeMenu.charAt(0).toUpperCase() + activeMenu.slice(1)}
      </h1>
      <div className="flex items-center gap-6">
        {MENUS_WITH_DATE.includes(activeMenu) && (
          <div className="relative ml-auto" ref={dateDropdownRef}>
            <button
              onClick={() => setShowDateDropdown(!showDateDropdown)}
              className="flex items-center space-x-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors duration-200"
              title={`${format(new Date(dateRange.start), 'MMM d')} - ${format(new Date(dateRange.end), 'MMM d')}`}
            >
              <CalendarDays className="w-5 h-5" />
              <span className="hidden lg:inline whitespace-nowrap">{format(new Date(dateRange.start), 'MMM d')} - {format(new Date(dateRange.end), 'MMM d')}</span>
              <ChevronDown className="w-4 h-4 hidden lg:block" />
            </button>

            {showDateDropdown && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 border dark:border-gray-700">
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className="font-medium dark:text-white">
                      {format(currentMonth, 'MMMM yyyy')}
                    </span>
                    <button
                      onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                      <div key={day} className="text-center text-sm font-medium text-gray-400 py-1">
                        {day}
                      </div>
                    ))}
                    {generateCalendarDays().map((day, index) => (
                      <button
                        key={index}
                        onClick={() => day && handleDateClick(day)}
                        disabled={!day}
                        className={`p-2 text-sm rounded-lg text-gray-700 dark:text-gray-200
                          ${!day ? 'invisible' : 'hover:bg-blue-100 dark:hover:bg-blue-900/50'}
                          ${day && isWithinInterval(new Date(day), {
                            start: new Date(dateRange.start),
                            end: new Date(dateRange.end)
                          }) ? 'bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700' : ''}
                        `}
                      >
                        {day ? format(new Date(day), 'd') : ''}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="relative hidden md:block" ref={userDropdownRef}>
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center"
            aria-label="User menu"
            aria-expanded={showUserDropdown}
          >
            {userDetails?.avatar_url ? (
              <img
                src={userDetails.avatar_url}
                alt="User avatar"
                className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium border-2 border-white shadow-sm">
                {userDetails?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
              </div>
            )}
          </button>

          {/* User Dropdown Menu */}
          {showUserDropdown && (
            <div
              ref={userDropdownRef}
              className="absolute right-0 mt-2 w-56 origin-top-right bg-white dark:bg-gray-800 rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 dark:divide-gray-700 transform opacity-100 scale-100 transition ease-out duration-100 z-50"
            >
              <div className="px-4 py-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {userDetails?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                  {user?.email}
                </p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => handleMenuChange('settings')}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderFooter = () => (
    <footer className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
      Created with ❤️ by <span className="font-medium text-gray-700 dark:text-gray-300">Ahmad Wijaya</span>
    </footer>
  );

  const renderSidebar = () => (
    <div
      className={`fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-900 transform transition-transform duration-300 ease-in-out ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0 shadow-xl`}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 p-6 border-b border-gray-200 dark:border-gray-700">
          <BarChart3 className="w-8 h-8 text-blue-500" />
          <span className="text-xl font-semibold text-blue-500">
            Exp analysis
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => handleMenuChange('summary')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
              activeMenu === 'summary'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <PieChart className="w-5 h-5" />
            <span className="font-medium">Summary</span>
          </button>

          <button
            onClick={() => handleMenuChange('transactions')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
              activeMenu === 'transactions'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <List className="w-5 h-5" />
            <span className="font-medium">Transactions</span>
          </button>

          <button
            onClick={() => handleMenuChange('expenses')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
              activeMenu === 'expenses'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span className="font-medium">Expenses</span>
          </button>

          <button
            onClick={() => handleMenuChange('income')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
              activeMenu === 'income'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <DollarSign className="w-5 h-5" />
            <span className="font-medium">Income</span>
          </button>

          <button
            onClick={() => handleMenuChange('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
              activeMenu === 'analytics'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="font-medium">Analytics</span>
          </button>

          <button
            onClick={() => handleMenuChange('categories')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
              activeMenu === 'categories'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Tags className="w-5 h-5" />
            <span className="font-medium">Categories</span>
          </button>

          <button
            onClick={() => handleMenuChange('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
              activeMenu === 'settings'
                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderMobileHeader = () => (
    <div className="flex md:hidden items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors duration-300"
        >
          {isMobileMenuOpen ? <XIcon className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        <div className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-500" />
          <span className="text-lg font-semibold text-blue-500">
            Exp analysis
          </span>
        </div>
      </div>

      {/* User Avatar */}
      <div className="relative ml-3 md:hidden">
        <button
          onClick={() => setShowUserDropdown(!showUserDropdown)}
          className="flex items-center"
          aria-label="User menu"
          aria-expanded={showUserDropdown}
        >
          {userDetails?.avatar_url ? (
            <img
              src={userDetails.avatar_url}
              alt="User avatar"
              className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium border-2 border-white shadow-sm">
              {userDetails?.full_name?.[0] || user?.email?.[0]?.toUpperCase()}
            </div>
          )}
        </button>

        {/* User Dropdown Menu */}
        {showUserDropdown && (
          <div
            ref={userDropdownRef}
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg py-1 z-50"
          >
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {userDetails?.full_name || 'User'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                {user?.email}
              </p>
            </div>
            <button
              onClick={() => handleMenuChange('settings')}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Settings</span>
            </button>
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFF] dark:bg-slate-900 flex flex-col">
        <Toaster position="top-right" />
        <div className="flex-grow flex items-center justify-center px-6">
          <div className="w-full max-w-md">
            <Auth onSuccess={() => setShowAuth(false)} />
          </div>
        </div>
        {renderFooter()}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 transition-all duration-500">
      <Toaster position="top-right" />
      
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Category Form Modal */}
      {(showCategoryForm || editingCategory) && (
        <CategoryForm
          type={editingCategory?.type || 'expense'}
          category={editingCategory}
          onSuccess={() => {
            setShowCategoryForm(false);
            setEditingCategory(null);
            fetchCategories();
          }}
          onClose={() => {
            setShowCategoryForm(false);
            setEditingCategory(null);
          }}
          theme={userPreferences?.theme}
        />
      )}

      {/* Sidebar */}
      {renderSidebar()}

      <div className="md:ml-64 min-h-screen flex flex-col">
        <div className="flex-grow p-8">
          {renderMobileHeader()}
          {renderHeader()}
          <div className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-lg p-6 transition-all duration-300">
            {renderContent()}
          </div>
        </div>

        {renderFooter()}
      </div>

      {/* Modals */}
      {(showAddExpense || editingExpense) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md relative transition-all duration-300 transform scale-100">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
                {editingExpense ? 'Edit Expense' : 'Add Expense'}
              </h2>
              <button
                onClick={() => {
                  setShowAddExpense(false);
                  setEditingExpense(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-300"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            <ExpenseForm
              onSuccess={handleExpenseSuccess}
              expense={editingExpense}
              onCancel={() => {
                setShowAddExpense(false);
                setEditingExpense(null);
              }}
              theme={userPreferences?.theme}
            />
          </div>
        </div>
      )}

      {showBudgetForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md relative transition-all duration-300">
            <BudgetForm
              categories={categories}
              onClose={() => setShowBudgetForm(false)}
              onSuccess={handleBudgetSuccess}
            />
          </div>
        </div>
      )}

      {(showIncomeForm || editingIncome) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl w-full max-w-md relative transition-all duration-300">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white transition-colors duration-300">
              {editingIncome ? 'Edit Income' : 'Add Income'}
            </h2>
            <IncomeForm
              onSuccess={handleIncomeSuccess}
              initialData={editingIncome || undefined}
              onClose={() => {
                setShowIncomeForm(false);
                setEditingIncome(null);
              }}
              theme={userPreferences?.theme}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AppWrapper;