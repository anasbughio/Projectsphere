import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { User, Lock, Shield, Loader2, Save, Key, AlertCircle, CheckCircle } from 'lucide-react';

const ProfileSettings = () => {
  const [profile, setProfile] = useState({ name: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  
  // Loading & Notification States
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser && storedUser.name) {
      setProfile({ name: storedUser.name });
    }
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsProfileLoading(true);
    setProfileMsg({ type: '', text: '' });

    try {
      const res = await api.put('/auth/profile', profile); 
      
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser) {
        storedUser.name = res.data.data.name; 
        localStorage.setItem('user', JSON.stringify(storedUser));
      }

      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
      
      // Thora delay de kar refresh karein taake user success message dekh sakay
      setTimeout(() => {
        window.location.reload(); 
      }, 1500);

    } catch (error) {
      console.error(error);
      setProfileMsg({ type: 'error', text: error.response?.data?.message || 'Error updating profile' });
    } finally {
      setIsProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (!passwords.currentPassword || !passwords.newPassword) {
      setPasswordMsg({ type: 'error', text: 'Please fill all password fields' });
      return;
    }

    setIsPasswordLoading(true);
    try {
      await api.put('/auth/update-password', passwords); 
      setPasswordMsg({ type: 'success', text: 'Password updated securely!' });
      setPasswords({ currentPassword: '', newPassword: '' }); 
      
      // Success message thori der baad hata dein
      setTimeout(() => setPasswordMsg({ type: '', text: '' }), 4000);
    } catch (error) {
      setPasswordMsg({ type: 'error', text: error.response?.data?.message || 'Error updating password' });
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-[#121218] min-h-screen text-white">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white tracking-tight">Account Settings</h1>
          <p className="text-gray-400 mt-2 text-sm md:text-base">Manage your personal information and security preferences.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Profile Info Section */}
          <div className="bg-[#1a1c26] p-8 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#7c7fff]/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[#7c7fff]/10 rounded-xl text-[#7c7fff]">
                <User size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Personal Info</h2>
                <p className="text-xs text-gray-400">Update your display name</p>
              </div>
            </div>

            {/* Profile Status Message */}
            {profileMsg.text && (
              <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm border ${
                profileMsg.type === 'success' ? 'bg-[#10b981]/10 border-[#10b981]/20 text-[#10b981]' : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                {profileMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                <div className="relative">
                  <input 
                    type="text" 
                    value={profile.name}
                    className="w-full bg-[#121218] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#7c7fff] focus:ring-1 focus:ring-[#7c7fff] transition-all" 
                    onChange={(e) => setProfile({ name: e.target.value })} 
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={isProfileLoading}
                className="flex items-center justify-center gap-2 w-full md:w-auto bg-gradient-to-r from-[#7c7fff] to-[#6063eb] hover:from-[#6b6eed] hover:to-[#5053db] text-white px-8 py-3 rounded-xl font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-[#7c7fff]/20"
              >
                {isProfileLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                {isProfileLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* Security Section */}
          <div className="bg-[#1a1c26] p-8 rounded-2xl border border-white/5 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#10b981]/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-[#10b981]/10 rounded-xl text-[#10b981]">
                <Shield size={24} />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Security</h2>
                <p className="text-xs text-gray-400">Manage your password</p>
              </div>
            </div>

            {/* Password Status Message */}
            {passwordMsg.text && (
              <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 text-sm border ${
                passwordMsg.type === 'success' ? 'bg-[#10b981]/10 border-[#10b981]/20 text-[#10b981]' : 'bg-red-500/10 border-red-500/20 text-red-400'
              }`}>
                {passwordMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                    <Lock size={18} />
                  </div>
                  <input 
                    type="password" 
                    placeholder="Enter current password" 
                    value={passwords.currentPassword}
                    className="w-full bg-[#121218] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all" 
                    onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                    <Key size={18} />
                  </div>
                  <input 
                    type="password" 
                    placeholder="Enter new password" 
                    value={passwords.newPassword}
                    className="w-full bg-[#121218] border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#10b981] focus:ring-1 focus:ring-[#10b981] transition-all" 
                    onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isPasswordLoading}
                className="flex items-center justify-center gap-2 w-full md:w-auto bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white px-8 py-3 rounded-xl font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed shadow-lg shadow-[#10b981]/20"
              >
                {isPasswordLoading ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                {isPasswordLoading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;