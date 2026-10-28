import React, { useState, useEffect } from 'react';
import { api, Category, Order } from '../../services/api';
import { CachedImage } from '../CachedImage';
import {
  DollarSign,
  Heart,
  Users,
  Plus,
  Trash2,
  CheckCircle,
  RefreshCw,
  X,
  AlertCircle,
  ShoppingBag,
  Sparkles
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

  const refreshData = async () => {
    setLoading(true);
    try {
      const [analyticsData, petsData, ordersData] = await Promise.all([
        api.getDashboardAnalytics(),
        api.listPets({ is_available: undefined }),
        api.getAdminOrders(),
      ]);
      setAnalytics(analyticsData);
      setPets(petsData);
      setOrders(ordersData);
    } catch (err) {
      console.error('Failed to load store data:', err);
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
      setNewName('');
      setNewDesc('');
      setNewImageFile(null);
      refreshData();
      onPetCreated();
    } catch (err: any) {
      setFormError(err.data?.detail || err.message || 'Failed to list pet.');
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

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Shop Manager Portal
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Manage your pet listings, adoption requests, and store performance
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="py-3 px-5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-rose transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Pet Listing
          </button>
          <button
            onClick={refreshData}
            className="p-3 text-slate-600 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl transition-all shadow-xs"
            title="Refresh Store Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      {analytics?.overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Total Revenue</span>
              <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="mt-2 text-3xl font-black text-slate-900">
              ${analytics.overview.total_revenue.toFixed(2)}
            </div>
            <span className="text-xs text-emerald-600 font-bold mt-1 block">
              {analytics.overview.total_orders} Completed Adoptions
            </span>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Available Pets</span>
              <div className="w-9 h-9 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
                <Heart className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="mt-2 text-3xl font-black text-slate-900">
              {analytics.overview.available_pets}
            </div>
            <span className="text-xs text-slate-400 font-medium mt-1 block">
              Ready for loving homes
            </span>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Adopted Pets</span>
              <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center">
                <Sparkles className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="mt-2 text-3xl font-black text-slate-900">
              {analytics.overview.adopted_pets}
            </div>
            <span className="text-xs text-amber-600 font-bold mt-1 block">
              Happily welcomed home
            </span>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400">Pet Lovers Joined</span>
              <div className="w-9 h-9 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Users className="w-4.5 h-4.5" />
              </div>
            </div>
            <div className="mt-2 text-3xl font-black text-slate-900">
              {analytics.overview.verified_customers}
            </div>
            <span className="text-xs text-purple-600 font-bold mt-1 block">
              Registered Adopters
            </span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200/80 gap-8">
        <button
          onClick={() => setActiveTab('INVENTORY')}
          className={`pb-4 text-sm font-bold transition-all relative ${
            activeTab === 'INVENTORY'
              ? 'text-rose-600 border-b-2 border-rose-500'
              : 'text-slate-400 hover:text-slate-800'
          }`}
        >
          Pet Inventory ({pets.length})
        </button>
        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`pb-4 text-sm font-bold transition-all relative ${
            activeTab === 'ORDERS'
              ? 'text-rose-600 border-b-2 border-rose-500'
              : 'text-slate-400 hover:text-slate-800'
          }`}
        >
          Adoption Requests ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`pb-4 text-sm font-bold transition-all relative ${
            activeTab === 'ANALYTICS'
              ? 'text-rose-600 border-b-2 border-rose-500'
              : 'text-slate-400 hover:text-slate-800'
          }`}
        >
          Store Insights & Demographics
        </button>
      </div>

      {/* Tab 1: Inventory Table */}
      {activeTab === 'INVENTORY' && (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-5">Pet Companion</th>
                  <th className="py-4 px-5">Category</th>
                  <th className="py-4 px-5">Adoption Fee</th>
                  <th className="py-4 px-5">Veterinary Check</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pets.map((pet) => (
                  <tr key={pet.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3.5">
                        <div className="w-13 h-13 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 shadow-xs">
                          <CachedImage
                            src={pet.primary_image?.url}
                            contentHash={pet.primary_image?.content_hash}
                            alt={pet.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <span className="font-extrabold text-slate-900 text-sm block">{pet.name}</span>
                          <span className="text-slate-400 text-xs font-semibold">
                            {pet.breed_name || 'Purebred'} • {pet.gender} • {pet.age_months} Months
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 font-bold text-slate-700">{pet.category_name}</td>
                    <td className="py-4 px-5 font-black text-rose-500 text-sm">
                      ${parseFloat(pet.price).toFixed(2)}
                    </td>
                    <td className="py-4 px-5">
                      {pet.is_vaccinated ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl font-bold border border-emerald-100">
                          <CheckCircle className="w-3.5 h-3.5" /> Vet Certified
                        </span>
                      ) : (
                        <span className="text-slate-400 font-semibold">Standard Care</span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <button
                        onClick={() => handleToggleAvailability(pet.id, pet.is_available)}
                        className={`px-3 py-1.5 rounded-full font-bold text-xs transition-all ${
                          pet.is_available
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {pet.is_available ? 'Available' : 'Adopted'}
                      </button>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => handleDeletePet(pet.id)}
                        className="p-2.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-all"
                        title="Remove Listing"
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
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/60 text-slate-400 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-4 px-5">Adoption Ref</th>
                  <th className="py-4 px-5">Adopting Family</th>
                  <th className="py-4 px-5">Total Fee</th>
                  <th className="py-4 px-5">Payment Method</th>
                  <th className="py-4 px-5">Fulfillment Stage</th>
                  <th className="py-4 px-5">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-5 font-bold text-slate-900">
                      {ord.order_number}
                    </td>
                    <td className="py-4 px-5">
                      <span className="font-extrabold text-slate-900 block">{ord.recipient_name}</span>
                      <span className="text-slate-400 text-[11px]">{ord.customer_email}</span>
                    </td>
                    <td className="py-4 px-5 font-black text-rose-500 text-sm">
                      ${parseFloat(ord.total_amount).toFixed(2)}
                    </td>
                    <td className="py-4 px-5">
                      <span className="inline-block px-2.5 py-1 rounded-xl font-bold text-xs bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {ord.payment_status} ({ord.payment_method})
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <select
                        value={ord.status}
                        onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                        className="py-1.5 px-3 rounded-xl border border-slate-200 text-xs font-bold bg-white outline-none cursor-pointer focus:border-rose-500"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="PROCESSING">PREPARING PET</option>
                        <option value="SHIPPED">IN TRANSIT</option>
                        <option value="DELIVERED">WELCOMED HOME</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>
                    <td className="py-4 px-5 text-slate-400 font-medium">
                      {new Date(ord.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Store Insights & Demographics */}
      {activeTab === 'ANALYTICS' && (
        <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div>
            <h3 className="text-xl font-black text-slate-900">
              Adoption Insights & Pet Demographics
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Breakdown of popular pet categories and adoption trends across our community
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics?.category_breakdown?.map((cat: any) => (
              <div key={cat.name} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">{cat.name}</span>
                <div className="text-2xl font-black text-slate-900">{cat.total_count} Pets</div>
                <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-200/50">
                  <span>Available: <strong className="text-emerald-600">{cat.available_count}</strong></span>
                  <span>Adopted: <strong className="text-rose-500">{cat.sold_count}</strong></span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-6 bg-rose-50/50 rounded-2xl border border-rose-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center text-2xl shadow-rose">
              🐾
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">100% Loving Homes Policy</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Every listed pet receives 30-day veterinary checkup coverage, microchip registration, and an adoption care package.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add Pet Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <h3 className="text-lg font-black text-slate-900">List New Pet Companion</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 text-slate-400 hover:text-slate-800 rounded-full hover:bg-slate-200 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePet} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {formError && (
                <div className="p-3.5 text-xs rounded-2xl bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pet Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Charlie"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none bg-white font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Adoption Fee ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="450.00"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm outline-none font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender</label>
                  <select
                    value={newGender}
                    onChange={(e) => setNewGender(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 text-xs outline-none bg-white font-semibold"
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="UNKNOWN">Unknown</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Size</label>
                  <select
                    value={newSize}
                    onChange={(e) => setNewSize(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 text-xs outline-none bg-white font-semibold"
                  >
                    <option value="SMALL">Small</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LARGE">Large</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Age (Months)</label>
                  <input
                    type="number"
                    min="1"
                    value={newAge}
                    onChange={(e) => setNewAge(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-2xl border border-slate-200 text-xs outline-none font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Story & Personality</label>
                <textarea
                  rows={3}
                  required
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Personality traits, habits, and what makes this pet special..."
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Upload Photo
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setNewImageFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-rose-50 file:text-rose-600 hover:file:bg-rose-100 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="vacc"
                  checked={newVaccinated}
                  onChange={(e) => setNewVaccinated(e.target.checked)}
                  className="rounded text-rose-500 focus:ring-rose-500 w-4 h-4"
                />
                <label htmlFor="vacc" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Veterinarian Health Certified & Vaccinated
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 px-6 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm shadow-rose transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish Pet Listing'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
