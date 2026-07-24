import React from 'react';
import { ShieldAlert, Zap, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const UpgradeModal = ({ isOpen, onClose, type }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  // Determine message based on what limit was reached
  const isProject = type === 'projects';
  const title = isProject ? 'Project Limit Reached' : 'Team Member Limit Reached';
  const description = isProject 
    ? 'You have reached the maximum number of projects allowed on your current plan. Upgrade to Pro to create unlimited projects and unlock premium features.'
    : 'You have reached the maximum number of team members allowed on your current plan. Upgrade to Pro to collaborate with a larger team.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1a1c26] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative animate-in fade-in zoom-in duration-200">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-8 text-center space-y-4">
          {/* Animated Icon Container */}
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#7c7fff]/20 to-[#ff4b4b]/20 rounded-full flex items-center justify-center border border-white/10 mb-2">
            <ShieldAlert size={32} className="text-[#ff4b4b]" />
          </div>
          
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          
          <p className="text-gray-400 text-sm leading-relaxed">
            {description}
          </p>

          <div className="pt-6">
            <button 
              onClick={() => {
                onClose();
                navigate('/billing'); // Redirects user to the billing page
              }}
              className="w-full bg-gradient-to-r from-[#7c7fff] to-[#6b6ee6] hover:from-[#6b6ee6] hover:to-[#5a5dd5] text-white font-semibold py-3 px-4 rounded-xl shadow-lg hover:shadow-[#7c7fff]/25 transition-all flex items-center justify-center gap-2"
            >
              <Zap size={18} className="fill-current" />
              Upgrade to Pro
            </button>
          </div>
          
          <button 
            onClick={onClose}
            className="w-full text-gray-500 hover:text-gray-300 text-sm font-medium py-2 transition-colors mt-2"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default UpgradeModal;