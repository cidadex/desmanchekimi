import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { MapPin, MessageCircle, Package, Camera, Video, Truck, CheckCircle2, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const mockNegotiations = [
  { 
    id: "NEG-1042", 
    orderId: "PED-9923", 
    item: "Motor AP 1.8 Completo", 
    buyer: "Roberto Automotiva", 
    location: "Curitiba, PR", 
    status: "negociando",
    value: "R$ 3.500,00",
    lastMessage: "Você enviou uma proposta há 2 horas"
  },
  { 
    id: "NEG-1038", 
    orderId: "PED-9915", 
    item: "Caixa de Câmbio Automática", 
    buyer: "Auto Mecânica Silva", 
    location: "São Paulo, SP", 
    status: "aguardando_envio",
    value: "R$ 4.200,00",
    paid: true
  },
  { 
    id: "NEG-1025", 
    orderId: "PED-9890", 
    item: "Farol Direito Full LED", 
    buyer: "João Carlos", 
    location: "Belo Horizonte, MG", 
    status: "aguardando_avaliacao",
    value: "R$ 1.800,00",
    trackingCode: "BR987654321BR"
  },
  { 
    id: "NEG-1011", 
    orderId: "PED-9855", 
    item: "Porta Esquerda Dianteira", 
    buyer: "Oficina do Zé", 
    location: "Campinas, SP", 
    status: "enviado",
    value: "R$ 950,00",
    trackingCode: "BR123456789BR",
    deliveredAt: "Ontem, 14:30"
  },
];

export default function DesmancheNegotiationsTab() {
  const [activeTab, setActiveTab] = useState("todos");

  const filteredNegotiations = activeTab === "todos" 
    ? mockNegotiations 
    : mockNegotiations.filter(n => n.status === activeTab);

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div>
        <h1 className="text-3xl font-bold font-mono text-slate-900 tracking-tight">Minhas Negociações</h1>
        <p className="text-slate-500 mt-1">Acompanhe suas vendas desde o primeiro contato até a entrega.</p>
      </div>

      <Tabs defaultValue="todos" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 h-auto gap-2 bg-transparent p-0">
          <TabsTrigger value="todos" className="data-[state=active]:bg-primary data-[state=active]:text-white bg-slate-100 py-2">
            Todas
          </TabsTrigger>
          <TabsTrigger value="negociando" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white bg-slate-100 py-2">
            Negociando
          </TabsTrigger>
          <TabsTrigger value="aguardando_envio" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white bg-slate-100 py-2">
            Aguardando Envio
          </TabsTrigger>
          <TabsTrigger value="aguardando_avaliacao" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white bg-slate-100 py-2">
            Aguardando Avaliação
          </TabsTrigger>
          <TabsTrigger value="enviado" className="data-[state=active]:bg-green-600 data-[state=active]:text-white bg-slate-100 py-2">
            Peça Enviada
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 space-y-4">
          {filteredNegotiations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
              <Package className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-900">Nenhuma negociação nesta etapa</h3>
              <p className="text-slate-500">Você não tem negociações com este status no momento.</p>
            </div>
          ) : (
            filteredNegotiations.map((neg) => (
              <Card key={neg.id} className="overflow-hidden bg-white border-slate-200 hover:shadow-md transition-shadow">
                <CardContent className="p-0 flex flex-col md:flex-row">
                  
                  {/* Info Column */}
                  <div className="p-5 md:w-2/3 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-xs font-medium text-slate-400">{neg.id}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-mono text-xs font-medium text-slate-400">Ref: {neg.orderId}</span>
                      
                      {neg.status === 'negociando' && <Badge className="bg-blue-100 text-blue-800 border-blue-200 ml-auto md:ml-2">Negociando</Badge>}
                      {neg.status === 'aguardando_envio' && <Badge className="bg-orange-100 text-orange-800 border-orange-200 ml-auto md:ml-2">Pago - Enviar Peça</Badge>}
                      {neg.status === 'aguardando_avaliacao' && <Badge className="bg-purple-100 text-purple-800 border-purple-200 ml-auto md:ml-2">Em Trânsito / Avaliação</Badge>}
                      {neg.status === 'enviado' && <Badge className="bg-green-100 text-green-800 border-green-200 ml-auto md:ml-2">Concluído</Badge>}
                    </div>
                    
                    <h3 className="text-xl font-bold text-slate-900 leading-tight mb-1">{neg.item}</h3>
                    <div className="text-sm font-medium text-slate-600 mb-3 flex items-center gap-2">
                      <span className="font-semibold">{neg.buyer}</span>
                      <span className="text-slate-300">|</span>
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {neg.location}</span>
                    </div>
                    
                    <div className="text-lg font-bold text-primary">
                      {neg.value}
                    </div>
                  </div>
                  
                  {/* Action Column */}
                  <div className="p-5 md:w-1/3 flex flex-col justify-center gap-3 border-t md:border-t-0 md:border-l border-slate-100 bg-slate-50">
                    
                    {neg.status === 'negociando' && (
                      <>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {neg.lastMessage}
                        </p>
                        <Button className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white">
                          <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp Liberado
                        </Button>
                      </>
                    )}

                    {neg.status === 'aguardando_envio' && (
                      <>
                        <div className="bg-green-50 text-green-700 text-xs p-2 rounded flex items-center gap-2 mb-1">
                          <CheckCircle2 className="h-4 w-4 shrink-0" /> Cliente já efetuou o pagamento ao portal.
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                              <Package className="mr-2 h-4 w-4" /> Registrar Envio
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                              <DialogTitle>Registrar Envio da Peça</DialogTitle>
                              <DialogDescription>
                                Para liberar seu pagamento, envie os comprovantes da postagem. O cliente será notificado.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Código de Rastreio (Correios ou Transportadora)</Label>
                                <Input placeholder="Ex: BR123456789BR" />
                              </div>
                              <div className="space-y-2">
                                <Label>Foto do Pacote / Nota Fiscal</Label>
                                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 cursor-pointer transition-colors">
                                  <Camera className="h-8 w-8 mb-2 text-slate-400" />
                                  <span className="text-sm font-medium">Clique para enviar foto</span>
                                  <span className="text-xs">JPG, PNG até 5MB</span>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label>Vídeo da Peça Funcionando/Embalada (Opcional)</Label>
                                <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 cursor-pointer transition-colors">
                                  <Video className="h-8 w-8 mb-2 text-slate-400" />
                                  <span className="text-sm font-medium">Clique para enviar vídeo</span>
                                  <span className="text-xs">MP4 até 50MB</span>
                                </div>
                              </div>
                            </div>
                            <Button className="w-full bg-green-600 hover:bg-green-700">
                              Confirmar Envio <Truck className="ml-2 h-4 w-4" />
                            </Button>
                          </DialogContent>
                        </Dialog>
                      </>
                    )}

                    {neg.status === 'aguardando_avaliacao' && (
                      <>
                        <div className="bg-purple-50 text-purple-700 text-xs p-2 rounded flex flex-col gap-1">
                          <span className="font-semibold flex items-center gap-1"><Truck className="h-3 w-3"/> Rastreio: {neg.trackingCode}</span>
                          <span>Aguardando cliente receber e avaliar a peça em até 7 dias.</span>
                        </div>
                        <Button variant="outline" className="w-full">
                          Ver Comprovantes Enviados
                        </Button>
                      </>
                    )}

                    {neg.status === 'enviado' && (
                      <>
                        <div className="bg-green-50 text-green-700 text-xs p-2 rounded flex flex-col gap-1">
                          <span className="font-semibold flex items-center gap-1"><CheckCircle2 className="h-3 w-3"/> Peça entregue e aprovada</span>
                          <span>{neg.deliveredAt}</span>
                        </div>
                        <div className="text-sm text-center font-medium text-slate-600 mt-2">
                          Valor liberado na sua carteira
                        </div>
                      </>
                    )}

                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </Tabs>
    </div>
  );
}