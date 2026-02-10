'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  AcademicCapIcon, 
  PlayCircleIcon, 
  CheckCircleIcon, 
  LockClosedIcon,
  ChevronRightIcon,
  TrophyIcon,
  SparklesIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/solid';
// Rule #3: Pivot to React-compatible toast engine
import { toast, Toaster } from 'react-hot-toast';

export default function TrainingPage() {
  const router = useRouter();
  const [completedCount, setCompletedCount] = useState(1);
  const totalModules = 5;
  const isFullyComplete = completedCount > totalModules;

  useEffect(() => {
    // Rule #3: Persistent progress tracking
    const savedProgress = localStorage.getItem('training_step');
    const status = localStorage.getItem('specialistStatus');

    if (status === 'verified') {
      setCompletedCount(totalModules + 1);
      return;
    }

    if (savedProgress) {
      setCompletedCount(parseInt(savedProgress));
    }
  }, []);

  const handleFinalUnlock = () => {
    localStorage.setItem('specialistStatus', 'verified');
    
    // Rule #5: Specialist Style Toast Protocol
    toast("Credentials Verified. Workstation Unlocked.", {
      icon: '🚀',
      style: {
        background: '#000',
        color: '#fff',
        borderRadius: '1.5rem',
        fontSize: '10px',
        fontWeight: '900',
        textTransform: 'uppercase',
        padding: '16px',
        border: '1px solid rgba(255,255,255,0.1)'
      }
    });

    // Forced hard refresh to update the global Sidebar/Layout state
    setTimeout(() => {
      window.location.href = '/dashboard';
    }, 2000);
  };

  const modules = [
    { id: 1, title: 'AfriDam AI: Clinical Overview', duration: '15 mins' },
    { id: 2, title: 'Identifying SJS/TEN in Skin Tones', duration: '45 mins' },
    { id: 3, title: 'Ethics of Tele-Dermatology', duration: '30 mins' },
    { id: 4, title: 'Emergency Escalation Protocols', duration: '20 mins' },
    { id: 5, title: 'Prescription & Billing Finalization', duration: '15 mins' },
  ];

  const handleModuleClick = (id: number) => {
    if (id === completedCount) {
      const nextStep = id + 1;
      setCompletedCount(nextStep);
      localStorage.setItem('training_step', nextStep.toString());
      
      toast.success(`Module ${id} Mastery Confirmed`, {
        style: { 
          borderRadius: '1rem',
          fontSize: '10px',
          fontWeight: '900',
          textTransform: 'uppercase'
        }
      });
    }
  };

  return (
    <DashboardLayout>
      <Toaster position="top-center" reverseOrder={false} />
      <div className="max-w-7xl mx-auto space-y-8 pb-24 text-left italic">
        
        {isFullyComplete ? (
          <div className="bg-white dark:bg-gray-950 rounded-[3.5rem] p-12 text-center border-4 border-[#FF7A59] shadow-2xl animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
              <TrophyIcon className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
              Status: <span className="text-[#FF7A59]">Verified</span>
            </h1>
            <p className="mt-4 text-gray-500 font-bold uppercase tracking-widest max-w-lg mx-auto leading-relaxed">
              Onboarding complete. Your clinical ID has been triaged and approved for live neural-link consultations.
            </p>
            <button 
              onClick={handleFinalUnlock}
              className="mt-10 bg-black dark:bg-white text-white dark:text-black px-12 py-6 rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:scale-105 transition-transform flex items-center gap-3 mx-auto shadow-xl"
            >
              <SparklesIcon className="w-5 h-5 text-[#FF7A59]" />
              Enter Workstation
            </button>
          </div>
        ) : (
          <>
            <div className="bg-black dark:bg-white rounded-[3rem] p-8 md:p-12 text-white dark:text-black shadow-2xl relative overflow-hidden">
              <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-3">
                  <AcademicCapIcon className="w-8 h-8 text-[#FF7A59]" />
                  <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic">
                    Specialist <span className="text-[#FF7A59]">Academy</span>
                  </h1>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">Neural Mastery Progress</p>
                    <p className="text-2xl font-black tracking-tighter italic">
                      {Math.min(Math.round(((completedCount - 1) / totalModules) * 100), 100)}%
                    </p>
                  </div>
                  <div className="h-4 bg-white/10 dark:bg-black/10 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-[#FF7A59] transition-all duration-700 ease-out" 
                      style={{ width: `${((completedCount - 1) / totalModules) * 100}%` }} 
                    />
                  </div>
                </div>
              </div>
              <TrophyIcon className="absolute -right-10 -bottom-10 w-64 h-64 opacity-5 pointer-events-none" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-[3rem] aspect-video border border-gray-100 dark:border-gray-700 overflow-hidden relative shadow-sm group">
                   <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <PlayCircleIcon 
                        className="w-20 h-20 text-white transition-transform group-hover:scale-110 cursor-pointer" 
                        onClick={() => handleModuleClick(completedCount)}
                      />
                   </div>
                   <div className="absolute bottom-6 left-8">
                      <p className="text-[10px] font-black text-[#FF7A59] uppercase tracking-widest">Active Lesson</p>
                      <h3 className="text-lg font-black text-white uppercase tracking-tighter italic">
                        {modules[completedCount - 1]?.title || "Evaluation Ready"}
                      </h3>
                   </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-700 flex items-center gap-5">
                   <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl">
                      <ShieldCheckIcon className="w-8 h-8 text-amber-500" />
                   </div>
                   <div>
                      <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-widest italic">Clinical Accreditation</h3>
                      <p className="text-[11px] text-gray-500 font-bold uppercase mt-1 leading-relaxed">
                        Complete all modules to unlock your digital referral and prescription authority.
                      </p>
                   </div>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                 <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.3em] px-2 italic">Curriculum</h2>
                 {modules.map((mod) => {
                   const status = mod.id < completedCount ? 'completed' : mod.id === completedCount ? 'current' : 'locked';
                   return (
                     <div 
                      key={mod.id} 
                      onClick={() => status === 'current' && handleModuleClick(mod.id)}
                      className={`p-6 rounded-[2rem] border transition-all flex items-center justify-between cursor-pointer ${
                        status === 'completed' 
                          ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-gray-800' 
                          : status === 'current'
                          ? 'bg-white dark:bg-gray-800 border-[#FF7A59] shadow-lg'
                          : 'bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800 opacity-60'
                      }`}
                     >
                       <div className="flex items-center gap-4">
                          {status === 'completed' ? (
                            <CheckCircleIcon className="w-6 h-6 text-green-500" />
                          ) : status === 'locked' ? (
                            <LockClosedIcon className="w-6 h-6 text-gray-300" />
                          ) : (
                            <div className="w-6 h-6 rounded-full border-4 border-[#FF7A59] border-t-transparent animate-spin" />
                          )}
                          <div>
                            <p className={`text-xs font-black uppercase tracking-tighter italic ${status === 'locked' ? 'text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                              {mod.title}
                            </p>
                            <span className="text-[10px] font-bold text-gray-400">{mod.duration}</span>
                          </div>
                       </div>
                       {status === 'current' && <ChevronRightIcon className="w-5 h-5 text-[#FF7A59]" />}
                     </div>
                   );
                 })}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}