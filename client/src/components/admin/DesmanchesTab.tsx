import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ChevronRight, Loader2, AlertTriangle } from "lucide-react";

const ALERT_DAYS = 30;
const EXPIRY_DOC_TYPES = ["alvara", "credenciamento_detran"];

function getDaysUntilExpiry(validUntil: number | null | undefined): number | null {
  if (!validUntil) return null;
  const now = Date.now();
  return Math.floor((validUntil * 1000 - now) / (1000 * 60 * 60 * 24));
}

function hasExpiringDocs(documents: any[]): { expiring: boolean; expired: boolean; label: string } {
  const relevant = (documents || []).filter((d: any) => EXPIRY_DOC_TYPES.includes(d.type) && d.validUntil);
  const days = relevant.map((d: any) => ({ doc: d, daysLeft: getDaysUntilExpiry(d.validUntil) }));
  const expired = days.filter((x) => x.daysLeft !== null && x.daysLeft < 0);
  const expiring = days.filter((x) => x.daysLeft !== null && x.daysLeft >= 0 && x.daysLeft <= ALERT_DAYS);

  if (expired.length > 0) {
    const names = expired.map((x) => x.doc.type === "alvara" ? "Alvará" : "Detran").join(", ");
    return { expiring: true, expired: true, label: `Vencido: ${names}` };
  }
  if (expiring.length > 0) {
    const minDays = Math.min(...expiring.map((x) => x.daysLeft as number));
    const names = expiring.map((x) => x.doc.type === "alvara" ? "Alvará" : "Detran").join(", ");
    return { expiring: true, expired: false, label: `A vencer em ${minDays}d: ${names}` };
  }
  return { expiring: false, expired: false, label: "" };
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    active: "bg-green-500/10 text-green-600 hover:bg-green-500/20",
    pending: "bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20",
    rejected: "bg-red-500/10 text-red-600 hover:bg-red-500/20",
    inactive: "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20",
  };
  const labelMap: Record<string, string> = {
    active: "Ativo",
    pending: "Pendente",
    rejected: "Rejeitado",
    inactive: "Inativo",
  };
  return (
    <Badge variant="secondary" className={map[status] || ""}>
      {labelMap[status] || status}
    </Badge>
  );
}

export default function DesmanchesTab({ onSelectDesmanche }: { onSelectDesmanche?: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: desmanches = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/desmanches"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/desmanches");
      return res.json();
    },
  });

  const filtered = desmanches.filter((d: any) => {
    const matchesSearch =
      !search ||
      (d.tradingName || d.companyName || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.cnpj || "").includes(search);
    const matchesStatus = statusFilter === "all" || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const expiringCount = desmanches.filter((d: any) => hasExpiringDocs(d.documents || []).expiring).length;

  const statuses = ["all", "active", "pending", "rejected", "inactive"];
  const statusLabels: Record<string, string> = {
    all: "Todos",
    active: "Ativos",
    pending: "Pendentes",
    rejected: "Rejeitados",
    inactive: "Inativos",
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tight">Desmanches Credenciados</h1>
          <p className="text-muted-foreground">Gerencie as empresas ativas na plataforma.</p>
        </div>
        {expiringCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-medium">
            <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />
            {expiringCount} desmanche{expiringCount !== 1 ? "s" : ""} com documentação próxima do vencimento
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {statuses.map((s) => (
          <Badge
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setStatusFilter(s)}
          >
            {statusLabels[s]}
          </Badge>
        ))}
      </div>

      <Card className="border-2">
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b pb-4">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, CNPJ..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            Total: <span className="font-bold text-foreground">{filtered.length}</span> desmanches
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum desmanche encontrado.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="pl-6">ID</TableHead>
                  <TableHead>Nome Fantasia</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Localização</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Avaliação</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Documentação</TableHead>
                  <TableHead className="text-right pr-6">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((d: any) => {
                  const location = d.address
                    ? `${d.address.city || ""}, ${d.address.state || ""}`.replace(/^, |, $/g, "")
                    : "—";
                  const docAlert = hasExpiringDocs(d.documents || []);
                  return (
                    <TableRow
                      key={d.id}
                      className={`cursor-pointer hover:bg-muted/60 transition-colors ${docAlert.expiring ? "bg-red-50/40" : ""}`}
                      onClick={() => onSelectDesmanche?.(d.id)}
                    >
                      <TableCell className="pl-6 font-mono text-xs text-muted-foreground">D-{String(d.id).slice(0,8)}</TableCell>
                      <TableCell className="font-medium">{d.tradingName || d.companyName || "—"}</TableCell>
                      <TableCell className="text-muted-foreground font-mono text-xs">{d.cnpj || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{location}</TableCell>
                      <TableCell>{d.plan || "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-500">★</span>
                          <span className="font-medium">{d.rating ?? "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell>{statusBadge(d.status)}</TableCell>
                      <TableCell>
                        {docAlert.expiring ? (
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle className={`h-4 w-4 shrink-0 ${docAlert.expired ? "text-red-600" : "text-orange-500"}`} />
                            <span className={`text-xs font-semibold ${docAlert.expired ? "text-red-600" : "text-orange-600"}`}>
                              {docAlert.label}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <ChevronRight className="h-4 w-4 text-muted-foreground inline" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
