import { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

import {
  SUPER_ADMIN_ACCESS_STORAGE_KEY,
  fetchMe,
  googleLogin as googleLoginRequest,
  login as loginRequest,
  logout as logoutRequest,
  switchBarbershop as switchBarbershopRequest,
} from "../service/authService";
import type { AuthResponse } from "../service/authService";

export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  isAdmin?: boolean;
  photoUrl?: string | null;
  permissions?: Record<string, boolean> | null;
  phone?: string | null;
  cpf?: string | null;
  birthDate?: string | null;
  birth_date?: string | null;
}

export type SuperAdminBarbershopAccess = NonNullable<AuthResponse["barbershop"]>;

export interface AuthContextData {
  user: User | null;
  signed: boolean;
  loading: boolean;
  barbershopAccess: SuperAdminBarbershopAccess | null;

  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (accessToken: string, profileData?: { phone?: string; cpf?: string; birthDate?: string; password?: string }, slug?: string) => Promise<AuthResponse>;
  logout: () => void;
  updateUser: (user: User) => void;
  enterBarbershopAccess: (barbershopId: string) => Promise<SuperAdminBarbershopAccess>;
  exitBarbershopAccess: () => Promise<void>;
}

interface Props {
  children: ReactNode;
}

function getStoredUser(): User | null {
  const storedToken = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  if (!storedToken || !storedUser) {
    // Limpa apenas se houver estado parcial (token sem user ou user sem token)
    if (storedToken || storedUser) {
      logoutRequest();
    }
    return null;
  }

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    logoutRequest();
    return null;
  }
}

function getStoredBarbershopAccess(user: User | null): SuperAdminBarbershopAccess | null {
  if (user?.role !== "super_admin") {
    localStorage.removeItem(SUPER_ADMIN_ACCESS_STORAGE_KEY);
    return null;
  }

  const storedAccess = localStorage.getItem(SUPER_ADMIN_ACCESS_STORAGE_KEY);
  if (!storedAccess) return null;

  try {
    const access = JSON.parse(storedAccess) as SuperAdminBarbershopAccess;
    return access?.id ? access : null;
  } catch {
    localStorage.removeItem(SUPER_ADMIN_ACCESS_STORAGE_KEY);
    return null;
  }
}

export const AuthContext = createContext<AuthContextData | null>(null);

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [barbershopAccess, setBarbershopAccess] = useState<SuperAdminBarbershopAccess | null>(() =>
    getStoredBarbershopAccess(getStoredUser())
  );

  /* Ao montar, sincroniza permissões com o servidor.
     Garante que mudanças feitas pelo admin tomem efeito sem re-login. */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetchMe()
      .then((fresh) => {
        localStorage.setItem("user", JSON.stringify(fresh));
        setUser(fresh);

        setBarbershopAccess((currentAccess) => {
          if (fresh.role === "super_admin" && currentAccess && fresh.barbershop?.id !== currentAccess.id) {
            localStorage.removeItem(SUPER_ADMIN_ACCESS_STORAGE_KEY);
            return null;
          }
          return currentAccess;
        });
      })
      .catch(() => {
        /* Ignora erros de rede — mantém sessão local */
      });
  }, []);

  async function login(email: string, password: string) {
    console.info("[AuthContext] Iniciando loginRequest.", { email });

    const storedBarbershop = localStorage.getItem("barbershop");
    let barbershopId: string | undefined = undefined;
    if (storedBarbershop) {
      try {
        barbershopId = JSON.parse(storedBarbershop).id || undefined;
      } catch {
        // Ignora valor legado inválido e segue o login sem barbearia pré-selecionada.
      }
    }

    const response = await loginRequest({
      email,
      password,
      barbershopId,
    });

    console.info("[AuthContext] Resposta de login recebida.", {
      userId: response.user?.id,
      userEmail: response.user?.email,
      role: response.user?.role,
      hasUser: Boolean(response.user),
      hasBarbershop: Boolean(response.currentBarbershop || response.barbershop),
    });

    localStorage.setItem("user", JSON.stringify(response.user));

    localStorage.removeItem(SUPER_ADMIN_ACCESS_STORAGE_KEY);
    setBarbershopAccess(null);
    if (response.user?.role === "super_admin") {
      localStorage.removeItem("barbershop");
      window.dispatchEvent(new Event("barbershop:updated"));
    }

    setUser(response.user);
    console.info("[AuthContext] Estado de usuario atualizado.");
  }

  async function loginWithGoogle(
    accessToken: string,
    profileData?: { phone?: string; cpf?: string; birthDate?: string; password?: string },
    slug?: string
  ): Promise<AuthResponse> {
    const response = await googleLoginRequest(accessToken, profileData, slug);
    localStorage.setItem("user", JSON.stringify(response.user));
    // Não chama setUser aqui — Login.tsx chama updateUser após decidir o fluxo (modal ou navegação)
    // para evitar que PublicRoute redirecione antes do modal ser exibido
    return response;
  }

  function logout() {
    logoutRequest();
    setBarbershopAccess(null);
    setUser(null);
  }

  function updateUser(updatedUser: User) {
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    window.dispatchEvent(new Event("user:updated"));
  }

  async function enterBarbershopAccess(barbershopId: string) {
    if (user?.role !== "super_admin") {
      throw new Error("Apenas o superadmin pode acessar qualquer barbearia.");
    }

    const response = await switchBarbershopRequest(barbershopId);
    if (!response.barbershop) {
      throw new Error("A barbearia selecionada não foi retornada pelo servidor.");
    }

    localStorage.setItem(SUPER_ADMIN_ACCESS_STORAGE_KEY, JSON.stringify(response.barbershop));
    setBarbershopAccess(response.barbershop);
    setUser(response.user);
    window.dispatchEvent(new Event("user:updated"));
    return response.barbershop;
  }

  async function exitBarbershopAccess() {
    if (user?.role !== "super_admin") return;

    const response = await switchBarbershopRequest(null);
    localStorage.removeItem(SUPER_ADMIN_ACCESS_STORAGE_KEY);
    setBarbershopAccess(null);
    setUser(response.user);
    window.dispatchEvent(new Event("user:updated"));
  }

  const signed = Boolean(user && localStorage.getItem("token"));

  return (
    <AuthContext.Provider
      value={{
        user,
        signed,
        loading: false,
        barbershopAccess,
        login,
        loginWithGoogle,
        logout,
        updateUser,
        enterBarbershopAccess,
        exitBarbershopAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

