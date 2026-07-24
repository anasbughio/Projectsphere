import React, { useState } from 'react';
import api from '../services/api';
import { Check, Zap, Shield, Loader2 } from 'lucide-react';

const Billing = () => {
  const [loadingPlan, setLoadingPlan] = useState(null);

  const handleUpgrade = async (planName) => {
    try {
      setLoadingPlan(planName);
      // Call backend to generate Stripe secure URL
      const response = await api.post('/stripe/create-checkout-session', { planName });
      
      // Redirect user to Stripe's secure payment page
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

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-white mb-4">Upgrade Your Workspace</h1>
        <p className="text-gray-400 max-w-xl mx-auto">
          Choose a plan that scales with your team. Secure payments handled by Stripe.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        
        {/* PRO PLAN */}
        <div className="bg-[#1a1c26] p-8 rounded-2xl border border-white/10 relative overflow-hidden flex flex-col">
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
            <li className="flex items-center gap-3 text-sm text-gray-300">
              <Check size={16} className="text-[#7c7fff]" /> Up to 25 Team Members
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-300">
              <Check size={16} className="text-[#7c7fff]" /> Up to 15 Active Projects
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-300">
              <Check size={16} className="text-[#7c7fff]" /> Priority Email Support
            </li>
          </ul>

          <button
            onClick={() => handleUpgrade('pro')}
            disabled={loadingPlan !== null}
            className="w-full py-3 rounded-xl bg-[#7c7fff] hover:bg-[#6b6ee6] text-white font-bold transition-all flex items-center justify-center gap-2"
          >
            {loadingPlan === 'pro' ? <Loader2 size={18} className="animate-spin" /> : 'Upgrade to Pro'}
          </button>
        </div>

        {/* ENTERPRISE PLAN */}
        <div className="bg-gradient-to-b from-[#232530] to-[#1a1c26] p-8 rounded-2xl border border-[#7c7fff]/30 relative flex flex-col shadow-2xl shadow-[#7c7fff]/10">
          <div className="absolute top-0 right-0 bg-[#7c7fff] text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
            Most Powerful
          </div>
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
            <li className="flex items-center gap-3 text-sm text-gray-300">
              <Check size={16} className="text-[#7c7fff]" /> Unlimited Team Members
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-300">
              <Check size={16} className="text-[#7c7fff]" /> Unlimited Active Projects
            </li>
            <li className="flex items-center gap-3 text-sm text-gray-300">
              <Check size={16} className="text-[#7c7fff]" /> 24/7 Phone & Slack Support
            </li>
          </ul>

          <button
            onClick={() => handleUpgrade('enterprise')}
            disabled={loadingPlan !== null}
            className="w-full py-3 rounded-xl bg-white text-[#121218] hover:bg-gray-200 font-bold transition-all flex items-center justify-center gap-2"
          >
            {loadingPlan === 'enterprise' ? <Loader2 size={18} className="animate-spin text-[#121218]" /> : 'Upgrade to Enterprise'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Billing;