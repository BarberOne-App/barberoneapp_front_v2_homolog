import { Building2, Search, ShieldCheck, Users } from "lucide-react";

const barbershops = [
  { id: 1, name: "Barbearia Rodrigues", slug: "barbearia-rodrigues", users: 218, status: "active" },
  { id: 2, name: "BarberOne Centro", slug: "barberone-centro", users: 164, status: "active" },
  { id: 3, name: "Studio Premium", slug: "studio-premium", users: 96, status: "pending" },
];

const statusLabels: Record<string, string> = {
  active: "Ativa",
  pending: "Pendente",
};

export function BarbershopsPage() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5">
          <Building2 className="mb-3 text-primary" size={22} />
          <p className="text-sm text-muted-foreground">Barbearias cadastradas</p>
          <h3 className="text-2xl font-semibold text-foreground">48</h3>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <ShieldCheck className="mb-3 text-emerald-500" size={22} />
          <p className="text-sm text-muted-foreground">Ativas</p>
          <h3 className="text-2xl font-semibold text-foreground">45</h3>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <Users className="mb-3 text-blue-500" size={22} />
          <p className="text-sm text-muted-foreground">Usuarios vinculados</p>
          <h3 className="text-2xl font-semibold text-foreground">9.842</h3>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h3 className="text-base font-semibold text-foreground">Barbearias</h3>
            <p className="text-sm text-muted-foreground">Visao administrativa global.</p>
          </div>
          <div className="relative w-72">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              placeholder="Buscar barbearia"
              className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-5 py-3 font-medium">Nome</th>
                <th className="px-5 py-3 font-medium">Slug</th>
                <th className="px-5 py-3 font-medium">Usuarios</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {barbershops.map((barbershop) => (
                <tr key={barbershop.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-4 text-sm font-medium text-foreground">
                    {barbershop.name}
                  </td>
                  <td className="px-5 py-4 text-sm text-muted-foreground">{barbershop.slug}</td>
                  <td className="px-5 py-4 text-sm text-foreground">{barbershop.users}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {statusLabels[barbershop.status] || barbershop.status}
                    </span>
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
