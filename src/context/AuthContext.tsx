import { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

import { fetchMe, login as loginRequest, logout as logoutRequest } from "../service/authService";

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

export interface AuthContextData {
  user: User | null;
  signed: boolean;
  loading: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

interface Props {
  children: ReactNode;
}

function getStoredUser(): User | null {
  const storedToken = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");

  if (!storedToken || !storedUser) {
    console.info("[AuthContext] Sessao incompleta no localStorage.", {
      hasToken: Boolean(storedToken),
      hasUser: Boolean(storedUser),
    });
    logoutRequest();
    return null;
  }

  try {
    const parsedUser = JSON.parse(storedUser) as User;

    console.info("[AuthContext] Usuario carregado do localStorage.", {
      id: parsedUser.id,
      email: parsedUser.email,
      role: parsedUser.role,
    });

    return parsedUser;
  } catch {
    console.warn("[AuthContext] Usuario salvo estava invalido. Removendo localStorage.");
    logoutRequest();
    return null;
  }
}

export const AuthContext = createContext<AuthContextData | null>(null);

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(() => getStoredUser());

  /* Ao montar, sincroniza permissões com o servidor.
     Garante que mudanças feitas pelo admin tomem efeito sem re-login. */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetchMe()
      .then((fresh) => {
        localStorage.setItem("user", JSON.stringify(fresh));
        setUser(fresh);
      })
      .catch(() => {
        /* Ignora erros de rede — mantém sessão local */
      });
  }, []);

  async function login(email: string, password: string) {
    console.info("[AuthContext] Iniciando loginRequest.", { email });

    const response = await loginRequest({
      email,
      password,
    });

    console.info("[AuthContext] Resposta de login recebida.", {
      userId: response.user?.id,
      userEmail: response.user?.email,
      role: response.user?.role,
      hasUser: Boolean(response.user),
      hasBarbershop: Boolean(response.currentBarbershop || response.barbershop),
    });

    localStorage.setItem("user", JSON.stringify(response.user));

    setUser(response.user);
    console.info("[AuthContext] Estado de usuario atualizado.");
  }

  function logout() {
    logoutRequest();
    setUser(null);
  }

  function updateUser(updatedUser: User) {
    localStorage.setItem("user", JSON.stringify(updatedUser));
    setUser(updatedUser);
    window.dispatchEvent(new Event("user:updated"));
  }

  const signed = Boolean(user && localStorage.getItem("token"));

  return (
    <AuthContext.Provider
      value={{
        user,
        signed,
        loading: false,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

