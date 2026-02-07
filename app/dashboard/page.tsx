import DashboardLayout from '@/components/DashboardLayout';

export default function DashboardPage() {
  return (
    <DashboardLayout>
    
      <div className="space-y-6">
        <h1 className="text-3xl font-black text-gray-900">Dashboard Overview</h1>
        
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Stats Card */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <p className="text-gray-500 text-sm font-semibold">Total Patients</p>
            <p className="text-3xl font-black text-gray-900 mt-2">1,234</p>
            <p className="text-green-600 text-sm mt-2">+12% this month</p>
          </div>
          
         
        </div>
      </div>
    </DashboardLayout>
  );
}