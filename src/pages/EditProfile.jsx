import { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

export default function EditProfile() {
  const { user, updateUser } = useAuth();

  // Form state
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Avatar state
  const [avatarPreview, setAvatarPreview] = useState(user?.profile_picture_url || null);
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);

  // UI state
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState(null); // { type: 'success'|'error', message: string }
  const [errors, setErrors] = useState({});

  function showNotification(type, message) {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  }

  function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showNotification('error', 'Image must be under 2MB.');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setSaving(true);

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    if (bio) formData.append('bio', bio);
    if (avatarFile) formData.append('profile_picture', avatarFile);
    if (showPasswordSection && newPassword) {
      formData.append('current_password', currentPassword);
      formData.append('password', newPassword);
      formData.append('password_confirmation', confirmPassword);
    }

    try {
      const res = await api.post('/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      updateUser(res.data);
      setAvatarFile(null);
      if (res.data.profile_picture_url) {
        setAvatarPreview(res.data.profile_picture_url);
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showNotification('success', 'Profile updated successfully!');
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
        showNotification('error', 'Please fix the errors below.');
      } else {
        showNotification('error', err.response?.data?.message || 'Something went wrong.');
      }
    } finally {
      setSaving(false);
    }
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20">
      {/* Toast notification */}
      {notification && (
        <div
          className={`fixed top-20 right-4 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-semibold transition-all duration-300 ${
            notification.type === 'success'
              ? 'bg-emerald-500 text-white'
              : 'bg-red-500 text-white'
          }`}
          style={{ animation: 'slideInRight 0.3s ease-out' }}
        >
          {notification.type === 'success' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {notification.message}
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Page Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Edit Profile</h1>
          <p className="text-gray-500 mt-1">Manage your personal information and account settings</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-7 h-7 bg-indigo-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              Profile Picture
            </h2>
            <div className="flex items-center gap-8">
              {/* Avatar */}
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-indigo-100 shadow-xl transition-all duration-300 group-hover:ring-indigo-300">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-3xl font-bold">{initials}</span>
                    </div>
                  )}
                </div>
                {/* Overlay */}
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>

              <div>
                <input
                  id="profile_picture_input"
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/gif,image/webp"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-5 py-2.5 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-xl border border-indigo-200 hover:bg-indigo-100 transition-all duration-200"
                >
                  Choose Photo
                </button>
                <p className="text-xs text-gray-400 mt-2">JPEG, PNG, GIF or WebP · Max 2MB</p>
                {avatarFile && (
                  <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1 font-medium">
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {avatarFile.name} selected
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Personal Info Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <div className="w-7 h-7 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              Personal Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label htmlFor="profile_name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name
                </label>
                <input
                  id="profile_name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                    errors.name ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
                  }`}
                  placeholder="Your full name"
                />
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name[0]}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="profile_email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  id="profile_email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                    errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
                  }`}
                  placeholder="your@email.com"
                />
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email[0]}</p>}
              </div>

              {/* Bio — full width */}
              <div className="sm:col-span-2">
                <label htmlFor="profile_bio" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Bio <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  id="profile_bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
                  placeholder="Tell others a little about yourself…"
                />
                {errors.bio && <p className="text-xs text-red-500 mt-1">{errors.bio[0]}</p>}
              </div>
            </div>
          </div>

          {/* Password Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Toggle Header */}
            <button
              type="button"
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="w-full flex items-center justify-between px-8 py-5 text-left hover:bg-gray-50/80 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-amber-100 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
                <span className="text-lg font-semibold text-gray-900">Change Password</span>
                <span className="text-xs text-gray-400 ml-1">(optional)</span>
              </div>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${showPasswordSection ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showPasswordSection && (
              <div className="px-8 pb-8 pt-2 border-t border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
                  {/* Current password — full width */}
                  <div className="sm:col-span-2">
                    <label htmlFor="current_password" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Current Password
                    </label>
                    <input
                      id="current_password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                        errors.current_password ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
                      }`}
                      placeholder="Enter your current password"
                    />
                    {errors.current_password && <p className="text-xs text-red-500 mt-1">{errors.current_password[0]}</p>}
                  </div>

                  {/* New password */}
                  <div>
                    <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1.5">
                      New Password
                    </label>
                    <input
                      id="new_password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                        errors.password ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
                      }`}
                      placeholder="Min. 8 characters"
                    />
                    {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password[0]}</p>}
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label htmlFor="confirm_password" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Confirm New Password
                    </label>
                    <input
                      id="confirm_password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                        errors.password_confirmation ? 'border-red-400 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
                      }`}
                      placeholder="Repeat new password"
                    />
                    {errors.password_confirmation && <p className="text-xs text-red-500 mt-1">{errors.password_confirmation[0]}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              id="save_profile_btn"
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg hover:scale-[1.02] active:scale-100 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Saving…
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(120%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
