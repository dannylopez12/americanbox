// src/components/SignIn.tsx
import { useRef, useState } from "react";
import { User, Mail, Phone, IdCard, Calendar, MapPin, Lock } from "lucide-react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, fdb } from "../lib/firebaseClient";

// Opciones visibles y valor enviado al backend
const TIPO_ID_OPCIONES = [
  { value: "CEDULA", label: "CEDULA" },
  { value: "RUC", label: "RUC" },
  { value: "PASAPORTE", label: "PASAPORTE" },
  { value: "VENTA A CONSUMIDOR FINAL", label: "VENTA A CONSUMIDOR FINAL*" },
  { value: "IDENTIFICACION DEL EXTERIOR", label: "IDENTIFICACION DEL EXTERIOR*" },
] as const;

// Para compatibilidad si alguna parte aún usa códigos numéricos
const mapCodigoToTexto = (v: string) => {
  if (!v) return null;
  switch (v) {
    case "05": return "CEDULA";
    case "04": return "RUC";
    case "06": return "PASAPORTE";
    default:   return v; // ya viene en texto
  }
};

export default function SignIn() {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState({
    nombres: "",
    email: "",
    username: "",
    password: "",
    documento: "",
    celular: "",
    convencional: "",
    direccion: "",
    nacimiento: "",
    genero: "Masculino",
    // Por defecto como en tu captura: CEDULA
    tipoId: "CEDULA",
    facturaEmail: true,
  });

  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    setMsg(null);

    // Normaliza tipo de identificación (acepta “05/04/06” o texto)
    const tipoIdent = mapCodigoToTexto(form.tipoId) as
      | "CEDULA" | "RUC" | "PASAPORTE" | "VENTA A CONSUMIDOR FINAL" | "IDENTIFICACION DEL EXTERIOR" | null;

    const payload = {
      names: form.nombres,
      email: form.email,
      username: form.username || form.email.split("@")[0],
      password: form.password,
      dni: form.documento || null,
      mobile: form.celular || null,
      phone: form.convencional || null,
      address: form.direccion || null,
      birthdate: form.nacimiento || null,
      gender: form.genero === "Masculino" ? "male" : "female",
      identification_type: tipoIdent, // ← ahora enviamos el texto correcto
      send_email_invoice: form.facturaEmail ? 1 : 0,
      role: "customer",
    };

    try {
      if (!auth || !fdb) {
        throw new Error("Firebase no está configurado. Por favor, configura las variables de entorno.");
      }

      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;

      // Guardar datos adicionales en Firestore
      const userData = {
        names: form.nombres,
        email: form.email,
        username: form.username || form.email.split("@")[0],
        dni: form.documento || null,
        mobile: form.celular || null,
        phone: form.convencional || null,
        address: form.direccion || null,
        birthdate: form.nacimiento || null,
        gender: form.genero === "Masculino" ? "male" : "female",
        identification_type: tipoIdent,
        send_email_invoice: form.facturaEmail ? 1 : 0,
        role: "customer",
        created_at: new Date(),
      };

      await setDoc(doc(fdb, 'users', user.uid), userData);

      setMsg("✅ Registro exitoso. Redirigiendo...");
      setTimeout(() => {
        window.location.href = "/login/different";
      }, 1000);
      
    } catch (error: any) {
      console.error("❌ Error en registro:", error);
      setErr(error.message || "Error registrando usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-xl py-10">
      <header className="text-center mb-6">
        <div className="mx-auto w-16 h-16 rounded-2xl grid place-items-center bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow">
          <User className="w-8 h-8" />
        </div>
        <h1 className="mt-4 text-3xl md:text-4xl font-extrabold">Registro de una Cuenta</h1>
      </header>

      <form
        onSubmit={enviar}
        className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-lg p-6 max-w-3xl mx-auto space-y-4"
      >
        {err && <p className="p-3 rounded-lg bg-rose-50 text-rose-700">{err}</p>}
        {msg && <p className="p-3 rounded-lg bg-emerald-50 text-emerald-700">{msg}</p>}

        <Field label="Nombres" icon={<User className="w-4 h-4" />}>
          <input className="input" value={form.nombres} onChange={(e) => set("nombres", e.target.value)} placeholder="Ingresa un nombre" required />
        </Field>

        <Field label="Correo electrónico" icon={<Mail className="w-4 h-4" />}>
          <input className="input" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="email@dominio.com" required />
        </Field>

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Usuario" icon={<User className="w-4 h-4" />}>
            <input className="input" value={form.username} onChange={(e) => set("username", e.target.value)} placeholder="usuario" />
          </Field>
          <Field label="Contraseña" icon={<Lock className="w-4 h-4" />}>
            <input className="input" type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="••••••••" required />
          </Field>
        </div>

        <Field label="Número de documento" icon={<IdCard className="w-4 h-4" />}>
          <input className="input" value={form.documento} onChange={(e) => set("documento", e.target.value)} placeholder="Documento" />
        </Field>

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Teléfono celular" icon={<Phone className="w-4 h-4" />}>
            <input className="input" value={form.celular} onChange={(e) => set("celular", e.target.value)} placeholder="09xxxxxxxx" />
          </Field>
          <Field label="Teléfono convencional" icon={<Phone className="w-4 h-4" />}>
            <input className="input" value={form.convencional} onChange={(e) => set("convencional", e.target.value)} placeholder="02xxxxxxx" />
          </Field>
        </div>

        <Field label="Dirección de facturación" icon={<MapPin className="w-4 h-4" />}>
          <input className="input" value={form.direccion} onChange={(e) => set("direccion", e.target.value)} placeholder="Dirección" />
        </Field>

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Fecha de nacimiento" icon={<Calendar className="w-4 h-4" />}>
            <input className="input" type="date" value={form.nacimiento} onChange={(e) => set("nacimiento", e.target.value)} />
          </Field>
          <Field label="Género">
            <select className="input" value={form.genero} onChange={(e) => set("genero", e.target.value)}>
              <option>Masculino</option>
              <option>Femenino</option>
            </select>
          </Field>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Tipo de identificación">
            <select
              className="input"
              value={form.tipoId}
              onChange={(e) => set("tipoId", e.target.value)}
            >
              {TIPO_ID_OPCIONES.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </Field>

          <label className="flex items-center gap-2 text-sm mt-6 md:mt-0">
            <input
              type="checkbox"
              checked={form.facturaEmail}
              onChange={(e) => set("facturaEmail", e.target.checked)}
            />
            ¿Enviar email de factura?
          </label>
        </div>

        <label className="block">
          <span className="text-sm font-medium text-slate-600">Imagen (opcional)</span>
          <input ref={fileRef} type="file" className="mt-1 block w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-200 file:text-slate-700" />
        </label>

        <button disabled={loading} className="w-full py-3 rounded-xl bg-slate-900 text-white font-semibold hover:brightness-110 transition">
          {loading ? "Registrando..." : "Registrarse"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-600">{label}</span>
      <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white/70 px-3 py-2 focus-within:ring-2 focus-within:ring-amber-400">
        {icon}
        {children}
      </div>
    </label>
  );
}
