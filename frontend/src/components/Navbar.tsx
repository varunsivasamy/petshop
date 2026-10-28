import React, { useState, useEffect } from 'react';
import { User } from '../services/api';
import { imageCache } from '../services/imageCache';
import { ShoppingBag, ShieldCheck, User as UserIcon, LayoutDashboard, Store, HardDrive, LogOut } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  cartCount: number;
  viewMode: 'STORE' | 'ADMIN';
  onToggleViewMode: (mode: 'STORE' | 'ADMIN') => void;
  onOpenCart: () => void;
  onOpenAuth: () => void;
  onOpenMyOrders: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = React.memo(
  ({
    currentUser,
    cartCount,
    viewMode,
    onToggleViewMode,
    onOpenCart,
    onOpenAuth,
    onOpenMyOrders,
    onLogout,
  }) => {
    const [cacheStats, setCacheStats] = useState(imageCache.getStats());

    useEffect(() => {
      const interval = setInterval(() => {
        setCacheStats(imageCache.getStats());
      }, 2000);
      return () => clearInterval(interval);
    }, []);

    return (
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onToggleViewMode('STORE')}>
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-xl shadow-md shadow-indigo-200">
              🐾
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 block leading-tight">
                PetShop<span className="text-indigo-600">.Enterprise</span>
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                SOLID • Concurrency • Zero-Bandwidth Cache
              </span>
            </div>
          </div>

          {/* Navigation & Controls */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Cache Bandwidth Pill */}
            <div
              title={`IndexedDB Image Cache: ${cacheStats.hits} cache hits, ${(cacheStats.bytesSaved / 1024).toFixed(1)} KB bandwidth saved`}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold"
            >
              <HardDrive className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Local Cache: <strong className="text-emerald-700">{cacheStats.hits} Hits</strong> ({(cacheStats.bytesSaved / 1024).toFixed(0)} KB saved)
              </span>
            </div>

            {/* View Mode Toggle for Shop Owners */}
            {currentUser?.is_shop_owner && (
              <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold">
                <button
                  onClick={() => onToggleViewMode('STORE')}
                  className={`py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all ${
                    viewMode === 'STORE'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" /> Storefront
                </button>
                <button
                  onClick={() => onToggleViewMode('ADMIN')}
                  className={`py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all ${
                    viewMode === 'ADMIN'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" /> Owner Admin
                </button>
              </div>
            )}

            {/* Customer Orders Shortcut */}
            {currentUser && !currentUser.is_shop_owner && (
              <button
                onClick={onOpenMyOrders}
                className="py-2 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
              >
                My Adoptions
              </button>
            )}

            {/* Cart Button */}
            {viewMode === 'STORE' && (
              <button
                onClick={onOpenCart}
                className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                title="View Adoption Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 text-white text-[11px] font-extrabold flex items-center justify-center shadow-md animate-scaleUp">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Auth Dropdown / Button */}
            {currentUser ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="flex items-center gap-1 justify-end">
                    <span className="text-xs font-bold text-slate-900">{currentUser.first_name || currentUser.username}</span>
                    <span title="Verified Real User" className="inline-flex">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium block">
                    {currentUser.role}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 transition-all flex items-center gap-1.5"
              >
                <UserIcon className="w-4 h-4" /> Sign In
              </button>
            )}
          </div>
        </div>
      </header>
    );
  }
);

Navbar.displayName = 'Navbar';
