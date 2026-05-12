import { Search, Filter, Plus, MoreHorizontal, Mail, Shield, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useTableSelection } from '@/hooks/useTableSelection';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  lastLogin: string;
  status: 'active' | 'inactive';
  avatar: string;
}

const users: User[] = [
  { id: 1, name: 'Robert Johnson', email: 'robert@barberone.com', role: 'Admin', lastLogin: 'May 28, 2025 - 09:30 AM', status: 'active', avatar: 'https://i.pravatar.cc/150?u=robert' },
  { id: 2, name: 'Sarah Williams', email: 'sarah@barberone.com', role: 'Admin-Restricted', lastLogin: 'May 28, 2025 - 08:15 AM', status: 'active', avatar: 'https://i.pravatar.cc/150?u=sarah' },
  { id: 3, name: 'David Brown', email: 'david@barberone.com', role: 'Manager', lastLogin: 'May 27, 2025 - 05:45 PM', status: 'active', avatar: 'https://i.pravatar.cc/150?u=david' },
  { id: 4, name: 'Jennifer Lee', email: 'jennifer@barberone.com', role: 'Receptionist', lastLogin: 'May 28, 2025 - 10:00 AM', status: 'active', avatar: 'https://i.pravatar.cc/150?u=jennifer' },
  { id: 5, name: 'Mark Davis', email: 'mark@barberone.com', role: 'Accountant', lastLogin: 'May 26, 2025 - 03:20 PM', status: 'inactive', avatar: 'https://i.pravatar.cc/150?u=mark' },
  { id: 6, name: 'Lisa Anderson', email: 'lisa@barberone.com', role: 'Marketing', lastLogin: 'May 28, 2025 - 11:30 AM', status: 'active', avatar: 'https://i.pravatar.cc/150?u=lisa' },
];

const roleColors: Record<string, string> = {
  'Admin': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  'Admin-Restricted': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  'Manager': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  'Receptionist': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  'Accountant': 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  'Marketing': 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
};

export function UsersPage() {
  const { selectedRows, toggleRow, toggleAll } = useTableSelection(
    users.map((user) => user.id)
  );

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Total Users</p>
          <h3 className="text-2xl font-semibold text-foreground">12</h3>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Active</p>
          <h3 className="text-2xl font-semibold text-foreground">10</h3>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Admins</p>
          <h3 className="text-2xl font-semibold text-foreground">2</h3>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Online Now</p>
          <h3 className="text-2xl font-semibold text-foreground">4</h3>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="text-base font-medium text-foreground">All Users</h3>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input 
                type="text" 
                placeholder="Search users..."
                className="w-56 bg-secondary text-sm text-foreground placeholder:text-muted-foreground rounded-md pl-9 pr-3 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter size={14} />
              Filter
            </Button>
            <Button size="sm" className="gap-2">
              <Plus size={14} />
              Add User
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
                    checked={selectedRows.length === users.length && users.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Role</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Last Login</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr 
                  key={user.id} 
                  className="border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors"
                >
                  <td className="p-4">
                    <Checkbox 
                      checked={selectedRows.includes(user.id)}
                      onCheckedChange={() => toggleRow(user.id)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Mail size={10} />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge 
                      variant="outline" 
                      className={`text-xs px-2 py-0.5 rounded-full ${roleColors[user.role] || 'bg-gray-500/10 text-gray-500'}`}
                    >
                      <Shield size={10} className="mr-1" />
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar size={14} />
                      {user.lastLogin}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge 
                      variant="outline" 
                      className={`text-xs capitalize px-2 py-0.5 rounded-full ${
                        user.status === 'active' 
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                      }`}
                    >
                      {user.status}
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
