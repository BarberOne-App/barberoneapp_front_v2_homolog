export interface OpenCashSession {
  barbershopId: string;
  openedAt: string;
  openedBy: string;
  openedByName: string;
}

const legacyOpenCashSessionKey = "cashClosing:openSession";
const openCashSessionKeyPrefix = "cashClosing:openSession:";

function storedObjectId(key: string) {
  const stored = localStorage.getItem(key);
  if (!stored) return null;

  try {
    const parsed = JSON.parse(stored) as { id?: unknown };
    const id = String(parsed?.id ?? "").trim();
    return id || null;
  } catch {
    return null;
  }
}

export function getActiveBarbershopId(accessBarbershopId?: string | null) {
  const explicitId = String(accessBarbershopId ?? "").trim();
  if (explicitId) return explicitId;

  return storedObjectId("barbershop");
}

function scopedOpenCashSessionKey(barbershopId: string) {
  return `${openCashSessionKeyPrefix}${barbershopId}`;
}

export function clearLegacyOpenCashSession() {
  localStorage.removeItem(legacyOpenCashSessionKey);
}

export function getStoredOpenCashSession(barbershopId?: string | null) {
  // A chave antiga não identificava a barbearia e não pode ser migrada com
  // segurança. Removê-la impede que dados de outro estabelecimento reapareçam.
  clearLegacyOpenCashSession();

  const normalizedBarbershopId = String(barbershopId ?? "").trim();
  if (!normalizedBarbershopId) return null;

  const key = scopedOpenCashSessionKey(normalizedBarbershopId);
  const stored = localStorage.getItem(key);
  if (!stored) return null;

  try {
    const session = JSON.parse(stored) as Partial<OpenCashSession>;
    const isValid =
      session.barbershopId === normalizedBarbershopId &&
      typeof session.openedAt === "string" &&
      typeof session.openedBy === "string" &&
      typeof session.openedByName === "string";

    if (!isValid) {
      localStorage.removeItem(key);
      return null;
    }

    return session as OpenCashSession;
  } catch {
    localStorage.removeItem(key);
    return null;
  }
}

export function storeOpenCashSession(session: OpenCashSession) {
  localStorage.setItem(scopedOpenCashSessionKey(session.barbershopId), JSON.stringify(session));
}

export function removeStoredOpenCashSession(barbershopId?: string | null) {
  clearLegacyOpenCashSession();

  const normalizedBarbershopId = String(barbershopId ?? "").trim();
  if (!normalizedBarbershopId) return;

  localStorage.removeItem(scopedOpenCashSessionKey(normalizedBarbershopId));
}
