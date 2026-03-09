import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getToken } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Handshake,
  Truck,
  CheckCircle2,
  Star,
  Loader2,
  Package,
} from "lucide-react";

const negotiationStatusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  negotiating: { label: "Negociando", variant: "secondary" },
  paid: { label: "Pago", variant: "default" },
  shipped: { label: "Enviado", variant: "secondary" },
  delivered: { label: "Entregue", variant: "default" },
  completed: { label: "Concluído", variant: "default" },
  cancelled: { label: "Cancelado", variant: "destructive" },
};

interface Negotiation {
  id: string;
  orderId: string;
  proposalId: string;
  clientId: string;
  desmancheId: string;
  price: number;
  status: string;
  trackingCode?: string;
  createdAt: string;
  order?: { title: string; vehicleBrand: string; vehicleModel: string; vehicleYear: number };
  desmanche?: { tradingName: string; phone: string; rating: number };
}

export function NegotiationsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const token = getToken();
  const [filter, setFilter] = useState("all");
  const [reviewDialog, setReviewDialog] = useState<Negotiation | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

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
  });

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/negotiations/${id}/status`, { status });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/negotiations/my"] });
      toast({ title: "Status atualizado" });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (data: { negotiationId: string; clientId: string; desmancheId: string; rating: number; comment: string }) => {
      const res = await apiRequest("POST", "/api/reviews", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/negotiations/my"] });
      setReviewDialog(null);
      setReviewRating(5);
      setReviewComment("");
      toast({ title: "Avaliação enviada!", description: "Obrigado pelo feedback." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível enviar a avaliação.", variant: "destructive" });
    },
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
    return n.status === filter;
  });

  const formatDate = (d: string) => {
    const date = new Date(typeof d === 'number' ? (d as number) * 1000 : d);
    return date.toLocaleDateString("pt-BR");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Minhas Negociações</h2>
        <p className="text-sm text-muted-foreground">Acompanhe suas negociações de peças</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[
          { key: "all", label: "Todas" },
          { key: "negotiating", label: "Negociando" },
          { key: "shipped", label: "Enviadas" },
          { key: "delivered", label: "Entregues" },
          { key: "completed", label: "Concluídas" },
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
            <Card key={neg.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{neg.order?.title || "Pedido"}</h3>
                      <Badge variant={negotiationStatusLabels[neg.status]?.variant || "outline"}>
                        {negotiationStatusLabels[neg.status]?.label || neg.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {neg.order?.vehicleBrand} {neg.order?.vehicleModel} {neg.order?.vehicleYear}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm">
                        Desmanche: <strong>{neg.desmanche?.tradingName}</strong>
                      </span>
                      <span className="font-bold text-green-600">R$ {neg.price.toFixed(2)}</span>
                    </div>
                    {neg.trackingCode && (
                      <p className="text-sm mt-1 flex items-center gap-1">
                        <Truck className="h-3 w-3" /> Rastreio: {neg.trackingCode}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">{formatDate(neg.createdAt)}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {neg.status === "shipped" && (
                      <Button size="sm" onClick={() => statusMutation.mutate({ id: neg.id, status: "delivered" })}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Recebi
                      </Button>
                    )}
                    {neg.status === "delivered" && (
                      <Button size="sm" variant="outline" onClick={() => {
                        setReviewDialog(neg);
                        setReviewRating(5);
                        setReviewComment("");
                      }}>
                        <Star className="h-4 w-4 mr-1" /> Avaliar
                      </Button>
                    )}
                    {neg.status === "delivered" && (
                      <Button size="sm" onClick={() => statusMutation.mutate({ id: neg.id, status: "completed" })}>
                        <CheckCircle2 className="h-4 w-4 mr-1" /> Concluir
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!reviewDialog} onOpenChange={() => setReviewDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avaliar Desmanche</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Avalie o desmanche <strong>{reviewDialog?.desmanche?.tradingName}</strong>
            </p>
            <div className="space-y-2">
              <Label>Nota</Label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setReviewRating(n)} className="p-1">
                    <Star className={`h-6 w-6 ${n <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Comentário</Label>
              <Textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="Como foi sua experiência?" rows={3} />
            </div>
            <Button onClick={handleReview} className="w-full" disabled={reviewMutation.isPending}>
              {reviewMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Star className="h-4 w-4 mr-2" />}
              Enviar Avaliação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
