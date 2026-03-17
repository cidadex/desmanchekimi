import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Settings, Clock, DollarSign, AlertTriangle } from "lucide-react";

interface SystemSettings {
  reviewDeadlineDays: string;
  maxOverdueBeforeBlock: string;
  perTransactionAmount: string;
  monthlyCapAmount: string;
}

export default function SettingsTab() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState<SystemSettings>({
    reviewDeadlineDays: "10",
    maxOverdueBeforeBlock: "1",
    perTransactionAmount: "25",
    monthlyCapAmount: "200",
  });

  const { data: settings, isLoading } = useQuery<SystemSettings>({
    queryKey: ["/api/admin/settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/settings");
      return res.json();
    },
  });

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: SystemSettings) => {
      const res = await apiRequest("PATCH", "/api/admin/settings", data);
      return res.json();
    },
    onSuccess: (data) => {
      qc.setQueryData(["/api/admin/settings"], data);
      toast({ title: "Configurações salvas com sucesso!" });
    },
    onError: () => toast({ title: "Erro ao salvar configurações", variant: "destructive" }),
  });

  const f = (key: keyof SystemSettings) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value })),
  });

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div>
        <h1 className="text-3xl font-bold font-mono text-slate-900 tracking-tight">Configurações do Sistema</h1>
        <p className="text-slate-500 mt-1">Ajuste os parâmetros de cobrança e regras de avaliação.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="font-mono text-base flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" /> Gate de Avaliação
              </CardTitle>
              <CardDescription>
                Regras para obrigar clientes e desmanches a avaliar negociações concluídas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Dias para avaliar após recebimento</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" min={1} max={90} {...f("reviewDeadlineDays")} className="max-w-[120px]" />
                  <span className="text-sm text-slate-500">dias</span>
                </div>
                <p className="text-xs text-slate-400">
                  O prazo começa quando o cliente confirma o recebimento da peça.
                </p>
              </div>

              <div className="space-y-1">
                <Label>Avaliações atrasadas para bloquear</Label>
                <div className="flex items-center gap-2">
                  <Input type="number" min={1} max={10} {...f("maxOverdueBeforeBlock")} className="max-w-[120px]" />
                  <span className="text-sm text-slate-500">avaliação(ões)</span>
                </div>
                <p className="text-xs text-slate-400">
                  Quantas avaliações atrasadas bloqueiam novos pedidos / propostas.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded p-3 flex items-start gap-2 text-xs text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>
                  Se o prazo vencer sem avaliação, a negociação é automaticamente concluída sem bloquear ninguém.
                  O bloqueio só ocorre quando o prazo vence sem avaliação.
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="font-mono text-base flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" /> Cobrança por Transação
              </CardTitle>
              <CardDescription>
                Valores para o modelo de pagamento avulso dos desmanches.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Valor por transação</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">R$</span>
                  <Input type="number" min={1} step={0.01} {...f("perTransactionAmount")} className="max-w-[120px]" />
                </div>
                <p className="text-xs text-slate-400">
                  Cobrado a cada negociação concluída avaliada.
                </p>
              </div>

              <div className="space-y-1">
                <Label>Teto mensal</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-500">R$</span>
                  <Input type="number" min={1} step={0.01} {...f("monthlyCapAmount")} className="max-w-[120px]" />
                </div>
                <p className="text-xs text-slate-400">
                  A partir deste valor pago no mês, as transações ficam isentas até o fim do período.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded p-3 text-xs text-green-700">
                Com os valores atuais: após{" "}
                <strong>
                  {Math.ceil(
                    parseFloat(form.monthlyCapAmount || "200") /
                    parseFloat(form.perTransactionAmount || "25")
                  )} transações
                </strong>{" "}
                no mês, o desmanche não paga mais nada.
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={() => saveMutation.mutate(form)}
          disabled={saveMutation.isPending || isLoading}
          className="gap-2"
        >
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
