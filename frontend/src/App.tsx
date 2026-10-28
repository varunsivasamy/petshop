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
import { Search, Sparkles, ShieldCheck, Heart, Award, ArrowRight } from 'lucide-react';
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

  // Initial Data Load
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

  // Event Handlers
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
    loadInitialData();
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

  // Filter Pipeline
  const filteredPets = useMemo(() => {
    return pets.filter((pet) => {
      if (selectedCategorySlug !== 'all') {
        const cat = categories.find((c) => c.slug === selectedCategorySlug);
        if (cat && pet.category !== cat.id) return false;
      }
      if (genderFilter !== 'all' && pet.gender !== genderFilter) {
        return false;
      }
      if (sizeFilter !== 'all' && pet.size !== sizeFilter) {
        return false;
      }
      if (parseFloat(pet.price) > priceMax) {
        return false;
      }
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

  const getCategoryEmoji = (slug: string) => {
    switch (slug) {
      case 'dogs': return '🐶';
      case 'cats': return '🐱';
      case 'birds': return '🦜';
      case 'small-pets': return '🐰';
      default: return '🐾';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Navbar */}
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

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'ADMIN' ? (
          <OwnerDashboard categories={categories} onPetCreated={loadInitialData} />
        ) : (
          <div className="space-y-10 animate-fadeIn">
            {/* Hero Section */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-tr from-slate-900 via-slate-800 to-rose-950 text-white p-8 sm:p-14 shadow-2xl">
              <div className="relative z-10 max-w-2xl space-y-5">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-rose-200">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Ethical Breeding & Certified Adoptions
                </div>
                <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                  Find Your New Best Friend.
                </h1>
                <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-medium">
                  Welcome to PawHaven. Every companion is veterinarian health-certified, vaccinated, and ready to fill your home with unconditional love and joy.
                </p>
                <div className="pt-2 flex flex-wrap gap-5 text-xs font-bold text-slate-300">
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Complete Vet Health Check
                  </span>
                  <span className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" /> Purebred Certification
                  </span>
                  <span className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-400" /> Free 30-Day Starter Kit
                  </span>
                </div>
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedCategorySlug('all')}
                className={`py-3 px-6 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                  selectedCategorySlug === 'all'
                    ? 'bg-rose-500 text-white shadow-rose scale-102'
                    : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                All Companions ({pets.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategorySlug(cat.slug)}
                  className={`py-3 px-6 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-sm flex items-center gap-2 ${
                    selectedCategorySlug === cat.slug
                      ? 'bg-rose-500 text-white shadow-rose scale-102'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <span>{getCategoryEmoji(cat.slug)}</span>
                  <span>{cat.name}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      selectedCategorySlug === cat.slug ? 'bg-rose-700 text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {cat.pet_count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search & Filter Bar */}
            <div className="p-4 bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center gap-4">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by pet name, breed, or personality..."
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 text-xs font-medium outline-none transition-all"
                />
              </div>

              <div className="flex items-center gap-2.5 w-full md:w-auto">
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  className="py-3 px-3.5 rounded-2xl border border-slate-200 text-xs font-bold bg-white outline-none cursor-pointer text-slate-700"
                >
                  <option value="all">Any Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>

                <select
                  value={sizeFilter}
                  onChange={(e) => setSizeFilter(e.target.value)}
                  className="py-3 px-3.5 rounded-2xl border border-slate-200 text-xs font-bold bg-white outline-none cursor-pointer text-slate-700"
                >
                  <option value="all">Any Size</option>
                  <option value="SMALL">Small Size</option>
                  <option value="MEDIUM">Medium Size</option>
                  <option value="LARGE">Large Size</option>
                </select>

                <div className="flex items-center gap-2 px-3.5 py-2 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 font-semibold">
                  <span>Fee:</span>
                  <span className="font-black text-rose-500">${priceMax}</span>
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    step="50"
                    value={priceMax}
                    onChange={(e) => setPriceMax(Number(e.target.value))}
                    className="w-20 cursor-pointer accent-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* Catalog Grid */}
            {loading ? (
              <div className="py-24 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500 mb-3"></div>
                <p className="text-xs font-bold text-slate-400">Loading adorable companions...</p>
              </div>
            ) : filteredPets.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl border border-slate-100 p-8 space-y-3">
                <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto text-2xl">
                  🔍
                </div>
                <h3 className="font-black text-slate-900 text-lg">No companions found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Try adjusting your filters or price slider to see more available pets.
                </p>
                <button
                  onClick={() => {
                    setSelectedCategorySlug('all');
                    setSearchQuery('');
                    setGenderFilter('all');
                    setSizeFilter('all');
                    setPriceMax(2000);
                  }}
                  className="mt-3 py-2.5 px-5 rounded-2xl bg-rose-50 text-rose-600 font-bold text-xs hover:bg-rose-100 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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

      {/* Modern Friendly Footer */}
      <footer className="mt-20 bg-white border-t border-slate-100 py-12 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🐾</span>
              <span className="text-lg font-black text-slate-900">PawHaven Boutique</span>
            </div>
            <div className="flex gap-6 font-bold text-slate-600">
              <span className="hover:text-rose-500 cursor-pointer">Adoption Guide</span>
              <span className="hover:text-rose-500 cursor-pointer">Certified Veterinarians</span>
              <span className="hover:text-rose-500 cursor-pointer">Pet Care Tips</span>
              <span className="hover:text-rose-500 cursor-pointer">Customer Support</span>
            </div>
          </div>
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-400">
            <p>© 2026 PawHaven. Dedicated to loving homes and happy pets.</p>
            <p>100% Health Guarantee & Lifetime Adopter Support.</p>
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
