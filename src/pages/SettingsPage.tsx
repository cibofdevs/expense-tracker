import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { setTheme } from '../lib/theme';
import { 
  updateExpenseAmounts, 
  getCachedExchangeRates, 
  getStoredCurrency, 
  setStoredCurrency,
  SUPPORTED_CURRENCIES,
  fetchExchangeRate
} from '../lib/currency';
import type { UserPreferences, UserDetails } from '../types';

type SettingsPageProps = {
  user: { id: string; email: string } | null;
  onUpdatePreferences: (preferences: UserPreferences) => void;
};

export function SettingsPage({ user, onUpdatePreferences }: SettingsPageProps) {
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currency, setCurrency] = useState(getStoredCurrency());
  const [theme, setThemeState] = useState<'light' | 'dark' | 'system'>('light');
  const [currentCurrency, setCurrentCurrency] = useState(getStoredCurrency());
  const [, setExchangeRate] = useState<number | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails>({
    full_name: null,
    avatar_url: null,
    phone: null,
    address: null
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserPreferences();
      fetchUserDetails();
    }
  }, [user]);

  useEffect(() => {
    if (currency !== currentCurrency) {
      updateExchangeRate();
    }
  }, [currency, currentCurrency]);

  const updateExchangeRate = async () => {
    try {
      const rates = await getCachedExchangeRates(currentCurrency);
      if (rates.conversion_rate) {
        setExchangeRate(rates.conversion_rate);
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      setExchangeRate(null);
    }
  };

  const fetchUserPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
        throw error;
      }

      if (data) {
        setCurrency(data.default_currency);
        setCurrentCurrency(data.default_currency);
        setThemeState(data.theme);
        setTheme(data.theme);
      } else {
        // Create default preferences
        const defaultPrefs = {
          user_id: user?.id,
          theme: 'light',
          default_currency: 'IDR',
          updated_at: new Date().toISOString()
        };

        const { error: insertError } = await supabase
          .from('user_preferences')
          .insert([defaultPrefs]);

        if (insertError) throw insertError;

        // Set state with default values
        setCurrency('IDR');
        setCurrentCurrency('IDR');
        setThemeState('light');
        setTheme('light');
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      toast.error('Failed to load preferences');
    }
  };

  const fetchUserDetails = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_details')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setUserDetails(data);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  const handleUpdateUserDetails = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('user_details')
        .upsert({
          user_id: user.id,
          full_name: userDetails.full_name,
          phone: userDetails.phone,
          address: userDetails.address,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;

      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // First update the expenses with new currency
      if (currency !== currentCurrency) {
        console.log('Converting amounts from', currentCurrency, 'to', currency);
        try {
          // Test the exchange rate first
          const testRate = await fetchExchangeRate(currentCurrency, currency);
          console.log('Exchange rate verified:', testRate);
          
          // Proceed with conversion
          await updateExpenseAmounts(currentCurrency, currency);
          console.log('Successfully converted amounts');
        } catch (error) {
          console.error('Error converting amounts:', error);
          if (error instanceof Error) {
            throw new Error(`Failed to convert amounts: ${error.message}`);
          }
          throw new Error('Failed to convert currency');
        }
      }

      // Then update user preferences
      console.log('Updating user preferences...');
      const { data, error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          theme,
          default_currency: currency,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(`Failed to update preferences: ${error.message}`);
      }

      // Update stored currency and theme
      setStoredCurrency(currency);
      setTheme(theme);
      setCurrentCurrency(currency);

      // Notify parent component to update preferences
      if (data) {
        onUpdatePreferences(data);
      }

      toast.success('Preferences saved successfully');
      console.log('Preferences saved successfully');
    } catch (error) {
      console.error('Error saving preferences:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to save preferences');
      }
      
      // Reset currency selection on error
      setCurrency(currentCurrency);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase.auth.admin.deleteUser(user.id);

      if (error) throw error;

      toast.success('Account deleted successfully');
      window.location.reload();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      setLoading(true);

      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update user_details
      const { error: updateError } = await supabase
        .from('user_details')
        .upsert({
          user_id: user.id,
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (updateError) throw updateError;

      toast.success('Profile picture updated successfully');
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast.error('Failed to update profile picture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-1xl mx-auto py-4 px-4 space-y-4">
      {/* Profile Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl shadow-lg border border-blue-100 dark:border-gray-600">
        <h3 className="text-lg font-semibold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
          <span className="p-2 bg-blue-100 dark:bg-gray-700 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </span>
          Profile Settings
        </h3>
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-24 h-24 mb-4">
            <img
              src={imagePreview || userDetails.avatar_url || '/default-avatar.png'}
              alt="Profile"
              className="w-full h-full rounded-full object-cover"
            />
            <button
              onClick={() => document.getElementById('avatar-upload')?.click()}
              className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors duration-300"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <input
              type="file"
              id="avatar-upload"
              className="hidden"
              accept="image/*"
              onChange={handleAvatarChange}
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Click the edit icon to change your profile picture</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name</label>
            <input
              type="text"
              value={userDetails.full_name || ''}
              onChange={(e) => setUserDetails({ ...userDetails, full_name: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
            <input
              type="tel"
              value={userDetails.phone || ''}
              onChange={(e) => setUserDetails({ ...userDetails, phone: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</label>
          <textarea
            value={userDetails.address || ''}
            onChange={(e) => setUserDetails({ ...userDetails, address: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleUpdateUserDetails}
          disabled={loading}
          className={`mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* Security Section */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl shadow-lg border border-purple-100 dark:border-gray-600">
        <h3 className="text-lg font-semibold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
          <span className="p-2 bg-purple-100 dark:bg-gray-700 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600 dark:text-purple-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
          </span>
          Security
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            onClick={handleUpdatePassword}
            disabled={loading}
            className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl shadow-lg border border-emerald-100 dark:border-gray-600">
        <h3 className="text-lg font-semibold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
          <span className="p-2 bg-emerald-100 dark:bg-gray-700 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
          </span>
          Preferences
        </h3>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
              <select
                value={theme}
                onChange={(e) => {
                  const newTheme = e.target.value as 'light' | 'dark' | 'system';
                  setThemeState(newTheme);
                  setTheme(newTheme); // Apply theme immediately
                }}
                className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SUPPORTED_CURRENCIES.map((curr) => (
                  <option key={curr.code} value={curr.code}>
                    {curr.code} - {curr.name}
                  </option>
                ))}
              </select>
              {currency !== currentCurrency && (
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Note: Changing currency will convert all your existing expenses to the new currency.
                </p>
              )}
            </div>
          </div>

          <button
            onClick={handleSavePreferences}
            disabled={loading}
            className={`px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {/* Delete Account Section */}
      <div className="bg-gradient-to-br from-rose-50 to-red-50 dark:from-gray-800 dark:to-gray-700 p-6 rounded-xl shadow-lg border border-rose-100 dark:border-gray-600">
        <h3 className="text-lg font-semibold mb-6 text-gray-800 dark:text-white flex items-center gap-2">
          <span className="p-2 bg-rose-100 dark:bg-gray-700 rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-600 dark:text-rose-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </span>
          Delete Account
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Warning: This action will permanently delete your account and all associated data. This cannot be undone.
        </p>
        <button
          onClick={() => setShowDeleteConfirm(true)}
          disabled={loading}
          className={`px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Delete Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <h4 className="text-lg font-semibold mb-4 dark:text-white flex items-center gap-2">
              <span className="p-2 bg-rose-100 dark:bg-gray-700 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-rose-600 dark:text-rose-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </span>
              Confirm Account Deletion
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
