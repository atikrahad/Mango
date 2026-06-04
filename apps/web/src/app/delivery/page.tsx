'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { 
  MapPin, Phone, ShoppingBag, Truck, Lock, 
  CheckCircle2, Compass, RefreshCw, Smartphone, KeyRound
} from 'lucide-react';
import { Toast, useToastStore, PortalHeader, PortalLockScreen } from '@mangosteen/shared';

export default function DeliveryPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // OTP Verification state
  const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
  const [otpValue, setOtpValue] = useState('');
  const [dispatchedOtp, setDispatchedOtp] = useState<string | null>(null); // Displays dispatched code to simplify local demo
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Notification Toast State
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    useToastStore.getState().showToast(message, type);
  };

  const fetchAssignedRuns = async () => {
    try {
      setLoading(true);
      const res = await api.get('/logistics/runs');
      if (res.data?.success) {
        setRuns(res.data.data);
      }
    } catch (e: any) {
      console.error('Error fetching assigned runs:', e);
      showToast('Could not fetch en route delivery tasks.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'DELIVERY_AGENT') {
      fetchAssignedRuns();
    }
  }, [isAuthenticated, user]);

  const triggerArrival = async (orderId: string) => {
    try {
      const res = await api.post(`/logistics/orders/${orderId}/arrive`);
      if (res.data?.success) {
        showToast(res.data.message || 'OTP dispatch success!', 'success');
        
        // Save the OTP in state to show in the UI (simulating the SMS received by the customer!)
        if (res.data.data?.otp) {
          setDispatchedOtp(res.data.data.otp);
        }
        
        setActiveOrderId(orderId);
        setOtpError('');
        setOtpValue('');
      }
    } catch (e: any) {
      const msg = e.response?.data?.error?.message || 'Could not register arrival.';
      showToast(msg, 'error');
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    if (!activeOrderId || !otpValue) return;

    try {
      setOtpLoading(true);
      const res = await api.post(`/logistics/orders/${activeOrderId}/verify-otp`, {
        otp: otpValue,
      });

      if (res.data?.success) {
        showToast('OTP verified successfully! Order settled.', 'success');
        setActiveOrderId(null);
        setDispatchedOtp(null);
        setOtpValue('');
        fetchAssignedRuns(); // Refresh runs
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Delivery verification code mismatches.';
      setOtpError(msg);
      showToast(msg, 'error');
    } finally {
      setOtpLoading(false);
    }
  };

  if (!isAuthenticated || user?.role !== 'DELIVERY_AGENT') {
    return (
      <PortalLockScreen
        title="Delivery Portal Locked"
        description={
          <>
            Please sign in as a <span className="font-bold text-amber-400">Delivery Agent</span> rider to manage en route runs tasks and verify cash collection OTP codes.
          </>
        }
      />
    );
  }

  return (
    <div className="flex-grow flex flex-col min-h-screen">
      
      {/* Header */}
      <PortalHeader
        title="Rider Logistics Portal"
        subtitle="Assigned Runs Tasks"
        actionLabel="Sync Runs"
        actionIcon={<RefreshCw className="w-4 h-4" />}
        onActionClick={fetchAssignedRuns}
      />

      <div className="px-4 py-8 max-w-lg mx-auto w-full flex flex-col gap-6">
        
        {/* Profile Card */}
        <div className="glass-panel p-5 rounded-2xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-slate-950 text-xl shadow-lg">
            🛵
          </div>
          <div>
            <h2 className="font-bold text-slate-200">{user?.fullName}</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Active Duty Agent • {user?.email}</p>
          </div>
        </div>

        <div>
          <h3 className="font-extrabold text-lg text-slate-200 mb-2 flex items-center gap-2">
            <Truck className="w-5 h-5 text-amber-500" /> Your Assigned Tasks ({runs.length})
          </h3>
          <p className="text-xs text-slate-400">Arrive at customer destinations, collect COD cash payments, and confirm deliveries using secure OTP codes.</p>
        </div>

        {/* 🚀 Active runs list */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500 gap-2.5">
            <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
            <span className="text-xs font-bold">Syncing route maps...</span>
          </div>
        ) : runs.length === 0 ? (
          <div className="glass-panel text-center py-12 rounded-2xl flex flex-col items-center gap-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            <p className="text-slate-400 text-sm font-semibold">All en route runs completed for today!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {runs.map((run) => (
              <div 
                key={run.id}
                className={`glass-panel p-5 rounded-2xl border-l-4 flex flex-col gap-4 transition ${
                  run.status === 'DELIVERED' ? 'border-l-emerald-500 bg-emerald-950/5' : 'border-l-amber-500'
                }`}
              >
                {/* Reference */}
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-slate-400 uppercase">
                    Order Ref: #{run.id.substring(0, 8).toUpperCase()}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wider ${
                    run.status === 'DELIVERED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {run.status}
                  </span>
                </div>

                {/* Details */}
                <div className="flex flex-col gap-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <span>Customer: <span className="font-bold text-slate-200">{run.user?.fullName}</span> ({run.user?.phone || '+8801700000000'})</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                    <span>Destination Address: <span className="font-medium text-slate-400">{run.shippingAddress}</span> (Region: {run.district})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    <span>COD Cash Collection: <span className="font-extrabold text-amber-400">{run.totalAmount} BDT</span></span>
                  </div>
                </div>

                {/* Actions */}
                {run.status !== 'DELIVERED' && (
                  <div className="pt-2 border-t border-slate-850 flex gap-3">
                    <button
                      onClick={() => triggerArrival(run.id)}
                      className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-2.5 rounded-xl text-xs transition shadow-md shadow-orange-500/5"
                    >
                      Arrive & Dispatch OTP
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 🚀 Verify OTP Dialog Modal */}
      {activeOrderId && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col gap-5 shadow-2xl relative">
            <button 
              onClick={() => { setActiveOrderId(null); setDispatchedOtp(null); }}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-200"
            >
              ✕
            </button>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-3 shadow-md">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-100">Verify COD OTP Code</h3>
              <p className="text-xs text-slate-400 mt-1">Enter the 6-digit confirmation OTP code sent to the customer's phone to verify cash collection and complete order delivery.</p>
            </div>

            {/* Simulating SMS Received displaying the dispatched OTP */}
            {dispatchedOtp && (
              <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-xl text-center flex flex-col items-center gap-1.5 shadow-inner">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Simulated Customer SMS:</span>
                <span className="font-mono font-extrabold text-2xl tracking-widest text-amber-400">{dispatchedOtp}</span>
              </div>
            )}

            {otpError && (
              <div className="bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl text-xs text-red-400 font-semibold text-center">
                ⚠ {otpError}
              </div>
            )}

            <form onSubmit={verifyOtp} className="flex flex-col gap-3">
              <input 
                type="text" 
                maxLength={6}
                required
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value)}
                placeholder="Enter 6-digit OTP"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 text-center text-lg font-bold font-mono tracking-widest focus:outline-none focus:border-amber-500 text-slate-200"
              />

              <button
                type="submit"
                disabled={otpLoading}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-bold py-3 rounded-xl text-xs transition shadow-lg shadow-orange-500/10"
              >
                {otpLoading ? 'Verifying OTP code...' : 'Confirm Cash & Settle Delivery'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 🚀 Active toast message */}
      <Toast />
    </div>
  );
}
