import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Search, Info, Handshake, Eye } from "lucide-react";

const orders = [
  { id: "PED-9923", item: "Motor AP 1.8 Completo", vehicle: "VW Gol 1994", location: "Curitiba, PR", isPartner: false, urgent: true, proposals: 4 },
  { id: "PED-9922", item: "Farol Direito Full LED", vehicle: "Audi A3 2020", location: "Belo Horizonte, MG", isPartner: true, urgent: false, proposals: 1 },
  { id: "PED-9921", item: "Caixa de Câmbio Automática", vehicle: "Honda Civic 2018", location: "São Paulo, SP", isPartner: false, urgent: false, proposals: 7 },
  { id: "PED-9920", item: "Módulo de Injeção ECU", vehicle: "Ford Civic 2015", location: "Campinas, SP", isPartner: true, urgent: false, proposals: 0 },
];

export default function DesmancheOrdersTab() {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div>
        <h1 className="text-3xl font-bold font-mono text-slate-900 tracking-tight">Mural de Pedidos</h1>
        <p className="text-slate-500 mt-1">Veja o que clientes finais e outros desmanches estão procurando agora.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por peça ou modelo de carro..." className="pl-9 bg-white" />
        </div>
        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          <Badge className="bg-primary hover:bg-primary px-3 py-1.5 cursor-pointer whitespace-nowrap">Todos (14)</Badge>
          <Badge variant="outline" className="bg-white px-3 py-1.5 cursor-pointer whitespace-nowrap">Apenas Clientes Finais (10)</Badge>
          <Badge variant="outline" className="bg-white px-3 py-1.5 cursor-pointer whitespace-nowrap border-blue-200 text-blue-700">De Parceiros (4)</Badge>
        </div>
      </div>

      <div className="grid gap-4 mt-6">
        {orders.map((order) => (
          <Card key={order.id} className={`overflow-hidden transition-all hover:shadow-md ${order.isPartner ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-white'}`}>
            <CardContent className="p-0 sm:flex">
              {/* Left Column - Details */}
              <div className="p-5 sm:w-2/3 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs font-medium text-slate-400">{order.id}</span>
                  {order.urgent && <Badge className="bg-red-500 hover:bg-red-600 text-[10px] py-0 px-2">URGENTE</Badge>}
                  {order.isPartner && (
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 flex items-center gap-1">
                      <Handshake className="w-3 h-3" /> Pedido de Parceiro
                    </Badge>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 leading-tight mb-1">{order.item}</h3>
                <div className="text-sm font-medium text-slate-600 mb-4">{order.vehicle}</div>
                
                <div className="flex items-center gap-4 text-sm text-slate-500 mb-2">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" /> Envio para: <strong className="text-slate-700">{order.location}</strong>
                  </span>
                </div>
                
                <div className="text-sm font-medium text-slate-500 bg-slate-100 w-fit px-2 py-1 rounded-md">
                  {order.proposals === 0 
                    ? "Seja o primeiro a enviar proposta" 
                    : `${order.proposals} desmanches já entraram em contato`}
                </div>
              </div>
              
              {/* Right Column - Actions */}
              <div className={`p-5 sm:w-1/3 flex flex-col justify-center items-start sm:items-end border-t sm:border-t-0 sm:border-l ${order.isPartner ? 'border-blue-100 bg-blue-50/50' : 'border-slate-100 bg-slate-50'}`}>
                {order.isPartner && (
                  <div className="flex items-start gap-2 text-xs text-blue-700 mb-4 bg-blue-100/50 p-2 rounded-md">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>Este pedido é de um desmanche parceiro. Considere preço de repasse.</p>
                  </div>
                )}
                
                <Link href={`/desmanche/pedidos/${order.id}`}>
                  <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white">
                    <Eye className="mr-2 h-4 w-4" /> Ver Detalhes do Pedido
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}