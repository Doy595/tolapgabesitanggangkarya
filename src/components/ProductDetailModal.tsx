import React, { useState } from 'react';
import { Minus, Plus, ShoppingBag, Star, Truck, X } from 'lucide-react';
import { Product } from '../types/marketplace';
import { formatIDR } from '../utils/exportReports';
import { ProductImage } from './ProductImage';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
}) => {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/50 backdrop-blur-xs">
      <div
        className="w-full max-w-3xl bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 max-h-[90vh]"
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
      >
        {/* Left Studio Image */}
        <div className="md:col-span-6 bg-[#FAF8F5] relative min-h-[260px] md:min-h-[420px]">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            category={product.category}
            objectPosition={product.imagePosition}
            className="w-full h-full"
          />
        </div>

        {/* Right Contiguous Purchase Module */}
        <div className="md:col-span-6 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <span>{product.categoryLabel}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono">{product.sku}</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                aria-label="Tutup detail produk"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <h2 className="text-xl font-bold text-stone-900 leading-snug">
                {product.name}
              </h2>
              <p className="text-xs text-stone-600 mt-1">{product.origin}</p>
            </div>

            <div className="flex items-baseline justify-between pt-1 border-b border-stone-200 pb-4">
              <span className="text-2xl font-mono font-bold text-amber-900 tabular-nums">
                {formatIDR(product.price)}
              </span>
              <div className="flex items-center gap-2 text-xs text-stone-600">
                <span className="inline-flex items-center gap-1 font-semibold text-stone-900">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {product.rating.toFixed(1)}
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{product.soldCount} terjual</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <p className="font-semibold text-stone-900">Karakter & Spesifikasi:</p>
              <p className="text-amber-900 font-medium">{product.craftNotes}</p>
              <p className="text-stone-700 leading-relaxed pt-1">{product.description}</p>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200 flex items-center justify-between text-xs text-stone-700">
              <span className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-amber-800" />
                Kemasan: {product.unit} ({product.weightGram}g)
              </span>
              <span className="font-mono font-semibold text-stone-900 tabular-nums">
                Stok Tersedia: {product.stock}
              </span>
            </div>
          </div>

          {/* Quantity & Add to Cart CTA */}
          <div className="pt-6 mt-6 border-t border-stone-200 flex items-center gap-3">
            <div className="inline-flex items-center border border-stone-300 rounded-lg bg-white">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2.5 text-stone-600 hover:text-stone-900"
                aria-label="Kurangi jumlah"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-4 text-sm font-mono font-bold text-stone-900 tabular-nums">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                disabled={quantity >= product.stock}
                className="p-2.5 text-stone-600 hover:text-stone-900 disabled:opacity-40"
                aria-label="Tambah jumlah"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              disabled={product.stock === 0}
              onClick={() => {
                onAddToCart(product, quantity);
                onClose();
              }}
              className="flex-1 py-3 px-5 rounded-lg bg-amber-800 hover:bg-amber-900 disabled:bg-stone-300 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              {product.stock > 0
                ? `Tambah ke Keranjang · ${formatIDR(product.price * quantity)}`
                : 'Stok Habis'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
