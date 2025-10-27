import { useEffect, useMemo, useState } from "react";
import {
  Search,
  PlusCircle,
  Pencil,
  Trash2,
  LogIn,
  RefreshCcw,
  Lock,
  LockOpen,
  ShieldCheck,
} from "lucide-react";

import { api } from "../../lib/api";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

type AdminUser = {
  id: number;
  names: string;
  username: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  dni: string | null;
  identification_type: string | null;
  price_per_lb: number | null;
  role: string | null;
  is_admin: boolean | number;
  groups?: string[] | null;
  active?: boolean;
  image_url?: string | null;
  last_login?: string | null;
  created_at: string;
  updated_at: string | null;
};

type Pager = { page: number; limit: number; total: number; pages: number };

type UserForm = {
  names: string;
  username: string;
  email: string;
  role: string;
  groups: string;
  active: boolean;
  password: string;
  confirm_password: string;
  image_url: string;
};

const DEFAULT_FORM: UserForm = {
  names: "",
  username: "",
  email: "",
  role: "admin",
  groups: "",
  active: true,
  password: "",
  confirm_password: "",
  image_url: "",
};

export default function AdminSecurityUsers() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<AdminUser[]>([]);
  const [pager, setPager] = useState<Pager>({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<UserForm>(DEFAULT_FORM);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [saving, setSaving] = useState(false);

  async function load(page = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(pager.limit));
      if (q.trim()) params.set("q", q.trim());

      const r = await api<{
        ok: boolean;
        items: AdminUser[];
        page: number;
        limit: number;
        total: number;
        pages: number;
      }>(`/api/admin/users?${params.toString()}`);

      if (r?.ok) {
        setItems(r.items);
        setPager({ page: r.page, limit: r.limit, total: r.total, pages: r.pages });
      } else {
        setItems([]);
        setPager({ page: 1, limit: pager.limit, total: 0, pages: 1 });
      }
    } catch (error) {
      console.error("[AdminSecurityUsers] load error", error);
      setItems([]);
    } finally {
      setLoading(false);
      setLastUpdated(Date.now());
    }
  }

  useEffect(() => {
    void load(1);
  }, []);

  useEffect(() => {
    const handler = window.setTimeout(() => {
      void load(1);
    }, 350);
    return () => clearTimeout(handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useAutoRefresh(() => load(pager.page), {
    deps: [pager.page, q],
    delay: 45_000,
  });

  const lastUpdatedLabel = lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "-";

  const openNew = () => {
    setEditing(null);
    setForm(DEFAULT_FORM);
    setShowForm(true);
  };

  const openEdit = (user: AdminUser) => {
    setEditing(user);
    setForm({
      names: user.names,
      username: user.username,
      email: user.email ?? "",
      role: user.role ?? "admin",
      groups: (user.groups ?? []).join(", "),
      active: user.active ?? true,
      password: "",
      confirm_password: "",
      image_url: user.image_url ?? "",
    });
    setShowForm(true);
  };

  async function onSave() {
    if (!form.names.trim() || !form.username.trim()) {
      alert("Completa nombres y username");
      return;
    }
    if (!editing && form.password.trim().length < 6) {
      alert("La contrasena debe tener al menos 6 caracteres");
      return;
    }
    if (form.password !== form.confirm_password) {
      alert("Las contrasenas no coinciden");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        names: form.names.trim(),
        username: form.username.trim(),
        email: form.email.trim() || null,
        role: form.role,
        groups: form.groups
          .split(",")
          .map((g) => g.trim())
          .filter(Boolean),
        active: form.active ? 1 : 0,
        password: form.password ? form.password : undefined,
        image_url: form.image_url || null,
      };

      if (editing) {
        await api(`/api/admin/users/${editing.id}`, { method: "PUT", json: payload });
      } else {
        await api(`/api/admin/users`, { method: "POST", json: payload });
      }
      setShowForm(false);
      void load(editing ? pager.page : 1);
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "No se pudo guardar el usuario");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(user: AdminUser) {
    if (!confirm(`Eliminar al usuario "${user.names}"?`)) return;
    await api(`/api/admin/users/${user.id}`, { method: "DELETE" });
    void load(pager.page);
  }

  async function onToggleActive(user: AdminUser) {
    await api(`/api/admin/users/${user.id}/toggle`, { method: "POST" });
    void load(pager.page);
  }

  async function onResetPassword(user: AdminUser) {
    if (!confirm(`Enviar reseteo de contrasena a ${user.username}?`)) return;
    await api(`/api/admin/users/${user.id}/reset-password`, { method: "POST" });
    alert("Solicitud de reseteo enviada.");
  }

  async function onImpersonate(user: AdminUser) {
    if (!confirm(`¿Iniciar sesión como ${user.names || user.username}?`)) return;
    
    try {
      const r = await api<{ ok: boolean; redirect?: string; message?: string }>(`/api/admin/users/${user.id}/login-as`, {
        method: "POST",
      });
      
      if (r?.ok) {
        alert(r.message || `Sesión iniciada como ${user.names || user.username}`);
        window.location.href = r.redirect || "/dashboard";
      } else {
        alert("No fue posible iniciar sesión como este usuario.");
      }
    } catch (error) {
      console.error("Error impersonating user:", error);
      alert("Error al intentar iniciar sesión como este usuario.");
    }
  }

  const roleBadge = (role: string | null | undefined) => {
    if (!role) return <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs">-</span>;
    const map: Record<string, string> = {
      admin: "bg-amber-100 text-amber-700",
      staff: "bg-sky-100 text-sky-700",
      customer: "bg-emerald-100 text-emerald-700",
    };
    return (
      <span className={["px-2 py-0.5 rounded-full text-xs font-medium", map[role] ?? "bg-slate-100 text-slate-600"].join(" ")}>
        {role.toUpperCase()}
      </span>
    );
  };

  const groupsLabel = (groups?: string[] | null) =>
    groups && groups.length > 0 ? groups.join(", ") : "Sin grupo";

  const avatarInitials = useMemo(
    () =>
      (items || []).reduce<Record<number, string>>((acc, user) => {
        const initials = user.names
          .split(" ")
          .filter(Boolean)
          .map((part) => part[0]?.toUpperCase() ?? "")
          .slice(0, 2)
          .join("");
        acc[user.id] = initials || user.username.slice(0, 2).toUpperCase();
        return acc;
      }, {}),
    [items]
  );

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            Usuarios del sistema
          </h2>
          <p className="text-sm text-slate-500">
            Gestiona los accesos administrativos, impersona sesiones y controla estados sin abandonar el panel.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white px-3 py-2 text-sm"
          >
            <PlusCircle className="w-4 h-4" /> Nuevo usuario
          </button>
        </div>
      </header>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="p-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nombre, usuario o correo..."
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <span className="text-xs text-slate-500">Ultima actualizacion: {lastUpdatedLabel}</span>
        </div>

        <div className="border-t border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <Th>Id</Th>
                <Th>Nombres</Th>
                <Th>Username</Th>
                <Th>Correo</Th>
                <Th>Rol</Th>
                <Th>Grupos</Th>
                <Th>Estado</Th>
                <Th className="text-center">Opciones</Th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr className="border-t">
                  <Td colSpan={8}>
                    <div className="py-8 text-center text-slate-500">Cargando usuarios...</div>
                  </Td>
                </tr>
              )}
              {!loading && (items || []).length === 0 && (
                <tr className="border-t">
                  <Td colSpan={8}>
                    <div className="py-8 text-center text-slate-500">No se encontraron usuarios para los filtros.</div>
                  </Td>
                </tr>
              )}
              {(items || []).map((user) => (
                <tr key={user.id} className="border-t hover:bg-slate-50">
                  <Td>{user.id}</Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <span className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-semibold text-slate-600 overflow-hidden">
                        {user.image_url ? (
                          <img src={user.image_url} alt={user.names} className="h-full w-full object-cover" />
                        ) : (
                          avatarInitials[user.id]
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-slate-800 truncate">{user.names}</p>
                        {user.last_login && (
                          <p className="text-xs text-slate-500">Altimo acceso: {formatDate(user.last_login)}</p>
                        )}
                      </div>
                    </div>
                  </Td>
                  <Td className="whitespace-nowrap">{user.username}</Td>
                  <Td className="whitespace-nowrap">{user.email ?? "-"}</Td>
                  <Td>{roleBadge(user.role)}</Td>
                  <Td className="whitespace-nowrap">{groupsLabel(user.groups)}</Td>
                  <Td>
                    <span
                      className={[
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                        user.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600",
                      ].join(" ")}
                    >
                      {user.active ? "Activo" : "Suspendido"}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-center gap-2">
                      <IconButton title="Editar" color="amber" onClick={() => openEdit(user)}>
                        <Pencil className="w-4 h-4" />
                      </IconButton>
                      <IconButton title="Eliminar" color="red" onClick={() => onDelete(user)}>
                        <Trash2 className="w-4 h-4" />
                      </IconButton>
                      <IconButton title="Logearse al sistema" color="sky" onClick={() => onImpersonate(user)}>
                        <LogIn className="w-4 h-4" />
                      </IconButton>
                      <IconButton title="Resetear password" color="slate" onClick={() => onResetPassword(user)}>
                        <RefreshCcw className="w-4 h-4" />
                      </IconButton>
                      <IconButton
                        title={user.active ? "Suspender" : "Activar"}
                        color={user.active ? "slate" : "emerald"}
                        onClick={() => onToggleActive(user)}
                      >
                        {user.active ? <Lock className="w-4 h-4" /> : <LockOpen className="w-4 h-4" />}
                      </IconButton>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <footer className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Pagina {pager.page} de {pager.pages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => load(Math.max(1, pager.page - 1))}
              className="px-3 py-1.5 rounded-md border disabled:opacity-50"
              disabled={pager.page <= 1 || loading}
            >
              Anterior
            </button>
            <span className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm">{pager.page}</span>
            <button
              onClick={() => load(Math.min(pager.pages, pager.page + 1))}
              className="px-3 py-1.5 rounded-md border disabled:opacity-50"
              disabled={pager.page >= pager.pages || loading}
            >
              Siguiente
            </button>
          </div>
        </footer>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-40 bg-black/40 grid place-items-center p-3">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">
                {editing ? "Edicion de un Usuario" : "Nuevo Usuario"}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-md hover:bg-slate-100">
<span className="sr-only">Cerrar</span>X
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Nombres">
                <input
                  className="inp"
                  value={form.names}
                  onChange={(e) => setForm((prev) => ({ ...prev, names: e.target.value }))}
                />
              </Field>
              <Field label="Username">
                <input
                  className="inp"
                  value={form.username}
                  onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
                />
              </Field>
              <Field label="Correo electronico">
                <input
                  className="inp"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </Field>
              <Field label="Rol">
                <select
                  className="inp"
                  value={form.role}
                  onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
                >
                  <option value="admin">Administrador</option>
                  <option value="staff">Staff</option>
                  <option value="customer">Cliente</option>
                </select>
              </Field>
              <Field label="Grupos (separados por coma)" className="md:col-span-2">
                <input
                  className="inp"
                  value={form.groups}
                  onChange={(e) => setForm((prev) => ({ ...prev, groups: e.target.value }))}
                />
              </Field>
              <Field label="Imagen (URL)">
                <input
                  className="inp"
                  value={form.image_url}
                  onChange={(e) => setForm((prev) => ({ ...prev, image_url: e.target.value }))}
                />
              </Field>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
                />
                Usuario activo
              </label>

              <Field label="Contrasena" className="md:col-span-2">
                <input
                  type="password"
                  className="inp"
                  value={form.password}
                  placeholder={editing ? "Dejar vacio para mantener" : ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                />
              </Field>
              <Field label="Confirmacion de contrasena" className="md:col-span-2">
                <input
                  type="password"
                  className="inp"
                  value={form.confirm_password}
                  placeholder={editing ? "Dejar vacio para mantener" : ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, confirm_password: e.target.value }))}
                />
              </Field>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="px-3 py-2 rounded-lg border">
                Cancelar
              </button>
              <button
                onClick={onSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 disabled:opacity-50"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={["text-sm text-slate-600 font-medium flex flex-col gap-1", className].join(" ")}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={["px-3 py-2 text-left font-semibold", className].join(" ")}>{children}</th>;
}

function Td({
  children,
  colSpan,
  className = "",
}: {
  children: React.ReactNode;
  colSpan?: number;
  className?: string;
}) {
  return (
    <td colSpan={colSpan} className={["px-3 py-2 align-middle text-slate-700", className].join(" ")}>
      {children}
    </td>
  );
}

function IconButton({
  title,
  color,
  onClick,
  children,
}: {
  title: string;
  color: "red" | "amber" | "sky" | "slate" | "emerald";
  onClick: () => void;
  children: React.ReactNode;
}) {
  const palette: Record<typeof color, string> = {
    red: "bg-red-500/90 hover:bg-red-500 text-white",
    amber: "bg-amber-400/90 hover:bg-amber-400 text-white",
    sky: "bg-sky-500/90 hover:bg-sky-500 text-white",
    slate: "bg-slate-500/90 hover:bg-slate-500 text-white",
    emerald: "bg-emerald-500/90 hover:bg-emerald-500 text-white",
  } as const;

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={["inline-flex items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-medium", palette[color]].join(" ")}
    >
      {children}
    </button>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}














