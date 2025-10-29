import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Search, Trash2 } from "lucide-react";
import Flatpickr from 'react-flatpickr'
import 'flatpickr/dist/flatpickr.min.css'
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

type ReceiptError = {
  id: number;
  invoice_number?: string;
  register_date?: string;
  type?: string;
  stage?: string;
  environment?: string;
  errors?: string;
};
type Pager = { page: number; limit: number; total: number; pages: number };

export default function AdminReceiptErrors(){
  const [q,setQ]=useState("");
  const [items,setItems]=useState<ReceiptError[]>([]);
  const [pager,setPager]=useState<Pager>({page:1,limit:10,total:0,pages:1});
  const [loading,setLoading]=useState(false);

  const [dateRange,setDateRange]=useState("");
  const [typeFilter,setTypeFilter]=useState("");
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const lastUpdatedLabel = lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "-";

  useEffect(()=>{ load(1); },[q,dateRange,typeFilter]);

  async function load(page=1){
    setLoading(true);
    try{
  const params = new URLSearchParams(); if (q) params.set('q',q); if (dateRange) params.set('date_range',dateRange); if (typeFilter) params.set('type', typeFilter); params.set('page',String(page)); params.set('limit',String(pager.limit));
  const r = await api<{ok:boolean; items:ReceiptError[]; page:number; limit:number; total:number; pages:number}>(`/api/admin/receipt-errors?${params.toString()}`);
      if (r?.ok) { setItems(r.items); setPager({page:r.page, limit:r.limit, total:r.total, pages:r.pages}); }
      else { setItems([]); setPager({page:1, limit:pager.limit, total:0, pages:1}); }
    }catch(e){ setItems([]); }
    setLoading(false);
    setLastUpdated(Date.now());
  }

  async function eliminar(r:ReceiptError){ if(!confirm(`¿Eliminar registro ${r.id}?`)) return; await api(`/api/admin/receipt-errors/${r.id}`, { method:"DELETE" }); await load(pager.page); }

  // No crear desde interfaz: view-only
  useAutoRefresh(() => load(pager.page), {
    deps: [pager.page, q, dateRange, typeFilter],
    delay: 45_000,
  });

  return (
    <section className="rounded-2xl bg-white border border-slate-200">
      <div className="px-4 py-3 border-b border-slate-200">
        <h2 className="text-lg font-semibold mb-3">Listado de Errores de los Comprobantes</h2>
        <div className="grid md:grid-cols-2 gap-3 items-center">
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
                    placeholder="Seleccionar rango de fechas"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <label className="flex-1 md:flex-none"><span className="block text-sm text-slate-600 mb-1">Seleccionar Tipo de Comprobante:</span>
              <select value={typeFilter} onChange={e=>setTypeFilter(e.target.value)} className="w-full md:w-72 px-3 py-2 rounded-lg border border-slate-200">
                <option value="">----------</option>
                <option value="NOTA DE CRÉDITO">NOTA DE CRÉDITO - 001 - 001</option>
                <option value="TICKET DE VENTA">TICKET DE VENTA - 001 - 001</option>
                <option value="FACTURA">FACTURA - 001 - 001</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-600"><tr>
            <Th>Fecha de registro</Th><Th>Número de factura</Th><Th>Tipo de comprobante</Th><Th>Etapa</Th><Th>Ambiente</Th><Th>Errores</Th><Th className="text-center">Opciones</Th>
          </tr></thead>
          <tbody>
            {loading && <tr className="border-t"><Td colSpan={7}><div className="py-8 text-center text-slate-500">Cargando...</div></Td></tr>}
            {!loading && items.length===0 && <tr className="border-t"><Td colSpan={7}><div className="py-8 text-center text-slate-500">Sin datos.</div></Td></tr>}
            {items.map(r=> (<tr key={r.id} className="border-t hover:bg-slate-50"><Td>{r.register_date??'-'}</Td><Td>{r.invoice_number??'-'}</Td><Td>{r.type??'-'}</Td><Td>{r.stage??'-'}</Td><Td>{r.environment??'-'}</Td><Td>{r.errors??'-'}</Td><Td><div className="flex items-center justify-center gap-2"><button onClick={()=>eliminar(r)} className="inline-flex items-center justify-center rounded-md px-2.5 py-1.5 text-xs font-medium bg-red-500/90 hover:bg-red-500 text-white" title="Eliminar"><Trash2 className="w-4 h-4"/></button></div></Td></tr>))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2"><span className="text-xs text-slate-500">Ultima actualizacion: {lastUpdatedLabel}</span></div>
        <div className="flex items-center gap-2"><button onClick={()=>load(Math.max(1,pager.page-1))} className="px-3 py-1.5 rounded-md border disabled:opacity-50" disabled={pager.page<=1}>Anterior</button><span className="px-3 py-1.5 rounded-md bg-blue-600 text-white">{pager.page}</span><button onClick={()=>load(Math.min(pager.pages,pager.page+1))} className="px-3 py-1.5 rounded-md border disabled:opacity-50" disabled={pager.page>=pager.pages}>Siguiente</button></div>
      </div>
    </section>
  );
}

function Th({ children, className="" }:{children:React.ReactNode; className?:string}){ return <th className={["px-3 py-2 text-left font-semibold", className].join(" ")}>{children}</th> }
function Td({ children, colSpan, className="" }:{children:React.ReactNode; colSpan?:number; className?:string}){ return <td colSpan={colSpan} className={["px-3 py-2 align-middle text-slate-700", className].join(" ")}>{children}</td> }







