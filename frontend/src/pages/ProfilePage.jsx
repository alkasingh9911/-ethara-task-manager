import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [nameForm, setNameForm] = useState({ name: user?.name || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => api.put('/users/me', data),
    onSuccess: (res) => {
      updateUser(res.data);
      toast.success('Profile updated!');
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const handleNameSubmit = (e) => {
    e.preventDefault();
    updateProfileMutation.mutate({ name: nameForm.name });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    updateProfileMutation.mutate({
      currentPassword: pwForm.currentPassword,
      newPassword: pwForm.newPassword,
    });
    setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Profile Settings</h1>

      {/* Avatar */}
      <div className="card p-6 mb-6 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
          {user?.name?.[0]?.toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-lg">{user?.name}</p>
          <p className="text-gray-500">{user?.email}</p>
        </div>
      </div>

      {/* Update Name */}
      <div className="card p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Update Name</h2>
        <form onSubmit={handleNameSubmit} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input
              className="input"
              value={nameForm.name}
              onChange={(e) => setNameForm({ name: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={updateProfileMutation.isPending}>
            Save Name
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-4">Change Password</h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label className="label">Current Password</label>
            <input
              type="password"
              className="input"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              className="input"
              placeholder="Min. 6 characters"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              className="input"
              value={pwForm.confirm}
              onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={updateProfileMutation.isPending}>
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
}
