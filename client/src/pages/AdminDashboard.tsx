import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Store,
  FileText,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Menu,
  Bell,
  Search,
  Package,
  Gavel,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import logoImg from "@assets/Design_sem_nome_(23)_1772229532951.png";

// Import Tabs
import OverviewTab from "@/components/admin/OverviewTab";
import DesmanchesTab from "@/components/admin/DesmanchesTab";
import UsersTab from "@/components/admin/UsersTab";
import OrdersTab from "@/components/admin/OrdersTab";
import AuctionsTab from "@/components/admin/AuctionsTab";
import FinanceTab from "@/components/admin/FinanceTab";
import ApprovalsTab from "@/components/admin/ApprovalsTab";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  const { data: stats } = useQuery<{
    totalUsers: number;
    totalDesmanches: number;
    totalOrders: number;
    activeDesmanches: number;
    pendingApprovals: number;
    openOrders: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/dashboard/stats");
      return res.json();
    },
  });

  const pendingCount = stats?.pendingApprovals ?? 0;
  const totalDesmanches = stats?.totalDesmanches ?? 0;
  const userName = user?.name || user?.companyName || "Admin";
  const userEmail = user?.email || "Sistema";
  const userInitials = userName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  const SidebarContent = () => (
    <>
      <div className="flex items-center justify-center px-4 py-6 border-b border-border">
        <img src={logoImg} alt="Central dos Desmanches" className="h-40 w-auto drop-shadow-sm" />
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        <SidebarItem icon={<TrendingUp />} label="Visão Geral" active={activeTab === 'overview'} onClick={() => {setActiveTab('overview'); setIsMobileMenuOpen(false);}} />
        <SidebarItem icon={<Store />} label="Desmanches" active={activeTab === 'desmanches'} badge={totalDesmanches > 0 ? String(totalDesmanches) : undefined} onClick={() => {setActiveTab('desmanches'); setIsMobileMenuOpen(false);}} />
        <SidebarItem icon={<Users />} label="Pessoas Cadastradas" active={activeTab === 'users'} onClick={() => {setActiveTab('users'); setIsMobileMenuOpen(false);}} />
        <SidebarItem icon={<FileText />} label="Anúncios / Pedidos" active={activeTab === 'orders'} onClick={() => {setActiveTab('orders'); setIsMobileMenuOpen(false);}} />
        <SidebarItem icon={<Gavel />} label="Central de Leilões" active={activeTab === 'auctions'} onClick={() => {setActiveTab('auctions'); setIsMobileMenuOpen(false);}} />
        <SidebarItem icon={<DollarSign />} label="Assinaturas & Receitas" active={activeTab === 'finance'} onClick={() => {setActiveTab('finance'); setIsMobileMenuOpen(false);}} />
        <SidebarItem icon={<ShieldCheck />} label="Aprovações" badge={pendingCount > 0 ? String(pendingCount) : undefined} badgeAlert={pendingCount > 0} active={activeTab === 'approvals'} onClick={() => {setActiveTab('approvals'); setIsMobileMenuOpen(false);}} />
      </div>
      
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={user?.avatar} />
            <AvatarFallback>{userInitials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{userName}</span>
            <span className="text-xs text-muted-foreground">{userEmail}</span>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-muted/40 flex flex-col md:flex-row font-sans">
      
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-r border-border flex flex-col hidden md:flex sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
        
        {/* Top Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-4">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 flex flex-col">
                <SidebarContent />
              </SheetContent>
            </Sheet>
            <div className="relative w-64 hidden sm:block">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Buscar pedidos, usuários..." className="pl-9 bg-muted/50 border-none" />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm" className="hidden sm:flex">Ver Site</Button>
            </Link>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
            </Button>
          </div>
        </header>

        {/* Live Ticker Area */}
        <div className="bg-foreground text-background py-2 px-4 flex items-center gap-4 border-b-4 border-primary relative z-20 shrink-0">
          <div className="flex items-center gap-2 font-mono text-sm shrink-0 font-bold z-10 bg-foreground relative">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            LIVE STATUS
          </div>
          <div className="flex-1 overflow-hidden relative">
            <div className="animate-ticker whitespace-nowrap font-mono text-sm flex gap-8 w-fit">
              <span className="text-green-400">1.245 USUÁRIOS ONLINE</span>
              <span className="text-muted-foreground">|</span>
              <span className="text-yellow-400">R$ 14.500 NEGOCIADOS NOS ÚLTIMOS 60 MIN</span>
              <span className="text-muted-foreground">|</span>
              <span className="text-blue-400">23 NOVOS PEDIDOS DE PEÇAS</span>
              <span className="text-muted-foreground">|</span>
              <span>{pendingCount} DESMANCHES AGUARDANDO APROVAÇÃO</span>
              <span className="text-muted-foreground">|</span>
              <span className="text-green-400">1.245 USUÁRIOS ONLINE</span>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'overview' && <OverviewTab />}
          {activeTab === 'desmanches' && <DesmanchesTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'orders' && <OrdersTab />}
          {activeTab === 'auctions' && <AuctionsTab />}
          {activeTab === 'finance' && <FinanceTab />}
          {activeTab === 'approvals' && <ApprovalsTab />}
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active, badge, badgeAlert, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
    >
      <div className="flex items-center gap-3">
        {icon}
        {label}
      </div>
      {badge && (
        <span className={`px-2 py-0.5 rounded-full text-xs ${badgeAlert ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground'}`}>
          {badge}
        </span>
      )}
    </button>
  );
}