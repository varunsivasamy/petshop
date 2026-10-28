import React, { useState, useEffect } from 'react';
import { api, PetDetail } from '../services/api';
import { CachedImage } from './CachedImage';
import { X, ShieldCheck, Heart, Sparkles, CheckCircle2, Gift } from 'lucide-react';

interface PetDetailModalProps {
  petId: number | null;
  onClose: () => void;
  onAddToCart: (pet: any) => void;
  isInCart: boolean;
}

export const PetDetailModal: React.FC<PetDetailModalProps> = ({
  petId,
  onClose,
  onAddToCart,
  isInCart,
}) => {
  const [pet, setPet] = useState<PetDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [selectedHash, setSelectedHash] = useState<string>('');

  useEffect(() => {
    if (!petId) return;

    setLoading(true);
    api.getPet(petId)
      .then((data) => {
        setPet(data);
        if (data.images && data.images.length > 0) {
          const primary = data.images.find((i) => i.is_primary) || data.images[0];
          setSelectedImage(primary.image_url);
          setSelectedHash(primary.content_hash);
        } else if (data.primary_image) {
          setSelectedImage(data.primary_image.url);
          setSelectedHash(data.primary_image.content_hash);
        }
      })
      .finally(() => setLoading(false));
  }, [petId]);

  if (!petId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-y-auto border border-slate-100 flex flex-col md:flex-row">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2.5 text-slate-400 hover:text-slate-800 bg-white/90 hover:bg-white rounded-full backdrop-blur-md shadow-md transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="w-full h-96 flex items-center justify-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
          </div>
        ) : pet ? (
          <>
            {/* Gallery Column */}
            <div className="w-full md:w-1/2 p-6 bg-slate-50/70 flex flex-col justify-between border-r border-slate-100">
              <div className="relative aspect-square rounded-3xl overflow-hidden shadow-sm bg-white">
                <CachedImage
                  src={selectedImage}
                  contentHash={selectedHash}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Thumbnails */}
              {pet.images && pet.images.length > 1 && (
                <div className="mt-4 flex gap-2.5 overflow-x-auto pb-1">
                  {pet.images.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => {
                        setSelectedImage(img.image_url);
                        setSelectedHash(img.content_hash);
                      }}
                      className={`relative w-16 h-16 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                        selectedImage === img.image_url
                          ? 'border-rose-500 scale-105 shadow-sm'
                          : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <CachedImage
                        src={img.image_url}
                        contentHash={img.content_hash}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details Column */}
            <div className="w-full md:w-1/2 p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold tracking-wider uppercase text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-100">
                    {pet.category_name}
                  </span>
                  <span className="text-3xl font-black text-slate-900">
                    ${parseFloat(pet.price).toFixed(2)}
                  </span>
                </div>

                <h2 className="text-3xl font-black text-slate-900 mt-3">{pet.name}</h2>
                <p className="text-xs font-bold text-slate-400 mt-1">
                  {pet.breed_name || 'Purebred'} • {pet.age_months} Months Old • {pet.gender} • {pet.size} Size
                </p>

                <p className="text-sm text-slate-600 mt-4 leading-relaxed whitespace-pre-line">
                  {pet.description}
                </p>

                {/* Veterinary Health Check Record */}
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Complete Health & Care Verification
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 text-slate-700 font-semibold">
                      <CheckCircle2 className={`w-4 h-4 ${pet.is_vaccinated ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span>{pet.is_vaccinated ? 'Vaccinated' : 'Pending Vaccines'}</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 text-slate-700 font-semibold">
                      <CheckCircle2 className={`w-4 h-4 ${pet.is_microchipped ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span>{pet.is_microchipped ? 'Microchipped' : 'Standard ID'}</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 text-slate-700 font-semibold">
                      <CheckCircle2 className={`w-4 h-4 ${pet.is_neutered ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span>{pet.is_neutered ? 'Spayed / Neutered' : 'Intact'}</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 text-slate-700 font-semibold">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Purebred Certified</span>
                    </div>
                  </div>
                  {pet.health_notes && (
                    <p className="mt-3 text-xs text-slate-500 bg-slate-50 p-3.5 rounded-2xl italic border border-slate-100">
                      "{pet.health_notes}"
                    </p>
                  )}
                </div>

                {/* Adopter Perks */}
                <div className="mt-4 p-3.5 bg-rose-50/60 rounded-2xl border border-rose-100 flex items-center gap-3 text-xs text-rose-900">
                  <Gift className="w-5 h-5 text-rose-500 flex-shrink-0" />
                  <span>Includes Free Starter Food Kit, Collar & 30-Day Vet Care Guarantee</span>
                </div>
              </div>

              {/* Action */}
              <div className="mt-8 pt-6 border-t border-slate-100">
                <button
                  disabled={!pet.is_available || isInCart}
                  onClick={() => {
                    onAddToCart(pet);
                    onClose();
                  }}
                  className={`w-full py-4 px-6 rounded-2xl font-bold text-sm shadow-rose transition-all flex items-center justify-center gap-2 ${
                    !pet.is_available
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      : isInCart
                      ? 'bg-emerald-600 text-white cursor-default shadow-emerald-200'
                      : 'bg-rose-500 hover:bg-rose-600 text-white'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isInCart ? 'fill-white' : ''}`} />
                  {isInCart ? 'Already in Adoption Cart' : pet.is_available ? `Adopt ${pet.name} Today` : 'Pet Already Adopted'}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
