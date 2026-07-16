import { useState } from 'react';
import { Upload, User, Check, AlertCircle } from 'lucide-react';
import api from '../services/api';

const Profile = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // 1. Image Select Karne Ka Function
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      // Image ka local preview dikhane ke liye URL banayen
      setPreviewUrl(URL.createObjectURL(file));
      setMessage('');
      setError('');
    }
  };

  // 2. Image Upload Karne Ka Function
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select an image first.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    const formData = new FormData();
    // 'profileImage' wahi naam hai jo backend par upload.single('profileImage') mein diya tha
    formData.append('profileImage', selectedFile);

    try {
      const response = await api.post('/auth/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage('Profile picture updated successfully!');
      
      // Optionally: LocalStorage mein user data update kar dein taake Navbar mein nayi pic nazar aaye
      const userData = JSON.parse(localStorage.getItem('user'));
      const newPicUrl = response.data.user?.profilePicture || response.data.data?.profilePicture;
      if (newPicUrl) {
        userData.profilePicture = newPicUrl;
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        console.error("Backend response mein profilePicture nahi mili:", response.data);
      }
     

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload image.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[520px] mx-auto z-10 px-4 py-8 font-sans">
      <div className="bg-[#16171d] border border-white/[0.04] p-8 sm:p-10 rounded-[1.25rem] shadow-2xl w-full">
        
        {/* Header Left Aligned */}
        <div className="mb-8 text-left">
          <h2 className="text-2xl font-semibold text-white mb-1.5 tracking-tight">Profile Settings</h2>
          <p className="text-[#84889c] text-sm">Update your account avatar.</p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-lg flex items-center gap-2 font-medium">
            <AlertCircle size={14} /> {error}
          </div>
        )}

        {message && (
          <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-lg flex items-center gap-2 font-medium">
            <Check size={14} /> {message}
          </div>
        )}

        <form onSubmit={handleUpload}>
          
          {/* =========================================
              INPUTS BLOCK 
              (File Select & Preview Area)
          ========================================= */}
          <div className="flex flex-col gap-5 block text-left">
            <label className="block text-xs font-semibold text-[#84889c] mb-2">Profile Picture</label>
            
            <div className="flex items-center gap-6 p-5 bg-[#0c0d12] border border-white/[0.04] rounded-xl">
              {/* Image Preview Area */}
              <div className="w-20 h-20 rounded-full bg-[#1a1c26] border-2 border-[#5a5fe0]/30 flex items-center justify-center overflow-hidden shrink-0">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <User size={32} className="text-[#606479]" />
                )}
              </div>
              
              {/* File Input */}
              <div className="flex flex-col gap-2 w-full">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  id="avatar-upload"
                  className="hidden"
                />
                <label 
                  htmlFor="avatar-upload"
                  className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#1a1c26] hover:bg-[#222533] border border-white/5 text-white text-xs font-medium rounded-lg transition-all"
                >
                  <Upload size={14} />
                  Choose File
                </label>
                <p className="text-[10px] text-[#606479]">JPG, PNG or GIF. Max size 2MB.</p>
              </div>
            </div>
          </div>

          {/* =========================================
              BUTTONS BLOCK
              (Strictly separate from inputs)
          ========================================= */}
          <div className="flex flex-col gap-4 mt-8 pt-6 border-t border-white/[0.04]">
            <div className="block">
              <button
                type="submit"
                disabled={loading || !selectedFile}
                className={`w-full flex items-center justify-center gap-2 text-white font-semibold py-3 rounded-lg text-sm transition-all shadow-md ${
                  loading || !selectedFile 
                    ? 'bg-[#4b4d99]/50 cursor-not-allowed shadow-none text-white/50' 
                    : 'bg-[#5a5fe0] hover:bg-[#6c70f0]'
                }`}
              >
                {loading ? 'Uploading...' : 'Save Profile Picture'}
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Profile;