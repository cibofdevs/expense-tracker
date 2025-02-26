import { supabase } from './supabase';

// Types
export interface Currency {
  code: string;
  name: string;
}

export interface ExchangeRateResponse {
  result: string;
  documentation: string;
  terms_of_use: string;
  time_last_update_unix: number;
  time_last_update_utc: string;
  time_next_update_unix: number;
  time_next_update_utc: string;
  base_code: string;
  target_code?: string;
  conversion_rate?: number;
  conversion_result?: number;
  error?: string;
}

interface CachedRates {
  rates: { [key: string]: number };
  timestamp: number;
}

// Constants
const API_KEY = import.meta.env.VITE_EXCHANGE_RATE_API_KEY;
const BASE_URL = 'https://v6.exchangerate-api.com/v6';

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'IDR', name: 'Indonesian Rupiah' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'USD', name: 'US Dollar' }
];

// Local storage keys
const CURRENCY_STORAGE_KEY = 'user_currency';
const EXCHANGE_RATES_KEY = 'exchange_rates';
const RATES_TIMESTAMP_KEY = 'exchange_rates_timestamp';

// Cache duration in milliseconds (15 minutes)
const CACHE_DURATION = 15 * 60 * 1000;

export function getStoredCurrency(): string {
  return localStorage.getItem(CURRENCY_STORAGE_KEY) || 'IDR';
}

export function setStoredCurrency(currency: string): void {
  const validCurrency = SUPPORTED_CURRENCIES.find(c => c.code === currency);
  if (!validCurrency) {
    throw new Error(`Unsupported currency: ${currency}`);
  }
  localStorage.setItem(CURRENCY_STORAGE_KEY, currency);
}

export function formatCurrency(amount: number, currency: string): string {
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
}

export async function fetchExchangeRate(fromCurrency: string, toCurrency: string): Promise<number> {
  console.log(`Fetching exchange rate from ${fromCurrency} to ${toCurrency}`);
  
  // Check cache first
  const cachedRates = getCachedRates(fromCurrency);
  if (cachedRates?.rates[toCurrency]) {
    console.log('Using cached rate');
    return cachedRates.rates[toCurrency];
  }
  
  try {
    // Make the API request
    const url = `${BASE_URL}/${API_KEY}/pair/${fromCurrency}/${toCurrency}`;
    console.log('API URL:', url);
    
    const response = await fetch(url);
    const data: ExchangeRateResponse = await response.json();
    
    console.log('API Response:', data);

    if (!response.ok || data.error) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    if (typeof data.conversion_rate !== 'number') {
      console.error('Invalid API response:', data);
      throw new Error('Invalid API response: missing or invalid conversion rate');
    }

    // Cache the result
    updateRatesCache(fromCurrency, toCurrency, data.conversion_rate);
    
    return data.conversion_rate;
  } catch (error) {
    console.error('Error fetching exchange rate:', error);
    throw new Error(`Failed to fetch exchange rate: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function getCachedRates(currency: string): CachedRates | null {
  const ratesJson = localStorage.getItem(`${EXCHANGE_RATES_KEY}_${currency}`);
  const timestamp = Number(localStorage.getItem(`${RATES_TIMESTAMP_KEY}_${currency}`));
  
  if (!ratesJson || !timestamp || Date.now() - timestamp > CACHE_DURATION) {
    return null;
  }
  
  try {
    return {
      rates: JSON.parse(ratesJson),
      timestamp
    };
  } catch {
    return null;
  }
}

function updateRatesCache(fromCurrency: string, toCurrency: string, rate: number): void {
  const cachedRates = getCachedRates(fromCurrency)?.rates || {};
  cachedRates[toCurrency] = rate;
  
  localStorage.setItem(`${EXCHANGE_RATES_KEY}_${fromCurrency}`, JSON.stringify(cachedRates));
  localStorage.setItem(`${RATES_TIMESTAMP_KEY}_${fromCurrency}`, Date.now().toString());
}

export async function convertAmount(amount: number, fromCurrency: string, toCurrency: string): Promise<number> {
  if (fromCurrency === toCurrency) return amount;
  
  try {
    const rate = await fetchExchangeRate(fromCurrency, toCurrency);
    const convertedAmount = Number((amount * rate).toFixed(2));
    console.log(`Converting ${amount} ${fromCurrency} to ${toCurrency}. Rate: ${rate}, Result: ${convertedAmount}`);
    return convertedAmount;
  } catch (error) {
    console.error('Error converting amount:', error);
    throw error;
  }
}

interface ExpenseRecord {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  description: string;
  category_id: string;
  date: string;
  updated_at?: string;
}

interface IncomeRecord {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  description: string;
  category_id: string;
  date: string;
  updated_at?: string;
}

export async function updateExpenseAmounts(fromCurrency: string, toCurrency: string): Promise<void> {
  console.log('Starting currency conversion...', { fromCurrency, toCurrency });
  
  if (!SUPPORTED_CURRENCIES.find(c => c.code === fromCurrency) || 
      !SUPPORTED_CURRENCIES.find(c => c.code === toCurrency)) {
    throw new Error(`Unsupported currency conversion from ${fromCurrency} to ${toCurrency}`);
  }

  try {
    // First verify we can get the exchange rate
    const testRate = await fetchExchangeRate(fromCurrency, toCurrency);
    console.log('Verified exchange rate:', testRate);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not found');

    // Get all expenses and income records for the user
    const [expensesResult, incomeResult] = await Promise.all([
      supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .eq('currency', fromCurrency),
      supabase
        .from('income_records')
        .select('*')
        .eq('user_id', user.id)
        .eq('currency', fromCurrency)
    ]);

    if (expensesResult.error) {
      console.error('Error fetching expenses:', expensesResult.error);
      throw new Error(`Failed to fetch expenses: ${expensesResult.error.message}`);
    }
    if (incomeResult.error) {
      console.error('Error fetching income:', incomeResult.error);
      throw new Error(`Failed to fetch income: ${incomeResult.error.message}`);
    }

    const expenses = (expensesResult.data || []) as ExpenseRecord[];
    const incomeRecords = (incomeResult.data || []) as IncomeRecord[];
    console.log(`Found ${expenses.length} expenses and ${incomeRecords.length} income records to convert`);

    // Convert and update expenses
    if (expenses.length > 0) {
      console.log('Converting expenses...');
      const expenseUpdates = await Promise.all(
        expenses.map(async (expense) => {
          try {
            const convertedAmount = await convertAmount(expense.amount, fromCurrency, toCurrency);
            return {
              ...expense,
              amount: convertedAmount,
              currency: toCurrency,
              updated_at: new Date().toISOString()
            };
          } catch (error) {
            console.error(`Error converting expense ${expense.id}:`, error);
            throw error;
          }
        })
      );

      console.log('Updating expenses in database...');
      const { error: expenseError } = await supabase
        .from('expenses')
        .upsert(expenseUpdates);

      if (expenseError) {
        console.error('Error updating expenses in database:', expenseError);
        throw new Error(`Failed to update expenses: ${expenseError.message}`);
      }
      console.log(`Successfully converted ${expenses.length} expenses`);
    }

    // Convert and update income records
    if (incomeRecords.length > 0) {
      console.log('Converting income records...');
      const incomeUpdates = await Promise.all(
        incomeRecords.map(async (income) => {
          try {
            const convertedAmount = await convertAmount(income.amount, fromCurrency, toCurrency);
            return {
              ...income,
              amount: convertedAmount,
              currency: toCurrency,
              updated_at: new Date().toISOString()
            };
          } catch (error) {
            console.error(`Error converting income ${income.id}:`, error);
            throw error;
          }
        })
      );

      console.log('Updating income records in database...');
      const { error: incomeError } = await supabase
        .from('income_records')
        .upsert(incomeUpdates);

      if (incomeError) {
        console.error('Error updating income records in database:', incomeError);
        throw new Error(`Failed to update income records: ${incomeError.message}`);
      }
      console.log(`Successfully converted ${incomeRecords.length} income records`);
    }

    console.log('All currency conversions completed successfully');
  } catch (error) {
    console.error('Error in updateExpenseAmounts:', error);
    throw error instanceof Error ? error : new Error('Failed to convert currency');
  }
}

export async function getCachedExchangeRates(currency: string): Promise<ExchangeRateResponse> {
  const cachedRates = getCachedRates(currency);
  if (cachedRates) {
    return {
      result: 'success',
      base_code: currency,
      conversion_rate: 1,
      time_last_update_unix: Math.floor(cachedRates.timestamp / 1000),
      time_last_update_utc: new Date(cachedRates.timestamp).toUTCString(),
      time_next_update_unix: Math.floor((cachedRates.timestamp + CACHE_DURATION) / 1000),
      time_next_update_utc: new Date(cachedRates.timestamp + CACHE_DURATION).toUTCString(),
      documentation: '',
      terms_of_use: ''
    };
  }
  
  // If no cache, fetch fresh rates
  await fetchExchangeRate(currency, SUPPORTED_CURRENCIES[0].code);
  return getCachedExchangeRates(currency);
}