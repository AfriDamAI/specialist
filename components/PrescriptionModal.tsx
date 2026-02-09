'use client';

import { useState } from 'react';
import { 
  XMarkIcon, 
  PencilSquareIcon, 
  BeakerIcon,
  CheckCircleIcon 
} from '@heroicons/react/24/solid';

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName: string;
}

export default function PrescriptionModal({ isOpen, onClose, patientName }: PrescriptionModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFinalize = () => {
    setLoading(true);
    // Rule #3: This will eventually hit Tobi's 'finalizeConsultation' endpoint
    setTimeout(() => {
      setLoading(false);
      onClose();
      alert("Diagnosis Finalized. Earning added to Portfolio.");
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-8 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Issue Prescription</h2>
            <p className="text-[10px] font-bold text-[#FF7A59] uppercase tracking-widest mt-1">Patient: {patientName}</p>
          </div>
          <button onClick={onClose} className="p-2 bg-white dark:bg-gray-700 rounded-xl shadow-sm">
            <XMarkIcon className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Medication & Dosage</label>
            <div className="relative">
              <BeakerIcon className="absolute left-4 top-4 w-5 h-5 text-gray-300" />
              <textarea 
                placeholder="e.g., Prednisolone 20mg - Twice daily for 5 days"
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-[#FF7A59] dark:text-white min-h-[100px]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Clinical Advice / Notes</label>
            <div className="relative">
              <PencilSquareIcon className="absolute left-4 top-4 w-5 h-5 text-gray-300" />
              <textarea 
                placeholder="Immediate drug withdrawal. Maintain hydration..."
                className="w-full bg-gray-50 dark:bg-gray-800 border-none rounded-2xl pl-12 pr-4 py-4 text-sm font-bold focus:ring-2 focus:ring-[#FF7A59] dark:text-white min-h-[120px]"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-50 dark:border-gray-800 flex gap-4">
          <button 
            onClick={handleFinalize}
            disabled={loading}
            className="flex-1 bg-black dark:bg-white text-white dark:text-black py-5 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <CheckCircleIcon className="w-5 h-5" />
                Finalize & Bill Case
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}