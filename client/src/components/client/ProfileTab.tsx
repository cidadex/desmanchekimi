import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Phone,
  MessageCircle,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Save,
  Loader2,
} from "lucide-react";

export function ProfileTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || "");

  const [zipCode, setZipCode] = useState(user?.address?.zipCode || "");
  const [street, setStreet] = useState(user?.address?.street || "");
  const [number, setNumber] = useState(user?.address?.number || "");
  const [complement, setComplement] = useState(user?.address?.complement || "");
  const [city, setCity] = useState(user?.address?.city || "");
  const [state, setState] = useState(user?.address?.state || "");

  const profileMutation = useMutation({
    mutationFn: async (data: { name: string; phone: string; whatsapp: string }) => {
      const res = await apiRequest("PATCH", "/api/users/me", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      toast({ title: "Perfil atualizado", description: "Seus dados foram salvos." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível salvar.", variant: "destructive" });
    },
  });

  const addressMutation = useMutation({
    mutationFn: async (data: {
      zipCode: string;
      street: string;
      number?: string;
      complement?: string;
      city: string;
      state: string;
    }) => {
      const res = await apiRequest("PUT", "/api/users/me/address", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      toast({ title: "Endereço salvo", description: "Seu endereço foi atualizado." });
    },
    onError: () => {
      toast({ title: "Erro", description: "Não foi possível salvar o endereço.", variant: "destructive" });
    },
  });

  const fetchCep = async (cep: string) => {
    const cleaned = cep.replace(/\D/g, "");
    if (cleaned.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleaned}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setStreet(data.logradouro || "");
        setCity(data.localidade || "");
        setState(data.uf || "");
        setComplement(data.complemento || "");
      }
    } catch {}
  };

  const handleSaveProfile = () => {
    profileMutation.mutate({ name, phone, whatsapp });
  };

  const handleSaveAddress = () => {
    if (!zipCode || !street || !city || !state) {
      toast({ title: "Campos obrigatórios", description: "Preencha CEP, rua, cidade e estado.", variant: "destructive" });
      return;
    }
    addressMutation.mutate({ zipCode, street, number, complement, city, state });
  };

  const isProfileComplete = user?.profileComplete;

  return (
    <div className="space-y-6">
      {!isProfileComplete && (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-semibold text-yellow-800 dark:text-yellow-200">
                  Complete seu perfil para negociar peças
                </p>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Você precisa informar seu WhatsApp e endereço completo para enviar pedidos e receber propostas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {isProfileComplete && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="font-semibold text-green-800 dark:text-green-200">
                Perfil completo! Você pode criar pedidos e negociar peças.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Dados Pessoais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" value={user?.email || ""} disabled className="bg-muted" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1">
                <Phone className="h-3 w-3" /> Telefone
              </Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-9999" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="whatsapp" className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3 text-green-600" /> WhatsApp
                {!whatsapp && <Badge variant="destructive" className="ml-1 text-xs">Obrigatório</Badge>}
              </Label>
              <Input
                id="whatsapp"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
          <Button onClick={handleSaveProfile} disabled={profileMutation.isPending}>
            {profileMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Dados Pessoais
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Endereço
            {!user?.address && <Badge variant="destructive" className="ml-2 text-xs">Obrigatório</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zipCode">CEP</Label>
              <Input
                id="zipCode"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                onBlur={(e) => fetchCep(e.target.value)}
                placeholder="00000-000"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="street">Rua / Avenida</Label>
              <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="number">Número</Label>
              <Input id="number" value={number} onChange={(e) => setNumber(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="complement">Complemento</Label>
              <Input id="complement" value={complement} onChange={(e) => setComplement(e.target.value)} placeholder="Apto, Bloco..." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">Estado</Label>
              <Input id="state" value={state} onChange={(e) => setState(e.target.value)} placeholder="SP" maxLength={2} />
            </div>
          </div>
          <Button onClick={handleSaveAddress} disabled={addressMutation.isPending}>
            {addressMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Endereço
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
