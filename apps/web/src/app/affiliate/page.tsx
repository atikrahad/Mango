'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { 
  Wallet, ArrowUpRight, Copy,
  Clock, Share2, Compass, AlertCircle, RefreshCw, Package, ExternalLink, CheckCircle2
} from 'lucide-react';
import { Toast, useToastStore, PortalHeader, PortalLockScreen, useAffiliate } from '@mangosteen/shared';

export default function AffiliatePage() {
  const { user, isAuthenticated } = useAuthStore();
  const {
    profile,
    loading,
    withdrawAmount, setWithdrawAmount,
    withdrawMethod, setWithdrawMethod,
    withdrawDetails, setWithdrawDetails,
    withdrawLoading,
    generatedLink,
    linkCopied,
    fetchAffiliateProfile,
    handleWithdrawSubmit,
    copyToClipboard,
  } = useAffiliate(api, typeof window !== 'undefined' ? window.location.origin : '');

  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState('');

  const fetchProducts = async () => {
    try {
      setProductsLoading(true);
      const res = await api.get('/catalog/products', { params: { limit: 100 } });
      if (res.data?.success) {
        setProducts(res.data.data.items || []);
      }
    } catch (err) {
      console.error('Error fetching catalog products:', err);
      useToastStore.getState().showToast('Could not load products. Please refresh.', 'error');
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === 'AFFILIATE') {
      fetchAffiliateProfile();
      fetchProducts();
    }
  }, [isAuthenticated, user]);

  const copyProductLink = (slug: string) => {
    const refCode = profile?.referralCode || '';
    const link = `${window.location.origin}/?ref=${refCode}&product=${slug}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedSlug(slug);
      useToastStore.getState().showToast('Product affiliate link copied to clipboard!', 'success');
      setTimeout(() => setCopiedSlug(null), 2500);
    });
  };

  const handleWithdrawFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleWithdrawSubmit();
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.originDistrict?.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category?.name?.toLowerCase().includes(productSearch.toLowerCase())
  );

  if (!isAuthenticated || user?.role !== 'AFFILIATE') {
    return (
      <PortalLockScreen
        title="Affiliate Portal Locked"
        description={
          <>
            Please sign up or authenticate as an <span className="font-bold text-amber-400">Affiliate Seller</span> to access deep-links, click tracking, and commission balance accounts.
          </>
        }
      />
    );
  }

  return (
    <div className="flex-grow flex flex-col min-h-screen">
      
      {/* Header bar */}
      <PortalHeader
        title="Mangosteen Affiliate Hub"
        subtitle="Performance Wallet"
        actionLabel="Store Catalog"
        actionIcon={<Compass className="w-4 h-4" />}
        actionHref="/"
      />

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
                Your Referral Code:{' '}
                {loading ? (
                  <span className="text-slate-600 font-mono">Loading...</span>
                ) : (
                  <span className="font-bold text-amber-400 bg-slate-900 px-2 py-0.5 rounded-md font-mono border border-slate-800">
                    {profile?.referralCode || '—'}
                  </span>
                )}
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => { fetchAffiliateProfile(); fetchProducts(); }}
            className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-semibold p-2.5 rounded-xl transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Stats cards — always show skeleton when loading */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="glass-panel p-6 rounded-2xl animate-pulse flex flex-col gap-3">
                <div className="h-3 bg-slate-800 rounded w-2/3" />
                <div className="h-8 bg-slate-800 rounded w-1/2" />
                <div className="h-2 bg-slate-800 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Referral Clicks</p>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-extrabold text-slate-100">{profile?.clicksCount ?? 0}</span>
                <Share2 className="w-5 h-5 text-sky-400" />
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Clicks tracked in last 30 days</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl flex flex-col gap-2">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Pending Commissions</p>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-extrabold text-amber-400">{profile?.pendingCommissions ?? 0} BDT</span>
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Held until delivery confirmed</p>
            </div>

            <div className="glass-panel p-6 rounded-2xl border-l-4 border-l-amber-500 flex flex-col gap-2">
              <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">Available Balance</p>
              <div className="flex items-baseline justify-between mt-2">
                <span className="text-3xl font-extrabold text-slate-100">{profile?.walletBalance ?? 0} BDT</span>
                <Wallet className="w-5 h-5 text-emerald-400" />
              </div>
              <p className="text-[10px] text-slate-500 mt-2">Approved and ready for payout</p>
            </div>

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
        )}

        {/* ===================== PRODUCT CATALOG SECTION ===================== */}
        <div className="glass-panel rounded-3xl overflow-hidden">
          {/* Section Header */}
          <div className="px-6 py-5 border-b border-slate-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" />
                Product Affiliate Link Generator
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Generate your unique affiliate link for each product. Share it — when someone buys, you earn the listed commission.
              </p>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition w-full sm:w-48"
              />
            </div>
          </div>

          {/* Product Grid */}
          <div className="p-6">
            {productsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-slate-900/60 rounded-2xl p-4 animate-pulse flex flex-col gap-3">
                    <div className="h-4 bg-slate-800 rounded w-3/4" />
                    <div className="h-3 bg-slate-800 rounded w-1/2" />
                    <div className="h-8 bg-slate-800 rounded w-full mt-2" />
                  </div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-4 text-slate-500">
                <Package className="w-12 h-12 text-slate-700" />
                <p className="text-sm font-semibold">
                  {productSearch ? `No products match "${productSearch}"` : 'No products available in catalog.'}
                </p>
                <button
                  onClick={fetchProducts}
                  className="flex items-center gap-2 text-xs font-semibold text-amber-400 border border-amber-500/30 hover:bg-amber-500/10 px-4 py-2 rounded-xl transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retry Loading Products
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProducts.map((p) => {
                  const affiliateLink = `${typeof window !== 'undefined' ? window.location.origin : 'https://mangosteen.com'}/?ref=${profile?.referralCode || ''}&product=${p.slug}`;
                  const isCopied = copiedSlug === p.slug;
                  const commPct = Number(p.commissionPercentage || 5.0);
                  
                  // Get min price from variants
                  const minPrice = p.variants?.length > 0
                    ? Math.min(...p.variants.map((v: any) => Number(v.price) - Number(v.discount || 0)))
                    : null;

                  return (
                    <div
                      key={p.id}
                      className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3 hover:border-amber-500/30 hover:bg-slate-900/80 transition-all duration-200"
                    >
                      {/* Product Info */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-0.5">
                          <p className="text-sm font-bold text-slate-100 leading-tight">🥭 {p.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium">
                            📍 {p.originDistrict} &nbsp;•&nbsp; {p.category?.name || 'Seasonal'}
                          </p>
                          {minPrice !== null && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              From <span className="font-bold text-slate-200">{minPrice} BDT</span>
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-lg text-[11px] font-black whitespace-nowrap">
                            {commPct}% earn
                          </span>
                          {minPrice !== null && (
                            <span className="text-[10px] text-amber-400/80 font-semibold">
                              ~{((minPrice * commPct) / 100).toFixed(0)} BDT/sale
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Affiliate link field */}
                      <div className="flex bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
                        <input
                          type="text"
                          readOnly
                          value={affiliateLink}
                          className="flex-grow bg-transparent text-[10px] px-3 py-2 focus:outline-none text-slate-500 font-mono cursor-text"
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                        />
                      </div>

                      {/* Copy button */}
                      <button
                        onClick={() => copyProductLink(p.slug)}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                          isCopied
                            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                            : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                        }`}
                      >
                        {isCopied ? (
                          <><CheckCircle2 className="w-3.5 h-3.5" /> Link Copied!</>
                        ) : (
                          <><Copy className="w-3.5 h-3.5" /> Copy My Affiliate Link</>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Total products count */}
            {!productsLoading && filteredProducts.length > 0 && (
              <p className="text-[10px] text-slate-600 text-center mt-4 font-semibold">
                {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} available &nbsp;•&nbsp; Click any link field to select all text &nbsp;•&nbsp; Commission credited after order delivery
              </p>
            )}
          </div>
        </div>

        {/* General referral link + Withdrawal form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* General Referral Link */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col gap-5">
            <div>
              <h3 className="font-extrabold text-lg text-slate-100 mb-1">Your General Referral Link</h3>
              <p className="text-xs text-slate-400">Share this link to earn commissions on any product a visitor purchases after clicking your link.</p>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex bg-slate-950 border border-slate-800 rounded-xl overflow-hidden p-1">
                <input 
                  type="text" 
                  readOnly
                  value={generatedLink}
                  className="flex-grow bg-transparent text-xs px-3 focus:outline-none text-slate-300 font-mono"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <button 
                  onClick={() => copyToClipboard(generatedLink)}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  {linkCopied ? 'Copied!' : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
            </div>

            <div className="bg-slate-950/40 p-4 border border-slate-800 rounded-2xl flex gap-3 text-xs text-slate-400 leading-relaxed">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-200 mb-1">How Attribution Works</p>
                <p>When a customer clicks your product or general link, the system records your referral code. If they place an order, the commission is credited to your wallet automatically — no manual entry needed.</p>
              </div>
            </div>
          </div>

          {/* Withdrawal Request Form */}
          <div className="glass-panel p-6 rounded-3xl flex flex-col gap-5">
            <div>
              <h3 className="font-extrabold text-lg text-slate-100 mb-1">Submit Payout Request</h3>
              <p className="text-xs text-slate-400">Withdraw approved wallet balance directly to your bKash, Nagad, or bank accounts.</p>
            </div>

            <form onSubmit={handleWithdrawFormSubmit} className="flex flex-col gap-4">
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
                  <label className="text-xs text-slate-400 font-semibold">Payout Gateway</label>
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
                  <><RefreshCw className="w-4 h-4 animate-spin inline mr-1" /> Booking withdrawal...</>
                ) : (
                  'Request Balance Withdrawal'
                )}
              </button>

              <p className="text-[10px] text-slate-600 text-center">
                Minimum withdrawal: 500 BDT &nbsp;•&nbsp; Current balance: <span className="text-slate-400 font-bold">{profile?.walletBalance ?? 0} BDT</span>
              </p>
            </form>
          </div>
        </div>

        {/* Commission & Payout Ledger */}
        <div className="glass-panel p-6 rounded-3xl flex flex-col gap-6">
          <div>
            <h3 className="font-extrabold text-lg text-slate-100 mb-1">Commission & Payout Ledger</h3>
            <p className="text-xs text-slate-400 font-medium">All your commission credits and withdrawal requests with status tracking.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold">
                  <th className="pb-3">Reference</th>
                  <th className="pb-3">Type</th>
                  <th className="pb-3">Details</th>
                  <th className="pb-3">Amount</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                {profile?.withdrawals?.map((w: any) => (
                  <tr key={w.id} className="text-slate-300">
                    <td className="py-3 font-semibold font-mono text-slate-400">{w.txRef || `WIT-${w.id.substring(0, 5)}`}</td>
                    <td className="py-3">
                      <span className="bg-red-500/10 text-red-400 font-bold uppercase tracking-wider px-2 py-0.5 rounded text-[9px]">Payout</span>
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

                {profile?.commissions?.map((c: any) => (
                  <tr key={c.id} className="text-slate-300">
                    <td className="py-3 font-semibold font-mono text-slate-400">COM-{c.id.substring(0, 5).toUpperCase()}</td>
                    <td className="py-3">
                      <span className="bg-emerald-500/10 text-emerald-400 font-bold uppercase tracking-wider px-2 py-0.5 rounded text-[9px]">Commission</span>
                    </td>
                    <td className="py-3 text-slate-400">{c.notes || `Commission on order ${c.orderId}`}</td>
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
                    <td colSpan={6} className="text-center py-10 text-slate-600 font-semibold">
                      No transactions yet. Start sharing your affiliate links to earn commissions!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <Toast />
    </div>
  );
}
