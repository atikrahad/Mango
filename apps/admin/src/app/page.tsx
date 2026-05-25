'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { 
  ShieldCheck, ShoppingBag, Truck, Users, AlertTriangle, 
  RefreshCw, CheckCircle2, XCircle, ChevronRight, Star, Info, Lock,
  TrendingUp, Award, Wallet, ArrowUpRight, Copy, Clock, Share2, Compass, 
  AlertCircle, Eye, LogOut, ArrowRight, UserPlus, ShieldAlert, BarChart3
} from 'lucide-react';

export default function AdminPortalPage() {
  const { user, isAuthenticated, setSession, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'AFFILIATE' | 'CUSTOMER'>('AFFILIATE');
  const [authLoading, setAuthLoading] = useState(false);

  // Dashboards States
  const [orders, setOrders] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [deliveryRiders, setDeliveryRiders] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Withdrawal Payout form state (Affiliate)
  const [withdrawAmount, setWithdrawAmount] = useState('500');
  const [withdrawMethod, setWithdrawMethod] = useState('BKASH');
  const [withdrawDetails, setWithdrawDetails] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // Referral campaign links builder state
  const [generatedLink, setGeneratedLink] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);

  // Notification Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Sync / Fetch functions
  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [ordRes, witRes, riderRes] = await Promise.all([
        api.get('/orders/admin'),
        api.get('/affiliates/admin/withdrawals'),
        api.get('/orders/riders').catch(() => ({ data: { success: false, data: [] } })),
      ]);

      if (ordRes.data?.success) {
        setOrders(ordRes.data.data);
      }
      if (witRes.data?.success) {
        setWithdrawals(witRes.data.data);
      }
      if (riderRes.data?.success) {
        setDeliveryRiders(riderRes.data.data);
      }
    } catch (e: any) {
      console.error('Error fetching admin data:', e);
      showToast('Could not fetch administrative operations ledger queues.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAffiliateProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/affiliates/me');
      if (res.data?.success) {
        setProfile(res.data.data);
        if (res.data.data?.referralCode) {
          setGeneratedLink(`${window.location.origin}/?ref=${res.data.data.referralCode}`);
        }
      }
    } catch (e: any) {
      console.error('Error fetching affiliate profile:', e);
      showToast('Could not fetch active affiliate performance wallet details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Auth Submit Handlers
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (activeTab === 'register' && !fullName)) {
      showToast('Please specify all required credential fields.', 'error');
      return;
    }

    try {
      setAuthLoading(true);
      if (activeTab === 'login') {
        const res = await api.post('/auth/login', { email, password });
        if (res.data?.success && res.data?.data?.accessToken) {
          const { accessToken, user: loggedUser } = res.data.data;
          
          if (loggedUser.role === 'CUSTOMER') {
            showToast('Catalog access should be completed through Mangosteen primary shopping app.', 'error');
            return;
          }
          
          setSession(accessToken, loggedUser);
          showToast(`Welcome back, ${loggedUser.fullName}! Session active.`, 'success');
        }
      } else {
        const res = await api.post('/auth/register', { email, password, fullName, role });
        if (res.data?.success) {
          showToast('Account registered successfully! Proceeding to automatic login sequence...', 'success');
          // Auto-login sequence
          const loginRes = await api.post('/auth/login', { email, password });
          if (loginRes.data?.success && loginRes.data?.data?.accessToken) {
            const { accessToken, user: loggedUser } = loginRes.data.data;
            setSession(accessToken, loggedUser);
          }
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Authentication credentials rejected.';
      showToast(msg, 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  // Action Handlers (Admin)
  const updateOrderStatus = async (orderId: string, status: string, deliveryAgentId?: string) => {
    try {
      const res = await api.patch(`/orders/admin/${orderId}/status`, {
        status,
        deliveryAgentId: deliveryAgentId || undefined,
      });

      if (res.data?.success) {
        showToast(`Order status updated successfully to ${status}!`, 'success');
        fetchAdminData();
      }
    } catch (e: any) {
      const msg = e.response?.data?.error?.message || 'Failed to update order.';
      showToast(msg, 'error');
    }
  };

  const processWithdrawal = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await api.patch(`/affiliates/admin/withdrawals/${requestId}`, {
        status,
        notes: `Processed and cleared by operations manager: ${user?.fullName}`,
      });

      if (res.data?.success) {
        showToast(`Withdrawal payout request marked as ${status}!`, 'success');
        fetchAdminData();
      }
    } catch (e: any) {
      const msg = e.response?.data?.error?.message || 'Failed to settle payout request.';
      showToast(msg, 'error');
    }
  };

  // Action Handlers (Affiliate)
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = Number(withdrawAmount);
    if (amt < 500) {
      showToast('Minimum payout balance threshold is 500 BDT.', 'error');
      return;
    }
    if (amt > Number(profile?.walletBalance || 0)) {
      showToast('Specified withdrawal amount exceeds available wallet balance.', 'error');
      return;
    }
    if (!withdrawDetails) {
      showToast('Please specify cash account or bank details routing credentials.', 'error');
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
        showToast(res.data.message || 'Withdrawal balance payout submitted for review!', 'success');
        setWithdrawDetails('');
        setWithdrawAmount('500');
        fetchAffiliateProfile();
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Could not register payout request.';
      showToast(msg, 'error');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setLinkCopied(true);
    showToast('Campaign referral link copied to clipboard!', 'success');
    setTimeout(() => setLinkCopied(false), 2000);
  };

  // Trigger sync on load or user role changes
  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
        fetchAdminData();
      } else if (user.role === 'AFFILIATE') {
        fetchAffiliateProfile();
      }
    }
  }, [isAuthenticated, user]);

  // Auth Form Toggles
  const handleTabToggle = (tab: 'login' | 'register') => {
    setActiveTab(tab);
    setEmail('');
    setPassword('');
    setFullName('');
  };

  // 1. Unauthenticated: Auth view
  if (!isAuthenticated || !user) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-6 min-h-screen relative overflow-hidden bg-gradient-to-b from-[#09090b] to-[#121217]">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
        
        <div className="w-full max-w-md z-10 flex flex-col gap-8">
          {/* Logo & Header */}
          <div className="text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#10b981] to-[#f59e0b] flex items-center justify-center font-black text-slate-950 text-2xl shadow-xl shadow-emerald-500/10">
              🥭
            </div>
            <div>
              <h1 className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400 bg-clip-text text-transparent">
                Mangosteen Operations
              </h1>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">
                Admin Console & Affiliate Wallets
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="ops-panel p-1 rounded-xl flex gap-1 border border-zinc-800">
            <button
              onClick={() => handleTabToggle('login')}
              className={`flex-1 text-center py-2 text-xs font-extrabold rounded-lg transition duration-200 ${
                activeTab === 'login' 
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sign In Session
            </button>
            <button
              onClick={() => handleTabToggle('register')}
              className={`flex-1 text-center py-2 text-xs font-extrabold rounded-lg transition duration-200 ${
                activeTab === 'register' 
                  ? 'bg-zinc-800 text-emerald-400 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Partner Enrollment
            </button>
          </div>

          {/* Form */}
          <div className="ops-panel p-6 sm:p-8 rounded-3xl border border-zinc-800 shadow-2xl relative">
            <h2 className="text-base font-black text-white mb-6 flex items-center gap-2">
              {activeTab === 'login' ? <Lock className="w-4 h-4 text-emerald-400" /> : <UserPlus className="w-4 h-4 text-amber-400" />}
              {activeTab === 'login' ? 'Authenticate Dashboard Access' : 'Create Performance Wallet'}
            </h2>

            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
              {activeTab === 'register' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Atik Rahad"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition font-medium"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@mangosteen.com"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Secure Access Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition font-mono"
                />
              </div>

              {activeTab === 'register' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Account Operations Role</label>
                  <select
                    value={role}
                    onChange={(e: any) => setRole(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition font-extrabold"
                  >
                    <option value="AFFILIATE">AFFILIATE PARTNER (10% Commission Wallet)</option>
                    <option value="CUSTOMER">OPERATIONAL SHOPPER (View Catalog Only)</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-zinc-950 font-black py-3 rounded-xl text-xs tracking-wider transition uppercase mt-2 shadow-lg shadow-emerald-500/10 disabled:opacity-50"
              >
                {authLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin inline mr-1" /> Synced Authentication...
                  </>
                ) : activeTab === 'login' ? (
                  'Grant System Access'
                ) : (
                  'Confirm Partner Wallet Enrollment'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* 🚀 Active toast message */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 animate-bounce">
            <div className={`px-5 py-3.5 rounded-2xl text-xs font-black shadow-2xl flex items-center gap-2.5 border ${
              toast.type === 'success' ? 'bg-zinc-900 border-emerald-500 text-emerald-400' :
              toast.type === 'error' ? 'bg-zinc-900 border-red-500 text-red-400' :
              'bg-zinc-900 border-amber-500 text-amber-400'
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

  // 2. Admin Dashboard view
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return (
      <div className="flex-grow flex flex-col min-h-screen bg-[#070709]">
        {/* Header bar */}
        <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur border-b border-zinc-900 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-amber-500 flex items-center justify-center font-bold text-slate-950 text-xl shadow-lg shadow-emerald-500/5">
              🥭
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">
                Mangosteen Ops Console
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="bg-red-500/10 text-red-400 border border-red-500/20 font-mono text-[8px] font-black uppercase px-1.5 py-0.5 rounded">
                  System Root: {user.role}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={fetchAdminData}
              className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 text-xs font-black px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow"
            >
              <RefreshCw className="w-4 h-4" /> Sync Ledgers
            </button>
            <button
              onClick={logout}
              className="bg-zinc-950 hover:bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-black px-4 py-2 rounded-xl transition flex items-center gap-1.5"
            >
              <LogOut className="w-4 h-4" /> Disconnect
            </button>
          </div>
        </header>

        <div className="px-6 py-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
          
          {/* KPI Indicators Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="ops-panel p-6 rounded-2xl border border-zinc-800 flex flex-col gap-2">
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Active Purchases</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-3xl font-black text-white">{orders.length}</span>
                <ShoppingBag className="w-5 h-5 text-emerald-500" />
              </div>
              <p className="text-[10px] text-zinc-500 font-semibold mt-1">Placed this harvest season</p>
            </div>

            <div className="ops-panel p-6 rounded-2xl border border-zinc-800 flex flex-col gap-2">
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Riders En Route</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-3xl font-black text-white">
                  {orders.filter((o) => o.status === 'SHIPPED').length}
                </span>
                <Truck className="w-5 h-5 text-sky-400" />
              </div>
              <p className="text-[10px] text-zinc-500 font-semibold mt-1">Active deliveries out in regions</p>
            </div>

            <div className="ops-panel p-6 rounded-2xl border border-zinc-800 flex flex-col gap-2">
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider text-amber-400">Withdrawals Queue</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-3xl font-black text-white">
                  {withdrawals.filter((w) => w.status === 'PENDING').length}
                </span>
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <p className="text-[10px] text-zinc-500 font-semibold mt-1">Payout disburse requests pending review</p>
            </div>

            <div className="ops-panel p-6 rounded-2xl border border-red-500/20 bg-red-950/5 flex flex-col gap-2">
              <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider">Security Status</p>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-sm font-black text-emerald-400 uppercase tracking-widest">Active & Shielded</span>
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-[10px] text-zinc-500 font-semibold mt-1">COD fraud anti-velocity filters online</p>
            </div>
          </div>

          {/* 🚀 Active Orders & Agent Assignments Ledger */}
          <div className="ops-panel p-6 rounded-3xl border border-zinc-800 flex flex-col gap-6 shadow-xl">
            <div>
              <h3 className="font-extrabold text-base text-white mb-1">Seasonal Orders Checkout Ledger</h3>
              <p className="text-xs text-zinc-400 font-semibold">Review consumer checkouts, assign delivery riders to district regions, and update delivery status.</p>
            </div>

            <div className="overflow-x-auto min-h-[150px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="pb-3 pr-2">Reference</th>
                    <th className="pb-3 pr-2">Buyer details</th>
                    <th className="pb-3 pr-2">District</th>
                    <th className="pb-3 pr-2">Total Amount</th>
                    <th className="pb-3 pr-2">Gateway</th>
                    <th className="pb-3 pr-2">COD OTP Status</th>
                    <th className="pb-3 pr-2">Assigned Rider</th>
                    <th className="pb-3 text-right">Operational Workflow</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {orders.map((order) => (
                    <tr key={order.id} className="text-zinc-300 hover:bg-zinc-900/35 transition">
                      <td className="py-4 font-mono font-black text-zinc-500 pr-2">{order.id.substring(0, 8).toUpperCase()}</td>
                      <td className="py-4 pr-2">
                        <p className="font-extrabold text-zinc-200">{order.user?.fullName}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">{order.user?.email}</p>
                      </td>
                      <td className="py-4 pr-2 font-semibold text-zinc-400">📍 {order.district}</td>
                      <td className="py-4 pr-2 font-extrabold text-emerald-400">{order.totalAmount} BDT</td>
                      <td className="py-4 pr-2">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                          order.payment?.gateway === 'COD' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                        }`}>
                          {order.payment?.gateway}
                        </span>
                      </td>
                      <td className="py-4 pr-2">
                        {order.payment?.gateway === 'COD' ? (
                          <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                            order.codVerified ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {order.codVerified ? 'Verified' : 'Pending OTP'}
                          </span>
                        ) : (
                          <span className="text-zinc-600 font-semibold">—</span>
                        )}
                      </td>
                      <td className="py-4 pr-2">
                        <select
                          value={order.deliveryAgentId || ''}
                          onChange={(e) => updateOrderStatus(order.id, 'SHIPPED', e.target.value)}
                          className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-zinc-300 text-xs focus:outline-none focus:border-emerald-500 font-black cursor-pointer"
                        >
                          <option value="">Assign Rider</option>
                          {deliveryRiders.map((r) => (
                            <option key={r.id} value={r.id}>{r.fullName || r.name} ({r.email})</option>
                          ))}
                        </select>
                      </td>
                      <td className="py-4 text-right flex justify-end gap-1.5">
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'SHIPPED')}
                          className="bg-zinc-900 border border-zinc-800 hover:bg-sky-950/30 hover:border-sky-850 text-sky-400 px-3 py-1.5 rounded-xl font-black text-[10px] transition cursor-pointer"
                        >
                          En Route
                        </button>
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                          className="bg-zinc-900 border border-zinc-800 hover:bg-emerald-950/30 hover:border-emerald-850 text-emerald-400 px-3 py-1.5 rounded-xl font-black text-[10px] transition cursor-pointer"
                        >
                          Deliver
                        </button>
                        <button 
                          onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                          className="bg-zinc-900 border border-zinc-800 hover:bg-red-950/30 hover:border-red-850 text-red-400 px-3 py-1.5 rounded-xl font-black text-[10px] transition cursor-pointer"
                        >
                          Drop
                        </button>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-zinc-500 font-bold text-xs uppercase tracking-wider">
                        No seasonal checkouts registered in ledger logs yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 🚀 Affiliate Withdrawal Payout Review Queue */}
          <div className="ops-panel p-6 rounded-3xl border border-zinc-800 flex flex-col gap-6 shadow-xl">
            <div>
              <h3 className="font-extrabold text-base text-white mb-1">Affiliate Payout Review Queue</h3>
              <p className="text-xs text-zinc-400 font-semibold">Verify requested bank and MFS accounts, review click attributions click rates, and disburse wallet commission balances.</p>
            </div>

            <div className="overflow-x-auto min-h-[150px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-400 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="pb-3">Transaction Ref</th>
                    <th className="pb-3">Affiliate Partner</th>
                    <th className="pb-3">Wallet Commission</th>
                    <th className="pb-3">Payout Amount</th>
                    <th className="pb-3">Gateway Mode</th>
                    <th className="pb-3">Disbursement Target</th>
                    <th className="pb-3 text-right">Settlement Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-850">
                  {withdrawals.map((req) => (
                    <tr key={req.id} className="text-zinc-300 hover:bg-zinc-900/35 transition">
                      <td className="py-4 font-mono font-extrabold text-zinc-500">{req.txRef || `WIT-${req.id.substring(0, 5).toUpperCase()}`}</td>
                      <td className="py-4">
                        <p className="font-extrabold text-zinc-200">{req.affiliate?.user?.fullName}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Partner Code: {req.affiliate?.referralCode}</p>
                      </td>
                      <td className="py-4 font-semibold text-zinc-400">{req.affiliate?.walletBalance} BDT</td>
                      <td className="py-4 font-black text-amber-400">{req.amount} BDT</td>
                      <td className="py-4 font-black">
                        <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 font-black uppercase tracking-wider px-2.5 py-0.5 rounded text-[8px]">
                          {req.method}
                        </span>
                      </td>
                      <td className="py-4 text-zinc-400 font-semibold">{req.notes}</td>
                      <td className="py-4 text-right flex justify-end gap-1.5">
                        {req.status === 'PENDING' ? (
                          <>
                            <button 
                              onClick={() => processWithdrawal(req.id, 'APPROVED')}
                              className="bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-black px-3.5 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                            </button>
                            <button 
                              onClick={() => processWithdrawal(req.id, 'REJECTED')}
                              className="bg-zinc-900 border border-zinc-800 hover:bg-red-500/25 hover:border-red-900 hover:text-red-400 text-zinc-300 font-black px-3.5 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Decline
                            </button>
                          </>
                        ) : (
                          <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide border ${
                            req.status === 'APPROVED' || req.status === 'PAID' 
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                              : 'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {req.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {withdrawals.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-zinc-500 font-bold text-xs uppercase tracking-wider">
                        No affiliate disburse payout requests in operations queue.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 🚀 Active toast message */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 animate-bounce">
            <div className={`px-5 py-3.5 rounded-2xl text-xs font-black shadow-2xl flex items-center gap-2.5 border ${
              toast.type === 'success' ? 'bg-zinc-900 border-emerald-500 text-emerald-400' :
              toast.type === 'error' ? 'bg-zinc-900 border-red-500 text-red-400' :
              'bg-zinc-900 border-amber-500 text-amber-400'
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

  // 3. Affiliate Dashboard view
  return (
    <div className="flex-grow flex flex-col min-h-screen bg-[#070709]">
      {/* Header bar */}
      <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur border-b border-zinc-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-amber-500 flex items-center justify-center font-bold text-slate-950 text-xl shadow-lg shadow-emerald-500/5">
            🥭
          </div>
          <div>
            <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-emerald-400 to-amber-400 bg-clip-text text-transparent">
              Mangosteen Affiliate Hub
            </h1>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">
              Performance Wallet Wallet
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchAffiliateProfile}
            className="bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 text-zinc-300 text-xs font-black px-4 py-2 rounded-xl transition flex items-center gap-1.5 shadow"
          >
            <RefreshCw className="w-4 h-4" /> Sync Stats
          </button>
          <button
            onClick={logout}
            className="bg-zinc-950 hover:bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-black px-4 py-2 rounded-xl transition flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4" /> Disconnect
          </button>
        </div>
      </header>

      <div className="px-6 py-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
        
        {/* Welcome Banner */}
        <div className="ops-panel p-6 rounded-3xl border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl relative">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black text-2xl shadow-inner">
              🤝
            </div>
            <div>
              <h2 className="text-base font-black text-white">Welcome back, {user?.fullName}!</h2>
              <p className="text-[11px] text-zinc-400 mt-1">
                Your unique Referral ID code is:{' '}
                <span className="font-black text-emerald-400 bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-850 font-mono">
                  {profile?.referralCode}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Sync loading spinner */}
        {loading ? (
          <div className="flex items-center justify-center py-20 gap-2.5 text-zinc-400">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
            <span className="text-xs font-extrabold uppercase tracking-widest">Syncing Performance Wallet...</span>
          </div>
        ) : (
          <>
            {/* Wallet metrics grids */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="ops-panel p-6 rounded-2xl border border-zinc-800 flex flex-col gap-2">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Referral Clicks</p>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-3xl font-black text-white">{profile?.clicksCount || 0}</span>
                  <Share2 className="w-5 h-5 text-sky-400" />
                </div>
                <p className="text-[10px] text-zinc-500 font-semibold mt-1">Clicks tracked in last 30 days</p>
              </div>

              <div className="ops-panel p-6 rounded-2xl border border-zinc-800 flex flex-col gap-2">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Pending Commissions</p>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-3xl font-black text-amber-500">{profile?.pendingCommissions || 0} BDT</span>
                  <Clock className="w-5 h-5 text-amber-500" />
                </div>
                <p className="text-[10px] text-zinc-500 font-semibold mt-1">Held for COD OTP verify verification</p>
              </div>

              <div className="ops-panel p-6 rounded-2xl border-l-4 border-l-emerald-500 border-zinc-800 flex flex-col gap-2">
                <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Available Balance</p>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-3xl font-black text-white">{profile?.walletBalance || 0} BDT</span>
                  <Wallet className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-[10px] text-zinc-500 font-semibold mt-1">Approved and ready for payout cashout</p>
              </div>

              <div className="ops-panel p-6 rounded-2xl border border-zinc-800 flex flex-col gap-2">
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Withdrawn History</p>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="text-3xl font-black text-white">
                    {profile?.withdrawals
                      ?.filter((w: any) => w.status === 'APPROVED' || w.status === 'PAID')
                      ?.reduce((sum: number, w: any) => sum + Number(w.amount), 0) || 0} BDT
                  </span>
                  <ArrowUpRight className="w-5 h-5 text-purple-400" />
                </div>
                <p className="text-[10px] text-zinc-500 font-semibold mt-1">Paid disbursements cleared by admin</p>
              </div>
            </div>

            {/* Campaign deep links & withdraw submits */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Links Gen */}
              <div className="ops-panel p-6 sm:p-8 rounded-3xl border border-zinc-800 flex flex-col gap-6 shadow-xl">
                <div>
                  <h3 className="font-extrabold text-base text-white mb-1">Referral Campaign Deep-Links</h3>
                  <p className="text-xs text-zinc-400 font-semibold">Generate deep-links to seasonal organic mango boxes and share with your networks to earn 10% commission cash.</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Your General Referral Link</label>
                  <div className="flex bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden p-1 shadow-inner">
                    <input 
                      type="text" 
                      readOnly
                      value={generatedLink}
                      className="flex-grow bg-transparent text-xs px-3 focus:outline-none text-zinc-300 font-mono font-bold"
                    />
                    <button 
                      onClick={() => copyToClipboard(generatedLink)}
                      className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-4 py-2 rounded-lg text-xs font-black transition flex items-center gap-1 cursor-pointer"
                    >
                      {linkCopied ? 'Copied!' : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                    </button>
                  </div>
                </div>

                <div className="bg-zinc-950/65 p-4 border border-zinc-850 rounded-2xl flex gap-3 text-xs text-zinc-400 leading-relaxed">
                  <AlertCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <div>
                    <p className="font-black text-zinc-200 mb-1">Cookie Tracking & Anti-Fraud Metrics</p>
                    <p>When a buyer clicks your link, a 30-day cookie is written. Self-attributions and click velocities are filtered by system rules to guarantee performance legitimacy.</p>
                  </div>
                </div>
              </div>

              {/* Submit payout request */}
              <div className="ops-panel p-6 sm:p-8 rounded-3xl border border-zinc-800 flex flex-col gap-6 shadow-xl">
                <div>
                  <h3 className="font-extrabold text-base text-white mb-1">Submit Balance Payout Request</h3>
                  <p className="text-xs text-zinc-400 font-semibold">Withdraw approved commission wallet balance to your MFS or bank accounts.</p>
                </div>

                <form onSubmit={handleWithdrawSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Amount (BDT)</label>
                      <input 
                        type="number" 
                        required
                        min="500"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="500"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-500 text-white font-bold"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Payout Gateway Channel</label>
                      <select 
                        value={withdrawMethod}
                        onChange={(e) => setWithdrawMethod(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 text-white font-extrabold"
                      >
                        <option value="BKASH">bKash (MFS)</option>
                        <option value="NAGAD">Nagad (MFS)</option>
                        <option value="BANK">Bank Transfer</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Disbursement Account Details</label>
                    <input 
                      type="text" 
                      required
                      value={withdrawDetails}
                      onChange={(e) => setWithdrawDetails(e.target.value)}
                      placeholder="e.g. bKash Personal: +8801700000000 or Bank Acc details"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-emerald-500 text-zinc-300 font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={withdrawLoading || Number(profile?.walletBalance || 0) < 500}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-zinc-950 font-black py-3 rounded-xl text-xs tracking-wider transition uppercase mt-2 shadow-lg shadow-emerald-500/10 disabled:opacity-50"
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

            {/* Commissions and payout double auditing logs */}
            <div className="ops-panel p-6 rounded-3xl border border-zinc-800 flex flex-col gap-6 shadow-xl">
              <div>
                <h3 className="font-extrabold text-base text-white mb-1">Commission Settlements & Payout Logs</h3>
                <p className="text-xs text-zinc-400 font-semibold">Detailed double-entry records tracking campaigns clicks, pending COD commissions, and payouts history.</p>
              </div>

              <div className="overflow-x-auto min-h-[150px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-400 font-extrabold uppercase tracking-wider text-[10px]">
                      <th className="pb-3 pr-2">Transaction Ref</th>
                      <th className="pb-3 pr-2">Type</th>
                      <th className="pb-3 pr-2">Details</th>
                      <th className="pb-3 pr-2">Amount</th>
                      <th className="pb-3 pr-2">Settlement Date</th>
                      <th className="pb-3 text-right">Verification Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-850">
                    {/* Withdrawals */}
                    {profile?.withdrawals?.map((w: any) => (
                      <tr key={w.id} className="text-zinc-300 hover:bg-zinc-900/35 transition">
                        <td className="py-3 font-semibold font-mono text-zinc-500 pr-2">{w.txRef || `WIT-${w.id.substring(0, 5).toUpperCase()}`}</td>
                        <td className="py-3 pr-2">
                          <span className="bg-red-500/10 text-red-400 border border-red-500/20 font-black uppercase tracking-wider px-2 py-0.5 rounded text-[8px]">
                            Payout Cashout
                          </span>
                        </td>
                        <td className="py-3 text-zinc-400 font-semibold pr-2">{w.notes || `Disbursed to ${w.method}`}</td>
                        <td className="py-3 font-black text-red-400 pr-2">-{w.amount} BDT</td>
                        <td className="py-3 text-zinc-500 font-bold pr-2">{new Date(w.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide border ${
                            w.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            w.status === 'APPROVED' || w.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {w.status}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {/* Commissions */}
                    {profile?.commissions?.map((c: any) => (
                      <tr key={c.id} className="text-zinc-300 hover:bg-zinc-900/35 transition">
                        <td className="py-3 font-semibold font-mono text-zinc-500 pr-2">COM-{c.id.substring(0, 5).toUpperCase()}</td>
                        <td className="py-3 pr-2">
                          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black uppercase tracking-wider px-2 py-0.5 rounded text-[8px]">
                            Commission Earned
                          </span>
                        </td>
                        <td className="py-3 text-zinc-400 font-semibold pr-2">{c.notes || `10% commission on purchase ${c.orderId}`}</td>
                        <td className="py-3 font-black text-emerald-400 pr-2">+{c.amount} BDT</td>
                        <td className="py-3 text-zinc-500 font-bold pr-2">{new Date(c.createdAt).toLocaleDateString()}</td>
                        <td className="py-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide border ${
                            c.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            c.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            'bg-red-500/10 text-red-400 border-red-500/20'
                          }`}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {(!profile?.withdrawals || profile?.withdrawals.length === 0) && 
                     (!profile?.commissions || profile?.commissions.length === 0) && (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-zinc-500 font-bold text-xs uppercase tracking-wider">
                          No wallet settlements or payout transaction logs found.
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
          <div className={`px-5 py-3.5 rounded-2xl text-xs font-black shadow-2xl flex items-center gap-2.5 border ${
            toast.type === 'success' ? 'bg-zinc-900 border-emerald-500 text-emerald-400' :
            toast.type === 'error' ? 'bg-zinc-900 border-red-500 text-red-700' :
            'bg-zinc-900 border-amber-500 text-amber-400'
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
