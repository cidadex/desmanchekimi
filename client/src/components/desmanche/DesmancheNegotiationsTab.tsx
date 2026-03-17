import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Package, Truck, CheckCircle2, Clock, Loader2, Car, MapPin,
  SendHorizonal, XCircle, MessageSquare, ShieldAlert,
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { getToken } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

const NEGOTIATION_STATUS: Record<string, { label: string; color: string; icon: any }> = {
  negotiating: { label: "Negociando", color: "bg-blue-100 text-blue-800 border-blue-200", icon: MessageSquare },
  shipped: { label: "Peça Enviada", color: "bg-orange-100 text-orange-800 border-orange-200", icon: Truck },
  awaiting_review: { label: "Aguard. Avaliação", color: "bg-purple-100 text-purple-800 border-purple-200", icon: Package },
  delivered: { label: "Entregue", color: "bg-purple-100 text-purple-800 border-purple-200", icon: Package },
  completed: { label: "Concluído", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
};

const PROPOSAL_STATUS: Record<string, { label: string; color: string }> = {
  sent: { label: "Aguardando Resposta", color: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  accepted: { label: "Aceita ✓", color: "bg-green-100 text-green-800 border-green-200" },
  rejected: { label: "Recusada", color: "bg-red-100 text-red-800 border-red-200" },
};

function timeAgo(dateStr: string | number): string {
  const now = new Date();
  const date = typeof dateStr === "number" ? new Date(dateStr * 1000) : new Date(dateStr);
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diffMin < 1) return "Agora";
  if (diffMin < 60) return `Há ${diffMin} min`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `Há ${h}h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "Ontem" : `Há ${d} dias`;
}

export default function DesmancheNegotiationsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [shipDialog, setShipDialog] = useState<any>(null);
  const [trackingCode, setTrackingCode] = useState("");

  const { data: blockStatus } = useQuery<{ isBlocked: boolean; overdueCount: number }>({
    queryKey: ["/api/desmanche/review-block-status"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/desmanche/review-block-status");
      return res.json();
    },
    enabled: !!getToken(),
    refetchInterval: 60 * 1000,
  });

  const { data: proposals = [], isLoading: loadingProposals } = useQuery({
    queryKey: ["/api/proposals/my-sent"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/proposals?desmancheId=${user?.id}`);
      return res.json();
    },
    enabled: !!user?.id && !!getToken(),
    staleTime: 0,
    refetchInterval: 30 * 1000,
  });

  const { data: negotiations = [], isLoading: loadingNeg } = useQuery({
    queryKey: ["/api/negotiations/my"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/negotiations/my");
      return res.json();
    },
    enabled: !!getToken(),
    staleTime: 0,
    refetchInterval: 30 * 1000,
  });

  const updateNegMutation = useMutation({
    mutationFn: async ({ id, status, trackingCode }: { id: string; status: string; trackingCode?: string }) => {
      if (status === "shipped") {
        const res = await apiRequest("PATCH", `/api/negotiations/${id}/ship`, { trackingCode });
        return res.json();
      }
      const res = await apiRequest("PATCH", `/api/negotiations/${id}/status`, { status, trackingCode });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Status atualizado!", description: "Negociação atualizada com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["/api/negotiations/my"] });
      setShipDialog(null);
      setTrackingCode("");
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const pendingProposals = proposals.filter((p: any) => p.status === "sent");
  const answeredProposals = proposals.filter((p: any) => p.status !== "sent");
  const activeNeg = negotiations.filter((n: any) => !["completed", "cancelled"].includes(n.status));
  const finishedNeg = negotiations.filter((n: any) => ["completed", "cancelled"].includes(n.status));

  const isLoading = loadingProposals || loadingNeg;

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
        <p className="text-slate-500 mt-1">Acompanhe propostas enviadas e negociações em andamento.</p>
      </div>

      {blockStatus?.isBlocked && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 flex items-start gap-3">
          <ShieldAlert className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-800">Envio de propostas bloqueado</p>
            <p className="text-sm text-red-700 mt-1">
              Você tem {blockStatus.overdueCount} avaliação(ões) do cliente atrasada(s). Aguarde o cliente avaliar as negociações pendentes.
            </p>
          </div>
        </div>
      )}

      <Tabs defaultValue="propostas" className="w-full">
        <TabsList className="grid grid-cols-3 h-auto gap-2 bg-transparent p-0 mb-6">
          <TabsTrigger
            value="propostas"
            className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white bg-slate-100 py-2"
          >
            Propostas Enviadas
            {pendingProposals.length > 0 && (
              <span className="ml-1.5 bg-yellow-600 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {pendingProposals.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="andamento"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white bg-slate-100 py-2"
          >
            Em Andamento
            {activeNeg.length > 0 && (
              <span className="ml-1.5 bg-blue-700 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {activeNeg.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="historico"
            className="data-[state=active]:bg-slate-600 data-[state=active]:text-white bg-slate-100 py-2"
          >
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* ── PROPOSTAS ENVIADAS ─────────────────────────────── */}
        <TabsContent value="propostas" className="space-y-4 mt-0">
          {proposals.length === 0 ? (
            <EmptyState
              icon={<SendHorizonal className="h-12 w-12 text-slate-300" />}
              title="Nenhuma proposta enviada ainda"
              desc="Acesse o Mural de Pedidos para encontrar oportunidades e enviar propostas."
            />
          ) : (
            <>
              {pendingProposals.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                    Aguardando Resposta ({pendingProposals.length})
                  </h3>
                  {pendingProposals.map((p: any) => (
                    <ProposalCard key={p.id} proposal={p} />
                  ))}
                </div>
              )}
              {answeredProposals.length > 0 && (
                <div className="space-y-3 mt-4">
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide">
                    Respondidas ({answeredProposals.length})
                  </h3>
                  {answeredProposals.map((p: any) => (
                    <ProposalCard key={p.id} proposal={p} />
                  ))}
                </div>
              )}
            </>
          )}
        </TabsContent>

        {/* ── EM ANDAMENTO ───────────────────────────────────── */}
        <TabsContent value="andamento" className="space-y-4 mt-0">
          {activeNeg.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="h-12 w-12 text-slate-300" />}
              title="Nenhuma negociação ativa"
              desc="Quando um cliente aceitar sua proposta, a negociação aparece aqui."
            />
          ) : (
            activeNeg.map((neg: any) => (
              <NegotiationCard
                key={neg.id}
                neg={neg}
                onShip={() => { setShipDialog(neg); setTrackingCode(""); }}
                onUpdateStatus={(status) => updateNegMutation.mutate({ id: neg.id, status })}
                isPending={updateNegMutation.isPending}
              />
            ))
          )}
        </TabsContent>

        {/* ── HISTÓRICO ──────────────────────────────────────── */}
        <TabsContent value="historico" className="space-y-4 mt-0">
          {finishedNeg.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-12 w-12 text-slate-300" />}
              title="Sem histórico ainda"
              desc="Negociações concluídas ou canceladas aparecem aqui."
            />
          ) : (
            finishedNeg.map((neg: any) => (
              <NegotiationCard
                key={neg.id}
                neg={neg}
                readonly
                isPending={false}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* ── Ship Dialog ──────────────────────────────────────── */}
      <Dialog
        open={!!shipDialog}
        onOpenChange={(o) => { if (!o) { setShipDialog(null); setTrackingCode(""); } }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Envio da Peça</DialogTitle>
            <DialogDescription>
              Informe o código de rastreamento para que o cliente possa acompanhar a entrega.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-slate-50 rounded-lg p-3 text-sm">
              <span className="text-slate-500">Pedido:</span>{" "}
              <span className="font-semibold">{shipDialog?.order?.title}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tracking">Código de Rastreamento (opcional)</Label>
              <Input
                id="tracking"
                placeholder="Ex: BR123456789AA"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
              />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setShipDialog(null)}>
                Cancelar
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={() =>
                  updateNegMutation.mutate({
                    id: shipDialog.id,
                    status: "shipped",
                    trackingCode: trackingCode || undefined,
                  })
                }
                disabled={updateNegMutation.isPending}
              >
                {updateNegMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Truck className="h-4 w-4" />
                )}
                Confirmar Envio
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProposalCard({ proposal }: { proposal: any }) {
  const status = PROPOSAL_STATUS[proposal.status] || { label: proposal.status, color: "bg-slate-100 text-slate-700" };
  const order = proposal.order;

  return (
    <Card className="border-slate-200 hover:border-primary/30 transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className={`text-xs ${status.color}`}>{status.label}</Badge>
              <span className="font-mono text-xs text-slate-400">{timeAgo(proposal.createdAt)}</span>
            </div>
            <h3 className="font-semibold text-slate-800 truncate">{order?.title || "Pedido"}</h3>
            {order && (
              <div className="text-sm text-slate-500 flex items-center gap-1 mt-0.5">
                <Car className="h-3.5 w-3.5 shrink-0" />
                {[order.vehicleBrand, order.vehicleModel, order.vehicleYear].filter(Boolean).join(" • ")}
              </div>
            )}
            <div className="mt-2 bg-slate-50 rounded p-2 text-sm text-slate-600 border border-slate-100">
              <p className="text-xs text-slate-400 mb-0.5">Sua mensagem:</p>
              {proposal.message}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-primary">R$ {Number(proposal.price).toFixed(2)}</div>
            <div className="text-xs text-slate-400">valor proposto</div>
          </div>
        </div>

        {proposal.status === "sent" && (
          <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-2 text-xs text-yellow-700 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0" />
            O cliente ainda não respondeu. Você será notificado quando houver uma resposta.
          </div>
        )}
        {proposal.status === "rejected" && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 flex items-center gap-2">
            <XCircle className="h-3.5 w-3.5 shrink-0" />
            O cliente recusou esta proposta.
          </div>
        )}
        {proposal.status === "accepted" && (
          <div className="mt-3 bg-green-50 border border-green-200 rounded p-2 text-xs text-green-700 flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
            Proposta aceita! A negociação está na aba "Em Andamento".
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NegotiationCard({
  neg,
  onShip,
  onUpdateStatus,
  isPending,
  readonly = false,
}: {
  neg: any;
  onShip?: () => void;
  onUpdateStatus?: (status: string) => void;
  isPending: boolean;
  readonly?: boolean;
}) {
  const st = NEGOTIATION_STATUS[neg.status] || {
    label: neg.status,
    color: "bg-slate-100 text-slate-700",
    icon: Package,
  };
  const StIcon = st.icon;

  return (
    <Card className={`border-slate-200 transition-all ${readonly ? "opacity-75" : "hover:border-primary/30"}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className={`text-xs gap-1 ${st.color}`}>
                <StIcon className="h-3 w-3" /> {st.label}
              </Badge>
              <span className="font-mono text-xs text-slate-400">{timeAgo(neg.createdAt)}</span>
            </div>
            <h3 className="font-semibold text-slate-800">{neg.order?.title || "Negociação"}</h3>
            {neg.order && (
              <div className="text-sm text-slate-500 flex items-center gap-1">
                <Car className="h-3.5 w-3.5" />
                {[neg.order.vehicleBrand, neg.order.vehicleModel, neg.order.vehicleYear].filter(Boolean).join(" • ")}
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-primary">R$ {Number(neg.price).toFixed(2)}</div>
            <div className="text-xs text-slate-400">valor acordado</div>
          </div>
        </div>

        {neg.client && (
          <div className="bg-slate-50 rounded p-2.5 text-sm flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
              {neg.client.name?.[0]?.toUpperCase() || "C"}
            </div>
            <div>
              <span className="font-medium">{neg.client.name}</span>
              {(neg.order?.city || neg.order?.state) && (
                <span className="text-slate-400 ml-2 inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[neg.order.city, neg.order.state].filter(Boolean).join(", ")}
                </span>
              )}
            </div>
          </div>
        )}

        {neg.status === "negotiating" && !readonly && (
          <div className="space-y-2">
            <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-700">
              Proposta aceita — quando a peça estiver pronta para envio, clique em "Informar Envio".
            </div>
            <Button
              size="sm"
              className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
              onClick={onShip}
              disabled={isPending}
            >
              <Truck className="h-4 w-4" /> Informar Envio da Peça
            </Button>
          </div>
        )}

        {neg.status === "shipped" && (
          <div className="bg-orange-50 border border-orange-200 rounded p-2 text-xs text-orange-700 space-y-1">
            <div className="font-semibold flex items-center gap-1">
              <Truck className="h-3.5 w-3.5" /> Peça enviada — aguardando confirmação de entrega pelo cliente
            </div>
            {neg.trackingCode && (
              <div>
                Rastreamento: <span className="font-mono font-bold">{neg.trackingCode}</span>
              </div>
            )}
          </div>
        )}

        {(neg.status === "awaiting_review" || neg.status === "delivered") && !readonly && (
          <div className="bg-purple-50 border border-purple-200 rounded p-2 text-xs text-purple-700">
            <div className="font-semibold flex items-center gap-1">
              <Package className="h-3.5 w-3.5" /> Entregue — aguardando avaliação do cliente
            </div>
          </div>
        )}

        {neg.status === "completed" && (
          <div className="bg-green-50 border border-green-200 rounded p-2 text-xs text-green-700">
            <div className="font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Venda concluída com sucesso
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-slate-700 mb-1">{title}</h3>
      <p className="text-slate-500 text-sm">{desc}</p>
    </div>
  );
}
