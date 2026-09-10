import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  const method = config.method?.toUpperCase() || "GET";

  console.info("[api] Request", {
    method,
    baseURL: config.baseURL,
    url: config.url,
    hasToken: Boolean(token),
  });

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    console.info("[api] Response", {
      method: response.config.method?.toUpperCase(),
      url: response.config.url,
      status: response.status,
    });

    return response;
  },
  (error) => {
    const responseMessage = typeof error?.response?.data === "string"
      ? error.response.data
      : Array.isArray(error?.response?.data)
        ? error.response.data.join(" ")
        : String(error?.response?.data?.message || "");

    if (
      error?.response?.status === 403 &&
      responseMessage.toLowerCase().includes("acesso indisponível para esta barbearia")
    ) {
      sessionStorage.setItem(
        "accessBlockedMessage",
        "O acesso da barbearia foi suspenso. Entre novamente para consultar e regularizar a assinatura."
      );
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("barbershop");
      localStorage.removeItem("superAdminBarbershopAccess");
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    if (error?.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.removeItem("barbershop");
      localStorage.removeItem("superAdminBarbershopAccess");

      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    console.error("[api] Response error", {
      method: error?.config?.method?.toUpperCase(),
      url: error?.config?.url,
      baseURL: error?.config?.baseURL,
      status: error?.response?.status,
      statusText: error?.response?.statusText,
      responseData: error?.response?.data,
      message: error?.message,
      hasRequestWithoutResponse: Boolean(error?.request && !error?.response),
    });

    return Promise.reject(error);
  }
);

export default api;
