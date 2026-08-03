import { useEffect, useState } from "react";

import { getMyBarber, type Barber } from "@/service/barberService";

export function useMyBarber(enabled = true) {
  const [barber, setBarber] = useState<Barber | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    getMyBarber()
      .then(setBarber)
      .catch((err: unknown) => {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          (err instanceof Error ? err.message : "Erro ao carregar perfil do barbeiro");
        setError(msg);
      })
      .finally(() => setLoading(false));
  }, [enabled]);

  return { barber, loading, error };
}
