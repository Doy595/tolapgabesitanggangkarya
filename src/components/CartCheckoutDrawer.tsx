import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  FileCheck2,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  Truck,
  Upload,
  X,
} from 'lucide-react';
import { CartItem, Order } from '../types/marketplace';
import { formatIDR } from '../utils/exportReports';
import { ProductImage } from './ProductImage';

interface CartCheckoutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onSubmitOrder: (payload: any) => Promise<Order | null>;
  onOpenAdminApproval: () => void;
}

export const CartCheckoutDrawer: React.FC<CartCheckoutDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onSubmitOrder,
  onOpenAdminApproval,
}) => {
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [customerName, setCustomerName] = useState('Aurelia Santoso');
  const [customerEmail, setCustomerEmail] = useState('aurelia.santoso@gabekarya.id');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('6281299887766');
  const [shippingAddress, setShippingAddress] = useState(
    'Jl. Kemang Raya No. 24B, Bangka, Mampang Prapatan'
  );
  const [shippingCity, setShippingCity] = useState('Jakarta Selatan');
  const [shippingPostalCode, setShippingPostalCode] = useState('12730');
  const [shippingCourier, setShippingCourier] = useState('JNE YES (Yakin Esok Sampai)');
  const [paymentMethod, setPaymentMethod] = useState('Transfer Bank BCA');

  // Payment proof fields
  const [includeProofNow, setIncludeProofNow] = useState(true);
  const [bankName, setBankName] = useState('BCA Prioritas - m-BCA');
  const [accountName, setAccountName] = useState('AURELIA SANTOSO');
  const [referenceNumber, setReferenceNumber] = useState(
    `BCA-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(
      100000 + Math.random() * 900000
    )}`
  );
  const [notes, setNotes] = useState('Mohon dikemas aman dengan pelindung ekstra.');
  const [receiptImageUrl, setReceiptImageUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const freeShippingThreshold = 500000;
  const shippingCost = subtotal === 0 ? 0 : subtotal >= freeShippingThreshold ? 0 : 22000;
  const totalAmount = subtotal + shippingCost;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setReceiptImageUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart.length) return;
    setErrorMsg('');
    setSubmitting(true);

    try {
      const payload = {
        customerName,
        customerEmail,
        customerWhatsapp,
        shippingAddress,
        shippingCity,
        shippingPostalCode,
        shippingCourier,
        shippingCost,
        paymentMethod,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        paymentProof: includeProofNow
          ? {
              bankName,
              accountName: accountName || customerName.toUpperCase(),
              transferAmount: totalAmount,
              referenceNumber:
                referenceNumber || `REF-${Date.now().toString().slice(-6)}`,
              transferDate: new Date().toLocaleString('id-ID', { hour12: false }),
              receiptImageUrl: receiptImageUrl || undefined,
              notes,
            }
          : undefined,
      };

      const result = await onSubmitOrder(payload);
      if (result) {
        setCreatedOrder(result);
        setStep('success');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal memproses pesanan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseDrawer = () => {
    if (step === 'success') {
      setStep('cart');
      setCreatedOrder(null);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-stone-950/45 backdrop-blur-xs transition-opacity">
      <div
        className="relative w-full max-w-lg bg-white h-full shadow-2xl border-l border-stone-200 flex flex-col justify-between overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Keranjang Belanja dan Checkout"
      >
        {/* Top Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-[#FAF8F5]">
          <div className="flex items-center gap-3">
            {step === 'checkout' && (
              <button
                type="button"
                onClick={() => setStep('cart')}
                className="p-1.5 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 transition-colors"
                aria-label="Kembali ke keranjang"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold text-stone-900">
                {step === 'cart'
                  ? 'Keranjang Belanja'
                  : step === 'checkout'
                  ? 'Pengiriman & Bukti Pembayaran'
                  : 'Pesanan Berhasil Tercatat'}
              </h2>
              <p className="text-xs text-stone-600">
                {step === 'cart'
                  ? `${cart.reduce((s, i) => s + i.quantity, 0)} produk dipilih · Tersinkronisasi stok real-time`
                  : step === 'checkout'
                  ? 'Notifikasi otomatis dikirim ke WhatsApp setelah disetujui Admin GabeKarya'
                  : `ID Transaksi Database: ${createdOrder?.id || ''}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCloseDrawer}
            className="p-2 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200/50 transition-colors"
            aria-label="Tutup panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'cart' && (
            <>
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-16">
                  <div className="w-14 h-14 rounded-2xl bg-stone-100 flex items-center justify-center mb-4 text-stone-500">
                    <ShoppingBag className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-semibold text-stone-900 mb-1">
                    Keranjang Anda Masih Kosong
                  </h3>
                  <p className="text-sm text-stone-600 max-w-xs mb-6">
                    Pilih kopi spesialti, kriya keramik seduh, atau bingkisan madu hutan dari katalog 18 produk GabeKarya.
                  </p>
                  <button
                    type="button"
                    onClick={handleCloseDrawer}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-amber-800 hover:bg-amber-900 rounded-lg transition-colors"
                  >
                    Jelajahi 18 Produk Kurasi
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Free Shipping Progress */}
                  <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-stone-200">
                    <div className="flex items-center justify-between text-xs text-stone-700 mb-2">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Truck className="w-4 h-4 text-amber-800" />
                        {remainingForFreeShipping === 0
                          ? 'Selamat! Pesanan Anda mendapat Gratis Ongkos Kirim.'
                          : `Tambah ${formatIDR(remainingForFreeShipping)} lagi untuk Gratis Ongkir`}
                      </span>
                      <span className="font-mono font-semibold text-stone-900">
                        {Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100))}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-800 transition-all duration-200"
                        style={{
                          width: `${Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Cart Item List */}
                  <div className="divide-y divide-stone-200">
                    {cart.map(({ product, quantity }) => (
                      <div key={product.id} className="py-4 flex gap-4">
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                          <ProductImage
                            src={product.imageUrl}
                            alt={product.name}
                            category={product.category}
                            objectPosition={product.imagePosition}
                            className="w-full h-full"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs text-stone-500">
                                {product.categoryLabel} · {product.sku}
                              </p>
                              <h4 className="text-sm font-semibold text-stone-900 leading-snug">
                                {product.name}
                              </h4>
                            </div>
                            <button
                              type="button"
                              onClick={() => onRemoveItem(product.id)}
                              className="p-1 text-stone-400 hover:text-red-600 transition-colors"
                              aria-label={`Hapus ${product.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div className="inline-flex items-center border border-stone-300 rounded-lg bg-white">
                              <button
                                type="button"
                                onClick={() => onUpdateQuantity(product.id, quantity - 1)}
                                className="p-1.5 text-stone-600 hover:text-stone-900 transition-colors"
                                aria-label="Kurangi jumlah"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-3 text-xs font-mono font-semibold text-stone-900 tabular-nums">
                                {quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  onUpdateQuantity(
                                    product.id,
                                    Math.min(product.stock, quantity + 1)
                                  )
                                }
                                disabled={quantity >= product.stock}
                                className="p-1.5 text-stone-600 hover:text-stone-900 disabled:opacity-40 transition-colors"
                                aria-label="Tambah jumlah"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-mono font-semibold text-stone-900 tabular-nums">
                                {formatIDR(product.price * quantity)}
                              </p>
                              <p className="text-[11px] text-stone-500 font-mono tabular-nums">
                                Stok DB: {product.stock}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {step === 'checkout' && (
            <form id="checkout-form" onSubmit={handleCreateOrder} className="space-y-5">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-stone-900">
                    1. Data Pelanggan & Nomor WhatsApp
                  </h3>
                  <span className="text-xs text-stone-500">Wajib aktif untuk WA Otomatis</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Nama Lengkap Penerima
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setAccountName(e.target.value.toUpperCase());
                    }}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-amber-800 text-stone-900"
                    placeholder="Contoh: Aurelia Santoso"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Nomor WhatsApp (Format 628 / 08)
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerWhatsapp}
                      onChange={(e) => setCustomerWhatsapp(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-amber-800 text-stone-900"
                      placeholder="6281299887766"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Alamat Email
                    </label>
                    <input
                      type="email"
                      required
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-amber-800 text-stone-900"
                      placeholder="nama@email.id"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Alamat Lengkap Pengiriman
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-amber-800 text-stone-900"
                  />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="col-span-1 sm:col-span-2">
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Kota / Kabupaten
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingCity}
                      onChange={(e) => setShippingCity(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-amber-800 text-stone-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Kode Pos
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingPostalCode}
                      onChange={(e) => setShippingPostalCode(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm font-mono bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-amber-800 text-stone-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Ekspedisi Pengiriman
                    </label>
                    <select
                      value={shippingCourier}
                      onChange={(e) => setShippingCourier(e.target.value)}
                      className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-amber-800 text-stone-900"
                    >
                      <option value="JNE YES (Yakin Esok Sampai)">JNE YES (Esok Sampai)</option>
                      <option value="SiCepat BEST">SiCepat BEST</option>
                      <option value="J&T Express Reguler">J&T Express Reguler</option>
                      <option value="AnterAja Same Day">AnterAja Same Day</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Metode Pembayaran
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => {
                        setPaymentMethod(e.target.value);
                        setBankName(e.target.value);
                      }}
                      className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-amber-800 text-stone-900"
                    >
                      <option value="Transfer Bank BCA">BCA Virtual / Transfer (8810299120)</option>
                      <option value="Bank Mandiri Livin">Bank Mandiri (1240099881122)</option>
                      <option value="QRIS Nusantara Instant">QRIS Nusantara Instant</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Payment Proof Upload */}
              <div className="pt-4 border-t border-stone-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-amber-800" />
                    2. Unggah Bukti Pembayaran
                  </h3>
                  <label className="inline-flex items-center gap-2 text-xs font-medium text-stone-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeProofNow}
                      onChange={(e) => setIncludeProofNow(e.target.checked)}
                      className="rounded border-stone-300 text-amber-800 focus:ring-amber-800"
                    />
                    Lampirkan Bukti Sekarang
                  </label>
                </div>

                {includeProofNow ? (
                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Nama Pengirim Rekening
                        </label>
                        <input
                          type="text"
                          required
                          value={accountName}
                          onChange={(e) => setAccountName(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-stone-300 rounded-lg text-stone-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Nomor Referensi Transfer
                        </label>
                        <input
                          type="text"
                          required
                          value={referenceNumber}
                          onChange={(e) => setReferenceNumber(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs font-mono bg-white border border-stone-300 rounded-lg text-stone-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Lampiran Foto / Tangkapan Layar Struk Transfer (Opsional)
                      </label>
                      <label className="flex items-center justify-between px-3.5 py-2.5 bg-white border border-dashed border-stone-300 rounded-lg cursor-pointer hover:border-amber-800 transition-colors">
                        <span className="flex items-center gap-2 text-xs text-stone-700 truncate">
                          <Upload className="w-4 h-4 text-amber-800 shrink-0" />
                          {receiptImageUrl
                            ? 'Foto bukti pembayaran berhasil dilampirkan'
                            : 'Pilih file gambar struk (.jpg/.png) atau gunakan struk digital'}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Catatan untuk Admin GabeKarya
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg text-stone-900"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-stone-600 bg-stone-100 p-3 rounded-lg">
                    Pesanan akan disimpan dengan status <strong>Menunggu Pembayaran</strong>. Anda dapat mengunggah bukti transfer kapan saja melalui menu <strong>Lacak Pesanan</strong>.
                  </p>
                )}
              </div>
            </form>
          )}

          {step === 'success' && createdOrder && (
            <div className="py-6 space-y-6">
              <div className="p-5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <p className="text-xs font-mono font-semibold text-emerald-800">
                  TERSIMPAN DI DATABASE GABEKARYA · {createdOrder.id}
                </p>
                <h3 className="text-lg font-bold text-stone-900">
                  Terima Kasih, {createdOrder.customerName}!
                </h3>
                <p className="text-xs text-stone-700 max-w-sm mx-auto leading-relaxed">
                  Pesanan Anda sebesar{' '}
                  <strong className="font-mono">{formatIDR(createdOrder.totalAmount)}</strong> telah masuk ke database utama dengan status{' '}
                  <strong>
                    {createdOrder.status === 'MENUNGGU_VERIFIKASI'
                      ? 'Menunggu Verifikasi Bukti Pembayaran Admin'
                      : 'Menunggu Pembayaran'}
                  </strong>
                  .
                </p>
              </div>

              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-stone-500">Nomor WhatsApp Notifikasi:</span>
                  <span className="font-mono font-semibold text-stone-900">
                    {createdOrder.customerWhatsapp}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Metode & Referensi:</span>
                  <span className="font-mono text-stone-900">
                    {createdOrder.paymentProof?.referenceNumber || createdOrder.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Alur Selanjutnya:</span>
                  <span className="font-medium text-amber-900">
                    Admin Setujui Bukti → WA Otomatis Terkirim
                  </span>
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => {
                    handleCloseDrawer();
                    onOpenAdminApproval();
                  }}
                  className="w-full py-3 px-4 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <FileCheck2 className="w-4 h-4" />
                  Buka Panel Admin untuk Setujui Bukti & Tes WA Otomatis
                </button>
                <button
                  type="button"
                  onClick={handleCloseDrawer}
                  className="w-full py-2.5 px-4 rounded-lg border border-stone-300 hover:bg-stone-100 text-stone-800 text-xs font-semibold transition-colors"
                >
                  Kembali ke Katalog Toko
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {cart.length > 0 && step !== 'success' && (
          <div className="p-6 border-t border-stone-200 bg-[#FAF8F5] space-y-4">
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-xs text-stone-600">
                <span>Subtotal Produk</span>
                <span className="font-mono tabular-nums">{formatIDR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-xs text-stone-600">
                <span>Estimasi Ongkos Kirim</span>
                <span className="font-mono tabular-nums">
                  {shippingCost === 0 ? 'GRATIS' : formatIDR(shippingCost)}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-stone-900 pt-2 border-t border-stone-200">
                <span>Total Pembayaran</span>
                <span className="font-mono tabular-nums text-amber-900">
                  {formatIDR(totalAmount)}
                </span>
              </div>
            </div>

            {step === 'cart' ? (
              <button
                type="button"
                onClick={() => setStep('checkout')}
                className="w-full py-3 px-4 rounded-lg bg-amber-800 hover:bg-amber-900 text-white text-sm font-semibold transition-colors"
              >
                Lanjut ke Pengiriman & Pembayaran
              </button>
            ) : (
              <button
                type="submit"
                form="checkout-form"
                disabled={submitting}
                className="w-full py-3 px-4 rounded-lg bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
              >
                {submitting
                  ? 'Menyimpan ke Database...'
                  : 'Konfirmasi Pesanan & Kirim Bukti Bayar'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
