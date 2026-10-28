import React, { useState, useEffect } from 'react';
import { api, Order } from '../services/api';
import { X, Package, Clock, CheckCircle2, Truck } from 'lucide-react';

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
      .catch((err) => console.error('Failed to load orders', err))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">Your Pet Adoptions</h3>
            <p className="text-xs text-slate-500 mt-0.5">Order fulfillment history and live tracking</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Orders List */}
        <div className="p-6 overflow-y-auto divide-y divide-slate-100 flex-1">
          {loading ? (
            <div className="py-12 text-center text-slate-400">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-2">
              <Package className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold">No adoptions placed yet</p>
              <p className="text-xs">Browse our available pets to find your new best friend!</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="py-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      {order.order_number}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-2">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-sm font-black text-indigo-600">
                    ${parseFloat(order.total_amount).toFixed(2)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 font-semibold">
                    <Truck className="w-3.5 h-3.5" /> Status: {order.status}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Payment: {order.payment_status}
                  </span>
                  {order.tracking_number && (
                    <span className="text-slate-500 font-mono text-[11px] bg-slate-100 px-2.5 py-1 rounded-full">
                      Tracking: {order.tracking_number}
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl">
                  Recipient: <strong className="text-slate-700">{order.recipient_name}</strong>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
