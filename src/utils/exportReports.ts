import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Customer, Order, OrderStatus, Product } from '../types/marketplace';

export function formatIDR(amount: number): string {
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

export function formatDateID(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function getOrderStatusInfo(status: OrderStatus): {
  label: string;
  tone: 'amber' | 'blue' | 'emerald' | 'indigo' | 'red';
} {
  switch (status) {
    case 'MENUNGGU_PEMBAYARAN':
      return { label: 'Menunggu Pembayaran', tone: 'amber' };
    case 'MENUNGGU_VERIFIKASI':
      return { label: 'Verifikasi Bukti Transfer', tone: 'blue' };
    case 'DIBAYAR_DIPROSES':
      return { label: 'Dibayar · Diproses', tone: 'emerald' };
    case 'DIKIRIM':
      return { label: 'Dalam Pengiriman', tone: 'indigo' };
    case 'SELESAI':
      return { label: 'Pesanan Selesai', tone: 'emerald' };
    case 'DIBATALKAN':
      return { label: 'Dibatalkan', tone: 'red' };
    default:
      return { label: status, tone: 'amber' };
  }
}

export function computeSalesMetrics(orders: Order[], products: Product[]) {
  const validOrders = orders.filter((o) => o.status !== 'DIBATALKAN');
  const paidOrders = orders.filter((o) =>
    ['DIBAYAR_DIPROSES', 'DIKIRIM', 'SELESAI'].includes(o.status)
  );
  const pendingApprovalOrders = orders.filter((o) => o.status === 'MENUNGGU_VERIFIKASI');

  const totalRevenue = paidOrders.reduce((acc, o) => acc + o.totalAmount, 0);
  const grossPipelineRevenue = validOrders.reduce((acc, o) => acc + o.totalAmount, 0);

  let totalCost = 0;
  for (const order of paidOrders) {
    for (const item of order.items) {
      totalCost += (item.costPrice || Math.round(item.price * 0.6)) * item.quantity;
    }
  }
  const grossProfit = Math.max(0, totalRevenue - totalCost);
  const averageOrderValue = paidOrders.length > 0 ? Math.round(totalRevenue / paidOrders.length) : 0;
  const lowStockCount = products.filter((p) => p.stock <= p.minStock).length;

  return {
    totalRevenue,
    grossPipelineRevenue,
    grossProfit,
    paidOrdersCount: paidOrders.length,
    totalOrdersCount: orders.length,
    pendingApprovalCount: pendingApprovalOrders.length,
    averageOrderValue,
    lowStockCount,
  };
}

export function exportSalesReportPDF(params: {
  orders: Order[];
  products: Product[];
  customers: Customer[];
}) {
  const { orders, products, customers } = params;
  const metrics = computeSalesMetrics(orders, products);
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

  const nowStr = new Date().toLocaleString('id-ID');

  // Header
  doc.setFontSize(18);
  doc.setTextColor(28, 25, 23);
  doc.text('GABEKARYA MARKETPLACE — LAPORAN ANALITIK PENJUALAN & INVENTORI', 40, 42);

  doc.setFontSize(10);
  doc.setTextColor(87, 83, 78);
  doc.text(
    `Sumber Data: Single Source of Truth Relational Database  |  Dicetak: ${nowStr}  |  Total Pelanggan: ${customers.length}`,
    40,
    60
  );

  // 1. Executive Summary Table
  autoTable(doc, {
    startY: 75,
    head: [
      [
        'Pendapatan Terverifikasi',
        'Estimasi Laba Kotor',
        'Total Pipeline Order',
        'Rata-Rata Transaksi (AOV)',
        'Order Lunas / Selesai',
        'Menunggu Approval Bukti',
      ],
    ],
    body: [
      [
        formatIDR(metrics.totalRevenue),
        formatIDR(metrics.grossProfit),
        formatIDR(metrics.grossPipelineRevenue),
        formatIDR(metrics.averageOrderValue),
        `${metrics.paidOrdersCount} Pesanan`,
        `${metrics.pendingApprovalCount} Pesanan`,
      ],
    ],
    theme: 'grid',
    headStyles: { fillColor: [154, 52, 18], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 10, fontStyle: 'bold', textColor: [28, 25, 23] },
    margin: { left: 40, right: 40 },
  });

  // 2. Orders Detail Table
  const afterSummaryY = (doc as any).lastAutoTable.finalY + 22;
  doc.setFontSize(12);
  doc.setTextColor(28, 25, 23);
  doc.text('Daftar Transaksi & Status Verifikasi Pembayaran', 40, afterSummaryY);

  autoTable(doc, {
    startY: afterSummaryY + 8,
    head: [
      [
        'ID Order',
        'Tanggal',
        'Nama Pelanggan',
        'No. WhatsApp',
        'Metode Bayar',
        'Status Order',
        'Notifikasi WA',
        'Total Belanja',
      ],
    ],
    body: orders.map((o) => [
      o.id,
      formatDateID(o.createdAt),
      o.customerName,
      o.customerWhatsapp,
      o.paymentMethod,
      getOrderStatusInfo(o.status).label,
      o.whatsappNotified ? 'Terkirim Otomatis' : 'Menunggu',
      formatIDR(o.totalAmount),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [41, 37, 36], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [28, 25, 23] },
    margin: { left: 40, right: 40 },
  });

  // 3. Product Stock & Sales Performance
  const afterOrdersY = (doc as any).lastAutoTable.finalY + 22;
  doc.setFontSize(12);
  doc.setTextColor(28, 25, 23);
  doc.text('Performa Penjualan Produk & Sisa Stok Database (18 Produk)', 40, afterOrdersY);

  autoTable(doc, {
    startY: afterOrdersY + 8,
    head: [
      [
        'SKU',
        'Nama Produk',
        'Kategori',
        'Harga Jual',
        'HPP',
        'Unit Terjual',
        'Sisa Stok',
        'Estimasi Omzet Produk',
      ],
    ],
    body: products.map((p) => [
      p.sku,
      p.name,
      p.categoryLabel,
      formatIDR(p.price),
      formatIDR(p.costPrice),
      `${p.soldCount} Unit`,
      `${p.stock} (${p.stock <= p.minStock ? 'Stok Menipis' : 'Aman'})`,
      formatIDR(p.price * p.soldCount),
    ]),
    theme: 'striped',
    headStyles: { fillColor: [21, 128, 61], textColor: 255, fontSize: 9 },
    bodyStyles: { fontSize: 8.5, textColor: [28, 25, 23] },
    margin: { left: 40, right: 40 },
  });

  const dateTag = new Date().toISOString().slice(0, 10);
  doc.save(`Laporan_Penjualan_GabeKarya_${dateTag}.pdf`);
}

export function exportSalesReportExcel(params: {
  orders: Order[];
  products: Product[];
  customers: Customer[];
}) {
  const { orders, products, customers } = params;
  const metrics = computeSalesMetrics(orders, products);

  const wb = XLSX.utils.book_new();

  // Sheet 1: Ringkasan Eksekutif
  const summaryRows = [
    { Metrik: 'Brand Marketplace', Nilai: 'GabeKarya Marketplace' },
    { Metrik: 'Total Pendapatan Terverifikasi (IDR)', Nilai: metrics.totalRevenue },
    { Metrik: 'Estimasi Laba Kotor (IDR)', Nilai: metrics.grossProfit },
    { Metrik: 'Total Pipeline Seluruh Order (IDR)', Nilai: metrics.grossPipelineRevenue },
    { Metrik: 'Rata-Rata Nilai Transaksi / AOV (IDR)', Nilai: metrics.averageOrderValue },
    { Metrik: 'Jumlah Order Lunas / Diproses / Selesai', Nilai: metrics.paidOrdersCount },
    { Metrik: 'Jumlah Order Menunggu Approval Bukti', Nilai: metrics.pendingApprovalCount },
    { Metrik: 'Total Produk Aktif (3 Kategori)', Nilai: products.length },
    { Metrik: 'Total Pelanggan Terdaftar', Nilai: customers.length },
  ];
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan_GabeKarya');

  // Sheet 2: Data Order & Pembayaran
  const orderRows = orders.map((o) => ({
    ID_Order: o.id,
    Tanggal_Order: formatDateID(o.createdAt),
    ID_Pelanggan: o.customerId,
    Nama_Pelanggan: o.customerName,
    WhatsApp_Pelanggan: o.customerWhatsapp,
    Kota_Tujuan: o.shippingCity,
    Kurir: o.shippingCourier,
    Metode_Pembayaran: o.paymentMethod,
    Ref_Bukti_Bayar: o.paymentProof?.referenceNumber || '-',
    Status_Verifikasi: o.paymentProof?.status || 'BELUM_UNGGAH',
    Status_Pesanan: getOrderStatusInfo(o.status).label,
    Notifikasi_WA_Otomatis: o.whatsappNotified ? 'TERKIRIM' : 'BELUM',
    Subtotal_IDR: o.subtotal,
    Ongkir_IDR: o.shippingCost,
    Total_Bayar_IDR: o.totalAmount,
  }));
  const wsOrders = XLSX.utils.json_to_sheet(orderRows);
  XLSX.utils.book_append_sheet(wb, wsOrders, 'Daftar_Order');

  // Sheet 3: Produk & Stok
  const productRows = products.map((p) => ({
    ID_Produk: p.id,
    SKU: p.sku,
    Nama_Produk: p.name,
    Kategori: p.categoryLabel,
    Asal_Daerah: p.origin,
    Harga_Jual_IDR: p.price,
    Harga_Pokok_IDR: p.costPrice,
    Margin_Unit_IDR: p.price - p.costPrice,
    Stok_Tersedia: p.stock,
    Batas_Stok_Minimum: p.minStock,
    Total_Unit_Terjual: p.soldCount,
    Estimasi_Omzet_Produk_IDR: p.price * p.soldCount,
  }));
  const wsProducts = XLSX.utils.json_to_sheet(productRows);
  XLSX.utils.book_append_sheet(wb, wsProducts, 'Stok_18_Produk');

  // Sheet 4: Data Pelanggan
  const customerRows = customers.map((c) => ({
    ID_Pelanggan: c.id,
    Nama_Lengkap: c.name,
    Email: c.email,
    Nomor_WhatsApp: c.whatsapp,
    Alamat: c.address,
    Kota: c.city,
    Kode_Pos: c.postalCode,
    Segmen_Pelanggan: c.tier,
    Total_Frekuensi_Order: c.totalOrders,
    Total_Belanja_Lunas_IDR: c.totalSpent,
    Order_Terakhir: formatDateID(c.lastOrderAt),
  }));
  const wsCustomers = XLSX.utils.json_to_sheet(customerRows);
  XLSX.utils.book_append_sheet(wb, wsCustomers, 'Data_Pelanggan_WA');

  const dateTag = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Laporan_Sales_GabeKarya_${dateTag}.xlsx`);
}
