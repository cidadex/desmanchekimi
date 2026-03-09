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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, CheckCircle2 } from "lucide-react";

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
  const { toast } = useToast();
  
  const [clientForm, setClientForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  
  const [desmancheForm, setDesmancheForm] = useState({
    companyName: "",
    tradingName: "",
    cnpj: "",
    email: "",
    phone: "",
    password: "",
    plan: "percentage" as "percentage" | "monthly",
    responsibleName: "",
    responsibleCpf: "",
  });

  const [alvaraFile, setAlvaraFile] = useState<File | null>(null);
  const [docResponsavelFile, setDocResponsavelFile] = useState<File | null>(null);
  const [docEmpresaFile, setDocEmpresaFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const { register, registerDesmanche, isLoading } = useAuth();
  const [, navigate] = useLocation();

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(clientForm);
      setOpen(false);
      navigate("/cliente");
    } catch (error) {
    }
  };

  const uploadFile = async (file: File): Promise<{ url: string; originalName: string }> => {
    const token = localStorage.getItem("peca_rapida_token");
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Upload failed");
    }

    return res.json();
  };

  const registerDocument = async (desmancheId: string, type: string, name: string, url: string) => {
    const token = localStorage.getItem("peca_rapida_token");
    const res = await fetch("/api/documents", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ desmancheId, type, name, url }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Failed to register document");
    }

    return res.json();
  };

  const handleDesmancheSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!alvaraFile || !docResponsavelFile || !docEmpresaFile) {
      toast({
        title: "Documentos obrigatórios",
        description: "Por favor, envie todos os 3 documentos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    try {
      const user = await registerDesmanche(desmancheForm);

      setUploading(true);

      const desmancheId = (user as any)?.id || (user as any)?.desmancheId;

      const filesToUpload = [
        { file: alvaraFile, type: "alvara", name: "Alvará de Funcionamento" },
        { file: docResponsavelFile, type: "documento_responsavel", name: "Documento do Responsável" },
        { file: docEmpresaFile, type: "documento_empresa", name: "Documento da Empresa / Contrato Social" },
      ];

      for (const { file, type, name } of filesToUpload) {
        const uploadResult = await uploadFile(file);
        await registerDocument(desmancheId, type, name, uploadResult.url);
      }

      setUploading(false);
      toast({
        title: "Cadastro completo!",
        description: "Desmanche cadastrado com documentos. Aguardando aprovação.",
      });
      setOpen(false);
      navigate("/desmanche");
    } catch (error) {
      setUploading(false);
    }
  };

  const isSubmitting = isLoading || uploading;

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
                <Label htmlFor="desmanche-responsible-name">Nome do Responsável</Label>
                <Input
                  id="desmanche-responsible-name"
                  placeholder="João da Silva"
                  value={desmancheForm.responsibleName}
                  onChange={(e) => setDesmancheForm({ ...desmancheForm, responsibleName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desmanche-responsible-cpf">CPF do Responsável</Label>
                <Input
                  id="desmanche-responsible-cpf"
                  placeholder="000.000.000-00"
                  value={desmancheForm.responsibleCpf}
                  onChange={(e) => setDesmancheForm({ ...desmancheForm, responsibleCpf: e.target.value })}
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

              <div className="space-y-3">
                <Label>Documentos Obrigatórios</Label>
                
                <div className="space-y-2">
                  <Label htmlFor="file-alvara" className="text-sm">Alvará de Funcionamento *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="file-alvara"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setAlvaraFile(e.target.files?.[0] || null)}
                      required
                      className="flex-1"
                    />
                    {alvaraFile && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file-doc-responsavel" className="text-sm">Documento do Responsável *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="file-doc-responsavel"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setDocResponsavelFile(e.target.files?.[0] || null)}
                      required
                      className="flex-1"
                    />
                    {docResponsavelFile && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="file-doc-empresa" className="text-sm">Documento da Empresa / Contrato Social *</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="file-doc-empresa"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setDocEmpresaFile(e.target.files?.[0] || null)}
                      required
                      className="flex-1"
                    />
                    {docEmpresaFile && <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />}
                  </div>
                </div>
              </div>
              
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {uploading ? "Enviando documentos..." : "Cadastrando..."}
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
