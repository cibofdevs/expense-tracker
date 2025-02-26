import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from 'react-hot-toast';
import { BarChart3, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<'sign_in' | 'sign_up' | 'forgot_password'>('sign_in');
  const location = useLocation();

  useEffect(() => {
    // Check if redirected from expired reset link
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('reset_expired') === 'true') {
      setAuthMode('forgot_password');
      toast.error('Password reset link has expired. Please request a new one.');
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (authMode === 'sign_in') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success('Successfully logged in!');
      } else if (authMode === 'sign_up') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        }, {
          redirectTo: `${import.meta.env.VITE_APP_URL}/auth`
        });
        if (error) throw error;
        toast.success('Check your email for the confirmation link!');
      } else if (authMode === 'forgot_password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${import.meta.env.VITE_APP_URL}/reset-password`,
        });
        if (error) throw error;
        toast.success('Check your email for the password reset link!');
        setAuthMode('sign_in');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderForm = () => {
    if (authMode === 'forgot_password') {
      return (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white bg-white dark:bg-slate-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                placeholder="Enter your email address"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Send Reset Link'
              )}
            </button>
          </div>
        </form>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="email" className="sr-only">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white bg-white dark:bg-slate-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              placeholder="Email address"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-12 py-3 border border-gray-300 dark:border-slate-600 rounded-xl text-gray-900 dark:text-white bg-white dark:bg-slate-700 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              placeholder="Password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-300"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-xl shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              authMode === 'sign_in' ? 'Sign In' : 'Sign Up'
            )}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl overflow-hidden">
        <div className="px-8 pt-8 pb-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-2" />
          <h1 className="text-2xl font-bold mb-1">Exp analysis</h1>
          <p className="text-blue-100">Track and analyze your expenses with ease</p>
        </div>

        <div className="p-8">
          {authMode === 'forgot_password' && (
            <button
              onClick={() => setAuthMode('sign_in')}
              className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors duration-300"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Sign In
            </button>
          )}

          {renderForm()}

          <div className="mt-6 text-center space-y-3">
            {authMode === 'sign_in' && (
              <button
                onClick={() => setAuthMode('forgot_password')}
                className="text-sm text-blue-500 hover:text-blue-600 transition-colors duration-300"
              >
                Forgot your password?
              </button>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {authMode === 'sign_in' ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setAuthMode(authMode === 'sign_in' ? 'sign_up' : 'sign_in')}
                className="font-medium text-blue-500 hover:text-blue-600 transition-colors duration-300"
              >
                {authMode === 'sign_in' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}