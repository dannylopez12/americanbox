// src/components/PostLoginRedirect.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

type MeResponse = {
  ok?: boolean;
  logged: boolean;
  role?: "admin" | "customer";
  customer_id?: number | null;
};

export default function PostLoginRedirect() {
  const nav = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      // tu API Node: /api/auth/me (si sigues con PHP usa el endpoint equivalente)
  const me = await api<MeResponse>("/api/auth/me", { method: "GET" });

      if (!mounted) return;

      if (!me.logged) {
        nav("/#login", { replace: true });
        return;
      }

      if (me.role === "admin") {
        nav("/dashboard", { replace: true });
      } else {
        nav("/client", { replace: true });
      }
    })();

    return () => { mounted = false; };
  }, [nav]);

  return (
    <div className="min-h-[60vh] grid place-items-center">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 rounded-2xl animate-pulse bg-amber-400/80" />
        <p className="mt-4 text-slate-600">Validando sesión…</p>
      </div>
    </div>
  );
}
