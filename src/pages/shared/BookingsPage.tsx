import { Search, Filter, Plus, MoreHorizontal, Calendar, Clock, User, Scissors } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useTableSelection } from '@/hooks/useTableSelection';

interface Booking {
  id: number;
  customerName: string;
  service: string;
  date: string;
  time: string;
  staffName: string;
  status: 'pendente' | 'confirmado' | 'completado' | 'cancelado';
  avatar: string;
}

const bookings: Booking[] = [
  { id: 1, customerName: 'Liam Thompson', service: 'Corte e Barba', date: 'May 15, 2025', time: '2:45 PM', staffName: 'Rodrigues', status: 'pendente', avatar: 'https://i.pravatar.cc/150?u=lucas' },
  { id: 2, customerName: 'Noah Johnson', service: 'Corte Clássico', date: 'May 22, 2025', time: '11:15 AM', staffName: 'Pedro', status: 'confirmado', avatar: 'https://i.pravatar.cc/150?u=daniel' },
  { id: 3, customerName: 'Ethan Davis', service: 'Luzes', date: 'May 18, 2025', time: '3:30 PM', staffName: 'Rodrigues', status: 'completado', avatar: 'https://i.pravatar.cc/150?u=lucas' },
  { id: 4, customerName: 'Lucas Miller', service: 'Corte e Barba', date: 'May 20, 2025', time: '10:00 AM', staffName: 'Rodrigues', status: 'cancelado', avatar: 'https://i.pravatar.cc/150?u=lucas' },
  { id: 5, customerName: 'Mason Wilson', service: 'Corte Clássico', date: 'May 25, 2025', time: '4:00 PM', staffName: 'Pedro', status: 'confirmado', avatar: 'https://i.pravatar.cc/150?u=daniel' },
  { id: 6, customerName: 'James Anderson', service: 'Corte e Barba', date: 'May 28, 2025', time: '1:30 PM', staffName: 'Rodrigues', status: 'pendente', avatar: 'https://i.pravatar.cc/150?u=lucas' },
  { id: 7, customerName: 'Benjamin Moore', service: 'Barba', date: 'May 30, 2025', time: '9:00 AM', staffName: 'Pedro', status: 'confirmado', avatar: 'https://i.pravatar.cc/150?u=daniel' },
  { id: 8, customerName: 'William Taylor', service: 'Luzes', date: 'Jun 1, 2025', time: '5:00 PM', staffName: 'Rodrigues', status: 'pendente', avatar: 'https://i.pravatar.cc/150?u=lucas' },
];

const statusStyles = {
  pendente: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  confirmado: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  completado: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  cancelado: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export function BookingsPage() {
  const { selectedRows, toggleRow, toggleAll } = useTableSelection(
    bookings.map((booking) => booking.id)
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Total Agendamentos</p>
          <h3 className="text-2xl font-semibold text-foreground">2.095</h3>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Hoje</p>
          <h3 className="text-2xl font-semibold text-foreground">24</h3>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Esta Semana</p>
          <h3 className="text-2xl font-semibold text-foreground">156</h3>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Pendentes</p>
          <h3 className="text-2xl font-semibold text-foreground">18</h3>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-base font-medium text-foreground">Todos Agendamentos</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input 
                type="text" 
                placeholder="Buscar..."
                className="w-56 bg-secondary text-sm text-foreground placeholder:text-muted-foreground rounded-md pl-9 pr-3 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter size={14} />
              Filtros
            </Button>
            <Button size="sm" className="gap-2">
              <Plus size={14} />
              Novo Agendamento
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="w-10 p-4">
                  <Checkbox 
                    checked={selectedRows.length === bookings.length && bookings.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Service</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date & Time</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Staff</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr 
                  key={booking.id} 
                  className="border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors"
                >
                  <td className="p-4">
                    <Checkbox 
                      checked={selectedRows.includes(booking.id)}
                      onCheckedChange={() => toggleRow(booking.id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={booking.avatar} alt={booking.customerName} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {booking.customerName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground">{booking.customerName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Scissors size={14} className="text-muted-foreground" />
                      {booking.service}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-foreground">
                        <Calendar size={14} className="text-muted-foreground" />
                        {booking.date}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock size={14} />
                        {booking.time}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <User size={14} className="text-muted-foreground" />
                      {booking.staffName}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge 
                      variant="outline" 
                      className={`text-xs capitalize px-2 py-0.5 rounded-full ${statusStyles[booking.status]}`}
                    >
                      {booking.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <button className="p-1 text-muted-foreground hover:text-foreground transition-colors">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
