import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldAlert, FileCheck, XCircle, FileWarning } from "lucide-react";

const pendingApprovals = [
  { 
    id: "REQ-001", 
    company: "AutoPeças São Paulo", 
    cnpj: "12.345.678/0001-90", 
    status: "Aguardando Análise", 
    date: "Hoje, 10:45",
    docs: ["Alvará de Funcionamento", "Credenciamento Detran SP", "Contrato Social"],
    risk: "Baixo"
  },
  { 
    id: "REQ-002", 
    company: "Desmanche Irmãos Silva", 
    cnpj: "98.765.432/0001-10", 
    status: "Falta Documento", 
    date: "Hoje, 09:20",
    docs: ["Contrato Social"],
    missingDocs: ["Credenciamento Detran RJ (Vencido)"],
    risk: "Médio"
  }
];

export default function ApprovalsTab() {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-xl">
        <div>
          <Badge className="bg-yellow-500 text-yellow-950 hover:bg-yellow-600 mb-2 border-none">Atenção Requerida</Badge>
          <h1 className="text-3xl font-bold font-mono tracking-tight text-yellow-950 dark:text-yellow-500">Aprovações de Credenciamento</h1>
          <p className="text-yellow-800 dark:text-yellow-200 mt-1">Existem desmanches aguardando validação manual dos documentos do Detran.</p>
        </div>
      </div>

      <div className="space-y-6">
        {pendingApprovals.map((req) => (
          <Card key={req.id} className="border-2 border-border shadow-sm">
            <CardHeader className="bg-muted/30 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-muted-foreground">{req.id}</span>
                  <Badge variant="outline" className={req.status === 'Falta Documento' ? 'text-red-500 border-red-200' : 'text-blue-500 border-blue-200'}>{req.status}</Badge>
                </div>
                <CardTitle className="text-xl">{req.company}</CardTitle>
                <CardDescription className="font-mono mt-1">CNPJ: {req.cnpj}</CardDescription>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" className="flex-1 sm:flex-none text-red-600 hover:text-red-700 hover:bg-red-50"><XCircle className="mr-2 h-4 w-4"/> Rejeitar</Button>
                <Button className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white"><FileCheck className="mr-2 h-4 w-4"/> Aprovar Credencial</Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <FileCheck className="h-4 w-4" /> Documentos Enviados
                </h4>
                <ul className="space-y-2">
                  {req.docs.map((doc, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm bg-muted/50 p-2 rounded border">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      {doc} <span className="ml-auto text-xs text-blue-500 cursor-pointer hover:underline">Ver PDF</span>
                    </li>
                  ))}
                </ul>
              </div>

              {req.missingDocs && (
                <div>
                  <h4 className="text-sm font-semibold text-red-500 mb-3 flex items-center gap-2">
                    <FileWarning className="h-4 w-4" /> Documentos Pendentes / Inválidos
                  </h4>
                  <ul className="space-y-2">
                    {req.missingDocs.map((doc, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-100 dark:border-red-900 text-red-800 dark:text-red-400">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        {doc}
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" size="sm" className="mt-4 w-full">Solicitar Reenvio ao Desmanche</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}