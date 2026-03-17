import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CreditCard, Receipt, Loader2, FileText, TrendingUp, CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const TX_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  exempt: "bg-blue-50 text-blue-700 border-blue-200",
};
const TX_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  failed: "Falhou",
  exempt: "Isento",
};

export default function DesmancheFinanceTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [planDialog, setPlanDialog] = useState(false);
  const [selectedModel, setSelectedModel] = useState<"subscription" | "per_transaction">("per_transaction");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  const { data: billingData, isLoading } = useQuery<{
    billing: any;
    transactions: any[];
    settings: { capAmount: number; perTxAmount: number };
    asaasConfigured: boolean;
    monthlyProposalCount: number;
  }>({
    queryKey: ["/api/billing/my"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/billing/my");
      return res.json();
    },
  });

  const { data: plans = [] } = useQuery<any[]>({
    queryKey: ["/api/subscription-plans"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/subscription-plans");
      return res.json();
    },
  });

  const setupMutation = useMutation({
    mutationFn: async (data: { billingModel: string; planId?: string }) => {
      const res = await apiRequest("POST", "/api/billing/setup", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/billing/my"] });
      setPlanDialog(false);
      toast({ title: "Configuração de cobrança atualizada!" });
    },
    onError: () => toast({ title: "Erro ao configurar cobrança", variant: "destructive" }),
  });

  const billing = billingData?.billing;
  const transactions = billingData?.transactions || [];
  const settings = billingData?.settings || { capAmount: 200, perTxAmount: 25 };
  const monthlyProposalCount = billingData?.monthlyProposalCount ?? 0;

  const monthlyPaid = billing?.monthlyAmountPaid || 0;
  const capAmount = settings.capAmount;
  const perTxAmount = settings.perTxAmount;
  const capProgress = Math.min((monthlyPaid / capAmount) * 100, 100);
  const capReached = monthlyPaid >= capAmount;

  const fmt = (v: number) =>
    `R$ ${v.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;

  const fmtDate = (ts: any) => {
    if (!ts) return "—";
    return new Date(typeof ts === "number" ? ts * 1000 : ts).toLocaleDateString("pt-BR");
  };

  const pendingTx = transactions.filter((t) => t.status === "pending");

  const isPerTransaction = !billing || billing.billingModel === "per_transaction";
  const currentPlan = isPerTransaction
    ? null
    : plans.find((p) => p.id === billing?.planId);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div>
        <h1 className="text-3xl font-bold font-mono text-slate-900 tracking-tight">Financeiro & Faturas</h1>
        <p className="text-slate-500 mt-1">Gerencie seu plano e visualize os extratos da plataforma.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <>
          {/* Plano atual */}
          <Card className="border-2 border-primary/20 bg-primary/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <CreditCard className="w-32 h-32" />
            </div>
            <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
              <div>
                <Badge className="mb-3 bg-primary text-primary-foreground">Modelo de Cobrança Ativo</Badge>
                <h2 className="text-2xl font-bold text-slate-900">
                  {isPerTransaction ? "Por Transação" : (currentPlan?.name || "Assinatura")}
                </h2>
                {isPerTransaction ? (
                  <div className="mt-2 space-y-1">
                    <p className="text-slate-600">
                      {fmt(perTxAmount)} por negociação concluída.
                      Após atingir {fmt(capAmount)}/mês, as demais são isentas.
                    </p>
                  </div>
                ) : (
                  <p className="text-slate-600 mt-2">
                    {fmt(currentPlan?.price || 0)}/mês — até {currentPlan?.proposalLimit >= 999 ? "ilimitadas" : currentPlan?.proposalLimit} propostas + {currentPlan?.exclusivitySlots || 0} slots exclusivos.
                  </p>
                )}
              </div>
              <Button
                className="shrink-0 gap-2"
                variant="outline"
                onClick={() => {
                  setSelectedModel(billing?.billingModel || "per_transaction");
                  setSelectedPlanId(billing?.planId || "");
                  setPlanDialog(true);
                }}
              >
                <TrendingUp className="h-4 w-4" /> Alterar Plano
              </Button>
            </CardContent>
          </Card>

          {/* Uso do mês — assinatura: progresso de propostas */}
          {!isPerTransaction && currentPlan && currentPlan.proposalLimit < 999 && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="font-mono text-base">Propostas Enviadas Este Mês</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-600">
                    Enviadas: <strong>{monthlyProposalCount}</strong>
                  </span>
                  <span className="text-slate-600">
                    Limite: <strong>{currentPlan.proposalLimit}</strong>
                  </span>
                </div>
                <Progress
                  value={Math.min((monthlyProposalCount / currentPlan.proposalLimit) * 100, 100)}
                  className="h-3"
                />
                {monthlyProposalCount >= currentPlan.proposalLimit ? (
                  <div className="flex items-center gap-1.5 text-red-700 bg-red-50 border border-red-200 rounded p-2 w-full text-sm">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span><strong>Limite atingido!</strong> Você não pode enviar mais propostas este mês. Considere fazer upgrade do plano.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 border border-slate-200 rounded p-2 w-full text-sm">
                    <TrendingUp className="h-4 w-4 shrink-0" />
                    <span>
                      Restam <strong>{currentPlan.proposalLimit - monthlyProposalCount}</strong> proposta(s) este mês no plano <strong>{currentPlan.name}</strong>.
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Uso do mês (só para por transação) */}
          {isPerTransaction && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="font-mono text-base">Uso do Mês Atual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-slate-600">
                    Pago: <strong>{fmt(monthlyPaid)}</strong>
                  </span>
                  <span className="text-slate-600">
                    Teto: <strong>{fmt(capAmount)}</strong>
                  </span>
                </div>
                <Progress value={capProgress} className="h-3" />
                <div className="flex items-center gap-2 text-sm">
                  {capReached ? (
                    <div className="flex items-center gap-1.5 text-green-700 bg-green-50 border border-green-200 rounded p-2 w-full">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span><strong>Teto atingido!</strong> Suas próximas transações deste mês serão isentas.</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 border border-slate-200 rounded p-2 w-full">
                      <TrendingUp className="h-4 w-4 shrink-0" />
                      <span>
                        Faltam <strong>{fmt(capAmount - monthlyPaid)}</strong> para o teto.
                        ({billing?.monthlyTransactionCount || 0} transação(ões) este mês)
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pendências */}
          {pendingTx.length > 0 && (
            <Card className="border-amber-200 bg-amber-50 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-amber-800">
                      {pendingTx.length} cobrança(s) pendente(s)
                    </p>
                    <p className="text-sm text-amber-700 mt-0.5">
                      Total a pagar: {fmt(pendingTx.reduce((s, t) => s + t.amount, 0))}
                    </p>
                    {pendingTx[0]?.paymentLink && (
                      <Button
                        size="sm"
                        className="mt-3 gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                        onClick={() => window.open(pendingTx[0].paymentLink, "_blank")}
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Pagar agora
                      </Button>
                    )}
                    {!billingData?.asaasConfigured && (
                      <p className="text-xs text-amber-600 mt-2">
                        Integração Asaas não configurada. O administrador deve adicionar a chave de API.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Histórico */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="font-mono text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5 text-slate-500" /> Histórico de Cobranças
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {transactions.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <FileText className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                  <p>Nenhuma cobrança gerada ainda.</p>
                  <p className="text-xs mt-1">As cobranças aparecem quando negociações são concluídas e avaliadas.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx: any) => (
                      <TableRow key={tx.id}>
                        <TableCell className="font-medium">{tx.description || "Cobrança"}</TableCell>
                        <TableCell>{fmtDate(tx.createdAt)}</TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          {tx.amount === 0 ? "Isento" : fmt(tx.amount)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={TX_STATUS_COLORS[tx.status] || ""}>
                            {TX_STATUS_LABELS[tx.status] || tx.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {tx.status === "pending" && tx.paymentLink && (
                            <Button size="sm" variant="outline" className="gap-1" onClick={() => window.open(tx.paymentLink, "_blank")}>
                              <ExternalLink className="h-3 w-3" /> Pagar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Dialog: Alterar plano */}
      <Dialog open={planDialog} onOpenChange={setPlanDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar Modelo de Cobrança</DialogTitle>
            <DialogDescription>
              Escolha entre pagar por transação ou assinar um plano mensal.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Select value={selectedModel} onValueChange={(v: any) => setSelectedModel(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="per_transaction">Por Transação (R$ {settings.perTxAmount}/transação, teto R$ {settings.capAmount}/mês)</SelectItem>
                  <SelectItem value="subscription">Assinatura Mensal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedModel === "subscription" && (
              <div className="space-y-2">
                <Label>Plano</Label>
                <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {plans.filter((p) => p.active).map((plan) => (
                      <SelectItem key={plan.id} value={plan.id}>
                        {plan.name} — R$ {plan.price.toFixed(2).replace(".", ",")} /mês ({plan.proposalLimit >= 999 ? "ilimitadas" : plan.proposalLimit} propostas)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setPlanDialog(false)}>Cancelar</Button>
              <Button
                className="flex-1"
                onClick={() => setupMutation.mutate({ billingModel: selectedModel, planId: selectedModel === "subscription" ? selectedPlanId : undefined })}
                disabled={setupMutation.isPending || (selectedModel === "subscription" && !selectedPlanId)}
              >
                {setupMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
