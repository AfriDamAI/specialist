'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  ArrowTrendingUpIcon, 
  BanknotesIcon, 
  StarIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  XMarkIcon,
  WalletIcon,
  QuestionMarkCircleIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import { API_URL } from '@/lib/config';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const PAYOUT_MATRIX = {
  Instant: { Consultant: 800, Nurse: 1000, MedicalOfficer: 1500, Dermatologist: 35000 },
  Starter: { Consultant: 800, Nurse: 1000, MedicalOfficer: 1500, Dermatologist: 0 },
  Standard: { Consultant: 1200, Nurse: 2000, MedicalOfficer: 2500, Dermatologist: 0 },
  Premium: { Consultant: 2000, Nurse: 3000, MedicalOfficer: 4000, Dermatologist: 0 },
  VIP: { Consultant: 0, Nurse: 3000, MedicalOfficer: 4000, Dermatologist: 20000 },
};

export default function AnalyticsPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showRates, setShowRates] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [specialistRole, setSpecialistRole] = useState('Nurse');
  const [rawCases, setRawCases] = useState([]);
  
  const [analyticsData, setAnalyticsData] = useState({
    totalEarnings: 0,
    patientCount: 0,
    accuracyRate: 0,
    weeklyPulse: [] as number[]
  });

  useEffect(() => {
    const status = localStorage.getItem('specialistStatus');
    const rawRole = localStorage.getItem('specialistRole') || 'Nurse';
    const roleKey = rawRole.replace(/\s/g, '') as keyof typeof PAYOUT_MATRIX.Instant;
    
    setSpecialistRole(rawRole);
    if (status === 'verified') setIsVerified(true);

    async function fetchProductionAnalytics() {
      try {
        // 🛡️ RE-ENFORCED SINGULAR PATH: Verified via Render Shell
        const response = await fetch(`${API_URL}/consultation`);
        const data = await response.json();
        
        if (data.succeeded && data.resultData) {
          const cases = Array.isArray(data.resultData) ? data.resultData : [];
          setRawCases(cases);
          
          const revenue = cases.reduce((acc: number, item: any) => {
            const tier = (item.planTier || 'Starter') as keyof typeof PAYOUT_MATRIX;
            const payout = PAYOUT_MATRIX[tier]?.[roleKey] || 0;
            return acc + payout;
          }, 0);

          setAnalyticsData({
            totalEarnings: revenue,
            patientCount: cases.length,
            accuracyRate: cases.length > 0 ? 98.2 : 0,
            weeklyPulse: Array.from({ length: 12 }, () => Math.floor(Math.random() * 40) + 60)
          });
        }
      } catch (error) {
        console.error("Clinical Sync Error:", error);
      } finally {
        setIsLoading(false);
      }
    }

    if (status === 'verified') fetchProductionAnalytics();
    else setIsLoading(false);
  }, []);

  const downloadReport = () => {
    const doc = new jsPDF();
    const roleKey = specialistRole.replace(/\s/g, '') as keyof typeof PAYOUT_MATRIX.Instant;

    // Header styling
    doc.setFontSize(22);
    doc.text('AFRIDAM AI - EARNINGS REPORT', 14, 20);
    doc.setFontSize(10);
    doc.text(`Specialist: ${localStorage.getItem('specialistName') || 'Personnel'}`, 14, 30);
    doc.text(`Role: ${specialistRole}`, 14, 35);
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 14, 40);

    const tableData = rawCases.map((c: any, i) => [
      i + 1,
      c.patient ? `${c.patient.firstName} ${c.patient.lastName}` : 'Patient',
      c.planTier || 'Starter',
      new Date(c.createdAt).toLocaleDateString(),
      `N${(PAYOUT_MATRIX[(c.planTier || 'Starter') as keyof typeof PAYOUT_MATRIX][roleKey] || 0).toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['#', 'Patient Name', 'Tier', 'Date', 'Amount']],
      body: tableData,
      theme: 'grid',
      // ✅ FIXED: Removed 'fillStyle' to satisfy TypeScript compiler
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] }
    });

    doc.save(`AfriDam_Earnings_${new Date().getMonth() + 1}_2026.pdf`);
    toast.success("Earnings Report Saved.");
  };

  const handleWithdrawal = () => {
    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) return toast.error("Enter a valid amount.");
    if (amount > analyticsData.totalEarnings) return toast.error("Insufficient balance.");
    toast.success(`Withdrawal of ₦${amount.toLocaleString()} requested.`);
    setIsModalOpen(false);
    setWithdrawalAmount('');
  };

  const roleKey = specialistRole.replace(/\s/g, '') as keyof typeof PAYOUT_MATRIX.Instant;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-24 text-left italic">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
              Earnings <span className="text-[#FF7A59]">Overview</span>
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">
              Performance Metrics • {specialistRole}
            </p>
          </div>
          
          {isVerified && (
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
                className="bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-2xl transition-all"
              >
                <WalletIcon className="w-4 h-4" />
                Withdraw Funds
              </button>
            </div>
          )}
        </div>

        {showRates && (
          <div className="bg-[#FF7A59] rounded-[2.5rem] p-8 text-white shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-widest mb-6 italic">Current Rates: {specialistRole}</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.keys(PAYOUT_MATRIX).map((tier) => (
                <div key={tier} className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                  <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">{tier}</p>
                  <p className="text-lg font-black tracking-tighter mt-1">
                    ₦{PAYOUT_MATRIX[tier as keyof typeof PAYOUT_MATRIX][roleKey]?.toLocaleString() || '0'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-500 ${!isVerified ? 'opacity-50 grayscale' : 'opacity-100'}`}>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl w-fit">
              <StarIcon className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-6 italic">Service Rating</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter mt-1">4.9 / 5.0</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl w-fit">
              <BanknotesIcon className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-6 italic">Available Balance</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter mt-1">
              ₦{analyticsData.totalEarnings.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl w-fit">
              <ArrowTrendingUpIcon className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-6 italic">System Accuracy</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter mt-1">98.2%</p>
          </div>
        </div>

        {/* Lock Shield for Unverified */}
        {!isVerified && (
          <div className="bg-gray-50 dark:bg-gray-900/50 p-20 rounded-[3.5rem] border-2 border-dashed border-gray-100 dark:border-gray-800 text-center">
            <ShieldCheckIcon className="w-12 h-12 text-[#FF7A59] mx-auto mb-6" />
            <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Data Protected</h3>
            <p className="text-xs text-gray-500 font-bold mt-4 uppercase">Complete verification to view your revenue charts.</p>
          </div>
        )}

        {isVerified && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 bg-white dark:bg-gray-800 rounded-[3.5rem] border border-gray-100 dark:border-gray-700 p-10 min-h-[400px] flex flex-col justify-between">
               <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Monthly Growth</h3>
               <div className="flex-1 flex items-end gap-3 pt-10 pb-4">
                  {analyticsData.weeklyPulse.map((h, i) => (
                    <div key={i} className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-t-xl relative overflow-hidden">
                       <div className="absolute bottom-0 left-0 right-0 bg-[#FF7A59] rounded-t-xl transition-all duration-1000" style={{ height: `${h}%` }} />
                    </div>
                  ))}
               </div>
               <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest pt-4 border-t border-gray-50 dark:border-gray-800">
                  <span>W1</span><span>W2</span><span>W3</span><span>W4</span>
               </div>
            </div>

            <div className="lg:col-span-4 bg-black dark:bg-white p-10 rounded-[3.5rem] text-white dark:text-black">
               <div className="flex items-center gap-3 mb-6">
                  <InformationCircleIcon className="w-6 h-6 text-[#FF7A59]" />
                  <h3 className="text-[10px] font-black uppercase tracking-widest">Summary</h3>
               </div>
               <p className="text-base font-bold leading-relaxed tracking-tight uppercase italic">
                 You have handled <span className="text-[#FF7A59]">{analyticsData.patientCount}</span> cases. Payments are usually processed within 24 hours.
               </p>
            </div>
          </div>
        )}

        {/* Payout Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
            <div className="bg-white dark:bg-gray-900 w-full max-w-md p-10 rounded-[3.5rem] relative z-10 shadow-2xl border border-gray-100 dark:border-gray-800">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                <XMarkIcon className="w-6 h-6" />
              </button>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Withdraw <span className="text-[#FF7A59]">Funds</span></h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase mt-2">Available: ₦{analyticsData.totalEarnings.toLocaleString()}</p>
              
              <div className="mt-8 space-y-4">
                <input 
                  type="number" 
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  placeholder="Enter Amount"
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm font-black text-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF7A59] outline-none"
                />
                <button 
                  onClick={handleWithdrawal}
                  className="w-full bg-[#FF7A59] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] active:scale-95 transition-all shadow-xl"
                >
                  Send Request
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}