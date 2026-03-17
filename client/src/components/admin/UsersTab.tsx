import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Mail, Phone, Calendar, ChevronRight } from "lucide-react";

function formatMemberSince(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Há 1 dia";
  if (diffDays < 30) return `Há ${diffDays} dias`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return "Há 1 mês";
  if (diffMonths < 12) return `Há ${diffMonths} meses`;
  const diffYears = Math.floor(diffMonths / 12);
  if (diffYears === 1) return "Há 1 ano";
  return `Há ${diffYears} anos`;
}

function typeBadge(type: string) {
  switch (type) {
    case "admin":
      return <Badge variant="destructive">Admin</Badge>;
    case "desmanche":
      return <Badge variant="secondary">Desmanche</Badge>;
    default:
      return <Badge variant="outline">Cliente</Badge>;
  }
}

export default function UsersTab({ onSelectUser }: { onSelectUser?: (id: string) => void }) {
  const [search, setSearch] = useState("");

  const { data: users = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      return res.json();
    },
  });

  const filtered = users.filter((user: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (user.name || "").toLowerCase().includes(q) ||
      (user.email || "").toLowerCase().includes(q) ||
      (user.phone || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tight">Pessoas Cadastradas</h1>
          <p className="text-muted-foreground">Compradores e mecânicos que buscam peças na plataforma.</p>
        </div>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar usuário por nome, email ou telefone..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando usuários...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Nenhum usuário encontrado.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {filtered.map((user: any) => (
            <Card
              key={user.id}
              className="hover:border-primary/50 transition-colors cursor-pointer hover:shadow-sm"
              onClick={() => onSelectUser?.(user.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <Avatar className="h-12 w-12 border-2 border-primary/10">
                    <AvatarFallback className="bg-primary/5 text-primary font-bold">
                      {(user.name || "U")
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2">
                    {typeBadge(user.type)}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <h3 className="font-bold text-lg leading-none mb-1">{user.name}</h3>

                <div className="space-y-2 mt-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{user.phone}</span>
                    </div>
                  )}
                  {user.createdAt && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Membro: {formatMemberSince(user.createdAt)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
