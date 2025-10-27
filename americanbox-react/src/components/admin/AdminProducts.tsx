import { useEffect, useState, useCallback } from "react";
import { Save, X, Edit3, Trash2, Loader2, Search, PlusCircle } from "lucide-react";
import { api } from "../../lib/api";

type Product = { id: number; name: string; code: string; price: number; category_id?: number | null };
type Category = { id: number; name: string };

export default function AdminProducts() {
  const [items, setItems] = useState<Product[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<Product>({ id: 0, name: "", code: "", price: 0, category_id: null });
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [pr, ca] = await Promise.all([
      api<{ ok: boolean; items: Product[] }>("/api/admin/products"),
      api<{ ok: boolean; items: Category[] }>("/api/admin/categories"),
    ]);
    setItems(pr?.items ?? []);
    setCats(ca?.items ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const startNew = () => { 
    setEditing(null); 
    setForm({ id: 0, name: "", code: "", price: 0, category_id: null }); 
    setShowForm(true);
  };
  
  const startEdit = (row: Product) => { 
    setEditing(row); 
    setForm({ ...row }); 
    setShowForm(true);
  };

// ✅ PRODUCTS
const onSave = async () => {
  // Validaciones mínimas
  if (!form.name?.trim() || !form.code?.trim()) return;

  setSaving(true);

  // payload correcto
  const payload = {
    name: form.name.trim(),
    code: form.code.trim(),
    price: Number(form.price ?? 0),
    category_id: form.category_id ?? null,
  };

  let ok = false;
  if (editing) {
    const r = await api<{ ok: boolean }>(
      `/api/admin/products/${editing.id}`,
      { method: "PUT", json: payload }
    );
    ok = !!r?.ok;
  } else {
    const r = await api<{ ok: boolean }>(
      `/api/admin/products`,
      { method: "POST", json: payload }
    );
    ok = !!r?.ok;
  }

  setSaving(false);
  if (ok) {
    await load();
    setShowForm(false);
    setEditing(null);
    setForm({ id: 0, name: "", code: "", price: 0, category_id: null });
  }
};


  const onDelete = async (id: number) => {
    if (!confirm("¿Eliminar producto?")) return;
    const r = await api<{ ok: boolean }>(`/api/admin/products/${id}`, { method: "DELETE" });
    if (r?.ok) load();
  };

  const filtered = items.filter(p =>
    [p.name, p.code].join(" ").toLowerCase().includes(q.trim().toLowerCase())
  );

  return (
    <section className="rounded-2xl bg-white border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-slate-800">Gestión de Productos</h2>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9 pr-3 py-2.5 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                placeholder="Buscar productos..."
              />
            </div>
            <button 
              onClick={startNew} 
              className="inline-flex items-center gap-2 rounded-lg bg-orange-500 hover:bg-orange-600 text-white px-4 py-2.5 font-medium transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              Nuevo Producto
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <Th>ID</Th>
              <Th>Nombre</Th>
              <Th>Código</Th>
              <Th>Categoría</Th>
              <Th className="text-right">Precio</Th>
              <Th className="text-center">Acciones</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading && (
              <tr>
                <Td colSpan={6}>
                  <div className="py-12 text-center">
                    <div className="inline-flex items-center gap-2 text-slate-500">
                      <Loader2 className="animate-spin h-4 w-4" />
                      Cargando productos...
                    </div>
                  </div>
                </Td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <Td colSpan={6}>
                  <div className="py-12 text-center text-slate-500">
                    <div className="mb-2">No se encontraron productos</div>
                    <div className="text-sm">Crea un nuevo producto o ajusta tu búsqueda</div>
                  </div>
                </Td>
              </tr>
            )}
            {!loading && filtered.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <Td className="font-medium text-slate-900">#{p.id}</Td>
                <Td className="font-medium">{p.name}</Td>
                <Td className="font-mono text-sm bg-slate-100 px-2 py-1 rounded">{p.code}</Td>
                <Td>{cats.find(c => c.id === p.category_id)?.name ?? "Sin categoría"}</Td>
                <Td className="text-right font-medium">${Number(p.price ?? 0).toLocaleString('es-ES', {minimumFractionDigits: 2})}</Td>
                <Td>
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => startEdit(p)} 
                      className="inline-flex items-center gap-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 px-3 py-1.5 text-sm font-medium transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Editar
                    </button>
                    <button 
                      onClick={() => onDelete(p.id)} 
                      className="inline-flex items-center gap-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 px-3 py-1.5 text-sm font-medium transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de formulario */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-slate-800">
                {editing ? 'Editar Producto' : 'Nuevo Producto'}
              </h3>
              <button 
                onClick={() => setShowForm(false)}
                className="rounded-lg p-1 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nombre del Producto *</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                  placeholder="Nombre del producto"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Código *</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                  placeholder="Código único del producto"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Precio</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Categoría</label>
                <select
                  value={form.category_id ?? ""}
                  onChange={(e) => setForm({ ...form, category_id: e.target.value ? Number(e.target.value) : null })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
                >
                  <option value="">Seleccionar categoría</option>
                  {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
              <button 
                onClick={() => setShowForm(false)} 
                className="px-4 py-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onSave}
                disabled={saving || !form.name.trim() || !form.code.trim()}
                className="px-4 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar
                  </>
                )}
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
