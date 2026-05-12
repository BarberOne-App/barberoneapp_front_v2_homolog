import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingDown, RefreshCw, ChevronDown } from 'lucide-react';

const data = [
  // { day: 'Dom', value: 10000, fullDate: '06 de Abril de 2026' },
  { day: 'Seg', value: 15000, fullDate: '07 de Abril de 2026', isHighlighted: true },
  { day: 'Ter', value: 15647, fullDate: '08 de Abril de 2026' },
  { day: 'Qua', value: 12000, fullDate: '09 de Abril de 2026' },
  { day: 'Qui', value: 20000, fullDate: '10 de Abril de 2026' },
  { day: 'Sex', value: 14000, fullDate: '11 de Abril de 2026' },
  { day: 'Sab', value: 11000, fullDate: '12 de Abril de 2026' },
];

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: any[] }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground">${payload[0].value.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">{data.fullDate}</p>
      </div>
    );
  }
  return null;
};

export function RevenueChart() {
  const chartType = 'Bar Chart';
  const totalRevenue = 'R$ 23.249,00';
  const changePercent = '4.5%';

  return (
    <div className="bg-card rounded-xl p-5 border border-border">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-medium text-foreground">Analise de Receitas</h3>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm text-foreground bg-secondary rounded-md border border-border hover:bg-secondary/80 transition-colors">
            {chartType}
            <ChevronDown size={14} />
          </button>
          <button className="p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-2xl font-semibold text-foreground">{totalRevenue}</h2>
        <div className="flex items-center gap-1 text-red-500">
          <TrendingDown size={14} />
          <span className="text-sm font-medium">{changePercent}</span>
        </div>
        <span className="text-xs text-muted-foreground">Ultima Atualização: 06/04/2026</span>
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis 
              dataKey="day" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
              tickFormatter={(value) => `${value / 1000}K`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={50}>
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.isHighlighted ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.6)'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
