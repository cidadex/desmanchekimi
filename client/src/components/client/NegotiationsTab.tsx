import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getToken } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Handshake,
  Truck,
  CheckCircle2,
  Star,
  Loader2,
  Package,
  Clock,
  AlertTriangle,
  XCircle,
  ShieldAlert,
} from "lucide-react";

const statusConfig: Record<string, { label: string; color: string }> = {
  negotiating: { label: "Negociando", color: "bg-blue-100 text-blue-800 border-blue-200" },
  shipped:     { label: "Enviado", color: "bg-orange-100 text-orange-800 border-orange-200" },
  awaiting_review: { label: "Aguardando Avaliação", color: "bg-purple-100 text-purple-800 border-purple-200" },
  completed:   { label: "Concluído", color: "bg-green-100 text-green-800 border-green-200" },
  cancelled:   { label: "Cancelado", color: "bg-red-100 text-red-800 border-red-200" },
};

function formatDate(ts: any) {
  if (!ts) return "—";
  return new Date(typeof ts === "number" ? ts * 1000 : ts).toLocaleDateString("pt-BR");
}

function deadlineCountdown(deadlineTs: any): { days: number; hours: number; isOverdue: boolean; percent: number } | null {
  if (!deadlineTs) return null;
  const deadline = new Date(typeof deadlineTs === "number" ? deadlineTs * 1000 : deadlineTs).getTime();
  const now = Date.now();
  const diff = deadline - now;
  if (diff <= 0) return { days: 0, hours: 0, isOverdue: true, percent: 100 };
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const totalDays = 10;
  const percent = Math.max(0, 100 - (diff / (totalDays * 24 * 60 * 60 * 1000)) * 100);
  return { days, hours, isOverdue: false, percent };
}

interface Negotiation {
  id: string;
  orderId: string;
  proposalId: string;
  clientId: string;
  desmancheId: string;
  price: number;
  status: string;
  trackingCode?: string;
  receivedAt?: any;
  reviewDeadlineAt?: any;
  createdAt: any;
  order?: { title: string; vehicleBrand: string; vehicleModel: string; vehicleYear: number };
  desmanche?: { tradingName: string; phone: string; rating: number };
}

export function NegotiationsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const token = getToken();
  const [filter, setFilter] = useState("all");
  const [reviewDialog, setReviewDialog] = useState<Negotiation | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [, forceUpdate] = useState(0);

  // Atualiza countdowns a cada minuto
  useEffect(() => {
    const t = setInterval(() => forceUpdate((n) => n + 1), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const { data: negotiations = [], isLoading } = useQuery<Negotiation[]>({
    queryKey: ["/api/negotiations/my"],
    queryFn: async () => {
      const res = await fetch("/api/negotiations/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erro");
      return res.json();
    },
    enabled: !!token,
    refetchInterval: 30 * 1000,
  });

  const { data: blockStatus } = useQuery<{
    isBlocked: boolean;
    overdueCount: number;
    pendingReviews: Negotiation[];
  }>({
    queryKey: ["/api/client/review-block-status"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/client/review-block-status");
      return res.json();
    },
    enabled: !!token,
    refetchInterval: 60 * 1000,
  });

  const receivedMutation = useMutation({
    mutationFn: async (negotiationId: string) => {
      const res = await apiRequest("PATCH", `/api/negotiations/${negotiationId}/received`);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/negotiations/my"] });
      qc.invalidateQueries({ queryKey: ["/api/client/review-block-status"] });
      toast({ title: "Recebimento confirmado!", description: "O prazo para avaliação começa agora." });
    },
    onError: () => toast({ title: "Erro ao confirmar recebimento", variant: "destructive" }),
  });

  const reviewMutation = useMutation({
    mutationFn: async (data: { negotiationId: string; clientId: string; desmancheId: string; rating: number; comment: string }) => {
      const res = await apiRequest("POST", "/api/reviews", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/negotiations/my"] });
      qc.invalidateQueries({ queryKey: ["/api/client/review-block-status"] });
      setReviewDialog(null);
      setReviewRating(5);
      setReviewComment("");
      toast({ title: "Avaliação enviada!", description: "Obrigado pelo feedback. Negociação concluída." });
    },
    onError: () => toast({ title: "Erro ao enviar avaliação", variant: "destructive" }),
  });

  const handleReview = () => {
    if (!reviewDialog || !user) return;
    reviewMutation.mutate({
      negotiationId: reviewDialog.id,
      clientId: user.id,
      desmancheId: reviewDialog.desmancheId,
      rating: reviewRating,
      comment: reviewComment,
    });
  };

  const filteredNegotiations = negotiations.filter((n) => {
    if (filter === "all") return true;
    if (filter === "awaiting_review") return n.status === "awaiting_review";
    return n.status === filter;
  });

  const awaitingReviewCount = negotiations.filter((n) => n.status === "awaiting_review").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Minhas Negociações</h2>
        <p className="text-sm text-muted-foreground">Acompanhe suas negociações de peças</p>
      </div>

      {/* Banner de bloqueio */}
      {blockStatus?.isBlocked && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 flex items-start gap-3">
          <ShieldAlert className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-800">Conta com restrição — pedidos bloqueados</p>
            <p className="text-sm text-red-700 mt-1">
              Você tem {blockStatus.overdueCount} avaliação(ões) atrasada(s). Avalie as negociações abaixo para reativar sua conta.
            </p>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: "Todas" },
          { key: "negotiating", label: "Negociando" },
          { key: "shipped", label: "Enviadas" },
          { key: "awaiting_review", label: "Aguard. Avaliação", badge: awaitingReviewCount },
          { key: "completed", label: "Concluídas" },
        ].map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
            className="gap-1.5"
          >
            {f.label}
            {f.badge && f.badge > 0 && (
              <span className="bg-primary-foreground text-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {f.badge}
              </span>
            )}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredNegotiations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Handshake className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhuma negociação encontrada</p>
            <p className="text-sm text-muted-foreground mt-1">Aceite propostas nos seus pedidos para iniciar negociações</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredNegotiations.map((neg) => (
            <NegotiationCard
              key={neg.id}
              neg={neg}
              onConfirmReceived={() => receivedMutation.mutate(neg.id)}
              onReview={() => { setReviewDialog(neg); setReviewRating(5); setReviewComment(""); }}
              isConfirmingReceived={receivedMutation.isPending && receivedMutation.variables === neg.id}
            />
          ))}
        </div>
      )}

      {/* Dialog de avaliação */}
      <Dialog open={!!reviewDialog} onOpenChange={(o) => !o && setReviewDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avaliar Desmanche</DialogTitle>
            <DialogDescription>
              Avalie o desmanche <strong>{reviewDialog?.desmanche?.tradingName}</strong>.
              A negociação será concluída após a avaliação.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Sua nota</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setReviewRating(n)} className="p-1 transition-transform hover:scale-110">
                    <Star className={`h-7 w-7 ${n <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {["", "Péssimo", "Ruim", "Regular", "Bom", "Excelente"][reviewRating]}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Comentário (opcional)</Label>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Como foi sua experiência com este desmanche?"
                rows={3}
              />
            </div>
            <Button onClick={handleReview} className="w-full" disabled={reviewMutation.isPending}>
              {reviewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Star className="h-4 w-4 mr-2" />}
              Enviar Avaliação & Concluir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function NegotiationCard({
  neg,
  onConfirmReceived,
  onReview,
  isConfirmingReceived,
}: {
  neg: Negotiation;
  onConfirmReceived: () => void;
  onReview: () => void;
  isConfirmingReceived: boolean;
}) {
  const config = statusConfig[neg.status] || { label: neg.status, color: "bg-slate-100 text-slate-700 border-slate-200" };
  const countdown = neg.status === "awaiting_review" ? deadlineCountdown(neg.reviewDeadlineAt) : null;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-5 pb-5 space-y-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className={config.color}>
                {config.label}
              </Badge>
              <span className="text-xs text-muted-foreground">{formatDate(neg.createdAt)}</span>
            </div>
            <h3 className="font-semibold">{neg.order?.title || "Pedido"}</h3>
            <p className="text-sm text-muted-foreground">
              {neg.order?.vehicleBrand} {neg.order?.vehicleModel} {neg.order?.vehicleYear}
            </p>
            <p className="text-sm mt-1">
              Desmanche: <strong>{neg.desmanche?.tradingName}</strong>
            </p>
            {neg.trackingCode && (
              <p className="text-sm mt-1 flex items-center gap-1 text-orange-700">
                <Truck className="h-3 w-3" /> Rastreio: <span className="font-mono font-bold">{neg.trackingCode}</span>
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <div className="text-2xl font-bold text-green-600">
              R$ {Number(neg.price).toFixed(2).replace(".", ",")}
            </div>
          </div>
        </div>

        {/* Status: Enviado → botão de confirmação */}
        {neg.status === "shipped" && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-orange-800 text-sm font-semibold">
              <Truck className="h-4 w-4" /> A peça está a caminho!
            </div>
            <p className="text-xs text-orange-700">
              Quando receber a peça, confirme o recebimento para iniciar o prazo de avaliação.
            </p>
            <Button
              size="sm"
              className="gap-2 bg-orange-500 hover:bg-orange-600 text-white"
              onClick={onConfirmReceived}
              disabled={isConfirmingReceived}
            >
              {isConfirmingReceived ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Package className="h-3.5 w-3.5" />}
              Confirmar Recebimento
            </Button>
          </div>
        )}

        {/* Status: Aguardando avaliação → review gate com countdown */}
        {neg.status === "awaiting_review" && countdown && (
          <div className={`rounded-lg border p-3 space-y-2 ${countdown.isOverdue ? "bg-red-50 border-red-200" : "bg-purple-50 border-purple-200"}`}>
            <div className={`flex items-center gap-2 text-sm font-semibold ${countdown.isOverdue ? "text-red-800" : "text-purple-800"}`}>
              {countdown.isOverdue ? (
                <><AlertTriangle className="h-4 w-4" /> Prazo de avaliação encerrado</>
              ) : (
                <><Clock className="h-4 w-4" /> Avalie antes do prazo expirar!</>
              )}
            </div>

            {!countdown.isOverdue && (
              <>
                <Progress value={countdown.percent} className="h-2" />
                <p className="text-xs text-purple-700">
                  {countdown.days > 0 ? `${countdown.days} dia(s) e ` : ""}
                  {countdown.hours}h restantes para avaliar
                </p>
              </>
            )}

            {countdown.isOverdue && (
              <p className="text-xs text-red-700">
                O prazo expirou. A avaliação não é mais obrigatória, mas ainda é bem-vinda.
              </p>
            )}

            <Button
              size="sm"
              className="gap-2 bg-purple-600 hover:bg-purple-700 text-white"
              onClick={onReview}
            >
              <Star className="h-3.5 w-3.5" />
              {countdown.isOverdue ? "Avaliar mesmo assim" : "Avaliar Agora"}
            </Button>
          </div>
        )}

        {/* Status: Concluído */}
        {neg.status === "completed" && (
          <div className="bg-green-50 border border-green-200 rounded p-2 text-xs text-green-700 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" /> Negociação concluída com sucesso!
          </div>
        )}

        {/* Status: Cancelado */}
        {neg.status === "cancelled" && (
          <div className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-700 flex items-center gap-1.5">
            <XCircle className="h-3.5 w-3.5" /> Negociação cancelada.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
