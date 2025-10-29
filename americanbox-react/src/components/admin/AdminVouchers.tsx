import { useEffect, useState, useCallback } from "react";
import { api } from "../../lib/api";
import { Search, Pencil, Trash2, PlusCircle, Save, X } from "lucide-react";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

type Voucher = {
  id: number;
  code: string;       // "01"
  name: string;       // FACTURA / NOTA DE CRÉDITO / ...
  estab_code: string; // "001"
  point_code: string; // "001"
  seq: number;
  created_at?: string;
};
type Pager = { page: number; limit: number; total: number; pages: number };

export default function AdminVouchers() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Voucher[]>([]);
  const [pager, setPager] = useState<Pager>({ page:1, limit:10, total:0, pages:1 });
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Voucher | null>(null);
  const [form, setForm] = useState<Voucher>({ id:0, code:"01", name:"FACTURA", estab_code:"001", point_code:"001", seq:0 });
  const [saving, setSaving] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const lastUpdatedLabel = lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "-";

  const load = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const r = await api<{
        ok: boolean;
        items: Voucher[];
        page: number;
        limit: number;
        total: number;
        pages: number;
        error?: string;
        detail?: string;
      }>(`/api/admin/vouchers?q=${encodeURIComponent(q)}&page=${page}&limit=${pager.limit}`);

      if (!r || !r.ok) {
        console.error('[VOUCHERS LIST FAIL]', r?.error, r?.detail);
        setItems([]);
        setPager((p) => ({ ...p, page: 1, total: 0, pages: 1 }));
        return;
      }
      setItems(r.items);
      setPager({ page: r.page, limit: r.limit, total: r.total, pages: r.pages });
      setLastUpdated(Date.now());
    } catch (e:any) {
      console.error('[VOUCHERS LIST EXC]', e);
      setItems([]);
      setPager((p) => ({ ...p, page: 1, total: 0, pages: 1 }));
      setLastUpdated(Date.now());
    } finally {
      setLoading(false);
    }
  }, [q, pager.limit]);


  const handleSubmit = useCallback(async () => {
    if (!form.name.trim() || !form.code.trim()) {
      alert('Completa Código y Tipo de Comprobante');
      return;
    }
    setSaving(true);
    try {
      let ok = false;
      if (editing && editing.id > 0) {
        const r = await api<{ ok:boolean; error?:string }>(`/api/admin/vouchers/${editing.id}`, { method:"PUT", json: form });
        ok = r?.ok || false;
        if (!ok) throw new Error(r?.error || 'Error actualizando');
      } else {
        const r = await api<{ ok:boolean; id:number; error?:string }>(`/api/admin/vouchers`, { method:"POST", json: form });
        ok = r?.ok || false;
        if (!ok) throw new Error(r?.error || 'Error creando');
      }
      setSaving(false);
      if (ok) {
        await load();
        setShowForm(false);
        setEditing(null);
        setForm({ id:0, code:"01", name:"FACTURA", estab_code:"001", point_code:"001", seq:0 });
      }
    } catch (e:any) {
      setSaving(false);
      alert(e?.message || 'No se pudo guardar');
    }
  }, [form, editing, load]);

  const startNew = useCallback(() => {
    setForm({ id:0, code:"01", name:"FACTURA", estab_code:"001", point_code:"001", seq:0 });
    setEditing(null);
    setShowForm(true);
  }, []);

  const startEdit = useCallback((v: Voucher) => {
    setForm({ ...v });
    setEditing(v);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback(async (v: Voucher) => {
    if (!confirm(`¿Eliminar el comprobante "${v.name}" (${v.code})?`)) return;
    try {
      const r = await api<{ ok:boolean; error?:string }>(`/api/admin/vouchers/${v.id}`, { method:"DELETE" });
      if (!r?.ok) throw new Error(r?.error || 'Error eliminando');
      await load(pager.page);
    } catch (e:any) {
      alert(e?.message || 'No se pudo eliminar');
    }
  }, [load, pager.page]);

  useEffect(() => {
    load(1);
  }, [load]);

  /* ===== FORM MODAL ===== */
  if (showForm) {
    return (
      <>
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setShowForm(false)} />
        
        {/* Modal */}
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <section className="bg-white rounded-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{editing ? 'Editar Comprobante' : 'Nuevo Comprobante'}</h2>
          <button onClick={() => setShowForm(false)} className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5">
            <X className="w-4 h-4" /> Cancelar
          </button>
        </div>

        <div className="p-4 grid md:grid-cols-2 gap-4">
          <Field label="Tipo de Comprobante:">
            <select className="inp" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}>
              <option value="FACTURA">FACTURA</option>
              <option value="NOTA DE CRÉDITO">NOTA DE CRÉDITO</option>
              <option value="TICKET DE VENTA">TICKET DE VENTA</option>
            </select>
          </Field>
          <Field label="Código de comprobante:">
            <select
              className="inp"
              value={form.code}
              onChange={e=>setForm({...form, code: e.target.value.padStart(2,'0')})}
            >
              <option value="01">01</option>
              <option value="04">04</option>
              <option value="08">08</option>
            </select>
          </Field>

          <Field label="Código del Establecimiento Emisor:">
            <input className="inp" value={form.estab_code} onChange={e=>setForm({...form, estab_code:e.target.value})} />
          </Field>
          <Field label="Código del Punto de Emisión:">
            <input className="inp" value={form.point_code} onChange={e=>setForm({...form, point_code:e.target.value})} />
          </Field>

          <Field label="Secuencia actual:" className="md:col-span-2">
            <input
              className="inp"
              type="number"
              value={form.seq}
              onChange={e=>setForm({...form, seq: parseInt(e.target.value||'0',10)})}
            />
          </Field>
        </div>

        <div className="px-4 py-3 border-t border-slate-200 flex items-center gap-2">
          <button
            disabled={saving}
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white px-3 py-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar registro'}
          </button>
          <button onClick={() => setShowForm(false)} className="inline-flex items-center gap-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-3 py-2">
            <X className="w-4 h-4" /> Cancelar
          </button>
        </div>
      </section>
        </div>
      </>
    );
  }

  /* ===== LIST ===== */
  useAutoRefresh(() => load(pager.page), {
    deps: [pager.page, q],
    delay: 45_000,
  });

  return (
    <section className="rounded-2xl bg-white border border-slate-200">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Listado de Comprobantes</h2>
        <div className="flex flex-col items-end gap-1">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar..."
              className="pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>
          <span className="text-xs text-slate-500">Ultima actualizacion: {lastUpdatedLabel}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <Th>Id</Th>
              <Th>Código de comprobante</Th>
              <Th>Comprobante</Th>
              <Th>Código del Establecimiento Emisor</Th>
              <Th>Código del Punto de Emisión</Th>
              <Th>Secuencia actual</Th>
              <Th className="text-center">Opciones</Th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr className="border-t">
                <Td colSpan={7}><div className="py-8 text-center text-slate-500">Cargando...</div></Td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr className="border-t">
                <Td colSpan={7}><div className="py-8 text-center text-slate-500">Sin datos.</div></Td>
              </tr>
            )}
            {items.map(v => (
              <tr key={v.id} className="border-t hover:bg-slate-50">
                <Td>{v.id}</Td>
                <Td className="whitespace-nowrap">{v.code}</Td>
                <Td className="whitespace-nowrap">{v.name}</Td>
                <Td className="whitespace-nowrap">{v.estab_code}</Td>
                <Td className="whitespace-nowrap">{v.point_code}</Td>
                <Td className="whitespace-nowrap">{v.seq}</Td>
                <Td>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => startEdit(v)}
                      className="inline-flex items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-medium bg-amber-400/90 hover:bg-amber-400 text-white"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(v)}
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

      {/* Footer de acciones y paginación como en tus capturas */}
      <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
        <button onClick={startNew} className="inline-flex items-center gap-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white px-3 py-2">
          <PlusCircle className="w-4 h-4" /> + Nuevo Registro
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={()=>load(Math.max(1, pager.page-1))}
            className="px-3 py-1.5 rounded-md border disabled:opacity-50"
            disabled={pager.page<=1}
          >
            Anterior
          </button>
          <span className="px-3 py-1.5 rounded-md bg-blue-600 text-white">{pager.page}</span>
          <button
            onClick={()=>load(Math.min(pager.pages, pager.page+1))}
            className="px-3 py-1.5 rounded-md border disabled:opacity-50"
            disabled={pager.page>=pager.pages}
          >
            Siguiente
          </button>
        </div>
      </div>
    </section>
  );
}

/* ——— subcomponentes pequeños ——— */
function Field({ label, children, className="" }:{label:string; children:React.ReactNode; className?:string}) {
  return (
    <label className={["block", className].join(" ")}>
      <span className="block text-sm font-medium text-slate-600 mb-1">{label}</span>
      {children}
    </label>
  );
}
function Th({ children, className="" }:{children:React.ReactNode; className?:string}) {
  return <th className={["px-3 py-2 text-left font-semibold", className].join(" ")}>{children}</th>;
}
function Td({ children, colSpan, className="" }:{children:React.ReactNode; colSpan?:number; className?:string}) {
  return <td colSpan={colSpan} className={["px-3 py-2 align-middle text-slate-700", className].join(" ")}>{children}</td>;
}





