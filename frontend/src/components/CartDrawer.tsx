import React from 'react';
import { PetSummary } from '../services/api';
import { CachedImage } from './CachedImage';
import { X, Trash2, ArrowRight, ShieldCheck, Heart } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: PetSummary[];
  onRemoveItem: (petId: number) => void;
  onCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = React.memo(
  ({ isOpen, onClose, items, onRemoveItem, onCheckout }) => {
    if (!isOpen) return null;

    const subtotal = items.reduce((acc, item) => acc + parseFloat(item.price), 0);

    return (
      <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/50 backdrop-blur-sm animate-fadeIn">
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between animate-slideRight">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500 fill-rose-500" /> Adoption Cart
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {items.length} {items.length === 1 ? 'companion' : 'companions'} ready to join your family
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-100 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items List */}
            <div className="p-6 flex-1 overflow-y-auto divide-y divide-slate-100">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-20 h-20 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center text-3xl mb-4 shadow-sm">
                    🐾
                  </div>
                  <h3 className="font-extrabold text-slate-800 text-lg">Your cart is empty</h3>
                  <p className="text-xs text-slate-400 mt-1.5 max-w-xs leading-relaxed">
                    Explore our available companions and find the perfect friend to bring home!
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="py-4.5 flex gap-4 items-center">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100 shadow-sm">
                      <CachedImage
                        src={item.primary_image?.url}
                        contentHash={item.primary_image?.content_hash}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-sm text-slate-900 truncate">{item.name}</h4>
                      <p className="text-xs font-medium text-slate-400 mt-0.5">
                        {item.category_name} • {item.breed_name || 'Purebred'}
                      </p>
                      <span className="text-sm font-black text-rose-500 block mt-1.5">
                        ${parseFloat(item.price).toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="p-2.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-all"
                      title="Remove from cart"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary & Checkout */}
            {items.length > 0 && (
              <div className="p-6 border-t border-slate-100 bg-slate-50/60 space-y-4">
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Adoption Fee</span>
                    <span className="font-bold text-slate-900">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vet Checkup & Microchip Registration</span>
                    <span className="text-emerald-600 font-bold">Complimentary</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Safe Pet Transportation</span>
                    <span className="text-emerald-600 font-bold">Free</span>
                  </div>
                  <div className="flex justify-between text-lg font-black text-slate-900 pt-3 border-t border-slate-200">
                    <span>Total</span>
                    <span className="text-rose-500">${subtotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-100 flex items-start gap-2.5 text-xs text-rose-900">
                  <ShieldCheck className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Adoption Hold:</strong> Completing this step reserves your chosen pet exclusively for your family.
                  </span>
                </div>

                <button
                  onClick={onCheckout}
                  className="w-full py-4 px-6 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-rose transition-all flex items-center justify-center gap-2"
                >
                  Proceed to Adoption <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

CartDrawer.displayName = 'CartDrawer';
