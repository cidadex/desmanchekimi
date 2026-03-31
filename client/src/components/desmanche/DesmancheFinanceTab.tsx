import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Receipt, Loader2, FileText, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  const queryClient = useQueryClient();

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

  const generateCharge = useMutation({
    mutationFn: async (txId: string) => {
      const res = await apiRequest("POST", `/api/billing/transactions/${txId}/charge`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Erro ao gerar cobrança");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/billing/my"] });
      if (data.paymentLink) {
        window.open(data.paymentLink, "_blank");
      } else {
        toast({ title: "Cobrança gerada", description: "Fatura criada no Asaas. O link de pagamento será exibido em breve." });
      }
    },
    onError: (err: Error) => {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    },
  });

  const billing = billingData?.billing;
  const transactions = billingData?.transactions || [];
  const settings = billingData?.settings || { capAmount: 200, perTxAmount: 25 };

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

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div>
        <h1 className="text-3xl font-bold font-mono text-slate-900 tracking-tight">Financeiro & Faturas</h1>
        <p className="text-slate-500 mt-1">Visualize seus extratos e o uso mensal da plataforma.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <>
          {/* Plano ativo */}
          <Card className="border-2 border-primary/20 bg-primary/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
              <CreditCard className="w-32 h-32" />
            </div>
            <CardContent className="p-6 sm:p-8 relative z-10">
              <Badge className="mb-3 bg-primary text-primary-foreground">Modelo de Cobrança</Badge>
              <h2 className="text-2xl font-bold text-slate-900">Por Operação</h2>
              <p className="text-slate-600 mt-2">
                {fmt(perTxAmount)} por negociação concluída.
                Após atingir {fmt(capAmount)}/mês, as demais são isentas.
              </p>
            </CardContent>
          </Card>

          {/* Uso do mês */}
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
              {capReached && (
                <div className="flex items-center gap-1.5 text-green-700 bg-green-50 border border-green-200 rounded p-2 w-full text-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  <span><strong>Teto atingido!</strong> Suas próximas transações deste mês serão isentas.</span>
                </div>
              )}
            </CardContent>
          </Card>

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
                          {tx.status === "pending" && !tx.paymentLink && billingData?.asaasConfigured && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 border-amber-300 text-amber-700 hover:bg-amber-50"
                              disabled={generateCharge.isPending}
                              onClick={() => generateCharge.mutate(tx.id)}
                            >
                              {generateCharge.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <RefreshCw className="h-3 w-3" />
                              )}
                              Gerar fatura
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
    </div>
  );
}
