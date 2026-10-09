import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  Database,
  FileCheck2,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
} from 'lucide-react';
import { AdminDashboard, AdminTabId } from './components/AdminDashboard';
import { AdminLogin2FAModal } from './components/AdminLogin2FAModal';
import { CartCheckoutDrawer } from './components/CartCheckoutDrawer';
import { OrderTrackerModal } from './components/OrderTrackerModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ProductImage } from './components/ProductImage';
import {
  HERO_IMAGE_URL,
  INITIAL_CUSTOMERS,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_SECURITY_LOGS,
  INITIAL_WHATSAPP_LOGS,
} from './data/seedData';
import {
  CATEGORIES,
  CartItem,
  Customer,
  DatabaseSnapshot,
  Order,
  OrderStatus,
  Product,
  WhatsAppNotification,
} from './types/marketplace';
import { formatIDR } from './utils/exportReports';

export function App() {
  const [snapshot, setSnapshot] = useState<DatabaseSnapshot>({
    engine: 'SQLite 3 Relational Engine (Persistent Disk SSOT)',
    dbFilePath: 'data/gabekarya_ssot.sqlite',
    lastSyncAt: new Date().toISOString(),
    transactionCount: 34,
    twoFactorEnabled: true,
    products: INITIAL_PRODUCTS,
    customers: INITIAL_CUSTOMERS,
    orders: INITIAL_ORDERS,
    whatsappLogs: INITIAL_WHATSAPP_LOGS,
    securityLogs: INITIAL_SECURITY_LOGS,
  });

  const [viewMode, setViewMode] = useState<'storefront' | 'admin'>('storefront');
  const [adminTab, setAdminTab] = useState<AdminTabId>('sales');
  const [adminSession, setAdminSession] = useState<{
    email: string;
    name: string;
    role: string;
  } | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingAdminTabAfterLogin, setPendingAdminTabAfterLogin] =
    useState<AdminTabId>('sales');

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'price-asc' | 'price-desc' | 'stock'>(
    'popular'
  );

  const [cart, setCart] = useState<CartItem[]>([
    { product: INITIAL_PRODUCTS[0], quantity: 1 },
    { product: INITIAL_PRODUCTS[7], quantity: 1 },
  ]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [activeProductDetail, setActiveProductDetail] = useState<Product | null>(null);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [latestWaDispatch, setLatestWaDispatch] =
    useState<WhatsAppNotification | null>(null);
  const [toastMessage, setToastMessage] = useState<string>('');

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? '' : prev));
    }, 3500);
  }, []);

  const fetchDatabaseState = useCallback(async () => {
    try {
      const res = await fetch('/api/state');
      if (res.ok) {
        const data = (await res.json()) as DatabaseSnapshot;
        setSnapshot(data);
      }
    } catch {
      // Keep synchronized state
    }
  }, []);

  useEffect(() => {
    fetchDatabaseState();
  }, [fetchDatabaseState]);

  useEffect(() => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          const freshProd = snapshot.products.find((p) => p.id === item.product.id);
          if (!freshProd) return null;
          return {
            product: freshProd,
            quantity: Math.min(item.quantity, Math.max(1, freshProd.stock)),
          };
        })
        .filter(Boolean) as CartItem[]
    );
  }, [snapshot.products]);

  const totalCartItems = useMemo(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const filteredProducts = useMemo(() => {
    return snapshot.products
      .filter((prod) => {
        const matchesCategory =
          selectedCategory === 'all' || prod.category === selectedCategory;
        const matchesSearch =
          prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prod.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prod.craftNotes.toLowerCase().includes(searchQuery.toLowerCase()) ||
          prod.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'stock') return b.stock - a.stock;
        return b.soldCount - a.soldCount;
      });
  }, [snapshot.products, selectedCategory, searchQuery, sortBy]);

  const handleAddToCart = (product: Product, qty = 1) => {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id
            ? { ...i, quantity: Math.min(product.stock, i.quantity + qty) }
            : i
        );
      }
      return [...prev, { product, quantity: Math.min(product.stock, qty) }];
    });
    setJustAddedId(product.id);
    showToast(`${product.name} ditambahkan ke keranjang.`);
    setTimeout(() => {
      setJustAddedId((prev) => (prev === product.id ? null : prev));
    }, 1200);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setCart((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const handleOpenAdmin = (targetTab: AdminTabId = 'sales') => {
    if (adminSession) {
      setAdminTab(targetTab);
      setViewMode('admin');
    } else {
      setPendingAdminTabAfterLogin(targetTab);
      setIsLoginModalOpen(true);
    }
  };

  const handleLoginStep1 = async (email: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Gagal login.');
    }
    if (data.snapshot) setSnapshot(data.snapshot);
    return data;
  };

  const handleVerifyStep2 = async (email: string, otpCode: string) => {
    const res = await fetch('/api/auth/verify-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otpCode }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Kode OTP 2FA tidak valid.');
    }
    if (data.snapshot) setSnapshot(data.snapshot);
    setAdminSession(data.adminUser);
    setIsLoginModalOpen(false);
    setAdminTab(pendingAdminTabAfterLogin);
    setViewMode('admin');
    showToast('Autentikasi 2FA berhasil! Selamat datang di Panel Admin GabeKarya.');
  };

  const handleSubmitOrder = async (payload: any): Promise<Order | null> => {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Gagal membuat pesanan.');
    }
    if (data.snapshot) setSnapshot(data.snapshot);
    setCart([]);
    return data.order;
  };

  const handleUploadProof = async (orderId: string, proofPayload: any) => {
    const res = await fetch(`/api/orders/${orderId}/payment-proof`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proofPayload),
    });
    const data = await res.json();
    if (res.ok && data.snapshot) {
      setSnapshot(data.snapshot);
      showToast(`Bukti pembayaran untuk ${orderId} berhasil diunggah.`);
    }
  };

  const handleApprovePayment = async (orderId: string) => {
    const res = await fetch(`/api/orders/${orderId}/approve-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        verifiedBy: adminSession?.name || 'Gabe Wibowo (2FA Terverifikasi)',
      }),
    });
    const data = await res.json();
    if (res.ok && data.snapshot) {
      setSnapshot(data.snapshot);
      if (data.whatsappNotification) {
        setLatestWaDispatch(data.whatsappNotification);
      }
      showToast(
        `Pembayaran ${orderId} disetujui & notifikasi WhatsApp otomatis terkirim!`
      );
    }
  };

  const handleRejectPayment = async (orderId: string, reason: string) => {
    const res = await fetch(`/api/orders/${orderId}/reject-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (res.ok && data.snapshot) {
      setSnapshot(data.snapshot);
      if (data.whatsappNotification) {
        setLatestWaDispatch(data.whatsappNotification);
      }
      showToast(`Bukti pembayaran ${orderId} ditolak & konfirmasi WA terkirim.`);
    }
  };

  const handleUpdateOrderStatus = async (
    orderId: string,
    status: OrderStatus,
    trackingNumber?: string
  ) => {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, trackingNumber }),
    });
    const data = await res.json();
    if (res.ok && data.snapshot) {
      setSnapshot(data.snapshot);
      if (data.whatsappNotification) {
        setLatestWaDispatch(data.whatsappNotification);
      }
      showToast(`Status pesanan ${orderId} diperbarui menjadi ${status}.`);
    }
  };

  const handleSaveProduct = async (
    productData: Partial<Product>,
    editingId?: string
  ) => {
    const url = editingId ? `/api/products/${editingId}` : '/api/products';
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
    const data = await res.json();
    if (res.ok && data.snapshot) {
      setSnapshot(data.snapshot);
      showToast(
        editingId
          ? 'Data produk & stok berhasil diperbarui di database.'
          : 'Produk baru berhasil ditambahkan ke database GabeKarya.'
      );
    }
  };

  const handleAdjustStock = async (productId: string, delta: number) => {
    const res = await fetch(`/api/products/${productId}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta }),
    });
    const data = await res.json();
    if (res.ok && data.snapshot) {
      setSnapshot(data.snapshot);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const res = await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (res.ok && data.snapshot) {
      setSnapshot(data.snapshot);
      showToast('Produk dihapus dari database.');
    }
  };

  const handleSaveCustomer = async (
    customerData: Partial<Customer>,
    editingId?: string
  ) => {
    const url = editingId ? `/api/customers/${editingId}` : '/api/customers';
    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData),
    });
    const data = await res.json();
    if (res.ok && data.snapshot) {
      setSnapshot(data.snapshot);
      showToast('Data pelanggan berhasil disimpan ke database.');
    }
  };

  const handleToggle2FA = async (enabled: boolean) => {
    const res = await fetch('/api/auth/toggle-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    const data = await res.json();
    if (res.ok && data.snapshot) {
      setSnapshot(data.snapshot);
      showToast(`Proteksi 2FA berhasil diatur ke: ${enabled ? 'Aktif' : 'Nonaktif'}.`);
    }
  };

  if (viewMode === 'admin' && adminSession) {
    return (
      <>
        {toastMessage && (
          <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl bg-stone-900 text-white text-xs font-semibold shadow-xl flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}
        <AdminDashboard
          snapshot={snapshot}
          activeTab={adminTab}
          onChangeTab={setAdminTab}
          onBackToStore={() => setViewMode('storefront')}
          onLogout={() => {
            setAdminSession(null);
            setViewMode('storefront');
            showToast('Anda telah keluar dari sesi Panel Admin GabeKarya.');
          }}
          adminUser={adminSession}
          latestWaDispatch={latestWaDispatch}
          onDismissWaDispatch={() => setLatestWaDispatch(null)}
          onApprovePayment={handleApprovePayment}
          onRejectPayment={handleRejectPayment}
          onUpdateOrderStatus={handleUpdateOrderStatus}
          onSaveProduct={handleSaveProduct}
          onAdjustStock={handleAdjustStock}
          onDeleteProduct={handleDeleteProduct}
          onSaveCustomer={handleSaveCustomer}
          onToggle2FA={handleToggle2FA}
          onRefreshState={fetchDatabaseState}
        />
      </>
    );
  }

  const pendingApprovalsCount = snapshot.orders.filter(
    (o) => o.status === 'MENUNGGU_VERIFIKASI'
  ).length;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-stone-900">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl bg-stone-900 text-white text-xs font-semibold shadow-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP NAVIGATION BAR (Strict 3-Zone Contract) */}
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-4 sm:px-6 lg:px-8 py-4">
          {/* Zone 1: Brand Wordmark */}
          <a
            href="#top"
            className="font-display text-xl font-bold tracking-tight text-stone-900 whitespace-nowrap shrink-0"
          >
            GabeKarya
          </a>

          {/* Zone 2: Navigation Links */}
          <nav
            className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-700"
            aria-label="Navigasi Utama"
          >
            <a
              href="#katalog"
              className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Katalog Produk ({snapshot.products.length})
            </a>
            <button
              type="button"
              onClick={() => setIsTrackerOpen(true)}
              className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Lacak Pesanan
            </button>
            <a
              href="#kurasi"
              className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Kisah Kurasi
            </a>
            <button
              type="button"
              onClick={() => handleOpenAdmin('sales')}
              className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Panel Admin (2FA)
            </button>
          </nav>

          {/* Zone 3: Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-stone-900 hover:bg-stone-800 rounded-lg inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
            >
              <ShoppingBag className="w-4 h-4 text-amber-400" />
              <span>Keranjang ({totalCartItems})</span>
            </button>
          </div>
        </div>

        {/* Mobile Quick Bar */}
        <div className="md:hidden border-t border-stone-200 px-4 py-2 flex items-center justify-between gap-4 overflow-x-auto text-xs font-semibold text-stone-700 bg-white">
          <a href="#katalog" className="whitespace-nowrap shrink-0 py-1">
            Katalog ({snapshot.products.length})
          </a>
          <button
            type="button"
            onClick={() => setIsTrackerOpen(true)}
            className="whitespace-nowrap shrink-0 py-1"
          >
            Lacak Pesanan
          </button>
          <button
            type="button"
            onClick={() => handleOpenAdmin('approvals')}
            className="whitespace-nowrap shrink-0 py-1 text-amber-900"
          >
            Approval Bukti ({pendingApprovalsCount})
          </button>
          <button
            type="button"
            onClick={() => handleOpenAdmin('sales')}
            className="whitespace-nowrap shrink-0 py-1 text-stone-900"
          >
            Login Admin 2FA
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section id="top" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 flex flex-col justify-between bg-white rounded-2xl border border-stone-200 p-6 sm:p-10">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-stone-600">
                <span>6 Pilihan Kopi Spesialti</span>
                <span aria-hidden="true">·</span>
                <span>6 Alat Seduh & Keramik Kasongan</span>
                <span aria-hidden="true">·</span>
                <span>6 Pantry & Hamper Sumbawa</span>
              </div>

              <h1
                className="font-display font-bold text-stone-900 tracking-tight leading-[1.12]"
                style={{
                  fontSize: 'clamp(2.1rem, 3.8vw, 3.35rem)',
                  textWrap: 'balance',
                }}
              >
                GabeKarya: Koleksi 18 Produk Artisanal & Seduh Nusantara Pilihan.
              </h1>

              <p className="text-base text-stone-700 leading-relaxed max-w-2xl">
                Jelajahi 18 produk kurasi premium dari 3 kategori utama—mulai dari biji arabika Gayo, Toraja, Kerinci, dan Ijen; teko tembaga Tumang, dripper stoneware Kasongan, dan grinder presisi; hingga madu hutan Sumbawa dan hamper rotan. Didukung database stok real-time, notifikasi WhatsApp otomatis, dan keamanan autentikasi 2FA.
              </p>
            </div>

            <div className="pt-8 mt-8 border-t border-stone-200 flex flex-wrap items-center gap-3">
              <a
                href="#katalog"
                className="px-5 py-3 rounded-lg bg-amber-800 hover:bg-amber-900 text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                Jelajahi 18 Produk GabeKarya
              </a>
              <button
                type="button"
                onClick={() => handleOpenAdmin('approvals')}
                className="px-4 py-3 rounded-lg border border-stone-300 bg-[#FAF8F5] hover:bg-stone-100 text-stone-900 text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                <FileCheck2 className="w-4 h-4 text-amber-800" />
                <span>
                  Approval Bukti & WA ({pendingApprovalsCount} Menunggu)
                </span>
              </button>
              <button
                type="button"
                onClick={() => handleOpenAdmin('sales')}
                className="px-4 py-3 rounded-lg border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 text-sm font-semibold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Dasbor Admin 2FA</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 relative min-h-[300px] lg:min-h-full">
            <img
              src={HERO_IMAGE_URL}
              alt="GabeKarya Artisanal Coffee & Ceramics Studio"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent p-6 text-white">
              <p className="text-xs font-mono text-amber-300">
                GABEKARYA ARTISANAL COFFEE & CERAMICS
              </p>
              <p className="text-sm font-semibold mt-0.5">
                Koleksi terlengkap 18 produk kurasi kriya & pangan Nusantara
              </p>
            </div>
          </div>
        </div>

        {/* 4-Column Operational Strip */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white border border-stone-200 flex items-start gap-3">
            <Database className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xs font-bold text-stone-900">
                Single Source of Truth DB
              </h2>
              <p className="text-xs text-stone-600 mt-0.5 font-mono tabular-nums">
                {snapshot.products.length} produk · {snapshot.orders.length} order ·{' '}
                {snapshot.transactionCount} transaksi ACID
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-stone-200 flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xs font-bold text-stone-900">
                Notifikasi WhatsApp Otomatis
              </h2>
              <p className="text-xs text-stone-600 mt-0.5">
                Terkirim instan ke nomor WA pelanggan saat bukti bayar disetujui
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-stone-200 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xs font-bold text-stone-900">
                Keamanan 2FA (TOTP & WA)
              </h2>
              <p className="text-xs text-stone-600 mt-0.5">
                Login pengelola dilindungi verifikasi token 6 digit satu kali pakai
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white border border-stone-200 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-xs font-bold text-stone-900">
                Analitik Sales & Ekspor PDF/Excel
              </h2>
              <p className="text-xs text-stone-600 mt-0.5">
                Dasbor penjualan real-time dengan unduhan laporan resmi .pdf & .xlsx
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CATALOG SECTION (18 Products Across 3 Categories) */}
      <section
        id="katalog"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 border-t border-stone-200/80"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-amber-800">
              Katalog Lengkap GabeKarya
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-stone-900 mt-1">
              Koleksi 18 Produk Nusantara dalam 3 Kategori
            </h2>
          </div>

          <div
            className="flex items-center gap-1 p-1.5 bg-stone-200/75 rounded-xl overflow-x-auto"
            role="tablist"
            aria-label="Filter Kategori Produk"
          >
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-700 hover:text-stone-900'
              }`}
            >
              Semua Koleksi ({snapshot.products.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = snapshot.products.filter(
                (p) => p.category === cat.id
              ).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    selectedCategory === cat.id
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-700 hover:text-stone-900'
                  }`}
                >
                  {cat.shortLabel} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Sort */}
        <div className="mb-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-stone-200">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari produk kopi, teko tembaga, keramik, madu Sumbawa, atau daerah asal..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-[#FAF8F5] border border-stone-300 rounded-lg focus:outline-none focus:border-amber-800 text-stone-900"
            />
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-xs font-medium text-stone-600 flex items-center gap-1.5 whitespace-nowrap">
              <SlidersHorizontal className="w-3.5 h-3.5 text-stone-500" />
              Urutkan:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3.5 py-2 text-xs font-semibold bg-[#FAF8F5] border border-stone-300 rounded-lg text-stone-900 focus:outline-none focus:border-amber-800"
            >
              <option value="popular">Paling Banyak Terjual</option>
              <option value="price-asc">Harga: Rendah ke Tinggi</option>
              <option value="price-desc">Harga: Tinggi ke Rendah</option>
              <option value="stock">Stok Tersedia Terbanyak</option>
            </select>
          </div>
        </div>

        {/* 3-Column Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3">
            <p className="text-base font-bold text-stone-900">
              Tidak ada produk yang cocok dengan pencarian "{searchQuery}"
            </p>
            <p className="text-xs text-stone-600">
              Coba kata kunci lain atau tampilkan kembali seluruh kategori.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 rounded-lg bg-amber-800 text-white text-xs font-semibold"
            >
              Reset Filter Katalog
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
            {filteredProducts.map((product) => {
              const isJustAdded = justAddedId === product.id;
              return (
                <article
                  key={product.id}
                  className="group bg-white rounded-2xl border border-stone-200 overflow-hidden flex flex-col justify-between transition-transform duration-150 hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div>
                    <div
                      onClick={() => setActiveProductDetail(product)}
                      className="aspect-4/3 w-full bg-[#F3EFEA] overflow-hidden cursor-pointer relative border-b border-stone-100"
                    >
                      <ProductImage
                        src={product.imageUrl}
                        alt={product.name}
                        category={product.category}
                        objectPosition={product.imagePosition}
                        className="w-full h-full transition-transform duration-200 group-hover:scale-[1.03]"
                      />
                    </div>

                    <div className="p-5 space-y-2.5">
                      <div className="flex items-center justify-between gap-2 text-xs text-stone-500">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-medium text-stone-600">
                            {product.categoryLabel}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="truncate">{product.origin}</span>
                        </div>
                        <span className="inline-flex items-center gap-1 font-mono font-semibold text-stone-700 shrink-0 tabular-nums">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                          {product.rating.toFixed(1)}
                        </span>
                      </div>

                      <h3
                        onClick={() => setActiveProductDetail(product)}
                        className="text-base font-bold text-stone-900 leading-snug cursor-pointer hover:text-amber-900 transition-colors"
                      >
                        {product.name}
                      </h3>

                      <p className="text-xs font-medium text-amber-900">
                        {product.craftNotes}
                      </p>

                      <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  </div>

                  <div className="px-5 pb-5 pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[11px] text-stone-500 font-mono tabular-nums">
                        Stok DB: {product.stock} · {product.soldCount} terjual
                      </p>
                      <p className="text-base font-mono font-bold text-stone-900 tabular-nums mt-0.5">
                        {formatIDR(product.price)}
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={product.stock === 0}
                      onClick={() => handleAddToCart(product, 1)}
                      className={`px-4 py-2.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                        isJustAdded
                          ? 'bg-emerald-700 text-white'
                          : product.stock > 0
                          ? 'bg-stone-900 hover:bg-amber-800 text-white'
                          : 'bg-stone-200 text-stone-500 cursor-not-allowed'
                      }`}
                    >
                      {isJustAdded ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Ditambahkan
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" /> Keranjang
                        </>
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* CURATION STORY & ADMIN LAUNCHER */}
      <section
        id="kurasi"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-stone-200/80"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          <div className="lg:col-span-7 bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold text-amber-800">
                Dedikasi Citarasa & Kriya GabeKarya
              </p>
              <h2 className="font-display text-2xl font-bold text-stone-900">
                18 Produk Pilihan dari Berbagai Penjuru Nusantara
              </h2>
              <p className="text-sm text-stone-700 leading-relaxed">
                GabeKarya bermitra langsung dengan komunitas pekebun kopi di Gayo, Toraja, Kintamani, Bajawa, Kerinci, dan Ijen; perajin logam Tumang dan keramik Kasongan; serta pembudidaya madu hutan Sumbawa. Setiap transaksi terhubung dengan sistem pembukuan transparan dan notifikasi otomatis WhatsApp.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <blockquote className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-2">
                <p className="text-xs text-stone-700 leading-relaxed">
                  "Begitu bukti transfer saya disetujui tim GabeKarya, notifikasi WhatsApp langsung masuk lengkap dengan ringkasan 2 paket kopi dan teko tembaga. Sangat profesional!"
                </p>
                <footer className="text-xs font-semibold text-stone-900">
                  Nadia Pramesti — Penggemar Manual Brew, Jakarta Selatan
                </footer>
              </blockquote>

              <blockquote className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-2">
                <p className="text-xs text-stone-700 leading-relaxed">
                  "Pilihan produk sekarang lebih lengkap dengan kopi Kerinci dan Ijen Bourbon, plus server borosilikat. Stok terupdate real-time."
                </p>
                <footer className="text-xs font-semibold text-stone-900">
                  Bagas Adriansyah — Roastery Owner, Sleman
                </footer>
              </blockquote>
            </div>
          </div>

          <div className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <p className="text-xs font-mono font-semibold text-emerald-800">
                PORTAL PENGELOLA · KEAMANAN 2FA
              </p>
              <h3 className="text-xl font-bold text-stone-900">
                Uji Coba Panel Admin GabeKarya
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Kelola stok 18 produk secara real-time, verifikasi bukti pembayaran pelanggan dengan notifikasi WhatsApp otomatis, serta unduh laporan penjualan dalam format PDF dan Excel.
              </p>
            </div>

            <div className="space-y-2 text-xs text-stone-700 bg-[#FAF8F5] p-4 rounded-xl border border-stone-200">
              <div className="flex justify-between">
                <span className="text-stone-500">Akun Demo Admin:</span>
                <span className="font-mono font-semibold text-stone-900">
                  admin@gabekarya.id
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Kata Sandi:</span>
                <span className="font-mono font-semibold text-stone-900">
                  AdminGabe2026!
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Order Menunggu Verifikasi:</span>
                <span className="font-mono font-bold text-amber-800 tabular-nums">
                  {pendingApprovalsCount} Bukti Transfer Siap Disetujui
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleOpenAdmin('approvals')}
                className="py-2.5 px-4 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors"
              >
                Approval Bukti & WA
              </button>
              <button
                type="button"
                onClick={() => handleOpenAdmin('sales')}
                className="py-2.5 px-4 rounded-lg bg-amber-800 hover:bg-amber-900 text-white text-xs font-semibold transition-colors"
              >
                Laporan Sales (PDF/Excel)
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto border-t border-stone-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-600">
          <div>
            <span className="font-display font-bold text-stone-900">GabeKarya</span>
            <span className="mx-2" aria-hidden="true">
              ·
            </span>
            <span>Marketplace Produk Artisanal, Kopi Spesialti & Kriya Nusantara (18 Produk)</span>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <a href="#katalog" className="hover:text-stone-900">
              Katalog 18 Produk
            </a>
            <button
              type="button"
              onClick={() => setIsTrackerOpen(true)}
              className="hover:text-stone-900"
            >
              Lacak Pesanan
            </button>
            <button
              type="button"
              onClick={() => handleOpenAdmin('sales')}
              className="hover:text-stone-900 font-semibold text-stone-800"
            >
              Panel Admin (2FA)
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <CartCheckoutDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={() => setCart([])}
        onSubmitOrder={handleSubmitOrder}
        onOpenAdminApproval={() => handleOpenAdmin('approvals')}
      />

      <OrderTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        orders={snapshot.orders}
        whatsappLogs={snapshot.whatsappLogs}
        onUploadProof={handleUploadProof}
      />

      <ProductDetailModal
        product={activeProductDetail}
        onClose={() => setActiveProductDetail(null)}
        onAddToCart={handleAddToCart}
      />

      <AdminLogin2FAModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginStep1={handleLoginStep1}
        onVerifyStep2={handleVerifyStep2}
      />
    </div>
  );
}

export default App;
