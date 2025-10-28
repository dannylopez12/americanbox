import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Search, PlusCircle, Trash2 } from "lucide-react";
import Flatpickr from 'react-flatpickr'
import 'flatpickr/dist/flatpickr.min.css'
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

type Invoice = {
  id: number;
  number: string;
  client_name: string;
  register_date: string | null;
  due_date: string | null;
  subtotal?: number;
  iva?: number;
  discount?: number;
  total?: number;
};
type Pager = { page: number; limit: number; total: number; pages: number };

export default function AdminInvoices() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<Invoice[]>([]);
  const [pager, setPager] = useState<Pager>({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);

  const [dateRange, setDateRange] = useState<string>("");
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const lastUpdatedLabel = lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "-";

  useEffect(() => { load(1); }, [q, dateRange]);

  // New record modal
  const [showNew, setShowNew] = useState(false);
  const [newItem, setNewItem] = useState<{ number:string; client_name:string; register_date?:string; total?:number }>({ number:'', client_name:'', register_date: undefined, total:0 });

  async function load(page = 1) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (dateRange) params.set('date_range', dateRange);
      params.set('page', String(page));
      params.set('limit', String(pager.limit));
      const r = await api<{
        ok: boolean; items: Invoice[]; page: number; limit: number; total: number; pages: number;
      }>(`/api/admin/invoices?${params.toString()}`);
      if (r?.ok) {
        setItems(r.items);
        setPager({ page: r.page, limit: r.limit, total: r.total, pages: r.pages });
      } else {
        setItems([]);
        setPager({ page: 1, limit: pager.limit, total: 0, pages: 1 });
      }
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
      setLastUpdated(Date.now());
    }
  }

  async function eliminar(i: Invoice) {
    if (!confirm(`¿Eliminar factura ${i.number}?`)) return;
  await api(`/api.php/api/admin/invoices/${i.id}`, { method: "DELETE" });
    await load(pager.page);
  }

  async function guardarNuevo() {
    if (!newItem.number || !newItem.client_name) return alert('Rellena número y cliente');
    setLoading(true);
    try {
  const r = await api(`/api.php/api/admin/invoices`, { method:'POST', json: newItem });
      if (!r?.ok) throw new Error(r?.error || 'Error');
      setShowNew(false);
      setNewItem({ number:'', client_name:'', total:0 });
      await load(1);
    } catch (e:any) { alert(e?.message || 'Error creando'); }
    setLoading(false);
  }

  useAutoRefresh(() => load(pager.page), {
    deps: [pager.page, q, dateRange],
    delay: 45_000,
  });

  return (
    <section className="rounded-2xl bg-white border border-slate-200">
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Listado de Facturas</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar..." className="pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-slate-700">Buscar por rango de fechas:</label>
            <div className="flex items-center gap-3">
              <div className="w-72">
                <Flatpickr
                  options={{ mode: 'range', dateFormat: 'Y-m-d', showMonths: 2 }}
                  value={dateRange ? dateRange.split(' - ') : []}
                  onChange={(selected: any[]) => {
                    if (!selected || selected.length === 0) return setDateRange('');
                    if (selected.length === 1) return setDateRange(selected[0].toISOString().slice(0,10));
                    const a = selected[0].toISOString().slice(0,10);
                    const b = selected[1].toISOString().slice(0,10);
                    setDateRange(`${a} - ${b}`);
                  }}
                  className="pl-3 pr-3 py-2 rounded-lg border border-slate-200 bg-white"
                  placeholder="Oprime aquí para abrir el calendario"
                />
              </div>
              <span className="text-xs text-slate-500">Oprime aquí para abrir el calendario</span>
            </div>
          </div>
          <span className="text-xs text-slate-500">Ultima actualizacion: {lastUpdatedLabel}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <Th>Id</Th>
              <Th>N.Comprobante</Th>
              <Th>F.Registro</Th>
              <Th>Cliente</Th>
              <Th>T.Comprobante</Th>
              <Th>E.Comprobante</Th>
              <Th>Subtotal</Th>
              <Th>IVA</Th>
              <Th>Descuento</Th>
              <Th>Total</Th>
              <Th className="text-center">Opciones</Th>
            </tr>
          </thead>
          <tbody>
            {loading && (<tr className="border-t"><Td colSpan={11}><div className="py-8 text-center text-slate-500">Cargando...</div></Td></tr>)}
            {!loading && items.length===0 && (<tr className="border-t"><Td colSpan={11}><div className="py-8 text-center text-slate-500">Sin datos.</div></Td></tr>)}
            {items.map(i=> (
              <tr key={i.id} className="border-t hover:bg-slate-50">
                <Td>{i.id}</Td>
                <Td className="whitespace-nowrap">{i.number}</Td>
                <Td className="whitespace-nowrap">{i.register_date ?? '-'}</Td>
                <Td className="whitespace-nowrap">{i.client_name}</Td>
                <Td className="whitespace-nowrap">-</Td>
                <Td className="whitespace-nowrap">-</Td>
                <Td className="whitespace-nowrap">{i.subtotal ?? '-'}</Td>
                <Td className="whitespace-nowrap">{i.iva ?? '-'}</Td>
                <Td className="whitespace-nowrap">{i.discount ?? '-'}</Td>
                <Td className="whitespace-nowrap">{i.total ?? '-'}</Td>
                <Td>
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={()=>eliminar(i)} className="inline-flex items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-medium bg-red-500/90 hover:bg-red-500 text-white" title="Eliminar"><Trash2 className="w-4 h-4"/></button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
          <button type="button" onClick={()=>setShowNew(true)} className="inline-flex items-center gap-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white px-3 py-2"><PlusCircle className="w-4 h-4"/> Nuevo Registro</button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>load(Math.max(1,pager.page-1))} className="px-3 py-1.5 rounded-md border disabled:opacity-50" disabled={pager.page<=1}>Anterior</button>
          <span className="px-3 py-1.5 rounded-md bg-blue-600 text-white">{pager.page}</span>
          <button onClick={()=>load(Math.min(pager.pages,pager.page+1))} className="px-3 py-1.5 rounded-md border disabled:opacity-50" disabled={pager.page>=pager.pages}>Siguiente</button>
        </div>
      </div>

      {/* Nuevo registro modal */}
      {showNew && (
        <div className="fixed inset-0 z-50 bg-black/40 grid place-items-center p-3">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Creación de una Factura (rápido)</h3>
              <button type="button" onClick={()=>setShowNew(false)} className="p-2 rounded-md hover:bg-slate-100">✕</button>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <label className="block"><span className="block text-sm text-slate-600 mb-1">Número</span><input className="inp" value={newItem.number} onChange={e=>setNewItem({...newItem, number:e.target.value})} /></label>
              <label className="block"><span className="block text-sm text-slate-600 mb-1">Cliente</span><input className="inp" value={newItem.client_name} onChange={e=>setNewItem({...newItem, client_name:e.target.value})} /></label>
              <label className="block"><span className="block text-sm text-slate-600 mb-1">Fecha</span><input type="date" className="inp" value={newItem.register_date||''} onChange={e=>setNewItem({...newItem, register_date:e.target.value||undefined})} /></label>
              <label className="block"><span className="block text-sm text-slate-600 mb-1">Total</span><input type="number" step="0.01" className="inp" value={newItem.total||0} onChange={e=>setNewItem({...newItem, total: Number(e.target.value||0)})} /></label>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button type="button" onClick={()=>setShowNew(false)} className="px-3 py-2 rounded-lg border">Cancelar</button>
              <button type="button" onClick={guardarNuevo} className="inline-flex items-center gap-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white px-3 py-2">Guardar</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Th({ children, className="" }:{children:React.ReactNode; className?:string}){ return <th className={["px-3 py-2 text-left font-semibold", className].join(" ")}>{children}</th> }
function Td({ children, colSpan, className="" }:{children:React.ReactNode; colSpan?:number; className?:string}){ return <td colSpan={colSpan} className={["px-3 py-2 align-middle text-slate-700", className].join(" ")}>{children}</td> }
