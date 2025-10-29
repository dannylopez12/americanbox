// src/components/LoginDifferent.tsx
import { useState } from "react";
import { Eye, EyeOff, Lock, LogIn } from "lucide-react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebaseClient";

type LoginResponse = {
  ok: boolean;
  redirect?: string;
  user?: {
    id: number;
    customer_id: number | null;
    username: string;
    names?: string | null;
    email?: string | null;
    is_admin: boolean;
    role?: "admin" | "customer";
  };
  error?: string;
};

export default function LoginDifferent() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const isAdminMode = window.location.pathname.startsWith("/dashboard");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);

    try {
      await signInWithEmailAndPassword(auth, user, pass);
      // Firebase Auth maneja la sesión automáticamente
      // El hook useSession detectará el cambio
      console.log("Login successful");
      // Redirect se maneja en useSession o en el componente padre
    } catch (error: any) {
      setErr(error.message || "Error en login");
    } finally {
      setLoading(false);
    }
  };

      // Guardar información de sesión en localStorage
      const sessionData = {
        ok: true,
        logged: true,
        role: res.user?.role || (res.user?.is_admin ? 'admin' : 'customer'),
        uid: res.user?.id,
        customer_id: res.user?.customer_id || null,
        username: res.user?.username
      };
      localStorage.setItem('americanbox_session', JSON.stringify(sessionData));
      console.log('💾 Session saved to localStorage:', sessionData);

      window.location.href = res.redirect;
      return;
    }

    // Fallback si no hay redirect (no debería suceder)
    console.warn("No redirect received from backend, using fallback logic");
    const isAdmin = Boolean(res.user?.is_admin || res.user?.role === 'admin');
    window.location.href = isAdmin ? "/dashboard" : "/client";
  };

  return (
    <div className="container-xl py-10">
      <header className="text-center mb-6">
        <div className="mx-auto w-16 h-16 rounded-2xl grid place-items-center bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="mt-4 text-3xl md:text-4xl font-extrabold">Inicio de Sesión</h1>
      </header>

      <form
        onSubmit={submit}
        className="max-w-xl mx-auto bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-lg p-6 space-y-4"
      >
        {err && <p className="p-3 rounded-lg bg-rose-50 text-rose-700">{err}</p>}

        <label className="block">
          <span className="text-sm font-medium text-slate-600">Username</span>
          <input
            value={user}
            onChange={(e) => setUser(e.target.value)}
            className="w-full mt-1 rounded-xl border border-slate-200 bg-white/70 py-3 px-4 outline-none focus:ring-2 focus:ring-amber-400"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-600">Contraseña</span>
          <div className="mt-1 relative">
            <input
              type={show ? "text" : "password"}
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white/70 py-3 pr-12 px-4 outline-none focus:ring-2 focus:ring-amber-400"
              required
            />
            <button
              type="button"
              onClick={() => setShow(v => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
            >
              {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </label>

        <button
          disabled={loading}
          className="w-full py-3 rounded-xl bg-slate-900 text-white font-semibold hover:brightness-110 transition"
        >
          <span className="inline-flex items-center gap-2">
            <LogIn className="w-4 h-4" />
            {loading ? "Ingresando..." : "Ingresar"}
          </span>
        </button>

        <p className="text-center text-sm text-slate-500 mt-2">
          Si has olvidado tu contraseña{" "}
          <a href="#" className="text-amber-600 underline">da click aquí 🔑</a>
        </p>
      </form>
    </div>
  );
}
