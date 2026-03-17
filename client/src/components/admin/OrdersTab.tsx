import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PackageSearch, Clock, MapPin, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getToken } from "@/lib/auth";
import { useState } from "react";

type Order = {
  id: string;
  title: string;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  vehicleYear: string | null;
  city: string | null;
  state: string | null;
  status: string;
  createdAt: string;
  proposals?: unknown[];
  client?: { name: string; email: string } | null;
};

const statusLabels: Record<string, string> = {
  open: "Propostas Abertas",
  negotiating: "Em Negociação",
  completed: "Concluído",
  shipped: "Enviado",
  cancelled: "Cancelado",
};

const statusStyles: Record<string, string> = {
  open: "bg-green-500/10 text-green-600 hover:bg-green-500/20",
  negotiating: "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20",
  closed: "bg-slate-500/10 text-slate-600 hover:bg-slate-500/20",
  completed: "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20",
  shipped: "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20",
  cancelled: "bg-red-500/10 text-red-600 hover:bg-red-500/20",
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Agora";
  if (diffMin < 60) return `Há ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Há ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Ontem";
  return `Há ${diffDays} dias`;
}

export default function OrdersTab({ onSelectOrder }: { onSelectOrder?: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/admin/orders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/orders");
      return res.json();
    },
    enabled: !!getToken(),
    refetchInterval: 30 * 1000,
    staleTime: 0,
  });

  const filtered = orders.filter((order) => {
    if (statusFilter && order.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        order.title?.toLowerCase().includes(q) ||
        order.vehicleBrand?.toLowerCase().includes(q) ||
        order.vehicleModel?.toLowerCase().includes(q) ||
        String(order.id).includes(q);
      if (!match) return false;
    }
    return true;
  });

  const countByStatus = (s: string) => orders.filter((o) => o.status === s).length;

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tight">Anúncios & Pedidos de Peças</h1>
          <p className="text-muted-foreground">Monitoramento do fluxo de necessidades na plataforma.</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Badge
          variant={statusFilter === null ? "default" : "outline"}
          className={`text-sm py-1 px-3 cursor-pointer ${statusFilter === null ? "bg-primary" : ""}`}
          onClick={() => setStatusFilter(null)}
        >
          Todos ({orders.length})
        </Badge>
        {Object.entries(statusLabels).map(([key, label]) => {
          const count = countByStatus(key);
          if (count === 0 && key !== "open" && key !== "negotiating" && key !== "completed") return null;
          return (
            <Badge
              key={key}
              variant={statusFilter === key ? "default" : "outline"}
              className={`text-sm py-1 px-3 cursor-pointer ${statusFilter === key ? "bg-primary" : ""}`}
              onClick={() => setStatusFilter(key)}
            >
              {label} ({count})
            </Badge>
          );
        })}
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por peça, veículo ou ID do pedido..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Nenhum pedido encontrado.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const vehicle = [order.vehicleBrand, order.vehicleModel, order.vehicleYear].filter(Boolean).join(" ");
            const location = [order.city, order.state].filter(Boolean).join(", ");
            const proposalCount = order.proposals ? order.proposals.length : 0;

            return (
              <Card key={order.id} className="overflow-hidden hover:border-primary/40 transition-all cursor-pointer" onClick={() => onSelectOrder?.(order.id)}>
                <CardContent className="p-0 sm:flex items-center">
                  <div className="bg-muted/50 p-4 sm:p-6 sm:w-1/4 flex flex-col justify-center border-r">
                    <span className="font-mono text-xs text-muted-foreground mb-1">PED-{order.id}</span>
                    <span className="font-bold text-lg leading-tight">{order.title}</span>
                    {vehicle && <Badge variant="secondary" className="w-fit mt-2">{vehicle}</Badge>}
                  </div>

                  <div className="p-4 sm:p-6 flex-1 grid sm:grid-cols-3 gap-4 items-center">
                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> Destino
                      </div>
                      <div className="font-medium text-sm">{location || "Não informado"}</div>
                      {order.client && <div className="text-xs text-muted-foreground">{order.client.name}</div>}
                    </div>

                    <div className="space-y-1">
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <PackageSearch className="h-3 w-3" /> Propostas de Desmanches
                      </div>
                      <div className="font-bold text-lg text-primary">
                        {proposalCount} <span className="text-sm font-normal text-muted-foreground">ofertas</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-start sm:items-end gap-2">
                      <Badge
                        className={statusStyles[order.status] || "bg-slate-500/10 text-slate-600 hover:bg-slate-500/20"}
                        variant="outline"
                      >
                        {statusLabels[order.status] || order.status}
                      </Badge>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {timeAgo(order.createdAt)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
