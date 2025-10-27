import { useState } from "react";
import { KeyRound } from "lucide-react";

import { api } from "../../lib/api";

export default function AdminChangePassword() {
  const [form, setForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    if (!form.current_password.trim() || !form.new_password.trim()) {
      setMessage("Completa todos los campos.");
      return;
    }
    if (form.new_password.length < 6) {
      setMessage("La nueva contrasena debe tener al menos 6 caracteres.");
      return;
    }
    if (form.new_password !== form.confirm_password) {
      setMessage("Las contrasenas no coinciden.");
      return;
    }

    setSaving(true);
    try {
      const r = await api<{ ok: boolean; error?: string }>("/api/admin/account/password", {
        method: "POST",
        json: form,
      });
      if (!r?.ok) throw new Error(r?.error || "No se pudo actualizar la contrasena");
      setMessage("Contrasena actualizada correctamente.");
      setForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (error: any) {
      console.error(error);
      setMessage(error?.message || "Error inesperado al actualizar la contrasena.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="max-w-2xl space-y-4">
      <header className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-xl bg-sky-100 text-sky-700 grid place-items-center">
          <KeyRound className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Cambiar contrasena</h2>
          <p className="text-sm text-slate-500">
            Refuerza la seguridad del panel actualizando tu contrasena con regularidad. Necesitas tu clave actual y la
            nueva clave que deseas establecer.
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-4">
        <Field label="Contrasena actual">
          <input
            type="password"
            className="inp"
            value={form.current_password}
            onChange={(e) => setForm((prev) => ({ ...prev, current_password: e.target.value }))}
          />
        </Field>
        <Field label="Contrasena nueva">
          <input
            type="password"
            className="inp"
            value={form.new_password}
            onChange={(e) => setForm((prev) => ({ ...prev, new_password: e.target.value }))}
          />
        </Field>
        <Field label="Confirmacion de contrasena">
          <input
            type="password"
            className="inp"
            value={form.confirm_password}
            onChange={(e) => setForm((prev) => ({ ...prev, confirm_password: e.target.value }))}
          />
        </Field>

        {message && (
          <div
            className={[
              "rounded-lg px-3 py-2 text-sm",
              message.includes("correctamente") ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100",
            ].join(" ")}
          >
            {message}
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 disabled:opacity-50"
          >
            Actualizar contrasena
          </button>
        </div>
      </form>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm text-slate-600 font-medium">
      <span>{label}</span>
      {children}
    </label>
  );
}



