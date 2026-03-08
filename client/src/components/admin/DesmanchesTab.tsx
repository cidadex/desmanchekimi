import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Filter, MoreHorizontal } from "lucide-react";

const desmanchesData = [
  { id: "D-001", name: "AutoPeças São Paulo", location: "São Paulo, SP", status: "Ativo", plan: "Porcentagem", rating: 4.8 },
  { id: "D-002", name: "Desmanche Irmãos Silva", location: "Campinas, SP", status: "Ativo", plan: "Mensalidade", rating: 4.5 },
  { id: "D-003", name: "AeroParts Brasil", location: "Rio de Janeiro, RJ", status: "Inativo", plan: "Mensalidade", rating: 3.9 },
  { id: "D-004", name: "MotoPeças Express", location: "Curitiba, SP", status: "Ativo", plan: "Porcentagem", rating: 4.9 },
  { id: "D-005", name: "Sul Peças Originais", location: "Porto Alegre, PR", status: "Ativo", plan: "Mensalidade", rating: 4.7 },
];

export default function DesmanchesTab() {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tight">Desmanches Credenciados</h1>
          <p className="text-muted-foreground">Gerencie as empresas ativas na plataforma.</p>
        </div>
        <Button>Adicionar Desmanche Manualmente</Button>
      </div>

      <Card className="border-2">
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome, CNPJ..." className="pl-9" />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Total: <span className="font-bold text-foreground">842</span> desmanches
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="pl-6">ID</TableHead>
                <TableHead>Nome Fantasia</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Avaliação</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {desmanchesData.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="pl-6 font-mono text-xs text-muted-foreground">{d.id}</TableCell>
                  <TableCell className="font-medium">{d.name}</TableCell>
                  <TableCell className="text-muted-foreground">{d.location}</TableCell>
                  <TableCell>{d.plan}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-500">★</span>
                      <span className="font-medium">{d.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={d.status === "Ativo" ? "default" : "secondary"} className={d.status === "Ativo" ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" : ""}>
                      {d.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
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