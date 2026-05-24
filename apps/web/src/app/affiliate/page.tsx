'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { 
  TrendingUp, Award, Wallet, ArrowUpRight, Copy, CheckCircle2, 
  Clock, Share2, Compass, AlertCircle, RefreshCw, ChevronRight, Lock
} from 'lucide-react';

export default function AffiliatePage() {
  const { user, isAuthenticated } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Withdrawal form state
  const [withdrawAmount, setWithdrawAmount] = useState('500');
  const [withdrawMethod, setWithdrawMethod] = useState('BKASH');
  const [withdrawDetails, setWithdrawDetails] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // Deep Link generator state
  const [generatedLink, setGeneratedLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Notification Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchAffiliateProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/affiliates/me');
      if (res.data?.success) {
        setProfile(res.data.data);
        
        // Setup initial referral link
        if (res.data.data?.referralCode) {
          setGeneratedLink(`${window.location.origin}/?ref=${res.data.data.referralCode}`);
        }
      }
    } catch (e: any) {
      console.error('Error fetching affiliate profile:', e);
      showToast('Could not fetch active affiliate analytics details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'AFFILIATE') {
      fetchAffiliateProfile();
    }
  }, [isAuthenticated, user]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setLinkCopied(true);
    showToast('Referral link copied to clipboard successfully!', 'success');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amt = Number(withdrawAmount);
    if (amt < 500) {
      showToast('Minimum withdrawal payout threshold is 500 BDT.', 'error');
      return;
    }

    if (amt > Number(profile?.walletBalance)) {
      showToast('Withdrawal amount exceeds your active wallet balance.', 'error');
      return;
    }

    if (!withdrawDetails) {
      showToast('Please specify withdrawal payment account details.', 'error');
      return;
    }

    try {
      setWithdrawLoading(true);
      const res = await api.post('/affiliates/withdrawals', {
        amount: amt,
        method: withdrawMethod,
        paymentDetails: withdrawDetails,
      });

      if (res.data?.success) {
        showToast(res.data.message || 'Withdrawal request submitted successfully!', 'success');
        setWithdrawDetails('');
        setWithdrawAmount('500');
        // Refresh profile
        fetchAffiliateProfile();
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Could not register payout request.';
      showToast(msg, 'error');
    } finally {
      setWithdrawLoading(false);
    }
  };

  if (!isAuthenticated || user?.role !== 'AFFILIATE') {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto min-h-[60vh] gap-6">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center text-3xl shadow-lg">
          <Lock className="w-8 h-8 text-amber-500" />
        </div>
        <div>
          <h2 className="font-extrabold text-2xl text-slate-100 mb-2">Affiliate Portal Locked</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Please sign up or authenticate as an <span className="font-bold text-amber-400">Affiliate Seller</span> to access deep-links, click tracking, and commission balance accounts.
          </p>
        </div>
        <a 
          href="/"
          className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm transition"
        >
          Return to Catalog
        </a>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col min-h-screen">
      
      {/* Header bar */}
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/" className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center font-bold text-slate-950 text-xl shadow-lg">
            🥭
          </a>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Mangosteen Affiliate Hub
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">
              Performance Wallet
            </p>
          </div>
        </div>

        <a 
          href="/"
          className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5"
        >
          <Compass className="w-4 h-4" /> Store Catalog
        </a>
      </header>

      <div className="px-6 py-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
        
        {/* Profile Introduction */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-extrabold text-2xl">
              🤝
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-200">Welcome back, {user?.fullName}!</h2>
              <p className="text-xs text-slate-400 mt-1">
                Unique Referral ID:{' '}
                <span className="font-bold text-amber-400 bg-slate-850 px-2 py-0.5 rounded-md font-mono border border-slate-800">
                  {profile?.referralCode}
                </span>
              </p>
            </div>
          </div>
          
          <button 
            onClick={fetchAffiliateProfile}
            className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold p-2.5 rounded-xl transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* 🚀 Active balances cards */}
        {loading ? (
          <div className="flex items-center justify-center py-10 gap-2.5 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
            <span className="text-sm font-semibold">Syncing wallet stats...</span>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              
              {/* Clicks */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Referral Clicks</p>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-3xl font-extrabold text-slate-100">{profile?.clicksCount}</span>
                  <Share2 className="w-5 h-5 text-sky-400" />
                </div>
                <p className="text-[10px] text-slate-500 mt-2">Clicks tracked in last 30 days</p>
              </div>

              {/* Pending */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Pending Commissions</p>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-3xl font-extrabold text-amber-400">{profile?.pendingCommissions} BDT</span>
                  <Clock className="w-5 h-5 text-amber-400" />
                </div>
                <p className="text-[10px] text-slate-500 mt-2">Held for COD OTP verification settlement</p>
              </div>

              {/* Wallet Balance */}
              <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-amber-500 flex flex-col gap-2">
                <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">Available Balance</p>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-3xl font-extrabold text-slate-100">{profile?.walletBalance} BDT</span>
                  <Wallet className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-[10px] text-slate-500 mt-2">Approved and ready for payout request</p>
              </div>

              {/* Total payout history */}
              <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Withdrawn Total</p>
                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-3xl font-extrabold text-slate-100">
                    {profile?.withdrawals
                      ?.filter((w: any) => w.status === 'APPROVED' || w.status === 'PAID')
                      ?.reduce((sum: number, w: any) => sum + Number(w.amount), 0) || 0} BDT
                  </span>
                  <ArrowUpRight className="w-5 h-5 text-purple-400" />
                </div>
                <p className="text-[10px] text-slate-500 mt-2">Paid bank and MFS disbursements</p>
              </div>
            </div>

            {/* 🚀 Deep Link Generator & Withdrawal Form */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Deep Link Generator */}
              <div className="glass-panel p-6 rounded-3xl flex flex-col gap-6">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-100 mb-1">Referral Campaign Deep-Links</h3>
                  <p className="text-xs text-slate-400">Generate deep-links to specific seasonal mango boxes and share with your networks to earn 10% cash commission.</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Your General Referral Link</label>
                  <div className="flex bg-slate-950 border border-slate-800 rounded-xl overflow-hidden p-1">
                    <input 
                      type="text" 
                      readOnly
                      value={generatedLink}
                      className="flex-grow bg-transparent text-xs px-3 focus:outline-none text-slate-300 font-mono"
                    />
                    <button 
                      onClick={() => copyToClipboard(generatedLink)}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      {linkCopied ? 'Copied!' : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950/40 p-4 border border-slate-800 rounded-2xl flex gap-3 text-xs text-slate-400 leading-relaxed">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-slate-200 mb-1">Attribution Cookie Mechanics</p>
                    <p>When a buyer clicks your deep-link, we store a secure, HTTP-only tracking token with a 30-day active window. Clicks from identical devices are protected via click velocity anti-fraud filters to verify performance authenticity.</p>
                  </div>
                </div>
              </div>

              {/* Withdrawal Request Form */}
              <div className="glass-panel p-6 rounded-3xl flex flex-col gap-6">
                <div>
                  <h3 className="font-extrabold text-lg text-slate-100 mb-1">Submit Payout Request</h3>
                  <p className="text-xs text-slate-400">Withdraw approved wallet balance directly to your bKash, Nagad, or bank accounts.</p>
                </div>

                <form onSubmit={handleWithdrawSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-slate-400 font-semibold">Amount (BDT)</label>
                      <input 
                        type="number" 
                        required
                        min="500"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="500"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-amber-500 text-slate-200 font-bold"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-slate-400 font-semibold">Payout Gateway Channel</label>
                      <select 
                        value={withdrawMethod}
                        onChange={(e) => setWithdrawMethod(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-amber-500 text-slate-200 font-bold"
                      >
                        <option value="BKASH">bKash (MFS)</option>
                        <option value="NAGAD">Nagad (MFS)</option>
                        <option value="BANK">Bank Transfer</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Payout Account Details</label>
                    <input 
                      type="text" 
                      required
                      value={withdrawDetails}
                      onChange={(e) => setWithdrawDetails(e.target.value)}
                      placeholder="e.g. bKash Personal: +8801700000000 or Bank Acc details"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-amber-500 text-slate-200"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={withdrawLoading || Number(profile?.walletBalance) < 500}
                    className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-bold py-3 rounded-xl text-sm transition mt-2 shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 disabled:opacity-55 disabled:cursor-not-allowed"
                  >
                    {withdrawLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin inline mr-1" /> Booking withdrawal...
                      </>
                    ) : (
                      'Request Balance Withdrawal'
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* 🚀 Referral History & Commissions Ledger */}
            <div className="glass-panel p-6 rounded-3xl flex flex-col gap-6">
              <div>
                <h3 className="font-extrabold text-lg text-slate-100 mb-1">Commission Settlements & Payout Logs</h3>
                <p className="text-xs text-slate-400 font-medium">Detailed auditing double-entry records tracking referrals clicks, pending COD commissions, and withdrawal payouts requests history.</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold">
                      <th className="pb-3">Transaction Reference</th>
                      <th className="pb-3">Type</th>
                      <th className="pb-3">Details</th>
                      <th className="pb-3">Amount</th>
                      <th className="pb-3">Settlement Date</th>
                      <th className="pb-3 text-right">Verification Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {/* Withdrawals */}
                    {profile?.withdrawals?.map((w: any) => (
                      <tr key={w.id} className="text-slate-300">
                        <td className="py-3 font-semibold font-mono text-slate-400">{w.txRef || `WIT-${w.id.substring(0, 5)}`}</td>
                        <td className="py-3">
                          <span className="bg-red-500/10 text-red-400 font-bold uppercase tracking-wider px-2 py-0.5 rounded text-[9px]">
                            Payout
                          </span>
                        </td>
                        <td className="py-3 text-slate-400">{w.notes || `Disbursed to ${w.method}`}</td>
                        <td className="py-3 font-bold text-red-400">-{w.amount} BDT</td>
                        <td className="py-3 text-slate-500">{new Date(w.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            w.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                            w.status === 'APPROVED' || w.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' :
                            'bg-red-500/10 text-red-400'
                          }`}>
                            {w.status}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {/* Commissions */}
                    {profile?.commissions?.map((c: any) => (
                      <tr key={c.id} className="text-slate-300">
                        <td className="py-3 font-semibold font-mono text-slate-400">COM-{c.id.substring(0, 5).toUpperCase()}</td>
                        <td className="py-3">
                          <span className="bg-emerald-500/10 text-emerald-400 font-bold uppercase tracking-wider px-2 py-0.5 rounded text-[9px]">
                            Commission
                          </span>
                        </td>
                        <td className="py-3 text-slate-400">{c.notes || `10% commission on purchase ${c.orderId}`}</td>
                        <td className="py-3 font-bold text-emerald-400">+{c.amount} BDT</td>
                        <td className="py-3 text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400' :
                            c.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400' :
                            'bg-red-500/10 text-red-400'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {(!profile?.withdrawals || profile?.withdrawals.length === 0) && 
                     (!profile?.commissions || profile?.commissions.length === 0) && (
                      <tr>
                        <td colSpan={6} className="text-center py-8 text-slate-500">
                          No wallet settlements or withdrawal payout transactions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 🚀 Active toast message */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`px-5 py-3 rounded-2xl text-xs font-bold shadow-2xl flex items-center gap-2.5 border ${
            toast.type === 'success' ? 'bg-slate-900 border-emerald-500/30 text-emerald-400' :
            toast.type === 'error' ? 'bg-slate-900 border-red-500/30 text-red-400' :
            'bg-slate-900 border-amber-500/30 text-amber-400'
          }`}>
            <span className="text-base">
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '⚠' : 'ℹ'}
            </span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}
