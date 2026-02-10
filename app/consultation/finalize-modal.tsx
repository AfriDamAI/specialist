'use client';

import { useState } from 'react';
import { 
  CheckBadgeIcon, 
  XMarkIcon, 
  BanknotesIcon, 
  ShieldCheckIcon,
  DocumentCheckIcon,
  ArrowPathIcon 
} from '@heroicons/react/24/solid';
// 🛡️ FIXED: Correct React implementation
import { toast } from 'react-hot-toast';

interface FinalizeProps {
  patientName: string;
  chatId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function FinalizeCaseModal({ patientName, chatId, isOpen, onClose }: FinalizeProps) {
  const [conclusion, setConclusion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFinalize = async () => {
    if (!conclusion.trim()) {
      toast.error("PLEASE PROVIDE A CLINICAL CONCLUSION");
      return;
    }

    setIsProcessing(true);

    // Rule #3: Simulate Production Payout & Archive Logic
    setTimeout(() => {
      toast.success(`Case Finalized. ₦15,000 added to revenue.`, {
        icon: '💰',
        style: {
          background: '#000',
          color: '#fff',
          borderRadius: '1.5rem',
          fontSize: '10px',
          fontWeight: '900',
          textTransform: 'uppercase',
          fontStyle: 'italic',
          border: '1px solid rgba(255,122,89,0.2)'
        }
      });
      
      setIsProcessing(false);
      onClose();
      
      // Rule #5: Redirect to verified Analytics path
      window.location.href = '/analytics';
    }, 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="bg-white dark:bg-gray-950 w-full max-w-lg rounded-[3.5rem] relative z-10 shadow-2xl border border-gray-100 dark:border-gray-800 p-10 animate-in zoom-in duration-300 italic text-left">
        
        <button onClick={onClose} className="absolute top-8 right-8 text-gray-400 hover:text-black dark:hover:text-white transition-colors">
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-green-50 dark:bg-green-900/20 rounded-[2rem] flex items-center justify-center mx-auto">
            <CheckBadgeIcon className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Finalize <span className="text-[#FF7A59]">Case</span></h2>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Patient: {patientName}</p>
        </div>

        <div className="mt-10 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Clinical Conclusion</label>
            <textarea 
              rows={4}
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              placeholder="Enter final diagnosis or advice for the medical record..."
              className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-[2rem] px-6 py-4 text-sm font-bold focus:ring-2 focus:ring-[#FF7A59] outline-none text-gray-900 dark:text-white"
            />
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BanknotesIcon className="w-6 h-6 text-green-500" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Specialist Fee</span>
            </div>
            <span className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">₦15,000</span>
          </div>

          <button 
            onClick={handleFinalize}
            disabled={isProcessing}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-6 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            {isProcessing ? (
              <ArrowPathIcon className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <DocumentCheckIcon className="w-5 h-5" />
                Archive & Payout
              </>
            )}
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 opacity-30">
          <ShieldCheckIcon className="w-4 h-4 text-blue-500" />
          <p className="text-[8px] font-black uppercase tracking-widest">Authorized Clinical Finalization</p>
        </div>
      </div>
    </div>
  );
}