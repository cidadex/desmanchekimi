import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { MapPin, Search, Loader2, PackageSearch, SendHorizonal } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

export default function DesmancheOrdersTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [proposalForm, setProposalForm] = useState({ price: "", message: "" });
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/orders?status=open");
      return res.json();
    },
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
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Proposta enviada!", description: "Sua proposta foi enviada com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["/api/proposals/my"] });
      setDialogOpen(false);
      setProposalForm({ price: "", message: "" });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
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

  const filtered = orders.filter((o: any) =>
    !search ||
    o.title?.toLowerCase().includes(search.toLowerCase()) ||
    o.vehicleBrand?.toLowerCase().includes(search.toLowerCase()) ||
    o.vehicleModel?.toLowerCase().includes(search.toLowerCase())
  );

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
        <p className="text-slate-500 mt-1">Veja o que clientes finais estão procurando agora.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por peça ou modelo de carro..."
            className="pl-9 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="text-sm text-slate-500">
          {filtered.length} pedido{filtered.length !== 1 ? "s" : ""} disponível{filtered.length !== 1 ? "is" : ""}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg border border-slate-200">
          <PackageSearch className="h-16 w-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-700 mb-2">Nenhum pedido aberto no momento</h3>
          <p className="text-slate-500">Novos pedidos de clientes aparecerão aqui assim que forem criados.</p>
        </div>
      ) : (
        <div className="grid gap-4 mt-6">
          {filtered.map((order: any) => {
            const alreadySent = proposedOrderIds.has(order.id);
            return (
              <Card
                key={order.id}
                className="overflow-hidden transition-all hover:shadow-md border-slate-200 bg-white"
              >
                <CardContent className="p-0 sm:flex">
                  <div className="p-5 sm:w-2/3 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-xs font-medium text-slate-400">
                        {order.id.slice(0, 8).toUpperCase()}
                      </span>
                      {order.urgency === "urgent" && (
                        <Badge className="bg-red-500 hover:bg-red-600 text-[10px] py-0 px-2">URGENTE</Badge>
                      )}
                      {alreadySent && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px]">
                          Proposta Enviada
                        </Badge>
                      )}
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 leading-tight mb-1">{order.title}</h3>
                    <div className="text-sm font-medium text-slate-600 mb-2">
                      {[order.vehicleBrand, order.vehicleModel, order.vehicleYear].filter(Boolean).join(" • ")}
                      {order.vehicleColor && <span className="text-slate-400"> · {order.vehicleColor}</span>}
                      {order.vehicleEngine && <span className="text-slate-400"> · {order.vehicleEngine}</span>}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {order.partCategory && (
                        <Badge variant="secondary" className="text-xs">{order.partCategory}</Badge>
                      )}
                      {order.partPosition && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">{order.partPosition}</Badge>
                      )}
                      {order.partConditionAccepted && order.partConditionAccepted !== "any" && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          {{ new: "Nova", "used-excellent": "Usada Ótimo", "used-good": "Usada Bom", any: "Qualquer" }[order.partConditionAccepted as string] || order.partConditionAccepted}
                        </Badge>
                      )}
                      {order.images?.length > 0 && (
                        <Badge variant="outline" className="text-xs">📷 {order.images.length} foto(s)</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-2">
                      {order.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <strong className="text-slate-700">{order.city}{order.state ? `, ${order.state}` : ""}</strong>
                        </span>
                      )}
                      {!order.city && order.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <strong className="text-slate-700">{order.location}</strong>
                        </span>
                      )}
                    </div>

                    {order.images?.length > 0 && (
                      <div className="flex gap-1.5 mb-3">
                        {order.images.slice(0, 4).map((img: any) => (
                          <a key={img.id} href={img.url} target="_blank" rel="noreferrer">
                            <img src={img.url} alt="" className="h-12 w-12 rounded-md object-cover border hover:opacity-90 transition-opacity" />
                          </a>
                        ))}
                        {order.images.length > 4 && (
                          <div className="h-12 w-12 rounded-md border bg-slate-100 flex items-center justify-center text-xs text-slate-500 font-medium">
                            +{order.images.length - 4}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="text-sm font-medium text-slate-500 bg-slate-100 w-fit px-2 py-1 rounded-md">
                      {order.proposals?.length === 0
                        ? "Seja o primeiro a enviar proposta"
                        : `${order.proposals?.length || 0} desmanche${(order.proposals?.length || 0) !== 1 ? "s" : ""} já entraram em contato`}
                    </div>
                  </div>

                  <div className="p-5 sm:w-1/3 flex flex-col justify-center items-start sm:items-end border-t sm:border-t-0 sm:border-l border-slate-100 bg-slate-50">
                    <Dialog open={dialogOpen && selectedOrder?.id === order.id} onOpenChange={(open) => {
                      setDialogOpen(open);
                      if (open) setSelectedOrder(order);
                    }}>
                      <DialogTrigger asChild>
                        <Button
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white"
                          disabled={alreadySent}
                          onClick={() => setSelectedOrder(order)}
                        >
                          <SendHorizonal className="mr-2 h-4 w-4" />
                          {alreadySent ? "Proposta Enviada" : "Enviar Proposta"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[480px]">
                        <DialogHeader>
                          <DialogTitle>Enviar Proposta</DialogTitle>
                          <DialogDescription>
                            Pedido: {order.title}
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-2">
                          <div className="space-y-2">
                            <Label>Seu preço (R$)</Label>
                            <Input
                              type="number"
                              placeholder="Ex: 350.00"
                              value={proposalForm.price}
                              onChange={(e) => setProposalForm({ ...proposalForm, price: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Mensagem para o cliente</Label>
                            <textarea
                              className="w-full border border-input rounded-md px-3 py-2 text-sm min-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                              placeholder="Descreva a condição da peça, garantia, prazo de envio..."
                              value={proposalForm.message}
                              onChange={(e) => setProposalForm({ ...proposalForm, message: e.target.value })}
                            />
                          </div>
                          <Button
                            className="w-full"
                            onClick={handleSendProposal}
                            disabled={!proposalForm.price || sendProposalMutation.isPending}
                          >
                            {sendProposalMutation.isPending ? (
                              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>
                            ) : (
                              <><SendHorizonal className="mr-2 h-4 w-4" /> Confirmar Proposta</>
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
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
