import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { getToken } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ShieldCheck, AlertTriangle, Loader2, CheckCircle2, XCircle,
  Store, User, Package, Clock, Car, History, UserCheck,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ModerationNegotiation {
  id: string;
  price: number | null;
  createdAt: string | number | null;
  updatedAt: string | number | null;
  desmanchemResponse: string | null;
  clientResponse: string | null;
  order: { title: string; vehicleBrand?: string | null; vehicleModel?: string | null; vehicleYear?: string | null } | null;
  client: { name: string } | null;
  desmanche: { tradingName: string } | null;
}

interface ResolvedModerationNegotiation extends ModerationNegotiation {
  status: string;
  resolvedAt: string | number | Date | null;
  resolvedByAdmin: { name: string } | null;
}

function timeAgo(val: string | number | null | undefined): string {
  if (!val) return "—";
  const date = typeof val === "number" ? new Date(val * 1000) : new Date(val);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Agora";
  if (diffMin < 60) return `Há ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Há ${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return diffDays === 1 ? "Ontem" : `Há ${diffDays} dias`;
}

function fmtDate(val: string | number | Date | null | undefined): string {
  if (!val) return "—";
  let date: Date;
  if (val instanceof Date) {
    date = val;
  } else if (typeof val === "number") {
    date = new Date(val * 1000);
  } else {
    date = new Date(val);
  }
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtMoney(v: number | null | undefined) {
  if (!v) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

const DESMANCHE_RESP_LABELS: Record<string, { label: string; color: string }> = {
  sold:     { label: "Venda concluída", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  not_sold: { label: "Não houve venda", color: "text-slate-700 bg-slate-50 border-slate-200" },
};

const CLIENT_RESP_LABELS: Record<string, { label: string; color: string }> = {
  received:     { label: "Recebeu a peça", color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
  not_received: { label: "Não recebeu nada", color: "text-slate-700 bg-slate-50 border-slate-200" },
};

const RESOLUTION_STATUS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  awaiting_review: { label: "Confirmado como venda", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  completed:       { label: "Concluído", color: "text-emerald-700 bg-emerald-50 border-emerald-200", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  cancelled:       { label: "Cancelado", color: "text-red-700 bg-red-50 border-red-200", icon: <XCircle className="h-3.5 w-3.5" /> },
};

export default function ModerationTab() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: negotiations = [], isLoading } = useQuery<ModerationNegotiation[]>({
    queryKey: ["/api/admin/negotiations/moderation"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/negotiations/moderation");
      return res.json();
    },
    enabled: !!getToken(),
    refetchInterval: 30 * 1000,
    staleTime: 0,
  });

  const { data: resolvedNegotiations = [], isLoading: isLoadingResolved } = useQuery<ResolvedModerationNegotiation[]>({
    queryKey: ["/api/admin/negotiations/moderation/resolved"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/negotiations/moderation/resolved");
      return res.json();
    },
    enabled: !!getToken(),
    staleTime: 60 * 1000,
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, resolution }: { id: string; resolution: "sold" | "cancelled" }) => {
      const res = await apiRequest("POST", `/api/admin/negotiations/moderation/${id}/resolve`, { resolution });
      return res.json();
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["/api/admin/negotiations/moderation"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/negotiations/moderation/resolved"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/negotiations/pending"] });
      qc.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      if (vars.resolution === "sold") {
        toast({ title: "Resolvido como venda!", description: "Negociação movida para aguardando avaliação e cobrança gerada." });
      } else {
        toast({ title: "Negociação cancelada.", description: "A negociação foi encerrada." });
      }
    },
    onError: () => toast({ title: "Erro ao resolver moderação", variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      <div>
        <h1 className="text-3xl font-bold font-mono tracking-tight">Moderação de Divergências</h1>
        <p className="text-muted-foreground mt-1">
          Negociações onde as respostas do desmanche e do cliente foram divergentes. Analise e decida o desfecho correto.
        </p>
      </div>

      {negotiations.length === 0 ? (
        <Card>
          <CardContent className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="h-12 w-12 rounded-full bg-green-50 flex items-center justify-center">
              <ShieldCheck className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-slate-700">Nenhuma divergência pendente</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Quando houver conflito entre as respostas de desmanche e cliente, as negociações aparecerão aqui para moderação.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {negotiations.map((neg) => {
            const vehicle = [neg.order?.vehicleBrand, neg.order?.vehicleModel, neg.order?.vehicleYear].filter(Boolean).join(" · ");
            const desmancheResp = (neg.desmanchemResponse ? DESMANCHE_RESP_LABELS[neg.desmanchemResponse] : null) ?? { label: neg.desmanchemResponse ?? "—", color: "text-slate-700 bg-slate-50 border-slate-200" };
            const clientResp = (neg.clientResponse ? CLIENT_RESP_LABELS[neg.clientResponse] : null) ?? { label: neg.clientResponse ?? "—", color: "text-slate-700 bg-slate-50 border-slate-200" };

            return (
              <Card key={neg.id} className="border-orange-200 bg-orange-50/30" data-testid={`card-moderation-${neg.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                        {neg.order?.title || "Negociação"}
                        <span className="font-mono text-xs text-muted-foreground font-normal">
                          NEG-{neg.id.slice(0, 8).toUpperCase()}
                        </span>
                      </CardTitle>
                      {vehicle && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Car className="h-3 w-3" /> {vehicle}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {timeAgo(neg.updatedAt)}
                      </span>
                      <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-300">
                        Em Moderação
                      </Badge>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Price */}
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Valor acordado:</span>
                    <span className="font-bold text-emerald-700">{fmtMoney(neg.price)}</span>
                  </div>

                  {/* Parties */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white border rounded-lg p-3 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <Store className="h-3.5 w-3.5" /> Desmanche
                      </p>
                      <p className="font-medium text-sm">
                        {neg.desmanche?.tradingName || "—"}
                      </p>
                      <div className="text-xs text-muted-foreground">Respondeu:</div>
                      <Badge variant="outline" className={`text-xs ${desmancheResp.color}`}>
                        {desmancheResp.label}
                      </Badge>
                    </div>

                    <div className="bg-white border rounded-lg p-3 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" /> Cliente
                      </p>
                      <p className="font-medium text-sm">
                        {neg.client?.name || "—"}
                      </p>
                      <div className="text-xs text-muted-foreground">Respondeu:</div>
                      <Badge variant="outline" className={`text-xs ${clientResp.color}`}>
                        {clientResp.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Divergence summary */}
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>
                      <strong>Divergência:</strong>{" "}
                      {neg.desmanchemResponse === "sold" && neg.clientResponse === "not_received"
                        ? "O desmanche diz que vendeu, mas o cliente diz que não recebeu nada."
                        : neg.desmanchemResponse === "not_sold" && neg.clientResponse === "received"
                          ? "O desmanche diz que não vendeu, mas o cliente diz que recebeu a peça."
                          : "As informações de ambos os lados são contraditórias."}
                    </p>
                  </div>

                  <Separator />

                  {/* Admin action */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-700">Decisão do administrador:</p>
                    <div className="flex gap-3 flex-wrap">
                      <Button
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white flex-1 min-w-[180px]"
                        onClick={() => resolveMutation.mutate({ id: neg.id, resolution: "sold" })}
                        disabled={resolveMutation.isPending}
                        data-testid={`button-moderation-sold-${neg.id}`}
                      >
                        {resolveMutation.isPending
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <CheckCircle2 className="h-4 w-4" />}
                        Confirmar como venda concluída
                      </Button>
                      <Button
                        variant="outline"
                        className="gap-2 border-red-300 text-red-700 hover:bg-red-50 flex-1 min-w-[180px]"
                        onClick={() => resolveMutation.mutate({ id: neg.id, resolution: "cancelled" })}
                        disabled={resolveMutation.isPending}
                        data-testid={`button-moderation-cancel-${neg.id}`}
                      >
                        {resolveMutation.isPending
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <XCircle className="h-4 w-4" />}
                        Cancelar negociação
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Confirmar como venda irá gerar a cobrança ao desmanche e mover para aguardando avaliação. Cancelar encerrará sem cobrança.
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Resolution history */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-semibold tracking-tight">Histórico de Moderações</h2>
        </div>
        <p className="text-sm text-muted-foreground -mt-2">
          Casos encerrados — mostra quem resolveu cada divergência e quando.
        </p>

        {isLoadingResolved ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : resolvedNegotiations.length === 0 ? (
          <Card>
            <CardContent className="py-10 flex flex-col items-center gap-2 text-center">
              <History className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhuma moderação encerrada ainda.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {resolvedNegotiations.map((neg) => {
              const vehicle = [neg.order?.vehicleBrand, neg.order?.vehicleModel, neg.order?.vehicleYear].filter(Boolean).join(" · ");
              const resolution = RESOLUTION_STATUS[neg.status] ?? { label: neg.status, color: "text-slate-700 bg-slate-50 border-slate-200", icon: null };
              const desmancheResp = (neg.desmanchemResponse ? DESMANCHE_RESP_LABELS[neg.desmanchemResponse] : null) ?? { label: neg.desmanchemResponse ?? "—", color: "text-slate-700 bg-slate-50 border-slate-200" };
              const clientResp = (neg.clientResponse ? CLIENT_RESP_LABELS[neg.clientResponse] : null) ?? { label: neg.clientResponse ?? "—", color: "text-slate-700 bg-slate-50 border-slate-200" };

              return (
                <Card key={neg.id} className="border-slate-200" data-testid={`card-moderation-resolved-${neg.id}`}>
                  <CardContent className="py-4 space-y-3">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="font-medium text-sm flex items-center gap-2">
                          {neg.order?.title || "Negociação"}
                          <span className="font-mono text-xs text-muted-foreground font-normal">
                            NEG-{neg.id.slice(0, 8).toUpperCase()}
                          </span>
                        </p>
                        {vehicle && (
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <Car className="h-3 w-3" /> {vehicle}
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className={`text-xs flex items-center gap-1 ${resolution.color}`}>
                        {resolution.icon}
                        {resolution.label}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Store className="h-3.5 w-3.5 shrink-0" />
                        <span className="font-medium text-foreground">{neg.desmanche?.tradingName || "—"}</span>
                        <span>·</span>
                        <Badge variant="outline" className={`text-[10px] px-1 py-0 ${desmancheResp.color}`}>{desmancheResp.label}</Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <User className="h-3.5 w-3.5 shrink-0" />
                        <span className="font-medium text-foreground">{neg.client?.name || "—"}</span>
                        <span>·</span>
                        <Badge variant="outline" className={`text-[10px] px-1 py-0 ${clientResp.color}`}>{clientResp.label}</Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Package className="h-3.5 w-3.5 shrink-0" />
                        <span className="font-bold text-emerald-700">{fmtMoney(neg.price)}</span>
                      </div>
                    </div>

                    <Separator />

                    <div
                      className="flex items-center gap-2 text-xs text-muted-foreground"
                      data-testid={`text-moderation-resolver-${neg.id}`}
                    >
                      <UserCheck className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span>
                        Resolvido por{" "}
                        <span className="font-semibold text-foreground" data-testid={`text-moderation-admin-name-${neg.id}`}>
                          {neg.resolvedByAdmin?.name ?? "Admin"}
                        </span>
                        {neg.resolvedAt && (
                          <>
                            {" "}em{" "}
                            <span data-testid={`text-moderation-resolved-at-${neg.id}`}>
                              {fmtDate(neg.resolvedAt)}
                            </span>
                          </>
                        )}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
