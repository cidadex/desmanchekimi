import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { getToken } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Car, Bike, Truck, Bus, Ship, Plane, Loader2, ChevronRight, ChevronLeft,
  Camera, X, CheckCircle2, AlertTriangle, Zap, Package,
} from "lucide-react";

// ────────────────────────────────────────────────────────────────────────────
// DATA DEFINITIONS
// ────────────────────────────────────────────────────────────────────────────

const VEHICLE_TYPES = [
  { id: "car",         label: "Carro",             icon: "🚗", brands: ["Fiat","Volkswagen","Chevrolet","Toyota","Honda","Hyundai","Renault","Ford","Jeep","Nissan","Mitsubishi","Citroën","Peugeot","BMW","Mercedes-Benz","Audi","Kia","Subaru","Volvo","Land Rover"] },
  { id: "motorcycle",  label: "Moto",               icon: "🏍️", brands: ["Honda","Yamaha","Suzuki","Kawasaki","BMW","Harley-Davidson","Royal Enfield","Triumph","KTM","Dafra","Shineray"] },
  { id: "truck",       label: "Caminhão",           icon: "🚛", brands: ["Mercedes-Benz","Volvo","Scania","Iveco","DAF","MAN","Ford","Volkswagen","International"] },
  { id: "bus",         label: "Ônibus",             icon: "🚌", brands: ["Mercedes-Benz","Volvo","Scania","Marcopolo","Busscar","Caio"] },
  { id: "van",         label: "Van / Utilitário",   icon: "🚐", brands: ["Fiat","Mercedes-Benz","Ford","Volkswagen","Renault","Citroën","Hyundai"] },
  { id: "boat",        label: "Barco / Lancha",     icon: "⛵", brands: ["Focker","Corsa","Real","Cimitarra","Triton","Schaefer","Ventura"] },
  { id: "airplane",    label: "Avião",              icon: "✈️", brands: ["Cessna","Embraer","Piper","Beechcraft","Cirrus","Diamond"] },
  { id: "helicopter",  label: "Helicóptero",        icon: "🚁", brands: ["Robinson","Bell","Airbus","Eurocopter","Sikorsky"] },
  { id: "bicycle",     label: "Bicicleta / E-bike", icon: "🚲", brands: ["Caloi","Monark","Specialized","Trek","Caloi","Oggi","Soul","Houston"] },
  { id: "agricultural",label: "Trator / Agrícola",  icon: "🚜", brands: ["John Deere","New Holland","Case","Massey Ferguson","Valtra","AGCO","Agrale"] },
  { id: "other",       label: "Outro",              icon: "🔧", brands: [] },
];

interface PartDef {
  id: string;
  label: string;
  pos?: "side" | "axle" | "axle_side" | "axle_front_rear" | "all4" | "full";
}

const CATEGORIES: Record<string, { id: string; label: string; emoji: string }[]> = {
  car: [
    { id: "engine",    label: "Motor e Transmissão",         emoji: "⚙️" },
    { id: "brakes",    label: "Freios",                      emoji: "🛑" },
    { id: "suspension",label: "Suspensão e Direção",          emoji: "🔩" },
    { id: "body",      label: "Carroceria / Lataria",        emoji: "🚗" },
    { id: "glass",     label: "Vidros e Espelhos",           emoji: "🪟" },
    { id: "lighting",  label: "Iluminação",                  emoji: "💡" },
    { id: "interior",  label: "Interior",                    emoji: "🪑" },
    { id: "electrical",label: "Elétrica e Eletrônica",       emoji: "⚡" },
    { id: "wheels",    label: "Rodas e Pneus",               emoji: "⭕" },
    { id: "cooling",   label: "Arrefecimento",               emoji: "❄️" },
    { id: "fuel",      label: "Sistema de Combustível",      emoji: "⛽" },
    { id: "exhaust",   label: "Escapamento",                 emoji: "💨" },
    { id: "clutch",    label: "Embreagem",                   emoji: "🔧" },
    { id: "other",     label: "Outro",                       emoji: "❓" },
  ],
  motorcycle: [
    { id: "engine",    label: "Motor",                       emoji: "⚙️" },
    { id: "brakes",    label: "Freios",                      emoji: "🛑" },
    { id: "suspension",label: "Suspensão",                   emoji: "🔩" },
    { id: "body",      label: "Carenagem / Lataria",         emoji: "🏍️" },
    { id: "lighting",  label: "Iluminação",                  emoji: "💡" },
    { id: "wheels",    label: "Rodas e Pneus",               emoji: "⭕" },
    { id: "electrical",label: "Elétrica",                    emoji: "⚡" },
    { id: "exhaust",   label: "Escapamento",                 emoji: "💨" },
    { id: "fuel",      label: "Tanque / Combustível",        emoji: "⛽" },
    { id: "other",     label: "Outro",                       emoji: "❓" },
  ],
  truck: [
    { id: "engine",    label: "Motor e Transmissão",         emoji: "⚙️" },
    { id: "brakes",    label: "Freios",                      emoji: "🛑" },
    { id: "suspension",label: "Suspensão",                   emoji: "🔩" },
    { id: "body",      label: "Cabine / Carroceria",         emoji: "🚛" },
    { id: "lighting",  label: "Iluminação",                  emoji: "💡" },
    { id: "wheels",    label: "Rodas e Pneus",               emoji: "⭕" },
    { id: "electrical",label: "Elétrica",                    emoji: "⚡" },
    { id: "exhaust",   label: "Escapamento",                 emoji: "💨" },
    { id: "fuel",      label: "Sistema de Combustível",      emoji: "⛽" },
    { id: "hydraulics",label: "Sistema Hidráulico",          emoji: "💧" },
    { id: "other",     label: "Outro",                       emoji: "❓" },
  ],
};

const GENERIC_CATEGORIES = [
  { id: "engine",    label: "Motor / Propulsão",  emoji: "⚙️" },
  { id: "body",      label: "Estrutura / Corpo",  emoji: "🔩" },
  { id: "electrical",label: "Elétrica",            emoji: "⚡" },
  { id: "wheels",    label: "Rodas / Deslocamento",emoji: "⭕" },
  { id: "other",     label: "Outro",               emoji: "❓" },
];

const PARTS: Record<string, PartDef[]> = {
  engine: [
    { id: "motor_completo",   label: "Motor Completo" },
    { id: "bloco_motor",      label: "Bloco do Motor" },
    { id: "cabecote",         label: "Cabeçote" },
    { id: "pistao",           label: "Pistão / Anel" },
    { id: "virabrequim",      label: "Virabrequim" },
    { id: "arvore_cames",     label: "Árvore de Cames" },
    { id: "bomba_oleo",       label: "Bomba de Óleo" },
    { id: "correia_dist",     label: "Correia / Corrente de Distribuição" },
    { id: "coletor_admissao", label: "Coletor de Admissão" },
    { id: "turbina",          label: "Turbina / Turbocompressor" },
    { id: "cambio_manual",    label: "Câmbio Manual" },
    { id: "cambio_auto",      label: "Câmbio Automático" },
    { id: "cambio_cvt",       label: "Câmbio CVT" },
    { id: "caixa_transfer",   label: "Caixa de Transferência" },
    { id: "semi_eixo",        label: "Semi-eixo / Homocinética" },
    { id: "diferencial",      label: "Diferencial" },
    { id: "outro_motor",      label: "Outro (descrevo nos detalhes)" },
  ],
  brakes: [
    { id: "disco_freio",      label: "Disco de Freio",            pos: "axle_side" },
    { id: "tambor_freio",     label: "Tambor de Freio",           pos: "axle_side" },
    { id: "pastilha_freio",   label: "Pastilha de Freio",         pos: "axle" },
    { id: "lona_freio",       label: "Lona de Freio",             pos: "axle" },
    { id: "pinca_calibre",    label: "Pinça / Cáliper",           pos: "axle_side" },
    { id: "cilindro_mestre",  label: "Cilindro Mestre" },
    { id: "modulo_abs",       label: "Módulo ABS" },
    { id: "servo_freio",      label: "Servo Freio" },
    { id: "outro_freio",      label: "Outro (descrevo nos detalhes)" },
  ],
  suspension: [
    { id: "amortecedor",      label: "Amortecedor",               pos: "axle_side" },
    { id: "mola",             label: "Mola",                      pos: "axle_side" },
    { id: "bandeja",          label: "Bandeja / Braço de Controle", pos: "axle_side" },
    { id: "pivo",             label: "Pivô / Ball Joint",         pos: "axle_side" },
    { id: "bucha",            label: "Bucha de Bandeja",          pos: "axle_side" },
    { id: "barra_estab",      label: "Barra Estabilizadora",      pos: "axle" },
    { id: "terminal_dir",     label: "Terminal de Direção",       pos: "side" },
    { id: "cremalheira",      label: "Caixa de Direção / Cremalheira" },
    { id: "bomba_dir_hid",    label: "Bomba de Direção Hidráulica" },
    { id: "coluna_direcao",   label: "Coluna de Direção" },
    { id: "outro_susp",       label: "Outro (descrevo nos detalhes)" },
  ],
  body: [
    { id: "porta",            label: "Porta",                     pos: "axle_side" },
    { id: "capo",             label: "Capô / Cofre" },
    { id: "tampa_traseira",   label: "Tampa Traseira / Porta-malas" },
    { id: "para_lama",        label: "Para-lama",                 pos: "axle_side" },
    { id: "para_choque",      label: "Para-choque",               pos: "axle_front_rear" },
    { id: "teto",             label: "Teto" },
    { id: "longarina",        label: "Longarina / Soleira",       pos: "side" },
    { id: "coluna",           label: "Coluna A/B/C",              pos: "side" },
    { id: "assoalho",         label: "Assoalho" },
    { id: "outro_lat",        label: "Outro (descrevo nos detalhes)" },
  ],
  glass: [
    { id: "parabrisa",        label: "Para-brisa" },
    { id: "vidro_traseiro",   label: "Vidro Traseiro" },
    { id: "vidro_lateral",    label: "Vidro Lateral",             pos: "axle_side" },
    { id: "vidro_teto",       label: "Vidro Teto Solar" },
    { id: "espelho_ext",      label: "Espelho Retrovisor Externo", pos: "side" },
    { id: "espelho_int",      label: "Espelho Retrovisor Interno" },
    { id: "outro_vidro",      label: "Outro (descrevo nos detalhes)" },
  ],
  lighting: [
    { id: "farol",            label: "Farol Dianteiro",           pos: "side" },
    { id: "lanterna",         label: "Lanterna Traseira",         pos: "side" },
    { id: "farol_milha",      label: "Farol de Milha / Neblina",  pos: "axle_side" },
    { id: "pisca",            label: "Pisca-pisca / Seta",        pos: "full" },
    { id: "luz_re",           label: "Luz de Ré",                 pos: "side" },
    { id: "luz_placa",        label: "Luz da Placa" },
    { id: "drl",              label: "DRL / Luz Diurna",          pos: "side" },
    { id: "outro_ilum",       label: "Outro (descrevo nos detalhes)" },
  ],
  interior: [
    { id: "banco_assento",    label: "Banco / Assento",           pos: "axle_side" },
    { id: "painel_dashboard", label: "Painel / Dashboard" },
    { id: "forro_porta",      label: "Forro de Porta",            pos: "axle_side" },
    { id: "console_central",  label: "Console Central" },
    { id: "tapete",           label: "Tapete / Assoalho" },
    { id: "forro_teto",       label: "Revestimento de Teto" },
    { id: "volante",          label: "Volante" },
    { id: "painel_instrum",   label: "Painel de Instrumentos" },
    { id: "outro_int",        label: "Outro (descrevo nos detalhes)" },
  ],
  electrical: [
    { id: "alternador",       label: "Alternador" },
    { id: "motor_partida",    label: "Motor de Partida" },
    { id: "bateria",          label: "Bateria" },
    { id: "caixa_fusiveis",   label: "Caixa de Fusíveis" },
    { id: "modulo_ecu",       label: "Módulo / ECU" },
    { id: "chicote",          label: "Chicote Elétrico" },
    { id: "sensor",           label: "Sensor (especifique nos detalhes)" },
    { id: "motor_vidro",      label: "Motor Elétrico (vidro/trava)", pos: "axle_side" },
    { id: "outro_elet",       label: "Outro (descrevo nos detalhes)" },
  ],
  wheels: [
    { id: "roda_aro",         label: "Roda / Aro",                pos: "all4" },
    { id: "cubo_roda",        label: "Cubo de Roda",              pos: "axle_side" },
    { id: "rolamento",        label: "Rolamento de Roda",         pos: "axle_side" },
    { id: "pneu",             label: "Pneu",                      pos: "all4" },
    { id: "outro_roda",       label: "Outro (descrevo nos detalhes)" },
  ],
  cooling: [
    { id: "radiador",         label: "Radiador" },
    { id: "bomba_agua",       label: "Bomba D'água" },
    { id: "termostato",       label: "Termostato" },
    { id: "ventoinha",        label: "Ventoinha / Eletro-ventilador" },
    { id: "intercooler",      label: "Intercooler" },
    { id: "reservatorio",     label: "Reservatório de Expansão" },
    { id: "outro_arref",      label: "Outro (descrevo nos detalhes)" },
  ],
  fuel: [
    { id: "bomba_comb",       label: "Bomba de Combustível" },
    { id: "injetor",          label: "Injetor de Combustível" },
    { id: "flauta_inj",       label: "Flauta de Injetores" },
    { id: "filtro_comb",      label: "Filtro de Combustível" },
    { id: "tanque",           label: "Tanque / Reservatório" },
    { id: "corpo_borboleta",  label: "Corpo de Borboleta / TBI" },
    { id: "outro_comb",       label: "Outro (descrevo nos detalhes)" },
  ],
  exhaust: [
    { id: "silencioso",       label: "Silencioso / Muffler" },
    { id: "catalisador",      label: "Catalisador" },
    { id: "tubo_flex",        label: "Tubo Flex / Intermediário" },
    { id: "cano_esc",         label: "Cano de Escapamento" },
    { id: "outro_esc",        label: "Outro (descrevo nos detalhes)" },
  ],
  clutch: [
    { id: "disco_emb",        label: "Disco de Embreagem" },
    { id: "plato_emb",        label: "Platô / Pressure Plate" },
    { id: "rolamento_emb",    label: "Rolamento de Embreagem" },
    { id: "volante_motor",    label: "Volante do Motor" },
    { id: "outro_emb",        label: "Outro (descrevo nos detalhes)" },
  ],
  hydraulics: [
    { id: "bomba_hid",        label: "Bomba Hidráulica" },
    { id: "cilindro_hid",     label: "Cilindro Hidráulico" },
    { id: "mangueira_hid",    label: "Mangueira Hidráulica" },
    { id: "outro_hid",        label: "Outro (descrevo nos detalhes)" },
  ],
  other: [
    { id: "outro",            label: "Descrevo nos detalhes" },
  ],
};

const POSITIONS: Record<string, { id: string; label: string }[]> = {
  side: [
    { id: "esquerdo", label: "Esquerdo" },
    { id: "direito",  label: "Direito" },
    { id: "par",      label: "Par (ambos)" },
  ],
  axle: [
    { id: "dianteiro", label: "Dianteiro" },
    { id: "traseiro",  label: "Traseiro" },
    { id: "eixo_par",  label: "Par (ambos eixos)" },
  ],
  axle_front_rear: [
    { id: "dianteiro", label: "Dianteiro" },
    { id: "traseiro",  label: "Traseiro" },
  ],
  axle_side: [
    { id: "dianteiro_esquerdo", label: "Dianteiro Esq." },
    { id: "dianteiro_direito",  label: "Dianteiro Dir." },
    { id: "traseiro_esquerdo",  label: "Traseiro Esq." },
    { id: "traseiro_direito",   label: "Traseiro Dir." },
    { id: "par_dianteiro",      label: "Par Dianteiro" },
    { id: "par_traseiro",       label: "Par Traseiro" },
    { id: "todos",              label: "Todos (4)" },
  ],
  all4: [
    { id: "dianteiro_esquerdo", label: "Dianteiro Esq." },
    { id: "dianteiro_direito",  label: "Dianteiro Dir." },
    { id: "traseiro_esquerdo",  label: "Traseiro Esq." },
    { id: "traseiro_direito",   label: "Traseiro Dir." },
    { id: "todos",              label: "Todos (4)" },
  ],
  full: [
    { id: "dianteiro_esquerdo", label: "Dianteiro Esq." },
    { id: "dianteiro_direito",  label: "Dianteiro Dir." },
    { id: "traseiro_esquerdo",  label: "Traseiro Esq." },
    { id: "traseiro_direito",   label: "Traseiro Dir." },
    { id: "lateral_esquerdo",   label: "Lateral Esq." },
    { id: "lateral_direito",    label: "Lateral Dir." },
  ],
};

const CONDITIONS = [
  { id: "new",           label: "Nova",           desc: "Apenas peça nova" },
  { id: "used-excellent",label: "Usada - Ótimo",  desc: "Seminova, baixíssimo uso" },
  { id: "used-good",     label: "Usada - Bom",    desc: "Boas condições de uso" },
  { id: "any",           label: "Qualquer",        desc: "Qualquer condição" },
];

// ────────────────────────────────────────────────────────────────────────────
// WIZARD STATE
// ────────────────────────────────────────────────────────────────────────────

interface WizardState {
  vehicleType: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleColor: string;
  vehicleEngine: string;
  vehiclePlate: string;
  partCategory: string;
  partName: string;
  partPosition: string;
  partConditionAccepted: string;
  description: string;
  urgency: string;
  photos: File[];
}

const EMPTY: WizardState = {
  vehicleType: "",
  vehicleBrand: "",
  vehicleModel: "",
  vehicleYear: "",
  vehicleColor: "",
  vehicleEngine: "",
  vehiclePlate: "",
  partCategory: "",
  partName: "",
  partPosition: "",
  partConditionAccepted: "any",
  description: "",
  urgency: "normal",
  photos: [],
};

function buildTitle(s: WizardState): string {
  const parts: string[] = [];
  if (s.partName) {
    const allParts = Object.values(PARTS).flat();
    const partDef = allParts.find((p) => p.id === s.partName);
    if (partDef) parts.push(partDef.label);
  }
  if (s.partPosition) {
    const allPos = Object.values(POSITIONS).flat();
    const posDef = allPos.find((p) => p.id === s.partPosition);
    if (posDef) parts.push(posDef.label);
  }
  const vt = VEHICLE_TYPES.find((v) => v.id === s.vehicleType);
  const vehicleParts: string[] = [];
  if (s.vehicleBrand) vehicleParts.push(s.vehicleBrand);
  if (s.vehicleModel) vehicleParts.push(s.vehicleModel);
  if (s.vehicleYear) vehicleParts.push(s.vehicleYear);
  if (vt && vehicleParts.length) parts.push(`- ${vehicleParts.join(" ")}`);
  else if (vt) parts.push(`- ${vt.label}`);
  return parts.join(" ") || "Pedido de Peça";
}

// ────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ────────────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TOTAL_STEPS = 6;

export function CreateOrderWizard({ open, onClose, onSuccess }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const token = getToken();
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const set = (patch: Partial<WizardState>) => setState((s) => ({ ...s, ...patch }));

  const categories = CATEGORIES[state.vehicleType] ?? GENERIC_CATEGORIES;
  const selectedPart = Object.values(PARTS).flat().find((p) => p.id === state.partName);
  const positionOptions = selectedPart?.pos ? POSITIONS[selectedPart.pos] : null;

  // ── mutations ──────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!user?.profileComplete) throw new Error("profile");
      const title = buildTitle(state);
      const description = state.description || title;

      const vt = VEHICLE_TYPES.find((v) => v.id === state.vehicleType);
      const partDef = Object.values(PARTS).flat().find((p) => p.id === state.partName);
      const posDef = positionOptions?.find((p) => p.id === state.partPosition);
      const catDef = categories.find((c) => c.id === state.partCategory);

      const body: Record<string, any> = {
        title,
        description,
        vehicleType: state.vehicleType,
        vehicleBrand: state.vehicleBrand || (vt?.label ?? "Não informado"),
        vehicleModel: state.vehicleModel || "Não informado",
        vehicleYear: parseInt(state.vehicleYear) || new Date().getFullYear(),
        vehiclePlate: state.vehiclePlate || undefined,
        vehicleColor: state.vehicleColor || undefined,
        vehicleEngine: state.vehicleEngine || undefined,
        partCategory: catDef?.label || state.partCategory,
        partName: partDef?.label || state.partName,
        partPosition: posDef?.label || state.partPosition || undefined,
        partConditionAccepted: state.partConditionAccepted,
        location: user ? `${(user as any).city || ""}, ${(user as any).state || ""}`.trim().replace(/^,\s*/, "") || "Brasil" : "Brasil",
        urgency: state.urgency,
        isPartnerRequest: false,
      };

      const res = await apiRequest("POST", "/api/orders", body);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Erro ao criar pedido");
      }
      const order = await res.json();

      // upload photos
      if (state.photos.length > 0) {
        setUploading(true);
        try {
          const fd = new FormData();
          state.photos.forEach((f) => fd.append("photos", f));
          await fetch(`/api/orders/${order.id}/images`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          });
        } catch {
          // photos failed but order created — not fatal
        } finally {
          setUploading(false);
        }
      }
      return order;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/orders/my"] });
      qc.invalidateQueries({ queryKey: ["/api/orders"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/orders"] });
      toast({ title: "Pedido criado!", description: "Seu pedido foi publicado no mural dos desmanches." });
      handleClose();
      onSuccess();
    },
    onError: (err: any) => {
      if (err.message === "profile") {
        toast({ title: "Complete seu perfil", description: "Preencha WhatsApp e endereço antes de criar pedidos.", variant: "destructive" });
      } else {
        toast({ title: "Erro", description: err.message || "Não foi possível criar o pedido.", variant: "destructive" });
      }
    },
  });

  // ── helpers ────────────────────────────────────────────────────────────────
  const handleClose = () => {
    setStep(1);
    setState(EMPTY);
    setPreviewUrls([]);
    onClose();
  };

  const handlePhotos = (files: FileList | null) => {
    if (!files) return;
    const arr = Array.from(files);
    const total = state.photos.length + arr.length;
    if (total > 10) {
      toast({ title: "Máximo 10 fotos", variant: "destructive" });
      return;
    }
    set({ photos: [...state.photos, ...arr] });
    const newUrls = arr.map((f) => URL.createObjectURL(f));
    setPreviewUrls((prev) => [...prev, ...newUrls]);
  };

  const removePhoto = (i: number) => {
    const photos = state.photos.filter((_, idx) => idx !== i);
    const previews = previewUrls.filter((_, idx) => idx !== i);
    set({ photos });
    setPreviewUrls(previews);
  };

  const canNext = (): boolean => {
    if (step === 1) return !!state.vehicleType;
    if (step === 2) return !!state.vehicleBrand && !!state.vehicleModel && !!state.vehicleYear;
    if (step === 3) return !!state.partCategory;
    if (step === 4) return !!state.partName;
    return true;
  };

  const next = () => {
    if (!canNext()) {
      toast({ title: "Preencha os campos obrigatórios", variant: "destructive" });
      return;
    }
    // reset dependent selections when going forward
    if (step === 1) set({ partCategory: "", partName: "", partPosition: "" });
    if (step === 3) set({ partName: "", partPosition: "" });
    if (step === 4) set({ partPosition: "" });
    setStep((s) => Math.min(s + 1, TOTAL_STEPS));
  };

  const back = () => setStep((s) => Math.max(s - 1, 1));

  const vt = VEHICLE_TYPES.find((v) => v.id === state.vehicleType);

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-xl">Solicitar Peça</DialogTitle>
          {/* Step indicator */}
          <div className="flex items-center gap-1 mt-3 mb-1">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className={cn("h-1.5 flex-1 rounded-full transition-colors", i + 1 <= step ? "bg-primary" : "bg-muted")} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Etapa {step} de {TOTAL_STEPS} — {["Tipo de Veículo", "Dados do Veículo", "Categoria da Peça", "Peça Específica", "Detalhes e Fotos", "Revisar e Publicar"][step - 1]}
          </p>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          {/* ── STEP 1: Vehicle Type ─────────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Qual é o tipo do veículo?</p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {VEHICLE_TYPES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => set({ vehicleType: v.id })}
                    className={cn(
                      "flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-center hover:border-primary/60",
                      state.vehicleType === v.id ? "border-primary bg-primary/5" : "border-muted"
                    )}
                  >
                    <span className="text-3xl">{v.icon}</span>
                    <span className="text-xs font-medium leading-tight">{v.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2: Vehicle Details ──────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                <span className="text-2xl">{vt?.icon}</span>
                <div>
                  <p className="font-medium text-sm">{vt?.label}</p>
                  <p className="text-xs text-muted-foreground">Informe os dados do veículo</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-sm">Marca *</Label>
                  <Input
                    value={state.vehicleBrand}
                    onChange={(e) => set({ vehicleBrand: e.target.value })}
                    placeholder={vt?.brands[0] || "Ex: Honda"}
                    list="brands-list"
                  />
                  <datalist id="brands-list">
                    {(vt?.brands ?? []).map((b) => <option key={b} value={b} />)}
                  </datalist>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Modelo *</Label>
                  <Input value={state.vehicleModel} onChange={(e) => set({ vehicleModel: e.target.value })} placeholder="Ex: Civic, CG 160..." />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Ano *</Label>
                  <Select value={state.vehicleYear} onValueChange={(v) => set({ vehicleYear: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 60 }, (_, i) => new Date().getFullYear() + 1 - i).map((y) => (
                        <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Cor <span className="text-muted-foreground">(para lataria)</span></Label>
                  <Input value={state.vehicleColor} onChange={(e) => set({ vehicleColor: e.target.value })} placeholder="Ex: Prata, Preto..." />
                </div>
                {(state.vehicleType === "car" || state.vehicleType === "motorcycle" || state.vehicleType === "truck" || state.vehicleType === "van" || state.vehicleType === "bus") && (
                  <>
                    <div className="space-y-1">
                      <Label className="text-sm">Motor <span className="text-muted-foreground">(opcional)</span></Label>
                      <Input value={state.vehicleEngine} onChange={(e) => set({ vehicleEngine: e.target.value })} placeholder="Ex: 1.8, 2.0 Turbo..." />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">Placa <span className="text-muted-foreground">(opcional)</span></Label>
                      <Input value={state.vehiclePlate} onChange={(e) => set({ vehiclePlate: e.target.value })} placeholder="ABC-1234" maxLength={8} />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 3: Part Category ────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm font-medium">Qual categoria de peça você precisa?</p>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => set({ partCategory: cat.id })}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all hover:border-primary/60",
                      state.partCategory === cat.id ? "border-primary bg-primary/5" : "border-muted"
                    )}
                  >
                    <span className="text-2xl">{cat.emoji}</span>
                    <span className="text-sm font-medium leading-tight">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 4: Specific Part ────────────────────────────────────── */}
          {step === 4 && (
            <div className="space-y-4">
              <p className="text-sm font-medium">Qual é a peça específica?</p>
              <div className="grid gap-2">
                {(PARTS[state.partCategory] ?? PARTS.other).map((part) => (
                  <button
                    key={part.id}
                    onClick={() => set({ partName: part.id, partPosition: "" })}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border-2 text-left transition-all hover:border-primary/60",
                      state.partName === part.id ? "border-primary bg-primary/5" : "border-muted"
                    )}
                  >
                    <span className="text-sm font-medium">{part.label}</span>
                    {part.pos && <Badge variant="outline" className="text-xs ml-2 shrink-0">requer posição</Badge>}
                  </button>
                ))}
              </div>

              {/* Position selector (shows when part has positions) */}
              {state.partName && positionOptions && positionOptions.length > 0 && (
                <div className="space-y-2 pt-2 border-t">
                  <p className="text-sm font-medium">Qual a posição da peça?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {positionOptions.map((pos) => (
                      <button
                        key={pos.id}
                        onClick={() => set({ partPosition: pos.id })}
                        className={cn(
                          "p-2.5 rounded-lg border-2 text-sm font-medium transition-all hover:border-primary/60",
                          state.partPosition === pos.id ? "border-primary bg-primary/5" : "border-muted"
                        )}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── STEP 5: Details + Photos ─────────────────────────────────── */}
          {step === 5 && (
            <div className="space-y-4">
              {/* Condition */}
              <div className="space-y-2">
                <p className="text-sm font-medium">Condição aceita para a peça?</p>
                <div className="grid grid-cols-2 gap-2">
                  {CONDITIONS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => set({ partConditionAccepted: c.id })}
                      className={cn(
                        "p-3 rounded-xl border-2 text-left transition-all hover:border-primary/60",
                        state.partConditionAccepted === c.id ? "border-primary bg-primary/5" : "border-muted"
                      )}
                    >
                      <p className="text-sm font-semibold">{c.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label className="text-sm">Observações adicionais <span className="text-muted-foreground">(opcional)</span></Label>
                <Textarea
                  value={state.description}
                  onChange={(e) => set({ description: e.target.value })}
                  placeholder="Descreva detalhes importantes: número do motor, código da peça, condições que não podem estar presentes, etc."
                  rows={3}
                />
              </div>

              {/* Urgency */}
              <div className="space-y-1">
                <Label className="text-sm">Urgência</Label>
                <div className="flex gap-2">
                  <button
                    onClick={() => set({ urgency: "normal" })}
                    className={cn(
                      "flex-1 p-2.5 rounded-lg border-2 text-sm font-medium transition-all flex items-center justify-center gap-2",
                      state.urgency === "normal" ? "border-primary bg-primary/5" : "border-muted"
                    )}
                  >
                    <Package className="h-4 w-4" /> Normal
                  </button>
                  <button
                    onClick={() => set({ urgency: "urgent" })}
                    className={cn(
                      "flex-1 p-2.5 rounded-lg border-2 text-sm font-medium transition-all flex items-center justify-center gap-2",
                      state.urgency === "urgent" ? "border-destructive bg-destructive/5" : "border-muted"
                    )}
                  >
                    <Zap className="h-4 w-4" /> Urgente
                  </button>
                </div>
              </div>

              {/* Photo upload */}
              <div className="space-y-2">
                <Label className="text-sm">
                  Fotos da peça / veículo <span className="text-muted-foreground">(até 10 fotos, opcional)</span>
                </Label>
                <p className="text-xs text-muted-foreground">Fotos ajudam o desmanche a identificar a peça exata que você precisa.</p>
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => handlePhotos(e.target.files)}
                />
                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {previewUrls.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden border">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removePhoto(i)}
                          className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-black"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    {state.photos.length < 10 && (
                      <button
                        onClick={() => photoInputRef.current?.click()}
                        className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/60 transition-colors"
                      >
                        <Camera className="h-5 w-5" />
                        <span className="text-xs">Adicionar</span>
                      </button>
                    )}
                  </div>
                )}
                {previewUrls.length === 0 && (
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="w-full p-6 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 text-muted-foreground hover:border-primary/60 transition-colors"
                  >
                    <Camera className="h-8 w-8" />
                    <p className="text-sm font-medium">Adicionar fotos</p>
                    <p className="text-xs">JPG, PNG ou WebP</p>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 6: Review ───────────────────────────────────────────── */}
          {step === 6 && (
            <div className="space-y-4">
              <p className="text-sm font-medium">Revise seu pedido antes de publicar:</p>

              <div className="rounded-xl border p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{vt?.icon}</span>
                  <div>
                    <p className="font-semibold text-sm">{buildTitle(state)}</p>
                    {state.urgency === "urgent" && (
                      <Badge variant="destructive" className="text-xs mt-1">
                        <AlertTriangle className="h-3 w-3 mr-1" /> Urgente
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <ReviewRow label="Tipo" value={vt?.label} />
                  <ReviewRow label="Marca" value={state.vehicleBrand} />
                  <ReviewRow label="Modelo" value={state.vehicleModel} />
                  <ReviewRow label="Ano" value={state.vehicleYear} />
                  {state.vehicleColor && <ReviewRow label="Cor" value={state.vehicleColor} />}
                  {state.vehicleEngine && <ReviewRow label="Motor" value={state.vehicleEngine} />}
                  {state.vehiclePlate && <ReviewRow label="Placa" value={state.vehiclePlate} />}
                  <ReviewRow label="Categoria" value={categories.find((c) => c.id === state.partCategory)?.label} />
                  <ReviewRow label="Peça" value={Object.values(PARTS).flat().find((p) => p.id === state.partName)?.label} />
                  {state.partPosition && (
                    <ReviewRow label="Posição" value={Object.values(POSITIONS).flat().find((p) => p.id === state.partPosition)?.label} />
                  )}
                  <ReviewRow label="Condição aceita" value={CONDITIONS.find((c) => c.id === state.partConditionAccepted)?.label} />
                </div>

                {state.description && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">Observações:</p>
                    <p className="text-sm">{state.description}</p>
                  </div>
                )}

                {state.photos.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-2">{state.photos.length} foto(s) anexada(s)</p>
                    <div className="flex gap-2 flex-wrap">
                      {previewUrls.map((url, i) => (
                        <img key={i} src={url} alt="" className="h-14 w-14 rounded-lg object-cover border" />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                <span>Seu pedido será publicado no mural e desmanches credenciados na sua região poderão enviar propostas de preço.</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="flex items-center justify-between px-6 pb-6 pt-2 border-t">
          <Button variant="outline" onClick={step === 1 ? handleClose : back} disabled={createMutation.isPending}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            {step === 1 ? "Cancelar" : "Voltar"}
          </Button>

          {step < TOTAL_STEPS ? (
            <Button onClick={next} disabled={!canNext()}>
              Continuar
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={() => createMutation.mutate()}
              disabled={createMutation.isPending || uploading}
              className="min-w-32"
            >
              {(createMutation.isPending || uploading) ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Publicando...</>
              ) : (
                <><CheckCircle2 className="h-4 w-4 mr-2" /> Publicar Pedido</>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
