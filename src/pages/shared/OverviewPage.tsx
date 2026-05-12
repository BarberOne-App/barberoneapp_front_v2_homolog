import { StatCard } from '@/components/StatCard';
import { RevenueChart } from '@/components/RevenueChart';
import { StaffPerformance } from '@/components/StaffPerformance';
import { RecentBookings } from '@/components/RecentBookings';
import { DollarSign, Calendar, Scissors } from 'lucide-react';

export function OverviewPage() {
  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          title="Total Receitas"
          value="R$ 23.249,00"
          change="15.5%"
          changeType="positive"
          icon={DollarSign}
          iconBg="bg-primary/10"
        />
        <StatCard 
          title="Total Agendamentos"
          value="2.095"
          change="10.5%"
          changeType="negative"
          icon={Calendar}
          iconBg="bg-blue-500/10"
        />
        <StatCard 
          title="Total Serviços"
          value="27"
          change="8.5%"
          changeType="positive"
          icon={Scissors}
          iconBg="bg-emerald-500/10"
        />
      </div>
      
      {/* Charts and Staff Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div className="lg:col-span-1">
          <StaffPerformance />
        </div>
      </div>
      
      {/* Recent Bookings */}
      <RecentBookings />
    </div>
  );
}
