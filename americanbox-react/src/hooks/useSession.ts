import { useEffect, useState } from "react";
import { api } from "../lib/api";

export type MeResponse = {
  ok?: boolean;
  logged: boolean;
  role?: "admin" | "customer" | string;
  uid?: number;
  customer_id?: number | null;
  username?: string | null;
  error?: string;
};

export function useSession() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<MeResponse | null>(null);

  useEffect(() => {
    // Primero verificar localStorage para estado de login persistente
    const storedSession = localStorage.getItem('americanbox_session');
    if (storedSession) {
      try {
        const sessionData = JSON.parse(storedSession);
        console.log('📱 Session found in localStorage:', sessionData);
        setMe(sessionData);
        setLoading(false);
        return;
      } catch (e) {
        console.error('Error parsing stored session:', e);
        localStorage.removeItem('americanbox_session');
      }
    }

    // Si no hay sesión en localStorage, verificar con el backend
    (async () => {
      try {
        console.log('🔍 Checking session with backend...');
        const res = await api<MeResponse>("/api/auth/me");
        console.log('🔍 Backend response:', res);

        if (res && res.logged) {
          // Guardar en localStorage para persistencia
          localStorage.setItem('americanbox_session', JSON.stringify(res));
          setMe(res);
        } else {
          setMe({ ok: false, logged: false });
        }
      } catch (e) {
        console.error("Error al obtener sesión:", e);
        setMe({ ok: false, logged: false });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { loading, me };
}
