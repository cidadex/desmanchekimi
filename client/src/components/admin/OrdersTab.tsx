import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PackageSearch, Clock, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const orders = [
  { id: "PED-9923", item: "Motor AP 1.8 Completo", vehicle: "VW Gol 1994", buyer: "Roberto Almeida", location: "Curitiba, PR", status: "Propostas Abertas", time: "Há 15 min", offers: 4 },
  { id: "PED-9922", item: "Farol Direito Full LED", vehicle: "Audi A3 2020", buyer: "Mariana Costa", location: "Belo Horizonte, MG", status: "Em Negociação", time: "Há 2 horas", offers: 2 },
  { id: "PED-9921", item: "Caixa de Câmbio Automática", vehicle: "Honda Civic 2018", buyer: "Carlos Eduardo", location: "São Paulo, SP", status: "Fechado", time: "Hoje", offers: 7 },
  { id: "PED-9920", item: "Módulo de Injeção ECU", vehicle: "Ford Civic 2015", buyer: "Ana Silva", location: "Rio de Janeiro, RJ", status: "Propostas Abertas", time: "Ontem", offers: 0 },
];

export default function OrdersTab() {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tight">Anúncios & Pedidos de Peças</h1>
          <p className="text-muted-foreground">Monitoramento do fluxo de necessidades na plataforma.</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Badge variant="default" className="text-sm py-1 px-3 bg-primary">Todos</Badge>
        <Badge variant="outline" className="text-sm py-1 px-3">Propostas Abertas (142)</Badge>
        <Badge variant="outline" className="text-sm py-1 px-3">Em Negociação (58)</Badge>
        <Badge variant="outline" className="text-sm py-1 px-3">Fechados (1.024)</Badge>
      </div>

      <div className="relative w-full max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por peça, veículo ou ID do pedido..." className="pl-9" />
      </div>

      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="overflow-hidden hover:border-primary/40 transition-all cursor-pointer">
            <CardContent className="p-0 sm:flex items-center">
              <div className="bg-muted/50 p-4 sm:p-6 sm:w-1/4 flex flex-col justify-center border-r">
                <span className="font-mono text-xs text-muted-foreground mb-1">{order.id}</span>
                <span className="font-bold text-lg leading-tight">{order.item}</span>
                <Badge variant="secondary" className="w-fit mt-2">{order.vehicle}</Badge>
              </div>
              
              <div className="p-4 sm:p-6 flex-1 grid sm:grid-cols-3 gap-4 items-center">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Destino
                  </div>
                  <div className="font-medium text-sm">{order.location}</div>
                  <div className="text-xs text-muted-foreground">{order.buyer}</div>
                </div>
                
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground flex items-center gap-1">
                    <PackageSearch className="h-3 w-3" /> Propostas de Desmanches
                  </div>
                  <div className="font-bold text-lg text-primary">{order.offers} <span className="text-sm font-normal text-muted-foreground">ofertas</span></div>
                </div>

                <div className="flex flex-col items-start sm:items-end gap-2">
                  <Badge className={
                    order.status === 'Propostas Abertas' ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20' : 
                    order.status === 'Em Negociação' ? 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20' : 
                    'bg-slate-500/10 text-slate-600 hover:bg-slate-500/20'
                  } variant="outline">
                    {order.status}
                  </Badge>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {order.time}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="flex justify-center mt-6">
        <Button variant="outline">Carregar Mais Pedidos</Button>
      </div>
    </div>
  );
}