import React, { useState, useEffect } from 'react';
import { api, PetDetail } from '../services/api';
import { CachedImage } from './CachedImage';
import { X, ShieldCheck, Heart, Sparkles, CheckCircle2 } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-y-auto border border-slate-100 flex flex-col md:flex-row">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-slate-700 bg-white/80 hover:bg-white rounded-full backdrop-blur-md shadow-sm transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {loading ? (
          <div className="w-full h-96 flex items-center justify-center text-slate-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : pet ? (
          <>
            {/* Gallery Column */}
            <div className="w-full md:w-1/2 p-6 bg-slate-50/50 flex flex-col justify-between border-r border-slate-100">
              <div className="relative aspect-square rounded-2xl overflow-hidden shadow-inner bg-slate-100">
                <CachedImage
                  src={selectedImage}
                  contentHash={selectedHash}
                  alt={pet.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Thumbnails */}
              {pet.images && pet.images.length > 1 && (
                <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
                  {pet.images.map((img) => (
                    <button
                      key={img.id}
                      onClick={() => {
                        setSelectedImage(img.image_url);
                        setSelectedHash(img.content_hash);
                      }}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                        selectedImage === img.image_url
                          ? 'border-indigo-600 scale-105'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <CachedImage
                        src={img.image_url}
                        contentHash={img.content_hash}
                        alt="Thumbnail"
                        className="w-full h-full object-cover"
                        showBadge={false}
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
                  <span className="text-xs font-bold tracking-wider uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                    {pet.category_name}
                  </span>
                  <span className="text-2xl font-black text-slate-900">
                    ${parseFloat(pet.price).toFixed(2)}
                  </span>
                </div>

                <h2 className="text-2xl font-extrabold text-slate-900 mt-3">{pet.name}</h2>
                <p className="text-sm font-medium text-slate-500 mt-1">
                  {pet.breed_name || 'Purebred'} • {pet.age_months} Months Old • {pet.gender} • {pet.size} Size
                </p>

                <p className="text-sm text-slate-600 mt-4 leading-relaxed whitespace-pre-line">
                  {pet.description}
                </p>

                {/* Health & Medical Badges */}
                <div className="mt-6 pt-5 border-t border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Veterinary Health Record
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 text-slate-700">
                      <CheckCircle2 className={`w-4 h-4 ${pet.is_vaccinated ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span>{pet.is_vaccinated ? 'Fully Vaccinated' : 'Pending Vaccines'}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 text-slate-700">
                      <CheckCircle2 className={`w-4 h-4 ${pet.is_microchipped ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span>{pet.is_microchipped ? 'Microchipped' : 'Standard ID'}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 text-slate-700">
                      <CheckCircle2 className={`w-4 h-4 ${pet.is_neutered ? 'text-emerald-600' : 'text-slate-300'}`} />
                      <span>{pet.is_neutered ? 'Neutered / Spayed' : 'Intact'}</span>
                    </div>
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 text-slate-700">
                      <Sparkles className="w-4 h-4 text-indigo-500" />
                      <span>Certified Breeder</span>
                    </div>
                  </div>
                  {pet.health_notes && (
                    <p className="mt-3 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl italic">
                      "{pet.health_notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Action */}
              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center gap-3">
                <button
                  disabled={!pet.is_available || isInCart}
                  onClick={() => {
                    onAddToCart(pet);
                    onClose();
                  }}
                  className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
                    !pet.is_available
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : isInCart
                      ? 'bg-emerald-600 text-white cursor-default'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-indigo-200'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${isInCart ? 'fill-white' : ''}`} />
                  {isInCart ? 'Already In Adoption Cart' : pet.is_available ? 'Adopt This Pet Now' : 'Pet Already Adopted'}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
