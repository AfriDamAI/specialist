'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  UserCircleIcon, 
  CreditCardIcon, 
  ShieldCheckIcon, 
  BellAlertIcon,
  ChevronRightIcon,
  FingerPrintIcon,
  GlobeAltIcon,
  IdentificationIcon,
  DocumentTextIcon
} from '@heroicons/react/24/solid';

export default function SettingsPage() {
  // Rule #5: Dynamic state linked to the Global Verification Protocol
  const [isVerified, setIsVerified] = useState(false);

  const [user, setUser] = useState({
    name: 'Specialist',
    role: 'Medical Personnel',
  });

  useEffect(() => {
    // Rule #3: Syncing with production session data & verification status
    const savedName = localStorage.getItem('specialistName');
    const savedRole = localStorage.getItem('specialistRole');
    const status = localStorage.getItem('specialistStatus');

    if (savedName) {
      setUser({ name: savedName, role: savedRole || 'Specialist' });
    }
    
    if (status === 'verified') {
      setIsVerified(true);
    }
  }, []);

  const settingsGroups = [
    {
      group: "Clinical Identity",
      items: [
        { 
          label: "Medical License & ID", 
          value: isVerified ? "Verified & Active" : "Verification Pending", 
          icon: <IdentificationIcon className="w-5 h-5" /> 
        },
        { label: "Specialization Area", value: "Dermatology", icon: <GlobeAltIcon className="w-5 h-5" /> }
      ]
    },
    {
      group: "Compliance & Protocols",
      items: [
        { label: "SJS Guidelines", value: "Updated Morphology Detection", icon: <DocumentTextIcon className="w-5 h-5" /> },
        { label: "Patient Privacy", value: "E2EE Messaging Standards", icon: <ShieldCheckIcon className="w-5 h-5" /> }
      ]
    },
    {
      group: "Financial Setup",
      items: [
        { label: "Naira Payout Account", value: "012***4567", icon: <CreditCardIcon className="w-5 h-5" /> },
        { label: "Tax & Compliance Info", value: "TIN Attached", icon: <ShieldCheckIcon className="w-5 h-5" /> }
      ]
    },
    {
      group: "Security & Interface",
      items: [
        { label: "Biometric & PIN Access", value: "Enabled", icon: <FingerPrintIcon className="w-5 h-5" /> },
        { label: "Notification Triage", value: "Push & Email", icon: <BellAlertIcon className="w-5 h-5" /> }
      ]
    }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-10 pb-24">
        
        {/* Profile Summary Card */}
        <div className="bg-white dark:bg-gray-800 rounded-[3.5rem] border border-gray-100 dark:border-gray-700 p-8 md:p-12 shadow-sm flex flex-col md:flex-row items-center gap-8 animate-in fade-in duration-500">
          <div className="w-24 h-24 md:w-32 md:h-32 bg-gray-100 dark:bg-gray-700 rounded-[2.5rem] flex items-center justify-center text-4xl font-black text-gray-300 shadow-inner">
            {user.name.charAt(0)}
          </div>
          <div className="text-center md:text-left space-y-2">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">{user.name}</h1>
              <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${
                isVerified ? 'bg-green-50 text-green-600 border border-green-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
              }`}>
                {isVerified ? 'Verified Specialist' : 'Vetting in Progress'}
              </span>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Employee ID: #AFR-DERM-0926</p>
            <button className="text-[10px] font-black text-[#FF7A59] uppercase tracking-widest border-b-2 border-[#FF7A59] pt-2 hover:opacity-70 transition-opacity">Edit Public Bio</button>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          <div className="lg:col-span-8 space-y-8">
            {settingsGroups.map((groupObj, gIdx) => (
              <div key={gIdx} className="space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-4">{groupObj.group}</h3>
                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] border border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700 overflow-hidden shadow-sm">
                  {groupObj.items.map((item, iIdx) => (
                    <div key={iIdx} className="flex items-center justify-between p-6 md:p-8 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-all cursor-pointer group">
                      <div className="flex items-center gap-5">
                        <div className={`p-3 rounded-2xl transition-colors ${
                          // FIXED: Using groupObj.group instead of item.group
                          (item.label === "Medical License & ID" || groupObj.group === "Compliance & Protocols") && isVerified 
                          ? 'bg-green-50 text-green-500' 
                          : 'bg-gray-50 dark:bg-gray-900 text-gray-400 group-hover:text-[#FF7A59]'
                        }`}>
                          {item.icon}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">{item.label}</p>
                          <p className={`text-xs font-bold mt-2 ${
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
            <div className="bg-black dark:bg-white p-8 rounded-[3rem] text-white dark:text-black shadow-2xl space-y-8 relative overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-6">Compliance Status</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Academy</span>
                    <span className={`text-xs font-black uppercase ${isVerified ? 'text-green-500' : 'text-[#FF7A59]'}`}>
                      {isVerified ? 'Completed' : '35% Done'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Background</span>
                    <span className="text-xs font-black text-green-500 uppercase">Cleared</span>
                  </div>
                </div>
              </div>
              <p className="text-[10px] font-bold text-gray-500 leading-relaxed uppercase tracking-wide relative z-10">
                {isVerified 
                  ? "Your specialist status is fully active. All clinical tools and references are now accessible."
                  : "Verification requires all clinical modules to be completed with a minimum quiz score of 90%."
                }
              </p>
              <ShieldCheckIcon className="absolute -right-6 -bottom-6 w-32 h-32 opacity-10 text-white dark:text-black pointer-events-none" />
            </div>

            <button className="w-full border-2 border-red-100 dark:border-red-900/30 text-red-500 py-6 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95 shadow-sm">
              Request Account Deactivation
            </button>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}