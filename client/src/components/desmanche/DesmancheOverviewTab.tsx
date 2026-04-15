import { useQuery } from "@tanstack/react-query";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { PackageSearch, Handshake, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

const STATUS_COLORS: Record<string, string> = {
  negotiating: "bg-blue-100 text-blue-800 border-blue-200",
  shipped: "bg-orange-100 text-orange-800 border-orange-200",
  delivered: "bg-purple-100 text-purple-800 border-purple-200",
  completed: "bg-green-100 text-green-800 border-green-200",
};

const STATUS_LABELS: Record<string, string> = {
  negotiating: "Negociando",
  shipped: "Enviado",
  delivered: "Entregue",
  completed: "Concluído",
};

export default function DesmancheOverviewTab({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { user } = useAuth();

  const { data: desmanche } = useQuery({
    queryKey: ["/api/desmanches/me"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/desmanches/me");
      return res.json();
    },
  });

  const { data: negotiations = [], isLoading: loadingNeg } = useQuery({
    queryKey: ["/api/negotiations/my"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/negotiations/my");
      return res.json();
    },
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/orders?status=open");
      return res.json();
    },
  });

  const desmancheVehicleTypes: string[] = (() => {
    try { return JSON.parse(desmanche?.vehicleTypes || "[]"); } catch { return []; }
  })();

  // Count available items the same way DesmancheOrdersTab does
  const availableItemsCount = (orders as any[]).reduce((count: number, order: any) => {
    if (order.items && order.items.length > 0) {
      const open = order.items.filter((item: any) =>
        (item.status === "open" || item.status === "has_proposals") &&
        (desmancheVehicleTypes.length === 0 || !item.vehicleType || desmancheVehicleTypes.includes(item.vehicleType))
      ).length;
      return count + open;
    }
    // Legacy single-item order
    if (desmancheVehicleTypes.length > 0 && order.vehicleType && !desmancheVehicleTypes.includes(order.vehicleType)) {
      return count;
    }
    return count + 1;
  }, 0);

  const recentOrders = (orders as any[]).filter((order: any) => {
    if (order.items && order.items.length > 0) {
      return order.items.some((item: any) => item.status === "open" || item.status === "has_proposals");
    }
    return true;
  });

  const activeNegotiations = negotiations.filter((n: any) =>
    ["negotiating", "shipped"].includes(n.status)
  );

  const completedNegotiations = negotiations.filter((n: any) => n.status === "completed");

  const recentNegotiations = negotiations.slice(0, 3);

  const isLoading = loadingNeg || loadingOrders;

  const name = desmanche?.tradingName || user?.name || "Desmanche";

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold font-mono text-slate-900 tracking-tight">
            Olá, {name}!
          </h1>
          <p className="text-slate-500 mt-1">Aqui está o resumo das suas negociações na plataforma hoje.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Em Negociação</CardTitle>
            <Handshake className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            ) : (
              <>
                <div className="text-3xl font-bold font-mono text-slate-900">{activeNegotiations.length}</div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  negociações ativas no momento
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Vendas Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            ) : (
              <>
                <div className="text-3xl font-bold font-mono text-slate-900">{completedNegotiations.length}</div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  vendas finalizadas na plataforma
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-primary">Oportunidades</CardTitle>
            <PackageSearch className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            ) : (
              <>
                <div className="text-3xl font-bold font-mono text-primary">{availableItemsCount}</div>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  itens disponíveis para proposta agora
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="font-mono text-lg">Pedidos Abertos Recentes</CardTitle>
            <CardDescription>Clientes aguardando proposta da sua empresa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <PackageSearch className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                <p>Nenhum pedido aberto no momento.</p>
              </div>
            ) : (
              recentOrders.slice(0, 3).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{order.title}</p>
                    <p className="text-xs text-slate-500">
                      {[order.vehicleBrand, order.vehicleModel, order.vehicleYear].filter(Boolean).join(" • ")}
                      {order.city ? ` • ${order.city}` : ""}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => onNavigate("orders")}>
                    Ver
                  </Button>
                </div>
              ))
            )}
            {recentOrders.length > 0 && (
              <Button variant="link" className="w-full text-primary mt-2" onClick={() => onNavigate("orders")}>
                Ver todos os {availableItemsCount} itens disponíveis <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <PackageSearch className="w-32 h-32" />
          </div>
          <CardHeader className="relative z-10">
            <CardTitle className="font-mono text-xl text-white">Minhas Negociações</CardTitle>
            <CardDescription className="text-slate-400">Últimas negociações em andamento.</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 space-y-3">
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
            ) : recentNegotiations.length === 0 ? (
              <p className="text-slate-400 text-sm">Nenhuma negociação ainda.</p>
            ) : (
              recentNegotiations.map((neg: any) => (
                <div key={neg.id} className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                  <div className="text-sm font-bold text-blue-400 mb-1">{neg.order?.title || "Pedido"}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300">{neg.client?.name || "Cliente"}</span>
                    <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[neg.status] || ""}`}>
                      {STATUS_LABELS[neg.status] || neg.status}
                    </Badge>
                  </div>
                </div>
              ))
            )}
            <Button
              variant="link"
              className="w-full text-slate-400 hover:text-white mt-2"
              onClick={() => onNavigate("negotiations")}
            >
              Ver todas as negociações <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
