import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BarChart3, AlertCircle } from 'lucide-react';

export function ResetPasswordError() {
  const navigate = useNavigate();
  const location = useLocation();
  const hash = location.hash;
  const params = new URLSearchParams(hash.substring(1));
  const errorDescription = params.get('error_description')?.replace(/\+/g, ' ') || 'An error occurred with the password reset link';

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="px-8 pt-8 pb-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-2" />
          <h1 className="text-2xl font-bold mb-1">Password Reset Error</h1>
          <p className="text-blue-100">Unable to reset password</p>
        </div>

        <div className="p-8">
          <div className="text-center mb-6">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {errorDescription}
            </p>
            <button
              onClick={() => navigate('/?reset_expired=true')}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
            >
              Request New Reset Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
