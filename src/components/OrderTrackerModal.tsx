import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  MessageSquare,
  Package,
  Search,
  Upload,
  X,
} from 'lucide-react';
import { Order, WhatsAppNotification } from '../types/marketplace';
import { formatDateID, formatIDR, getOrderStatusInfo } from '../utils/exportReports';

interface OrderTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  whatsappLogs: WhatsAppNotification[];
  onUploadProof: (
    orderId: string,
    payload: {
      bankName: string;
      accountName: string;
      transferAmount: number;
      referenceNumber: string;
      notes: string;
    }
  ) => Promise<void>;
}

export const OrderTrackerModal: React.FC<OrderTrackerModalProps> = ({
  isOpen,
  onClose,
  orders,
  whatsappLogs,
  onUploadProof,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [bankName, setBankName] = useState('BCA Prioritas - m-BCA');
  const [accountName, setAccountName] = useState('');
  const [referenceNumber, setReferenceNumber] = useState(
    `BCA-${Date.now().toString().slice(-6)}`
  );
  const [notes, setNotes] = useState('Bukti transfer susulan telah dilampirkan.');
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const filteredOrders = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerWhatsapp.includes(searchQuery)
  );

  const activeOrder =
    filteredOrders.find((o) => o.id === selectedOrderId) || filteredOrders[0] || null;

  const orderWaLogs = activeOrder
    ? whatsappLogs.filter((w) => w.orderId === activeOrder.id)
    : [];

  const handleProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    setUploading(true);
    try {
      await onUploadProof(activeOrder.id, {
        bankName,
        accountName: accountName || activeOrder.customerName.toUpperCase(),
        transferAmount: activeOrder.totalAmount,
        referenceNumber,
        notes,
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/50 backdrop-blur-xs">
      <div
        className="w-full max-w-4xl bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[88vh]"
        role="dialog"
        aria-modal="true"
        aria-label="Lacak Status Pesanan & Riwayat Notifikasi WhatsApp"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-[#FAF8F5]">
          <div>
            <h2 className="text-lg font-bold text-stone-900">
              Lacak Pesanan & Bukti Pembayaran GabeKarya
            </h2>
            <p className="text-xs text-stone-600">
              Pantau status verifikasi pembayaran dan notifikasi WhatsApp otomatis secara real-time
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200/50 transition-colors"
            aria-label="Tutup jendela lacak pesanan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
          {/* Left Column: Order List */}
          <div className="md:col-span-5 border-b md:border-b-0 md:border-r border-stone-200 flex flex-col bg-[#FAF8F5]/60 overflow-hidden">
            <div className="p-4 border-b border-stone-200">
              <div className="relative">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari ID Order, nama, atau No. WA..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-amber-800 text-stone-900"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-stone-200">
              {filteredOrders.map((order) => {
                const statusInfo = getOrderStatusInfo(order.status);
                const isSelected = activeOrder?.id === order.id;
                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`w-full text-left p-4 transition-colors ${
                      isSelected ? 'bg-amber-50/70' : 'hover:bg-stone-100/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-stone-900">
                        {order.id}
                      </span>
                      <span className="font-mono text-xs font-semibold text-amber-900 tabular-nums">
                        {formatIDR(order.totalAmount)}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-stone-800">{order.customerName}</p>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-stone-500">
                      <span>{statusInfo.label}</span>
                      <span>{formatDateID(order.createdAt)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Column: Order Detail */}
          <div className="md:col-span-7 p-6 overflow-y-auto space-y-6">
            {activeOrder ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-stone-200">
                  <div>
                    <p className="text-xs text-stone-500 font-mono">
                      {activeOrder.id} · {formatDateID(activeOrder.createdAt)}
                    </p>
                    <h3 className="text-base font-bold text-stone-900 mt-0.5">
                      {activeOrder.customerName} ({activeOrder.shippingCity})
                    </h3>
                    <p className="text-xs text-stone-600 mt-0.5">
                      WhatsApp: <span className="font-mono">{activeOrder.customerWhatsapp}</span> · Kurir:{' '}
                      {activeOrder.shippingCourier}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-stone-500">Status Saat Ini</p>
                    <p className="text-sm font-bold text-amber-900">
                      {getOrderStatusInfo(activeOrder.status).label}
                    </p>
                    {activeOrder.trackingNumber && (
                      <p className="text-xs font-mono text-stone-600 mt-0.5">
                        Resi: {activeOrder.trackingNumber}
                      </p>
                    )}
                  </div>
                </div>

                {/* Automatic WhatsApp Notification Status */}
                {orderWaLogs.length > 0 && (
                  <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-emerald-700" />
                        Notifikasi Otomatis WhatsApp Terkirim ke {orderWaLogs[0].whatsappNumber}
                      </span>
                      <a
                        href={orderWaLogs[0].waDirectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 hover:underline"
                      >
                        Buka WA <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-xs text-emerald-950 bg-white/90 p-3 rounded-lg border border-emerald-200/80 leading-relaxed">
                      {orderWaLogs[0].message}
                    </p>
                  </div>
                )}

                {/* Upload Proof Form if MENUNGGU_PEMBAYARAN */}
                {activeOrder.status === 'MENUNGGU_PEMBAYARAN' && (
                  <form
                    onSubmit={handleProofSubmit}
                    className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-3"
                  >
                    <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-amber-800" />
                      Unggah Bukti Pembayaran untuk Pesanan Ini
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        required
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        placeholder="Bank Pengirim"
                        className="px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg"
                      />
                      <input
                        type="text"
                        required
                        value={referenceNumber}
                        onChange={(e) => setReferenceNumber(e.target.value)}
                        placeholder="No. Referensi Transfer"
                        className="px-3 py-1.5 text-xs font-mono bg-white border border-stone-300 rounded-lg"
                      />
                    </div>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Catatan tambahan"
                      className="w-full px-3 py-1.5 text-xs bg-white border border-stone-300 rounded-lg"
                    />
                    <button
                      type="submit"
                      disabled={uploading}
                      className="px-4 py-2 text-xs font-semibold text-white bg-amber-800 hover:bg-amber-900 rounded-lg transition-colors"
                    >
                      {uploading ? 'Mengunggah...' : 'Kirim Bukti Pembayaran ke Admin'}
                    </button>
                  </form>
                )}

                {/* Items */}
                <div>
                  <h4 className="text-xs font-bold text-stone-900 mb-2.5 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-stone-600" />
                    Rincian Produk ({activeOrder.items.length} Item)
                  </h4>
                  <div className="divide-y divide-stone-200 border border-stone-200 rounded-xl bg-[#FAF8F5]/50 px-4">
                    {activeOrder.items.map((item, i) => (
                      <div key={i} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-semibold text-stone-900">{item.productName}</p>
                          <p className="text-stone-500 font-mono">
                            {item.quantity} x {formatIDR(item.price)}
                          </p>
                        </div>
                        <span className="font-mono font-semibold text-stone-900 tabular-nums">
                          {formatIDR(item.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h4 className="text-xs font-bold text-stone-900 mb-3 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-stone-600" />
                    Riwayat Status & Verifikasi Database
                  </h4>
                  <div className="space-y-3">
                    {activeOrder.timeline.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3 rounded-lg bg-[#FAF8F5] border border-stone-200 text-xs"
                      >
                        <div className="flex items-center justify-between text-stone-500 mb-1">
                          <span className="font-semibold text-stone-900 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-800" />
                            {ev.title}
                          </span>
                          <span className="font-mono text-[11px]">{formatDateID(ev.timestamp)}</span>
                        </div>
                        <p className="text-stone-600 leading-relaxed">{ev.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-stone-500">Pilih pesanan di sebelah kiri untuk melihat detail.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
