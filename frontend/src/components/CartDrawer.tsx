import React from 'react';
import { PetSummary } from '../services/api';
import { CachedImage } from './CachedImage';
import { X, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';

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
      <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
        <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Your Adoption Cart</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {items.length} {items.length === 1 ? 'pet' : 'pets'} selected for adoption
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Items List */}
            <div className="p-6 flex-1 overflow-y-auto divide-y divide-slate-100">
              {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-2xl mb-4">
                    🛒
                  </div>
                  <h3 className="font-bold text-slate-800 text-base">Your cart is empty</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Browse our lovely available companions and give one a forever home!
                  </p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="py-4 flex gap-4 items-center">
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100">
                      <CachedImage
                        src={item.primary_image?.url}
                        contentHash={item.primary_image?.content_hash}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        showBadge={false}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-slate-900 truncate">{item.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{item.category_name} • {item.breed_name || 'Purebred'}</p>
                      <span className="text-sm font-extrabold text-indigo-600 block mt-1">
                        ${parseFloat(item.price).toFixed(2)}
                      </span>
                    </div>
                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Remove from cart"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Footer Summary & Concurrency Checkout */}
            {items.length > 0 && (
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 space-y-4">
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-medium text-slate-900">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Vet Check & Adoption Paperwork</span>
                    <span className="text-emerald-600 font-semibold">Included</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery / Pickup</span>
                    <span className="text-emerald-600 font-semibold">Free</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                    <span>Total</span>
                    <span className="text-indigo-600">${subtotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100/80 flex items-start gap-2 text-[11px] text-indigo-700">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Pessimistic Concurrency Lock:</strong> Your order will lock this pet exclusively at the database layer during checkout.
                  </span>
                </div>

                <button
                  onClick={onCheckout}
                  className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2"
                >
                  Proceed to Checkout <ArrowRight className="w-4 h-4" />
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
