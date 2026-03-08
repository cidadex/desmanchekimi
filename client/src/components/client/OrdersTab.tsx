import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { getToken } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Car,
  MessageSquare,
  Loader2,
  Eye,
  X,
} from "lucide-react";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  open: { label: "Aberto", variant: "default" },
  negotiating: { label: "Negociando", variant: "secondary" },
  closed: { label: "Fechado", variant: "outline" },
  shipped: { label: "Enviado", variant: "secondary" },
  completed: { label: "Concluído", variant: "default" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

interface Order {
  id: string;
  title: string;
  description: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: number;
  vehiclePlate?: string;
  clientId: string;
  location: string;
  status: string;
  urgency: string;
  isPartnerRequest: boolean;
  createdAt: string;
  proposals?: any[];
}

export function OrdersTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState("all");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [vehicleBrand, setVehicleBrand] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");
  const [vehicleYear, setVehicleYear] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [location, setLocation] = useState("");
  const [urgency, setUrgency] = useState("normal");

  const token = getToken();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders/my"],
    queryFn: async () => {
      const res = await fetch("/api/orders/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro");
      return res.json();
    },
    enabled: !!token,
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/orders", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/my"] });
      setShowCreateDialog(false);
      resetForm();
      toast({ title: "Pedido criado!", description: "Seu pedido foi publicado no mural." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível criar o pedido.", variant: "destructive" });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest("PATCH", `/api/orders/${orderId}/status`, { status: "cancelled" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/my"] });
      toast({ title: "Pedido cancelado" });
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setVehicleBrand("");
    setVehicleModel("");
    setVehicleYear("");
    setVehiclePlate("");
    setLocation("");
    setUrgency("normal");
  };

  const handleCreate = () => {
    if (!user?.profileComplete) {
      toast({ title: "Complete seu perfil", description: "Preencha WhatsApp e endereço antes de criar pedidos.", variant: "destructive" });
      return;
    }
    if (!title || !description || !vehicleBrand || !vehicleModel || !vehicleYear || !location) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      title,
      description,
      vehicleBrand,
      vehicleModel,
      vehicleYear: parseInt(vehicleYear),
      vehiclePlate: vehiclePlate || undefined,
      location,
      urgency,
      isPartnerRequest: false,
    });
  };

  const filteredOrders = orders.filter((o) => {
    if (filter === "all") return true;
    return o.status === filter;
  });

  const formatDate = (d: string) => {
    const date = new Date(typeof d === 'number' ? (d as number) * 1000 : d);
    return date.toLocaleDateString("pt-BR");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Meus Pedidos</h2>
          <p className="text-sm text-muted-foreground">Gerencie seus pedidos de peças</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Pedido
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Pedido de Peça</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Título da Peça *</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Motor Completo Honda Civic" />
              </div>
              <div className="space-y-2">
                <Label>Descrição Detalhada *</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descreva a peça que precisa, condições aceitáveis, etc." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Marca *</Label>
                  <Input value={vehicleBrand} onChange={(e) => setVehicleBrand(e.target.value)} placeholder="Honda" />
                </div>
                <div className="space-y-2">
                  <Label>Modelo *</Label>
                  <Input value={vehicleModel} onChange={(e) => setVehicleModel(e.target.value)} placeholder="Civic" />
                </div>
                <div className="space-y-2">
                  <Label>Ano *</Label>
                  <Input type="number" value={vehicleYear} onChange={(e) => setVehicleYear(e.target.value)} placeholder="2020" />
                </div>
                <div className="space-y-2">
                  <Label>Placa (opcional)</Label>
                  <Input value={vehiclePlate} onChange={(e) => setVehiclePlate(e.target.value)} placeholder="ABC-1234" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Localização *</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="São Paulo - SP" />
              </div>
              <div className="space-y-2">
                <Label>Urgência</Label>
                <Select value={urgency} onValueChange={setUrgency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                Publicar Pedido
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: "Todos" },
          { key: "open", label: "Abertos" },
          { key: "negotiating", label: "Negociando" },
          { key: "completed", label: "Concluídos" },
          { key: "cancelled", label: "Cancelados" },
        ].map((f) => (
          <Button key={f.key} variant={filter === f.key ? "default" : "outline"} size="sm" onClick={() => setFilter(f.key)}>
            {f.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhum pedido encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">Crie seu primeiro pedido de peça clicando em "Novo Pedido"</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{order.title}</h3>
                      <Badge variant={statusLabels[order.status]?.variant || "outline"}>
                        {statusLabels[order.status]?.label || order.status}
                      </Badge>
                      {order.urgency === "urgent" && (
                        <Badge variant="destructive">Urgente</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Car className="h-3 w-3" />
                        {order.vehicleBrand} {order.vehicleModel} {order.vehicleYear}
                      </span>
                      <span>{order.location}</span>
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                    <p className="text-sm mt-2 line-clamp-2">{order.description}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-sm flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        {order.proposals?.length || 0} proposta(s) recebida(s)
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                      <Eye className="h-4 w-4 mr-1" /> Ver
                    </Button>
                    {order.status === "open" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => cancelMutation.mutate(order.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedOrder?.title}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Badge variant={statusLabels[selectedOrder.status]?.variant || "outline"}>
                  {statusLabels[selectedOrder.status]?.label}
                </Badge>
                {selectedOrder.urgency === "urgent" && <Badge variant="destructive">Urgente</Badge>}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Veículo</p>
                <p>{selectedOrder.vehicleBrand} {selectedOrder.vehicleModel} {selectedOrder.vehicleYear}</p>
                {selectedOrder.vehiclePlate && <p className="text-sm text-muted-foreground">Placa: {selectedOrder.vehiclePlate}</p>}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Localização</p>
                <p>{selectedOrder.location}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Descrição</p>
                <p className="text-sm">{selectedOrder.description}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Propostas Recebidas ({selectedOrder.proposals?.length || 0})
                </p>
                {selectedOrder.proposals && selectedOrder.proposals.length > 0 ? (
                  <div className="space-y-3">
                    {selectedOrder.proposals.map((p: any) => (
                      <Card key={p.id}>
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-medium">{p.desmanche?.tradingName || "Desmanche"}</p>
                              <p className="text-sm text-muted-foreground">{p.message}</p>
                              <p className="font-bold text-green-600 mt-1">R$ {p.price?.toFixed(2)}</p>
                            </div>
                            <Badge variant={p.status === "sent" ? "outline" : p.status === "accepted" ? "default" : "destructive"}>
                              {p.status === "sent" ? "Enviada" : p.status === "accepted" ? "Aceita" : p.status === "rejected" ? "Rejeitada" : p.status}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Nenhuma proposta recebida ainda.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
