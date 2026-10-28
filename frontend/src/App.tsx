import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api, PetSummary, Category, User, Order } from './services/api';
import { Navbar } from './components/Navbar';
import { PetCard } from './components/PetCard';
import { PetDetailModal } from './components/PetDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { AuthModal } from './components/auth/AuthModal';
import { CustomerOrdersModal } from './components/CustomerOrdersModal';
import { OwnerDashboard } from './components/admin/OwnerDashboard';
import { Search, SlidersHorizontal, Sparkles, ShieldCheck, Heart, Layers } from 'lucide-react';
import './style.css';

export const App: React.FC = () => {
  // Authentication & Role State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'STORE' | 'ADMIN'>('STORE');

  // Domain Catalog State
  const [pets, setPets] = useState<PetSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter States
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [sizeFilter, setSizeFilter] = useState<string>('all');
  const [priceMax, setPriceMax] = useState<number>(2000);

  // Cart State
  const [cart, setCart] = useState<PetSummary[]>([]);

  // Modals & Panels State
  const [selectedPetId, setSelectedPetId] = useState<number | null>(null);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState<boolean>(false);

  // 1. Initial Load: Auth check and fetch categories & pets
  useEffect(() => {
    const savedUser = localStorage.getItem('user_profile');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('user_profile');
      }
    }

    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [cats, petList] = await Promise.all([
        api.listCategories(),
        api.listPets(),
      ]);
      setCategories(cats);
      setPets(petList);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Virtual DOM Optimized Event Handlers (useCallback)
  const handleSelectPet = useCallback((pet: PetSummary) => {
    setSelectedPetId(pet.id);
  }, []);

  const handleClosePetDetail = useCallback(() => {
    setSelectedPetId(null);
  }, []);

  const handleAddToCart = useCallback((pet: PetSummary) => {
    setCart((prev) => {
      if (prev.some((p) => p.id === pet.id)) return prev;
      return [...prev, pet];
    });
    setIsCartOpen(true);
  }, []);

  const handleRemoveFromCart = useCallback((petId: number) => {
    setCart((prev) => prev.filter((p) => p.id !== petId));
  }, []);

  const handleOpenCheckout = useCallback(() => {
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  }, [currentUser]);

  const handleOrderSuccess = useCallback((_order: Order) => {
    setCart([]);
    loadInitialData(); // Refresh catalog to reflect adopted status
  }, []);

  const handleAuthSuccess = useCallback((user: User) => {
    setCurrentUser(user);
    if (user.is_shop_owner) {
      setViewMode('ADMIN');
    }
  }, []);

  const handleLogout = useCallback(() => {
    api.logout();
    setCurrentUser(null);
    setViewMode('STORE');
  }, []);

  const handleToggleViewMode = useCallback((mode: 'STORE' | 'ADMIN') => {
    setViewMode(mode);
  }, []);

  // 3. Virtual DOM Optimization: Memoized Filter Pipeline
  const filteredPets = useMemo(() => {
    return pets.filter((pet) => {
      // Category filter
      if (selectedCategorySlug !== 'all') {
        const cat = categories.find((c) => c.slug === selectedCategorySlug);
        if (cat && pet.category !== cat.id) return false;
      }
      // Gender filter
      if (genderFilter !== 'all' && pet.gender !== genderFilter) {
        return false;
      }
      // Size filter
      if (sizeFilter !== 'all' && pet.size !== sizeFilter) {
        return false;
      }
      // Price filter
      if (parseFloat(pet.price) > priceMax) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = pet.name.toLowerCase().includes(q);
        const matchesCategory = pet.category_name?.toLowerCase().includes(q);
        const matchesBreed = pet.breed_name?.toLowerCase().includes(q);
        if (!matchesName && !matchesCategory && !matchesBreed) {
          return false;
        }
      }
      return true;
    });
  }, [pets, categories, selectedCategorySlug, genderFilter, sizeFilter, priceMax, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Navbar with Cache Indicator */}
      <Navbar
        currentUser={currentUser}
        cartCount={cart.length}
        viewMode={viewMode}
        onToggleViewMode={handleToggleViewMode}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenMyOrders={() => setIsOrdersOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'ADMIN' ? (
          /* Shop Owner Dashboard */
          <OwnerDashboard categories={categories} onPetCreated={loadInitialData} />
        ) : (
          /* Customer E-Commerce Storefront */
          <div className="space-y-8 animate-fadeIn">
            {/* Hero Banner */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 text-white p-8 sm:p-12 shadow-xl">
              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-indigo-200">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Ethical Breeding & Verified Adoption System
                </div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                  Find Your Forever Companion Today.
                </h1>
                <p className="text-sm sm:text-base text-indigo-100 leading-relaxed">
                  Every pet is veterinarian health-certified, microchipped, and vaccinated. Built with enterprise-grade backend architecture, concurrency protection, and zero-latency local caching.
                </p>
                <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-indigo-200">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Real-User Identity Verified
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-300" /> Pessimistic Lock Concurrency
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Heart className="w-4 h-4 text-rose-400" /> 100% Loving Care
                  </span>
                </div>
              </div>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedCategorySlug('all')}
                className={`py-2.5 px-5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-xs ${
                  selectedCategorySlug === 'all'
                    ? 'bg-indigo-600 text-white shadow-indigo-200'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                All Pets ({pets.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategorySlug(cat.slug)}
                  className={`py-2.5 px-5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-xs flex items-center gap-1.5 ${
                    selectedCategorySlug === cat.slug
                      ? 'bg-indigo-600 text-white shadow-indigo-200'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedCategorySlug === cat.slug ? 'bg-indigo-800 text-indigo-200' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {cat.pet_count}
                  </span>
                </button>
              ))}
            </div>

            {/* Filter & Search Bar */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center gap-4">
              {/* Search input */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by pet name, breed, or species..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              {/* Gender selector */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold bg-white outline-none cursor-pointer text-slate-700"
                >
                  <option value="all">Any Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>

                {/* Size selector */}
                <select
                  value={sizeFilter}
                  onChange={(e) => setSizeFilter(e.target.value)}
                  className="py-2.5 px-3 rounded-xl border border-slate-200 text-xs font-semibold bg-white outline-none cursor-pointer text-slate-700"
                >
                  <option value="all">Any Size</option>
                  <option value="SMALL">Small Size</option>
                  <option value="MEDIUM">Medium Size</option>
                  <option value="LARGE">Large Size</option>
                </select>

                {/* Price slider */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                  <span>Max:</span>
                  <span className="font-bold text-indigo-600">${priceMax}</span>
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    step="50"
                    value={priceMax}
                    onChange={(e) => setPriceMax(Number(e.target.value))}
                    className="w-20 cursor-pointer accent-indigo-600"
                  />
                </div>
              </div>
            </div>

            {/* Pets Grid (Virtual DOM Memoized Children) */}
            {loading ? (
              <div className="py-24 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                <p className="text-xs font-semibold text-slate-500">Loading pet companions...</p>
              </div>
            ) : filteredPets.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-slate-200/80 p-8 space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-2xl">
                  🔍
                </div>
                <h3 className="font-extrabold text-slate-900 text-base">No pet companions found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try adjusting your filters or price limit to see more available pets.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategorySlug('all');
                    setSearchQuery('');
                    setGenderFilter('all');
                    setSizeFilter('all');
                    setPriceMax(2000);
                  }}
                  className="mt-2 py-2 px-4 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs hover:bg-indigo-100 transition-colors"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPets.map((pet) => (
                  <PetCard
                    key={pet.id}
                    pet={pet}
                    onSelect={handleSelectPet}
                    onAddToCart={handleAddToCart}
                    isInCart={cart.some((c) => c.id === pet.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 PetShop Enterprise E-Commerce. Architected with SOLID Principles & Concurrency Control.</p>
          <div className="flex gap-4 font-semibold text-slate-600">
            <span>Django REST Framework</span>
            <span>•</span>
            <span>React Virtual DOM</span>
            <span>•</span>
            <span>IndexedDB Zero-Bandwidth Cache</span>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <PetDetailModal
        petId={selectedPetId}
        onClose={handleClosePetDetail}
        onAddToCart={handleAddToCart}
        isInCart={cart.some((c) => c.id === selectedPetId)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cart}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={handleOpenCheckout}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        items={cart}
        onOrderSuccess={handleOrderSuccess}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <CustomerOrdersModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
      />
    </div>
  );
};
