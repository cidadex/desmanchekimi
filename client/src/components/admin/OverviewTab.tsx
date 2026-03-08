import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from "recharts";
import { Users, Store, Package, DollarSign, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const revenueData = [
  { name: 'Jan', total: 45000 },
  { name: 'Fev', total: 52000 },
  { name: 'Mar', total: 48000 },
  { name: 'Abr', total: 61000 },
  { name: 'Mai', total: 59000 },
  { name: 'Jun', total: 72000 },
  { name: 'Jul', total: 84000 },
];

const reqData = [
  { time: '08:00', requests: 120 },
  { time: '10:00', requests: 250 },
  { time: '12:00', requests: 410 },
  { time: '14:00', requests: 380 },
  { time: '16:00', requests: 520 },
  { time: '18:00', requests: 480 },
];

const pendingRequests = [
  { id: "REQ-001", company: "AutoPeças São Paulo", cnpj: "12.345.678/0001-90", status: "Aguardando Detran", date: "Hoje, 10:45" },
  { id: "REQ-002", company: "Desmanche Irmãos Silva", cnpj: "98.765.432/0001-10", status: "Em Análise", date: "Hoje, 09:20" },
  { id: "REQ-003", company: "AeroParts Brasil", cnpj: "45.123.890/0001-55", status: "Documentação Pendente", date: "Ontem" },
  { id: "REQ-004", company: "MotoPeças Express", cnpj: "33.444.555/0001-88", status: "Aguardando Detran", date: "Ontem" },
];

function MetricCard({ title, value, trend, icon }: any) {
  return (
    <Card className="shadow-sm border border-border/50 hover:border-border transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {trend}
        </p>
      </CardContent>
    </Card>
  );
}

export default function OverviewTab() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground">Acompanhe as métricas de negociações em tempo real.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Baixar Relatório</Button>
          <Button>Criar Campanha</Button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title="Receita Recorrente (MRR)" 
          value="R$ 84.520" 
          trend="+12.5% em relação ao mês anterior"
          icon={<DollarSign className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard 
          title="Desmanches Ativos" 
          value="842" 
          trend="+12 esta semana"
          icon={<Store className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard 
          title="Peças Negociadas (Mês)" 
          value="12,450" 
          trend="+18% taxa de conversão"
          icon={<Package className="h-4 w-4 text-muted-foreground" />}
        />
        <MetricCard 
          title="Usuários Procurando" 
          value="45,231" 
          trend="+4.200 nos últimos 7 dias"
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        {/* Main Chart */}
        <Card className="md:col-span-4 border-2 shadow-sm">
          <CardHeader>
            <CardTitle className="font-mono">Volume de Negociações x Receita</CardTitle>
            <CardDescription>Crescimento mensal da plataforma (2024)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value/1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Live Requests Chart */}
        <Card className="md:col-span-3 border-2 shadow-sm">
          <CardHeader>
            <CardTitle className="font-mono flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Pedidos de Peças (Hoje)
            </CardTitle>
            <CardDescription>Fluxo de solicitações nas últimas horas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reqData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="requests" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals Table */}
      <Card className="border-2 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle className="font-mono text-xl">Aprovações Pendentes (Desmanches)</CardTitle>
            <CardDescription>Empresas aguardando validação do Detran para entrar na rede.</CardDescription>
          </div>
          <Button variant="outline" size="sm" className="hidden sm:flex">
            Ver Todas <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Solicitação</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>CNPJ</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRequests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="font-mono font-medium text-xs">{req.id}</TableCell>
                  <TableCell className="font-medium">{req.company}</TableCell>
                  <TableCell className="text-muted-foreground">{req.cnpj}</TableCell>
                  <TableCell>
                    <Badge variant={req.status === "Em Análise" ? "default" : "secondary"} className="font-medium">
                      {req.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost">Revisar</Button>
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