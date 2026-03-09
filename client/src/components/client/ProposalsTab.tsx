import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getToken } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Check,
  X,
  Loader2,
  Phone,
  DollarSign,
  Star,
} from "lucide-react";

interface Proposal {
  id: string;
  orderId: string;
  desmancheId: string;
  price: number;
  message: string;
  status: string;
  whatsappUnlocked: boolean;
  createdAt: string;
  desmanche?: {
    tradingName: string;
    phone: string;
    rating: number;
    companyName: string;
  };
  order?: {
    title: string;
    vehicleBrand: string;
    vehicleModel: string;
    vehicleYear: number;
    status: string;
  };
}

interface Order {
  id: string;
  title: string;
  proposals?: Proposal[];
}

export function ProposalsTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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

  const acceptMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      const res = await apiRequest("PATCH", `/api/proposals/${proposalId}/status`, { status: "accepted" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/my"] });
      queryClient.invalidateQueries({ queryKey: ["/api/negotiations/my"] });
      toast({ title: "Proposta aceita!", description: "Uma negociação foi criada." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível aceitar a proposta.", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      const res = await apiRequest("PATCH", `/api/proposals/${proposalId}/status`, { status: "rejected" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/my"] });
      toast({ title: "Proposta rejeitada" });
    },
  });

  const unlockWhatsappMutation = useMutation({
    mutationFn: async (proposalId: string) => {
      const res = await apiRequest("POST", `/api/proposals/${proposalId}/unlock-whatsapp`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders/my"] });
      toast({ title: "WhatsApp desbloqueado!" });
    },
  });

  const allProposals = orders
    .flatMap((o) =>
      (o.proposals || []).map((p: any) => ({
        ...p,
        orderTitle: o.title,
      }))
    )
    .sort((a: any, b: any) => {
      const dateA = typeof a.createdAt === 'number' ? a.createdAt : new Date(a.createdAt).getTime() / 1000;
      const dateB = typeof b.createdAt === 'number' ? b.createdAt : new Date(b.createdAt).getTime() / 1000;
      return dateB - dateA;
    });

  const pendingProposals = allProposals.filter((p: any) => p.status === "sent");
  const answeredProposals = allProposals.filter((p: any) => p.status !== "sent");

  const formatDate = (d: string) => {
    const date = new Date(typeof d === 'number' ? (d as number) * 1000 : d);
    return date.toLocaleDateString("pt-BR");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Propostas Recebidas</h2>
        <p className="text-sm text-muted-foreground">Veja e responda as propostas dos desmanches</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : allProposals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Nenhuma proposta recebida</p>
            <p className="text-sm text-muted-foreground mt-1">Crie pedidos de peças para começar a receber propostas</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {pendingProposals.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Aguardando Resposta ({pendingProposals.length})
              </h3>
              {pendingProposals.map((proposal: any) => (
                <Card key={proposal.id} className="border-yellow-200 bg-yellow-50/50 dark:bg-yellow-950/10">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1">Pedido: {proposal.orderTitle}</p>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold">{proposal.desmanche?.tradingName || "Desmanche"}</p>
                          {proposal.desmanche?.rating > 0 && (
                            <span className="text-xs flex items-center gap-0.5 text-yellow-600">
                              <Star className="h-3 w-3 fill-yellow-400" /> {proposal.desmanche.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{proposal.message}</p>
                        <p className="font-bold text-green-600 text-lg mt-1 flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          R$ {proposal.price.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(proposal.createdAt)}</p>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button size="sm" onClick={() => acceptMutation.mutate(proposal.id)} disabled={acceptMutation.isPending}>
                          <Check className="h-4 w-4 mr-1" /> Aceitar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => rejectMutation.mutate(proposal.id)} disabled={rejectMutation.isPending}>
                          <X className="h-4 w-4 mr-1" /> Rejeitar
                        </Button>
                        {!proposal.whatsappUnlocked && (
                          <Button size="sm" variant="outline" onClick={() => unlockWhatsappMutation.mutate(proposal.id)}>
                            <Phone className="h-4 w-4 mr-1" /> WhatsApp
                          </Button>
                        )}
                        {proposal.whatsappUnlocked && proposal.desmanche?.phone && (
                          <a
                            href={`https://wa.me/55${proposal.desmanche.phone.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button size="sm" variant="outline" className="w-full text-green-600">
                              <Phone className="h-4 w-4 mr-1" /> Conversar
                            </Button>
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {answeredProposals.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Respondidas ({answeredProposals.length})
              </h3>
              {answeredProposals.map((proposal: any) => (
                <Card key={proposal.id} className="opacity-75">
                  <CardContent className="pt-5 pb-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Pedido: {proposal.orderTitle}</p>
                        <p className="font-semibold">{proposal.desmanche?.tradingName || "Desmanche"}</p>
                        <p className="text-sm text-muted-foreground">{proposal.message}</p>
                        <p className="font-bold mt-1">R$ {proposal.price.toFixed(2)}</p>
                      </div>
                      <Badge variant={proposal.status === "accepted" ? "default" : "destructive"}>
                        {proposal.status === "accepted" ? "Aceita" : "Rejeitada"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
