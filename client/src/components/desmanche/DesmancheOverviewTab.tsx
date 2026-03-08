import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { PackageSearch, DollarSign, Handshake, CheckCircle2, ArrowRight, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const vendasData = [
  { name: 'Seg', valor: 1200 },
  { name: 'Ter', valor: 2100 },
  { name: 'Qua', valor: 800 },
  { name: 'Qui', valor: 3400 },
  { name: 'Sex', valor: 2800 },
  { name: 'Sáb', valor: 1500 },
  { name: 'Dom', valor: 0 },
];

export default function DesmancheOverviewTab({ onNavigate }: { onNavigate: (tab: string) => void }) {
  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Welcome & Alerts */}
      <div className="flex flex-col md:flex-row gap-6 justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold font-mono text-slate-900 tracking-tight">Olá, Irmãos Silva!</h1>
          <p className="text-slate-500 mt-1">Aqui está o resumo das suas negociações na plataforma hoje.</p>
        </div>

        {/* CNH Expiry Alert */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-4 max-w-md">
          <div className="bg-amber-100 p-2 rounded-full text-amber-600 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-semibold text-amber-900 text-sm">Alvará vence em 15 dias</h4>
            <p className="text-amber-700 text-xs mt-1 mb-2">Seu Alvará de Funcionamento precisa ser renovado para você continuar recebendo pedidos.</p>
            <Button variant="outline" size="sm" className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => onNavigate('docs')}>
              Atualizar Documento
            </Button>
          </div>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Vendas (Mês)</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-slate-900">R$ 14.850</div>
            <p className="text-xs text-green-600 mt-1 font-medium flex items-center">
              +15% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Em Negociação</CardTitle>
            <Handshake className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-slate-900">R$ 3.200</div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              8 propostas enviadas ativas
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">Peças Vendidas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-slate-900">42</div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Peças despachadas neste mês
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-primary">Oportunidades Hoje</CardTitle>
            <PackageSearch className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-primary">14</div>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Novos pedidos compatíveis com você
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Chart */}
        <Card className="md:col-span-2 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="font-mono text-lg">Performance de Vendas (Semana)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendasData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Quick Action - Recent Matches */}
        <Card className="border-slate-200 shadow-sm bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <PackageSearch className="w-32 h-32" />
          </div>
          <CardHeader className="relative z-10">
            <CardTitle className="font-mono text-xl text-white">Match de Peças</CardTitle>
            <CardDescription className="text-slate-400">Pedidos urgentes que batem com seu estoque principal.</CardDescription>
          </CardHeader>
          <CardContent className="relative z-10 space-y-4">
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <div className="text-sm font-bold text-blue-400 mb-1">Câmbio Automático Corolla 2018</div>
              <div className="text-xs text-slate-300">Cliente em São Paulo (Aprox. 20km)</div>
              <Button size="sm" className="w-full mt-3 bg-white text-slate-900 hover:bg-slate-200" onClick={() => onNavigate('orders')}>
                Fazer Proposta
              </Button>
            </div>
            <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700">
              <div className="text-sm font-bold text-blue-400 mb-1">Farol Esquerdo HB20 2022</div>
              <div className="text-xs text-slate-300">Cliente no Rio de Janeiro</div>
              <Button size="sm" className="w-full mt-3 bg-slate-700 text-white hover:bg-slate-600 border border-slate-600" onClick={() => onNavigate('orders')}>
                Ver Detalhes
              </Button>
            </div>
            
            <Button variant="link" className="w-full text-slate-400 hover:text-white mt-2" onClick={() => onNavigate('orders')}>
              Ver todos os 14 pedidos <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}