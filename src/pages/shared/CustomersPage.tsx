import { Search, Filter, Plus, MoreHorizontal, Phone, Mail, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useTableSelection } from '@/hooks/useTableSelection';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  visits: number;
  lastVisit: string;
  status: 'active' | 'inactive';
  avatar: string;
}

const customers: Customer[] = [
  { id: 1, name: 'Liam Thompson', email: 'liam@email.com', phone: '(11) 98765-4321', visits: 24, lastVisit: 'May 15, 2025', status: 'active', avatar: 'https://i.pravatar.cc/150?u=liam' },
  { id: 2, name: 'Noah Johnson', email: 'noah@email.com', phone: '(11) 98765-4322', visits: 18, lastVisit: 'May 22, 2025', status: 'active', avatar: 'https://i.pravatar.cc/150?u=noah' },
  { id: 3, name: 'Ethan Davis', email: 'ethan@email.com', phone: '(11) 98765-4323', visits: 32, lastVisit: 'May 18, 2025', status: 'active', avatar: 'https://i.pravatar.cc/150?u=ethan' },
  { id: 4, name: 'Lucas Miller', email: 'lucas@email.com', phone: '(11) 98765-4324', visits: 8, lastVisit: 'Apr 20, 2025', status: 'inactive', avatar: 'https://i.pravatar.cc/150?u=lucas' },
  { id: 5, name: 'Mason Wilson', email: 'mason@email.com', phone: '(11) 98765-4325', visits: 45, lastVisit: 'May 25, 2025', status: 'active', avatar: 'https://i.pravatar.cc/150?u=mason' },
  { id: 6, name: 'James Anderson', email: 'james@email.com', phone: '(11) 98765-4326', visits: 12, lastVisit: 'May 10, 2025', status: 'active', avatar: 'https://i.pravatar.cc/150?u=james2' },
  { id: 7, name: 'Benjamin Moore', email: 'benjamin@email.com', phone: '(11) 98765-4327', visits: 6, lastVisit: 'Mar 15, 2025', status: 'inactive', avatar: 'https://i.pravatar.cc/150?u=benjamin' },
  { id: 8, name: 'William Taylor', email: 'william@email.com', phone: '(11) 98765-4328', visits: 28, lastVisit: 'May 28, 2025', status: 'active', avatar: 'https://i.pravatar.cc/150?u=william' },
];

export function CustomersPage() {
  const { selectedRows, toggleRow, toggleAll } = useTableSelection(
    customers.map((customer) => customer.id)
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Total Clientes</p>
          <h3 className="text-2xl font-semibold text-foreground">1.247</h3>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Clientes Ativos</p>
          <h3 className="text-2xl font-semibold text-foreground">1.089</h3>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Novos Clientes no mês</p>
          <h3 className="text-2xl font-semibold text-foreground">86</h3>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Taxa de Retenção</p>
          <h3 className="text-2xl font-semibold text-foreground">87.3%</h3>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-base font-medium text-foreground">Todos os Clientes</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input 
                type="text" 
                placeholder="Buscar Clientes..."
                className="w-56 bg-secondary text-sm text-foreground placeholder:text-muted-foreground rounded-md pl-9 pr-3 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter size={14} />
              Filtro
            </Button>
            <Button size="sm" className="gap-2">
              <Plus size={14} />
              Adicionar Clientes
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
                    checked={selectedRows.length === customers.length && customers.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Contato</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Visitas</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Última Visita</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr 
                  key={customer.id} 
                  className="border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors"
                >
                  <td className="p-4">
                    <Checkbox 
                      checked={selectedRows.includes(customer.id)}
                      onCheckedChange={() => toggleRow(customer.id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={customer.avatar} alt={customer.name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {customer.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground">{customer.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail size={12} />
                        {customer.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone size={12} />
                        {customer.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-foreground">{customer.visits}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar size={14} />
                      {customer.lastVisit}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge 
                      variant="outline" 
                      className={`text-xs capitalize px-2 py-0.5 rounded-full ${
                        customer.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                      }`}
                    >
                      {customer.status}
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
