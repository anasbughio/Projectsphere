import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Check, Zap, Shield, Loader2, AlertTriangle } from 'lucide-react';

const Billing = () => {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  
  // 1. Fresh DB States
  const [currentPlan, setCurrentPlan] = useState('free');
  const [isCheckingDB, setIsCheckingDB] = useState(true);

  // 2. Fetch LIVE data from Database
  useEffect(() => {
    const fetchPlanFromDB = async () => {
      try {
        // 👇 APNI API KA NAAM YAHAN THEEK KAREIN AGAR '/auth/me' NAHI HAI
        const response = await api.get('/auth/me'); 
        
        // Mongoose mein populate hone ke baad data aksar organizationId mein hota hai
        const orgData = response.data.organizationId || response.data.organization;
        const livePlan = orgData?.subscriptionPlan || 'free';
        
        setCurrentPlan(livePlan);
      } catch (error) {
        console.error("Error fetching live plan from DB:", error);
      } finally {
        setIsCheckingDB(false);
      }
    };

    fetchPlanFromDB();
  }, []);

  const normalizedPlan = currentPlan.toLowerCase();
  const isPremium = normalizedPlan !== 'free';

  const handleUpgrade = async (planName) => {
    try {
      setLoadingPlan(planName);
      const response = await api.post('/stripe/create-checkout-session', { planName });
      
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Checkout failed', error);
      alert('Failed to initiate checkout. Please try again.');
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm("⚠️ Are you sure you want to cancel? Your workspace will be downgraded to the Free Plan immediately, and excess users/projects will be locked.")) {
      return;
    }

    setIsCancelling(true);
    try {
      const response = await api.post('/stripe/cancel-subscription');
      alert(response.data.message);
      
      // Cancel hone ke baad automatically page reload hoga aur naya (Free) data DB se aa jayega
      window.location.reload(); 
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel subscription.");
    } finally {
      setIsCancelling(false);
    }
  };

  // 3. Show Loader while hitting DB
  if (isCheckingDB) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-[#7c7fff]" size={48} />
          <p className="text-[#84889c] text-sm font-medium">Verifying Workspace Plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">Upgrade Your Workspace</h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Choose a plan that scales with your team. Secure payments handled by Stripe.
        </p>
      </div>

      <div className="max-w-4xl mx-auto mb-8">
        <div className="bg-[#1a1c26] border border-white/10 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
          <div>
            <h3 className="text-white font-semibold text-lg">Current Plan: <span className="uppercase text-[#7c7fff]">{currentPlan}</span></h3>
            <p className="text-sm text-gray-400 mt-1">Manage your workspace's premium capabilities.</p>
          </div>
          
          {isPremium && (
            <button
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2.5 rounded-xl font-semibold transition-all text-sm"
            >
              {isCancelling ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
              {isCancelling ? 'Cancelling...' : 'Cancel Subscription'}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        
        {/* PRO PLAN */}
        <div className={`bg-[#1a1c26] p-8 rounded-2xl border ${normalizedPlan === 'pro' ? 'border-[#7c7fff] shadow-lg shadow-[#7c7fff]/20' : 'border-white/10'} relative overflow-hidden flex flex-col`}>
          {normalizedPlan === 'pro' && (
            <div className="absolute top-0 right-0 bg-[#7c7fff] text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
              Current Plan
            </div>
          )}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap size={20} className="text-[#7c7fff]" /> Pro Plan
            </h2>
            <div className="mt-4 mb-2 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">$29</span>
              <span className="text-gray-400 text-sm">/month</span>
            </div>
            <p className="text-sm text-gray-400">Perfect for growing agencies and teams.</p>
          </div>

          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3 text-sm text-gray-300"><Check size={16} className="text-[#7c7fff]" /> Up to 25 Team Members</li>
            <li className="flex items-center gap-3 text-sm text-gray-300"><Check size={16} className="text-[#7c7fff]" /> Up to 15 Active Projects</li>
            <li className="flex items-center gap-3 text-sm text-gray-300"><Check size={16} className="text-[#7c7fff]" /> Priority Email Support</li>
          </ul>

          <button
            onClick={() => handleUpgrade('pro')}
            disabled={loadingPlan !== null || normalizedPlan === 'pro'}
            className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              normalizedPlan === 'pro' 
                ? 'bg-white/5 text-gray-500 cursor-not-allowed' 
                : 'bg-[#7c7fff] hover:bg-[#6b6ee6] text-white'
            }`}
          >
            {loadingPlan === 'pro' ? <Loader2 size={18} className="animate-spin" /> : normalizedPlan === 'pro' ? 'Active Plan' : 'Upgrade to Pro'}
          </button>
        </div>

        {/* ENTERPRISE PLAN */}
        <div className={`bg-gradient-to-b from-[#232530] to-[#1a1c26] p-8 rounded-2xl border ${normalizedPlan === 'enterprise' ? 'border-white shadow-2xl shadow-white/20' : 'border-[#7c7fff]/30'} relative flex flex-col`}>
          {normalizedPlan === 'enterprise' ? (
             <div className="absolute top-0 right-0 bg-white text-[#121218] text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
               Current Plan
             </div>
          ) : (
            <div className="absolute top-0 right-0 bg-[#7c7fff] text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
              Most Powerful
            </div>
          )}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield size={20} className="text-[#7c7fff]" /> Enterprise
            </h2>
            <div className="mt-4 mb-2 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">$99</span>
              <span className="text-gray-400 text-sm">/month</span>
            </div>
            <p className="text-sm text-gray-400">Unlimited power for massive organizations.</p>
          </div>

          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-center gap-3 text-sm text-gray-300"><Check size={16} className="text-[#7c7fff]" /> Unlimited Team Members</li>
            <li className="flex items-center gap-3 text-sm text-gray-300"><Check size={16} className="text-[#7c7fff]" /> Unlimited Active Projects</li>
            <li className="flex items-center gap-3 text-sm text-gray-300"><Check size={16} className="text-[#7c7fff]" /> 24/7 Phone & Slack Support</li>
          </ul>

          <button
            onClick={() => handleUpgrade('enterprise')}
            disabled={loadingPlan !== null || normalizedPlan === 'enterprise'}
            className={`w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              normalizedPlan === 'enterprise'
                ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                : 'bg-white text-[#121218] hover:bg-gray-200'
            }`}
          >
            {loadingPlan === 'enterprise' ? <Loader2 size={18} className="animate-spin text-[#121218]" /> : normalizedPlan === 'enterprise' ? 'Active Plan' : 'Upgrade to Enterprise'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Billing;