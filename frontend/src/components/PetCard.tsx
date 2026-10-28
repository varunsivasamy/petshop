import React from 'react';
import { PetSummary } from '../services/api';
import { CachedImage } from './CachedImage';
import { ShieldCheck, Heart, ArrowRight } from 'lucide-react';

interface PetCardProps {
  pet: PetSummary;
  onSelect: (pet: PetSummary) => void;
  onAddToCart: (pet: PetSummary) => void;
  isInCart: boolean;
}

/**
 * Pure PetCard component wrapped in React.memo.
 * Only re-renders if pet id, price, availability, or isInCart changes.
 * Avoids re-rendering when other child components or parent state update.
 */
export const PetCard: React.FC<PetCardProps> = React.memo(
  ({ pet, onSelect, onAddToCart, isInCart }) => {
    return (
      <div className="group bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 flex flex-col overflow-hidden">
        {/* Media Container with Local Storage Cache Optimization */}
        <div className="relative aspect-[4/3] w-full overflow-hidden cursor-pointer" onClick={() => onSelect(pet)}>
          <CachedImage
            src={pet.primary_image?.url}
            contentHash={pet.primary_image?.content_hash}
            alt={pet.name}
            className="w-full h-full group-hover:scale-105 transition-transform duration-500"
          />

          {/* Availability Pill */}
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm backdrop-blur-md ${
                pet.is_available
                  ? 'bg-emerald-500/90 text-white'
                  : 'bg-rose-500/90 text-white'
              }`}
            >
              {pet.is_available ? 'Available' : 'Adopted'}
            </span>
            {pet.is_featured && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/90 text-white shadow-sm backdrop-blur-md">
                Featured
              </span>
            )}
          </div>

          {/* Category Tag */}
          <div className="absolute top-3 right-3">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-900/60 text-slate-100 backdrop-blur-md">
              {pet.category_name}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3
                  onClick={() => onSelect(pet)}
                  className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  {pet.name}
                </h3>
                <p className="text-xs font-medium text-slate-500 mt-0.5">
                  {pet.breed_name || 'Purebred'} • {pet.age_months} months • {pet.gender}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-extrabold text-indigo-600">
                  ${parseFloat(pet.price).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Health & Care Badges */}
            <div className="mt-3.5 flex items-center gap-2 text-xs text-slate-600">
              {pet.is_vaccinated && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-medium border border-emerald-100">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Vaccinated
                </span>
              )}
              <span className="inline-flex items-center bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                {pet.size} Size
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-2">
            <button
              onClick={() => onSelect(pet)}
              className="flex-1 py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 flex items-center justify-center gap-1"
            >
              Details <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={!pet.is_available || isInCart}
              onClick={() => onAddToCart(pet)}
              className={`py-2 px-4 text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5 ${
                !pet.is_available
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : isInCart
                  ? 'bg-emerald-600 text-white cursor-default'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isInCart ? 'fill-white' : ''}`} />
              {isInCart ? 'In Cart' : pet.is_available ? 'Adopt Me' : 'Sold'}
            </button>
          </div>
        </div>
      </div>
    );
  },
  (prev, next) =>
    prev.pet.id === next.pet.id &&
    prev.pet.price === next.pet.price &&
    prev.pet.is_available === next.pet.is_available &&
    prev.isInCart === next.isInCart
);

PetCard.displayName = 'PetCard';
