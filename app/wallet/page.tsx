'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  CreditCardIcon, 
  ArrowUpRightIcon, 
  ArrowDownLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  WalletIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/solid';
import { getMyWallet, getWalletTransactions, requestWithdrawal, Wallet, WalletTransaction, WithdrawalRequest } from '@/lib/api-client';
import { toast } from 'react-hot-toast';

export default function WalletPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchWalletData();
  }, []);

  async function fetchWalletData() {
    try {
      setIsLoading(true);
      const [walletData, transactionsData] = await Promise.all([
        getMyWallet(),
        getWalletTransactions()
      ]);
      setWallet(walletData);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
      toast.error('Could not load wallet information');
    } finally {
      setIsLoading(false);
    }
  }

  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);

    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (wallet && amount > wallet.balance) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      setIsSubmitting(true);
      await requestWithdrawal(amount);
      toast.success('Withdrawal request submitted successfully');
      setIsWithdrawModalOpen(false);
      setWithdrawAmount('');
      fetchWalletData(); // Refresh data
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit withdrawal request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
            Specialist <span className="text-[#FF7A59]">Wallet</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium">Manage your clinical earnings and withdrawals.</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF7A59]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Balance Card */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-black dark:bg-white rounded-[2.5rem] p-8 text-white dark:text-black shadow-2xl relative overflow-hidden group">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#FF7A59]/20 rounded-full blur-3xl group-hover:bg-[#FF7A59]/40 transition-all duration-500"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-[#FF7A59] rounded-xl flex items-center justify-center">
                      <WalletIcon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 italic">Available Balance</span>
                  </div>
                  <h2 className="text-5xl font-black italic tracking-tighter mb-8">
                    {formatCurrency(wallet?.balance || 0)}
                  </h2>
                  <button 
                    onClick={() => setIsWithdrawModalOpen(true)}
                    className="w-full bg-[#FF7A59] hover:bg-[#ff8a6f] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-[#FF7A59]/20 active:scale-95"
                  >
                    Withdraw Funds
                  </button>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 shadow-sm">
                  <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                    <ArrowUpRightIcon className="w-4 h-4 text-green-500" />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Total Earned</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white italic">{formatCurrency(wallet?.totalIn || 0)}</p>
                </div>
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 shadow-sm">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center mb-4">
                    <ArrowDownLeftIcon className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Total Out</p>
                  <p className="text-lg font-black text-gray-900 dark:text-white italic">{formatCurrency(wallet?.totalOut || 0)}</p>
                </div>
              </div>
            </div>

            {/* Transactions Section */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2.5rem] shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">Transaction History</h3>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Live Updates</span>
                  </div>
                </div>

                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {transactions.length === 0 ? (
                    <div className="p-12 text-center">
                      <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ClockIcon className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                      </div>
                      <p className="text-sm font-black text-gray-400 uppercase tracking-widest italic">No transactions found</p>
                    </div>
                  ) : (
                    transactions.map((tx) => (
                      <div key={tx.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                            tx.type === 'CREDIT' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                          }`}>
                            {tx.type === 'CREDIT' ? <ArrowUpRightIcon className="w-6 h-6" /> : <ArrowDownLeftIcon className="w-6 h-6" />}
                          </div>
                          <div>
                            <p className="text-sm font-black text-gray-900 dark:text-white uppercase italic truncate max-w-[200px] sm:max-w-md">
                              {tx.description}
                            </p>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5 italic">
                              {formatDate(tx.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-base font-black italic ${
                            tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                          </p>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mt-0.5">
                            {tx.type}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl w-full max-w-md p-8 animate-in zoom-in duration-300">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-[#FF7A59]/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <CurrencyDollarIcon className="w-10 h-10 text-[#FF7A59]" />
              </div>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter mb-2">
                Withdraw <span className="text-[#FF7A59]">Earnings</span>
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium px-4">
                Enter the amount you would like to withdraw to your linked bank account.
              </p>
            </div>

            <form onSubmit={handleWithdrawalRequest} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 italic px-2">
                  Amount to Withdraw (USD)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                    <span className="text-gray-400 font-black italic">$</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-800 rounded-2xl py-4 pl-12 pr-6 text-lg font-black text-gray-900 dark:text-white italic focus:border-[#FF7A59] focus:outline-none transition-all"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="mt-3 flex items-center justify-between px-2">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                    Available: <span className="text-gray-900 dark:text-white">{formatCurrency(wallet?.balance || 0)}</span>
                  </p>
                  <button 
                    type="button"
                    onClick={() => setWithdrawAmount(wallet?.balance.toString() || '0')}
                    className="text-[10px] font-black text-[#FF7A59] uppercase tracking-widest italic hover:underline"
                  >
                    Max Amount
                  </button>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setIsWithdrawModalOpen(false)}
                  className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] bg-black dark:bg-white text-white dark:text-black hover:bg-gray-900 dark:hover:bg-gray-100 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-[#FF7A59] border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    'Request Payout'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
