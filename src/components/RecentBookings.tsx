import { Search, Filter, ArrowUpDown, MoreHorizontal } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTableSelection } from '@/hooks/useTableSelection';

interface Booking {
  id: number;
  customerName: string;
  service: string;
  bookingDate: string;
  staffName: string;
  status: 'pendente' | 'confirmado' | 'completado' | 'cancelado';
}

const bookings: Booking[] = [
  { 
    id: 1, 
    customerName: 'Thompson', 
    service: 'Corte e Barba', 
    bookingDate: '06 de Abril de 2026 - 14:45', 
    staffName: 'Rodrigues', 
    status: 'pendente' 
  },
  { 
    id: 2, 
    customerName: 'Noah Johnson', 
    service: 'Corte Clássico', 
    bookingDate: '06 de Abril de 2026 - 11:15', 
    staffName: 'Pedro', 
    status: 'confirmado' 
  },
  { 
    id: 3, 
    customerName: 'Ethan Davis', 
    service: 'Barba', 
    bookingDate: '06 de Abril de 2026 - 15:30', 
    staffName: 'Pedro', 
    status: 'completado' 
  },
  { 
    id: 4, 
    customerName: 'Lucas Miller', 
    service: 'Corte Clássico', 
    bookingDate: '06 de Abril de 2026 - 10:00', 
    staffName: 'Rodrigues', 
    status: 'cancelado' 
  },
  { 
    id: 5, 
    customerName: 'Wilson', 
    service: 'Luzes', 
    bookingDate: '06 de Abril de 2026 - 16:00', 
    staffName: 'Rodrigues', 
    status: 'confirmado' 
  },
];

const statusStyles = {
  pendente: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  confirmado: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  completado: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  cancelado: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export function RecentBookings() {
  const { selectedRows, toggleRow, toggleAll } = useTableSelection(
    bookings.map((booking) => booking.id)
  );

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="text-base font-medium text-foreground">Agendamento Recentes</h3>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <input 
              type="text" 
              placeholder="Search"
              className="w-48 bg-secondary text-sm text-foreground placeholder:text-muted-foreground rounded-md pl-9 pr-3 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-foreground bg-secondary rounded-md border border-border hover:bg-secondary/80 transition-colors">
            <Filter size={14} />
            Filtro
          </button>
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-foreground bg-secondary rounded-md border border-border hover:bg-secondary/80 transition-colors">
            <ArrowUpDown size={14} />
            Sort by
          </button>
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
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Serviços</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Data do Agendamento</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Nome do Funcionário</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="w-10 px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking, index) => (
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
                <td className="px-4 py-3 text-sm text-muted-foreground">{index + 1}</td>
                <td className="px-4 py-3 text-sm font-medium text-foreground">{booking.customerName}</td>
                <td className="px-4 py-3 text-sm text-foreground">{booking.service}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{booking.bookingDate}</td>
                <td className="px-4 py-3 text-sm text-foreground">{booking.staffName}</td>
                <td className="px-4 py-3">
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-xs capitalize px-2 py-0.5 rounded-full",
                      statusStyles[booking.status]
                    )}
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
  );
}
