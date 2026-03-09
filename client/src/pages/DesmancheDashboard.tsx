import { useState } from "react";
import { Link } from "wouter";
import {
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Menu,
  Bell,
  Package,
  FileCheck,
  UserCircle,
  Users,
  MessageCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { getToken } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import logoImg from "@assets/Design_sem_nome_(23)_1772229532951.png";

import DesmancheOverviewTab from "@/components/desmanche/DesmancheOverviewTab";
import DesmancheOrdersTab from "@/components/desmanche/DesmancheOrdersTab";
import DesmancheDocsTab from "@/components/desmanche/DesmancheDocsTab";
import DesmancheFinanceTab from "@/components/desmanche/DesmancheFinanceTab";
import DesmancheProfileTab from "@/components/desmanche/DesmancheProfileTab";
import DesmancheNegotiationsTab from "@/components/desmanche/DesmancheNegotiationsTab";

export default function DesmancheDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const { data: desmanche } = useQuery({
    queryKey: ["/api/desmanches/me"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/desmanches/me");
      return res.json();
    },
    enabled: !!getToken(),
    staleTime: 60 * 1000,
  });

  const { data: openOrders = [] } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/orders?status=open");
      return res.json();
    },
    enabled: !!getToken(),
    refetchInterval: 30 * 1000,
    staleTime: 0,
  });

  const desmancheName = desmanche?.tradingName || user?.companyName || user?.name || "Desmanche";
  const desmancheInitials = desmancheName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const planLabel = desmanche?.plan === "monthly" ? "Assinatura Mensal" : desmanche?.plan === "percentage" ? "Porcentagem sobre Vendas" : "Assinatura Mensal";
  const openOrdersCount = Array.isArray(openOrders) ? openOrders.length : 0;

  const SidebarContent = () => (
    <>
      <div className="h-24 flex items-center justify-center px-4 border-b border-slate-800 bg-slate-950">
        <div className="flex items-center gap-2">
          <img src={logoImg} alt="Central dos Desmanches" className="h-14 w-auto drop-shadow-sm brightness-110" />
        </div>
      </div>
      
      <div className="p-4 border-b border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <Avatar className="border-2 border-primary/50">
            <AvatarImage src={desmanche?.logo ? desmanche.logo : undefined} />
            <AvatarFallback>{desmancheInitials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white">{desmancheName}</span>
            <span className={`text-xs flex items-center gap-1 ${desmanche?.status === "active" ? "text-green-400" : "text-yellow-400"}`}>
              <span className={`w-1.5 h-1.5 rounded-full inline-block ${desmanche?.status === "active" ? "bg-green-400" : "bg-yellow-400"}`}></span>
              {desmanche?.status === "active" ? "Credenciado" : desmanche?.status === "pending" ? "Aguardando Aprovação" : "Inativo"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        <SidebarItem icon={<TrendingUp />} label="Meu Painel" active={activeTab === 'overview'} onClick={() => {setActiveTab('overview'); setIsMobileMenuOpen(false);}} />
        <SidebarItem
          icon={<Package />}
          label="Mural de Pedidos"
          badge={openOrdersCount > 0 ? String(openOrdersCount) : undefined}
          badgeAlert={openOrdersCount > 0}
          active={activeTab === 'orders'}
          onClick={() => {setActiveTab('orders'); setIsMobileMenuOpen(false);}}
        />
        <SidebarItem icon={<MessageCircle />} label="Minhas Negociações" active={activeTab === 'negotiations'} onClick={() => {setActiveTab('negotiations'); setIsMobileMenuOpen(false);}} />
        <SidebarItem icon={<FileCheck />} label="Minha Documentação" active={activeTab === 'docs'} onClick={() => {setActiveTab('docs'); setIsMobileMenuOpen(false);}} />
        <SidebarItem icon={<DollarSign />} label="Assinatura & Faturas" active={activeTab === 'finance'} onClick={() => {setActiveTab('finance'); setIsMobileMenuOpen(false);}} />
        <SidebarItem icon={<UserCircle />} label="Perfil da Empresa" active={activeTab === 'profile'} onClick={() => {setActiveTab('profile'); setIsMobileMenuOpen(false);}} />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col hidden md:flex sticky top-0 h-screen text-slate-300">
        <SidebarContent />
      </aside>

      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <div className="hidden sm:flex items-center gap-2 text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-md">
              <span className="text-primary font-bold">Plano Atual:</span> {planLabel}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" className="hidden sm:flex" onClick={logout}>Sair do Painel</Button>
            <Button variant="ghost" size="icon" className="relative text-slate-600">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {activeTab === 'overview' && <DesmancheOverviewTab onNavigate={setActiveTab} />}
          {activeTab === 'orders' && <DesmancheOrdersTab />}
          {activeTab === 'negotiations' && <DesmancheNegotiationsTab />}
          {activeTab === 'docs' && <DesmancheDocsTab />}
          {activeTab === 'finance' && <DesmancheFinanceTab />}
          {activeTab === 'profile' && <DesmancheProfileTab />}
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, badge, badgeAlert, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium transition-all ${
        active 
          ? 'bg-primary text-white shadow-md shadow-primary/20' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <div className="flex items-center gap-3">
        {icon}
        {label}
      </div>
      {badge && (
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
          active ? 'bg-white/20 text-white' :
          badgeAlert ? 'bg-red-500 text-white' : 'bg-slate-800 text-slate-300'
        }`}>
          {badge}
        </span>
      )}
    </button>
  );
}
