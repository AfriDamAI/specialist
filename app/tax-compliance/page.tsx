'use client';

import DashboardLayout from '@/components/DashboardLayout';

const ShieldIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2L3 6v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V6l-9-4zm-1 14l-3-3 1.41-1.41L11 13.17l4.59-4.58L17 10l-6 6z"/>
  </svg>
);

const DocumentIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/>
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/>
  </svg>
);

export default function TaxCompliancePage() {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6 pb-20 text-left italic">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
          <div>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic">
              Tax & <span className="text-[#FF7A59]">Compliance</span>
            </h1>
            <p className="text-[10px] md:text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.3em] mt-1">
              Financial Compliance & Tax Records
            </p>
          </div>
        </div>

        {/* Status Banner */}
        <div className="flex items-center gap-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800 rounded-[2rem] px-6 py-4">
          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-green-600">
            <ShieldIcon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-black text-green-600 uppercase tracking-widest">Compliance Status</p>
            <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight mt-0.5">Fully Verified & Active</p>
          </div>
          <div className="ml-auto">
            <span className="text-[10px] font-black bg-green-100 dark:bg-green-900/30 text-green-600 px-3 py-1 rounded-full uppercase tracking-widest">TIN Attached</span>
          </div>
        </div>

        {/* Info Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* TIN Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-[#FF7A59]">
                <DocumentIcon className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tax Identification</p>
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">TIN-0923****</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Registered with FIRS</p>
            </div>
            <div className="flex items-center gap-2 text-green-500">
              <CheckIcon className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
            </div>
          </div>

          {/* VAT Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center text-[#FF7A59]">
                <DocumentIcon className="w-5 h-5" />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">VAT Registration</p>
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase">VAT-4471****</p>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Standard Rate: 7.5%</p>
            </div>
            <div className="flex items-center gap-2 text-green-500">
              <CheckIcon className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
            </div>
          </div>
        </div>

        {/* Compliance Checklist */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] p-6 md:p-8 space-y-4">
          <h2 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Compliance Checklist</h2>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {[
              { label: 'Tax Identification Number (TIN)', status: 'Verified' },
              { label: 'Annual Tax Filing', status: 'Up to date' },
              { label: 'VAT Registration', status: 'Active' },
              { label: 'Professional Practice License', status: 'Valid' },
              { label: 'AfriDam Financial Agreement', status: 'Signed' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-4">
                <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">{item.label}</p>
                <span className="flex items-center gap-1.5 text-[10px] font-black text-green-600 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-full uppercase tracking-widest">
                  <CheckIcon className="w-3 h-3" />
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}