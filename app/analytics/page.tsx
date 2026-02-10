'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  ArrowTrendingUpIcon, 
  BanknotesIcon, 
  StarIcon,
  ShieldCheckIcon,
  InformationCircleIcon,
  ArrowPathIcon,
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
    successRate: 0,
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
        const response = await fetch(`${API_URL}/consultations`);
        const data = await response.json();
        
        if (data.succeeded && data.data) {
          setRawCases(data.data);
          const revenue = data.data.reduce((acc: number, item: any) => {
            const tier = (item.planTier || 'Starter') as keyof typeof PAYOUT_MATRIX;
            const payout = PAYOUT_MATRIX[tier]?.[roleKey] || 0;
            return acc + payout;
          }, 0);

          setAnalyticsData({
            totalEarnings: revenue,
            patientCount: data.data.length,
            successRate: data.data.length > 0 ? 98.2 : 0,
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

    // Header
    doc.setFontSize(22);
    doc.text('AFRIDAM AI - CLINICAL EARNINGS', 14, 20);
    doc.setFontSize(10);
    doc.text(`Specialist: ${localStorage.getItem('specialistName') || 'Ogirima Obey'}`, 14, 30);
    doc.text(`Role: ${specialistRole}`, 14, 35);
    doc.text(`Report Date: ${new Date().toLocaleDateString()}`, 14, 40);

    const tableData = rawCases.map((c: any, i) => [
      i + 1,
      c.name || 'Anonymous',
      c.planTier || 'Starter',
      new Date(c.createdAt).toLocaleDateString(),
      `N${(PAYOUT_MATRIX[(c.planTier || 'Starter') as keyof typeof PAYOUT_MATRIX][roleKey] || 0).toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 50,
      head: [['#', 'Patient Name', 'Plan Tier', 'Date', 'Payout']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillStyle: 'F', fillColor: [0, 0, 0] }
    });

    doc.save(`AfriDam_Earnings_${new Date().getMonth() + 1}_2026.pdf`);
    toast.success("Earnings Report Downloaded.");
  };

  const handleWithdrawal = () => {
    const amount = parseFloat(withdrawalAmount);
    if (isNaN(amount) || amount <= 0) return toast.error("Enter valid amount.");
    if (amount > analyticsData.totalEarnings) return toast.error("Insufficient funds.");
    toast.success(`Withdrawal of ₦${amount.toLocaleString()} initiated.`);
    setIsModalOpen(false);
    setWithdrawalAmount('');
  };

  const roleKey = specialistRole.replace(/\s/g, '') as keyof typeof PAYOUT_MATRIX.Instant;

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-24 text-left">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
              Performance <span className="text-[#FF7A59]">Pulse</span>
            </h1>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1">
              Revenue Analytics • {specialistRole} Rank
            </p>
          </div>
          
          {isVerified && (
            <div className="flex flex-wrap items-center gap-3">
               <button 
                onClick={downloadReport}
                className="flex items-center gap-2 p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-100 transition-all"
              >
                <DocumentArrowDownIcon className="w-5 h-5" />
                Export PDF
              </button>
               <button 
                onClick={() => setShowRates(!showRates)}
                className="p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl text-gray-500 hover:text-[#FF7A59] transition-all"
              >
                <QuestionMarkCircleIcon className="w-6 h-6" />
              </button>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-black dark:bg-white text-white dark:text-black px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-2xl active:scale-95 transition-all"
              >
                <WalletIcon className="w-4 h-4" />
                Request Payout
              </button>
            </div>
          )}
        </div>

        {showRates && (
          <div className="bg-[#FF7A59] rounded-[2.5rem] p-8 text-white animate-in slide-in-from-top-4 duration-500 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-widest mb-6 italic">Live Payout Matrix: {specialistRole}</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.keys(PAYOUT_MATRIX).map((tier) => (
                <div key={tier} className="bg-white/10 p-4 rounded-2xl backdrop-blur-md">
                  <p className="text-[9px] font-black uppercase opacity-60 tracking-widest">{tier}</p>
                  <p className="text-lg font-black tracking-tighter mt-1">
                    ₦{PAYOUT_MATRIX[tier as keyof typeof PAYOUT_MATRIX][roleKey]?.toLocaleString() || 'N/A'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-500 ${!isVerified ? 'opacity-50 grayscale' : 'opacity-100'}`}>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm group">
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl group-hover:bg-[#FF7A59]/10 transition-colors">
              <StarIcon className="w-5 h-5 text-amber-400" />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-6 italic">Clinical Rating</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter mt-1">4.9 / 5.0</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm group">
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl group-hover:bg-[#FF7A59]/10 transition-colors">
              <BanknotesIcon className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-6 italic">Net Earnings</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter mt-1">
              ₦{analyticsData.totalEarnings.toLocaleString()}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 shadow-sm group">
            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-2xl group-hover:bg-[#FF7A59]/10 transition-colors">
              <ArrowTrendingUpIcon className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-6 italic">Growth Velocity</p>
            <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter mt-1">98.2%</p>
          </div>
        </div>

        {/* Dynamic Growth Chart Area */}
        <div className="relative">
          {!isVerified && (
            <div className="absolute inset-0 z-30 backdrop-blur-xl bg-white/20 dark:bg-gray-950/20 flex items-center justify-center rounded-[3.5rem] border-2 border-dashed border-gray-100 dark:border-gray-800">
              <div className="bg-white dark:bg-gray-900 p-12 rounded-[3.5rem] shadow-2xl text-center max-w-md animate-in zoom-in">
                <ShieldCheckIcon className="w-12 h-12 text-[#FF7A59] animate-pulse mx-auto mb-6" />
                <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Identity Locked</h3>
                <p className="text-xs text-gray-500 font-bold mt-4 uppercase">Complete vetting to unlock specialized revenue data.</p>
              </div>
            </div>
          )}

          <div className={`grid grid-cols-1 lg:grid-cols-12 gap-8 ${!isVerified ? 'opacity-10 pointer-events-none grayscale' : 'opacity-100'}`}>
            <div className="lg:col-span-8 bg-white dark:bg-gray-800 rounded-[3.5rem] border border-gray-100 dark:border-gray-700 p-10 flex flex-col justify-between min-h-[450px]">
               <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Growth Curve</h3>
               <div className="flex-1 flex items-end gap-3 pt-10 pb-4">
                  {analyticsData.weeklyPulse.map((h, i) => (
                    <div key={i} className="flex-1 bg-gray-50 dark:bg-gray-900 rounded-t-xl relative group overflow-hidden">
                       <div className="absolute bottom-0 left-0 right-0 bg-[#FF7A59] rounded-t-xl transition-all duration-1000" style={{ height: `${h}%` }} />
                    </div>
                  ))}
               </div>
               <div className="flex justify-between text-[9px] font-black text-gray-400 uppercase tracking-widest pt-4 border-t border-gray-50 dark:border-gray-800">
                  <span>W1</span><span>W2</span><span>W3</span><span>W4</span>
               </div>
            </div>

            <div className="lg:col-span-4 space-y-6">
               <div className="bg-black dark:bg-white p-8 rounded-[3rem] text-white dark:text-black shadow-2xl transition-colors">
                  <div className="flex items-center gap-3 mb-6">
                     <InformationCircleIcon className="w-6 h-6 text-[#FF7A59]" />
                     <h3 className="text-[10px] font-black uppercase tracking-widest leading-none">Intelligence</h3>
                  </div>
                  <p className="text-sm font-bold leading-relaxed tracking-tight uppercase italic">
                    You have successfully triaged <span className="text-[#FF7A59]">{analyticsData.patientCount}</span> cases. Payouts are processed within 24 hours of request.
                  </p>
               </div>
            </div>
          </div>
        </div>

        {/* Payout Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
            <div className="bg-white dark:bg-gray-900 w-full max-w-md p-10 rounded-[3.5rem] relative z-10 shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in duration-300">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                <XMarkIcon className="w-6 h-6" />
              </button>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Request <span className="text-[#FF7A59]">Payout</span></h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase mt-2">Available: ₦{analyticsData.totalEarnings.toLocaleString()}</p>
              
              <div className="mt-8 space-y-4">
                <input 
                  type="number" 
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  placeholder="Amount in ₦"
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm font-black text-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF7A59] outline-none shadow-inner"
                />
                <button 
                  onClick={handleWithdrawal}
                  className="w-full bg-[#FF7A59] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#FF7A59]/20 active:scale-95 transition-all"
                >
                  Confirm Transfer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}