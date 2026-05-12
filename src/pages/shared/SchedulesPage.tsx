import { useState } from 'react';
import { Search, Filter, Plus, MoreHorizontal, Clock, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Schedule {
  id: number;
  staffName: string;
  day: string;
  startTime: string;
  endTime: string;
  breaks: string;
  status: 'trabalhando' | 'off' | 'ferias';
  avatar: string;
}

const schedules: Schedule[] = [
  { id: 1, staffName: 'Rodrigues', day: 'Monday', startTime: '09:00 AM', endTime: '06:00 PM', breaks: '12:00 - 01:00 PM', status: 'trabalhando', avatar: 'https://i.pravatar.cc/150?u=lucas' },
  { id: 2, staffName: 'Pedro', day: 'Monday', startTime: '10:00 AM', endTime: '07:00 PM', breaks: '01:00 - 02:00 PM', status: 'trabalhando', avatar: 'https://i.pravatar.cc/150?u=daniel' },
  
];

const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

export function SchedulesPage() {
  const [selectedDay, setSelectedDay] = useState('Monday');

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Total Funcionários</p>
          <h3 className="text-2xl font-semibold text-foreground">6</h3>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Trabalhando hoje</p>
          <h3 className="text-2xl font-semibold text-foreground">5</h3>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Online</p>
          <h3 className="text-2xl font-semibold text-foreground">1</h3>
        </div>
        <div className="bg-card rounded-xl p-5 border border-border">
          <p className="text-sm text-muted-foreground mb-1">Total Horas</p>
          <h3 className="text-2xl font-semibold text-foreground">45h</h3>
        </div>
      </div>

      {/* Day Selector */}
      <div className="bg-card rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <Button variant="outline" size="sm">
            <ChevronLeft size={16} />
          </Button>
          <div className="flex gap-2">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedDay === day
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-secondary'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm">
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <h3 className="text-base font-medium text-foreground">Calendário - {selectedDay}</h3>
            <Badge variant="secondary">06 de Abril de 2026</Badge>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <input 
                type="text" 
                placeholder="Search staff..."
                className="w-56 bg-secondary text-sm text-foreground placeholder:text-muted-foreground rounded-md pl-9 pr-3 py-1.5 border border-border focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter size={14} />
              Filtro
            </Button>
            <Button size="sm" className="gap-2">
              <Plus size={14} />
              Adicionar Horário
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Funcionário</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Hora de Início</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Hora de Término</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Intervalos</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="w-10 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule) => (
                <tr 
                  key={schedule.id} 
                  className="border-b border-border last:border-b-0 hover:bg-secondary/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={schedule.avatar} alt={schedule.staffName} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {schedule.staffName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-foreground">{schedule.staffName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Clock size={14} className="text-muted-foreground" />
                      {schedule.startTime}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Clock size={14} className="text-muted-foreground" />
                      {schedule.endTime}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar size={14} />
                      {schedule.breaks}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge 
                      variant="outline" 
                      className={`text-xs capitalize px-2 py-0.5 rounded-full ${
                        schedule.status === 'trabalhando' 
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                          : schedule.status === 'ferias'
                          ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          : 'bg-gray-500/10 text-gray-500 border-gray-500/20'
                      }`}
                    >
                      {schedule.status}
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
