import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react";

interface RegisterModalProps {
  children?: React.ReactNode;
  defaultOpen?: boolean;
  defaultTab?: "client";
}

// ─── Password strength helpers ────────────────────────────────────────────────
const CRITERIA = [
  { label: "Mínimo 8 caracteres", test: (p: string) => p.length >= 8 },
  { label: "Letra maiúscula (A-Z)", test: (p: string) => /[A-Z]/.test(p) },
  { label: "Letra minúscula (a-z)", test: (p: string) => /[a-z]/.test(p) },
  { label: "Número (0-9)", test: (p: string) => /[0-9]/.test(p) },
  { label: "Caractere especial (!@#...)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
];

function getStrength(password: string): number {
  return CRITERIA.filter((c) => c.test(password)).length;
}

const STRENGTH_LABELS = ["", "Muito fraca", "Fraca", "Razoável", "Boa", "Forte"];
const STRENGTH_COLORS = [
  "",
  "bg-red-500",
  "bg-orange-500",
  "bg-yellow-500",
  "bg-blue-500",
  "bg-green-500",
];
const STRENGTH_TEXT_COLORS = [
  "",
  "text-red-600",
  "text-orange-600",
  "text-yellow-600",
  "text-blue-600",
  "text-green-600",
];

function PasswordStrength({ password }: { password: string }) {
  const strength = getStrength(password);
  if (!password) return null;

  return (
    <div className="space-y-2 mt-1">
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                level <= strength ? STRENGTH_COLORS[strength] : "bg-slate-200"
              }`}
            />
          ))}
        </div>
        {strength > 0 && (
          <span className={`text-xs font-medium ${STRENGTH_TEXT_COLORS[strength]}`}>
            {STRENGTH_LABELS[strength]}
          </span>
        )}
      </div>

      {/* Criteria checklist */}
      <ul className="grid grid-cols-1 gap-0.5">
        {CRITERIA.map((c) => {
          const ok = c.test(password);
          return (
            <li
              key={c.label}
              className={`flex items-center gap-1.5 text-xs transition-colors ${
                ok ? "text-green-600" : "text-slate-400"
              }`}
            >
              {ok ? (
                <Check className="h-3 w-3 text-green-500 shrink-0" />
              ) : (
                <X className="h-3 w-3 text-slate-300 shrink-0" />
              )}
              {c.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export function RegisterModal({ children, defaultOpen = false }: RegisterModalProps) {
  const [open, setOpen] = useState(defaultOpen);
  const { register, isLoading } = useAuth();
  const [, navigate] = useLocation();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const strength = useMemo(() => getStrength(form.password), [form.password]);
  const passwordsMatch = form.confirmPassword === "" || form.password === form.confirmPassword;
  const isStrong = strength >= 3; // at least "Razoável" to submit
  const canSubmit = !isLoading && isStrong && form.password === form.confirmPassword && form.confirmPassword.length > 0 && acceptedTerms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    if (!isStrong) {
      setError("Crie uma senha mais segura.");
      return;
    }

    try {
      await register({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      setOpen(false);
      navigate("/cliente");
    } catch {
      // error handled by useAuth toast
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[440px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar conta de Cliente</DialogTitle>
          <DialogDescription>
            Cadastre-se para buscar peças e negociar com desmanches credenciados.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-name">Nome completo</Label>
            <Input
              id="reg-name"
              placeholder="Seu nome"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              data-testid="input-reg-name"
            />
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-email">E-mail</Label>
            <Input
              id="reg-email"
              type="email"
              placeholder="seu@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              data-testid="input-reg-email"
            />
          </div>

          {/* Phone */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-phone">Telefone / WhatsApp</Label>
            <Input
              id="reg-phone"
              placeholder="(11) 99999-9999"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
              data-testid="input-reg-phone"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-password">Senha</Label>
            <div className="relative">
              <Input
                id="reg-password"
                type={showPw ? "text" : "password"}
                placeholder="Crie uma senha segura"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                className="pr-10"
                data-testid="input-reg-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <PasswordStrength password={form.password} />
          </div>

          {/* Confirm password */}
          <div className="space-y-1.5">
            <Label htmlFor="reg-confirm">Confirmar senha</Label>
            <div className="relative">
              <Input
                id="reg-confirm"
                type={showConfirm ? "text" : "password"}
                placeholder="Repita a senha"
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                required
                className={`pr-10 ${
                  !passwordsMatch && form.confirmPassword
                    ? "border-red-400 focus-visible:ring-red-400"
                    : form.confirmPassword && passwordsMatch
                    ? "border-green-400 focus-visible:ring-green-400"
                    : ""
                }`}
                data-testid="input-reg-confirm"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                tabIndex={-1}
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {form.confirmPassword && !passwordsMatch && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <X className="h-3 w-3" /> As senhas não coincidem
              </p>
            )}
            {form.confirmPassword && passwordsMatch && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                <Check className="h-3 w-3" /> Senhas conferem
              </p>
            )}
          </div>

          {/* Aceite de termos */}
          <div className="flex items-start gap-3 rounded-lg border bg-slate-50 p-3">
            <input
              id="accept-terms"
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-primary cursor-pointer"
              data-testid="checkbox-accept-terms"
            />
            <label htmlFor="accept-terms" className="text-sm text-slate-600 cursor-pointer leading-snug">
              Li e aceito a{" "}
              <a
                href="/politica-de-privacidade"
                target="_blank"
                rel="noreferrer"
                className="text-primary font-medium hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                Política de Privacidade e Termos de Uso
              </a>{" "}
              da Central dos Desmanches.
            </label>
          </div>

          {/* Generic error */}
          {error && <p className="text-sm text-red-500">{error}</p>}

          <Button
            type="submit"
            className="w-full h-11 font-semibold"
            disabled={!canSubmit}
            data-testid="button-register"
          >
            {isLoading ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cadastrando...</>
            ) : (
              "Criar conta"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
