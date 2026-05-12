import { Search, Filter, Star, MoreHorizontal, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useTableSelection } from '@/hooks/useTableSelection';

interface Review {
  id: number;
  customerName: string;
  service: string;
  staffName: string;
  rating: number;
  comment: string;
  date: string;
  likes: number;
  status: 'published' | 'pending' | 'flagged';
  avatar: string;
}

const reviews: Review[] = [
  { id: 1, customerName: 'Liam Thompson', service: 'Fade Masterpiece', staffName: 'Sophia Martinez', rating: 5, comment: 'Amazing service! Sophia really knows her craft. Best fade I\'ve ever had.', date: 'May 15, 2025', likes: 12, status: 'published', avatar: 'https://i.pravatar.cc/150?u=liam' },
  { id: 2, customerName: 'Noah Johnson', service: 'Buzz Cut Bliss', staffName: 'Olivia Brown', rating: 4, comment: 'Great experience, very professional. Would recommend.', date: 'May 22, 2025', likes: 8, status: 'published', avatar: 'https://i.pravatar.cc/150?u=noah' },
  { id: 3, customerName: 'Ethan Davis', service: 'Beard Trim', staffName: 'Daniel Wilson', rating: 5, comment: 'Perfect beard trim. Daniel took his time and did an excellent job.', date: 'May 18, 2025', likes: 15, status: 'published', avatar: 'https://i.pravatar.cc/150?u=ethan' },
  { id: 4, customerName: 'Lucas Miller', service: 'Classic Cut', staffName: 'James Anderson', rating: 3, comment: 'Good cut but took longer than expected.', date: 'May 20, 2025', likes: 3, status: 'pending', avatar: 'https://i.pravatar.cc/150?u=lucas' },
  { id: 5, customerName: 'Mason Wilson', service: 'Hot Towel Shave', staffName: 'Michael Thompson', rating: 5, comment: 'The hot towel shave was incredibly relaxing. Michael is a true professional.', date: 'May 25, 2025', likes: 20, status: 'published', avatar: 'https://i.pravatar.cc/150?u=mason' },
  { id: 6, customerName: 'James Anderson', service: 'Hair Coloring', staffName: 'Sophia Martinez', rating: 2, comment: 'Color was not what I expected. Need to fix this.', date: 'May 28, 2025', likes: 1, status: 'flagged', avatar: 'https://i.pravatar.cc/150?u=james2' },
];

const statusStyles = {
  published: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  flagged: 'bg-red-500/10 text-red-500 border-red-500/20',
};

export function ReviewsPage() {
  const { selectedRows, toggleRow, toggleAll } = useTableSelection(
    reviews.map((review) => review.id)
  );

  const averageRating = (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Total Reviews</p>
          <h3 className="text-2xl font-semibold text-foreground">324</h3>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Average Rating</p>
          <div className="flex items-center gap-2">
            <h3 className="text-2xl font-semibold text-foreground">{averageRating}</h3>
            <Star size={20} className="text-amber-500 fill-amber-500" />
          </div>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">This Month</p>
          <h3 className="text-2xl font-semibold text-foreground">48</h3>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Pending</p>
          <h3 className="text-2xl font-semibold text-foreground">5</h3>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-base font-medium text-foreground">All Reviews</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input 
                type="text" 
                placeholder="Search reviews..."
                className="w-56 bg-secondary text-sm text-foreground placeholder:text-muted-foreground rounded-md pl-9 pr-3 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter size={14} />
              Filter
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
                    checked={selectedRows.length === reviews.length && reviews.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Service & Staff</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Review</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr 
                  key={review.id} 
                  className="border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors"
                >
                  <td className="p-4">
                    <Checkbox 
                      checked={selectedRows.includes(review.id)}
                      onCheckedChange={() => toggleRow(review.id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={review.avatar} alt={review.customerName} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {review.customerName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground">{review.customerName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      <p className="text-sm text-foreground">{review.service}</p>
                      <p className="text-xs text-muted-foreground">by {review.staffName}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={14} 
                          className={i < review.rating ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}
                        />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-xs">
                      <p className="text-sm text-foreground truncate">{review.comment}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar size={14} />
                      {review.date}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge 
                      variant="outline" 
                      className={`text-xs capitalize px-2 py-0.5 rounded-full ${statusStyles[review.status]}`}
                    >
                      {review.status}
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
