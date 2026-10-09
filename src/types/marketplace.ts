export type CategoryId = 'kopi-spesialti' | 'alat-seduh-keramik' | 'pantry-hamper';

export interface CategoryMeta {
  id: CategoryId;
  name: string;
  shortLabel: string;
  description: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: CategoryId;
  categoryLabel: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  unit: string;
  weightGram: number;
  origin: string;
  craftNotes: string;
  description: string;
  imageUrl: string;
  imagePosition?: string;
  featured: boolean;
  soldCount: number;
  rating: number;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  whatsapp: string;
  address: string;
  city: string;
  postalCode: string;
  tier: 'Reguler' | 'Prioritas' | 'Kolektor';
  totalOrders: number;
  totalSpent: number;
  joinedAt: string;
  lastOrderAt: string;
}

export type OrderStatus =
  | 'MENUNGGU_PEMBAYARAN'
  | 'MENUNGGU_VERIFIKASI'
  | 'DIBAYAR_DIPROSES'
  | 'DIKIRIM'
  | 'SELESAI'
  | 'DIBATALKAN';

export interface OrderItem {
  productId: string;
  sku: string;
  productName: string;
  categoryLabel: string;
  price: number;
  costPrice: number;
  quantity: number;
  subtotal: number;
  imageUrl: string;
}

export interface PaymentProof {
  bankName: string;
  accountName: string;
  transferAmount: number;
  referenceNumber: string;
  transferDate: string;
  receiptImageUrl?: string;
  notes?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  verifiedBy?: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

export interface OrderTimelineEvent {
  id: string;
  timestamp: string;
  status: string;
  title: string;
  description: string;
  actor: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerWhatsapp: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  shippingCourier: string;
  shippingCost: number;
  subtotal: number;
  totalAmount: number;
  paymentMethod: string;
  status: OrderStatus;
  trackingNumber?: string;
  items: OrderItem[];
  paymentProof?: PaymentProof;
  timeline: OrderTimelineEvent[];
  whatsappNotified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WhatsAppNotification {
  id: string;
  orderId: string;
  customerName: string;
  whatsappNumber: string;
  message: string;
  triggerType: 'PAYMENT_APPROVED' | 'PAYMENT_REJECTED' | 'ORDER_SHIPPED' | 'OTP_2FA';
  status: 'DELIVERED' | 'SENT';
  sentAt: string;
  waDirectUrl: string;
}

export interface Security2FALog {
  id: string;
  email: string;
  action: string;
  ipAddress: string;
  otpMethod: 'TOTP_AUTHENTICATOR' | 'WHATSAPP_OTP';
  status: 'SUCCESS' | 'CHALLENGE_ISSUED' | 'FAILED';
  timestamp: string;
}

export interface DatabaseSnapshot {
  engine: string;
  dbFilePath: string;
  lastSyncAt: string;
  transactionCount: number;
  twoFactorEnabled: boolean;
  products: Product[];
  customers: Customer[];
  orders: Order[];
  whatsappLogs: WhatsAppNotification[];
  securityLogs: Security2FALog[];
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'kopi-spesialti',
    name: 'Kopi Spesialti Nusantara',
    shortLabel: 'Kopi Spesialti',
    description: 'Biji kopi arabika single-origin pilihan mikro dari dataran tinggi Aceh Gayo, Toraja, Kintamani, Flores, Kerinci, dan Ijen.',
  },
  {
    id: 'alat-seduh-keramik',
    name: 'Alat Seduh & Keramik Handcrafted',
    shortLabel: 'Alat Seduh & Keramik',
    description: 'Kriya tembaga Boyolali, stoneware bakar tinggi Kasongan, server kaca, dan penggiling presisi untuk ritual seduh manual harian.',
  },
  {
    id: 'pantry-hamper',
    name: 'Pantry, Rempah & Hamper Nusantara',
    shortLabel: 'Pantry & Hamper',
    description: 'Madu hutan liar Sumbawa, cokelat single-origin, teh putih pucuk perak, gula aren organik, dan bingkisan rotan kurasi.',
  },
];
