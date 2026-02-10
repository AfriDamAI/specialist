'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  CreditCardIcon, 
  ShieldCheckIcon, 
  BellAlertIcon,
  ChevronRightIcon,
  FingerPrintIcon,
  GlobeAltIcon,
  IdentificationIcon,
  CheckCircleIcon,
  XMarkIcon,
  MoonIcon,
  SunIcon
} from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const [isVerified, setIsVerified] = useState(false);
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  const [user, setUser] = useState({
    name: 'Specialist',
    role: 'Medical Personnel',
  });

  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    bankName: ''
  });

  useEffect(() => {
    // 🛡️ DYNAMIC IDENTITY PROTOCOL
    const savedName = localStorage.getItem('specialistName');
    const savedRole = localStorage.getItem('specialistRole');
    const status = localStorage.getItem('specialistStatus');
    const savedBank = localStorage.getItem('specialistBank');
    
    // Rule #5: Theme Synchronization
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    if (savedName) {
      setUser({ 
        name: savedName, 
        role: savedRole || 'Specialist' 
      });
    }
    
    if (status === 'verified') {
      setIsVerified(true);
    }

    if (savedBank) {
      try {
        setBankDetails(JSON.parse(savedBank));
      } catch (e) {
        console.error("Neural Error: Could not parse bank records.");
      }
    }
  }, []);

  const toggleTheme = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
      toast.success("Light Mode Enabled");
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
      toast.success("Dark Mode Enabled");
    }
  };

  const saveBankDetails = () => {
    if (!bankDetails.accountNumber || !bankDetails.bankName) {
      toast.error("Complete all fields.");
      return;
    }
    localStorage.setItem('specialistBank', JSON.stringify(bankDetails));
    setIsEditingBank(false);
    toast.success("Financial Records Updated");
  };

  const settingsGroups = [
    {
      group: "Clinical Identity",
      items: [
        { 
          label: "Medical License & ID", 
          value: isVerified ? "Verified & Active" : "Verification Pending", 
          icon: <IdentificationIcon className="w-5 h-5" /> 
        },
        { label: "Specialization Area", value: user.role, icon: <GlobeAltIcon className="w-5 h-5" /> }
      ]
    },
    {
      group: "Financial Setup",
      items: [
        { 
          label: "Naira Payout Account", 
          value: bankDetails.accountNumber ? `${bankDetails.bankName} - ${bankDetails.accountNumber.slice(0, 3)}***${bankDetails.accountNumber.slice(-2)}` : "Not Linked", 
          icon: <CreditCardIcon className="w-5 h-5" />,
          action: () => setIsEditingBank(true)
        },
        { label: "Tax & Compliance Info", value: "TIN Attached", icon: <ShieldCheckIcon className="w-5 h-5" /> }
      ]
    },
    {
      group: "Security & Interface",
      items: [
        { label: "Interface Mode", value: isDarkMode ? "Dark Appearance" : "Light Appearance", icon: isDarkMode ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />, action: toggleTheme },
        { label: "Biometric & PIN Access", value: "Enabled", icon: <FingerPrintIcon className="w-5 h-5" /> },
        { label: "Notification Triage", value: "Push & Email", icon: <BellAlertIcon className="w-5 h-5" /> }
      ]
    }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-10 pb-24 text-left">
        
        {/* Profile Summary Card */}
        <div className="bg-white dark:bg-gray-950 rounded-[3.5rem] border border-gray-100 dark:border-gray-800 p-8 md:p-12 shadow-sm flex flex-col md:flex-row items-center gap-8 animate-in fade-in duration-500 transition-colors">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-900 dark:bg-white rounded-[2.5rem] flex items-center justify-center text-4xl font-black text-white dark:text-black shadow-inner uppercase italic">
            {user.name.charAt(0)}
          </div>
          <div className="text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">{user.name}</h1>
              <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${
                isVerified ? 'bg-green-50 dark:bg-green-900/20 text-green-600' : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600'
              }`}>
                {isVerified ? 'Verified Specialist' : 'Vetting in Progress'}
              </span>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">{user.role}</p>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-8 space-y-8">
            {settingsGroups.map((groupObj, gIdx) => (
              <div key={gIdx} className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-4 italic">{groupObj.group}</h3>
                <div className="bg-white dark:bg-gray-950 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 divide-y divide-gray-50 dark:divide-gray-800 overflow-hidden shadow-sm transition-colors">
                  {groupObj.items.map((item, iIdx) => (
                    <div 
                      key={iIdx} 
                      onClick={item.action}
                      className="flex items-center justify-between p-6 md:p-8 hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-5">
                        <div className={`p-3 rounded-2xl transition-colors ${
                          (item.label === "Medical License & ID") && isVerified 
                          ? 'bg-green-50 dark:bg-green-900/20 text-green-500' 
                          : 'bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:text-[#FF7A59]'
                        }`}>
                          {item.icon}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">{item.label}</p>
                          <p className={`text-xs font-bold mt-2 uppercase tracking-wide ${
                            item.label === "Medical License & ID" && isVerified ? 'text-green-600' : 'text-gray-400'
                          }`}>{item.value}</p>
                        </div>
                      </div>
                      <ChevronRightIcon className="w-5 h-5 text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-black dark:bg-white p-8 rounded-[3rem] text-white dark:text-black shadow-2xl space-y-8 relative overflow-hidden transition-colors">
              <div className="relative z-10">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-6 text-[#FF7A59] italic">Compliance Protocol</h3>
                <p className="text-sm font-bold leading-relaxed tracking-tight uppercase italic">
                  AfriDam Neural Link protocols require matching biometric data for all clinical and financial adjustments.
                </p>
              </div>
              <ShieldCheckIcon className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10 text-white dark:text-black pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Bank Edit Modal */}
        {isEditingBank && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setIsEditingBank(false)}></div>
            <div className="bg-white dark:bg-gray-900 w-full max-w-md p-10 rounded-[3.5rem] relative z-10 shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in duration-300">
              <button onClick={() => setIsEditingBank(false)} className="absolute top-8 right-8 text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                <XMarkIcon className="w-6 h-6" />
              </button>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Link <span className="text-[#FF7A59]">Bank</span></h2>
              <p className="text-[10px] font-black text-gray-400 uppercase mt-2 tracking-widest">Payout Verification Required</p>
              
              <div className="mt-8 space-y-4">
                <input 
                  type="text" 
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                  placeholder="Bank Name"
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm font-black text-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF7A59] outline-none shadow-inner"
                />
                <input 
                  type="text" 
                  value={bankDetails.accountNumber}
                  onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                  placeholder="Account Number"
                  className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl px-6 py-4 text-sm font-black text-gray-900 dark:text-white focus:ring-2 focus:ring-[#FF7A59] outline-none shadow-inner"
                />
                <button 
                  onClick={saveBankDetails}
                  className="w-full bg-[#FF7A59] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#FF7A59]/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircleIcon className="w-5 h-5" />
                  Link Account
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}