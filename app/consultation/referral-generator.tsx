'use client';

import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import { 
  XMarkIcon, 
  DocumentArrowDownIcon,
  ShoppingBagIcon,
  QrCodeIcon
} from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';

interface ReferralProps {
  patientName: string;
  patientId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReferralGenerator({ patientName, patientId, isOpen, onClose }: ReferralProps) {
  const [recommendations, setRecommendations] = useState('');
  const [medications, setMedications] = useState('');
  const [specialist, setSpecialist] = useState({ name: '', role: '' });

  useEffect(() => {
    // Rule #5: Extraction of Real Session Identity for Document Signature
    const savedName = localStorage.getItem('specialistName');
    const savedRole = localStorage.getItem('specialistRole');
    if (savedName) setSpecialist({ name: savedName, role: savedRole || 'Specialist' });
  }, [isOpen]);

  const generatePDF = () => {
    if (!recommendations.trim() || !medications.trim()) {
      toast.error("CLINICAL FIELDS CANNOT BE EMPTY", {
        style: { borderRadius: '1rem', fontSize: '10px', fontWeight: '900', textTransform: 'uppercase' }
      });
      return;
    }

    const doc = new jsPDF();
    const date = new Date().toLocaleDateString();
    // Rule #3: This link takes them to your specific Vendor Store ecosystem
    const storeLink = `https://afridam.ai/store?caseId=${patientId}`;

    // 1. Clinical Header (Neural Black)
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("AfriDam AI", 20, 25);
    doc.setFontSize(10);
    doc.text("OFFICIAL CLINICAL REFERRAL", 20, 32);

    // 2. Patient & Case Details
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text(`Patient: ${patientName}`, 20, 55);
    doc.text(`Case ID: ${patientId}`, 20, 62);
    doc.text(`Date: ${date}`, 150, 55);

    // 3. Clinical Findings
    doc.setDrawColor(240);
    doc.line(20, 70, 190, 70);
    doc.setFont("helvetica", "bold");
    doc.text("Clinical Observations:", 20, 80);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const splitRecs = doc.splitTextToSize(recommendations, 170);
    doc.text(splitRecs, 20, 87);

    // 4. PRESCRIBED PRODUCTS (Revenue Generation Layer)
    const productY = 87 + (splitRecs.length * 6) + 10;
    doc.setFillColor(255, 122, 89, 0.1); 
    doc.rect(15, productY - 5, 180, 40, 'F');
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 122, 89);
    doc.text("Prescribed for Purchase (AfriDam Verified Vendors Only):", 20, productY + 5);
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    const splitMeds = doc.splitTextToSize(medications, 170);
    doc.text(splitMeds, 20, productY + 15);

    // 5. THE ECOSYSTEM HOOK
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("How to fulfill this prescription:", 20, 160);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("For guaranteed results, scan the QR code to purchase these exact formulations", 20, 167);
    doc.text("directly from authorized AfriDam vendors.", 20, 172);

    // Placeholder for QR Code
    doc.setDrawColor(0);
    doc.rect(20, 180, 30, 30); 
    doc.setFontSize(7);
    doc.text("SCAN TO BUY", 22, 215);

    doc.setTextColor(0, 0, 255);
    doc.text(`Purchase Link: ${storeLink}`, 60, 195);

    // 6. Specialist Signature
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.line(20, 250, 80, 250);
    doc.setFont("helvetica", "bold");
    doc.text(specialist.name.toUpperCase(), 20, 257);
    doc.setFont("helvetica", "normal");
    doc.text(specialist.role, 20, 263);

    doc.save(`AfriDam_Prescription_${patientName.replace(" ", "_")}.pdf`);
    
    toast.success("SMART PRESCRIPTION ISSUED", {
      style: { background: '#000', color: '#fff', borderRadius: '1rem', fontSize: '10px', fontWeight: '900' }
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl italic text-left">
      <div className="bg-white dark:bg-gray-950 w-full max-w-2xl rounded-[4rem] shadow-2xl overflow-hidden border border-white/10 animate-in zoom-in duration-300">
        
        <div className="p-10 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-4">
             <div className="w-14 h-14 bg-[#FF7A59] rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-[#FF7A59]/30">
                <ShoppingBagIcon className="w-7 h-7" />
             </div>
             <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">Issue Prescription</h2>
                <p className="text-[10px] font-black text-[#FF7A59] uppercase tracking-[0.3em]">Convert Case to Vendor Order</p>
             </div>
          </div>
          <button onClick={onClose} className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl hover:scale-90 transition-transform">
            <XMarkIcon className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-10 space-y-10">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Specialist Diagnosis & Advice</label>
            <textarea 
              rows={4}
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              className="w-full bg-gray-50 dark:bg-white/5 border-none rounded-[2.5rem] p-8 text-sm font-bold outline-none focus:ring-4 focus:ring-[#FF7A59]/20 transition-all placeholder:opacity-30 italic"
              placeholder="e.g. Chronic Acne with inflammation. Recommend consistent neural-led routine..."
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-[#FF7A59] uppercase tracking-widest ml-1 italic">Prescribed Products (Direct to Vendor Cart)</label>
            <textarea 
              rows={3}
              value={medications}
              onChange={(e) => setMedications(e.target.value)}
              className="w-full bg-[#FF7A59]/5 dark:bg-[#FF7A59]/10 border-2 border-[#FF7A59]/20 rounded-[2.5rem] p-8 text-sm font-bold text-[#FF7A59] outline-none focus:border-[#FF7A59] transition-all italic"
              placeholder="1. AfriDam Hydrating Serum&#10;2. Clinical Grade Sunscreen"
            />
          </div>
        </div>

        <div className="p-10 bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/5">
          <button 
            onClick={generatePDF}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-7 rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-6 hover:shadow-2xl transition-all active:scale-95 italic"
          >
            <QrCodeIcon className="w-6 h-6 text-[#FF7A59]" />
            Generate Smart Prescription
          </button>
        </div>
      </div>
    </div>
  );
}