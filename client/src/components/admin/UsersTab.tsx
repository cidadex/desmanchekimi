import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Mail, Phone, Calendar } from "lucide-react";

const usersData = [
  { id: "U-1029", name: "Carlos Eduardo", email: "carlos.edu@email.com", phone: "(11) 98888-7777", requests: 12, joined: "Há 2 meses" },
  { id: "U-1030", name: "Ana Silva", email: "ana.silva@email.com", phone: "(21) 97777-6666", requests: 3, joined: "Há 1 mês" },
  { id: "U-1031", name: "Roberto Almeida", email: "roberto@oficina.com", phone: "(41) 96666-5555", requests: 45, joined: "Há 1 ano" },
  { id: "U-1032", name: "Mariana Costa", email: "mari.costa@email.com", phone: "(31) 95555-4444", requests: 1, joined: "Hoje" },
];

export default function UsersTab() {
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
          <Input placeholder="Buscar usuário por nome, email ou telefone..." className="pl-9" />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {usersData.map((user) => (
          <Card key={user.id} className="hover:border-primary/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <Avatar className="h-12 w-12 border-2 border-primary/10">
                  <AvatarFallback className="bg-primary/5 text-primary font-bold">
                    {user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted px-2 py-1 rounded text-xs font-mono text-muted-foreground">
                  {user.id}
                </div>
              </div>
              
              <h3 className="font-bold text-lg leading-none mb-1">{user.name}</h3>
              
              <div className="space-y-2 mt-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{user.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Membro: {user.joined}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <div className="text-sm">
                  <span className="font-bold text-foreground">{user.requests}</span> pedidos
                </div>
                <Button variant="outline" size="sm" className="h-8 text-xs">Ver Perfil</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}