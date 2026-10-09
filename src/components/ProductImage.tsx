import React, { useState } from 'react';
import { Coffee, Gift, Sparkles, Utensils } from 'lucide-react';
import { CategoryId } from '../types/marketplace';

interface ProductImageProps {
  src: string;
  alt: string;
  category?: CategoryId;
  objectPosition?: string;
  className?: string;
}

export const ProductImage: React.FC<ProductImageProps> = ({
  src,
  alt,
  category = 'kopi-spesialti',
  objectPosition = '50% 50%',
  className = '',
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    const Icon =
      category === 'kopi-spesialti'
        ? Coffee
        : category === 'alat-seduh-keramik'
        ? Utensils
        : category === 'pantry-hamper'
        ? Gift
        : Sparkles;

    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#F3EFEA] via-[#EAE3DC] to-[#DFD5CA] text-stone-700 p-6 text-center select-none ${className}`}
        role="img"
        aria-label={alt}
      >
        <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center mb-3 shadow-xs">
          <Icon className="w-6 h-6 text-amber-800" />
        </div>
        <span className="text-xs font-medium text-stone-700 line-clamp-2 max-w-[18ch]">
          {alt}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      style={{ objectPosition }}
      className={`object-cover ${className}`}
    />
  );
};
