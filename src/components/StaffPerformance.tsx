import { Star, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface StaffMember {
  id: number;
  name: string;
  role: string;
  rating: number;
  avatar: string;
  status?: 'online' | 'offline';
}

const staffMembers: StaffMember[] = [
  { id: 1, name: 'Rodrigues', role: 'Barbeiro', rating: 4.7, avatar: 'https://i.pravatar.cc/150?u=daniel', status: 'online' },
  { id: 2, name: 'Pedro', role: 'Barbeiro', rating: 4.7, avatar: 'https://i.pravatar.cc/150?u=daniel', status: 'online' }
  
];

export function StaffPerformance() {
  return (
    <div className="bg-card rounded-xl p-5 border border-border h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-medium text-foreground">Perfomance Barbeiros</h3>
        <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Staff List */}
      <div className="space-y-3">
        {staffMembers.map((staff) => (
          <div 
            key={staff.id} 
            className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={staff.avatar} alt={staff.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {staff.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                {staff.status === 'online' && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-card rounded-full" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{staff.name}</p>
                <p className="text-xs text-muted-foreground">{staff.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Star size={14} className="text-amber-500 fill-amber-500" />
              <span className="text-sm font-medium text-foreground">{staff.rating}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
