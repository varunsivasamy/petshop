import React, { useState, useEffect } from 'react';
import { api, Category, Order } from '../../services/api';
import { CachedImage } from '../CachedImage';
import { imageCache } from '../../services/imageCache';
import {
  DollarSign,
  Package,
  HeartHandshake,
  Users,
  Plus,
  Trash2,
  Upload,
  CheckCircle,
  Truck,
  HardDrive,
  RefreshCw,
  X,
  AlertCircle
} from 'lucide-react';

interface OwnerDashboardProps {
  categories: Category[];
  onPetCreated: () => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({ categories, onPetCreated }) => {
  const [activeTab, setActiveTab] = useState<'INVENTORY' | 'ORDERS' | 'ANALYTICS'>('INVENTORY');
  const [analytics, setAnalytics] = useState<any>(null);
  const [pets, setPets] = useState<any[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Pet Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<number>(categories[0]?.id || 1);
  const [newGender, setNewGender] = useState('MALE');
  const [newSize, setNewSize] = useState('MEDIUM');
  const [newAge, setNewAge] = useState(3);
  const [newPrice, setNewPrice] = useState('500.00');
  const [newDesc, setNewDesc] = useState('');
  const [newVaccinated, setNewVaccinated] = useState(true);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Cache stats
  const [cacheStats, setCacheStats] = useState(imageCache.getStats());

  const refreshData = async () => {
    setLoading(true);
    try {
      const [analyticsData, petsData, ordersData] = await Promise.all([
        api.getDashboardAnalytics(),
        api.listPets({ is_available: undefined }), // get all
        api.getAdminOrders(),
      ]);
      setAnalytics(analyticsData);
      setPets(petsData);
      setOrders(ordersData);
      setCacheStats(imageCache.getStats());
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleCreatePet = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const formData = new FormData();
      formData.append('name', newName);
      formData.append('category', String(newCategory));
      formData.append('gender', newGender);
      formData.append('size', newSize);
      formData.append('age_months', String(newAge));
      formData.append('price', newPrice);
      formData.append('description', newDesc);
      formData.append('is_vaccinated', String(newVaccinated));
      formData.append('is_available', 'true');
      formData.append('stock_quantity', '1');

      if (newImageFile) {
        formData.append('images', newImageFile);
      }

      await api.createPet(formData);
      setShowAddModal(false);
      // Reset
      setNewName('');
      setNewDesc('');
      setNewImageFile(null);
      refreshData();
      onPetCreated();
    } catch (err: any) {
      setFormError(err.data?.detail || err.message || 'Failed to create pet listing.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAvailability = async (petId: number, current: boolean) => {
    try {
      await api.updatePet(petId, { is_available: !current });
      refreshData();
      onPetCreated();
    } catch (err) {
      alert('Could not update status.');
    }
  };

  const handleDeletePet = async (petId: number) => {
    if (!confirm('Are you sure you want to remove this pet listing?')) return;
    try {
      await api.deletePet(petId);
      refreshData();
      onPetCreated();
    } catch (err) {
      alert('Could not delete pet.');
    }
  };

  const handleUpdateOrderStatus = async (orderId: number, newStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      refreshData();
    } catch (err) {
      alert('Could not update order status.');
    }
  };

  const handleClearCache = async () => {
    await imageCache.clearCache();
    setCacheStats(imageCache.getStats());
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Shop Owner Management Hub
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time analytics, inventory management, fulfillment pipeline & bandwidth health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Pet Listing
          </button>
          <button
            onClick={refreshData}
            className="p-2.5 text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors shadow-xs"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      {analytics?.overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Total Revenue</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              ${analytics.overview.total_revenue.toFixed(2)}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">
              {analytics.overview.total_orders} Completed Orders
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Available Pets</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {analytics.overview.available_pets}
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              Out of {analytics.overview.total_pets} listed
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Adopted Pets</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <HeartHandshake className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {analytics.overview.adopted_pets}
            </div>
            <span className="text-[11px] text-indigo-600 font-medium">Delivered to loving homes</span>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">Verified Real Users</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900">
              {analytics.overview.verified_customers}
            </div>
            <span className="text-[11px] text-purple-600 font-medium">
              100% Identity Authenticated
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('INVENTORY')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'INVENTORY'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Pet Inventory ({pets.length})
        </button>
        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'ORDERS'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Customer Orders ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`pb-3 text-sm font-bold transition-all relative ${
            activeTab === 'ANALYTICS'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Bandwidth & Local Cache Health
        </button>
      </div>

      {/* Tab 1: Inventory Table */}
      {activeTab === 'INVENTORY' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Pet Listing</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Health Check</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pets.map((pet) => (
                  <tr key={pet.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                          <CachedImage
                            src={pet.primary_image?.url}
                            contentHash={pet.primary_image?.content_hash}
                            alt={pet.name}
                            className="w-full h-full object-cover"
                            showBadge={false}
                          />
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 text-sm block">{pet.name}</span>
                          <span className="text-slate-500 text-[11px]">
                            {pet.breed_name || 'Purebred'} • {pet.gender} • {pet.age_months}m
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{pet.category_name}</td>
                    <td className="py-3 px-4 font-bold text-indigo-600 text-sm">
                      ${parseFloat(pet.price).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      {pet.is_vaccinated ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
                          <CheckCircle className="w-3 h-3" /> Vaccinated
                        </span>
                      ) : (
                        <span className="text-slate-400">Standard</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleAvailability(pet.id, pet.is_available)}
                        className={`px-2.5 py-1 rounded-full font-semibold transition-all ${
                          pet.is_available
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                      >
                        {pet.is_available ? 'Available' : 'Adopted / Sold'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeletePet(pet.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Orders Management */}
      {activeTab === 'ORDERS' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Order #</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Fulfillment Status</th>
                  <th className="py-3.5 px-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {ord.order_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block">{ord.recipient_name}</span>
                      <span className="text-slate-500 text-[11px]">{ord.customer_email}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ${parseFloat(ord.total_amount).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-md font-semibold text-[11px] bg-emerald-50 text-emerald-700">
                        {ord.payment_status} ({ord.payment_method})
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={ord.status}
                        onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                        className="py-1 px-2.5 rounded-lg border border-slate-200 text-xs font-semibold bg-white outline-none cursor-pointer focus:border-indigo-600"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="PROCESSING">PROCESSING</option>
                        <option value="SHIPPED">SHIPPED</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(ord.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Local Cache Bandwidth Diagnostics */}
      {activeTab === 'ANALYTICS' && (
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-indigo-600" /> Client-Side IndexedDB Bandwidth Monitor
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Demonstrates zero-bandwidth repeat visits: Media is stored locally on client browser storage after first retrieval.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-xs font-semibold text-slate-500">Cache Hits (Local Memory)</span>
              <div className="mt-1 text-2xl font-black text-emerald-600">{cacheStats.hits}</div>
              <span className="text-[11px] text-slate-400">Zero network bytes consumed</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-xs font-semibold text-slate-500">Initial Server Fetches</span>
              <div className="mt-1 text-2xl font-black text-indigo-600">{cacheStats.misses}</div>
              <span className="text-[11px] text-slate-400">Stored automatically into IndexedDB</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/60">
              <span className="text-xs font-semibold text-slate-500">Bandwidth Saved</span>
              <div className="mt-1 text-2xl font-black text-purple-600">
                {(cacheStats.bytesSaved / 1024).toFixed(1)} KB
              </div>
              <span className="text-[11px] text-slate-400">Conserved on user device</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Clear client local storage to observe cold cache fetch behavior:
            </span>
            <button
              onClick={handleClearCache}
              className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
            >
              Clear IndexedDB Cache
            </button>
          </div>
        </div>
      )}

      {/* Add Pet Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-lg font-extrabold text-slate-900">List New Pet for Adoption</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePet} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="p-3 text-xs rounded-xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pet Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Charlie"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-600 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="450.00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none bg-white"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="UNKNOWN">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Size</label>
                  <select
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none bg-white"
                  >
                    <option value="SMALL">Small</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LARGE">Large</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Age (Months)</label>
                  <input
                    type="number"
                    min="1"
                    value={newAge}
                    onChange={(e) => setNewAge(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Personality traits, habits, and background story..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-600"
                />
              </div>

              {/* Server-Side Upload with Local Caching */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Upload Pet Photo (Server Stored & SHA256 Hashed)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewImageFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="vacc"
                  checked={newVaccinated}
                  onChange={(e) => setNewVaccinated(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="vacc" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Veterinarian Health Checked & Vaccinated
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? 'Uploading & Hashing...' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
