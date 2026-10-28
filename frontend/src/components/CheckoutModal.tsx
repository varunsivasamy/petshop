import React, { useState } from 'react';
import { api, PetSummary, Order } from '../services/api';
import { X, CheckCircle2, AlertTriangle, CreditCard, Banknote, ShieldAlert, PackageCheck } from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: PetSummary[];
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  items,
  onOrderSuccess,
}) => {
  const [recipientName, setRecipientName] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingPostalCode, setShippingPostalCode] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CARD' | 'COD'>('CARD');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [concurrencyConflict, setConcurrencyConflict] = useState<boolean>(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  const totalAmount = items.reduce((acc, it) => acc + parseFloat(it.price), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setConcurrencyConflict(false);

    try {
      const payload = {
        items: items.map((i) => ({ pet_id: i.id, quantity: 1 })),
        payment_method: paymentMethod,
        recipient_name: recipientName || 'Adopting Family',
        shipping_address: shippingAddress || '100 Pet Lane',
        shipping_city: shippingCity || 'Metropolis',
        shipping_postal_code: shippingPostalCode || '10001',
        shipping_phone: shippingPhone || '555-0100',
        delivery_notes: deliveryNotes,
      };

      const order = await api.checkout(payload);
      setCreatedOrder(order);
      onOrderSuccess(order);
    } catch (err: any) {
      if (err.status === 409 || err.message?.includes('adopted') || err.message?.includes('available')) {
        setConcurrencyConflict(true);
        setErrorMessage(
          err.data?.detail || err.message || 'Another buyer simultaneously adopted this pet! The pessimistic database lock prevented double selling.'
        );
      } else {
        setErrorMessage(err.data?.detail || err.message || 'An error occurred during checkout.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-extrabold text-slate-900">
              {createdOrder ? 'Order Confirmed!' : 'Adoption Checkout'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {createdOrder ? 'Your new pet companion is on the way' : 'Enter shipping details & confirm payment method'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Screen */}
        {createdOrder ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-xl font-extrabold text-slate-900">Adoption Successfully Placed!</h4>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Your transaction has been authorized and the pet inventory has been atomically locked and updated.
            </p>
            <div className="p-4 bg-slate-50 rounded-2xl text-left text-xs space-y-2 border border-slate-100 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-500">Order Number:</span>
                <span className="font-bold text-slate-900">{createdOrder.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Payment Status:</span>
                <span className="font-semibold text-emerald-600 uppercase">{createdOrder.payment_status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Paid:</span>
                <span className="font-extrabold text-indigo-600">${parseFloat(createdOrder.total_amount).toFixed(2)}</span>
              </div>
              {createdOrder.tracking_number && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Tracking Code:</span>
                  <span className="font-mono font-medium text-slate-700">{createdOrder.tracking_number}</span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all"
            >
              Back to Catalog
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Concurrency Error Banner */}
            {concurrencyConflict && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-sm font-bold text-rose-900 mb-1">
                    Concurrency Race Condition Handled (409 Conflict)
                  </strong>
                  {errorMessage}
                  <p className="mt-2 text-rose-700">
                    The database row-level lock (`select_for_update`) prevented duplicate adoption. Please choose another wonderful companion from our catalog!
                  </p>
                </div>
              </div>
            )}

            {/* General Error Banner */}
            {errorMessage && !concurrencyConflict && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Recipient & Shipping */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Adopter & Shipping Details
              </h4>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="e.g. 456 Oak Avenue"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={shippingCity}
                    onChange={(e) => setShippingCity(e.target.value)}
                    placeholder="e.g. Metropolis"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={shippingPostalCode}
                    onChange={(e) => setShippingPostalCode(e.target.value)}
                    placeholder="e.g. 62960"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={shippingPhone}
                    onChange={(e) => setShippingPhone(e.target.value)}
                    placeholder="e.g. +1 555-0199"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Special Care / Delivery Instructions</label>
                <textarea
                  rows={2}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="e.g. Please ring doorbell, have pet carrier ready"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 text-sm outline-none transition-all"
                />
              </div>
            </div>

            {/* Payment Method (Open/Closed Principle Strategy) */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Payment Method (Strategy Pattern)
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    paymentMethod === 'CARD'
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <CreditCard className={`w-5 h-5 mb-2 ${paymentMethod === 'CARD' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <div>
                    <span className="block text-xs font-bold text-slate-900">Card Payment</span>
                    <span className="block text-[11px] text-slate-500">Instant Authorization</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Banknote className={`w-5 h-5 mb-2 ${paymentMethod === 'COD' ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <div>
                    <span className="block text-xs font-bold text-slate-900">Cash On Delivery</span>
                    <span className="block text-[11px] text-slate-500">Pay Upon Vet Handover</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Checkout Action */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xl hover:shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <PackageCheck className="w-5 h-5" />
                    Confirm & Complete Checkout (${totalAmount.toFixed(2)})
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
