import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileCheck, FileWarning, UploadCloud, CheckCircle2, Clock } from "lucide-react";

export default function DesmancheDocsTab() {
  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div>
        <h1 className="text-3xl font-bold font-mono text-slate-900 tracking-tight">Minha Documentação</h1>
        <p className="text-slate-500 mt-1">Mantenha seus documentos em dia para continuar visível na plataforma.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Status Card */}
        <Card className="md:col-span-1 border-2 border-green-200 bg-green-50 shadow-sm h-fit">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-green-200">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-green-900 mb-2">Desmanche Credenciado</h2>
            <p className="text-sm text-green-700 mb-4">Sua empresa está verificada e apta para negociar na plataforma.</p>
            <Badge className="bg-green-600 hover:bg-green-700 font-mono">Status: 100% REGULAR</Badge>
          </CardContent>
        </Card>

        {/* Documents List */}
        <Card className="md:col-span-2 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Controle de Documentos</CardTitle>
            <CardDescription>Faça upload das renovações antes do vencimento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Doc 1 - Warning */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg border-amber-200 bg-amber-50">
              <div className="flex items-start gap-3">
                <FileWarning className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-amber-900">Alvará de Funcionamento</h4>
                  <p className="text-xs text-amber-700 font-mono mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Vence em: 15/04/2026 (15 dias)
                  </p>
                </div>
              </div>
              <Button size="sm" className="mt-3 sm:mt-0 bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto">
                <UploadCloud className="w-4 h-4 mr-2" /> Enviar Novo
              </Button>
            </div>

            {/* Doc 2 - Valid */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg border-slate-200 bg-white">
              <div className="flex items-start gap-3">
                <FileCheck className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900">Credenciamento Detran</h4>
                  <p className="text-xs text-slate-500 font-mono mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" /> Validade: 10/12/2026
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="mt-3 sm:mt-0 w-full sm:w-auto">
                Ver Arquivo
              </Button>
            </div>

            {/* Doc 3 - Valid */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg border-slate-200 bg-white">
              <div className="flex items-start gap-3">
                <FileCheck className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-slate-900">Contrato Social (CNPJ)</h4>
                  <p className="text-xs text-slate-500 font-mono mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-green-500" /> Documento Permanente
                  </p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="mt-3 sm:mt-0 w-full sm:w-auto">
                Ver Arquivo
              </Button>
            </div>

          </CardContent>
        </Card>
      </div>
    </div>
  );
}