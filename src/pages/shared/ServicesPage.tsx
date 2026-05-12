import { Search, Filter, Plus, MoreHorizontal, Clock, DollarSign, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useTableSelection } from '@/hooks/useTableSelection';

interface Service {
  id: number;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  bookings: number;
  status: 'active' | 'inactive';
}

const services: Service[] = [
  { id: 1, name: 'Fade Masterpiece', description: 'Precision fade with styling', duration: 45, price: 45.00, category: 'Haircut', bookings: 234, status: 'active' },
  { id: 2, name: 'Buzz Cut Bliss', description: 'Clean buzz cut with trimmer', duration: 20, price: 35.00, category: 'Haircut', bookings: 189, status: 'active' },
  { id: 3, name: 'Beard Trim', description: 'Professional beard grooming', duration: 30, price: 25.00, category: 'Beard', bookings: 156, status: 'active' },
  { id: 4, name: 'Classic Cut', description: 'Traditional haircut with scissors', duration: 40, price: 40.00, category: 'Haircut', bookings: 145, status: 'active' },
  { id: 5, name: 'Hot Towel Shave', description: 'Luxury straight razor shave', duration: 35, price: 55.00, category: 'Shave', bookings: 98, status: 'active' },
  { id: 6, name: 'Hair Coloring', description: 'Full hair coloring service', duration: 90, price: 85.00, category: 'Color', bookings: 67, status: 'active' },
  { id: 7, name: 'Kids Cut', description: 'Haircut for children under 12', duration: 25, price: 30.00, category: 'Haircut', bookings: 112, status: 'active' },
  { id: 8, name: 'Full Service', description: 'Haircut, beard trim and facial', duration: 75, price: 120.00, category: 'Package', bookings: 89, status: 'active' },
];

export function ServicesPage() {
  const { selectedRows, toggleRow, toggleAll } = useTableSelection(
    services.map((service) => service.id)
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Total Services</p>
          <h3 className="text-2xl font-semibold text-foreground">27</h3>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Active</p>
          <h3 className="text-2xl font-semibold text-foreground">24</h3>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Total Bookings</p>
          <h3 className="text-2xl font-semibold text-foreground">1,090</h3>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Avg Price</p>
          <h3 className="text-2xl font-semibold text-foreground">$54.38</h3>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-base font-medium text-foreground">All Services</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input 
                type="text" 
                placeholder="Search services..."
                className="w-56 bg-secondary text-sm text-foreground placeholder:text-muted-foreground rounded-md pl-9 pr-3 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter size={14} />
              Filter
            </Button>
            <Button size="sm" className="gap-2">
              <Plus size={14} />
              Add Service
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
                    checked={selectedRows.length === services.length && services.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Service</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Duration</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Bookings</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr 
                  key={service.id} 
                  className="border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors"
                >
                  <td className="p-4">
                    <Checkbox 
                      checked={selectedRows.includes(service.id)}
                      onCheckedChange={() => toggleRow(service.id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{service.name}</p>
                      <p className="text-xs text-muted-foreground">{service.description}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-xs">
                      {service.category}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Clock size={14} className="text-muted-foreground" />
                      {service.duration} min
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <DollarSign size={14} className="text-emerald-500" />
                      {service.price.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <TrendingUp size={14} className="text-primary" />
                      {service.bookings}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge 
                      variant="outline" 
                      className={`text-xs capitalize px-2 py-0.5 rounded-full ${
                        service.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                      }`}
                    >
                      {service.status}
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
