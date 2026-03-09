import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Receipt, Loader2, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const PLAN_LABELS: Record<string, string> = {
  percentage: "Porcentagem sobre Vendas",
  monthly: "Mensalidade Fixa",
};

const INVOICE_STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  overdue: "bg-red-50 text-red-700 border-red-200",
};

const INVOICE_STATUS_LABELS: Record<string, string> = {
  pending: "A Vencer",
  paid: "Pago",
  overdue: "Em Atraso",
};

export default function DesmancheFinanceTab() {
  const { data: desmanche } = useQuery({
    queryKey: ["/api/desmanches/me"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/desmanches/me");
      return res.json();
    },
  });

  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ["/api/invoices/my"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/invoices/my");
      return res.json();
    },
  });

  const plan = desmanche?.plan || "percentage";

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "—";
    const d = new Date(typeof timestamp === "number" ? timestamp * 1000 : timestamp);
    return d.toLocaleDateString("pt-BR");
  };

  const formatCurrency = (value: any) => {
    const num = parseFloat(value || "0");
    return `R$ ${num.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div>
        <h1 className="text-3xl font-bold font-mono text-slate-900 tracking-tight">Financeiro & Faturas</h1>
        <p className="text-slate-500 mt-1">Gerencie seu plano e visualize os extratos da plataforma.</p>
      </div>

      <Card className="border-2 border-primary/20 bg-primary/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
          <CreditCard className="w-32 h-32" />
        </div>
        <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative z-10">
          <div>
            <Badge className="mb-3 bg-primary text-primary-foreground">Plano Ativo</Badge>
            <h2 className="text-2xl font-bold text-slate-900">{PLAN_LABELS[plan]}</h2>
            <p className="text-slate-600 mt-2 max-w-md">
              {plan === "percentage"
                ? "Você não paga mensalidade fixa. Será cobrada uma taxa de 3,5% sobre os negócios fechados através da plataforma no fim do mês."
                : "Você paga uma mensalidade fixa mensal com acesso ilimitado à plataforma."}
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full sm:w-auto shrink-0">
            <Button className="w-full bg-slate-900 text-white hover:bg-slate-800" disabled>
              {plan === "percentage" ? "Alterar para Mensalidade Fixa" : "Alterar para Porcentagem"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="font-mono text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5 text-slate-500" /> Histórico de Faturas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              <FileText className="h-10 w-10 mx-auto mb-2 text-slate-300" />
              <p>Nenhuma fatura gerada ainda.</p>
              <p className="text-xs mt-1">As faturas serão geradas ao final de cada ciclo.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice: any) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.description || "Fatura"}</TableCell>
                    <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                    <TableCell className="text-right font-mono font-bold">
                      {formatCurrency(invoice.amount)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className={INVOICE_STATUS_COLORS[invoice.status] || ""}
                      >
                        {INVOICE_STATUS_LABELS[invoice.status] || invoice.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
