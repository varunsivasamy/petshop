import React from 'react';
import { User } from '../services/api';
import { ShoppingBag, ShieldCheck, User as UserIcon, LayoutDashboard, Store, LogOut, Heart } from 'lucide-react';

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
    return (
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => onToggleViewMode('STORE')}
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-rose-500 to-rose-400 text-white flex items-center justify-center text-2xl shadow-rose transition-transform group-hover:scale-105">
              🐾
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 block leading-tight">
                Paw<span className="text-rose-500">Haven</span>
              </span>
              <span className="text-[11px] font-semibold text-slate-400 block tracking-normal">
                Loving Homes For Healthy Pets
              </span>
            </div>
          </div>

          {/* Navigation & Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* View Mode Toggle for Shop Owners */}
            {currentUser?.is_shop_owner && (
              <div className="bg-slate-100/80 p-1 rounded-2xl flex items-center text-xs font-bold border border-slate-200/50">
                <button
                  onClick={() => onToggleViewMode('STORE')}
                  className={`py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-all ${
                    viewMode === 'STORE'
                      ? 'bg-white text-rose-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" /> Storefront
                </button>
                <button
                  onClick={() => onToggleViewMode('ADMIN')}
                  className={`py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-all ${
                    viewMode === 'ADMIN'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5" /> Shop Manager
                </button>
              </div>
            )}

            {/* Customer Orders Shortcut */}
            {currentUser && !currentUser.is_shop_owner && (
              <button
                onClick={onOpenMyOrders}
                className="py-2.5 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition-all border border-slate-200/60 flex items-center gap-1.5"
              >
                <Heart className="w-3.5 h-3.5 text-rose-500" /> My Adoptions
              </button>
            )}

            {/* Cart Button */}
            {viewMode === 'STORE' && (
              <button
                onClick={onOpenCart}
                className="relative p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition-all"
                title="View Adoption Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[11px] font-black flex items-center justify-center shadow-md animate-scaleUp">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Auth Button or User Profile */}
            {currentUser ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="flex items-center gap-1.5 justify-end">
                    <span className="text-xs font-bold text-slate-900">
                      {currentUser.first_name || currentUser.username}
                    </span>
                    {currentUser.is_verified && (
                      <span title="Verified Member" className="inline-flex">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 font-semibold block capitalize">
                    {currentUser.is_shop_owner ? 'Store Owner' : 'Verified Adopter'}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-2.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-all"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="py-2.5 px-5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-rose transition-all flex items-center gap-2"
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
