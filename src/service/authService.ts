import api from "./api";

function maskToken(token?: string) {
  if (!token) {
    return null;
  }

  return `${token.slice(0, 8)}...${token.slice(-4)}`;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken?: string;
  token?: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role?: string;
    isAdmin?: boolean;
  };
  barbershop?: {
    id: string;
    name: string;
    slug: string;
    status?: string;
    logoUrl?: string;
  } | null;
  currentBarbershop?: {
    id: string;
    name: string;
    slug: string;
    status?: string;
    logoUrl?: string;
  } | null;
}

export async function login(data: LoginPayload) {
  console.info("[authService] Enviando login para /auth/login.", {
    email: data.email,
    passwordLength: data.password.length,
  });

  const response = await api.post<AuthResponse>("/auth/login", data);
  const accessToken = response.data.accessToken || response.data.token || "";

  console.info("[authService] Login retornou com sucesso.", {
    hasAccessToken: Boolean(accessToken),
    accessTokenPreview: maskToken(accessToken),
    hasRefreshToken: Boolean(response.data.refreshToken),
    refreshTokenPreview: maskToken(response.data.refreshToken),
    userId: response.data.user?.id,
    userEmail: response.data.user?.email,
    currentBarbershopId: response.data.currentBarbershop?.id,
    barbershopId: response.data.barbershop?.id,
  });

  localStorage.setItem("token", accessToken);
  localStorage.setItem("refreshToken", response.data.refreshToken);
  localStorage.setItem("user", JSON.stringify(response.data.user));

  console.info("[authService] Dados de autenticacao salvos no localStorage.", {
    hasToken: Boolean(localStorage.getItem("token")),
    hasRefreshToken: Boolean(localStorage.getItem("refreshToken")),
    hasUser: Boolean(localStorage.getItem("user")),
  });

  if (response.data.currentBarbershop) {
    localStorage.setItem(
      "barbershop",
      JSON.stringify(response.data.currentBarbershop)
    );

    console.info("[authService] Barbearia atual salva no localStorage.", {
      id: response.data.currentBarbershop.id,
      slug: response.data.currentBarbershop.slug,
      status: response.data.currentBarbershop.status,
    });
  } else {
    console.warn("[authService] Resposta de login sem currentBarbershop.");
  }

  return response.data;
}

export async function register(data: RegisterPayload) {
  console.info("[authService] Enviando cadastro para /auth/register.", {
    name: data.name,
    email: data.email,
    passwordLength: data.password.length,
  });

  const response = await api.post("/auth/register", data);

  console.info("[authService] Cadastro retornou com sucesso.", {
    status: response.status,
  });

  return response.data;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("barbershop");
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem("token"));
}
