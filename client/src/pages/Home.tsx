import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LoginModal } from "@/components/auth/LoginModal";
import { RegisterModal } from "@/components/auth/RegisterModal";
import { 
  ArrowRight, 
  ShieldCheck, 
  TrendingUp,
  Search,
  CheckCircle2,
  Wrench,
  Gavel,
  Menu
} from "lucide-react";
import engineImg from "@/assets/images/engine-3d.png";
import logoImg from "@assets/Design_sem_nome_(23)_1772229532951.png";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Stock Ticker Banner */}
      <div className="bg-foreground text-background py-2 px-4 flex items-center gap-4 border-b-4 border-primary relative z-50">
        <div className="flex items-center gap-2 font-mono text-sm shrink-0 font-bold z-10 bg-foreground relative">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          LIVE STATUS
        </div>
        <div className="flex-1 overflow-hidden relative">
          <div className="animate-ticker whitespace-nowrap font-mono text-sm flex gap-8 w-fit">
            <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-400"/> 1,245 pessoas negociando agora</span>
            <span className="text-muted-foreground">|</span>
            <span className="flex items-center gap-2 text-yellow-300">42 desmanches online</span>
            <span className="text-muted-foreground">|</span>
            <span>R$ 145.000 em peças negociadas hoje</span>
            <span className="text-muted-foreground">|</span>
            <span className="flex items-center gap-2"><Gavel className="h-4 w-4"/> Leilão SP encerrando em 2h</span>
            <span className="text-muted-foreground">|</span>
            <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-green-400"/> 1,245 pessoas negociando agora</span>
            <span className="text-muted-foreground">|</span>
            <span className="flex items-center gap-2 text-yellow-300">42 desmanches online</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-24 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="Central dos Desmanches" className="h-20 md:h-24 w-auto drop-shadow-md" />
          </div>
          
          <div className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/como-funciona" className="hover:text-foreground transition-colors">Como Funciona</Link>
            <a href="#leiloes" className="hover:text-foreground transition-colors">Central de Leilões</a>
            <Link href="/cadastro-desmanche" className="hover:text-foreground transition-colors">Para Desmanches</Link>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <LoginModal>
              <Button variant="outline" data-testid="button-login">Entrar</Button>
            </LoginModal>
            <RegisterModal>
              <Button className="font-semibold" data-testid="button-register">Cadastre-se</Button>
            </RegisterModal>
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden flex items-center">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] flex flex-col pt-12">
                <div className="flex flex-col gap-6 text-lg font-medium text-muted-foreground">
                  <Link href="/como-funciona" className="hover:text-foreground transition-colors">Como Funciona</Link>
                  <a href="#leiloes" className="hover:text-foreground transition-colors">Central de Leilões</a>
                  <Link href="/cadastro-desmanche" className="hover:text-foreground transition-colors">Para Desmanches</Link>
                </div>
                <div className="flex flex-col gap-4 mt-8 border-t pt-8">
                  <LoginModal>
                    <Button variant="outline" className="w-full" data-testid="button-login-mobile">Entrar</Button>
                  </LoginModal>
                  <RegisterModal>
                    <Button className="w-full font-semibold" data-testid="button-register-mobile">Cadastre-se</Button>
                  </RegisterModal>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden bg-slate-950">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 z-10" />
          {/* Fundo de malha geométrica sutil para dar ar tecnológico */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] z-0" />
        </div>
        
        <div className="container mx-auto px-4 relative z-20 flex flex-col md:flex-row items-center gap-12">
          <div className="max-w-3xl md:w-3/5 text-slate-50">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/20 mb-6">
              <ShieldCheck className="h-4 w-4" />
              <span className="text-sm font-medium">100% Desmanches Credenciados pelo Detran</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold font-mono leading-tight mb-6">
              A Ponte Certa Entre <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                Sua Necessidade
              </span> <br />
              e a Peça Original.
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
              Carros, motos, barcos ou aviões. Conectamos pessoas que buscam peças de qualidade a desmanches rigorosamente documentados. Rápido, seguro e direto.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <RegisterModal defaultTab="client">
                <Button size="lg" className="h-14 px-8 text-lg font-semibold rounded-full" data-testid="hero-search-parts">
                  <Search className="mr-2 h-5 w-5" />
                  Procuro uma Peça
                </Button>
              </RegisterModal>
              <Link href="/cadastro-desmanche">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-semibold rounded-full bg-background/50 backdrop-blur-sm border-2" data-testid="hero-register-yard">
                  <Store className="mr-2 h-5 w-5" />
                  Sou um Desmanche
                </Button>
              </Link>
            </div>
            
            <div className="mt-12 flex items-center gap-6 text-sm text-muted-foreground font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Negociação via WhatsApp</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>Sem taxas ocultas</span>
              </div>
            </div>
          </div>
          
          <div className="md:w-2/5 relative hidden md:block">
            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full" />
            <img 
              src={logoImg} 
              alt="Central dos Desmanches" 
              className="w-full max-w-lg mx-auto relative z-10 animate-in fade-in zoom-in duration-1000 drop-shadow-2xl" 
            />
          </div>
        </div>
      </section>

      {/* Como Funciona */}
      <section id="como-funciona" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-mono mb-4">Como a plataforma funciona?</h2>
            <p className="text-muted-foreground text-lg">Um ecossistema inteligente desenhado para gerar negócios rápidos e seguros.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Para o Público */}
            <Card className="border-2 border-primary/10 shadow-lg relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
              <CardContent className="p-8">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold font-mono mb-6">Para quem procura</h3>
                <ol className="space-y-6 relative">
                  <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-border -z-10" />
                  {[
                    "Cadastre sua solicitação de peça com detalhes e fotos.",
                    "O sistema dispara seu pedido para a rede de desmanches compatíveis.",
                    "Receba propostas diretamente na plataforma ou no seu WhatsApp.",
                    "Feche negócio com segurança com empresas documentadas."
                  ].map((step, i) => (
                    <li key={i} className="flex gap-4 items-start bg-background p-3 rounded-lg shadow-sm border">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold shrink-0 shadow-md">
                        {i + 1}
                      </span>
                      <p className="pt-1 text-muted-foreground font-medium">{step}</p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>

            {/* Para o Desmanche */}
            <Card className="border-2 border-secondary/20 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-secondary" />
              <CardContent className="p-8">
                <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold font-mono mb-6">Para o Desmanche</h3>
                <ol className="space-y-6 relative">
                  <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-border -z-10" />
                  {[
                    "Faça seu credenciamento provando regularidade (Detran).",
                    "Acesse o painel e veja centenas de pedidos em tempo real.",
                    "Filtre por tipo de veículo (Carro, Moto, Barco) e marca.",
                    "Chame o cliente direto no WhatsApp e feche a venda."
                  ].map((step, i) => (
                    <li key={i} className="flex gap-4 items-start bg-background p-3 rounded-lg shadow-sm border">
                      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary text-secondary-foreground font-bold shrink-0 shadow-md">
                        {i + 1}
                      </span>
                      <p className="pt-1 text-muted-foreground font-medium">{step}</p>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-24 bg-card relative overflow-hidden border-t">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 opacity-5 pointer-events-none">
          <Wrench className="w-96 h-96" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 text-center md:text-left">
              <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/20 border-primary/20" variant="outline">
                Apenas Empresas Credenciadas
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold font-mono mb-6 max-w-3xl">
                Aumente suas vendas. <br />Junte-se à maior rede do Brasil.
              </h2>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl">
                Acesso exclusivo por assinatura mensal. O credenciamento é rigoroso, mas o resultado é garantido.
              </p>
              <Link href="/cadastro-desmanche">
                <Button size="lg" className="h-16 px-10 text-xl font-bold rounded-full shadow-xl shadow-primary/20 hover:scale-105 transition-transform" data-testid="cta-final-register">
                  Quero Cadastrar Meu Desmanche <ArrowRight className="ml-2" />
                </Button>
              </Link>
            </div>
            <div className="flex-shrink-0 hidden md:block relative">
              <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full" />
              <img
                src={engineImg}
                alt="Peça automotiva"
                className="w-full max-w-md relative z-10 drop-shadow-2xl animate-in fade-in zoom-in duration-700"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 py-16 border-t border-slate-900 text-slate-400">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="flex items-center gap-8 flex-col md:flex-row text-center md:text-left">
              <img src={logoImg} alt="Central dos Desmanches" className="h-32 md:h-40 w-auto drop-shadow-lg" />
              <div className="max-w-md">
                <h4 className="text-2xl font-bold text-slate-50 mb-3 font-mono">10 Anos de Tradição e Confiança</h4>
                <p className="text-base leading-relaxed">
                  Com uma década de forte atuação no mercado automotivo, a Central dos Desmanches consolidou-se como a maior e mais segura referência nacional na conexão inteligente entre desmanches credenciados e compradores exigentes.
                </p>
              </div>
            </div>
            <div className="text-sm font-medium flex flex-col items-center md:items-end gap-2">
              <span>© {new Date().getFullYear()} Central dos Desmanches.</span>
              <span className="text-slate-500">Todos os direitos reservados.</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Temporary Store icon definition
function Store(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}