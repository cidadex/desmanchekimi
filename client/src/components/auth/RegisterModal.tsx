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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

interface RegisterModalProps {
  children?: React.ReactNode;
  defaultOpen?: boolean;
  defaultTab?: "client" | "desmanche";
}

export function RegisterModal({ 
  children, 
  defaultOpen = false,
  defaultTab = "client" 
}: RegisterModalProps) {
  const [open, setOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState<"client" | "desmanche">(defaultTab);
  
  // Client form state
  const [clientForm, setClientForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  
  // Desmanche form state
  const [desmancheForm, setDesmancheForm] = useState({
    companyName: "",
    tradingName: "",
    cnpj: "",
    email: "",
    phone: "",
    password: "",
    plan: "percentage" as "percentage" | "monthly",
  });
  
  const { register, registerDesmanche, isLoading } = useAuth();
  const [, navigate] = useLocation();

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(clientForm);
      setOpen(false);
      navigate("/cliente");
    } catch (error) {
      // Error is handled by the auth hook
    }
  };

  const handleDesmancheSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerDesmanche(desmancheForm);
      setOpen(false);
      navigate("/desmanche");
    } catch (error) {
      // Error is handled by the auth hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar nova conta</DialogTitle>
          <DialogDescription>
            Cadastre-se para começar a usar a plataforma.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "client" | "desmanche")} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="client">Sou Cliente</TabsTrigger>
            <TabsTrigger value="desmanche">Sou Desmanche</TabsTrigger>
          </TabsList>
          
          <TabsContent value="client">
            <form onSubmit={handleClientSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="client-name">Nome completo</Label>
                <Input
                  id="client-name"
                  placeholder="Seu nome"
                  value={clientForm.name}
                  onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-email">Email</Label>
                <Input
                  id="client-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={clientForm.email}
                  onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-phone">Telefone / WhatsApp</Label>
                <Input
                  id="client-phone"
                  placeholder="(11) 99999-9999"
                  value={clientForm.phone}
                  onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="client-password">Senha</Label>
                <Input
                  id="client-password"
                  type="password"
                  placeholder="••••••••"
                  value={clientForm.password}
                  onChange={(e) => setClientForm({ ...clientForm, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  "Criar conta de Cliente"
                )}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="desmanche">
            <form onSubmit={handleDesmancheSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="desmanche-company">Razão Social</Label>
                <Input
                  id="desmanche-company"
                  placeholder="Desmanche Silva Ltda"
                  value={desmancheForm.companyName}
                  onChange={(e) => setDesmancheForm({ ...desmancheForm, companyName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desmanche-trading">Nome Fantasia</Label>
                <Input
                  id="desmanche-trading"
                  placeholder="Silva Peças"
                  value={desmancheForm.tradingName}
                  onChange={(e) => setDesmancheForm({ ...desmancheForm, tradingName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desmanche-cnpj">CNPJ</Label>
                <Input
                  id="desmanche-cnpj"
                  placeholder="00.000.000/0000-00"
                  value={desmancheForm.cnpj}
                  onChange={(e) => setDesmancheForm({ ...desmancheForm, cnpj: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desmanche-email">Email</Label>
                <Input
                  id="desmanche-email"
                  type="email"
                  placeholder="contato@seudesmanche.com"
                  value={desmancheForm.email}
                  onChange={(e) => setDesmancheForm({ ...desmancheForm, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desmanche-phone">Telefone / WhatsApp</Label>
                <Input
                  id="desmanche-phone"
                  placeholder="(11) 99999-9999"
                  value={desmancheForm.phone}
                  onChange={(e) => setDesmancheForm({ ...desmancheForm, phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desmanche-password">Senha</Label>
                <Input
                  id="desmanche-password"
                  type="password"
                  placeholder="••••••••"
                  value={desmancheForm.password}
                  onChange={(e) => setDesmancheForm({ ...desmancheForm, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              
              <div className="space-y-3">
                <Label>Plano de Pagamento</Label>
                <RadioGroup
                  value={desmancheForm.plan}
                  onValueChange={(v) => setDesmancheForm({ ...desmancheForm, plan: v as "percentage" | "monthly" })}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-muted">
                    <RadioGroupItem value="percentage" id="plan-percentage" />
                    <Label htmlFor="plan-percentage" className="cursor-pointer flex-1">
                      <div className="font-medium">Porcentagem sobre vendas</div>
                      <div className="text-sm text-muted-foreground">Pague apenas quando vender (recomendado)</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 border p-3 rounded-lg cursor-pointer hover:bg-muted">
                    <RadioGroupItem value="monthly" id="plan-monthly" />
                    <Label htmlFor="plan-monthly" className="cursor-pointer flex-1">
                      <div className="font-medium">Mensalidade fixa</div>
                      <div className="text-sm text-muted-foreground">Valor fixo mensal ilimitado</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Cadastrando...
                  </>
                ) : (
                  "Cadastrar Desmanche"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
