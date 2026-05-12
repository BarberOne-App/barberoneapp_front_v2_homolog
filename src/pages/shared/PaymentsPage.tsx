import { Search, Filter, Download, MoreHorizontal, CreditCard, Calendar, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useTableSelection } from '@/hooks/useTableSelection';

interface Payment {
  id: number;
  customerName: string;
  service: string;
  amount: number;
  method: 'credit_card' | 'debit_card' | 'cash' | 'pix';
  date: string;
  status: 'pago' | 'pendente' | 'reembolsado';
}

const payments: Payment[] = [
  { id: 1, customerName: 'Liam Thompson', service: 'Fade Masterpiece', amount: 45.00, method: 'credit_card', date: 'May 15, 2025', status: 'pago' },
  { id: 2, customerName: 'Noah Johnson', service: 'Buzz Cut Bliss', amount: 35.00, method: 'pix', date: 'May 22, 2025', status: 'pago' },
  { id: 3, customerName: 'Ethan Davis', service: 'Beard Trim', amount: 25.00, method: 'cash', date: 'May 18, 2025', status: 'pago' },
  { id: 4, customerName: 'Lucas Miller', service: 'Classic Cut', amount: 40.00, method: 'credit_card', date: 'May 20, 2025', status: 'reembolsado' },
  { id: 5, customerName: 'Mason Wilson', service: 'Hot Towel Shave', amount: 55.00, method: 'debit_card', date: 'May 25, 2025', status: 'pago' },
  { id: 6, customerName: 'James Anderson', service: 'Hair Coloring', amount: 85.00, method: 'credit_card', date: 'May 28, 2025', status: 'pendente' },
  { id: 7, customerName: 'Benjamin Moore', service: 'Kids Cut', amount: 30.00, method: 'cash', date: 'May 30, 2025', status: 'pago' },
  { id: 8, customerName: 'William Taylor', service: 'Full Service', amount: 120.00, method: 'pix', date: 'Jun 1, 2025', status: 'pago' },
];

const statusStyles = {
  pago: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  pendente: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  reembolsado: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const methodLabels = {
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  cash: 'Dinheiro',
  pix: 'PIX',
};

export function PaymentsPage() {
  const { selectedRows, toggleRow, toggleAll } = useTableSelection(
    payments.map((payment) => payment.id)
  );

  const totalRevenue = payments.filter(p => p.status === 'pago').reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Total Receitas</p>
          <h3 className="text-2xl font-semibold text-foreground">R$ {totalRevenue.toLocaleString('pt-BR')}</h3>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Hoje</p>
          <h3 className="text-2xl font-semibold text-foreground">R$ 1.245,00</h3>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Semanal</p>
          <h3 className="text-2xl font-semibold text-foreground">R$ 8.750,00</h3>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Pendentes</p>
          <h3 className="text-2xl font-semibold text-foreground">R$ 340,00</h3>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-base font-medium text-foreground">Todos Pagamentos</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input 
                type="text" 
                placeholder="Search payments..."
                className="w-56 bg-secondary text-sm text-foreground placeholder:text-muted-foreground rounded-md pl-9 pr-3 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter size={14} />
              Filtro
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download size={14} />
              Export
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
                    checked={selectedRows.length === payments.length && payments.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">ID</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Serviços</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Valor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Método</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr 
                  key={payment.id} 
                  className="border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors"
                >
                  <td className="p-4">
                    <Checkbox 
                      checked={selectedRows.includes(payment.id)}
                      onCheckedChange={() => toggleRow(payment.id)}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">#{payment.id.toString().padStart(4, '0')}</td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">{payment.customerName}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{payment.service}</td>
                  <td className="px-4 py-3 text-sm font-medium text-foreground">${payment.amount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <CreditCard size={14} className="text-muted-foreground" />
                      {methodLabels[payment.method]}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar size={14} />
                      {payment.date}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge 
                      variant="outline" 
                      className={`text-xs capitalize px-2 py-0.5 rounded-full ${statusStyles[payment.status]}`}
                    >
                      {payment.status === 'pago' && <CheckCircle size={12} className="mr-1 inline" />}
                      {payment.status}
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
