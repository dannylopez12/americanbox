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
    (async () => {
      try {
        const res = await api<MeResponse>("/api/auth/me");
        if (res && res.logged) {
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
