import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Camera, MapPin, ExternalLink } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

function buildMapUrl(address: { street: string; number: string; city: string; state: string; zipCode: string }) {
  const parts = [
    address.street,
    address.number,
    address.city,
    address.state,
    "Brasil",
  ].filter(Boolean).join(", ");
  const encoded = encodeURIComponent(parts);
  return {
    embedUrl: `https://maps.google.com/maps?q=${encoded}&t=&z=15&ie=UTF8&iwloc=&output=embed`,
    directUrl: `https://www.google.com/maps/search/?api=1&query=${encoded}`,
  };
}

export default function DesmancheProfileTab() {
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

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

  const [showMap, setShowMap] = useState(false);

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
      if (desmanche.logo) setLogoPreview(desmanche.logo);
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
      if (address.street && address.city) setShowMap(true);
    }
  }, [address]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PATCH", "/api/desmanches/me", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "Perfil atualizado com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["/api/desmanches/me"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message || "Falha ao atualizar perfil", variant: "destructive" });
    },
  });

  const updateAddressMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("PUT", "/api/desmanches/me/address", data);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "Endereço atualizado com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["/api/desmanches/me/address"] });
      if (addressData.street && addressData.city) setShowMap(true);
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message || "Falha ao atualizar endereço", variant: "destructive" });
    },
  });

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Arquivo muito grande", description: "O logo deve ter no máximo 2MB.", variant: "destructive" });
      return;
    }
    setLogoUploading(true);
    try {
      const token = localStorage.getItem("peca_rapida_token");
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error("Falha no upload");
      const { url } = await res.json();
      setLogoPreview(url);
      await updateProfileMutation.mutateAsync({ logo: url });
    } catch {
      toast({ title: "Erro no upload", description: "Não foi possível enviar o logo.", variant: "destructive" });
    } finally {
      setLogoUploading(false);
    }
  };

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

  const mapUrls = (addressData.street && addressData.city)
    ? buildMapUrl(addressData)
    : null;

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
            {/* Logo Upload */}
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative group">
                <Avatar className="w-28 h-28 border-4 border-slate-100 shadow-md">
                  <AvatarImage src={logoPreview || desmanche?.logo} className="object-cover" />
                  <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  disabled={logoUploading}
                >
                  {logoUploading
                    ? <Loader2 className="h-6 w-6 text-white animate-spin" />
                    : <Camera className="h-6 w-6 text-white" />
                  }
                </button>
                <input
                  ref={logoInputRef}
                  type="file"
                  className="hidden"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoChange}
                />
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoUploading}
                  className="gap-2"
                >
                  {logoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  {logoUploading ? "Enviando..." : "Alterar Logo"}
                </Button>
                <p className="text-xs text-slate-500">PNG, JPG ou WebP — máx. 2MB.<br />Passe o mouse sobre a foto para editar.</p>
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
              <Button type="submit" className="bg-primary px-8" disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
                ) : "Salvar Dados"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Address + Map Card */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b bg-slate-50">
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> Endereço e Localização
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <form onSubmit={handleAddressSave} className="space-y-4">
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
                  maxLength={2}
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" className="bg-primary px-8" disabled={updateAddressMutation.isPending}>
                {updateAddressMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Salvando...</>
                ) : "Salvar Endereço"}
              </Button>
            </div>
          </form>

          {/* Map */}
          {showMap && mapUrls && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  Localização no Mapa
                </p>
                <a
                  href={mapUrls.directUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary flex items-center gap-1 hover:underline"
                >
                  Abrir no Google Maps <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm w-full" style={{ height: 300 }}>
                <iframe
                  title="Localização do Desmanche"
                  src={mapUrls.embedUrl}
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <p className="text-xs text-slate-400">
                {[addressData.street, addressData.number, addressData.city, addressData.state].filter(Boolean).join(", ")}
              </p>
            </div>
          )}

          {!showMap && (
            <div className="flex flex-col items-center justify-center py-8 gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400">
              <MapPin className="h-10 w-10 text-slate-300" />
              <p className="text-sm">Preencha o endereço acima e salve para ver o mapa.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
