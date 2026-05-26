'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { 
  ShieldCheck, ShoppingBag, Truck, Users, AlertTriangle, 
  RefreshCw, CheckCircle2, XCircle, ChevronRight, Star, Info, Lock,
  TrendingUp, Award, Wallet, ArrowUpRight, Copy, Clock, Share2, Compass, 
  AlertCircle, Eye, LogOut, ArrowRight, UserPlus, ShieldAlert, BarChart3,
  Menu, X, Landmark, Activity, Layers, Shield
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, LineChart, Line
} from 'recharts';

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

  // Sidebar Layout Navigation state
  const [activeSubTab, setActiveSubTab] = useState<string>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Search and Filter states
  const [orderSearch, setOrderSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('ALL');

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
        setActiveSubTab('ledger');
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
        setActiveSubTab('overview');
      } else if (user.role === 'AFFILIATE') {
        fetchAffiliateProfile();
        setActiveSubTab('overview');
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

  // MOCK DATA FOR CHARTS FALLBACK (Ensure widgets are never empty and always gorgeous)
  const salesHistoryMock = [
    { name: 'Mon', sales: 12400, orders: 8 },
    { name: 'Tue', sales: 18900, orders: 12 },
    { name: 'Wed', sales: 16200, orders: 11 },
    { name: 'Thu', sales: 31000, orders: 20 },
    { name: 'Fri', sales: 24800, orders: 16 },
    { name: 'Sat', sales: 49500, orders: 32 },
    { name: 'Sun', sales: 41200, orders: 27 },
  ];

  const affiliatePerformanceMock = [
    { name: 'Week 1', clicks: 28, earnings: 1400 },
    { name: 'Week 2', clicks: 64, earnings: 3200 },
    { name: 'Week 3', clicks: 42, earnings: 2100 },
    { name: 'Week 4', clicks: 95, earnings: 5600 },
    { name: 'Week 5', clicks: 120, earnings: 7400 },
  ];

  // Helper values for Admin Charts
  const districtDistribution = [
    { name: 'Dhaka', level: orders.filter(o => o.district?.toLowerCase() === 'dhaka').length || 18 },
    { name: 'Chittagong', level: orders.filter(o => o.district?.toLowerCase() === 'chittagong').length || 10 },
    { name: 'Rajshahi', level: orders.filter(o => o.district?.toLowerCase() === 'rajshahi').length || 15 },
    { name: 'Sylhet', level: orders.filter(o => o.district?.toLowerCase() === 'sylhet').length || 7 },
    { name: 'Khulna', level: orders.filter(o => o.district?.toLowerCase() === 'khulna').length || 5 },
  ];

  // Filters for order listing
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.user?.fullName?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(orderSearch.toLowerCase());
    
    const matchesDistrict = 
      districtFilter === 'ALL' || 
      order.district?.toUpperCase() === districtFilter.toUpperCase();

    return matchesSearch && matchesDistrict;
  });

  // 1. Unauthenticated: Auth view (Light Premium Screen)
  if (!isAuthenticated || !user) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-6 min-h-screen relative overflow-hidden bg-gradient-to-b from-[#f8fafc] to-[#e2e8f0]">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
        
        <div className="w-full max-w-md z-10 flex flex-col gap-8">
          {/* Logo & Header */}
          <div className="text-center flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#10b981] to-[#f59e0b] flex items-center justify-center font-black text-slate-950 text-2xl shadow-lg shadow-emerald-500/10 animate-pulse-soft">
              🥭
            </div>
            <div>
              <h1 className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-emerald-600 via-teal-600 to-amber-600 bg-clip-text text-transparent">
                Mangosteen Operations
              </h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                Corporate Console & Affiliate Portal
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="ops-panel p-1 rounded-xl flex gap-1 border border-slate-200 bg-slate-100/50">
            <button
              onClick={() => handleTabToggle('login')}
              className={`flex-1 text-center py-2 text-xs font-extrabold rounded-lg transition duration-200 cursor-pointer ${
                activeTab === 'login' 
                  ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In Session
            </button>
            <button
              onClick={() => handleTabToggle('register')}
              className={`flex-1 text-center py-2 text-xs font-extrabold rounded-lg transition duration-200 cursor-pointer ${
                activeTab === 'register' 
                  ? 'bg-white text-emerald-600 shadow-sm border border-slate-200/50' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Partner Enrollment
            </button>
          </div>

          {/* Form */}
          <div className="ops-panel p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white shadow-2xl relative">
            <h2 className="text-base font-black text-slate-800 mb-6 flex items-center gap-2">
              {activeTab === 'login' ? <Lock className="w-4 h-4 text-emerald-500" /> : <UserPlus className="w-4 h-4 text-amber-500" />}
              {activeTab === 'login' ? 'Authenticate Dashboard Access' : 'Create Performance Wallet'}
            </h2>

            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
              {activeTab === 'register' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Atik Rahad"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition font-medium"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@mangosteen.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition font-medium"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Secure Access Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition font-mono"
                />
              </div>

              {activeTab === 'register' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Account Operations Role</label>
                  <select
                    value={role}
                    onChange={(e: any) => setRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:bg-white transition font-extrabold cursor-pointer"
                  >
                    <option value="AFFILIATE">AFFILIATE PARTNER (10% Commission Wallet)</option>
                    <option value="CUSTOMER">OPERATIONAL SHOPPER (View Catalog Only)</option>
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black py-3 rounded-xl text-xs tracking-wider transition uppercase mt-2 shadow-md shadow-emerald-500/10 disabled:opacity-50 cursor-pointer"
              >
                {authLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin inline mr-1" /> Synced Authentication...
                  </>
                ) : activeTab === 'login' ? (
                  'Grant System Access'
                ) : (
                  'Confirm Enrollment'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Toast alert */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 animate-bounce">
            <div className={`px-5 py-3.5 rounded-2xl text-xs font-black shadow-2xl flex items-center gap-2.5 border bg-white ${
              toast.type === 'success' ? 'border-emerald-500 text-emerald-600' :
              toast.type === 'error' ? 'border-red-500 text-red-600' :
              'border-amber-500 text-amber-600'
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

  // 2. Admin & Super Admin dashboard Layout (Light Professional)
  if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-700 flex flex-col md:flex-row relative">
        
        {/* MOBILE HEADER */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <span className="text-xl">🥭</span>
            <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-emerald-600 to-amber-600 bg-clip-text text-transparent">
              Mangosteen Admin
            </span>
          </div>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="p-2 text-slate-500 hover:text-slate-800 cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* ADMIN SIDEBAR */}
        <aside className={`
          fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 p-5 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen sticky top-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex flex-col gap-6">
            {/* Branding */}
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-500 to-amber-500 flex items-center justify-center font-bold text-white text-lg shadow-sm">
                🥭
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm tracking-tight text-slate-800 leading-none">Mangosteen</span>
                <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">Ops Console</span>
              </div>
            </div>

            {/* Profile Panel */}
            <div className="ops-panel p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-250/30 flex items-center justify-center font-black text-sm text-emerald-600">
                {user.fullName.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-slate-800 truncate leading-none">{user.fullName}</p>
                <span className="inline-block bg-red-50 text-red-650 border border-red-200/50 font-mono text-[8px] font-black uppercase px-1 py-0.5 rounded mt-1.5 leading-none">
                  {user.role}
                </span>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="flex flex-col gap-1">
              <button
                onClick={() => { setActiveSubTab('overview'); setIsMobileMenuOpen(false); }}
                className={`ops-nav-item flex items-center gap-2.5 px-3 py-2.5 text-xs font-extrabold rounded-lg cursor-pointer ${activeSubTab === 'overview' ? 'ops-nav-item-active' : ''}`}
              >
                <Activity className="w-4 h-4" /> Overview Dashboard
              </button>
              
              <button
                onClick={() => { setActiveSubTab('orders'); setIsMobileMenuOpen(false); }}
                className={`ops-nav-item flex items-center gap-2.5 px-3 py-2.5 text-xs font-extrabold rounded-lg cursor-pointer ${activeSubTab === 'orders' ? 'ops-nav-item-active' : ''}`}
              >
                <ShoppingBag className="w-4 h-4" /> Orders Checkout Ledger
                {orders.length > 0 && (
                  <span className="ml-auto bg-slate-100 text-slate-700 border border-slate-200 text-[8px] font-mono font-black px-1.5 py-0.5 rounded-md">
                    {orders.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => { setActiveSubTab('payouts'); setIsMobileMenuOpen(false); }}
                className={`ops-nav-item flex items-center gap-2.5 px-3 py-2.5 text-xs font-extrabold rounded-lg cursor-pointer ${activeSubTab === 'payouts' ? 'ops-nav-item-active' : ''}`}
              >
                <Users className="w-4 h-4" /> Affiliate Payouts Queue
                {withdrawals.filter(w => w.status === 'PENDING').length > 0 && (
                  <span className="ml-auto bg-amber-50 text-amber-700 border border-amber-200/50 text-[8px] font-mono font-black px-1.5 py-0.5 rounded-md">
                    {withdrawals.filter(w => w.status === 'PENDING').length}
                  </span>
                )}
              </button>

              <button
                onClick={() => { setActiveSubTab('security'); setIsMobileMenuOpen(false); }}
                className={`ops-nav-item flex items-center gap-2.5 px-3 py-2.5 text-xs font-extrabold rounded-lg cursor-pointer ${activeSubTab === 'security' ? 'ops-nav-item-active' : ''}`}
              >
                <ShieldAlert className="w-4 h-4" /> Anti-Fraud Console
              </button>
            </nav>
          </div>

          {/* Sidebar Footer Info */}
          <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Secure Link Active
            </div>
            <button
              onClick={logout}
              className="w-full bg-slate-50 border border-slate-200 hover:bg-red-50 hover:text-red-650 hover:border-red-200 text-slate-500 text-xs font-black py-2 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" /> Disconnect console
            </button>
          </div>
        </aside>

        {/* MAIN ADMIN WORKSPACE */}
        <div className="flex-grow flex flex-col min-h-screen overflow-x-hidden">
          
          {/* Header */}
          <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
                <span>System Root</span>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <span className="text-slate-400 font-bold lowercase">console / admin</span>
                <ChevronRight className="w-3 h-3 text-slate-300" />
                <span className="text-emerald-600 font-black">{activeSubTab}</span>
              </div>
              <h2 className="font-extrabold text-base text-slate-800 mt-1 capitalize">{activeSubTab} Management</h2>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={fetchAdminData}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-755 text-xs font-black px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Sync Ledgers
              </button>
            </div>
          </header>

          {/* Content Swapper */}
          <main className="flex-1 p-6 max-w-7xl w-full mx-auto flex flex-col gap-6">
            
            {/* SUB-TAB: OVERVIEW */}
            {activeSubTab === 'overview' && (
              <>
                {/* KPI Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="ops-panel p-6 rounded-2xl flex flex-col gap-2 ops-panel-hover">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Purchases</p>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-3xl font-black text-slate-800">{orders.length}</span>
                      <ShoppingBag className="w-5 h-5 text-emerald-500" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Placed this harvest season</p>
                  </div>

                  <div className="ops-panel p-6 rounded-2xl flex flex-col gap-2 ops-panel-hover">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Riders En Route</p>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-3xl font-black text-slate-800">
                        {orders.filter((o) => o.status === 'SHIPPED').length}
                      </span>
                      <Truck className="w-5 h-5 text-sky-500" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Active deliveries out in regions</p>
                  </div>

                  <div className="ops-panel p-6 rounded-2xl flex flex-col gap-2 ops-panel-hover">
                    <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider text-amber-500">Withdrawals Queue</p>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-3xl font-black text-slate-800">
                        {withdrawals.filter((w) => w.status === 'PENDING').length}
                      </span>
                      <Users className="w-5 h-5 text-purple-500" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Payout requests pending review</p>
                  </div>

                  <div className="ops-panel p-6 rounded-2xl border-l-4 border-l-emerald-500 flex flex-col gap-2 ops-panel-hover">
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Security Engine</p>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-sm font-black text-emerald-600 uppercase tracking-widest">Active & Shielded</span>
                      <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">COD anti-velocity rules active</p>
                  </div>
                </div>

                {/* GRAPHICAL RECHARTS ANALYTICS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Revenue Growth chart */}
                  <div className="ops-panel p-6 rounded-3xl shadow flex flex-col gap-4 lg:col-span-2">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800 mb-1 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-emerald-500" /> Operations Checkout Volume
                      </h3>
                      <p className="text-[11px] text-slate-400">Harvest checkouts & total revenue aggregate in real time.</p>
                    </div>
                    <div className="h-64 w-full mt-2 font-mono text-[9px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={salesHistoryMock} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                              <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
                          <YAxis stroke="#64748b" tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a' }}
                            labelStyle={{ color: '#047857', fontWeight: 'bold' }}
                          />
                          <Area type="monotone" dataKey="sales" name="Gross Sales BDT" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSales)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* District distribution bar chart */}
                  <div className="ops-panel p-6 rounded-3xl shadow flex flex-col gap-4">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800 mb-1 flex items-center gap-1.5">
                        <Compass className="w-4 h-4 text-amber-500" /> District Distribution
                      </h3>
                      <p className="text-[11px] text-slate-400">Geographical purchase volumes per district.</p>
                    </div>
                    <div className="h-64 w-full mt-2 font-mono text-[9px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={districtDistribution} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
                          <YAxis stroke="#64748b" tickLine={false} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a' }}
                          />
                          <Bar dataKey="level" name="Orders Count" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={16} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                </div>

                {/* Operations Queue alerts board */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="ops-panel p-5 rounded-2xl lg:col-span-2 flex flex-col gap-3">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-purple-500" /> Quick-Settle Pending Ledger Items
                    </h4>
                    <p className="text-[11px] text-slate-400">Review, settle payouts and update operational dispatch with one tap, or toggle details in dedicated navigation tabs.</p>
                    
                    <div className="flex flex-wrap gap-3.5 mt-2">
                      <button 
                        onClick={() => setActiveSubTab('orders')}
                        className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-755 text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer font-bold"
                      >
                        Go to Checkout Ledger <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                      <button 
                        onClick={() => setActiveSubTab('payouts')}
                        className="bg-purple-50 hover:bg-purple-100 border border-purple-200/50 text-purple-700 text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer font-bold"
                      >
                        Settle Affiliates Queue <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="ops-panel p-5 rounded-2xl flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-emerald-500" /> Active System Status
                      </h4>
                      <div className="space-y-2 mt-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">API Latency:</span>
                          <span className="font-bold text-emerald-600 font-mono">14ms (Optimal)</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Riders Online:</span>
                          <span className="font-bold text-sky-600 font-mono">{deliveryRiders.length} Agents</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Pending Comm:</span>
                          <span className="font-bold text-amber-600 font-mono">
                            {withdrawals.filter(w => w.status === 'PENDING').reduce((sum, w) => sum + Number(w.amount), 0)} BDT
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* SUB-TAB: ORDERS LEDGER */}
            {activeSubTab === 'orders' && (
              <div className="ops-panel p-6 rounded-3xl flex flex-col gap-6 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-extrabold text-base text-slate-800 mb-1">Seasonal Orders Checkout Ledger</h3>
                    <p className="text-xs text-slate-400 font-semibold">Review consumer checkouts, assign riders to region zones, and manage status transitions.</p>
                  </div>
                  
                  {/* Search and Filters Box */}
                  <div className="flex flex-wrap gap-2.5 items-center">
                    <input 
                      type="text" 
                      placeholder="Search ID, Name or Email..."
                      value={orderSearch}
                      onChange={(e) => setOrderSearch(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-emerald-500 text-slate-700 w-48 font-medium"
                    />
                    <select
                      value={districtFilter}
                      onChange={(e) => setDistrictFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-700 focus:outline-none focus:border-emerald-500 font-extrabold cursor-pointer"
                    >
                      <option value="ALL">All Districts</option>
                      <option value="Dhaka">Dhaka</option>
                      <option value="Chittagong">Chittagong</option>
                      <option value="Rajshahi">Rajshahi</option>
                      <option value="Sylhet">Sylhet</option>
                      <option value="Khulna">Khulna</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto min-h-[250px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
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
                    <tbody className="divide-y divide-slate-100">
                      {filteredOrders.map((order) => (
                        <tr key={order.id} className="text-slate-655 hover:bg-slate-50/80 transition">
                          <td className="py-4 font-mono font-black text-slate-400 pr-2">{order.id.substring(0, 8).toUpperCase()}</td>
                          <td className="py-4 pr-2">
                            <p className="font-extrabold text-slate-800">{order.user?.fullName}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{order.user?.email}</p>
                          </td>
                          <td className="py-4 pr-2 font-semibold text-slate-500">📍 {order.district}</td>
                          <td className="py-4 pr-2 font-extrabold text-emerald-600">{order.totalAmount} BDT</td>
                          <td className="py-4 pr-2">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                              order.payment?.gateway === 'COD' ? 'bg-amber-50 text-amber-600 border border-amber-200/50' : 'bg-sky-50 text-sky-600 border border-sky-200/50'
                            }`}>
                              {order.payment?.gateway}
                            </span>
                          </td>
                          <td className="py-4 pr-2">
                            {order.payment?.gateway === 'COD' ? (
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase ${
                                order.codVerified ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/50' : 'bg-red-50 text-red-600 border border-red-200/50'
                              }`}>
                                {order.codVerified ? 'Verified' : 'Pending OTP'}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-semibold">—</span>
                            )}
                          </td>
                          <td className="py-4 pr-2">
                            <select
                              value={order.deliveryAgentId || ''}
                              onChange={(e) => updateOrderStatus(order.id, 'SHIPPED', e.target.value)}
                              className="bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 text-xs focus:outline-none focus:border-emerald-500 font-black cursor-pointer shadow-sm"
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
                              className="bg-slate-50 border border-slate-200 hover:bg-sky-50 hover:border-sky-300 text-sky-655 px-3 py-1.5 rounded-xl font-black text-[10px] transition cursor-pointer shadow-sm"
                            >
                              En Route
                            </button>
                            <button 
                              onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                              className="bg-slate-50 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300 text-emerald-600 px-3 py-1.5 rounded-xl font-black text-[10px] transition cursor-pointer shadow-sm"
                            >
                              Deliver
                            </button>
                            <button 
                              onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                              className="bg-slate-50 border border-slate-200 hover:bg-red-50 hover:border-red-300 text-red-600 px-3 py-1.5 rounded-xl font-black text-[10px] transition cursor-pointer shadow-sm"
                            >
                              Drop
                            </button>
                          </td>
                        </tr>
                      ))}
                      {filteredOrders.length === 0 && (
                        <tr>
                          <td colSpan={8} className="text-center py-12 text-slate-400 font-bold text-xs uppercase tracking-wider">
                            No seasonal checkouts match the search logs.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-TAB: PAYOUTS QUEUE */}
            {activeSubTab === 'payouts' && (
              <div className="ops-panel p-6 rounded-3xl flex flex-col gap-6 shadow-xl">
                <div>
                  <h3 className="font-extrabold text-base text-slate-800 mb-1">Affiliate Payout Review Queue</h3>
                  <p className="text-xs text-slate-400 font-semibold">Verify cash bank details, audit referring click velocities, and disburse performance wallet balances.</p>
                </div>

                <div className="overflow-x-auto min-h-[250px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                        <th className="pb-3">Transaction Ref</th>
                        <th className="pb-3">Affiliate Partner</th>
                        <th className="pb-3">Wallet Commission</th>
                        <th className="pb-3">Payout Amount</th>
                        <th className="pb-3">Gateway Mode</th>
                        <th className="pb-3">Disbursement Target</th>
                        <th className="pb-3 text-right">Settlement Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {withdrawals.map((req) => (
                        <tr key={req.id} className="text-slate-655 hover:bg-slate-50/80 transition">
                          <td className="py-4 font-mono font-extrabold text-slate-400">{req.txRef || `WIT-${req.id.substring(0, 5).toUpperCase()}`}</td>
                          <td className="py-4">
                            <p className="font-extrabold text-slate-800">{req.affiliate?.user?.fullName}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Partner Code: {req.affiliate?.referralCode}</p>
                          </td>
                          <td className="py-4 font-semibold text-slate-500">{req.affiliate?.walletBalance} BDT</td>
                          <td className="py-4 font-black text-amber-600">{req.amount} BDT</td>
                          <td className="py-4 font-black">
                            <span className="bg-purple-50 text-purple-600 border border-purple-200/50 font-black uppercase tracking-wider px-2.5 py-0.5 rounded text-[8px]">
                              {req.method}
                            </span>
                          </td>
                          <td className="py-4 text-slate-550 font-semibold">{req.notes || req.paymentDetails || 'N/A'}</td>
                          <td className="py-4 text-right flex justify-end gap-1.5">
                            {req.status === 'PENDING' ? (
                              <>
                                <button 
                                  onClick={() => processWithdrawal(req.id, 'APPROVED')}
                                  className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-3.5 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer shadow-sm"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                                </button>
                                <button 
                                  onClick={() => processWithdrawal(req.id, 'REJECTED')}
                                  className="bg-slate-50 border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 text-slate-655 font-black px-3.5 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer shadow-sm"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> Decline
                                </button>
                              </>
                            ) : (
                              <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wide border ${
                                req.status === 'APPROVED' || req.status === 'PAID' 
                                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200/50' 
                                  : 'bg-red-50 text-red-600 border-red-200/50'
                              }`}>
                                {req.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {withdrawals.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-slate-400 font-bold text-xs uppercase tracking-wider">
                            No affiliate disburse payout requests registered.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-TAB: ANTI-FRAUD SECURITY */}
            {activeSubTab === 'security' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Security Status Card */}
                <div className="ops-panel p-6 rounded-3xl shadow flex flex-col gap-4 lg:col-span-2">
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-500" /> Active Security Controls
                  </h3>
                  <p className="text-[11px] text-slate-400">All consumer checkouts pass validation rules. Anti-fraud filters and OTP logs running optimally.</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">COD OTP Validation</span>
                      <span className="text-xs font-black text-emerald-600">Enabled (100% enforcement)</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Self-Attribution Checks</span>
                      <span className="text-xs font-black text-emerald-600">Strict IP & Cookie audits active</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Affiliate Self-Clicks</span>
                      <span className="text-xs font-black text-rose-600">Auto-Filtered & Flagged</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Daily Commission Caps</span>
                      <span className="text-xs font-black text-emerald-600">Enforced: 15,000 BDT Max</span>
                    </div>
                  </div>
                </div>

                {/* Simulated Security Ledger Logs */}
                <div className="ops-panel p-6 rounded-3xl shadow flex flex-col gap-4">
                  <h3 className="font-extrabold text-sm text-slate-800 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-amber-500" /> Security Event Log
                  </h3>
                  <div className="flex-1 space-y-3 font-mono text-[9px] text-slate-500 overflow-y-auto max-h-60 mt-1 pr-1">
                    <div className="border-l-2 border-emerald-500 pl-2">
                      <span className="text-slate-400 block font-semibold">11:34:12 GMT+6</span>
                      <p className="text-slate-700">Wallet sync executed successfully for session agent.</p>
                    </div>
                    <div className="border-l-2 border-slate-300 pl-2">
                      <span className="text-slate-400 block font-semibold">11:29:45 GMT+6</span>
                      <p className="text-slate-600">Affiliate clicks attributions cleared by velocity check.</p>
                    </div>
                    <div className="border-l-2 border-emerald-500 pl-2">
                      <span className="text-slate-400 block font-semibold">11:15:02 GMT+6</span>
                      <p className="text-slate-700">COD OTP session verification for Order #28399 confirmed.</p>
                    </div>
                    <div className="border-l-2 border-rose-500 pl-2">
                      <span className="text-slate-400 block font-semibold">10:55:40 GMT+6</span>
                      <p className="text-rose-600 font-bold">Self-referred click detected. Attribution dropped.</p>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </main>
        </div>

        {/* Global Toast notices */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 animate-bounce">
            <div className={`px-5 py-3.5 rounded-2xl text-xs font-black shadow-2xl flex items-center gap-2.5 border bg-white ${
              toast.type === 'success' ? 'border-emerald-500 text-emerald-600' :
              toast.type === 'error' ? 'border-red-500 text-red-600' :
              'border-amber-500 text-amber-600'
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

  // 3. Affiliate Dashboard Layout (Light Professional)
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-700 flex flex-col md:flex-row relative">
      
      {/* MOBILE HEADER */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="text-xl">🥭</span>
          <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-emerald-600 to-amber-600 bg-clip-text text-transparent">
            Mangosteen Partner
          </span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="p-2 text-slate-500 hover:text-slate-800 cursor-pointer"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* AFFILIATE SIDEBAR */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200/80 p-5 flex flex-col justify-between transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-screen sticky top-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col gap-6">
          {/* Branding */}
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-500 to-amber-500 flex items-center justify-center font-bold text-white text-lg shadow-sm">
              🥭
            </div>
            <div className="flex flex-col">
              <span className="font-black text-sm tracking-tight text-slate-800 leading-none">Mangosteen</span>
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">Affiliate Hub</span>
            </div>
          </div>

          {/* Profile Panel with Referral code */}
          <div className="ops-panel p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-250/30 flex items-center justify-center font-black text-sm text-amber-600">
                {user.fullName.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-slate-800 truncate leading-none">{user.fullName}</p>
                <p className="text-[9px] text-slate-400 font-semibold truncate mt-1 leading-none">Affiliate Partner</p>
              </div>
            </div>
            {profile?.referralCode && (
              <div className="bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-200 flex items-center justify-between mt-1 text-[10px] font-mono text-slate-500">
                <span>Code: <b className="text-amber-600">{profile.referralCode}</b></span>
                <button 
                  onClick={() => copyToClipboard(profile.referralCode)}
                  className="text-slate-400 hover:text-slate-800 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            <button
              onClick={() => { setActiveSubTab('overview'); setIsMobileMenuOpen(false); }}
              className={`ops-nav-item flex items-center gap-2.5 px-3 py-2.5 text-xs font-extrabold rounded-lg cursor-pointer ${activeSubTab === 'overview' ? 'ops-nav-item-active-affiliate' : ''}`}
            >
              <Activity className="w-4 h-4" /> Partner Overview
            </button>
            
            <button
              onClick={() => { setActiveSubTab('links'); setIsMobileMenuOpen(false); }}
              className={`ops-nav-item flex items-center gap-2.5 px-3 py-2.5 text-xs font-extrabold rounded-lg cursor-pointer ${activeSubTab === 'links' ? 'ops-nav-item-active-affiliate' : ''}`}
            >
              <Share2 className="w-4 h-4" /> Share & Deep-Links
            </button>

            <button
              onClick={() => { setActiveSubTab('withdraw'); setIsMobileMenuOpen(false); }}
              className={`ops-nav-item flex items-center gap-2.5 px-3 py-2.5 text-xs font-extrabold rounded-lg cursor-pointer ${activeSubTab === 'withdraw' ? 'ops-nav-item-active-affiliate' : ''}`}
            >
              <Wallet className="w-4 h-4" /> Request Payout
            </button>

            <button
              onClick={() => { setActiveSubTab('ledger'); setIsMobileMenuOpen(false); }}
              className={`ops-nav-item flex items-center gap-2.5 px-3 py-2.5 text-xs font-extrabold rounded-lg cursor-pointer ${activeSubTab === 'ledger' ? 'ops-nav-item-active-affiliate' : ''}`}
            >
              <Landmark className="w-4 h-4" /> Settlements Ledger
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Wallet Verified
          </div>
          <button
            onClick={logout}
            className="w-full bg-slate-50 border border-slate-200 hover:bg-red-550 hover:text-red-650 hover:border-red-200 text-slate-500 text-xs font-black py-2 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Disconnect
          </button>
        </div>
      </aside>

      {/* MAIN AFFILIATE WORKSPACE */}
      <div className="flex-grow flex flex-col min-h-screen overflow-x-hidden">
        
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 font-extrabold uppercase tracking-widest">
              <span>Partner Workspace</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="text-slate-400 font-bold lowercase">wallet / transactions</span>
              <ChevronRight className="w-3 h-3 text-slate-300" />
              <span className="text-amber-600 font-black">{activeSubTab}</span>
            </div>
            <h2 className="font-extrabold text-base text-slate-800 mt-1 capitalize">{activeSubTab} Dashboard</h2>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={fetchAffiliateProfile}
              className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-755 text-xs font-black px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 shadow shadow-slate-100 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Sync Stats
            </button>
          </div>
        </header>

        {/* Sync spinner */}
        {loading ? (
          <div className="flex-grow flex items-center justify-center p-20 gap-2.5 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
            <span className="text-xs font-extrabold uppercase tracking-widest">Syncing Performance Wallet...</span>
          </div>
        ) : (
          <main className="flex-grow p-6 max-w-7xl w-full mx-auto flex flex-col gap-6">
            
            {/* SUB-TAB: PARTNER OVERVIEW */}
            {activeSubTab === 'overview' && (
              <>
                {/* Welcome Banner info */}
                <div className="ops-panel p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-6 shadow relative overflow-hidden">
                  <div className="flex items-center gap-4 text-center sm:text-left">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/50 flex items-center justify-center font-black text-xl shadow-inner">
                      🤝
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-slate-800">Welcome back to the Affiliate Hub, {user?.fullName}!</h2>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Use your unique links below to promote mango boxes and collect a 10% commission on every verified checkout.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Metrics boxes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="ops-panel p-6 rounded-2xl flex flex-col gap-2 ops-panel-hover">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Referral Clicks</p>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-3xl font-black text-slate-800">{profile?.clicksCount || 0}</span>
                      <Share2 className="w-5 h-5 text-sky-500" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Clicks tracked in last 30 days</p>
                  </div>

                  <div className="ops-panel p-6 rounded-2xl flex flex-col gap-2 ops-panel-hover">
                    <p className="text-[10px] text-slate-455 font-bold uppercase tracking-wider">Pending Commissions</p>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-3xl font-black text-amber-650">{profile?.pendingCommissions || 0} BDT</span>
                      <Clock className="w-5 h-5 text-amber-500 animate-pulse-soft" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Held for COD OTP verification</p>
                  </div>

                  <div className="ops-panel p-6 rounded-2xl border-l-4 border-l-amber-550 flex flex-col gap-2 ops-panel-hover">
                    <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Available Balance</p>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-3xl font-black text-slate-800">{profile?.walletBalance || 0} BDT</span>
                      <Wallet className="w-5 h-5 text-amber-500" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Approved and ready for payout</p>
                  </div>

                  <div className="ops-panel p-6 rounded-2xl flex flex-col gap-2 ops-panel-hover">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Withdrawn History</p>
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-3xl font-black text-slate-800">
                        {profile?.withdrawals
                          ?.filter((w: any) => w.status === 'APPROVED' || w.status === 'PAID')
                          ?.reduce((sum: number, w: any) => sum + Number(w.amount), 0) || 0} BDT
                      </span>
                      <ArrowUpRight className="w-5 h-5 text-purple-500" />
                    </div>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Cleared payouts paid to you</p>
                  </div>
                </div>

                {/* GRAPHICAL RECHARTS FOR AFFILIATES */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Campaign Clicks & Earnings growth */}
                  <div className="ops-panel p-6 rounded-3xl shadow flex flex-col gap-4 lg:col-span-2">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800 mb-1 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-amber-500" /> Referral Performance Overview
                      </h3>
                      <p className="text-[11px] text-slate-400">Weekly growth in referral clicks relative to generated earnings.</p>
                    </div>
                    <div className="h-64 w-full mt-2 font-mono text-[9px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={affiliatePerformanceMock} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                          <XAxis dataKey="name" stroke="#64748b" tickLine={false} />
                          <YAxis stroke="#64748b" tickLine={false} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '8px', color: '#0f172a' }}
                            labelStyle={{ color: '#b45309', fontWeight: 'bold' }}
                          />
                          <Line type="monotone" dataKey="earnings" name="Wallet Earnings (BDT)" stroke="#f59e0b" strokeWidth={3} activeDot={{ r: 6 }} />
                          <Line type="monotone" dataKey="clicks" name="Referral Clicks" stroke="#06b6d4" strokeWidth={2} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Anti-Fraud Guidelines card */}
                  <div className="ops-panel p-6 rounded-3xl flex flex-col justify-between">
                    <div className="flex flex-col gap-3">
                      <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                        <Award className="w-4 h-4 text-amber-550" /> Active Commissions Level
                      </h4>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-1.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Commission Bracket</span>
                        <span className="text-xs font-black text-amber-600">Tier 1: 10% Flat Rate</span>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-1.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cookie Lifespan</span>
                        <span className="text-xs font-black text-emerald-600">30-day tracking cookie</span>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setActiveSubTab('links')}
                      className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-655 text-xs py-2 rounded-xl transition mt-4 font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      Get Referral Links <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                    </button>
                  </div>

                </div>

              </>
            )}

            {/* SUB-TAB: CAMPAIGN LINKS */}
            {activeSubTab === 'links' && (
              <div className="ops-panel p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white flex flex-col gap-6 shadow-xl max-w-3xl mx-auto w-full">
                <div>
                  <h3 className="font-extrabold text-base text-slate-800 mb-1">Referral Campaign Deep-Links</h3>
                  <p className="text-xs text-slate-400 font-semibold">Generate tracking campaign links for organic mango boxes and share with your networks to collect commission cash.</p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Your Referral Link</label>
                  <div className="flex bg-slate-50 border border-slate-200 rounded-xl overflow-hidden p-1 shadow-inner">
                    <input 
                      type="text" 
                      readOnly
                      value={generatedLink}
                      className="flex-grow bg-transparent text-xs px-3 focus:outline-none text-slate-700 font-mono font-bold"
                    />
                    <button 
                      onClick={() => copyToClipboard(generatedLink)}
                      className="bg-amber-500 hover:bg-amber-400 text-white px-4 py-2 rounded-lg text-xs font-black transition flex items-center gap-1 cursor-pointer shadow-sm"
                    >
                      {linkCopied ? 'Copied!' : <><Copy className="w-3.5 h-3.5" /> Copy Link</>}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 border border-slate-200 rounded-2xl flex gap-3 text-xs text-slate-550 leading-relaxed">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <div>
                    <p className="font-black text-slate-800 mb-1">Click attribution & cookies policy</p>
                    <p>When a buyer clicks your deep-link, our platform saves a 30-day tracking cookie. Self-attribution and automated click bot velocities are dynamically dropped by security controls to ensure organic legitimacy.</p>
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB: BALANCE PAYOUT REQUEST */}
            {activeSubTab === 'withdraw' && (
              <div className="ops-panel p-6 sm:p-8 rounded-3xl border border-slate-200 bg-white flex flex-col gap-6 shadow-xl max-w-lg mx-auto w-full">
                <div>
                  <h3 className="font-extrabold text-base text-slate-800 mb-1">Submit Balance Payout Request</h3>
                  <p className="text-xs text-slate-400 font-semibold">Withdraw your cleared commission wallet balance directly into MFS mobile cash or bank accounts.</p>
                </div>

                <form onSubmit={handleWithdrawSubmit} className="flex flex-col gap-4">
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Amount (BDT)</label>
                      <input 
                        type="number" 
                        required
                        min="500"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        placeholder="500"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-amber-500 text-slate-800 font-bold"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Gateway Channel</label>
                      <select 
                        value={withdrawMethod}
                        onChange={(e) => setWithdrawMethod(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500 text-slate-800 font-extrabold cursor-pointer"
                      >
                        <option value="BKASH">bKash (MFS)</option>
                        <option value="NAGAD">Nagad (MFS)</option>
                        <option value="BANK">Bank Transfer</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Account Routing Details</label>
                    <input 
                      type="text" 
                      required
                      value={withdrawDetails}
                      onChange={(e) => setWithdrawDetails(e.target.value)}
                      placeholder="e.g. Personal bKash: +88017XXXXXXXX or Bank Routing details"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-amber-500 text-slate-700 font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={withdrawLoading || Number(profile?.walletBalance || 0) < 500}
                    className="w-full bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-750 text-white font-black py-3 rounded-xl text-xs tracking-wider transition uppercase mt-2 shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {withdrawLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin inline mr-1" /> Booking withdrawal...
                      </>
                    ) : (
                      'Request Balance Payout'
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* SUB-TAB: SETTLEMENTS LEDGER */}
            {activeSubTab === 'ledger' && (
              <div className="ops-panel p-6 rounded-3xl border border-slate-200 bg-white flex flex-col gap-6 shadow-xl">
                <div>
                  <h3 className="font-extrabold text-base text-slate-800 mb-1">Commission Settlements & Payout Logs</h3>
                  <p className="text-xs text-slate-400 font-semibold">Track double-entry logs audit-history of all campaigns clicks, pending payouts, and approved settlements.</p>
                </div>

                <div className="overflow-x-auto min-h-[250px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                        <th className="pb-3 pr-2">Transaction Ref</th>
                        <th className="pb-3 pr-2">Type</th>
                        <th className="pb-3 pr-2">Details</th>
                        <th className="pb-3 pr-2">Amount</th>
                        <th className="pb-3 pr-2">Settlement Date</th>
                        <th className="pb-3 text-right">Verification Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {/* Withdrawals */}
                      {profile?.withdrawals?.map((w: any) => (
                        <tr key={w.id} className="text-slate-655 hover:bg-slate-50/80 transition">
                          <td className="py-3 font-semibold font-mono text-slate-400 pr-2">{w.txRef || `WIT-${w.id.substring(0, 5).toUpperCase()}`}</td>
                          <td className="py-3 pr-2">
                            <span className="bg-red-50 text-red-600 border border-red-200/50 font-black uppercase tracking-wider px-2 py-0.5 rounded text-[8px]">
                              Payout Cashout
                            </span>
                          </td>
                          <td className="py-3 text-slate-550 font-semibold pr-2">{w.notes || `Disbursed to ${w.method}`}</td>
                          <td className="py-3 font-black text-red-600 pr-2">-{w.amount} BDT</td>
                          <td className="py-3 text-slate-400 font-bold pr-2">{new Date(w.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide border ${
                              w.status === 'PENDING' ? 'bg-amber-550/10 text-amber-600 border-amber-200/50' :
                              w.status === 'APPROVED' || w.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-200/50' :
                              'bg-red-50 text-red-650 border-red-200/50'
                            }`}>
                              {w.status}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {/* Commissions */}
                      {profile?.commissions?.map((c: any) => (
                        <tr key={c.id} className="text-slate-655 hover:bg-slate-50/80 transition">
                          <td className="py-3 font-semibold font-mono text-slate-400 pr-2">COM-{c.id.substring(0, 5).toUpperCase()}</td>
                          <td className="py-3 pr-2">
                            <span className="bg-emerald-50 text-emerald-650 border border-emerald-200/50 font-black uppercase tracking-wider px-2 py-0.5 rounded text-[8px]">
                              Commission Earned
                            </span>
                          </td>
                          <td className="py-3 text-slate-550 font-semibold pr-2">{c.notes || `10% commission on purchase ${c.orderId}`}</td>
                          <td className="py-3 font-black text-emerald-650 pr-2">+{c.amount} BDT</td>
                          <td className="py-3 text-slate-400 font-bold pr-2">{new Date(c.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 text-right">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wide border ${
                              c.status === 'PENDING' ? 'bg-amber-50 text-amber-600 border-amber-200/50' :
                              c.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-650 border-emerald-200/50' :
                              'bg-red-50 text-red-600 border-red-200/50'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))}

                      {(!profile?.withdrawals || profile?.withdrawals.length === 0) && 
                       (!profile?.commissions || profile?.commissions.length === 0) && (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-slate-400 font-bold text-xs uppercase tracking-wider">
                            No wallet settlements or payout transaction logs found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </main>
        )}
      </div>

      {/* Global Toast notices */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`px-5 py-3.5 rounded-2xl text-xs font-black shadow-2xl flex items-center gap-2.5 border bg-white ${
            toast.type === 'success' ? 'border-emerald-500 text-emerald-600' :
            toast.type === 'error' ? 'border-red-500 text-red-600' :
            'border-amber-500 text-amber-600'
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
