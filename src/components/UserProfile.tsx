import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { Camera, X } from 'lucide-react';

type UserProfileProps = {
  user: { id: string; email: string };
  onClose: () => void;
  onUpdate: () => void;
  theme?: 'light' | 'dark' | 'system';
};

type UserDetails = {
  full_name: string;
  avatar_url: string | null;
  address: string;
};

export function UserProfile({ user, onClose, onUpdate, theme }: UserProfileProps) {
  const [loading, setLoading] = useState(false);
  const [userDetails, setUserDetails] = useState<UserDetails>({
    full_name: '',
    avatar_url: null,
    address: '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const getDefaultAvatarUrl = (email: string) => {
    const username = email.split('@')[0];
    return `https://api.dicebear.com/7.x/initials/svg?seed=${username}&backgroundColor=2563eb&textColor=white`;
  };

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('user_details')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setUserDetails(data);
        setAvatarPreview(data.avatar_url || getDefaultAvatarUrl(user.email));
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      toast.error('Failed to load user details');
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) {
        return;
      }

      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file');
        return;
      }

      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    } catch (error) {
      console.error('Error handling avatar change:', error);
      toast.error('Failed to process image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let avatarUrl = userDetails.avatar_url;

      if (avatarFile) {
        // Delete old avatar if it exists and is not the default one
        if (userDetails.avatar_url && !userDetails.avatar_url.includes('dicebear')) {
          const oldPath = new URL(userDetails.avatar_url).pathname.split('/').pop();
          if (oldPath) {
            await supabase.storage
              .from('avatars')
              .remove([`${user.id}/${oldPath}`]);
          }
        }

        // Upload new avatar
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${user.id}/${Math.random()}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatarFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        avatarUrl = publicUrl;
      }

      // Update user details
      const { error } = await supabase
        .from('user_details')
        .update({
          full_name: userDetails.full_name,
          avatar_url: avatarUrl,
          address: userDetails.address,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Profile updated successfully');
      onUpdate();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarReset = async () => {
    try {
      setLoading(true);
      const defaultAvatarUrl = getDefaultAvatarUrl(user.email);

      // Delete existing avatar if it's not the default one
      if (userDetails.avatar_url && !userDetails.avatar_url.includes('dicebear')) {
        const oldPath = new URL(userDetails.avatar_url).pathname.split('/').pop();
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([`${user.id}/${oldPath}`]);
        }
      }

      // Update user details with default avatar
      const { error } = await supabase
        .from('user_details')
        .update({
          avatar_url: defaultAvatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setUserDetails(prev => ({ ...prev, avatar_url: defaultAvatarUrl }));
      setAvatarPreview(defaultAvatarUrl);
      setAvatarFile(null);
      toast.success('Profile picture reset to default');
      onUpdate();
    } catch (error) {
      console.error('Error resetting avatar:', error);
      toast.error('Failed to reset profile picture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold dark:text-white">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <img
                src={avatarPreview || getDefaultAvatarUrl(user.email)}
                alt="Profile"
                className="w-24 h-24 rounded-full object-cover"
              />
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors duration-300"
              >
                <Camera size={16} />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <button
              type="button"
              onClick={handleAvatarReset}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Reset to default
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                value={userDetails.full_name}
                onChange={(e) => setUserDetails(prev => ({ ...prev, full_name: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                Address
              </label>
              <input
                type="text"
                id="address"
                value={userDetails.address}
                onChange={(e) => setUserDetails(prev => ({ ...prev, address: e.target.value }))}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}