import { Search, Filter, Plus, MoreHorizontal, Package, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useTableSelection } from '@/hooks/useTableSelection';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  sold: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock';
}

const products: Product[] = [
  { id: 1, name: 'Pomade Matte', description: 'Matte finish hair pomade', price: 35.00, stock: 45, category: 'Styling', sold: 123, status: 'in_stock' },
  { id: 2, name: 'Beard Oil', description: 'Natural beard conditioning oil', price: 28.00, stock: 32, category: 'Beard Care', sold: 89, status: 'in_stock' },
  { id: 3, name: 'Hair Wax', description: 'Strong hold hair wax', price: 25.00, stock: 8, category: 'Styling', sold: 156, status: 'low_stock' },
  { id: 4, name: 'Shaving Cream', description: 'Premium shaving cream', price: 22.00, stock: 0, category: 'Shave', sold: 67, status: 'out_of_stock' },
  { id: 5, name: 'After Shave', description: 'Refreshing after shave lotion', price: 30.00, stock: 28, category: 'Shave', sold: 78, status: 'in_stock' },
  { id: 6, name: 'Beard Balm', description: 'Beard styling balm', price: 32.00, stock: 15, category: 'Beard Care', sold: 45, status: 'in_stock' },
  { id: 7, name: 'Hair Shampoo', description: 'Daily use hair shampoo', price: 18.00, stock: 52, category: 'Hair Care', sold: 234, status: 'in_stock' },
  { id: 8, name: 'Comb Set', description: 'Professional comb set', price: 15.00, stock: 5, category: 'Tools', sold: 89, status: 'low_stock' },
];

const statusStyles = {
  in_stock: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  low_stock: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  out_of_stock: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export function ProductsPage() {
  const { selectedRows, toggleRow, toggleAll } = useTableSelection(
    products.map((product) => product.id)
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Total Products</p>
          <h3 className="text-2xl font-semibold text-foreground">48</h3>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">In Stock</p>
          <h3 className="text-2xl font-semibold text-foreground">42</h3>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Low Stock</p>
          <h3 className="text-2xl font-semibold text-foreground">4</h3>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Out of Stock</p>
          <h3 className="text-2xl font-semibold text-foreground">2</h3>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-base font-medium text-foreground">All Products</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input 
                type="text" 
                placeholder="Search products..."
                className="w-56 bg-secondary text-sm text-foreground placeholder:text-muted-foreground rounded-md pl-9 pr-3 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter size={14} />
              Filter
            </Button>
            <Button size="sm" className="gap-2">
              <Plus size={14} />
              Add Product
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
                    checked={selectedRows.length === products.length && products.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Sold</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr 
                  key={product.id} 
                  className="border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors"
                >
                  <td className="p-4">
                    <Checkbox 
                      checked={selectedRows.includes(product.id)}
                      onCheckedChange={() => toggleRow(product.id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                        <Package size={18} className="text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="text-xs">
                      {product.category}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <DollarSign size={14} className="text-emerald-500" />
                      {product.price.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Package size={14} className="text-muted-foreground" />
                      {product.stock} units
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <TrendingUp size={14} className="text-primary" />
                      {product.sold}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge 
                      variant="outline" 
                      className={`text-xs capitalize px-2 py-0.5 rounded-full ${statusStyles[product.status]}`}
                    >
                      {product.status === 'low_stock' && <AlertCircle size={12} className="mr-1 inline" />}
                      {product.status.replace('_', ' ')}
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
