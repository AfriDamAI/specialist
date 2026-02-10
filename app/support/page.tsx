'use client';

import DashboardLayout from '@/components/DashboardLayout';
import { 
  QuestionMarkCircleIcon, 
  ChatBubbleLeftRightIcon, 
  ShieldExclamationIcon,
  BanknotesIcon,
  ChevronRightIcon,
  LifebuoyIcon
} from '@heroicons/react/24/solid';

export default function SupportPage() {
  const supportCategories = [
    {
      id: 'emergency',
      title: 'Clinical Emergency',
      desc: 'Immediate help for SJS/TEN diagnosis verification or case escalation.',
      icon: <ShieldExclamationIcon className="w-8 h-8 text-red-500" />,
      action: 'Call Medical Board',
      color: 'border-red-100 dark:border-red-900/30 bg-red-50/30 dark:bg-red-900/10'
    },
    {
      id: 'tech',
      title: 'Technical Support',
      desc: 'Issues with WebSockets, image uploads, or neural link syncing.',
      icon: <LifebuoyIcon className="w-8 h-8 text-blue-500" />,
      action: 'Open Tech Ticket',
      color: 'border-blue-100 dark:border-blue-900/30 bg-blue-50/30 dark:bg-blue-900/10'
    },
    {
      id: 'finance',
      title: 'Earnings & Payouts',
      desc: 'Discrepancies in your portfolio balance or bank transfer delays.',
      icon: <BanknotesIcon className="w-8 h-8 text-green-500" />,
      action: 'Contact Finance',
      color: 'border-green-100 dark:border-green-900/30 bg-green-50/30 dark:bg-green-900/10'
    }
  ];

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-10 pb-24 text-left">
        
        {/* Hero Section */}
        <div className="relative bg-black dark:bg-white rounded-[3.5rem] p-10 md:p-16 overflow-hidden shadow-2xl transition-colors">
          <div className="relative z-10 space-y-4">
            <h1 className="text-4xl md:text-6xl font-black text-white dark:text-black tracking-tighter uppercase">
              Specialist <span className="text-[#FF7A59]">Support</span>
            </h1>
            <p className="text-sm md:text-base font-bold text-gray-400 dark:text-gray-500 max-w-xl uppercase tracking-tight">
              Our medical board and technical team are available 24/7 to assist with your clinical workflow and account verification.
            </p>
          </div>
          <QuestionMarkCircleIcon className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5 dark:text-black/5 pointer-events-none" />
        </div>

        {/* Support Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {supportCategories.map((cat) => (
            <div key={cat.id} className={`p-8 rounded-[3rem] border-2 ${cat.color} flex flex-col justify-between h-[320px] transition-all hover:shadow-2xl group`}>
              <div className="space-y-4">
                <div className="p-4 bg-white dark:bg-gray-800 w-fit rounded-2xl shadow-sm transition-colors">
                  {cat.icon}
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none">{cat.title}</h3>
                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 leading-relaxed uppercase tracking-[0.1em]">
                  {cat.desc}
                </p>
              </div>
              <button className="w-full bg-white dark:bg-gray-800 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-sm group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-all active:scale-95">
                {cat.action}
              </button>
            </div>
          ))}
        </div>

        {/* Knowledge Base Section */}
        <div className="bg-white dark:bg-gray-900 rounded-[3.5rem] border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm transition-colors">
          <div className="p-10 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">Clinical FAQ</h2>
            <button className="text-[10px] font-black text-[#FF7A59] uppercase tracking-widest border-b-2 border-[#FF7A59] hover:opacity-70 transition-opacity">View All Docs</button>
          </div>
          
          <div className="p-4 md:p-10 divide-y divide-gray-50 dark:divide-gray-800">
            {[
              "When will my medical license be fully verified?",
              "How are consultation fees calculated and paid?",
              "What happens if the AI and my clinical judgment disagree?",
              "Can I invite other specialists to the AfriDam Network?"
            ].map((q, i) => (
              <div key={i} className="py-6 flex items-center justify-between group cursor-pointer hover:px-2 transition-all">
                <p className="text-sm font-black text-gray-700 dark:text-gray-300 uppercase tracking-tight">{q}</p>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl group-hover:bg-[#FF7A59] group-hover:text-white transition-all shadow-sm">
                  <ChevronRightIcon className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Chat Floating Trigger */}
        <div className="flex flex-col items-center justify-center space-y-4">
          <button className="flex items-center gap-3 bg-[#FF7A59] text-white px-10 py-5 rounded-[2rem] shadow-2xl shadow-[#FF7A59]/40 hover:scale-105 transition-transform active:scale-95">
            <ChatBubbleLeftRightIcon className="w-6 h-6" />
            <span className="text-xs font-black uppercase tracking-widest">Start Specialist Live Chat</span>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">Estimated Response: 5 Minutes</p>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}