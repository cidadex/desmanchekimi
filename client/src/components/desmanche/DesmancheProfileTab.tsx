import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function DesmancheProfileTab() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    tradingName: "",
    phone: "",
    email: "",
    cnpj: "",
    responsibleName: "",
    responsibleCpf: "",
  });

  const [addressData, setAddressData] = useState({
    zipCode: "",
    street: "",
    city: "",
    state: "",
    number: "",
    complement: "",
  });

  const { data: desmanche, isLoading } = useQuery({
    queryKey: ["/api/desmanches/me"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/desmanches/me");
      return res.json();
    },
  });

  const { data: address } = useQuery({
    queryKey: ["/api/desmanches/me/address"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/desmanches/me/address");
      return res.json();
    },
  });

  useEffect(() => {
    if (desmanche) {
      setFormData({
        tradingName: desmanche.tradingName || "",
        phone: desmanche.phone || "",
        email: desmanche.email || "",
        cnpj: desmanche.cnpj || "",
        responsibleName: desmanche.responsibleName || "",
        responsibleCpf: desmanche.responsibleCpf || "",
      });
    }
  }, [desmanche]);

  useEffect(() => {
    if (address) {
      setAddressData({
        zipCode: address.zipCode || "",
        street: address.street || "",
        city: address.city || "",
        state: address.state || "",
        number: address.number || "",
        complement: address.complement || "",
      });
    }
  }, [address]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/desmanches/me", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Perfil atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/desmanches/me"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar perfil",
        variant: "destructive",
      });
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", "/api/desmanches/me/address", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Endereço atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/desmanches/me/address"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Falha ao atualizar endereço",
        variant: "destructive",
      });
    },
  });

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfileMutation.mutateAsync({
      tradingName: formData.tradingName,
      phone: formData.phone,
      responsibleName: formData.responsibleName,
      responsibleCpf: formData.responsibleCpf,
    });
  };

  const handleAddressSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateAddressMutation.mutateAsync(addressData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const initials = desmanche?.tradingName
    ?.split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "IR";

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-mono text-slate-900 tracking-tight">Perfil da Empresa</h1>
        <p className="text-slate-500 mt-1">Gerencie como sua empresa aparece para os clientes.</p>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b bg-slate-50">
          <CardTitle className="text-lg">Informações Públicas</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-8">
          <form onSubmit={handleProfileSave} className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <Avatar className="w-24 h-24 border-4 border-slate-100 shadow-sm">
                <AvatarImage src={desmanche?.logo} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="space-y-2 text-center sm:text-left">
                <Button variant="outline" type="button" disabled>
                  Alterar Logo
                </Button>
                <p className="text-xs text-slate-500">A imagem deve ser PNG ou JPG, máx 2MB.</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Nome Fantasia</Label>
                <Input
                  value={formData.tradingName}
                  onChange={(e) => setFormData({ ...formData, tradingName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input value={formData.cnpj} disabled className="bg-slate-50 text-slate-500" />
              </div>
              <div className="space-y-2">
                <Label>Telefone / WhatsApp (Para Vendas)</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(11) 98888-8888"
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail Comercial</Label>
                <Input value={formData.email} disabled className="bg-slate-50 text-slate-500" />
              </div>
              <div className="space-y-2">
                <Label>Nome do Responsável</Label>
                <Input
                  value={formData.responsibleName}
                  onChange={(e) => setFormData({ ...formData, responsibleName: e.target.value })}
                  placeholder="João Silva"
                />
              </div>
              <div className="space-y-2">
                <Label>CPF do Responsável</Label>
                <Input
                  value={formData.responsibleCpf}
                  onChange={(e) => setFormData({ ...formData, responsibleCpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                className="bg-primary px-8"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Dados Pessoais"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b bg-slate-50">
          <CardTitle className="text-lg">Endereço</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleAddressSave} className="space-y-6">
            <div className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <Input
                    value={addressData.zipCode}
                    onChange={(e) => setAddressData({ ...addressData, zipCode: e.target.value })}
                    placeholder="00000-000"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Rua / Avenida</Label>
                  <Input
                    value={addressData.street}
                    onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
                    placeholder="Av. Principal"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input
                    value={addressData.number}
                    onChange={(e) => setAddressData({ ...addressData, number: e.target.value })}
                    placeholder="123"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Complemento</Label>
                  <Input
                    value={addressData.complement}
                    onChange={(e) => setAddressData({ ...addressData, complement: e.target.value })}
                    placeholder="Apto, sala, etc"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={addressData.city}
                    onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                    placeholder="São Paulo"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Input
                    value={addressData.state}
                    onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                    placeholder="SP"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                className="bg-primary px-8"
                disabled={updateAddressMutation.isPending}
              >
                {updateAddressMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Endereço"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
