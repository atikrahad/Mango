'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { 
  ShieldCheck, ShoppingBag, Truck, Users, AlertTriangle, 
  RefreshCw, CheckCircle, XCircle, ChevronRight, Star, Info, Lock
} from 'lucide-react';

export default function AdminPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [orders, setOrders] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic delivery riders list
  const [deliveryRiders, setDeliveryRiders] = useState<any[]>([]);

  // Notification Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

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
      showToast('Could not fetch administrative system queues.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN')) {
      fetchAdminData();
    }
  }, [isAuthenticated, user]);

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
        notes: `Processed and cleared by admin: ${user?.fullName}`,
      });

      if (res.data?.success) {
        showToast(`Withdrawal payout request marked as ${status}!`, 'success');
        fetchAdminData();
      }
    } catch (e: any) {
      const msg = e.response?.data?.error?.message || 'Failed to settle payout.';
      showToast(msg, 'error');
    }
  };

  if (!isAuthenticated || (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN')) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto min-h-[60vh] gap-6">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 text-slate-500 flex items-center justify-center text-3xl shadow-lg">
          <Lock className="w-8 h-8 text-amber-500" />
        </div>
        <div>
          <h2 className="font-extrabold text-2xl text-slate-100 mb-2">Access Denied: Admin Console</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Please login as an <span className="font-bold text-amber-400">Admin or Super Admin</span> to manage stock variants, assign rider runs, and approve affiliate commissions.
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
      
      {/* Header */}
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a href="/" className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center font-bold text-slate-950 text-xl shadow-lg">
            🥭
          </a>
          <div>
            <h1 className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Mangosteen Admin Console
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">
              Operational Monolith
            </p>
          </div>
        </div>

        <button 
          onClick={fetchAdminData}
          className="bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 text-xs font-bold px-4 py-2 rounded-xl transition flex items-center gap-1.5"
        >
          <RefreshCw className="w-4 h-4" /> Sync Data
        </button>
      </header>

      <div className="px-6 py-10 max-w-7xl mx-auto w-full flex flex-col gap-8">
        
        {/* System Indicators Panel */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Active Purchases</p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold text-slate-100">{orders.length}</span>
              <ShoppingBag className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Placed this season</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Riders En Route</p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold text-slate-100">
                {orders.filter((o) => o.status === 'SHIPPED').length}
              </span>
              <Truck className="w-5 h-5 text-sky-400" />
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Orders actively out for delivery</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2">
            <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider font-bold text-amber-400">Withdrawals Queue</p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold text-slate-100">
                {withdrawals.filter((w) => w.status === 'PENDING').length}
              </span>
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Affiliate payout requests pending review</p>
          </div>

          <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-red-500 flex flex-col gap-2 bg-red-950/15">
            <p className="text-xs text-red-400 font-bold uppercase tracking-wider">Inventory Alerts</p>
            <div className="flex items-baseline justify-between mt-2">
              <span className="text-3xl font-extrabold text-slate-100">0</span>
              <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse" />
            </div>
            <p className="text-[10px] text-slate-500 mt-2">Low-stock warnings below threshold</p>
          </div>
        </div>

        {/* 🚀 Active Orders & Agent Assignments Queue */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col gap-6">
          <div>
            <h3 className="font-extrabold text-lg text-slate-100 mb-1">Seasonal Orders Checkout Ledger</h3>
            <p className="text-xs text-slate-400">Review consumer checkouts, assign delivery riders to district regions, and update en route status.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold">
                  <th className="pb-3">Order Reference</th>
                  <th className="pb-3">Buyer details</th>
                  <th className="pb-3">District</th>
                  <th className="pb-3">Total Cost</th>
                  <th className="pb-3">Gateway</th>
                  <th className="pb-3">COD OTP status</th>
                  <th className="pb-3">Assigned Rider</th>
                  <th className="pb-3 text-right">Actions Workflow</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {orders.map((order) => (
                  <tr key={order.id} className="text-slate-300">
                    <td className="py-4 font-mono font-bold text-slate-400">{order.id.substring(0, 8).toUpperCase()}</td>
                    <td className="py-4">
                      <p className="font-semibold text-slate-200">{order.user?.fullName}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{order.user?.email}</p>
                    </td>
                    <td className="py-4">📍 {order.district}</td>
                    <td className="py-4 font-bold text-amber-400">{order.totalAmount} BDT</td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        order.payment?.gateway === 'COD' ? 'bg-amber-500/10 text-amber-400' : 'bg-sky-500/10 text-sky-400'
                      }`}>
                        {order.payment?.gateway}
                      </span>
                    </td>
                    <td className="py-4">
                      {order.payment?.gateway === 'COD' ? (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          order.codVerified ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {order.codVerified ? 'Verified' : 'Pending OTP'}
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                    <td className="py-4">
                      <select
                        value={order.deliveryAgentId || ''}
                        onChange={(e) => updateOrderStatus(order.id, 'SHIPPED', e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-slate-300 text-xs focus:outline-none focus:border-amber-500"
                      >
                        <option value="">Choose Agent</option>
                        {deliveryRiders.map((r) => (
                          <option key={r.id} value={r.id}>{r.fullName || r.name} ({r.email})</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-4 text-right flex justify-end gap-1.5">
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'SHIPPED')}
                        className="bg-slate-900 border border-slate-800 hover:bg-sky-950/20 hover:border-sky-900 text-sky-400 px-2.5 py-1 rounded-lg font-bold text-[10px] transition"
                      >
                        En Route
                      </button>
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                        className="bg-slate-900 border border-slate-800 hover:bg-emerald-950/20 hover:border-emerald-900 text-emerald-400 px-2.5 py-1 rounded-lg font-bold text-[10px] transition"
                      >
                        Deliver
                      </button>
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                        className="bg-slate-900 border border-slate-800 hover:bg-red-950/20 hover:border-red-900 text-red-400 px-2.5 py-1 rounded-lg font-bold text-[10px] transition"
                      >
                        Drop
                      </button>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-8 text-slate-500 font-semibold">
                      No seasonal checkouts registered in system yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 🚀 Affiliate Withdrawal Payout Review Queue */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col gap-6">
          <div>
            <h3 className="font-extrabold text-lg text-slate-100 mb-1">Affiliate Payout Review Queue</h3>
            <p className="text-xs text-slate-400">Verify requested bank and MFS accounts, review click attributions, and disburse wallet balances.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold">
                  <th className="pb-3">Request ID</th>
                  <th className="pb-3">Affiliate details</th>
                  <th className="pb-3">Wallet balance</th>
                  <th className="pb-3">Payout amount</th>
                  <th className="pb-3">Gateway Method</th>
                  <th className="pb-3">Account Reference</th>
                  <th className="pb-3 text-right">Settlement Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {withdrawals.map((req) => (
                  <tr key={req.id} className="text-slate-300">
                    <td className="py-4 font-mono font-semibold text-slate-400">{req.txRef}</td>
                    <td className="py-4">
                      <p className="font-semibold text-slate-200">{req.affiliate?.user?.fullName}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Code: {req.affiliate?.referralCode}</p>
                    </td>
                    <td className="py-4 font-medium text-slate-400">{req.affiliate?.walletBalance} BDT</td>
                    <td className="py-4 font-extrabold text-amber-400">{req.amount} BDT</td>
                    <td className="py-4">
                      <span className="bg-purple-500/10 text-purple-400 font-bold uppercase tracking-wider px-2 py-0.5 rounded text-[9px]">
                        {req.method}
                      </span>
                    </td>
                    <td className="py-4 text-slate-400">{req.notes}</td>
                    <td className="py-4 text-right flex justify-end gap-1.5">
                      {req.status === 'PENDING' ? (
                        <>
                          <button 
                            onClick={() => processWithdrawal(req.id, 'APPROVED')}
                            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-3 py-1 rounded-xl transition flex items-center gap-1"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button 
                            onClick={() => processWithdrawal(req.id, 'REJECTED')}
                            className="bg-red-500 hover:bg-red-600 text-slate-950 font-bold px-3 py-1 rounded-xl transition flex items-center gap-1"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Decline
                          </button>
                        </>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          req.status === 'APPROVED' || req.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {req.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {withdrawals.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-500 font-semibold">
                      No affiliate withdrawals payout requests in queue.
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
