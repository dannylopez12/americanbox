import { useEffect, useState, useCallback } from "react";
import { api } from "../../lib/api";
import { Search, PlusCircle, Trash2 } from "lucide-react";
import Flatpickr from 'react-flatpickr'
import 'flatpickr/dist/flatpickr.min.css'
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

type Account = {
  id: number;
  invoice_number: string;
  client_name: string;
  sale_date?: string | null;
  due_date?: string | null;
  debt?: number;
  balance?: number;
  status?: string;
};
type Pager = { page: number; limit: number; total: number; pages: number };

export default function AdminAccountsReceivable(){
  const [q,setQ]=useState("");
  const [items,setItems]=useState<Account[]>([]);
  const [pager,setPager]=useState<Pager>({page:1,limit:10,total:0,pages:1});
  const [loading,setLoading]=useState(false);

  const [dateRange,setDateRange]=useState("");
  const [showNew,setShowNew]=useState(false);
  const [newItem,setNewItem]=useState<{invoice_number:string; client_name:string; sale_date?:string; due_date?:string; debt?:number; balance?:number; status?:string}>({invoice_number:'', client_name:'', debt:0, balance:0});
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const lastUpdatedLabel = lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "-";

  const load = useCallback(async (page=1) => {
    setLoading(true);
    try{
    const params = new URLSearchParams(); if (q) params.set('q',q); if (dateRange) params.set('date_range',dateRange); params.set('page',String(page)); params.set('limit',String(pager.limit));
    const r = await api<{ok:boolean; items:Account[]; page:number; limit:number; total:number; pages:number}>(`/api/admin/accounts-receivable?${params.toString()}`);
      if (r?.ok) { setItems(r.items); setPager({page:r.page, limit:r.limit, total:r.total, pages:r.pages}); }
      else { setItems([]); setPager({page:1, limit:pager.limit, total:0, pages:1}); }
    }catch{ setItems([]); }
    setLoading(false);
    setLastUpdated(Date.now());
  }, [q, dateRange, pager.limit]);

  useEffect(()=>{ load(1); },[load]);

  async function eliminar(a:Account){ if(!confirm(`Eliminar registro #${a.id}?`)) return; await api(`/api/admin/accounts-receivable/${a.id}`, {method:'DELETE'}); await load(pager.page); }

  async function guardarNuevo(){
    if(!newItem.invoice_number || !newItem.client_name){
      alert('Rellena campos');
      return;
    }
    setLoading(true);
    try{
      const r = await api('/api/admin/accounts-receivable',{ method:'POST', json:newItem });
      if(!r?.ok) throw new Error(r?.error||'Error');
      setShowNew(false);
      setNewItem({invoice_number:'', client_name:'', debt:0, balance:0});
      await load(1);
    }catch(e: unknown){
      alert(e instanceof Error ? e.message : 'Error');
    }
    setLoading(false);
  }

  useAutoRefresh(() => load(pager.page), {
    deps: [pager.page, q, dateRange],
    delay: 45_000,
  });

  return (
    <section className="rounded-2xl bg-white border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-800">Cuentas por Cobrar</h2>
            <span className="text-sm text-slate-500">Última actualización: {lastUpdatedLabel}</span>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Buscar registros</label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  value={q} 
                  onChange={e=>setQ(e.target.value)} 
                  placeholder="Buscar por número de factura o cliente..." 
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400" 
                />
              </div>
            </div>
            
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-700 mb-2">Filtrar por fechas</label>
              <Flatpickr
                options={{ mode: 'range', dateFormat: 'Y-m-d', showMonths: 2 }}
                value={dateRange ? dateRange.split(' - ') : []}
                onChange={(selected: Date[]) => {
                  if (!selected || selected.length === 0) return setDateRange('');
                  if (selected.length === 1) return setDateRange(selected[0].toISOString().slice(0,10));
                  const a = selected[0].toISOString().slice(0,10);
                  const b = selected[1].toISOString().slice(0,10);
                  setDateRange(`${a} - ${b}`);
                }}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                placeholder="Seleccionar rango de fechas..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <Th>ID</Th>
              <Th>Número de Factura</Th>
              <Th>Cliente</Th>
              <Th>Fecha de Venta</Th>
              <Th>Fecha de Vencimiento</Th>
              <Th>Deuda</Th>
              <Th>Saldo</Th>
              <Th>Estado</Th>
              <Th className="text-center">Acciones</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading && (
              <tr>
                <Td colSpan={9}>
                  <div className="py-12 text-center">
                    <div className="inline-flex items-center gap-2 text-slate-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-300 border-t-orange-500"></div>
                      Cargando datos...
                    </div>
                  </div>
                </Td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <Td colSpan={9}>
                  <div className="py-12 text-center text-slate-500">
                    <div className="mb-2">No se encontraron registros</div>
                    <div className="text-sm">Intenta ajustar los filtros de búsqueda</div>
                  </div>
                </Td>
              </tr>
            )}
            {!loading && items.map(a => (
              <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                <Td className="font-medium text-slate-900">#{a.id}</Td>
                <Td className="font-medium text-orange-600">{a.invoice_number}</Td>
                <Td>{a.client_name}</Td>
                <Td>{a.sale_date || '-'}</Td>
                <Td>{a.due_date || '-'}</Td>
                <Td className="font-medium">
                  {a.debt ? `$${parseFloat(String(a.debt)).toLocaleString('es-ES', {minimumFractionDigits: 2})}` : '-'}
                </Td>
                <Td className="font-medium">
                  {a.balance ? `$${parseFloat(String(a.balance)).toLocaleString('es-ES', {minimumFractionDigits: 2})}` : '-'}
                </Td>
                <Td>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    a.status === 'pagado' ? 'bg-green-100 text-green-800' :
                    a.status === 'pendiente' ? 'bg-yellow-100 text-yellow-800' :
                    a.status === 'vencido' ? 'bg-red-100 text-red-800' :
                    'bg-slate-100 text-slate-800'
                  }`}>
                    {a.status || 'Sin estado'}
                  </span>
                </Td>
                <Td>
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => eliminar(a)} 
                      className="inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 transition-colors" 
                      title="Eliminar registro"
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

      <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            type="button" 
            onClick={() => setShowNew(true)} 
            className="inline-flex items-center gap-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 font-medium transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4"/> 
            Nuevo Registro
          </button>
          <div className="text-sm text-slate-600">
            Mostrando {items.length} de {pager.total} registros
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => load(Math.max(1, pager.page - 1))} 
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
            disabled={pager.page <= 1}
          >
            Anterior
          </button>
          <span className="px-3 py-1.5 rounded-lg bg-orange-100 text-orange-700 font-medium">
            {pager.page} de {pager.pages}
          </span>
          <button 
            onClick={() => load(Math.min(pager.pages, pager.page + 1))} 
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" 
            disabled={pager.page >= pager.pages}
          >
            Siguiente
          </button>
        </div>
      </div>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-800">Nuevo Registro</h3>
              <button 
                onClick={() => setShowNew(false)}
                className="rounded-lg p-1 hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Número de Factura *</label>
                <input 
                  placeholder="Ej: FAC-001" 
                  value={newItem.invoice_number} 
                  onChange={e => setNewItem({...newItem, invoice_number: e.target.value})} 
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400" 
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Cliente *</label>
                <input 
                  placeholder="Nombre del cliente" 
                  value={newItem.client_name} 
                  onChange={e => setNewItem({...newItem, client_name: e.target.value})} 
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Fecha de Venta</label>
                  <input 
                    type="date"
                    value={newItem.sale_date ?? ''} 
                    onChange={e => setNewItem({...newItem, sale_date: e.target.value})} 
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Fecha de Vencimiento</label>
                  <input 
                    type="date"
                    value={newItem.due_date ?? ''} 
                    onChange={e => setNewItem({...newItem, due_date: e.target.value})} 
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400" 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Deuda</label>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    step="0.01"
                    value={newItem.debt ?? 0} 
                    onChange={e => setNewItem({...newItem, debt: Number(e.target.value)})} 
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Saldo</label>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    step="0.01"
                    value={newItem.balance ?? 0} 
                    onChange={e => setNewItem({...newItem, balance: Number(e.target.value)})} 
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Estado</label>
                <select 
                  value={newItem.status ?? ''} 
                  onChange={e => setNewItem({...newItem, status: e.target.value})} 
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                >
                  <option value="">Seleccionar estado</option>
                  <option value="pendiente">Pendiente</option>
                  <option value="pagado">Pagado</option>
                  <option value="vencido">Vencido</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
              <button 
                type="button" 
                onClick={() => setShowNew(false)} 
                className="px-4 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button 
                type="button" 
                onClick={guardarNuevo} 
                disabled={loading}
                className="px-4 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Th({ children, className="" }: {children:React.ReactNode; className?:string}) { 
  return <th className={["px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider", className].join(" ")}>{children}</th> 
}

function Td({ children, colSpan, className="" }: {children:React.ReactNode; colSpan?:number; className?:string}) { 
  return <td colSpan={colSpan} className={["px-6 py-4 whitespace-nowrap text-sm text-slate-700", className].join(" ")}>{children}</td> 
}

























