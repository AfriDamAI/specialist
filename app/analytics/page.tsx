'use client';

import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import {
  ArrowTrendingUpIcon,
  BanknotesIcon,
  StarIcon,
  UsersIcon,
  InformationCircleIcon,
  XMarkIcon,
  WalletIcon,
  QuestionMarkCircleIcon,
  DocumentArrowDownIcon,
  ArrowDownLeftIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/solid';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { toast } from 'react-hot-toast';
import { apiClient } from '@/lib/api-client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Payout Matrix ────────────────────────────────────────────────────────────
const PAYOUT_MATRIX = {
  Instant:  { Consultant: 800,  Nurse: 1000, MedicalOfficer: 1500, Dermatologist: 35000 },
  Starter:  { Consultant: 800,  Nurse: 1000, MedicalOfficer: 1500, Dermatologist: 0 },
  Standard: { Consultant: 1200, Nurse: 2000, MedicalOfficer: 2500, Dermatologist: 0 },
  Premium:  { Consultant: 2000, Nurse: 3000, MedicalOfficer: 4000, Dermatologist: 0 },
  VIP:      { Consultant: 0,    Nurse: 3000, MedicalOfficer: 4000, Dermatologist: 20000 },
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface WalletTransaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description?: string;
  createdAt: string;
}

interface WalletData {
  balance: number;
  totalIn: number;
  totalOut: number;
}

interface Assignment {
  id: string;
  status: string;
  createdAt: string;
  appointment?: {
    planTier?: string;
    user?: { firstName: string; lastName: string };
  };
  planTier?: string;
  name?: string;
}

interface SpecialistProfile {
  firstName?: string;
  lastName?: string;
  specialization?: string;
  rating?: number;          // ← backend may return this field
  averageRating?: number;   // ← alternate field name
  ratingCount?: number;
}

// ─── Date Helpers ─────────────────────────────────────────────────────────────
const startOfToday = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const startOfThisWeek = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay()); // Sunday
  return d;
};

const startOfThisMonth = (): Date => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  return d;
};

/**
 * Sum all CREDIT transactions whose createdAt is >= the given start Date.
 */
const sumCreditsFrom = (transactions: WalletTransaction[], from: Date): number =>
  transactions
    .filter(
      (tx) => tx.type === 'CREDIT' && new Date(tx.createdAt) >= from
    )
    .reduce((acc, tx) => acc + tx.amount, 0);

/**
 * Group CREDIT transactions into 12 weekly buckets (most recent 12 weeks).
 * Week 1 = oldest, Week 12 = current partial week.
 */
const buildWeeklyChartData = (transactions: WalletTransaction[]) => {
  const now = new Date();
  const weeks: { name: string; value: number }[] = [];

  for (let i = 11; i >= 0; i--) {
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - i * 7);
    weekEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    const total = transactions
      .filter(
        (tx) =>
          tx.type === 'CREDIT' &&
          new Date(tx.createdAt) >= weekStart &&
          new Date(tx.createdAt) <= weekEnd
      )
      .reduce((acc, tx) => acc + tx.amount, 0);

    weeks.push({ name: `W${12 - i}`, value: total });
  }

  return weeks;
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [isMounted, setIsMounted]               = useState(false);
  const [isLoading, setIsLoading]               = useState(true);
  const [isModalOpen, setIsModalOpen]           = useState(false);
  const [showRates, setShowRates]               = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [isWithdrawing, setIsWithdrawing]       = useState(false);
  const [specialistRole, setSpecialistRole]     = useState('Nurse');

  // ── Real data state ──────────────────────────────────────────────────────
  const [rawCases, setRawCases]           = useState<Assignment[]>([]);
  const [transactions, setTransactions]   = useState<WalletTransaction[]>([]);
  const [wallet, setWallet]               = useState<WalletData | null>(null);
  const [profile, setProfile]             = useState<SpecialistProfile | null>(null);

  // ─── Derived metrics (calculated from real data, never hardcoded) ─────────
  const completedCases = rawCases.filter((c) => c.status === 'COMPLETED');

  const todayEarnings   = sumCreditsFrom(transactions, startOfToday());
  const weeklyEarnings  = sumCreditsFrom(transactions, startOfThisWeek());
  const monthlyEarnings = sumCreditsFrom(transactions, startOfThisMonth());

  // Lifetime earnings = wallet.totalIn (sum of all CREDITs ever posted to wallet)
  const lifetimeEarnings   = wallet?.totalIn  ?? 0;
  // Lifetime withdrawals   = wallet.totalOut (sum of all approved DEBITs)
  const lifetimeWithdrawals = wallet?.totalOut ?? 0;
  // Current balance
  const availableBalance   = wallet?.balance   ?? 0;

  // Rating: prefer numeric fields from /specialists/me; fall back to null (not fake)
  const ratingScore = profile?.rating ?? profile?.averageRating ?? null;
  const ratingCount = profile?.ratingCount ?? null;

  // Chart: real weekly CREDIT totals
  const chartData = buildWeeklyChartData(transactions);

  // ─── Fetch ───────────────────────────────────────────────────────────────
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const rawRole = localStorage.getItem('specialistRole') || 'Nurse';
      setSpecialistRole(rawRole);

      const [assignmentsRes, walletRes, transactionsRes, profileRes] =
        await Promise.allSettled([
          apiClient('/appointments/assignments/me'),
          apiClient('/wallets/me'),
          apiClient('/wallets/me/transactions'),
          apiClient('/specialists/me'),
        ]);

      // Assignments
      if (assignmentsRes.status === 'fulfilled') {
        const raw = assignmentsRes.value;
        const data: Assignment[] = raw?.resultData ?? raw?.data ?? raw ?? [];
        if (Array.isArray(data)) setRawCases(data);
      }

      // Wallet
      if (walletRes.status === 'fulfilled') {
        const raw = walletRes.value;
        const data = raw?.resultData ?? raw?.data ?? raw;
        if (data) setWallet(data as WalletData);
      }

      // Transactions
      if (transactionsRes.status === 'fulfilled') {
        const raw = transactionsRes.value;
        const data: WalletTransaction[] =
          raw?.resultData ?? raw?.data ?? raw ?? [];
        if (Array.isArray(data)) setTransactions(data);
      }

      // Specialist profile (rating lives here)
      if (profileRes.status === 'fulfilled') {
        const raw = profileRes.value;
        const data = raw?.resultData ?? raw?.data ?? raw;
        if (data) {
          setProfile(data as SpecialistProfile);
          setSpecialistRole(data.specialization || rawRole);
          localStorage.setItem('specialistRole', data.specialization || rawRole);
        }
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsMounted(true);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // ─── PDF Report ──────────────────────────────────────────────────────────
  const downloadReport = () => {
    const doc   = new jsPDF();
    const roleKey =
      specialistRole.replace(/\s/g, '') as keyof typeof PAYOUT_MATRIX.Instant;
    const now = new Date();

    doc.setFontSize(22);
    doc.text('AFRIDAM AI — EARNINGS REPORT', 14, 20);
    doc.setFontSize(10);
    doc.text(`Specialist : ${localStorage.getItem('specialistName') || 'Personnel'}`, 14, 30);
    doc.text(`Role       : ${specialistRole}`, 14, 36);
    doc.text(`Report Date: ${now.toLocaleDateString()}`, 14, 42);
    doc.text(`Period     : All time`, 14, 48);

    // Summary block
    doc.setFontSize(11);
    doc.text(`Today's Earnings  : ₦${todayEarnings.toLocaleString()}`, 14, 58);
    doc.text(`Weekly Earnings   : ₦${weeklyEarnings.toLocaleString()}`, 14, 64);
    doc.text(`Monthly Earnings  : ₦${monthlyEarnings.toLocaleString()}`, 14, 70);
    doc.text(`Lifetime Earnings : ₦${lifetimeEarnings.toLocaleString()}`, 14, 76);
    doc.text(`Total Withdrawals : ₦${lifetimeWithdrawals.toLocaleString()}`, 14, 82);
    doc.text(`Available Balance : ₦${availableBalance.toLocaleString()}`, 14, 88);
    doc.text(`Completed Cases   : ${completedCases.length}`, 14, 94);
    if (ratingScore !== null) {
      doc.text(`Service Rating    : ${ratingScore.toFixed(1)} / 5.0${ratingCount ? ` (${ratingCount} reviews)` : ''}`, 14, 100);
    }

    // Case table
    const tableData = rawCases.map((item, i) => {
      const user = item.appointment?.user;
      const tier = (item.appointment?.planTier ?? item.planTier ?? 'Starter') as keyof typeof PAYOUT_MATRIX;
      const payout = (PAYOUT_MATRIX[tier]?.[roleKey] ?? 0).toLocaleString();
      return [
        i + 1,
        user ? `${user.firstName} ${user.lastName}` : (item.name || 'Patient'),
        tier,
        item.status,
        new Date(item.createdAt).toLocaleDateString(),
        `₦${payout}`,
      ];
    });

    autoTable(doc, {
      startY: 110,
      head: [['#', 'Patient', 'Tier', 'Status', 'Date', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
    });

    doc.save(`AfriDam_Earnings_${now.getMonth() + 1}_${now.getFullYear()}.pdf`);
    toast.success('Earnings report saved.');
  };

  // ─── Withdrawal ──────────────────────────────────────────────────────────
  const handleWithdrawal = async () => {
    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) return toast.error('Enter a valid amount.');
    if (amount > availableBalance)    return toast.error('Insufficient balance.');

    setIsWithdrawing(true);
    try {
      await apiClient('/withdrawals/request', {
        method: 'POST',
        body: JSON.stringify({ amount }),
      });
      toast.success(`Withdrawal of ₦${amount.toLocaleString()} requested.`);
      setIsModalOpen(false);
      setWithdrawalAmount('');
      fetchAllData(); // refresh balance
    } catch (error: any) {
      toast.error(error.message || 'Withdrawal request failed.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const roleKey =
    specialistRole.replace(/\s/g, '') as keyof typeof PAYOUT_MATRIX.Instant;

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="w-full max-w-7xl mx-auto space-y-8 pb-24 text-left italic">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
              Earnings <span className="text-[#FF7A59]">Overview</span>
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">
              Performance Metrics • {specialistRole}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={downloadReport}
              className="flex items-center gap-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-[#FF7A59] transition-all"
            >
              <DocumentArrowDownIcon className="w-5 h-5" />
              Save Report
            </button>
            <button
              onClick={() => setShowRates(!showRates)}
              className="p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-500 hover:text-[#FF7A59] transition-all"
            >
              <QuestionMarkCircleIcon className="w-6 h-6" />
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-2xl transition-all active:scale-95"
            >
              <WalletIcon className="w-4 h-4" />
              Withdraw Funds
            </button>
          </div>
        </div>

        {/* ── Rates Drawer ────────────────────────────────────────────────── */}
        {showRates && (
          <div className="bg-[#FF7A59] rounded-[2.5rem] p-8 text-white shadow-xl animate-in slide-in-from-top-4 duration-500">
            <h3 className="text-xs font-black uppercase tracking-widest mb-6 italic">
              Current Rates: {specialistRole}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.keys(PAYOUT_MATRIX).map((tier) => (
                <div key={tier} className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                  <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">{tier}</p>
                  <p className="text-lg font-black tracking-tighter mt-1">
                    ₦{(PAYOUT_MATRIX[tier as keyof typeof PAYOUT_MATRIX][roleKey] ?? 0).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Loading Skeleton ────────────────────────────────────────────── */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-[2.5rem] h-44" />
            ))}
          </div>
        ) : (
          <>
            {/* ── Top Stats Row ────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

              {/* Rating — real from /specialists/me */}
              <StatMiniCard
                icon={<StarIcon className="w-5 h-5 text-amber-400" />}
                label="Service Rating"
                value={
                  ratingScore !== null
                    ? `${ratingScore.toFixed(1)} / 5.0`
                    : 'No ratings yet'
                }
                sub={ratingCount ? `${ratingCount} review${ratingCount !== 1 ? 's' : ''}` : undefined}
              />

              {/* Available Balance — real from /wallets/me */}
              <StatMiniCard
                icon={<BanknotesIcon className="w-5 h-5 text-green-500" />}
                label="Available Balance"
                value={`₦${availableBalance.toLocaleString()}`}
              />

              {/* Total Completed Cases — filtered from assignments */}
              <StatMiniCard
                icon={<UsersIcon className="w-5 h-5 text-blue-500" />}
                label="Completed Cases"
                value={completedCases.length.toString()}
                sub={`${rawCases.length} total assigned`}
              />
            </div>

            {/* ── Earnings Breakdown Row ───────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <EarningsCard
                label="Today"
                icon={<CalendarDaysIcon className="w-4 h-4" />}
                value={todayEarnings}
              />
              <EarningsCard
                label="This Week"
                icon={<ArrowTrendingUpIcon className="w-4 h-4" />}
                value={weeklyEarnings}
              />
              <EarningsCard
                label="This Month"
                icon={<BanknotesIcon className="w-4 h-4" />}
                value={monthlyEarnings}
              />
              <EarningsCard
                label="All Time Earned"
                icon={<WalletIcon className="w-4 h-4" />}
                value={lifetimeEarnings}
                highlight
              />
            </div>

            {/* ── Withdrawals Summary ──────────────────────────────────────── */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-[2rem] p-6 flex items-center justify-between border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-2xl">
                  <ArrowDownLeftIcon className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Withdrawn (All Time)</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter mt-0.5">
                    ₦{lifetimeWithdrawals.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right hidden md:block">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Net Balance Check</p>
                <p className="text-sm font-black text-gray-500 mt-0.5">
                  ₦{lifetimeEarnings.toLocaleString()} earned − ₦{lifetimeWithdrawals.toLocaleString()} withdrawn = ₦{availableBalance.toLocaleString()}
                </p>
              </div>
            </div>

            {/* ── Chart + Summary ──────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* Weekly earnings chart — built from real transaction data */}
              <div className="lg:col-span-8 bg-white dark:bg-gray-950 rounded-[3.5rem] border border-gray-100 dark:border-gray-800 p-10 min-h-[400px] flex flex-col shadow-sm">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest italic">
                      Weekly Earnings
                    </h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                      Last 12 Weeks • CREDIT Transactions
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="w-2 h-2 rounded-full bg-[#FF7A59]" />
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">₦ Earned</span>
                  </div>
                </div>

                <div className="flex-1 w-full h-[300px]">
                  {isMounted && (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 900 }}
                          dy={10}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 900 }}
                          tickFormatter={(v) => v === 0 ? '₦0' : `₦${(v / 1000).toFixed(0)}k`}
                        />
                        <Tooltip
                          cursor={{ fill: 'transparent' }}
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 p-4 rounded-2xl shadow-2xl">
                                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    {payload[0].payload.name}
                                  </p>
                                  <p className="text-lg font-black text-[#FF7A59] mt-1 italic">
                                    ₦{Number(payload[0].value).toLocaleString()}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="value" radius={[10, 10, 10, 10]} barSize={32}>
                          {chartData.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={index % 2 === 0 ? '#FF7A59' : '#FF7A59cc'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}

                  {/* Empty state when no transaction history yet */}
                  {isMounted && transactions.length === 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                        No earnings data yet
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Summary card — all real counts */}
              <div className="lg:col-span-4 bg-black dark:bg-white p-10 rounded-[3.5rem] text-white dark:text-black flex flex-col justify-center gap-6">
                <div className="flex items-center gap-3">
                  <InformationCircleIcon className="w-6 h-6 text-[#FF7A59]" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest italic">Summary</h3>
                </div>

                <div className="space-y-4">
                  <SummaryRow
                    label="Completed cases"
                    value={completedCases.length.toString()}
                  />
                  <SummaryRow
                    label="This month"
                    value={`₦${monthlyEarnings.toLocaleString()}`}
                  />
                  <SummaryRow
                    label="Lifetime earned"
                    value={`₦${lifetimeEarnings.toLocaleString()}`}
                  />
                  {ratingScore !== null && (
                    <SummaryRow
                      label="Rating"
                      value={`${ratingScore.toFixed(1)} ★`}
                    />
                  )}
                </div>

                <p className="text-[9px] font-black uppercase tracking-widest opacity-40 italic leading-relaxed">
                  Payments processed within 24 hours of approval.
                </p>
              </div>
            </div>
          </>
        )}

        {/* ── Withdrawal Modal ────────────────────────────────────────────── */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
              onClick={() => setIsModalOpen(false)}
            />
            <div className="bg-white dark:bg-gray-900 w-full max-w-md p-10 rounded-[3.5rem] relative z-10 shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in duration-300">
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-8 right-8 text-gray-400 hover:text-black dark:hover:text-white transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
                Withdraw <span className="text-[#FF7A59]">Funds</span>
              </h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase mt-2">
                Available: ₦{availableBalance.toLocaleString()}
              </p>

              <div className="mt-8 space-y-4">
                <input
                  type="number"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  placeholder="Enter Amount"
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm font-black text-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF7A59] outline-none italic"
                />
                <button
                  onClick={handleWithdrawal}
                  disabled={isWithdrawing}
                  className="w-full bg-[#FF7A59] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl italic disabled:opacity-50"
                >
                  {isWithdrawing ? 'Processing…' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatMiniCard({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:-translate-y-1">
      <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl w-fit">{icon}</div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-6 italic">{label}</p>
      <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter mt-1">{value}</p>
      {sub && (
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">{sub}</p>
      )}
    </div>
  );
}

function EarningsCard({
  label,
  icon,
  value,
  highlight = false,
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-[2rem] p-6 border transition-all hover:-translate-y-1 ${
        highlight
          ? 'bg-[#FF7A59] text-white border-transparent shadow-xl shadow-[#FF7A59]/20'
          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-100 dark:border-gray-700 shadow-sm'
      }`}
    >
      <div
        className={`p-2 rounded-xl w-fit mb-4 ${
          highlight ? 'bg-white/20' : 'bg-gray-50 dark:bg-gray-900'
        }`}
      >
        <span className={highlight ? 'text-white' : 'text-[#FF7A59]'}>{icon}</span>
      </div>
      <p
        className={`text-[9px] font-black uppercase tracking-widest italic ${
          highlight ? 'text-white/70' : 'text-gray-400'
        }`}
      >
        {label}
      </p>
      <p className="text-xl font-black tracking-tighter mt-1">
        ₦{value.toLocaleString()}
      </p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[9px] font-black uppercase tracking-widest opacity-50 italic">{label}</span>
      <span className="text-sm font-black tracking-tight text-[#FF7A59]">{value}</span>
    </div>
  );
}