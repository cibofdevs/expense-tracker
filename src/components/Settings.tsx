import React from 'react';
import { Settings as SettingsIcon } from 'lucide-react';

export function Settings() {
  return (
    <div className="container mx-auto px-4 py-4">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="px-6 pt-6 pb-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <div className="flex items-center gap-4">
            <SettingsIcon className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
        </div>
        
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Profile Section */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-gradient-to-br from-gray-50 to-gray-50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl shadow-lg border border-gray-100 dark:border-gray-600">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Profile Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white bg-white dark:bg-slate-700"
                    placeholder="Enter your display name"
                  />
                </div>
              </div>
            </div>

            {/* Preferences Section */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl shadow-lg border border-gray-100 dark:border-gray-600">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Preferences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Dark Mode</span>
                  <button className="w-12 h-6 rounded-full bg-gray-200 dark:bg-gray-700 relative">
                    <span className="w-4 h-4 rounded-full bg-white absolute left-1 top-1"></span>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Email Notifications</span>
                  <button className="w-12 h-6 rounded-full bg-blue-500 relative">
                    <span className="w-4 h-4 rounded-full bg-white absolute right-1 top-1"></span>
                  </button>
                </div>
              </div>
            </div>

            {/* Currency Section */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-50 dark:from-gray-800 dark:to-gray-700 p-4 rounded-xl shadow-lg border border-gray-100 dark:border-gray-600">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Currency Settings</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Currency
                </label>
                <select className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white bg-white dark:bg-slate-700">
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button className="px-6 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors duration-300">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
