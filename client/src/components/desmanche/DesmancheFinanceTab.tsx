import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreditCard, Download, Receipt } from "lucide-react";

export default function DesmancheFinanceTab() {
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
            <h2 className="text-2xl font-bold text-slate-900">Porcentagem sobre Vendas</h2>
            <p className="text-slate-600 mt-2 max-w-md">
              Você não paga mensalidade fixa. Será cobrada uma taxa de <strong>3.5%</strong> sobre os negócios fechados através da plataforma no fim do mês.
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full sm:w-auto shrink-0">
            <Button className="w-full bg-slate-900 text-white hover:bg-slate-800">
              Alterar para Mensalidade Fixa
            </Button>
            <Button variant="outline" className="w-full bg-white">
              Configurar Cartão de Crédito
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm mt-8">
        <CardHeader>
          <CardTitle className="font-mono text-lg flex items-center gap-2">
            <Receipt className="w-5 h-5 text-slate-500" /> Histórico de Faturas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Mês Referência</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead className="text-right">Valor</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Outubro / 2024</TableCell>
                <TableCell className="text-slate-500">Comissão (3.5% s/ R$ 14.850)</TableCell>
                <TableCell>05/11/2024</TableCell>
                <TableCell className="text-right font-mono font-bold">R$ 519,75</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">A Vencer</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" className="text-blue-600"><Download className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Setembro / 2024</TableCell>
                <TableCell className="text-slate-500">Comissão (3.5% s/ R$ 12.100)</TableCell>
                <TableCell>05/10/2024</TableCell>
                <TableCell className="text-right font-mono font-bold text-slate-500">R$ 423,50</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Pago</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" className="text-slate-400"><Download className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Agosto / 2024</TableCell>
                <TableCell className="text-slate-500">Comissão (3.5% s/ R$ 9.800)</TableCell>
                <TableCell>05/09/2024</TableCell>
                <TableCell className="text-right font-mono font-bold text-slate-500">R$ 343,00</TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Pago</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="ghost" className="text-slate-400"><Download className="w-4 h-4" /></Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}