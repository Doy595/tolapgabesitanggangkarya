import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  KeyRound,
  Lock,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';

interface AdminLogin2FAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginStep1: (
    email: string,
    password: string
  ) => Promise<{ requires2FA: boolean; otpCode: string; email: string }>;
  onVerifyStep2: (email: string, otpCode: string) => Promise<void>;
}

export const AdminLogin2FAModal: React.FC<AdminLogin2FAModalProps> = ({
  isOpen,
  onClose,
  onLoginStep1,
  onVerifyStep2,
}) => {
  const [step, setStep] = useState<'credentials' | '2fa'>('credentials');
  const [email, setEmail] = useState('admin@gabekarya.id');
  const [password, setPassword] = useState('AdminGabe2026!');
  const [otpInput, setOtpInput] = useState('');
  const [serverOtpCode, setServerOtpCode] = useState('');
  const [otpChannel, setOtpChannel] = useState<'TOTP' | 'WHATSAPP'>('TOTP');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await onLoginStep1(email, password);
      setServerOtpCode(res.otpCode);
      if (res.requires2FA) {
        setStep('2fa');
        setOtpInput(res.otpCode);
      } else {
        await onVerifyStep2(email, res.otpCode);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal memverifikasi kredensial admin.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onVerifyStep2(email, otpInput);
      setStep('credentials');
      setOtpInput('');
    } catch (err: any) {
      setError(err?.message || 'Kode OTP 2FA tidak valid.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await onLoginStep1(email, password);
      setServerOtpCode(res.otpCode);
      setOtpInput(res.otpCode);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/55 backdrop-blur-xs">
      <div
        className="w-full max-w-md bg-white rounded-2xl border border-stone-200 shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Login Panel Admin GabeKarya dengan Autentikasi Dua Faktor"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-[#FAF8F5]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-800 text-white flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900">
                {step === 'credentials'
                  ? 'Login Panel Admin GabeKarya'
                  : 'Verifikasi Autentikasi Dua Faktor (2FA)'}
              </h2>
              <p className="text-xs text-stone-600">
                {step === 'credentials'
                  ? 'Langkah 1 dari 2 · Kredensial Akun Pengelola'
                  : 'Langkah 2 dari 2 · Token Keamanan OTP 6 Digit'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200/50 transition-colors"
            aria-label="Tutup jendela login"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          {step === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Email Administrator
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-amber-800 text-stone-900"
                  placeholder="admin@gabekarya.id"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-stone-700">
                    Kata Sandi
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail('admin@gabekarya.id');
                      setPassword('AdminGabe2026!');
                    }}
                    className="text-xs font-semibold text-amber-800 hover:underline"
                  >
                    Isi Akun Demo
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-amber-800 text-stone-900"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-1 text-xs text-stone-600">
                <p className="font-semibold text-stone-900 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-amber-800" />
                  Perlindungan Akun Dua Lapis (2FA Aktif)
                </p>
                <p>
                  Setelah kata sandi terverifikasi, sistem akan menerbitkan kode OTP 6 digit satu kali pakai untuk melindungi akses ke persetujuan pembayaran dan database GabeKarya.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-lg bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
              >
                {loading ? 'Memverifikasi Kredensial...' : 'Lanjut ke Verifikasi 2FA'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              {/* Method Switcher */}
              <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setOtpChannel('TOTP')}
                  className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                    otpChannel === 'TOTP'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Authenticator App (TOTP)
                </button>
                <button
                  type="button"
                  onClick={() => setOtpChannel('WHATSAPP')}
                  className={`flex-1 py-1.5 px-3 text-xs font-semibold rounded-md transition-colors whitespace-nowrap ${
                    otpChannel === 'WHATSAPP'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  Kode OTP WhatsApp
                </button>
              </div>

              {/* Active Authenticator / Token Display */}
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-emerald-700" />
                    {otpChannel === 'TOTP'
                      ? 'Token Authenticator Aktif'
                      : 'Pesan OTP WhatsApp Admin (+62 811-900-2026)'}
                  </span>
                  <button
                    type="button"
                    onClick={handleRegenerateOtp}
                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-800 hover:underline"
                  >
                    <RefreshCw className="w-3 h-3" /> Buat Kode Baru
                  </button>
                </div>

                <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-lg border border-emerald-200">
                  <div>
                    <p className="text-[11px] text-stone-500">Kode Verifikasi 6 Digit Saat Ini</p>
                    <p className="text-xl font-mono font-bold tracking-widest text-stone-900 tabular-nums">
                      {serverOtpCode || '246810'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOtpInput(serverOtpCode || '246810')}
                    className="px-3 py-1.5 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" /> Gunakan Kode
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Masukkan 6 Digit Kode OTP 2FA
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-10 pr-4 py-3 text-lg font-mono font-bold tracking-[0.35em] bg-white border border-stone-300 rounded-lg focus:outline-none focus:border-amber-800 text-stone-900 tabular-nums"
                    placeholder="000000"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep('credentials')}
                  className="px-4 py-2.5 rounded-lg border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  disabled={loading || otpInput.length < 6}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-amber-800 hover:bg-amber-900 disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {loading ? 'Memverifikasi Token...' : 'Verifikasi 2FA & Masuk Panel Admin'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
