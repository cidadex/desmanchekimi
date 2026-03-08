import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function DesmancheProfileTab() {
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
          
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="w-24 h-24 border-4 border-slate-100 shadow-sm">
              <AvatarImage src="https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=200&h=200&fit=crop" />
              <AvatarFallback>IR</AvatarFallback>
            </Avatar>
            <div className="space-y-2 text-center sm:text-left">
              <Button variant="outline">Alterar Logo</Button>
              <p className="text-xs text-slate-500">A imagem deve ser PNG ou JPG, máx 2MB.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Nome Fantasia</Label>
              <Input defaultValue="Desmanche Irmãos Silva" />
            </div>
            <div className="space-y-2">
              <Label>CNPJ</Label>
              <Input defaultValue="98.765.432/0001-10" disabled className="bg-slate-50 text-slate-500" />
            </div>
            <div className="space-y-2">
              <Label>Telefone / WhatsApp (Para Vendas)</Label>
              <Input defaultValue="(11) 98888-5555" />
            </div>
            <div className="space-y-2">
              <Label>E-mail Comercial</Label>
              <Input defaultValue="vendas@irmaossilva.com.br" />
            </div>
          </div>

          <div className="space-y-2 border-t pt-6">
            <Label>Endereço Físico (Público para Retirada)</Label>
            <div className="grid md:grid-cols-3 gap-4 mt-2">
              <Input defaultValue="04555-000" placeholder="CEP" className="md:col-span-1" />
              <Input defaultValue="Av. Santo Amaro, 1234" placeholder="Endereço" className="md:col-span-2" />
              <Input defaultValue="São Paulo" placeholder="Cidade" className="md:col-span-2" />
              <Input defaultValue="SP" placeholder="Estado" className="md:col-span-1" />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button className="bg-primary px-8">Salvar Alterações</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}