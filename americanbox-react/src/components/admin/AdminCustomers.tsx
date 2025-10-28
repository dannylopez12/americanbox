// src/components/admin/AdminCustomers.tsx
import { useEffect, useState, useCallback } from "react";
import { api } from "../../lib/api";
import { Search, Pencil, Trash2, PlusCircle, Save, X } from "lucide-react";

type Customer = {
  id: number;
  names: string;
  email: string | null;
  image_url: string | null;
  dni: string | null;
  mobile: string | null;
  phone: string | null;
  address: string | null;
  birthdate: string | null; // yyyy-mm-dd
  gender: "male" | "female" | null;
  identification_type: string | null;
  send_email_invoice: 0|1;
  created_at?: string;
};

type Pager = { page: number; limit: number; total: number; pages: number };

export default function AdminCustomers() {
  const [items, setItems] = useState<Customer[]>([]);
  const [pager, setPager] = useState<Pager>({ page:1, limit:10, total:0, pages:1 });
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<Customer|null>(null);

  const empty: Customer = {
    id: 0, names: "", email: null, image_url: null, dni: null,
    mobile: null, phone: null, address: null, birthdate: null,
    gender: null, identification_type: "VENTA A CONSUMIDOR FINAL", send_email_invoice: 0,
  };
  const [form, setForm] = useState<Customer>(empty);

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    const r = await api<{ ok:boolean; items:Customer[]; page:number; limit:number; total:number; pages:number }>(
      `/api/admin/customers?q=${encodeURIComponent(q)}&page=${page}&limit=${pager.limit}`
    );
    if (r?.ok) {
      setItems(r.items);
      setPager({ page: r.page, limit: r.limit, total: r.total, pages: r.pages });
    }
    setLoading(false);
  }, [q, pager.limit]);

  useEffect(()=>{ load(1); /* on mount */ },[load]);
  useEffect(()=>{ const id = setTimeout(()=>load(1), 350); return ()=>clearTimeout(id); },[q, load]);

  function openNew() { setEditing(null); setForm(empty); setShowForm(true); }
  function openEdit(c:Customer) { setEditing(c); setForm({ ...c }); setShowForm(true); }

  async function onSave() {
    if (!form.names.trim()) return;
    setSaving(true);
    if (editing) {
  await api(`/api.php/api/admin/customers/${editing.id}`, { method:"PUT", json: {
        ...form,
      }});
    } else {
  await api(`/api.php/api/admin/customers`, { method:"POST", json: {
        ...form,
      }});
    }
    setSaving(false);
    setShowForm(false);
    await load(pager.page);
  }

  async function onDelete(c:Customer) {
    if (!confirm(`¿Eliminar al cliente "${c.names}"?`)) return;
  await api(`/api.php/api/admin/customers/${c.id}`, { method:"DELETE" });
    await load(pager.page);
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Clientes</h2>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-3 py-2"
        >
          <PlusCircle className="w-4 h-4" /> Nuevo cliente
        </button>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
        <div className="p-3 flex items-center justify-between gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={e=>setQ(e.target.value)}
              placeholder="Buscar por nombre, email, cédula..."
              className="pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div className="text-sm text-slate-600">
            {pager.total} registros • Página {pager.page} de {pager.pages}
          </div>
        </div>

        <div className="border-t border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <Th>Id</Th>
                <Th>Nombres</Th>
                <Th>Tipo de identificación</Th>
                <Th>Número de cédula</Th>
                <Th>Teléfono</Th>
                <Th>Email</Th>
                <Th className="text-center">Opciones</Th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr className="border-t"><Td colSpan={7}><div className="py-8 text-center text-slate-500">Cargando...</div></Td></tr>
              )}
              {!loading && items.length === 0 && (
                <tr className="border-t"><Td colSpan={7}><div className="py-8 text-center text-slate-500">Sin datos.</div></Td></tr>
              )}

              {items.map(c=>(
                <tr key={c.id} className="border-t hover:bg-slate-50">
                  <Td className="font-medium">{c.id}</Td>
                  <Td className="whitespace-nowrap">{c.names}</Td>
                  <Td className="whitespace-nowrap">{c.identification_type ?? "-"}</Td>
                  <Td className="whitespace-nowrap">{c.dni ?? "-"}</Td>
                  <Td className="whitespace-nowrap">{c.mobile || c.phone || "-"}</Td>
                  <Td className="whitespace-nowrap">{c.email ?? "-"}</Td>
                  <Td>
                    <div className="flex items-center justify-center gap-2">
                      {/* Editar - amarillo */}
                      <button
                        onClick={()=>openEdit(c)}
                        className="inline-flex items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-medium bg-amber-400/90 hover:bg-amber-400 text-white"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {/* Eliminar - rojo */}
                      <button
                        onClick={()=>onDelete(c)}
                        className="inline-flex items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-medium bg-red-500/90 hover:bg-red-500 text-white"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginación simple */}
        <div className="p-3 border-t border-slate-200 flex items-center justify-end gap-2">
          <button
            disabled={pager.page<=1}
            onClick={()=>load(pager.page-1)}
            className="px-3 py-1.5 rounded-md border disabled:opacity-50"
          >Anterior</button>
          <button
            disabled={pager.page>=pager.pages}
            onClick={()=>load(pager.page+1)}
            className="px-3 py-1.5 rounded-md border disabled:opacity-50"
          >Siguiente</button>
        </div>
      </div>

      {/* Modal Crear/Editar */}
      {showForm && (
        <div className="fixed inset-0 z-40 bg-black/40 grid place-items-center p-3">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">{editing ? 'Edición de un Cliente' : 'Nuevo Cliente'}</h3>
              <button onClick={()=>setShowForm(false)} className="p-2 rounded-md hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Nombres">
                <input className="inp" value={form.names} onChange={e=>setForm({...form, names:e.target.value})} />
              </Field>
              <Field label="Correo electrónico">
                <input className="inp" value={form.email ?? ''} onChange={e=>setForm({...form, email:e.target.value||null})} />
              </Field>

              <Field label="Número de documento">
                <input className="inp" value={form.dni ?? ''} onChange={e=>setForm({...form, dni:e.target.value||null})} />
              </Field>
              <Field label="Teléfono celular">
                <input className="inp" value={form.mobile ?? ''} onChange={e=>setForm({...form, mobile:e.target.value||null})} />
              </Field>

              <Field label="Teléfono convencional">
                <input className="inp" value={form.phone ?? ''} onChange={e=>setForm({...form, phone:e.target.value||null})} />
              </Field>
              <Field label="Dirección de facturación">
                <input className="inp" value={form.address ?? ''} onChange={e=>setForm({...form, address:e.target.value||null})} />
              </Field>

              <Field label="Fecha de nacimiento">
                <input type="date" className="inp" value={form.birthdate ?? ''} onChange={e=>setForm({...form, birthdate:e.target.value||null})} />
              </Field>
              <Field label="Género">
                <select
                  className="inp"
                  value={form.gender ?? ''}
                  onChange={e=>setForm({...form, gender: (e.target.value as "male" | "female") || null})}
                >
                  <option value="">--</option>
                  <option value="male">Masculino</option>
                  <option value="female">Femenino</option>
                </select>
              </Field>

              <Field label="Tipo de identificación" className="md:col-span-2">
                <select
                  className="inp"
                  value={form.identification_type ?? ''}
                  onChange={e=>setForm({...form, identification_type: e.target.value || null})}
                >
                  <option value="">-- seleccione --</option>
                  <option value="VENTA A CONSUMIDOR FINAL">VENTA A CONSUMIDOR FINAL</option>
                  <option value="CEDULA">CEDULA</option>
                  <option value="RUC">RUC</option>
                  <option value="PASAPORTE">PASAPORTE</option>
                </select>
              </Field>

              <label className="flex items-center gap-2 md:col-span-2 text-sm">
                <input
                  type="checkbox"
                  checked={!!form.send_email_invoice}
                  onChange={e=>setForm({...form, send_email_invoice: e.target.checked ? 1 : 0})}
                />
                ¿Enviar email de factura?
              </label>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button onClick={()=>setShowForm(false)} className="px-3 py-2 rounded-lg border">Cancelar</button>
              <button
                onClick={onSave}
                disabled={saving || !form.names.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

/* ————— util subcomponentes ————— */
function Field({ label, children, className="" }: {label:string; children:React.ReactNode; className?:string}) {
  return (
    <label className={["text-sm", className].join(" ")}>
      <span className="block mb-1 text-slate-600">{label}</span>
      {children}
    </label>
  );
}
function Th({ children, className="" }: { children:React.ReactNode; className?:string }) {
  return <th className={["px-3 py-2 text-left font-semibold", className].join(" ")}>{children}</th>;
}
function Td({ children, colSpan, className="" }: { children:React.ReactNode; colSpan?:number; className?:string }) {
  return <td colSpan={colSpan} className={["px-3 py-2 align-middle text-slate-700", className].join(" ")}>{children}</td>;
}

/* Tailwind helpers */
