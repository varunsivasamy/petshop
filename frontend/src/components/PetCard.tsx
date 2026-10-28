import React from 'react';
import { PetSummary } from '../services/api';
import { CachedImage } from './CachedImage';
import { ShieldCheck, Heart, Sparkles, ArrowUpRight } from 'lucide-react';

interface PetCardProps {
  pet: PetSummary;
  onSelect: (pet: PetSummary) => void;
  onAddToCart: (pet: PetSummary) => void;
  isInCart: boolean;
}

/**
 * Pure PetCard component.
 * Features a modern, friendly design with smooth hover transitions.
 * No technical jargon is displayed.
 */
export const PetCard: React.FC<PetCardProps> = React.memo(
  ({ pet, onSelect, onAddToCart, isInCart }) => {
    return (
      <div className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-rose-100 transition-all duration-300 flex flex-col overflow-hidden">
        {/* Media Container */}
        <div
          className="relative aspect-[4/3] w-full overflow-hidden cursor-pointer bg-slate-50"
          onClick={() => onSelect(pet)}
        >
          <CachedImage
            src={pet.primary_image?.url}
            contentHash={pet.primary_image?.content_hash}
            alt={pet.name}
            className="w-full h-full group-hover:scale-105 transition-transform duration-500"
          />

          {/* Status Pills */}
          <div className="absolute top-3.5 left-3.5 flex gap-1.5 flex-wrap">
            <span
              className={`text-[11px] font-bold px-3 py-1 rounded-full shadow-sm backdrop-blur-md ${
                pet.is_available
                  ? 'bg-emerald-500/90 text-white'
                  : 'bg-slate-700/80 text-white'
              }`}
            >
              {pet.is_available ? 'Available' : 'Adopted'}
            </span>
            {pet.is_featured && (
              <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-amber-400 text-slate-900 shadow-sm backdrop-blur-md flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Featured
              </span>
            )}
          </div>

          {/* Category Pill */}
          <div className="absolute top-3.5 right-3.5">
            <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-white/90 text-slate-800 backdrop-blur-md shadow-xs">
              {pet.category_name}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3
                  onClick={() => onSelect(pet)}
                  className="font-extrabold text-xl text-slate-900 group-hover:text-rose-600 transition-colors cursor-pointer"
                >
                  {pet.name}
                </h3>
                <p className="text-xs font-semibold text-slate-400 mt-1">
                  {pet.breed_name || 'Purebred'} • {pet.age_months} Months • {pet.gender}
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-rose-500">
                  ${parseFloat(pet.price).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Health & Care Disclosures */}
            <div className="mt-4 flex items-center gap-2 text-xs">
              {pet.is_vaccinated && (
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-xl font-bold border border-emerald-100">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Vet Checked
                </span>
              )}
              <span className="inline-flex items-center bg-slate-100 text-slate-600 px-2.5 py-1 rounded-xl font-semibold">
                {pet.size} Size
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-2.5">
            <button
              onClick={() => onSelect(pet)}
              className="flex-1 py-3 px-4 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all border border-slate-200/60 flex items-center justify-center gap-1"
            >
              View Story <ArrowUpRight className="w-4 h-4 text-slate-400" />
            </button>
            <button
              disabled={!pet.is_available || isInCart}
              onClick={() => onAddToCart(pet)}
              className={`py-3 px-5 text-xs font-bold rounded-2xl transition-all shadow-sm flex items-center gap-2 ${
                !pet.is_available
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : isInCart
                  ? 'bg-emerald-600 text-white cursor-default shadow-emerald-200'
                  : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isInCart ? 'fill-white' : ''}`} />
              {isInCart ? 'In Cart' : pet.is_available ? 'Adopt Me' : 'Adopted'}
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
