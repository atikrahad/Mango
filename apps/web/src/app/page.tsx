'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useCartStore, CartItem } from '../store/cartStore';
import { 
  ShoppingBag, Trash2, Filter, Search, ShieldCheck, 
  MapPin, Star, Sparkles, RefreshCw, LogIn, LogOut, 
  TrendingUp, Award, AwardIcon, Compass, CheckCircle2, Info
} from 'lucide-react';

export default function CatalogPage() {
  const { user, accessToken, isAuthenticated, setSession, logout } = useAuthStore();
  const { items, referralCode, setReferralCode, addToCart, removeFromCart, updateQuantity, clearCart, getSubtotal } = useCartStore();

  // Catalog State
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSweetness, setSelectedSweetness] = useState<number | ''>('');
  const [selectedOrganic, setSelectedOrganic] = useState<boolean | ''>('');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('');

  // Cart / Checkout State
  const [cartOpen, setCartOpen] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('123 Dhaka Express Rd, Gulshan, Dhaka');
  const [shippingDistrict, setShippingDistrict] = useState('Dhaka');
  const [deliverySlot, setDeliverySlot] = useState('MORNING');
  const [paymentGateway, setPaymentGateway] = useState('COD');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);

  // Auth Forms State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authRole, setAuthRole] = useState<'CUSTOMER' | 'AFFILIATE'>('CUSTOMER');
  const [authError, setAuthError] = useState('');

  // Notification Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch initial catalog data
  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const [prodRes, catRes] = await Promise.all([
        api.get('/catalog/products', {
          params: {
            search: search || undefined,
            district: selectedDistrict || undefined,
            sweetness: selectedSweetness || undefined,
            organic: selectedOrganic !== '' ? selectedOrganic : undefined,
            categorySlug: selectedCategorySlug || undefined,
          },
        }),
        api.get('/catalog/categories'),
      ]);

      if (prodRes.data?.success) {
        setProducts(prodRes.data.data.items);
      }
      if (catRes.data?.success) {
        setCategories(catRes.data.data);
      }
    } catch (e: any) {
      console.error('Error fetching catalog:', e);
      showToast('Could not fetch catalog lists.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [search, selectedDistrict, selectedSweetness, selectedOrganic, selectedCategorySlug]);

  // Handle Affiliate Referral Link Cookie Attribution & Click Tracker
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref');
      if (ref) {
        setReferralCode(ref);
        showToast(`Attributed referral link code: ${ref}`, 'info');
        
        // Post Click logs to backend for anti-fraud tracking
        api.post('/affiliates/clicks', { referralCode: ref, referrerUrl: window.location.href })
          .then((res) => {
            if (res.data?.success) {
              if (res.data.data?.tracked) {
                showToast(`Referral click verified and registered securely.`, 'success');
              } else {
                showToast(`Verification velocity lockout active for duplicate click.`, 'info');
              }
            }
          })
          .catch((err) => {
            console.error('Attribution error:', err);
          });
      }
    }
  }, []);

  // Quick Account Role Swapper
  const swapRole = async (role: 'CUSTOMER' | 'AFFILIATE' | 'ADMIN' | 'DELIVERY_AGENT') => {
    try {
      let email = 'customer@mangosteen.com';
      let password = 'password123';
      let fullName = 'Customer Karim';

      if (role === 'AFFILIATE') {
        email = 'affiliate1@mangosteen.com';
        fullName = 'Affiliate Anis';
      } else if (role === 'ADMIN') {
        email = 'superadmin@mangosteen.com';
        fullName = 'Admin Kabir';
      } else if (role === 'DELIVERY_AGENT') {
        email = 'rider1@mangosteen.com';
        fullName = 'Rider Rahim';
      }

      // Check if user exists by registering first (safely ignores conflict)
      try {
        await api.post('/auth/register', {
          email,
          password,
          fullName,
          phone: role === 'DELIVERY_AGENT' ? '+8801700000001' : `+8801555${Math.floor(100000 + Math.random() * 900000)}`,
          role: role === 'ADMIN' ? 'CUSTOMER' : role, // admins generated via seed, others registers on demand
        });
      } catch (regErr) {}

      // Login
      const res = await api.post('/auth/login', { email, password });
      if (res.data?.success) {
        const { accessToken, user: loggedUser } = res.data.data;
        setSession(accessToken, loggedUser);
        showToast(`Instantly swapped session as role: ${role}`, 'success');
      }
    } catch (e: any) {
      console.error('Role swap error:', e);
      showToast('Role swap failed. Seed the database first.', 'error');
    }
  };

  // Auth Operations
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    try {
      if (authMode === 'register') {
        const res = await api.post('/auth/register', {
          email: authEmail,
          password: authPassword,
          fullName: authFullName,
          phone: authPhone || undefined,
          role: authRole,
        });

        if (res.data?.success) {
          showToast(res.data.message || 'Registration successful!', 'success');
          setAuthMode('login');
        }
      } else {
        const res = await api.post('/auth/login', {
          email: authEmail,
          password: authPassword,
        });

        if (res.data?.success) {
          const { accessToken, user: loggedUser } = res.data.data;
          setSession(accessToken, loggedUser);
          showToast(`Logged in successfully! Welcome ${loggedUser.fullName}.`, 'success');
          setAuthModalOpen(false);
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Authentication failed.';
      setAuthError(msg);
      showToast(msg, 'error');
    }
  };

  // Coupon Operations
  const checkCoupon = () => {
    if (!couponCode) return;
    
    // Simulating coupon validate
    if (couponCode.toUpperCase() === 'MANGO10') {
      const discount = getSubtotal() * 0.1;
      setDiscountAmount(discount);
      setAppliedCoupon('MANGO10 (10% OFF)');
      showToast('Coupon MANGO10 applied successfully!', 'success');
    } else if (couponCode.toUpperCase() === 'FREE500' && getSubtotal() >= 2000) {
      setDiscountAmount(500);
      setAppliedCoupon('FREE500 (500 BDT OFF)');
      showToast('Coupon FREE500 applied successfully!', 'success');
    } else {
      showToast('Coupon code is invalid or cart minimum limit not met.', 'error');
    }
  };

  // Order Checkout Submit
  const handleCheckoutSubmit = async () => {
    if (!isAuthenticated) {
      showToast('Please sign in to place an order.', 'error');
      setAuthModalOpen(true);
      return;
    }

    if (user?.role !== 'CUSTOMER') {
      showToast('Only Customer accounts can buy product packages.', 'error');
      return;
    }

    try {
      setCheckoutLoading(true);
      const payload = {
        items: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        shippingAddress,
        district: shippingDistrict,
        deliverySlot,
        paymentGateway,
        couponCode: appliedCoupon ? couponCode : undefined,
        referralCode: referralCode || undefined,
      };

      const res = await api.post('/orders/checkout', payload);
      if (res.data?.success) {
        setOrderSuccess(res.data.data);
        clearCart();
        setAppliedCoupon(null);
        setDiscountAmount(0);
        showToast('Mango order created successfully!', 'success');
      }
    } catch (e: any) {
      const msg = e.response?.data?.error?.message || 'Could not process order checkout.';
      showToast(msg, 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="flex-grow flex flex-col min-h-screen">
      
      {/* 🚀 Header & Navigation Bar */}
      <header className="sticky top-0 z-40 glass-panel border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center font-bold text-slate-950 text-xl shadow-lg shadow-orange-500/20">
            🥭
          </div>
          <div>
            <h1 className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Mangosteen
            </h1>
            <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">
              Orchard Premium
            </p>
          </div>
        </div>

        {/* Navigation Portals */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <a href="#" className="text-amber-500 hover:text-amber-400 flex items-center gap-1.5 transition">
            <Compass className="w-4 h-4" /> Shop Catalog
          </a>
          {isAuthenticated && user?.role === 'AFFILIATE' && (
            <a href="/affiliate" className="text-slate-300 hover:text-amber-500 flex items-center gap-1.5 transition">
              <TrendingUp className="w-4 h-4" /> Affiliate Portal
            </a>
          )}
          {isAuthenticated && user?.role === 'DELIVERY_AGENT' && (
            <a href="/delivery" className="text-slate-300 hover:text-amber-500 flex items-center gap-1.5 transition">
              <MapPin className="w-4 h-4" /> Delivery Panel
            </a>
          )}
          {isAuthenticated && (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') && (
            <a href="/admin" className="text-slate-300 hover:text-amber-500 flex items-center gap-1.5 transition">
              <ShieldCheck className="w-4 h-4" /> Admin Console
            </a>
          )}
        </nav>

        {/* User Session Actions */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-200">{user?.fullName}</p>
                <p className="text-[11px] text-slate-400 font-bold bg-slate-800/80 px-2 py-0.5 rounded-full inline-block mt-0.5">
                  {user?.role}
                </p>
              </div>
              <button 
                onClick={() => { logout(); showToast('Logged out successfully.', 'info'); }}
                className="bg-slate-900 border border-slate-800 hover:bg-red-950/30 hover:border-red-900/50 text-slate-300 hover:text-red-400 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <LogOut className="w-3.5 h-3.5" /> Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={() => { setAuthMode('login'); setAuthModalOpen(true); }}
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 transition"
            >
              <LogIn className="w-4 h-4" /> Sign In
            </button>
          )}

          {/* Cart Icon Toggle */}
          <button 
            onClick={() => setCartOpen(!cartOpen)}
            className="relative bg-slate-900 border border-slate-800 p-2.5 rounded-xl hover:bg-slate-800 text-slate-200 transition"
          >
            <ShoppingBag className="w-5 h-5" />
            {items.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 font-bold text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-bounce">
                {items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 🚀 Dynamic Role Selection Bar (Eases development, reviewer testing) */}
      <div className="bg-slate-900/80 border-b border-slate-800 px-6 py-2 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Quick Developer Role Switcher (Reviews & Demo Testing Mode):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => swapRole('CUSTOMER')} className="bg-slate-950 border border-slate-800 hover:border-amber-500 text-[11px] px-2.5 py-1 rounded-lg text-slate-300 font-medium transition">
            👤 Switch Customer
          </button>
          <button onClick={() => swapRole('AFFILIATE')} className="bg-slate-950 border border-slate-800 hover:border-amber-500 text-[11px] px-2.5 py-1 rounded-lg text-slate-300 font-medium transition">
            🤝 Switch Affiliate
          </button>
          <button onClick={() => swapRole('DELIVERY_AGENT')} className="bg-slate-950 border border-slate-800 hover:border-amber-500 text-[11px] px-2.5 py-1 rounded-lg text-slate-300 font-medium transition">
            🛵 Switch Rider Agent
          </button>
          <button onClick={() => swapRole('ADMIN')} className="bg-slate-950 border border-slate-800 hover:border-amber-500 text-[11px] px-2.5 py-1 rounded-lg text-slate-300 font-medium transition">
            👑 Switch Admin
          </button>
        </div>
      </div>

      {/* 🚀 Hero Section */}
      <section className="px-6 py-12 lg:py-16 text-center max-w-4xl mx-auto flex flex-col items-center">
        <div className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3.5 py-1 rounded-full text-xs font-semibold mb-6">
          <Award className="w-4 h-4" /> 100% Naturally Ripened, Chemical-Free Guarantee
        </div>
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-none mb-6">
          Premium Hand-Picked <br />
          <span className="bg-gradient-to-r from-amber-400 via-orange-500 to-yellow-300 bg-clip-text text-transparent">
            Rajshahi Orchard Mangoes
          </span>
        </h2>
        <p className="text-slate-400 text-base sm:text-lg max-w-2xl leading-relaxed mb-8">
          Directly linking seasonal grower cooperatives in Chapainawabganj and Rajshahi to your doorstep. Fully verified with anti-fraud affiliate attribution and secure cash verification codes.
        </p>
        
        {/* Affiliate link display if active */}
        {referralCode && (
          <div className="glass-panel border-amber-500/30 text-amber-300 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-semibold max-w-md animate-pulse">
            <CheckCircle2 className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <span>Successfully referred by affiliate! Special 10% commission active.</span>
          </div>
        )}
      </section>

      {/* 🚀 Main Catalog Grid */}
      <div className="px-6 pb-20 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Side: Filter Column */}
        <aside className="lg:col-span-1 flex flex-col gap-6">
          <div className="glass-panel p-6 rounded-2xl flex flex-col gap-6 sticky top-28">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                <Filter className="w-4 h-4 text-amber-500" /> Filters Selection
              </h3>
              <button 
                onClick={() => {
                  setSearch('');
                  setSelectedDistrict('');
                  setSelectedSweetness('');
                  setSelectedOrganic('');
                  setSelectedCategorySlug('');
                }}
                className="text-xs text-slate-400 hover:text-amber-500 font-medium transition"
              >
                Reset All
              </button>
            </div>

            {/* Search */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Search</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Himsagar, Langra..." 
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 pl-9 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            {/* Category selection */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Category</label>
              <div className="flex flex-col gap-1.5">
                <button 
                  onClick={() => setSelectedCategorySlug('')}
                  className={`text-left text-sm px-3 py-1.5 rounded-lg font-medium transition ${!selectedCategorySlug ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800/50'}`}
                >
                  All Collections
                </button>
                {categories.map((cat) => (
                  <button 
                    key={cat.id}
                    onClick={() => setSelectedCategorySlug(cat.slug)}
                    className={`text-left text-sm px-3 py-1.5 rounded-lg font-medium transition ${selectedCategorySlug === cat.slug ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800/50'}`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Origin District */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Origin District</label>
              <select 
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition"
              >
                <option value="">All Regions</option>
                <option value="Rajshahi">Rajshahi</option>
                <option value="Chapainawabganj">Chapainawabganj</option>
                <option value="Sathkhira">Sathkhira</option>
              </select>
            </div>

            {/* Sweetness star */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Sweetness Scale</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((stars) => (
                  <button 
                    key={stars}
                    onClick={() => setSelectedSweetness(selectedSweetness === stars ? '' : stars)}
                    className={`flex-1 aspect-square rounded-lg border flex items-center justify-center text-sm transition ${selectedSweetness === stars ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400'}`}
                  >
                    {stars}★
                  </button>
                ))}
              </div>
            </div>

            {/* Certified organic checkbox */}
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="organic-check"
                checked={selectedOrganic === true}
                onChange={(e) => setSelectedOrganic(e.target.checked ? true : '')}
                className="w-4 h-4 rounded border-slate-800 text-amber-500 focus:ring-amber-500 accent-amber-500 bg-slate-900 cursor-pointer"
              />
              <label htmlFor="organic-check" className="text-sm text-slate-300 font-medium cursor-pointer">
                🌿 Certified Organic Only
              </label>
            </div>
          </div>
        </aside>

        {/* Right Side: Products Catalog Listings */}
        <main className="lg:col-span-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
              <p className="font-semibold text-sm">Harvesting orchard stock catalog...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="glass-panel text-center py-20 rounded-2xl">
              <p className="text-slate-400 text-lg font-medium">No premium mangoes match your selection filters.</p>
              <button 
                onClick={() => {
                  setSearch('');
                  setSelectedDistrict('');
                  setSelectedSweetness('');
                  setSelectedOrganic('');
                  setSelectedCategorySlug('');
                }}
                className="mt-4 bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-sm transition hover:bg-amber-400"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product) => (
                <div 
                  key={product.id}
                  className="glass-panel rounded-2xl overflow-hidden flex flex-col h-full glass-panel-hover"
                >
                  {/* Image container */}
                  <div className="aspect-[4/3] bg-slate-900 relative overflow-hidden">
                    <img 
                      src={product.imageUrl?.[0] || 'https://images.unsplash.com/photo-1553279768-865429fa0078'} 
                      alt={product.name}
                      className="w-full h-full object-cover transform hover:scale-105 transition duration-500"
                    />
                    {product.isOrganic && (
                      <span className="absolute top-3 left-3 bg-emerald-500 text-slate-950 font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md">
                        🌿 Organic
                      </span>
                    )}
                    <span className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md text-[11px] text-slate-300 font-semibold px-2 py-0.5 rounded-md flex items-center gap-1">
                      📍 {product.originDistrict}
                    </span>
                  </div>

                  {/* Body content */}
                  <div className="p-5 flex-grow flex flex-col gap-4">
                    <div className="flex-grow">
                      <h4 className="font-bold text-lg text-slate-100 group-hover:text-amber-400 transition leading-tight mb-2">
                        {product.name}
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                        {product.description}
                      </p>
                    </div>

                    {/* Sweetness stars */}
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-slate-400 font-medium">Sweetness:</span>
                      <div className="flex text-amber-400">
                        {Array.from({ length: product.sweetness }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </div>

                    {/* Variants list selector */}
                    <div className="border-t border-slate-900 pt-4 flex flex-col gap-2">
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Weight Selections:</p>
                      {product.variants?.map((v: any) => {
                        const price = Number(v.price);
                        const discount = Number(v.discount);
                        const finalPrice = price - discount;
                        const stock = v.inventory?.availableStock || 0;

                        return (
                          <div 
                            key={v.id}
                            className="bg-slate-900/50 border border-slate-800 hover:border-slate-700 p-2.5 rounded-xl flex items-center justify-between text-sm transition"
                          >
                            <div>
                              <p className="font-semibold text-slate-200">{v.weightKg} kg Box</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-bold text-amber-400">{finalPrice} BDT</span>
                                {discount > 0 && (
                                  <span className="text-xs text-slate-500 line-through">{price} BDT</span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                                Stock: {stock > 0 ? `${stock} available` : 'Sold Out'}
                              </p>
                            </div>
                            <button
                              disabled={stock <= 0}
                              onClick={() => {
                                addToCart({
                                  variantId: v.id,
                                  productId: product.id,
                                  name: `${product.name} (${v.weightKg}kg)`,
                                  sku: v.sku,
                                  price: finalPrice,
                                  weightKg: Number(v.weightKg),
                                  boxCount: v.boxCount,
                                });
                                showToast(`Added ${product.name} (${v.weightKg}kg) to cart!`, 'success');
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm ${stock > 0 ? 'bg-amber-500 hover:bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
                            >
                              Add to Basket
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* 🚀 Persistent Slide-Out Shopping Basket Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full p-6 flex flex-col gap-6 shadow-2xl overflow-y-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="font-extrabold text-xl text-slate-100 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-500" /> Your Shopping Basket
              </h3>
              <button 
                onClick={() => setCartOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold bg-slate-800 p-1.5 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Order Success Box */}
            {orderSuccess ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center gap-6 py-12">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-3xl shadow-lg">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-lg text-slate-100 mb-2">Order Confirmed!</h4>
                  <p className="text-xs text-slate-400 leading-relaxed max-w-xs">
                    Your premium mango package is reserved! Order ID is <span className="font-semibold text-slate-200 font-mono block bg-slate-800 py-1.5 px-3 rounded-lg border border-slate-700/50 mt-1.5">{orderSuccess.id}</span>
                  </p>
                </div>
                
                {paymentGateway === 'COD' && (
                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl text-xs text-amber-400 leading-relaxed flex gap-2">
                    <Info className="w-5 h-5 flex-shrink-0" />
                    <span>Cash on Delivery active. When the delivery rider arrives, you will receive a secure 6-digit OTP code to verify and complete payment.</span>
                  </div>
                )}

                <button 
                  onClick={() => { setOrderSuccess(null); setCartOpen(false); }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-sm transition"
                >
                  Continue Shopping
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center py-20 text-slate-400 gap-4">
                <ShoppingBag className="w-12 h-12 text-slate-600" />
                <p className="font-medium text-slate-400">Your basket is empty. Browse seasonal collections!</p>
              </div>
            ) : (
              <div className="flex-grow flex flex-col gap-6">
                
                {/* Items List */}
                <div className="flex flex-col gap-4 overflow-y-auto max-h-[35vh] pr-1">
                  {items.map((item) => (
                    <div 
                      key={item.variantId}
                      className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex gap-3 items-center justify-between"
                    >
                      <div className="flex-grow">
                        <p className="font-bold text-sm text-slate-200 leading-tight">{item.name}</p>
                        <p className="text-xs text-slate-400 mt-1">{item.price} BDT x {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="bg-slate-900 border border-slate-800 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm text-slate-400 hover:border-slate-700 transition"
                        >
                          -
                        </button>
                        <span className="font-bold text-xs w-5 text-center text-slate-200">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="bg-slate-900 border border-slate-800 w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm text-slate-400 hover:border-slate-700 transition"
                        >
                          +
                        </button>
                        <button 
                          onClick={() => removeFromCart(item.variantId)}
                          className="bg-slate-900/50 border border-slate-800/80 p-2 rounded-lg text-slate-500 hover:text-red-400 hover:border-red-950 hover:bg-red-950/20 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shipping & Payment configs */}
                <div className="border-t border-slate-800 pt-4 flex flex-col gap-4">
                  <h4 className="font-bold text-xs text-slate-400 uppercase tracking-widest">Shipping & Checkout Details</h4>
                  
                  {/* Address */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] text-slate-400 font-semibold">Street Shipping Address</label>
                    <input 
                      type="text" 
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 text-slate-200"
                    />
                  </div>

                  {/* Delivery slot and payment options */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-slate-400 font-semibold">District</label>
                      <select 
                        value={shippingDistrict}
                        onChange={(e) => setShippingDistrict(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500 text-slate-200"
                      >
                        <option value="Dhaka">Dhaka (Express)</option>
                        <option value="Rajshahi">Rajshahi (Direct)</option>
                        <option value="Chittagong">Chittagong (Coast)</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-slate-400 font-semibold">Slot</label>
                      <select 
                        value={deliverySlot}
                        onChange={(e) => setDeliverySlot(e.target.value)}
                        className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500 text-slate-200"
                      >
                        <option value="MORNING">Morning (8-12)</option>
                        <option value="EVENING">Evening (2-6)</option>
                      </select>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] text-slate-400 font-semibold">Payment Gateway Options</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['COD', 'STRIPE', 'SSLCOMMERZ'].map((gw) => (
                        <button
                          key={gw}
                          onClick={() => setPaymentGateway(gw)}
                          className={`py-2 rounded-xl border text-[11px] font-bold transition ${paymentGateway === gw ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                        >
                          {gw}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Coupon codes panel */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] text-slate-400 font-semibold">Discount Coupon (Try: MANGO10)</label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Coupon Code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="flex-grow bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-amber-500 text-slate-200"
                      />
                      <button 
                        onClick={checkCoupon}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3 rounded-xl font-bold transition"
                      >
                        Apply
                      </button>
                    </div>
                    {appliedCoupon && (
                      <p className="text-emerald-400 font-bold text-[10px] mt-1">✓ Applied: {appliedCoupon}</p>
                    )}
                  </div>
                </div>

                {/* Calculations details */}
                <div className="border-t border-slate-800 pt-4 bg-slate-950/40 p-4 rounded-2xl flex flex-col gap-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Subtotal:</span>
                    <span>{getSubtotal()} BDT</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Shipping Base Charge:</span>
                    <span>{shippingDistrict === 'Rajshahi' ? 60 : shippingDistrict === 'Chittagong' ? 150 : 120} BDT</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-xs text-emerald-400 font-semibold">
                      <span>Discount Coupon Applied:</span>
                      <span>-{discountAmount} BDT</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-bold text-slate-200 pt-2 border-t border-slate-900">
                    <span>Total Amount:</span>
                    <span className="text-amber-400">
                      {getSubtotal() - discountAmount + (shippingDistrict === 'Rajshahi' ? 60 : shippingDistrict === 'Chittagong' ? 150 : 120)} BDT
                    </span>
                  </div>
                </div>

                <button 
                  disabled={checkoutLoading}
                  onClick={handleCheckoutSubmit}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-1.5 transition shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 disabled:opacity-55 disabled:cursor-not-allowed"
                >
                  {checkoutLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Slicing box checkouts...
                    </>
                  ) : (
                    <>
                      Place Mango Order
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🚀 Sign-In / Register Modal */}
      {authModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col gap-6 relative shadow-2xl">
            <button 
              onClick={() => setAuthModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-200"
            >
              ✕
            </button>

            <div>
              <h3 className="font-extrabold text-2xl bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent mb-1">
                {authMode === 'login' ? 'Sign In' : 'Affiliate & Customer Sign Up'}
              </h3>
              <p className="text-xs text-slate-400">
                {authMode === 'login' 
                  ? 'Access your shopping basket or affiliate analytics wallet' 
                  : 'Start buying fresh organic mango boxes or promote referral campaigns'}
              </p>
            </div>

            {authError && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-xs text-red-400 font-semibold">
                ⚠ {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
              {authMode === 'register' && (
                <>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Full Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={authFullName}
                      onChange={(e) => setAuthFullName(e.target.value)}
                      placeholder="Anisur Rahman"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-amber-500 text-slate-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Mobile Number</label>
                    <input 
                      type="text" 
                      value={authPhone}
                      onChange={(e) => setAuthPhone(e.target.value)}
                      placeholder="+88017XXXXXXXX"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-amber-500 text-slate-200"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400 font-semibold">Select Profile Role</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setAuthRole('CUSTOMER')}
                        className={`py-2 rounded-xl border text-xs font-bold transition ${authRole === 'CUSTOMER' ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                      >
                        🛍 Customer Buyer
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthRole('AFFILIATE')}
                        className={`py-2 rounded-xl border text-xs font-bold transition ${authRole === 'AFFILIATE' ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-slate-950 border-slate-800 text-slate-400'}`}
                      >
                        🤝 Affiliate Seller
                      </button>
                    </div>
                  </div>
                </>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold">Email Address</label>
                <input 
                  type="email" 
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-amber-500 text-slate-200"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-semibold">Secret Password</label>
                <input 
                  type="password" 
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:border-amber-500 text-slate-200"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-bold py-3 rounded-xl text-sm transition mt-2 shadow-lg shadow-orange-500/10"
              >
                {authMode === 'login' ? 'Authenticate Session' : 'Create New Account'}
              </button>
            </form>

            <div className="text-center text-xs text-slate-400 mt-2">
              {authMode === 'login' ? (
                <p>
                  New to Mangosteen?{' '}
                  <button onClick={() => { setAuthMode('register'); setAuthError(''); }} className="text-amber-500 hover:underline font-bold">
                    Create an account
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button onClick={() => { setAuthMode('login'); setAuthError(''); }} className="text-amber-500 hover:underline font-bold">
                    Sign in here
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

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

      {/* 🚀 Footer */}
      <footer className="border-t border-slate-900 px-6 py-8 text-center text-xs text-slate-500 mt-auto bg-slate-950/80">
        <p className="mb-2">© 2026 Mangosteen E-Commerce Inc. Sourced directly from local Bangladeshi grower cooperatives.</p>
        <p className="font-semibold text-[10px] text-slate-600 uppercase tracking-widest">Rajshahi • Chapainawabganj • Sathkhira</p>
      </footer>
    </div>
  );
}
