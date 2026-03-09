import { useState } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Info } from "lucide-react";

interface LoginModalProps {
  children?: React.ReactNode;
  defaultOpen?: boolean;
}

function TestCredentials({ email, password }: { email: string; password: string }) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-muted/60 border border-border px-3 py-2 text-xs text-muted-foreground">
      <Info className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary/70" />
      <div>
        <span className="font-semibold text-foreground/70">Acesso de teste:</span>
        <br />
        <span className="font-mono">{email}</span>
        <br />
        <span className="font-mono">Senha: {password}</span>
      </div>
    </div>
  );
}

export function LoginModal({ children, defaultOpen = false }: LoginModalProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState<"client" | "desmanche" | "admin">("client");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAuth();
  const [, navigate] = useLocation();

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as "client" | "desmanche" | "admin");
    setEmail("");
    setPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password, activeTab === "desmanche" ? "desmanche" : "user");
      setOpen(false);
      if (activeTab === "desmanche") {
        navigate("/desmanche");
      } else if (activeTab === "admin") {
        navigate("/admin");
      } else {
        navigate("/cliente");
      }
    } catch (error) {
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Entrar na plataforma</DialogTitle>
          <DialogDescription>
            Acesse sua conta para gerenciar pedidos e propostas.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="client">Cliente</TabsTrigger>
            <TabsTrigger value="desmanche">Desmanche</TabsTrigger>
            <TabsTrigger value="admin">Admin</TabsTrigger>
          </TabsList>

          <TabsContent value="client">
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <TestCredentials email="recriarme@gmail.com" password="debora123" />
              <div className="space-y-2">
                <Label htmlFor="client-email">Email</Label>
                <Input
                  id="client-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-password">Senha</Label>
                <Input
                  id="client-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar como Cliente"
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="desmanche">
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <TestCredentials email="contato@irmaossilva.com" password="desmanche123" />
              <div className="space-y-2">
                <Label htmlFor="desmanche-email">Email do Desmanche</Label>
                <Input
                  id="desmanche-email"
                  type="email"
                  placeholder="contato@seudesmanche.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desmanche-password">Senha</Label>
                <Input
                  id="desmanche-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar como Desmanche"
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="admin">
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <TestCredentials email="admin@centraldesmanches.com" password="admin123" />
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email do Administrador</Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@centraldesmanches.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Senha</Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar como Admin"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
