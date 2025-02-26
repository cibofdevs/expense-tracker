import React, { useState } from 'react';
import QRCode from 'react-qr-code';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';

interface TwoFactorSetupProps {
  onSuccess: () => void;
  onClose: () => void;
  theme?: 'light' | 'dark' | 'system';
}

export function TwoFactorSetup({ onSuccess, onClose, theme = 'light' }: TwoFactorSetupProps): JSX.Element {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  React.useEffect(() => {
    void generateTwoFactorSecret();
  }, []);

  const generateTwoFactorSecret = async (): Promise<void> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please login first');
        return;
      }

      const response = await fetch('/api/generate-2fa-secret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate 2FA secret');
      }

      const data = await response.json();
      setQrCodeUrl(data.qrCodeUrl);
      setSecret(data.secret);
    } catch (error) {
      console.error('Error generating 2FA secret:', error);
      toast.error('Failed to generate 2FA secret');
    }
  };

  const handleVerification = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please login first');
        return;
      }

      const response = await fetch('/api/verify-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          secret,
          token: verificationCode,
        }),
      });

      if (!response.ok) {
        throw new Error('Invalid verification code');
      }

      toast.success('Two-factor authentication enabled successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error verifying 2FA code:', error);
      toast.error('Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md ${theme === 'dark' ? 'dark' : ''}`}>
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          Set Up Two-Factor Authentication
        </h2>

        <div className="space-y-4">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            1. Install an authenticator app like Google Authenticator or Authy on your mobile device.
          </div>

          {qrCodeUrl && (
            <div className="flex justify-center bg-white p-4 rounded-lg">
              <QRCode
                value={qrCodeUrl}
                size={200}
                level="H"
                aria-label="QR Code for two-factor authentication"
              />
            </div>
          )}

          <div className="text-sm text-gray-600 dark:text-gray-400">
            2. Scan the QR code with your authenticator app.
          </div>

          <form onSubmit={handleVerification} className="space-y-4">
            <div>
              <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                3. Enter the 6-digit code from your authenticator app
              </label>
              <input
                id="verification-code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
                placeholder="Enter 6-digit code"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Enable 2FA'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
