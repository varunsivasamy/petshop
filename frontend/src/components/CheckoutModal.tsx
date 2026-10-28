import React, { useState } from 'react';
import { api, PetSummary, Order } from '../services/api';
import { X, CheckCircle2, HeartHandshake, CreditCard, Banknote, Heart, PackageCheck } from 'lucide-react';

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
  const [petAlreadyAdopted, setPetAlreadyAdopted] = useState<boolean>(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  const totalAmount = items.reduce((acc, it) => acc + parseFloat(it.price), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);
    setPetAlreadyAdopted(false);

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
        setPetAlreadyAdopted(true);
        setErrorMessage(
          'Someone just adopted this pet a moment ago! Please browse other adorable pets looking for a loving home.'
        );
      } else {
        setErrorMessage(err.data?.detail || err.message || 'Something went wrong while processing your request. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
          <div>
            <h3 className="text-xl font-black text-slate-900">
              {createdOrder ? 'Welcome to the Family!' : 'Adoption Application & Checkout'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {createdOrder ? 'Your adoption has been confirmed' : 'Provide your delivery details to finalize adoption'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-200/60 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confirmation Screen */}
        {createdOrder ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto shadow-rose">
              <HeartHandshake className="w-10 h-10" />
            </div>
            <h4 className="text-2xl font-black text-slate-900">Congratulations on Your New Friend!</h4>
            <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Your adoption has been officially registered. Our veterinarian team is preparing health records and starter care supplies for you.
            </p>
            <div className="p-5 bg-slate-50 rounded-2xl text-left text-xs space-y-2.5 border border-slate-100 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Adoption Reference:</span>
                <span className="font-extrabold text-slate-900">{createdOrder.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Payment Status:</span>
                <span className="font-bold text-emerald-600 uppercase">{createdOrder.payment_status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-semibold">Total Adoption Fee:</span>
                <span className="font-black text-rose-500">${parseFloat(createdOrder.total_amount).toFixed(2)}</span>
              </div>
              {createdOrder.tracking_number && (
                <div className="flex justify-between">
                  <span className="text-slate-500 font-semibold">Pet Transport Code:</span>
                  <span className="font-bold text-slate-800">{createdOrder.tracking_number}</span>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="mt-4 px-8 py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-rose transition-all"
            >
              Back to Catalog
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Friendly Adopted Alert */}
            {petAlreadyAdopted && (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                <Heart className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-sm font-bold text-amber-950 mb-0.5">
                    Pet Already Adopted
                  </strong>
                  {errorMessage}
                </div>
              </div>
            )}

            {/* General Error Banner */}
            {errorMessage && !petAlreadyAdopted && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {errorMessage}
              </div>
            )}

            {/* Recipient Details */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Adopter Details
              </h4>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="e.g. Sarah Jenkins"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Delivery Address</label>
                  <input
                    type="text"
                    required
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="e.g. 456 Oak Avenue"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={shippingCity}
                    onChange={(e) => setShippingCity(e.target.value)}
                    placeholder="e.g. Metropolis"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={shippingPostalCode}
                    onChange={(e) => setShippingPostalCode(e.target.value)}
                    placeholder="e.g. 62960"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={shippingPhone}
                    onChange={(e) => setShippingPhone(e.target.value)}
                    placeholder="e.g. +1 (555) 0199"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Special Pet Handover Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  placeholder="e.g. Please ring doorbell, quiet arrival preferred"
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm outline-none transition-all"
                />
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Payment Method
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    paymentMethod === 'CARD'
                      ? 'border-rose-500 bg-rose-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <CreditCard className={`w-5 h-5 mb-2 ${paymentMethod === 'CARD' ? 'text-rose-500' : 'text-slate-400'}`} />
                  <div>
                    <span className="block text-xs font-extrabold text-slate-900">Card Payment</span>
                    <span className="block text-[11px] text-slate-400">Instant Secure Checkout</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    paymentMethod === 'COD'
                      ? 'border-rose-500 bg-rose-50/50 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Banknote className={`w-5 h-5 mb-2 ${paymentMethod === 'COD' ? 'text-rose-500' : 'text-slate-400'}`} />
                  <div>
                    <span className="block text-xs font-extrabold text-slate-900">Pay on Handover</span>
                    <span className="block text-[11px] text-slate-400">Upon Pet Arrival</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-rose transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <PackageCheck className="w-5 h-5" />
                    Complete Adoption (${totalAmount.toFixed(2)})
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
