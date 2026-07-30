import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Check, Zap, Shield, Loader2, AlertTriangle, X, CreditCard, ExternalLink, Star, CalendarClock } from 'lucide-react'; // Added CalendarClock icon
import { useToast } from '../components/ToastProvider';

const Billing = () => {
  const toast = useToast();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isRedirectingPortal, setIsRedirectingPortal] = useState(false);
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [currentPlan, setCurrentPlan] = useState('free');
  const [expiresAt, setExpiresAt] = useState(null); // NEW: State for expiration date
  const [isCheckingDB, setIsCheckingDB] = useState(true);

  useEffect(() => {
    const fetchPlanFromDB = async () => {
      try {
        const response = await api.get('/auth/me'); 
        const orgData = response.data.organizationId || response.data.organization;
        
        setCurrentPlan(orgData?.subscriptionPlan || 'free');
        setExpiresAt(orgData?.expiresAt || null); // NEW: Set expiration date
      } catch (error) {
        console.error("Error fetching live plan from DB:", error);
        toast.push("Failed to load subscription details.", { type: 'error' });
      } finally {
        setIsCheckingDB(false);
      }
    };

    fetchPlanFromDB();
  }, []);

  const normalizedPlan = currentPlan.toLowerCase();
  const isPremium = normalizedPlan !== 'free';

  // NEW: Calculate remaining days
  let daysLeft = null;
  if (isPremium && expiresAt) {
    const diffTime = new Date(expiresAt) - new Date();
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  const handleUpgrade = async (planName) => {
    try {
      setLoadingPlan(planName);
      const response = await api.post('/stripe/create-checkout-session', { planName });
      
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Checkout failed', error);
      toast.push('Failed to initiate checkout. Please try again.', { type: 'error' });
    } finally {
      setLoadingPlan(null);
    }
  };

  // NEW: Placeholder for Stripe Customer Portal (Invoices/Card updates)
  const handleManageBilling = async () => {
    setIsRedirectingPortal(true);
    try {
      // Example endpoint: await api.post('/stripe/customer-portal');
      toast.push("Redirecting to Stripe Billing Portal...", { type: 'info' });
      // Simulate API delay
      setTimeout(() => setIsRedirectingPortal(false), 1500);
    } catch (error) {
      toast.push("Failed to load billing portal.", { type: 'error' });
      setIsRedirectingPortal(false);
    }
  };

  const executeCancellation = async () => {
    setIsCancelling(true);
    try {
      const response = await api.post('/stripe/cancel-subscription');
      toast.push(response.data.message || "Subscription cancelled successfully.", { type: 'success' });
      setShowCancelModal(false); 
      
      setTimeout(() => {
        window.location.reload(); 
      }, 1500); 
      
    } catch (err) {
      toast.push(err.response?.data?.message || "Failed to cancel subscription.", { type: 'error' });
      setShowCancelModal(false); 
    } finally {
      setIsCancelling(false);
    }
  };

  if (isCheckingDB) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-[#7c7fff] blur-xl opacity-20 rounded-full"></div>
            <Loader2 className="animate-spin text-[#7c7fff] relative z-10" size={48} />
          </div>
          <p className="text-[#84889c] text-sm font-medium tracking-wide uppercase">Verifying Workspace Plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1400px] mx-auto relative">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white mb-4">Upgrade Your Workspace</h1>
        <p className="text-gray-400 max-w-xl mx-auto text-sm leading-relaxed">
          Choose a plan that scales with your team. Secure payments, flexible scaling, and enterprise-grade infrastructure handled by Stripe.
        </p>
      </div>

      {/* NEW: Enhanced Current Plan Banner */}
     <div className="max-w-5xl mx-auto mb-10">
        <div className="bg-[#1a1c26] border border-white/10 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-xl">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${isPremium ? 'bg-[#7c7fff]/10 text-[#7c7fff]' : 'bg-white/5 text-gray-400'}`}>
              <CreditCard size={24} />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg flex items-center gap-2">
                Current Plan: <span className={`uppercase ${isPremium ? 'text-[#7c7fff]' : 'text-gray-300'}`}>{currentPlan}</span>
                {isPremium && <span className="bg-[#10b981]/10 text-[#10b981] text-[10px] px-2 py-0.5 rounded-full border border-[#10b981]/20">ACTIVE</span>}
              </h3>
              
              {/* NEW: Dynamic subtext showing days left */}
              {isPremium && daysLeft !== null ? (
                <p className="text-sm text-emerald-400 mt-1 flex items-center gap-1.5 font-medium">
                  <CalendarClock size={14} /> 
                  Your plan has {daysLeft > 0 ? daysLeft : 0} days left in the current billing cycle.
                </p>
              ) : (
                <p className="text-sm text-[#84889c] mt-1">
                  You are currently on the baseline starter tier.
                </p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {isPremium && (
              <>
                <button
                  onClick={handleManageBilling}
                  disabled={isRedirectingPortal}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-[#2a2d3e] hover:bg-white/10 text-white border border-white/10 px-4 py-2.5 rounded-xl font-semibold transition-all text-sm"
                >
                  {isRedirectingPortal ? <Loader2 size={16} className="animate-spin" /> : <ExternalLink size={16} />}
                  Manage Invoices
                </button>
                <button
                  onClick={() => setShowCancelModal(true)}
                  disabled={isCancelling}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-4 py-2.5 rounded-xl font-semibold transition-all text-sm"
                >
                  {isCancelling ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
                  Cancel Subscription
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* NEW: 3-Column Grid for better comparison */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        
        {/* STARTER / FREE PLAN */}
        <div className={`bg-[#1a1c26] p-8 rounded-2xl border transition-all duration-300 relative flex flex-col ${normalizedPlan === 'free' ? 'border-gray-400 shadow-lg shadow-white/5' : 'border-white/5 opacity-80 hover:opacity-100'}`}>
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Star size={20} className="text-gray-400" /> Starter
            </h2>
            <div className="mt-4 mb-2 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">$0</span>
              <span className="text-gray-500 text-sm">/month</span>
            </div>
            <p className="text-sm text-[#84889c]">Basic features for individuals just getting started.</p>
          </div>

          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3 text-sm text-gray-300"><Check size={18} className="text-gray-500 shrink-0" /> Up to 3 Team Members</li>
            <li className="flex items-start gap-3 text-sm text-gray-300"><Check size={18} className="text-gray-500 shrink-0" /> Up to 2 Active Projects</li>
            <li className="flex items-start gap-3 text-sm text-gray-300"><Check size={18} className="text-gray-500 shrink-0" /> Community Support Only</li>
          </ul>

          <button
            disabled={true}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all border ${
              normalizedPlan === 'free' 
                ? 'bg-white/5 text-white border-white/10' 
                : 'bg-transparent text-gray-500 border-transparent cursor-not-allowed'
            }`}
          >
            {normalizedPlan === 'free' ? 'Current Plan' : 'Downgrade to Free'}
          </button>
        </div>

        {/* PRO PLAN */}
        <div className={`bg-[#1a1c26] p-8 rounded-2xl border transition-all duration-300 relative flex flex-col ${normalizedPlan === 'pro' ? 'border-[#7c7fff] shadow-2xl shadow-[#7c7fff]/20 scale-[1.02] z-10 bg-[#1e202d]' : 'border-white/10 hover:border-[#7c7fff]/50'}`}>
          <div className="absolute top-0 right-0 bg-gradient-to-r from-[#7c7fff] to-[#6b6ee6] text-white text-[10px] font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-widest shadow-lg">
            {normalizedPlan === 'pro' ? 'Active Plan' : 'Most Popular'}
          </div>
          
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Zap size={20} className="text-[#7c7fff]" /> Pro Plan
            </h2>
            <div className="mt-4 mb-2 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">$29</span>
              <span className="text-gray-400 text-sm">/month</span>
            </div>
            <p className="text-sm text-[#84889c]">Perfect for growing agencies and collaborative teams.</p>
          </div>

          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3 text-sm text-gray-200"><Check size={18} className="text-[#7c7fff] shrink-0" /> Up to 25 Team Members</li>
            <li className="flex items-start gap-3 text-sm text-gray-200"><Check size={18} className="text-[#7c7fff] shrink-0" /> Up to 15 Active Projects</li>
            <li className="flex items-start gap-3 text-sm text-gray-200"><Check size={18} className="text-[#7c7fff] shrink-0" /> Priority Email Support</li>
            <li className="flex items-start gap-3 text-sm text-gray-200"><Check size={18} className="text-[#7c7fff] shrink-0" /> Advanced Analytics</li>
          </ul>

          <button
            onClick={() => handleUpgrade('pro')}
            disabled={loadingPlan !== null || normalizedPlan === 'pro'}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              normalizedPlan === 'pro' 
                ? 'bg-[#7c7fff]/10 text-[#7c7fff] border border-[#7c7fff]/20 cursor-default' 
                : 'bg-[#7c7fff] hover:bg-[#6b6ee6] text-white shadow-lg shadow-[#7c7fff]/20'
            }`}
          >
            {loadingPlan === 'pro' ? <Loader2 size={18} className="animate-spin" /> : normalizedPlan === 'pro' ? 'Currently Active' : 'Upgrade to Pro'}
          </button>
        </div>

        {/* ENTERPRISE PLAN */}
        <div className={`bg-gradient-to-b from-[#232530] to-[#1a1c26] p-8 rounded-2xl border transition-all duration-300 relative flex flex-col ${normalizedPlan === 'enterprise' ? 'border-white shadow-2xl shadow-white/20 scale-[1.02] z-10' : 'border-white/10 hover:border-white/40'}`}>
          <div className={`absolute top-0 right-0 text-[10px] font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-widest shadow-lg ${normalizedPlan === 'enterprise' ? 'bg-white text-black' : 'bg-[#2a2d3e] text-white border-b border-l border-white/10'}`}>
            {normalizedPlan === 'enterprise' ? 'Active Plan' : 'Maximum Power'}
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield size={20} className="text-white" /> Enterprise
            </h2>
            <div className="mt-4 mb-2 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">$99</span>
              <span className="text-gray-400 text-sm">/month</span>
            </div>
            <p className="text-sm text-[#84889c]">Unlimited power and infrastructure for massive organizations.</p>
          </div>

          <ul className="space-y-4 mb-8 flex-1">
            <li className="flex items-start gap-3 text-sm text-gray-200"><Check size={18} className="text-white shrink-0" /> Unlimited Team Members</li>
            <li className="flex items-start gap-3 text-sm text-gray-200"><Check size={18} className="text-white shrink-0" /> Unlimited Active Projects</li>
            <li className="flex items-start gap-3 text-sm text-gray-200"><Check size={18} className="text-white shrink-0" /> 24/7 Phone & Slack Support</li>
            <li className="flex items-start gap-3 text-sm text-gray-200"><Check size={18} className="text-white shrink-0" /> Custom Domain Integration</li>
          </ul>

          <button
            onClick={() => handleUpgrade('enterprise')}
            disabled={loadingPlan !== null || normalizedPlan === 'enterprise'}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              normalizedPlan === 'enterprise'
                ? 'bg-white/10 text-white border border-white/20 cursor-default'
                : 'bg-white text-[#121218] hover:bg-gray-200 shadow-lg shadow-white/10'
            }`}
          >
            {loadingPlan === 'enterprise' ? <Loader2 size={18} className="animate-spin text-[#121218]" /> : normalizedPlan === 'enterprise' ? 'Currently Active' : 'Upgrade to Enterprise'}
          </button>
        </div>

      </div>

      {/* ✅ CUSTOM CONFIRMATION MODAL */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#2a2d3e] border border-white/10 p-6 rounded-3xl shadow-2xl max-w-md w-full flex flex-col gap-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="bg-red-500/10 p-2.5 rounded-xl">
                  <AlertTriangle size={24} className="text-red-400" />
                </div>
                <div>
                  <span className="font-bold text-lg text-white block">Cancel Subscription?</span>
                  <span className="text-xs text-gray-400">This action takes effect immediately.</span>
                </div>
              </div>
              <button onClick={() => setShowCancelModal(false)} className="text-[#84889c] hover:text-white transition bg-white/5 hover:bg-white/10 p-1.5 rounded-lg">
                <X size={18} />
              </button>
            </div>
            
            <div className="text-sm text-gray-300 leading-relaxed bg-[#121218] p-4 rounded-xl border border-white/5 space-y-2">
              <p>By cancelling, your workspace will be downgraded to the <strong>Starter/Free Plan</strong>.</p>
              <ul className="list-disc pl-4 text-xs text-gray-400 space-y-1">
                <li>Excess users beyond 3 will be locked.</li>
                <li>Excess projects beyond 2 will become read-only.</li>
                <li>Premium support access will be revoked.</li>
              </ul>
            </div>
            
            <div className="flex justify-end gap-3 mt-1">
              <button 
                onClick={() => setShowCancelModal(false)}
                className="px-5 py-2.5 text-sm font-semibold text-[#84889c] hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                Keep My Plan
              </button>
              <button 
                onClick={executeCancellation}
                disabled={isCancelling}
                className="px-5 py-2.5 text-sm font-bold bg-red-500 text-white hover:bg-red-600 rounded-xl transition-colors shadow-lg shadow-red-500/20 flex items-center gap-2 disabled:opacity-50"
              >
                {isCancelling ? <Loader2 size={16} className="animate-spin" /> : null}
                {isCancelling ? 'Processing...' : 'Yes, Downgrade to Free'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Billing;