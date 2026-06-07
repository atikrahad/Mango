'use client';

import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useCartStore } from '../store/cartStore';
import { useLanguageStore } from '../store/languageStore';
import { translations, tDistrict, tProductName, tProductDesc, tCategoryName, tSpecLabel, tSpecValue, tFarmName, tFarmStory } from './translations';
import { Toast, useToastStore } from '@mangosteen/shared';
import { 
  ShoppingBag, Trash2, Filter, Search, ShieldCheck, 
  MapPin, Star, Sparkles, RefreshCw, Compass, CheckCircle2, 
  Info, ArrowLeft, ChevronLeft, ChevronRight, HelpCircle, 
  MessageSquare, Truck, Heart, Share2, Scale, Check, Phone, ArrowRight, Globe
} from 'lucide-react';

// Sourced farm details and descriptions for product specs
const PRODUCT_EXTRA_INFO: Record<string, {
  farmName: string;
  locationDetails: string;
  soilType: string;
  harvestMethod: string;
  timeline: string;
  sugarPercentage: string;
  specifications: { label: string; value: string }[];
  farmStory: string;
  images: string[];
}> = {
  'himsagar-premium': {
    farmName: 'Barendra Growers Cooperative',
    locationDetails: 'Sapahar Mango Belt, Naogaon',
    soilType: 'Sandy clay loam, rich in organic matter',
    harvestMethod: 'Hand-picked with bamboo poles (Thushi) to prevent drop bruises',
    timeline: 'Mid-May to Late June',
    sugarPercentage: '19% - 22% Brix level',
    specifications: [
      { label: 'Cultivar', value: 'Himsagar (Khirsapati)' },
      { label: 'Skin Color', value: 'Light green turning pale yellow when ripe' },
      { label: 'Flesh', value: 'Fiberless, orange-yellow, ultra-creamy' },
      { label: 'Ripening', value: '100% natural straw cover (No ethylene gas)' },
      { label: 'Certification', value: 'BSTI Organic Grade-A Standard' }
    ],
    farmStory: 'The Barendra cooperative supports 42 smallholder families in Sapahar, Naogaon. Sourced from 60-year-old heritage orchards, these Himsagar mangoes are harvested at precisely 85% maturity. They are immediately washed in mild warm water, graded by weight, and wrapped in eco-friendly paper to ripen naturally en route to your doorstep, preserving their legendary honey-sweet aroma.',
    images: [
      '/hero_ripe_mangoes.png',
      '/natural_straw_ripening.png',
      '/lush_mango_orchard.png'
    ]
  },
  'langra-special': {
    farmName: 'Porsha Premium Orchard Alliance',
    locationDetails: 'Porsha Upazila, Naogaon District',
    soilType: 'Gangetic alluvial silt loam',
    harvestMethod: 'Net-catcher hand harvesting with short shears',
    timeline: 'Early June to Mid-July',
    sugarPercentage: '18% - 20% Brix level',
    specifications: [
      { label: 'Cultivar', value: 'Langra (Porsha Scented)' },
      { label: 'Skin Color', value: 'Retains olive green color even when fully ripe' },
      { label: 'Flesh', value: 'Highly aromatic, firm, deep yellow' },
      { label: 'Ripening', value: 'Traditional jute-sack warming' },
      { label: 'Certification', value: 'Geographical Indication (GI) Certified' }
    ],
    farmStory: 'Langra mangoes are famed for their intense turpentine-sweet aroma and rich, slightly tangy undertone. Sourced from the fertile orchards of Porsha, Naogaon, these orchards benefit from rich soil that intensifies the fruit’s flavor. Our alliance of growers ensures strict canopy management to maximize sunlight penetration, yielding exceptionally sweet and large fruits.',
    images: [
      '/natural_straw_ripening.png',
      '/hero_ripe_mangoes.png',
      '/lush_mango_orchard.png'
    ]
  }
};

export default function CatalogPage() {
  const { lang, setLang, detectLanguage } = useLanguageStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    detectLanguage();
  }, []);

  const t = (key: keyof typeof translations['en'], variables?: Record<string, string | number>) => {
    const currentLang = mounted ? lang : 'bn'; // Default to Bangla during SSR and initial client hydration
    let text = translations[currentLang][key] || translations['bn'][key] || '';
    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  const { user, accessToken, isAuthenticated, setSession, logout } = useAuthStore();
  const { items, referralCode, setReferralCode, addToCart, removeFromCart, updateQuantity, clearCart, getSubtotal } = useCartStore();

  // Navigation Views
  const [currentView, setCurrentView] = useState<'home' | 'catalog' | 'product-detail' | 'checkout'>('home');
  const [selectedProductSlug, setSelectedProductSlug] = useState<string | null>(null);
  // Holds a slug from URL params until products finish loading
  const [pendingProductSlug, setPendingProductSlug] = useState<string | null>(null);

  // Catalog State
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedSweetness, setSelectedSweetness] = useState<number | ''>('');
  const [selectedOrganic, setSelectedOrganic] = useState<boolean | ''>('');
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('');

  // Cart / Sidebar open State
  const [cartOpen, setCartOpen] = useState(false);

  // Frictionless Guest Billing State
  const [billingFullName, setBillingFullName] = useState('');
  const [billingPhone, setBillingPhone] = useState('');
  const [billingDistrict, setBillingDistrict] = useState('Dhaka');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingNotes, setBillingNotes] = useState('');
  const [billingDeliverySlot, setBillingDeliverySlot] = useState('MORNING');
  const [billingPaymentGateway, setBillingPaymentGateway] = useState('COD');

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);

  // Home Page Animated Slider State
  const [heroSlide, setHeroSlide] = useState(0);
  const heroSlides = [
    {
      badgeKey: 'heroSlide1Badge' as const,
      titleKey: 'heroSlide1Title' as const,
      descKey: 'heroSlide1Desc' as const,
      btnTextKey: 'heroSlide1Btn' as const,
      bgImg: '/hero_ripe_mangoes.png',
      action: 'catalog'
    },
    {
      badgeKey: 'heroSlide2Badge' as const,
      titleKey: 'heroSlide2Title' as const,
      descKey: 'heroSlide2Desc' as const,
      btnTextKey: 'heroSlide2Btn' as const,
      bgImg: '/natural_straw_ripening.png',
      action: 'story'
    }
  ];

  // Sourcing Story Selection
  const [activeOrchardInfo, setActiveOrchardInfo] = useState<'sapahar' | 'rajshahi'>('sapahar');

  // Accordion FAQ state
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);

  // Product Detail dynamic state
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [activeDetailTab, setActiveDetailTab] = useState<'specs' | 'story' | 'reviews'>('specs');
  const [reviewName, setReviewName] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [customReviews, setCustomReviews] = useState<Record<string, { name: string; rating: number; date: string; comment: string; verified: boolean }[]>>({
    'himsagar-premium': [
      { name: 'Dr. Rafiqul Islam', rating: 5, date: 'Today', comment: 'Absolutely sensational sweetness! Real straw-ripened aroma that filled the entire room. No sign of chemical heat burn.', verified: true },
      { name: 'Tahmid Rahman', rating: 4, date: 'Yesterday', comment: 'Slightly green skin on delivery, but ripened perfectly in 2 days. The flesh is incredibly thick and completely fiberless.', verified: true }
    ],
    'langra-special': [
      { name: 'Sultana Chowdhury', rating: 5, date: 'Yesterday', comment: 'Intense flavor profile! The tanginess balanced with pure natural sugars is unmatched. Sourced GI certificate included in box.', verified: true }
    ]
  });

  // Notification Toast State
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    useToastStore.getState().showToast(message, type);
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
          }
        }),
        api.get('/catalog/categories')
      ]);

      if (prodRes.data?.success) {
        setProducts(prodRes.data.data.items);
      }
      if (catRes.data?.success) {
        setCategories(catRes.data.data);
      }
    } catch (e: any) {
      console.error('Error fetching catalog data:', e);
      showToast('Could not fetch seasonal orchard catalog inventory.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Auto slide effect
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % heroSlides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  // Sync state on catalog changes
  useEffect(() => {
    fetchCatalog();
  }, [search, selectedDistrict, selectedSweetness, selectedOrganic, selectedCategorySlug]);

  // Hook for capturing affiliate code and product slug from url
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref') || urlParams.get('referral');
      if (ref) {
        setReferralCode(ref);
        showToast(`Ambassador referral link applied! You are shopping via an affiliate link.`, 'info');
      }

      const productParam = urlParams.get('product') || urlParams.get('p');
      if (productParam) {
        // Store as pending — catalog may not be loaded yet
        setPendingProductSlug(productParam);
        // Switch view immediately so the product detail page shows once products arrive
        setCurrentView('product-detail');
      }
    }
  }, []);

  // Once catalog is loaded, resolve pendingProductSlug → selectedProductSlug
  useEffect(() => {
    if (pendingProductSlug && products.length > 0) {
      const found = products.find(p => p.slug === pendingProductSlug);
      if (found) {
        setSelectedProductSlug(pendingProductSlug);
        setPendingProductSlug(null);
        setActivePhotoIndex(0);
      } else {
        // Slug not found in catalog — go to catalog view with a toast
        showToast(`Product "${pendingProductSlug}" not found. Showing all products.`, 'info');
        setPendingProductSlug(null);
        setCurrentView('catalog');
      }
    }
  }, [products, pendingProductSlug]);

  // Dynamic Shipping Charge calculation
  const getShippingCharge = () => {
    if (billingDistrict === 'Rajshahi' || billingDistrict === 'Naogaon') {
      return 60;
    }
    if (billingDistrict === 'Chittagong' || billingDistrict === 'Sylhet') {
      return 150;
    }
    return 120; // Default to Dhaka / others
  };

  // Validate and apply promo discount coupon
  const checkCoupon = async () => {
    if (!couponCode) {
      showToast(lang === 'bn' ? 'অনুগ্রহ করে কুপন কোডটি লিখুন।' : 'Please type a coupon code.', 'error');
      return;
    }
    try {
      const res = await api.get(`/coupons/validate?code=${couponCode}&cartValue=${getSubtotal()}`);
      if (res.data?.success) {
        const coupon = res.data.data;
        let discount = 0;
        if (Number(coupon.discountPct) > 0) {
          discount = getSubtotal() * (Number(coupon.discountPct) / 100);
        } else {
          discount = Number(coupon.discountAmount);
        }
        
        setAppliedCoupon(couponCode);
        setDiscountAmount(discount);
        showToast(
          lang === 'bn' 
            ? `কুপন সফলভাবে প্রয়োগ করা হয়েছে! আপনি ${discount} টাকা ছাড় পেয়েছেন।` 
            : `Coupon applied successfully! You saved ${discount} BDT.`, 
          'success'
        );
      }
    } catch (e: any) {
      const msg = e.response?.data?.error?.message || (lang === 'bn' ? 'ভুল বা মেয়াদোত্তীর্ণ কুপন কোড।' : 'Invalid or expired discount coupon code.');
      showToast(msg, 'error');
    }
  };

  // Frictionless auto-registration and check-out
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      showToast(lang === 'bn' ? 'আপনার ঝুড়ি খালি। অনুগ্রহ করে ঝুড়িতে আম যোগ করুন।' : 'Your basket is empty. Please add mangoes to your basket.', 'error');
      return;
    }
    if (!billingFullName || !billingPhone || !billingAddress) {
      showToast(lang === 'bn' ? 'অনুগ্রহ করে আপনার নাম, মোবাইল নম্বর এবং ঠিকানা লিখুন।' : 'Please enter your Name, Mobile Number, and Address.', 'error');
      return;
    }

    try {
      setCheckoutLoading(true);
      // Dispatch checkout payload
      const payload = {
        items: items.map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        shippingAddress: billingAddress,
        district: billingDistrict,
        deliverySlot: billingDeliverySlot,
        paymentGateway: billingPaymentGateway,
        couponCode: appliedCoupon ? couponCode : undefined,
        referralCode: referralCode || undefined,
        customerName: billingFullName,
        customerPhone: billingPhone,
        customerEmail: `guest_${billingPhone}@mangovaiya.com`,
      };

      const res = await api.post('/orders/checkout', payload);
      if (res.data?.success) {
        setOrderSuccess(res.data.data);
        clearCart();
        setAppliedCoupon(null);
        setDiscountAmount(0);
        showToast(lang === 'bn' ? 'আপনার টাটকা অর্গানিক আম অর্ডার সফলভাবে সম্পন্ন হয়েছে! ধন্যবাদ।' : 'Your fresh organic mango order has been placed successfully!', 'success');
        setCurrentView('home');
        setSelectedProductSlug(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (e: any) {
      const msg = e.response?.data?.error?.message || (lang === 'bn' ? 'অর্ডার সম্পন্ন করা যায়নি। পুনরায় চেষ্টা করুন।' : 'Could not process order checkout.');
      showToast(msg, 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  // Submit verified review (simulated client state)
  const submitReview = (e: React.FormEvent, slug: string) => {
    e.preventDefault();
    if (!reviewName || !reviewComment) {
      showToast(lang === 'bn' ? 'অনুগ্রহ করে আপনার নাম এবং মন্তব্য লিখুন।' : 'Please fill in your name and comment.', 'error');
      return;
    }

    const newReview = {
      name: reviewName,
      rating: reviewRating,
      date: lang === 'bn' ? 'আজ' : 'Today',
      comment: reviewComment,
      verified: true
    };

    setCustomReviews(prev => ({
      ...prev,
      [slug]: [newReview, ...(prev[slug] || [])]
    }));

    setReviewName('');
    setReviewComment('');
    setReviewRating(5);
    showToast(t('reviewFormSubmitted'), 'success');
  };

  const handleHeroAction = (action: string) => {
    if (action === 'catalog') {
      setCurrentView('catalog');
    } else if (action === 'story') {
      const element = document.getElementById('sourcing-story-sec');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Find target product from current slug state
  const currentProduct = products.find(p => p.slug === selectedProductSlug);
  
  // Dynamic default info fallback in case slug doesn't exist in mapping
  const defaultExtraInfo = {
    farmName: 'Organic Growers Cooperative Alliance',
    locationDetails: currentProduct ? `${currentProduct.originDistrict} District` : 'Rajshahi, Bangladesh',
    soilType: 'Loamy rich agricultural soil',
    harvestMethod: 'Hand-picked at peak orchard maturity',
    timeline: 'Mid-Season Harvest Cycle',
    sugarPercentage: '18% - 20% Brix sweetness',
    specifications: [
      { label: 'Cultivar', value: currentProduct?.name || 'Local Hybrid' },
      { label: 'Skin Color', value: 'Light green or golden when ripe' },
      { label: 'Flesh', value: 'Thick, fiberless pulpy texture' },
      { label: 'Ripening', value: '100% natural straw-ripened standard' },
      { label: 'Certification', value: 'Orchard Quality Grade-A' }
    ],
    farmStory: 'Sourced from cooperative orchard groups. Our alliance of growers ensures strict canopy management to maximize natural sunlight and heat insulation, yielding exceptionally sweet and large fruits with no chemical additives.',
    images: [
      currentProduct?.imageUrl?.[0] || '/hero_ripe_mangoes.png',
      '/natural_straw_ripening.png',
      '/lush_mango_orchard.png'
    ]
  };

  const extraInfo = selectedProductSlug ? (PRODUCT_EXTRA_INFO[selectedProductSlug] || defaultExtraInfo) : null;

  return (
    <div className="flex-grow flex flex-col min-h-screen bg-stone-50 text-stone-850">
      
      {/* 🚀 Header & Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/80 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => { setCurrentView('home'); setSelectedProductSlug(null); }}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-amber-500 flex items-center justify-center font-bold text-white text-xl shadow-md">
            🥭
          </div>
          <div>
            <h1 className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent leading-none">
              MangoVaiya
            </h1>
            <p className="text-[10px] text-amber-600 font-bold tracking-widest uppercase mt-0.5">
              {t('brandTagline')}
            </p>
          </div>
        </div>

        {/* Navigation Portals */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-stone-600">
          <button 
            onClick={() => { setCurrentView('home'); setSelectedProductSlug(null); }} 
            className={`transition flex items-center gap-1 hover:text-emerald-600 ${currentView === 'home' ? 'text-emerald-700 font-black border-b-2 border-emerald-600 pb-0.5' : ''}`}
          >
            {t('navHome')}
          </button>
          <button 
            onClick={() => { setCurrentView('catalog'); setSelectedProductSlug(null); }} 
            className={`transition flex items-center gap-1.5 hover:text-emerald-600 ${currentView === 'catalog' ? 'text-emerald-700 font-black border-b-2 border-emerald-600 pb-0.5' : ''}`}
          >
            <Compass className="w-4 h-4" /> {t('navShop')}
          </button>
          <a href="#sourcing-story-sec" className="hover:text-emerald-600 transition flex items-center gap-1.5">
            <Info className="w-4 h-4" /> {t('navStory')}
          </a>
        </nav>

        {/* Corporate Phone hotline, lang toggle & cart */}
        <div className="flex items-center gap-3">
          <a 
            href="tel:+8801788925841" 
            className="hidden lg:flex items-center gap-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition"
          >
            <Phone className="w-3.5 h-3.5" /> {t('hotline')}
          </a>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'bn' ? 'en' : 'bn')}
            className="flex items-center gap-1 bg-amber-50 border border-amber-300 hover:bg-amber-100 text-amber-700 px-3 py-1.5 rounded-xl text-xs font-extrabold transition"
            title={lang === 'bn' ? 'Switch to English' : 'বাংলায় দেখুন'}
          >
            🌐 {t('langToggle')}
          </button>

          {/* Cart Icon Toggle */}
          <button 
            onClick={() => setCartOpen(!cartOpen)}
            className="relative bg-stone-100 border border-stone-200/80 p-2.5 rounded-xl hover:bg-stone-200 text-stone-700 transition shadow-sm"
          >
            <ShoppingBag className="w-5 h-5" />
            {items.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-white font-extrabold text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow">
                {items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 🚀 Render Content based on navigation view */}
      {currentView === 'home' && !selectedProductSlug && (
        <div className="flex flex-col flex-grow">
          
          {/* Hero Banner Section */}
          <section className="relative h-[60vh] md:h-[70vh] w-full overflow-hidden bg-stone-100">
            {heroSlides.map((slide, idx) => (
              <div 
                key={idx}
                className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${idx === heroSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
              >
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `linear-gradient(to right, rgba(255, 255, 255, 0.95) 40%, rgba(255, 255, 255, 0.1)), url(${slide.bgImg})` }}
                />
                
                <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-16 max-w-3xl gap-4">
                  <span className="inline-block bg-emerald-100 border border-emerald-300 text-emerald-700 text-xs font-black px-4 py-1.5 rounded-full w-max tracking-wide uppercase shadow-sm">
                    {t(slide.badgeKey)}
                  </span>
                  <h2 className="text-4xl md:text-6xl font-black tracking-tight leading-none text-stone-900 drop-shadow-sm">
                    {t(slide.titleKey)}
                  </h2>
                  <p className="text-sm md:text-base text-stone-600 leading-relaxed max-w-xl font-medium">
                    {t(slide.descKey)}
                  </p>
                  <div className="flex gap-3 mt-4">
                    <button 
                      onClick={() => handleHeroAction(slide.action)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-7 py-3.5 rounded-xl text-sm font-extrabold shadow-md hover:shadow-lg transition flex items-center gap-2"
                    >
                      {t(slide.btnTextKey)} <ArrowRight className="w-4 h-4" />
                    </button>
                    <a 
                      href="https://wa.me/8801788925841" 
                      target="_blank"
                      className="bg-white border border-stone-300 hover:border-emerald-500 hover:bg-stone-50 text-stone-700 px-6 py-3.5 rounded-xl text-sm font-bold shadow-sm transition flex items-center gap-2"
                    >
                      💬 {t('whatsappOrder')}
                    </a>
                  </div>
                </div>
              </div>
            ))}

            {/* Slider navigators */}
            <div className="absolute bottom-6 left-12 z-20 flex gap-2.5">
              {heroSlides.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={() => setHeroSlide(idx)}
                  className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${idx === heroSlide ? 'bg-emerald-600 w-8' : 'bg-stone-300'}`}
                />
              ))}
            </div>
          </section>

          {/* 🌿 Trust Badges Row */}
          <section className="bg-white py-8 px-6 border-b border-stone-200/80">
            <div className="max-w-7xl mx-auto w-full grid grid-cols-2 md:grid-cols-4 gap-6">
              
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl shadow-sm border border-emerald-100 flex-shrink-0">
                  🛡️
                </div>
                <div>
                  <h4 className="font-extrabold text-stone-800 text-sm md:text-base leading-tight">{t('trustBadge1Title')}</h4>
                  <p className="text-xs text-stone-500 font-medium">{t('trustBadge1Desc')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center text-2xl shadow-sm border border-amber-100 flex-shrink-0">
                  🌾
                </div>
                <div>
                  <h4 className="font-extrabold text-stone-800 text-sm md:text-base leading-tight">{t('trustBadge2Title')}</h4>
                  <p className="text-xs text-stone-500 font-medium">{t('trustBadge2Desc')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl shadow-sm border border-emerald-100 flex-shrink-0">
                  📍
                </div>
                <div>
                  <h4 className="font-extrabold text-stone-800 text-sm md:text-base leading-tight">{t('trustBadge3Title')}</h4>
                  <p className="text-xs text-stone-500 font-medium">{t('trustBadge3Desc')}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-stone-50 text-stone-600 flex items-center justify-center text-2xl shadow-sm border border-stone-200/80 flex-shrink-0">
                  🚚
                </div>
                <div>
                  <h4 className="font-extrabold text-stone-800 text-sm md:text-base leading-tight">{t('trustBadge4Title')}</h4>
                  <p className="text-xs text-stone-500 font-medium">{t('trustBadge4Desc')}</p>
                </div>
              </div>

            </div>
          </section>

          {/* Seasonal Campaign Banner with Active countdown */}
          <section className="px-6 py-10 max-w-7xl mx-auto w-full">
            <div className="bg-gradient-to-r from-emerald-700 to-emerald-800 rounded-3xl p-8 md:p-12 relative overflow-hidden shadow-lg text-white flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full filter blur-3xl -mr-20 -mt-20 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full filter blur-3xl -ml-20 -mb-20 pointer-events-none" />
              
              <div className="flex flex-col gap-3 relative z-10 max-w-lg">
                <span className="bg-amber-400 text-emerald-950 font-black text-[10px] tracking-widest uppercase px-3 py-1 rounded-full w-max shadow">
                  {t('campaignBadge')}
                </span>
                <h3 className="text-3xl md:text-4xl font-black leading-tight">
                  {t('campaignTitle')}
                </h3>
                <p className="text-xs text-emerald-100 font-medium">
                  {t('campaignDesc')}
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl flex flex-col items-center gap-4 text-center min-w-[240px] relative z-10 shadow-lg">
                <p className="text-[10px] text-amber-300 font-black tracking-widest uppercase">{t('campaignRemaining')}</p>
                <div className="flex gap-3 text-stone-900">
                  <div className="bg-white w-12 h-12 rounded-xl flex flex-col justify-center items-center shadow-md">
                    <span className="font-black text-lg text-emerald-700 leading-none">03</span>
                    <span className="text-[8px] font-bold text-stone-500 mt-0.5">{t('days')}</span>
                  </div>
                  <div className="bg-white w-12 h-12 rounded-xl flex flex-col justify-center items-center shadow-md">
                    <span className="font-black text-lg text-emerald-700 leading-none">14</span>
                    <span className="text-[8px] font-bold text-stone-500 mt-0.5">{t('hrs')}</span>
                  </div>
                  <div className="bg-white w-12 h-12 rounded-xl flex flex-col justify-center items-center shadow-md">
                    <span className="font-black text-lg text-emerald-700 leading-none">42</span>
                    <span className="text-[8px] font-bold text-stone-500 mt-0.5">{t('mins')}</span>
                  </div>
                </div>
                <button 
                  onClick={() => setCurrentView('catalog')}
                  className="bg-amber-400 hover:bg-amber-500 text-stone-950 text-xs font-black py-2.5 px-6 rounded-xl transition w-full shadow-md"
                >
                  {t('campaignShopBtn')}
                </button>
              </div>
            </div>
          </section>

          {/* 🌿 Featured Products Grid */}
          <section className="px-6 py-12 max-w-7xl mx-auto w-full flex flex-col gap-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-xs text-emerald-600 font-black tracking-widest uppercase">{t('catalogBadge')}</span>
                <h3 className="text-2xl md:text-3xl font-black text-stone-850 mt-1">{t('catalogTitle')}</h3>
                <p className="text-xs text-stone-500 mt-1">{t('catalogDesc')}</p>
              </div>
              <button 
                onClick={() => setCurrentView('catalog')}
                className="bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-700 font-extrabold text-xs px-5 py-2.5 rounded-xl transition shadow-sm w-max"
              >
                {t('catalogExploreBtn')}
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.slice(0, 3).map((product) => (
                  <div 
                    key={product.id}
                    className="bg-white border border-stone-200/80 rounded-3xl overflow-hidden flex flex-col h-full organic-panel-hover shadow-sm cursor-pointer group relative"
                    onClick={() => {
                      setSelectedProductSlug(product.slug);
                      setCurrentView('product-detail');
                      setActivePhotoIndex(0);
                    }}
                  >
                    <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden">
                      <img 
                        src={product.imageUrl?.[0] || 'https://images.unsplash.com/photo-1553279768-865429fa0078'} 
                        alt={tProductName(product.name, lang)}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500"
                      />
                      {product.isOrganic && (
                        <span className="absolute top-4 left-4 bg-emerald-600 text-white font-extrabold text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
                          🌿 {t('safeAndOrganic')}
                        </span>
                      )}
                      <span className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md text-[10px] text-stone-750 font-black px-2.5 py-1 rounded-lg shadow-sm border border-stone-200/50 flex items-center gap-1">
                        📍 {tDistrict(product.originDistrict, lang)}
                      </span>
                    </div>

                    <div className="p-6 flex-grow flex flex-col gap-4">
                      <div className="flex-grow">
                        <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-extrabold uppercase tracking-wider mb-1.5">
                          <span>{tCategoryName(product.category?.name || 'Fresh Fruit', lang)}</span>
                          <span>•</span>
                          <span className="text-amber-500">{t('inStock')}</span>
                        </div>
                        <h4 className="font-extrabold text-lg text-stone-850 group-hover:text-emerald-700 transition leading-tight mb-2">
                          {tProductName(product.name, lang)}
                        </h4>
                        <p className="text-xs text-stone-500 leading-relaxed line-clamp-2">
                          {tProductDesc(product.description, product.slug, lang)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-stone-100 pt-4 mt-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-stone-400 font-bold">{t('sweetnessLabel')}</span>
                          <div className="flex text-amber-500">
                            {Array.from({ length: product.sweetness }).map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-current" />
                            ))}
                          </div>
                        </div>
                        
                        <span className="text-xs font-black text-emerald-600 group-hover:underline flex items-center gap-1">
                          {t('orderBox')} <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Sourcing Cooperatives Story Section */}
          <section id="sourcing-story-sec" className="px-6 py-16 bg-white border-y border-stone-200/80 w-full">
            <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-5 flex flex-col gap-6">
                <span className="text-xs text-emerald-600 font-black tracking-widest uppercase">{t('sourcingBadge')}</span>
                <h3 className="text-3xl md:text-4xl font-black text-stone-850 leading-tight">
                  {t('sourcingTitle')}
                </h3>
                <p className="text-sm text-stone-500 leading-relaxed font-medium">
                  {t('sourcingDesc')}
                </p>

                <div className="flex flex-col gap-3.5 mt-2">
                  <div 
                    onClick={() => setActiveOrchardInfo('sapahar')}
                    className={`p-4 rounded-2xl border cursor-pointer transition ${activeOrchardInfo === 'sapahar' ? 'bg-emerald-50/50 border-emerald-400 text-emerald-800' : 'bg-stone-50 border-stone-200 text-stone-700'}`}
                  >
                    <h4 className="font-extrabold text-sm flex items-center gap-2">
                      {activeOrchardInfo === 'sapahar' && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
                      {t('coop1Title')}
                    </h4>
                    {activeOrchardInfo === 'sapahar' && (
                      <p className="text-xs text-stone-500 mt-2 leading-relaxed font-medium">
                        {t('coop1Desc')}
                      </p>
                    )}
                  </div>

                  <div 
                    onClick={() => setActiveOrchardInfo('rajshahi')}
                    className={`p-4 rounded-2xl border cursor-pointer transition ${activeOrchardInfo === 'rajshahi' ? 'bg-emerald-50/50 border-emerald-400 text-emerald-800' : 'bg-stone-50 border-stone-200 text-stone-700'}`}
                  >
                    <h4 className="font-extrabold text-sm flex items-center gap-2">
                      {activeOrchardInfo === 'rajshahi' && <span className="w-2 h-2 rounded-full bg-emerald-600" />}
                      {t('coop2Title')}
                    </h4>
                    {activeOrchardInfo === 'rajshahi' && (
                      <p className="text-xs text-stone-500 mt-2 leading-relaxed font-medium">
                        {t('coop2Desc')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-7 relative aspect-[16/10] bg-stone-100 rounded-3xl overflow-hidden border border-stone-200 shadow-sm">
                <img 
                  src={activeOrchardInfo === 'sapahar' 
                    ? '/natural_straw_ripening.png'
                    : '/lush_mango_orchard.png'
                  } 
                  alt="Mango Orchards cooperatives"
                  className="w-full h-full object-cover"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-6 md:p-8">
                  <div className="bg-white/95 backdrop-blur-md p-4 rounded-2xl flex gap-3 max-w-sm border border-stone-200/50 shadow-md">
                    <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <h5 className="font-extrabold text-xs text-stone-900">
                        {activeOrchardInfo === 'sapahar' ? t('mapLabel1') : t('mapLabel2')}
                      </h5>
                      <p className="text-[10px] text-stone-500 font-medium mt-1">
                        GPS: 24.5985° N, 88.2694° E • BSTI Organic Grade-A Standard Verified.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </section>

          {/* Testimonials */}
          <section className="px-6 py-16 max-w-7xl mx-auto w-full flex flex-col gap-8">
            <div className="text-center max-w-xl mx-auto">
              <span className="text-xs text-emerald-600 font-black tracking-widest uppercase">{t('testimonialBadge')}</span>
              <h3 className="text-2xl md:text-3xl font-black text-stone-850 mt-1">{t('testimonialTitle')}</h3>
              <p className="text-xs text-stone-500 font-semibold mt-1">{t('testimonialSubtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-stone-200/80 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
                <div className="flex flex-col gap-3">
                  <div className="flex text-amber-500">
                    {[1,2,3,4,5].map((s) => <Star key={s} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p className="text-xs text-stone-600 font-medium leading-relaxed italic">
                    {t('testimonial1Text')}
                  </p>
                </div>
                <div className="flex items-center gap-3 border-t border-stone-100 pt-4 mt-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    MH
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-stone-850">{t('testimonial1Name')}</h5>
                    <p className="text-[10px] text-stone-400 font-semibold">{t('testimonial1Role')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-stone-200/80 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
                <div className="flex flex-col gap-3">
                  <div className="flex text-amber-500">
                    {[1,2,3,4,5].map((s) => <Star key={s} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p className="text-xs text-stone-600 font-medium leading-relaxed italic">
                    {t('testimonial2Text')}
                  </p>
                </div>
                <div className="flex items-center gap-3 border-t border-stone-100 pt-4 mt-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    NS
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-stone-850">{t('testimonial2Name')}</h5>
                    <p className="text-[10px] text-stone-400 font-semibold">{t('testimonial2Role')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-stone-200/80 p-6 rounded-3xl shadow-sm flex flex-col justify-between">
                <div className="flex flex-col gap-3">
                  <div className="flex text-amber-500">
                    {[1,2,3,4,5].map((s) => <Star key={s} className="w-4 h-4 fill-current" />)}
                  </div>
                  <p className="text-xs text-stone-600 font-medium leading-relaxed italic">
                    {t('testimonial3Text')}
                  </p>
                </div>
                <div className="flex items-center gap-3 border-t border-stone-100 pt-4 mt-4">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    AH
                  </div>
                  <div>
                    <h5 className="font-extrabold text-xs text-stone-850">{t('testimonial3Name')}</h5>
                    <p className="text-[10px] text-stone-400 font-semibold">{t('testimonial3Role')}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FAQ Accordion Section */}
          <section className="px-6 py-16 bg-stone-100 border-t border-stone-200/80 w-full">
            <div className="max-w-3xl mx-auto w-full flex flex-col gap-8">
              <div className="text-center">
                <span className="text-xs text-emerald-600 font-black tracking-widest uppercase">{t('faqBadge')}</span>
                <h3 className="text-2xl md:text-3xl font-black text-stone-850 mt-1">{t('faqTitle')}</h3>
                <p className="text-xs text-stone-500 font-medium mt-1">{t('faqSubtitle')}</p>
              </div>

              <div className="flex flex-col gap-3">
                {[
                  {
                    qKey: 'faqQ1' as const,
                    aKey: 'faqA1' as const
                  },
                  {
                    qKey: 'faqQ2' as const,
                    aKey: 'faqA2' as const
                  },
                  {
                    qKey: 'faqQ3' as const,
                    aKey: 'faqA3' as const
                  },
                  {
                    qKey: 'faqQ4' as const,
                    aKey: 'faqA4' as const
                  }
                ].map((item, idx) => (
                  <div key={idx} className="bg-white border border-stone-200/80 rounded-2xl overflow-hidden shadow-sm">
                    <button 
                      onClick={() => setFaqOpenIndex(faqOpenIndex === idx ? null : idx)}
                      className="w-full text-left px-6 py-4 font-extrabold text-sm md:text-base flex justify-between items-center text-stone-800 hover:text-emerald-700 transition"
                    >
                      <span>{t(item.qKey)}</span>
                      <span className="text-stone-400">{faqOpenIndex === idx ? '−' : '+'}</span>
                    </button>
                    {faqOpenIndex === idx && (
                      <div className="px-6 pb-5 text-xs md:text-sm text-stone-500 font-medium leading-relaxed border-t border-stone-100 pt-3">
                        {t(item.aKey)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
      )}

      {/* 🚀 Dynamic Catalog Page View */}
      {currentView === 'catalog' && (
        <div className="px-6 py-8 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
          
          {/* Left Side: Advanced Sourcing Filter Sidebar */}
          <aside className="lg:col-span-1 flex flex-col gap-6">
            
            {/* Search Input bar */}
            <div className="bg-white border border-stone-200/85 p-5 rounded-3xl shadow-sm flex flex-col gap-3">
              <h4 className="font-extrabold text-sm text-stone-800 uppercase tracking-wider">{t('searchCatalog')}</h4>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder={t('searchPlaceholder')} 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-emerald-600 transition"
                />
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Collections categories filter list */}
            <div className="bg-white border border-stone-200/85 p-5 rounded-3xl shadow-sm flex flex-col gap-4">
              <div className="flex items-center gap-1.5 text-stone-850">
                <Filter className="w-4 h-4 text-emerald-600" />
                <h4 className="font-extrabold text-sm uppercase tracking-wider">{t('orchardCollections')}</h4>
              </div>
              
              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => setSelectedCategorySlug('')}
                  className={`text-left text-xs px-3.5 py-2 rounded-xl font-bold transition ${!selectedCategorySlug ? 'bg-emerald-600 text-white shadow-sm' : 'text-stone-600 hover:bg-stone-50'}`}
                >
                  {t('allCollections')}
                </button>
                {categories.map((cat) => (
                  <button 
                    key={cat.id}
                    onClick={() => setSelectedCategorySlug(cat.slug)}
                    className={`text-left text-xs px-3.5 py-2 rounded-xl font-bold transition ${selectedCategorySlug === cat.slug ? 'bg-emerald-600 text-white shadow-sm' : 'text-stone-600 hover:bg-stone-50'}`}
                  >
                    {tCategoryName(cat.name, lang)}
                  </button>
                ))}
              </div>
            </div>

            {/* Regional Origin Filter */}
            <div className="bg-white border border-stone-200/85 p-5 rounded-3xl shadow-sm flex flex-col gap-3">
              <h4 className="font-extrabold text-sm text-stone-800 uppercase tracking-wider">{t('originDistrict')}</h4>
              <select 
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2 text-xs text-stone-750 font-bold focus:outline-none focus:border-emerald-600 transition"
              >
                <option value="">{t('allRegions')}</option>
                <option value="Rajshahi">{tDistrict('Rajshahi', lang)}</option>
                <option value="Naogaon">{tDistrict('Naogaon', lang)}</option>
                <option value="Sathkhira">{tDistrict('Sathkhira', lang)}</option>
              </select>
            </div>

            {/* Sweetness star */}
            <div className="bg-white border border-stone-200/85 p-5 rounded-3xl shadow-sm flex flex-col gap-3">
              <h4 className="font-extrabold text-sm text-stone-800 uppercase tracking-wider">{t('brixSweetnessLabel')}</h4>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((stars) => (
                  <button 
                    key={stars}
                    onClick={() => setSelectedSweetness(selectedSweetness === stars ? '' : stars)}
                    className={`flex-1 aspect-square rounded-xl border flex items-center justify-center text-xs font-black transition ${selectedSweetness === stars ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm' : 'bg-stone-50 border-stone-200 text-stone-400 hover:border-stone-300'}`}
                  >
                    {stars}★
                  </button>
                ))}
              </div>
            </div>

            {/* Certified organic checkbox */}
            <div className="bg-white border border-stone-200/85 p-5 rounded-3xl shadow-sm flex items-center gap-3">
              <input 
                type="checkbox" 
                id="organic-check"
                checked={selectedOrganic === true}
                onChange={(e) => setSelectedOrganic(e.target.checked ? true : '')}
                className="w-4 h-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500 accent-emerald-600 bg-stone-50 cursor-pointer"
              />
              <label htmlFor="organic-check" className="text-xs text-stone-600 font-extrabold cursor-pointer uppercase tracking-wider">
                🌿 {t('chemicalFreeOnly')}
              </label>
            </div>

          </aside>

          {/* Right Side: Products Catalog Listings */}
          <main className="lg:col-span-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-stone-500 gap-4">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
                <p className="font-bold text-sm">{t('loadingCatalog')}</p>
              </div>
            ) : products.length === 0 ? (
              <div className="bg-white border border-stone-200/80 text-center py-20 rounded-3xl shadow-sm">
                <p className="text-stone-500 text-lg font-bold">{t('noProductsFound')}</p>
                <button 
                  onClick={() => {
                    setSearch('');
                    setSelectedDistrict('');
                    setSelectedSweetness('');
                    setSelectedOrganic('');
                    setSelectedCategorySlug('');
                  }}
                  className="mt-4 bg-emerald-600 text-white font-extrabold px-6 py-2.5 rounded-xl text-xs transition hover:bg-emerald-700 shadow"
                >
                  {t('clearFilters')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div 
                    key={product.id}
                    className="bg-white border border-stone-200/80 rounded-3xl overflow-hidden flex flex-col h-full organic-panel-hover shadow-sm cursor-pointer group"
                    onClick={() => {
                      setSelectedProductSlug(product.slug);
                      setCurrentView('product-detail');
                      setActivePhotoIndex(0);
                    }}
                  >
                    <div className="aspect-[4/3] bg-stone-100 relative overflow-hidden">
                      <img 
                        src={product.imageUrl?.[0] || 'https://images.unsplash.com/photo-1553279768-865429fa0078'} 
                        alt={tProductName(product.name, lang)}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500"
                      />
                      {product.isOrganic && (
                        <span className="absolute top-4 left-4 bg-emerald-600 text-white font-extrabold text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1">
                          🌿 {t('chemicalFree')}
                        </span>
                      )}
                      <span className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md text-[10px] text-stone-755 font-black px-2.5 py-1 rounded-lg shadow-sm border border-stone-200/50 flex items-center gap-1">
                        📍 {tDistrict(product.originDistrict, lang)}
                      </span>
                    </div>

                    <div className="p-5 flex-grow flex flex-col gap-4">
                      <div className="flex-grow">
                        <h4 className="font-extrabold text-base text-stone-850 group-hover:text-emerald-700 transition leading-tight mb-2">
                          {tProductName(product.name, lang)}
                        </h4>
                        <p className="text-xs text-stone-500 leading-relaxed line-clamp-2 font-medium">
                          {tProductDesc(product.description, product.slug, lang)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between border-t border-stone-100 pt-4 mt-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-stone-400 font-bold">{t('sweetnessLabel')}</span>
                          <div className="flex text-amber-500">
                            {Array.from({ length: product.sweetness }).map((_, i) => (
                              <Star key={i} className="w-3 h-3 fill-current" />
                            ))}
                          </div>
                        </div>
                        
                        <span className="text-xs font-black text-emerald-600 group-hover:underline flex items-center gap-1">
                          {t('selectBox')} <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      )}

      {/* 🚀 Product loading state (waiting for catalog to resolve affiliate product slug) */}
      {currentView === 'product-detail' && !currentProduct && (
        <div className="flex flex-col items-center justify-center py-32 gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-sm font-bold text-stone-500">{t('loadingProductDetails')}</p>
        </div>
      )}

      {/* 🚀 Dynamic Product Detail View page */}
      {currentView === 'product-detail' && currentProduct && extraInfo && (
        <div className="px-6 py-8 max-w-7xl mx-auto w-full flex flex-col gap-8 animate-fade-in">
          
          {/* Back Navigation Bar */}
          <div className="flex items-center justify-between py-2 border-b border-stone-200/80">
            <button 
              onClick={() => setCurrentView('catalog')}
              className="text-xs font-black text-stone-500 hover:text-emerald-600 transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" /> {t('backToCatalog')}
            </button>
            <div className="flex items-center gap-3">
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-200 shadow-sm flex items-center gap-1">
                ✓ {t('safeCertified')}
              </span>
            </div>
          </div>

          {/* Product Detail Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Left Column: Big Interactive Photo Gallery */}
            <div className="lg:col-span-6 flex flex-col gap-4">
              <div className="relative aspect-[4/3] bg-stone-100 rounded-3xl overflow-hidden border border-stone-200 shadow-sm">
                <img 
                  src={extraInfo.images[activePhotoIndex] || currentProduct.imageUrl?.[0]} 
                  alt={currentProduct.name}
                  className="w-full h-full object-cover transition-all duration-300"
                />
                
                {currentProduct.isOrganic && (
                  <span className="absolute top-4 left-4 bg-emerald-600 text-white font-extrabold text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-1">
                    🌿 {t('chemicalFreeRipened')}
                  </span>
                )}
                
                <span className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md text-xs text-stone-750 font-black px-3 py-1.5 rounded-lg border border-stone-200/60 shadow-sm">
                  📍 {t('sourcedLabel')} {tDistrict(currentProduct.originDistrict, lang)}
                </span>
              </div>

              {/* Multi-Photo Thumbnails row selector */}
              <div className="grid grid-cols-3 gap-4">
                {extraInfo.images.map((img, idx) => (
                  <div 
                    key={idx}
                    onClick={() => setActivePhotoIndex(idx)}
                    className={`aspect-[4/3] bg-stone-100 rounded-2xl overflow-hidden cursor-pointer border-2 transition ${idx === activePhotoIndex ? 'border-emerald-600 ring-2 ring-emerald-500/20' : 'border-stone-200 opacity-70 hover:opacity-100'}`}
                  >
                    <img src={img} alt="Thumbnail view" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Buying parameters */}
            <div className="lg:col-span-6 flex flex-col gap-6">
              <div>
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full w-max shadow-sm mb-2.5 inline-block">
                  {tCategoryName(currentProduct.category?.name || 'Sapahar Naogaon Select', lang)}
                </span>
                
                <h2 className="text-3xl font-black text-stone-850 tracking-tight leading-none mb-2">
                  {tProductName(currentProduct.name, lang)}
                </h2>
                
                {/* Star reviews rating */}
                <div className="flex items-center gap-2">
                  <div className="flex text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="w-4 h-4 fill-current" />
                    ))}
                  </div>
                  <span className="text-xs font-bold text-stone-500">
                    (5.0 {t('ratingBasedOn').replace('{count}', String(customReviews[currentProduct.slug]?.length || 1))})
                  </span>
                </div>
              </div>

              <div className="bg-white border border-stone-200/80 p-6 rounded-3xl shadow-sm">
                <p className="text-xs text-stone-500 leading-relaxed font-semibold">
                  {tProductDesc(currentProduct.description, currentProduct.slug, lang)}
                </p>
                <div className="flex items-center gap-6 mt-4 pt-4 border-t border-stone-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-stone-400 font-extrabold uppercase">{t('sweetnessRatio')}</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="font-extrabold text-sm text-stone-800">{extraInfo.sugarPercentage}</span>
                      <span className="text-amber-500 text-xs">★</span>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-stone-400 font-extrabold uppercase">{t('harvestTimeline')}</span>
                    <span className="font-extrabold text-xs text-stone-800 mt-1">{extraInfo.timeline}</span>
                  </div>
                </div>
              </div>

              {/* Box Size / Price Options selector */}
              <div className="flex flex-col gap-3">
                <h4 className="font-black text-xs text-stone-750 uppercase tracking-wider">{t('selectBoxSize')}</h4>
                
                <div className="flex flex-col gap-3">
                  {currentProduct.variants?.map((v: any) => {
                    const discountedPrice = Number(v.price) - Number(v.discount);
                    const isBestValue = v.weightKg >= 10;
                    return (
                      <div 
                        key={v.id}
                        onClick={() => {
                          addToCart({
                            variantId: v.id,
                            productId: currentProduct.id,
                            name: currentProduct.name,
                            sku: v.sku,
                            price: discountedPrice,
                            weightKg: Number(v.weightKg),
                            boxCount: Number(v.boxCount || 1)
                          });
                          showToast(
                            lang === 'bn' 
                              ? `${v.weightKg}কেজি আমের বক্স বাস্কেটে যোগ করা হয়েছে!` 
                              : `${v.weightKg}kg Box added to your basket!`, 
                            'success'
                          );
                          setCartOpen(true);
                        }}
                        className="bg-white border-2 border-stone-200 hover:border-emerald-600 rounded-2xl p-4 flex justify-between items-center cursor-pointer transition shadow-sm hover:shadow group relative overflow-hidden"
                      >
                        {isBestValue && (
                          <span className="absolute top-0 right-0 bg-amber-400 text-stone-950 font-black text-[8px] uppercase tracking-widest px-2.5 py-0.5 rounded-bl-lg shadow-sm">
                            ★ {t('bestValue')}
                          </span>
                        )}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold shadow-sm">
                            📦
                          </div>
                          <div>
                            <h5 className="font-black text-sm text-stone-850">{v.weightKg} {t('kg')} {t('premiumPack')}</h5>
                            <p className="text-[10px] text-stone-400 font-semibold">{t('boxSizeDesc').replace('{min}', String(v.boxCount * 2)).replace('{max}', String(v.boxCount * 5))}</p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <div>
                            <p className="font-black text-base text-stone-900 leading-none">{discountedPrice} BDT</p>
                            {Number(v.discount) > 0 && (
                              <p className="text-[10px] text-stone-400 line-through font-semibold mt-0.5">{Number(v.price)} BDT</p>
                            )}
                          </div>
                          <span className="bg-emerald-600 text-white font-extrabold text-[10px] py-1.5 px-3 rounded-lg shadow-sm group-hover:bg-emerald-700 transition">
                            {t('addPlus')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sourcing parameters specs tab */}
              <div className="bg-white border border-stone-200/80 rounded-3xl overflow-hidden shadow-sm">
                <div className="flex border-b border-stone-100 bg-stone-50/50">
                  <button 
                    onClick={() => setActiveDetailTab('specs')}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-wider text-center border-b-2 transition ${activeDetailTab === 'specs' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
                  >
                    {t('specsTab')}
                  </button>
                  <button 
                    onClick={() => setActiveDetailTab('story')}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-wider text-center border-b-2 transition ${activeDetailTab === 'story' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
                  >
                    {t('storyTab')}
                  </button>
                  <button 
                    onClick={() => setActiveDetailTab('reviews')}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-wider text-center border-b-2 transition ${activeDetailTab === 'reviews' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
                  >
                    {t('reviewsTab').replace('{count}', String(customReviews[currentProduct.slug]?.length || 0))}
                  </button>
                </div>

                <div className="p-6">
                  
                  {activeDetailTab === 'specs' && (
                    <div className="flex flex-col gap-2.5">
                      {extraInfo.specifications.map((spec, sIdx) => (
                        <div key={sIdx} className="flex justify-between items-center text-xs py-1.5 border-b border-stone-100 last:border-b-0">
                          <span className="text-stone-400 font-bold">{tSpecLabel(spec.label, lang)}</span>
                          <span className="text-stone-750 font-extrabold">{tSpecValue(spec.value, lang)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeDetailTab === 'story' && (
                    <div className="flex flex-col gap-3">
                      <h5 className="font-extrabold text-sm text-stone-800">🌳 {t('reviewFarmLabel')} {tFarmName(extraInfo.farmName, lang)}</h5>
                      <p className="text-xs text-stone-500 leading-relaxed font-semibold">
                        {tFarmStory(extraInfo.farmStory, lang)}
                      </p>
                      <div className="p-3.5 bg-stone-50 border border-stone-200/70 rounded-2xl flex items-center gap-3 mt-1.5">
                        <span className="text-lg">🌿</span>
                        <div className="text-[10px] text-stone-500 font-semibold leading-relaxed">
                          {t('reviewGPSDesc')}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeDetailTab === 'reviews' && (
                    <div className="flex flex-col gap-6">
                      {/* Reviews List */}
                      <div className="flex flex-col gap-4 max-h-[220px] overflow-y-auto pr-1">
                        {(customReviews[currentProduct.slug] || []).map((rev, rIdx) => (
                          <div key={rIdx} className="p-3.5 bg-stone-50 border border-stone-200/50 rounded-2xl flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs text-stone-800">{rev.name}</span>
                                {rev.verified && (
                                  <span className="text-[8px] bg-emerald-50 text-emerald-700 font-black tracking-widest uppercase px-1.5 py-0.5 rounded border border-emerald-100">
                                    ✓ {lang === 'bn' ? 'যাচাইকৃত ক্রেতা' : 'Verified Buyer'}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-stone-400 font-bold">{rev.date}</span>
                            </div>
                            <div className="flex text-amber-500">
                              {Array.from({ length: rev.rating }).map((_, i) => (
                                <Star key={i} className="w-3 h-3 fill-current" />
                              ))}
                            </div>
                            <p className="text-[11px] text-stone-600 leading-relaxed font-medium">"{rev.comment}"</p>
                          </div>
                        ))}
                      </div>

                      {/* Add simulated Review Form */}
                      <form onSubmit={(e) => submitReview(e, currentProduct.slug)} className="border-t border-stone-100 pt-4 flex flex-col gap-3">
                        <h5 className="font-extrabold text-xs text-stone-750 uppercase tracking-wider">{t('leaveReview')}</h5>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-stone-400 font-bold">{t('yourNameLabel')}</label>
                            <input 
                              type="text" 
                              required
                              value={reviewName}
                              onChange={(e) => setReviewName(e.target.value)}
                              placeholder="Anisur Rahman"
                              className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-600 text-stone-750 font-bold"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] text-stone-400 font-bold">{t('ratingLabel')}</label>
                            <select 
                              value={reviewRating}
                              onChange={(e) => setReviewRating(Number(e.target.value))}
                              className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-600 text-stone-750 font-bold"
                            >
                              <option value="5">{t('ratingExcellent')}</option>
                              <option value="4">{t('ratingVeryGood')}</option>
                              <option value="3">{t('ratingGood')}</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[10px] text-stone-400 font-bold">{t('yourCommentLabel')}</label>
                          <textarea 
                            required
                            rows={2}
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder={t('commentPlaceholder')}
                            className="bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-600 text-stone-750 font-medium"
                          />
                        </div>

                        <button 
                          type="submit"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2 px-4 rounded-xl shadow-sm transition self-end"
                        >
                          {t('publishReviewBtn')}
                        </button>
                      </form>

                    </div>
                  )}

                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* 🚀 Dynamic Checkout Page View */}
      {currentView === 'checkout' && (
        <div className="px-6 py-8 max-w-4xl mx-auto w-full animate-fade-in flex flex-col gap-6">
          <button 
            onClick={() => setCurrentView('catalog')}
            className="text-xs font-black text-stone-500 hover:text-emerald-600 transition flex items-center gap-1.5 self-start"
          >
            <ArrowLeft className="w-4 h-4" /> {t('backToCatalog')}
          </button>

          <div className="bg-white border border-stone-200/80 rounded-3xl p-6 md:p-8 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-8">
            
            {/* Left: Guest Billing details form */}
            <form onSubmit={handleCheckoutSubmit} className="md:col-span-7 flex flex-col gap-5">
              <div>
                <h3 className="font-black text-xl text-stone-850 mb-1">{t('checkoutTitle')}</h3>
                <p className="text-[11px] text-stone-450 font-semibold uppercase tracking-wider">{t('checkoutDesc')}</p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-stone-400 font-black uppercase tracking-wider">{t('fullNameLabel')}</label>
                <input 
                  type="text"
                  required
                  value={billingFullName}
                  onChange={(e) => setBillingFullName(e.target.value)}
                  placeholder="e.g. Karim Rahman"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs text-stone-800 font-bold focus:outline-none focus:border-emerald-600 transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-stone-400 font-black uppercase tracking-wider">{t('phoneLabel')}</label>
                <input 
                  type="tel"
                  required
                  value={billingPhone}
                  onChange={(e) => setBillingPhone(e.target.value)}
                  placeholder={t('phonePlaceholder')}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs text-stone-800 font-bold focus:outline-none focus:border-emerald-600 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-stone-400 font-black uppercase tracking-wider">{t('districtLabel')}</label>
                  <select
                    value={billingDistrict}
                    onChange={(e) => setBillingDistrict(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs text-stone-800 font-bold focus:outline-none focus:border-emerald-600 transition cursor-pointer"
                  >
                    <option value="Dhaka">{tDistrict('Dhaka', lang)}</option>
                    <option value="Rajshahi">{tDistrict('Rajshahi', lang)}</option>
                    <option value="Naogaon">{tDistrict('Naogaon', lang)}</option>
                    <option value="Chittagong">{tDistrict('Chittagong', lang)}</option>
                    <option value="Sylhet">{tDistrict('Sylhet', lang)}</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-stone-400 font-black uppercase tracking-wider">{t('deliverySlotLabel')}</label>
                  <select
                    value={billingDeliverySlot}
                    onChange={(e) => setBillingDeliverySlot(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs text-stone-800 font-bold focus:outline-none focus:border-emerald-600 transition cursor-pointer"
                  >
                    <option value="MORNING">{t('slotMorning')}</option>
                    <option value="AFTERNOON">{t('slotAfternoon')}</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-stone-400 font-black uppercase tracking-wider">{t('addressLabel')}</label>
                <textarea 
                  required
                  rows={2}
                  value={billingAddress}
                  onChange={(e) => setBillingAddress(e.target.value)}
                  placeholder={t('addressPlaceholder')}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs text-stone-800 font-medium focus:outline-none focus:border-emerald-600 transition"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-stone-400 font-black uppercase tracking-wider">{t('notesLabel')}</label>
                <textarea 
                  rows={1}
                  value={billingNotes}
                  onChange={(e) => setBillingNotes(e.target.value)}
                  placeholder={t('notesPlaceholder')}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-xs text-stone-800 font-medium focus:outline-none focus:border-emerald-600 transition"
                />
              </div>

              {/* Payment Gateways selection */}
              <div className="flex flex-col gap-2.5">
                <label className="text-[10px] text-stone-400 font-black uppercase tracking-wider">{t('paymentMethodLabel')}</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBillingPaymentGateway('COD')}
                    className={`py-3 rounded-2xl border text-xs font-black transition flex flex-col items-center gap-1 shadow-sm ${billingPaymentGateway === 'COD' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-stone-50 border-stone-200 text-stone-500'}`}
                  >
                    <span>{t('paymentCodTitle')}</span>
                    <span className="text-[8px] font-bold text-stone-400">{t('paymentCodDesc')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBillingPaymentGateway('BKASH')}
                    className={`py-3 rounded-2xl border text-xs font-black transition flex flex-col items-center gap-1 shadow-sm ${billingPaymentGateway === 'BKASH' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'bg-stone-50 border-stone-200 text-stone-500'}`}
                  >
                    <span>{t('paymentBkashTitle')}</span>
                    <span className="text-[8px] font-bold text-stone-400">{t('paymentBkashDesc')}</span>
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={checkoutLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-2xl text-xs shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5 mt-2 disabled:opacity-55 disabled:cursor-not-allowed"
              >
                {checkoutLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> {lang === 'bn' ? 'যাচাই ও অর্ডার প্রসেস হচ্ছে...' : 'Verification & checkout...'}
                  </>
                ) : (
                  <>
                    {t('confirmOrderBtn')} <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>

            {/* Right: Checkout Items summary calculation */}
            <div className="md:col-span-5 flex flex-col gap-5 border-l border-stone-200/80 pl-0 md:pl-8">
              <div>
                <h4 className="font-black text-base text-stone-850 mb-1">{t('basketSummaryTitle')}</h4>
                <p className="text-[10px] text-stone-400 font-extrabold uppercase">{t('basketSummaryDesc')}</p>
              </div>

              {/* Items List */}
              <div className="flex flex-col gap-3 max-h-[220px] overflow-y-auto pr-1">
                {items.map((item) => {
                  const productObj = products.find(p => p.id === item.productId || p.name === item.name);
                  const imageUrl = productObj?.imageUrl?.[0] || '/hero_ripe_mangoes.png';
                  return (
                    <div key={item.variantId} className="flex justify-between items-center gap-3 py-2 border-b border-stone-100 last:border-0">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-stone-100 overflow-hidden border border-stone-200/50 flex-shrink-0">
                          <img src={imageUrl} alt={tProductName(item.name, lang)} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <h5 className="font-extrabold text-xs text-stone-850 line-clamp-1">{tProductName(item.name, lang)}</h5>
                          <p className="text-[10px] text-stone-400 font-semibold">{item.weightKg} {t('kg')} {lang === 'bn' ? 'প্যাক' : 'Pack'} × {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-black text-xs text-stone-900 flex-shrink-0">
                        {item.price * item.quantity} BDT
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Applied Coupon view */}
              <div className="flex flex-col gap-1.5 border-t border-stone-100 pt-4">
                <label className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">{t('couponLabel')}</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder={t('couponPlaceholder')}
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-grow bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-1.5 text-xs text-stone-800 font-bold focus:outline-none focus:border-emerald-600"
                  />
                  <button 
                    type="button"
                    onClick={checkCoupon}
                    className="bg-stone-100 border border-stone-200 hover:bg-stone-200 text-stone-770 text-xs px-4 rounded-xl font-bold transition shadow-sm"
                  >
                    {t('couponApplyBtn')}
                  </button>
                </div>
                {appliedCoupon && (
                  <span className="text-emerald-600 font-bold text-[10px] mt-1 flex items-center gap-1">✓ {t('couponApplied').replace('{code}', appliedCoupon)}</span>
                )}
              </div>

              {/* Pricing ledger */}
              <div className="bg-stone-50 border border-stone-200/80 p-4 rounded-2xl flex flex-col gap-2.5 mt-2">
                <div className="flex justify-between text-xs text-stone-500 font-medium">
                  <span>{t('checkoutSubtotal')}</span>
                  <span className="font-bold text-stone-850">{getSubtotal()} BDT</span>
                </div>
                <div className="flex justify-between text-xs text-stone-500 font-medium">
                  <span>{t('checkoutDeliveryCharge')}</span>
                  <span className="font-bold text-stone-850">{getShippingCharge()} BDT</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600 font-bold">
                    <span>{t('checkoutCouponSaved')}</span>
                    <span>-{discountAmount} BDT</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-stone-850 pt-2 border-t border-stone-200/80">
                  <span>{t('checkoutTotal')}</span>
                  <span className="text-emerald-700 text-base">{getSubtotal() - discountAmount + getShippingCharge()} BDT</span>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 🚀 Right Side Slide-out Shopping Basket Drawer */}
      {cartOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm animate-fade-in flex justify-end">
          
          <div 
            onClick={() => setCartOpen(false)} 
            className="absolute inset-0 cursor-pointer"
          />

          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col gap-6 p-6 border-l border-stone-200 animate-slide-in">
            <div className="flex justify-between items-center border-b border-stone-100 pb-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-lg text-stone-850">{t('basketTitle')}</h3>
              </div>
              <button 
                onClick={() => setCartOpen(false)}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {items.length === 0 ? (
              <div className="flex-grow flex flex-col items-center justify-center text-center gap-4 text-stone-400">
                <span className="text-5xl">🛍️</span>
                <div>
                  <h4 className="font-bold text-sm text-stone-750">{t('basketEmpty')}</h4>
                  <p className="text-xs text-stone-500 font-medium mt-1">{t('basketEmptyDesc')}</p>
                </div>
                <button 
                  onClick={() => { setCartOpen(false); setCurrentView('catalog'); }}
                  className="bg-emerald-600 text-white font-extrabold text-xs px-6 py-2.5 rounded-xl transition hover:bg-emerald-700 shadow"
                >
                  {t('shopMangoes')}
                </button>
              </div>
            ) : (
              <div className="flex-grow flex flex-col justify-between gap-6 overflow-hidden">
                
                {/* Scrollable list */}
                <div className="flex-grow overflow-y-auto flex flex-col gap-4 pr-1">
                  {items.map((item) => {
                    const productObj = products.find(p => p.id === item.productId || p.name === item.name);
                    const imageUrl = productObj?.imageUrl?.[0] || '/hero_ripe_mangoes.png';
                    return (
                      <div 
                        key={item.variantId}
                        className="p-3.5 bg-stone-50 border border-stone-200/50 rounded-2xl flex justify-between items-center gap-4 shadow-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-stone-100 overflow-hidden border border-stone-200/30 flex-shrink-0">
                            <img src={imageUrl} alt={tProductName(item.name, lang)} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <h4 className="font-black text-xs text-stone-850 line-clamp-1">{tProductName(item.name, lang)}</h4>
                            <p className="text-[10px] text-stone-400 font-semibold mb-1">{item.weightKg} {t('kg')} {lang === 'bn' ? 'প্যাক' : 'Pack'}</p>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => updateQuantity(item.variantId, Math.max(1, item.quantity - 1))}
                                className="w-5 h-5 rounded bg-white border border-stone-200 flex items-center justify-center text-xs font-black hover:bg-stone-50 text-stone-700"
                              >
                                −
                              </button>
                              <span className="text-xs font-extrabold text-stone-800">{item.quantity}</span>
                              <button 
                                onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                                className="w-5 h-5 rounded bg-white border border-stone-200 flex items-center justify-center text-xs font-black hover:bg-stone-50 text-stone-700"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                      <div className="text-right flex flex-col items-end gap-2">
                        <span className="font-black text-xs text-stone-900">
                          {item.price * item.quantity} BDT
                        </span>
                        <button 
                          onClick={() => removeFromCart(item.variantId)}
                          className="text-stone-450 hover:text-red-500 p-1 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

                {/* Calculations ledger & CTA */}
                <div className="border-t border-stone-100 pt-4 flex flex-col gap-4 bg-white">
                  <div className="flex justify-between text-xs text-stone-500 font-bold bg-stone-50 p-4 rounded-xl shadow-sm">
                    <span>{lang === 'bn' ? 'কার্ট সাবটোটাল (মোট বিল):' : 'Cart Subtotal:'}</span>
                    <span className="text-stone-900 text-sm font-black">{getSubtotal()} BDT</span>
                  </div>

                  <button 
                    onClick={() => {
                      setCartOpen(false);
                      setCurrentView('checkout');
                    }}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition shadow shadow-emerald-500/10 hover:shadow-lg"
                  >
                    {lang === 'bn' ? 'গেস্ট চেকাউটে এগিয়ে যান' : 'Proceed to Guest Checkout'} <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* 🚀 Active toast message */}
      <Toast />

      {/* 🚀 Footer */}
      <footer className="border-t border-stone-200 bg-white py-12 px-6 text-center text-xs text-stone-500 mt-auto shadow-inner">
        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-left flex flex-col gap-1">
            <h4 className="font-extrabold text-sm text-stone-800">{t('footerBrand')}</h4>
            <p className="font-medium text-stone-450 leading-relaxed max-w-sm">
              {t('footerDesc')}
            </p>
          </div>
          <div className="text-right flex flex-col gap-1 items-end">
            <p className="font-bold text-stone-600">{t('footerContact')}</p>
            <p className="font-extrabold text-[10px] text-stone-400 uppercase tracking-widest mt-1">
              {t('footerLocations')}
            </p>
          </div>
        </div>
        <p className="text-[10px] text-stone-400 font-semibold border-t border-stone-100 pt-6 mt-6">
          {t('footerCopyright')}
        </p>
      </footer>

    </div>
  );
}
