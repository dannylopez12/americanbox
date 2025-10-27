import { useEffect, useState } from "react";
import { UserCog } from "lucide-react";

import { api } from "../../lib/api";

type Profile = {
  names: string;
  username: string;
  email: string;
  image_url: string | null;
};

const EMPTY_PROFILE: Profile = {
  names: "",
  username: "",
  email: "",
  image_url: null,
};

export default function AdminEditProfile() {
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const r = await api<{ ok: boolean; profile: Profile }>("/api/admin/account/profile");
        if (mounted && r?.ok) {
          setProfile({
            names: r.profile.names ?? "",
            username: r.profile.username ?? "",
            email: r.profile.email ?? "",
            image_url: r.profile.image_url ?? null,
          });
        }
      } catch (error) {
        console.error("[AdminEditProfile] load profile error", error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const r = await api<{ ok: boolean; error?: string }>("/api/admin/account/profile", {
        method: "PUT",
        json: profile,
      });
      if (!r?.ok) throw new Error(r?.error || "No se pudo actualizar el perfil");
      setMessage("Perfil actualizado con exito.");
    } catch (error: any) {
      console.error(error);
      setMessage(error?.message || "No se pudo guardar la informacion.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <p className="text-sm text-slate-500">Cargando perfil...</p>
      </section>
    );
  }

  return (
    <section className="space-y-4 max-w-3xl">
      <header className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-xl bg-amber-100 text-amber-700 grid place-items-center">
          <UserCog className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Editar perfil</h2>
          <p className="text-sm text-slate-500">
            Actualiza tus datos de contacto y personaliza tu avatar para que el resto del equipo pueda reconocerte de
            inmediato.
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-4">
        <Field label="Nombres completos">
          <input
            className="inp"
            value={profile.names}
            onChange={(e) => setProfile((prev) => ({ ...prev, names: e.target.value }))}
          />
        </Field>
        <Field label="Nombre de usuario">
          <input
            className="inp"
            value={profile.username}
            onChange={(e) => setProfile((prev) => ({ ...prev, username: e.target.value }))}
          />
        </Field>
        <Field label="Correo electronico">
          <input
            className="inp"
            value={profile.email}
            onChange={(e) => setProfile((prev) => ({ ...prev, email: e.target.value }))}
          />
        </Field>
        <Field label="Imagen de perfil (URL)">
          <input
            className="inp"
            value={profile.image_url ?? ""}
            onChange={(e) => setProfile((prev) => ({ ...prev, image_url: e.target.value || null }))}
            placeholder="https://..."
          />
        </Field>

        {profile.image_url && (
          <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-500 flex items-center gap-3">
            <img src={profile.image_url} alt="Avatar" className="h-12 w-12 rounded-full object-cover border" />
            <span>Vista previa del avatar</span>
          </div>
        )}

        {message && (
          <div
            className={[
              "rounded-lg px-3 py-2 text-sm",
              message.includes("exito") ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100",
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
            Guardar cambios
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








