import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MapPin, MessageCircle, Package, Truck, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const STATUS_LABELS: Record<string, string> = {
  negotiating: "Negociando",
  shipped: "Peça Enviada",
  delivered: "Entregue",
  completed: "Concluído",
};

const STATUS_COLORS: Record<string, string> = {
  negotiating: "bg-blue-100 text-blue-800 border-blue-200",
  shipped: "bg-orange-100 text-orange-800 border-orange-200",
  delivered: "bg-purple-100 text-purple-800 border-purple-200",
  completed: "bg-green-100 text-green-800 border-green-200",
};

export default function DesmancheNegotiationsTab() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("todos");
  const [trackingCode, setTrackingCode] = useState("");
  const [selectedNeg, setSelectedNeg] = useState<any>(null);
  const [shipDialogOpen, setShipDialogOpen] = useState(false);

  const { data: negotiations = [], isLoading } = useQuery({
    queryKey: ["/api/negotiations/my"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/negotiations/my");
      return res.json();
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, trackingCode }: { id: string; status: string; trackingCode?: string }) => {
      const res = await apiRequest("PATCH", `/api/negotiations/${id}/status`, { status, trackingCode });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err);
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Status atualizado!", description: "Negociação atualizada com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["/api/negotiations/my"] });
      setShipDialogOpen(false);
      setTrackingCode("");
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const filtered = activeTab === "todos"
    ? negotiations
    : negotiations.filter((n: any) => n.status === activeTab);

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
        <h1 className="text-3xl font-bold font-mono text-slate-900 tracking-tight">Minhas Negociações</h1>
        <p className="text-slate-500 mt-1">Acompanhe suas vendas desde o primeiro contato até a entrega.</p>
      </div>

      <Tabs defaultValue="todos" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto gap-2 bg-transparent p-0">
          <TabsTrigger value="todos" className="data-[state=active]:bg-primary data-[state=active]:text-white bg-slate-100 py-2">
            Todas ({negotiations.length})
          </TabsTrigger>
          <TabsTrigger value="negotiating" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white bg-slate-100 py-2">
            Negociando
          </TabsTrigger>
          <TabsTrigger value="shipped" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white bg-slate-100 py-2">
            Enviado
          </TabsTrigger>
          <TabsTrigger value="delivered" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white bg-slate-100 py-2">
            Entregue
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-green-600 data-[state=active]:text-white bg-slate-100 py-2">
            Concluído
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
              <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900">Nenhuma negociação nesta etapa</h3>
              <p className="text-slate-500">Você não tem negociações com este status no momento.</p>
            </div>
          ) : (
            filtered.map((neg: any) => (
              <Card key={neg.id} className="overflow-hidden bg-white border-slate-200 hover:shadow-md transition-shadow">
                <CardContent className="p-0 flex flex-col md:flex-row">
                  <div className="p-5 md:w-2/3 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-xs font-medium text-slate-400">
                        {neg.id.slice(0, 8).toUpperCase()}
                      </span>
                      <Badge variant="outline" className={`ml-auto md:ml-2 ${STATUS_COLORS[neg.status] || ""}`}>
                        {STATUS_LABELS[neg.status] || neg.status}
                      </Badge>
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 leading-tight mb-1">
                      {neg.order?.title || "Pedido"}
                    </h3>
                    <div className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-2">
                      <span className="font-semibold">{neg.client?.name || "Cliente"}</span>
                      {neg.order?.city && (
                        <>
                          <span className="text-slate-300">|</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {neg.order.city}{neg.order.state ? `, ${neg.order.state}` : ""}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="text-lg font-bold text-primary">
                      R$ {parseFloat(neg.price || "0").toFixed(2).replace(".", ",")}
                    </div>

                    {neg.trackingCode && (
                      <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                        <Truck className="h-3 w-3" /> Rastreio: {neg.trackingCode}
                      </div>
                    )}
                  </div>

                  <div className="p-5 md:w-1/3 flex flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-slate-100 bg-slate-50">
                    {neg.status === "negotiating" && (
                      <>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Aguardando resposta do cliente
                        </p>
                        {neg.proposal?.whatsappUnlocked && neg.client?.whatsapp && (
                          <a
                            href={`https://wa.me/55${neg.client.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white">
                              <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp do Cliente
                            </Button>
                          </a>
                        )}
                        <Dialog open={shipDialogOpen && selectedNeg?.id === neg.id} onOpenChange={(open) => {
                          setShipDialogOpen(open);
                          if (open) setSelectedNeg(neg);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full" onClick={() => setSelectedNeg(neg)}>
                              <Package className="mr-2 h-4 w-4" /> Registrar Envio
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Registrar Envio da Peça</DialogTitle>
                              <DialogDescription>
                                Informe o código de rastreio para o cliente acompanhar a entrega.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-2">
                              <div className="space-y-2">
                                <Label>Código de Rastreio</Label>
                                <Input
                                  placeholder="Ex: BR123456789BR"
                                  value={trackingCode}
                                  onChange={(e) => setTrackingCode(e.target.value)}
                                />
                              </div>
                              <Button
                                className="w-full bg-orange-500 hover:bg-orange-600"
                                onClick={() => updateStatusMutation.mutate({
                                  id: neg.id,
                                  status: "shipped",
                                  trackingCode,
                                })}
                                disabled={updateStatusMutation.isPending}
                              >
                                {updateStatusMutation.isPending ? (
                                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Confirmando...</>
                                ) : (
                                  <><Truck className="mr-2 h-4 w-4" /> Confirmar Envio</>
                                )}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}

                    {neg.status === "shipped" && (
                      <div className="bg-orange-50 text-orange-700 text-xs p-2 rounded flex flex-col gap-1">
                        <span className="font-semibold flex items-center gap-1">
                          <Truck className="h-3 w-3" /> Peça enviada
                        </span>
                        {neg.trackingCode && <span>Rastreio: {neg.trackingCode}</span>}
                        <span>Aguardando confirmação de entrega pelo cliente.</span>
                      </div>
                    )}

                    {neg.status === "delivered" && (
                      <div className="bg-purple-50 text-purple-700 text-xs p-2 rounded flex flex-col gap-1">
                        <span className="font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Entregue
                        </span>
                        <span>Aguardando avaliação do cliente.</span>
                      </div>
                    )}

                    {neg.status === "completed" && (
                      <div className="bg-green-50 text-green-700 text-xs p-2 rounded flex flex-col gap-1">
                        <span className="font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Venda concluída
                        </span>
                        <span className="text-sm font-medium text-slate-600 mt-1">
                          Valor liberado na sua carteira
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </Tabs>
    </div>
  );
}
