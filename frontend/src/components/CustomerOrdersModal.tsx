import React, { useState, useEffect } from 'react';
import { api, Order } from '../services/api';
import { X, Heart, CheckCircle2, Truck } from 'lucide-react';

interface CustomerOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomerOrdersModal: React.FC<CustomerOrdersModalProps> = ({ isOpen, onClose }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    api.getCustomerOrders()
      .then(setOrders)
      .catch((err) => console.error('Failed to load adoptions', err))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" /> My Pet Adoptions
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Your adoption journey & pet arrival status</p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-200/60 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Adoptions List */}
        <div className="p-6 overflow-y-auto divide-y divide-slate-100 flex-1">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading adoptions...</div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center text-2xl mx-auto">
                🐾
              </div>
              <p className="text-sm font-bold text-slate-800">No adoptions yet</p>
              <p className="text-xs text-slate-400">Your future furry, feathered, or cuddly friend is waiting for you!</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="py-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900">
                      Adoption Ref: {order.order_number}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-2">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-base font-black text-rose-500">
                    ${parseFloat(order.total_amount).toFixed(2)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-100">
                    <Truck className="w-3.5 h-3.5 text-rose-500" /> Status: {order.status}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-100">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Payment: {order.payment_status}
                  </span>
                  {order.tracking_number && (
                    <span className="text-slate-600 text-xs bg-slate-100 px-3 py-1 rounded-full font-medium">
                      Transport ID: {order.tracking_number}
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-500 bg-slate-50 p-3.5 rounded-2xl">
                  Delivering to: <strong className="text-slate-800">{order.recipient_name}</strong>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
