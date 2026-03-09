import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "./use-toast";

export type UserType = "client" | "admin" | "desmanche";

export interface UserAddress {
  id: string;
  userId: string;
  zipCode: string;
  street: string;
  number?: string;
  complement?: string;
  city: string;
  state: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp?: string;
  type: UserType;
  avatar?: string;
  profileComplete?: boolean;
  address?: UserAddress | null;
  status?: string;
  rating?: number;
  salesCount?: number;
  plan?: string;
  companyName?: string;
  cnpj?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  login: (email: string, password: string, type?: "user" | "desmanche") => Promise<void>;
  logout: () => void;
  register: (data: RegisterData) => Promise<void>;
  registerDesmanche: (data: RegisterDesmancheData) => Promise<any>;
}

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface RegisterDesmancheData {
  companyName: string;
  tradingName: string;
  cnpj: string;
  email: string;
  phone: string;
  password: string;
  plan: "percentage" | "monthly";
  responsibleName: string;
  responsibleCpf: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Token storage
const TOKEN_KEY = "peca_rapida_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null>({
    queryKey: ["/api/users/me"],
    queryFn: async () => {
      const token = getToken();
      if (!token) return null;
      
      try {
        const res = await fetch("/api/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (res.status === 401) {
            removeToken();
            return null;
          }
          throw new Error("Failed to fetch user");
        }
        return await res.json();
      } catch (error) {
        removeToken();
        return null;
      }
    },
    staleTime: Infinity,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: async ({ 
      email, 
      password, 
      type = "user" 
    }: { 
      email: string; 
      password: string; 
      type?: "user" | "desmanche";
    }) => {
      const endpoint = type === "desmanche" 
        ? "/api/auth/login-desmanche" 
        : "/api/auth/login";
      
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Login failed");
      }

      const data = await res.json();
      setToken(data.token);
      return data.user;
    },
    onSuccess: (userData) => {
      queryClient.setQueryData(["/api/users/me"], userData);
      queryClient.invalidateQueries();
      toast({
        title: "Login realizado com sucesso",
        description: "Bem-vindo de volta!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no login",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Registration failed");
      }

      const result = await res.json();
      setToken(result.token);
      return result.user;
    },
    onSuccess: (userData) => {
      queryClient.setQueryData(["/api/users/me"], userData);
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      toast({
        title: "Cadastro realizado com sucesso",
        description: "Sua conta foi criada!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerDesmancheMutation = useMutation({
    mutationFn: async (data: RegisterDesmancheData) => {
      const res = await fetch("/api/auth/register-desmanche", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || "Registration failed");
      }

      const result = await res.json();
      setToken(result.token);
      return result.user;
    },
    onSuccess: (userData) => {
      queryClient.setQueryData(["/api/users/me"], userData);
      queryClient.invalidateQueries({ queryKey: ["/api/users/me"] });
      toast({
        title: "Cadastro realizado com sucesso",
        description: "Seu desmanche foi cadastrado! Aguardando aprovação.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const login = async (email: string, password: string, type?: "user" | "desmanche") => {
    await loginMutation.mutateAsync({ email, password, type });
  };

  const register = async (data: RegisterData) => {
    await registerMutation.mutateAsync(data);
  };

  const registerDesmanche = async (data: RegisterDesmancheData) => {
    return await registerDesmancheMutation.mutateAsync(data);
  };

  const logout = () => {
    removeToken();
    queryClient.clear();
    toast({
      title: "Logout realizado",
      description: "Você saiu da sua conta.",
    });
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error: error as Error | null,
        login,
        logout,
        register,
        registerDesmanche,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function useAuthenticatedQuery<T>(
  queryKey: string[],
  options?: { enabled?: boolean }
) {
  const token = getToken();
  
  return useQuery<T>({
    queryKey,
    queryFn: async () => {
      if (!token) throw new Error("Not authenticated");
      const res = await fetch(queryKey.join("/"), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Request failed");
      return res.json();
    },
    enabled: !!token && options?.enabled !== false,
    retry: false,
  });
}
