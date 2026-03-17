import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  MapPin, Search, Loader2, PackageSearch, SendHorizonal,
  Car, Wrench, Clock, AlertTriangle, Eye, ChevronRight, ImageIcon, User2, Hash,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { getToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  car: "Carro", motorcycle: "Moto", truck: "Caminhão", bus: "Ônibus",
  van: "Van/Utilitário", boat: "Barco/Lancha", airplane: "Avião",
  helicopter: "Helicóptero", bicycle: "Bicicleta/E-bike",
  agricultural: "Trator/Agrícola", other: "Outro",
};

const CONDITION_LABELS: Record<string, string> = {
  new: "Nova", "used-excellent": "Usada - Ótimo Estado", "used-good": "Usada - Bom Estado", any: "Qualquer condição",
};

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diffMin < 1) return "Agora";
  if (diffMin < 60) return `Há ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Há ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Ontem";
  return `Há ${diffDays} dias`;
}

export default function DesmancheOrdersTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [proposalForm, setProposalForm] = useState({ price: "", message: "" });
  const [showProposalForm, setShowProposalForm] = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/orders?status=open");
      return res.json();
    },
    enabled: !!getToken(),
    refetchInterval: 30 * 1000,
    staleTime: 0,
  });

  const { data: myProposals = [] } = useQuery({
    queryKey: ["/api/proposals/my"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/proposals?desmancheId=${user?.id}`);
      return res.json();
    },
    enabled: !!user?.id,
  });

  const proposedOrderIds = new Set(myProposals.map((p: any) => p.orderId));

  const sendProposalMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/proposals", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Proposta enviada!", description: "O cliente será notificado da sua proposta." });
      queryClient.invalidateQueries({ queryKey: ["/api/proposals/my"] });
      setShowProposalForm(false);
      setProposalForm({ price: "", message: "" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao enviar proposta", description: error.message, variant: "destructive" });
    },
  });

  const handleSendProposal = async () => {
    if (!selectedOrder || !user?.id) return;
    await sendProposalMutation.mutateAsync({
      orderId: selectedOrder.id,
      desmancheId: user.id,
      price: parseFloat(proposalForm.price),
      message: proposalForm.message,
    });
  };

  const filtered = orders.filter((o: any) => {
    if (o.desmancheId === user?.id) return false;
    return (
      !search ||
      o.title?.toLowerCase().includes(search.toLowerCase()) ||
      o.vehicleBrand?.toLowerCase().includes(search.toLowerCase()) ||
      o.vehicleModel?.toLowerCase().includes(search.toLowerCase()) ||
      o.partName?.toLowerCase().includes(search.toLowerCase()) ||
      o.partCategory?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const openDetail = (order: any) => {
    setSelectedOrder(order);
    setShowProposalForm(false);
    setProposalForm({ price: "", message: "" });
  };

  const alreadySentForSelected = selectedOrder ? proposedOrderIds.has(selectedOrder.id) : false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div>
        <h1 className="text-3xl font-bold font-mono text-slate-900 tracking-tight">Mural de Pedidos</h1>
        <p className="text-slate-500 mt-1">Veja o que clientes estão procurando e envie sua proposta.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por peça, marca, modelo..."
            className="pl-9 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="text-sm text-slate-500 shrink-0">
          {filtered.length} pedido{filtered.length !== 1 ? "s" : ""} disponível{filtered.length !== 1 ? "is" : ""}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-slate-200">
          <PackageSearch className="h-16 w-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Nenhum pedido aberto no momento</h3>
          <p className="text-slate-500">Novos pedidos aparecerão aqui assim que forem criados.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((order: any) => {
            const alreadySent = proposedOrderIds.has(order.id);
            const vehicle = [
              VEHICLE_TYPE_LABELS[order.vehicleType] || order.vehicleType,
              order.vehicleBrand,
              order.vehicleModel,
              order.vehicleYear,
            ].filter(Boolean).join(" • ");
            const location = order.city
              ? `${order.city}${order.state ? `, ${order.state}` : ""}`
              : order.location || "Não informado";

            return (
              <Card
                key={order.id}
                className="overflow-hidden hover:shadow-md hover:border-primary/30 transition-all border-slate-200 bg-white cursor-pointer"
                onClick={() => openDetail(order)}
              >
                <CardContent className="p-0 sm:flex">
                  <div className="p-5 sm:w-2/3 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="font-mono text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                      {order.postedByType === "desmanche" && (
                        <Badge className="bg-amber-500 hover:bg-amber-600 text-[10px] py-0 px-2">
                          Parceiro
                        </Badge>
                      )}
                      {order.urgency === "urgent" && (
                        <Badge className="bg-red-500 hover:bg-red-600 text-[10px] py-0 px-2 gap-1">
                          <AlertTriangle className="h-3 w-3" /> URGENTE
                        </Badge>
                      )}
                      {alreadySent && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                          ✓ Proposta Enviada
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 leading-tight mb-1">{order.title}</h3>

                    {vehicle && (
                      <div className="flex items-center gap-1.5 text-sm text-slate-600 mb-2">
                        <Car className="h-4 w-4 text-slate-400" />
                        {vehicle}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {order.partCategory && (
                        <Badge variant="secondary" className="text-xs">{order.partCategory}</Badge>
                      )}
                      {order.partConditionAccepted && order.partConditionAccepted !== "any" && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          {CONDITION_LABELS[order.partConditionAccepted] || order.partConditionAccepted}
                        </Badge>
                      )}
                      {order.images?.length > 0 && (
                        <Badge variant="outline" className="text-xs gap-1">
                          <ImageIcon className="h-3 w-3" /> {order.images.length} foto{order.images.length !== 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" /> {timeAgo(order.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 sm:w-1/3 flex flex-col justify-center items-start sm:items-end gap-3 border-t sm:border-t-0 sm:border-l border-slate-100 bg-slate-50">
                    <div className="text-center sm:text-right">
                      <div className="text-2xl font-bold text-primary">{order.proposals?.length || 0}</div>
                      <div className="text-xs text-slate-500">proposta{(order.proposals?.length || 0) !== 1 ? "s" : ""} enviada{(order.proposals?.length || 0) !== 1 ? "s" : ""}</div>
                    </div>
                    <Button
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white gap-2"
                      onClick={(e) => { e.stopPropagation(); openDetail(order); }}
                    >
                      <Eye className="h-4 w-4" />
                      Ver Pedido Completo
                      <ChevronRight className="h-4 w-4 ml-auto" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => { if (!open) { setSelectedOrder(null); setShowProposalForm(false); setProposalForm({ price: "", message: "" }); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedOrder && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="font-mono text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                    #{selectedOrder.id.slice(0, 8).toUpperCase()}
                  </span>
                  {selectedOrder.postedByType === "desmanche" && (
                    <Badge className="bg-amber-500 text-xs">Parceiro</Badge>
                  )}
                  {selectedOrder.urgency === "urgent" && (
                    <Badge className="bg-red-500 text-xs gap-1">
                      <AlertTriangle className="h-3 w-3" /> URGENTE
                    </Badge>
                  )}
                  {alreadySentForSelected && (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                      ✓ Proposta já enviada
                    </Badge>
                  )}
                </div>
                <DialogTitle className="text-2xl">{selectedOrder.title}</DialogTitle>
                {selectedOrder.description && selectedOrder.description !== selectedOrder.title && (
                  <DialogDescription className="text-slate-600 text-sm mt-1">
                    {selectedOrder.description}
                  </DialogDescription>
                )}
              </DialogHeader>

              <div className="space-y-5 mt-2">
                {/* Vehicle Info */}
                <div className="bg-slate-50 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-slate-700 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <Car className="h-4 w-4" /> Dados do Veículo
                  </h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                    {selectedOrder.vehicleType && (
                      <div><span className="text-slate-500">Tipo:</span> <span className="font-medium">{VEHICLE_TYPE_LABELS[selectedOrder.vehicleType] || selectedOrder.vehicleType}</span></div>
                    )}
                    {selectedOrder.vehicleBrand && (
                      <div><span className="text-slate-500">Marca:</span> <span className="font-medium">{selectedOrder.vehicleBrand}</span></div>
                    )}
                    {selectedOrder.vehicleModel && (
                      <div><span className="text-slate-500">Modelo:</span> <span className="font-medium">{selectedOrder.vehicleModel}</span></div>
                    )}
                    {selectedOrder.vehicleYear && (
                      <div><span className="text-slate-500">Ano:</span> <span className="font-medium">{selectedOrder.vehicleYear}</span></div>
                    )}
                    {selectedOrder.vehicleColor && (
                      <div><span className="text-slate-500">Cor:</span> <span className="font-medium">{selectedOrder.vehicleColor}</span></div>
                    )}
                    {selectedOrder.vehicleEngine && (
                      <div><span className="text-slate-500">Motor:</span> <span className="font-medium">{selectedOrder.vehicleEngine}</span></div>
                    )}
                    {selectedOrder.vehiclePlate && (
                      <div><span className="text-slate-500">Placa:</span> <span className="font-medium">{selectedOrder.vehiclePlate}</span></div>
                    )}
                  </div>
                </div>

                {/* Part Info */}
                <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-blue-800 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <Wrench className="h-4 w-4" /> Peça Solicitada
                  </h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                    {selectedOrder.partCategory && (
                      <div><span className="text-slate-500">Categoria:</span> <span className="font-medium">{selectedOrder.partCategory}</span></div>
                    )}
                    {selectedOrder.partName && (
                      <div><span className="text-slate-500">Peça:</span> <span className="font-medium">{selectedOrder.partName}</span></div>
                    )}
                    {selectedOrder.partPosition && (
                      <div><span className="text-slate-500">Posição:</span> <span className="font-medium">{selectedOrder.partPosition}</span></div>
                    )}
                    {selectedOrder.partConditionAccepted && (
                      <div><span className="text-slate-500">Condição aceita:</span> <span className="font-medium">{CONDITION_LABELS[selectedOrder.partConditionAccepted] || selectedOrder.partConditionAccepted}</span></div>
                    )}
                  </div>
                </div>

                {/* Photos */}
                {selectedOrder.images?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-slate-700 flex items-center gap-2 text-sm uppercase tracking-wide">
                      <ImageIcon className="h-4 w-4" /> Fotos do Cliente ({selectedOrder.images.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedOrder.images.map((img: any) => (
                        <a key={img.id} href={img.url} target="_blank" rel="noreferrer">
                          <img
                            src={img.url}
                            alt="foto do pedido"
                            className="h-24 w-24 rounded-lg object-cover border border-slate-200 hover:opacity-90 hover:scale-105 transition-all"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Client Info (masked) */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                  <h4 className="font-semibold text-amber-800 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <User2 className="h-4 w-4" /> Informações do Cliente
                  </h4>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                    <div>
                      <span className="text-slate-500">Nome:</span>{" "}
                      <span className="font-medium">
                        {selectedOrder.client?.name
                          ? selectedOrder.client.name.split(" ")[0]
                          : "Cliente verificado"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Localização:</span>{" "}
                      <span className="font-medium">
                        {selectedOrder.city
                          ? `${selectedOrder.city}${selectedOrder.state ? `, ${selectedOrder.state}` : ""}`
                          : selectedOrder.location || "Não informado"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Pedido em:</span>{" "}
                      <span className="font-medium">{timeAgo(selectedOrder.createdAt)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">Propostas recebidas:</span>{" "}
                      <span className="font-medium">{selectedOrder.proposals?.length || 0}</span>
                    </div>
                  </div>
                  <p className="text-xs text-amber-700 mt-2 bg-amber-100 rounded px-2 py-1">
                    🔒 Contato completo (telefone e WhatsApp) é liberado após o cliente aceitar sua proposta.
                  </p>
                </div>

                <Separator />

                {/* Proposal Form or Already Sent */}
                {alreadySentForSelected ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <div className="text-green-700 font-semibold mb-1">✓ Proposta já enviada para este pedido</div>
                    <p className="text-sm text-green-600">Aguarde o cliente revisar as propostas recebidas.</p>
                  </div>
                ) : !showProposalForm ? (
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-white gap-2 h-12 text-base"
                    onClick={() => setShowProposalForm(true)}
                  >
                    <SendHorizonal className="h-5 w-5" />
                    Enviar Proposta para este Pedido
                  </Button>
                ) : (
                  <div className="space-y-4 bg-slate-50 rounded-lg p-4 border border-slate-200">
                    <h4 className="font-semibold text-slate-800 flex items-center gap-2">
                      <SendHorizonal className="h-4 w-4 text-primary" /> Sua Proposta
                    </h4>
                    <div className="space-y-2">
                      <Label htmlFor="prop-price">Valor da peça (R$) <span className="text-red-500">*</span></Label>
                      <Input
                        id="prop-price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Ex: 350,00"
                        value={proposalForm.price}
                        onChange={(e) => setProposalForm({ ...proposalForm, price: e.target.value })}
                        className="bg-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prop-msg">Mensagem para o cliente <span className="text-red-500">*</span></Label>
                      <textarea
                        id="prop-msg"
                        className="w-full border border-input rounded-md px-3 py-2 text-sm min-h-[110px] resize-none focus:outline-none focus:ring-2 focus:ring-ring bg-white"
                        placeholder="Descreva a condição da peça, procedência, garantia, prazo de envio, se tem foto disponível..."
                        value={proposalForm.message}
                        onChange={(e) => setProposalForm({ ...proposalForm, message: e.target.value })}
                      />
                      <p className="text-xs text-slate-500">Após o cliente aceitar sua proposta, você poderá continuar a negociação e trocar contatos pelo WhatsApp.</p>
                    </div>
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => { setShowProposalForm(false); setProposalForm({ price: "", message: "" }); }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        className="flex-1 bg-primary hover:bg-primary/90 gap-2"
                        onClick={handleSendProposal}
                        disabled={!proposalForm.price || !proposalForm.message || sendProposalMutation.isPending}
                      >
                        {sendProposalMutation.isPending ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</>
                        ) : (
                          <><SendHorizonal className="h-4 w-4" /> Confirmar e Enviar</>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
