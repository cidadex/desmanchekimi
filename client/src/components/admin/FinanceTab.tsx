import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, ArrowUpRight, ArrowDownRight, CreditCard, TrendingUp } from "lucide-react";

const transactions = [
  { id: "TRX-1029", company: "AutoPeças São Paulo", type: "Assinatura Mensal", amount: "R$ 299,00", date: "Hoje", status: "Pago" },
  { id: "TRX-1028", company: "Desmanche Irmãos Silva", type: "Comissão (Venda Motor)", amount: "R$ 150,00", date: "Hoje", status: "Pago" },
  { id: "TRX-1027", company: "AeroParts Brasil", type: "Assinatura Anual", amount: "R$ 2.990,00", date: "Ontem", status: "Pendente" },
  { id: "TRX-1026", company: "MotoPeças Express", type: "Comissão (Venda Farol)", amount: "R$ 45,00", date: "Ontem", status: "Pago" },
];

export default function FinanceTab() {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground">Gestão de assinaturas e comissões recebidas.</p>
        </div>
        <Button>Exportar Relatório Fiscal</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-primary">Receita Bruta (Mês)</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">R$ 84.520,00</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center text-green-600 font-medium">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +12.5% vs. último mês
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assinaturas Ativas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">612</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center text-green-600 font-medium">
              <ArrowUpRight className="h-3 w-3 mr-1" /> +8 novas hoje
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Pendente</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">R$ 4.250,00</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center text-red-500 font-medium">
              <ArrowDownRight className="h-3 w-3 mr-1" /> 12 faturas atrasadas
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 shadow-sm mt-6">
        <CardHeader>
          <CardTitle className="font-mono">Últimas Transações</CardTitle>
          <CardDescription>Histórico de pagamentos de desmanches para a plataforma.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transação</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((trx) => (
                <TableRow key={trx.id}>
                  <TableCell className="font-mono text-xs text-muted-foreground">{trx.id}</TableCell>
                  <TableCell className="font-medium">{trx.company}</TableCell>
                  <TableCell>{trx.type}</TableCell>
                  <TableCell className="text-muted-foreground">{trx.date}</TableCell>
                  <TableCell className="text-right font-medium">{trx.amount}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={trx.status === "Pago" ? "default" : "outline"} className={trx.status === "Pago" ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" : "text-yellow-600 border-yellow-200 bg-yellow-50"}>
                      {trx.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}