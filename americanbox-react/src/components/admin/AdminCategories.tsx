import { useEffect, useState } from "react";
import { Save, X, Trash2, Edit3, Loader2, Plus, Tag, Tags, Grid3X3, FolderOpen, Layers } from "lucide-react";
import { api } from "../../lib/api";

type Category = { id: number; name: string };

export default function AdminCategories() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await api<{ ok: boolean; items: Category[] }>("/api/admin/categories");
    setItems(res?.items ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startNew = () => { setEditing(null); setName(""); };
  const startEdit = (row: Category) => { setEditing(row); setName(row.name); };

  const onSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const payload = { name: name.trim() };
    let ok = false;
    if (editing) {
      const r = await api<{ ok: boolean }>(`/api/admin/categories/${editing.id}`, { method: "PUT", json: payload, });
      ok = !!r?.ok;
    } else {
      const r = await api<{ ok: boolean }>(`/api/admin/categories`, { method: "POST", json: payload, });
      ok = !!r?.ok;
    }
    setSaving(false);
    if (ok) { await load(); startNew(); }
  };

  const onDelete = async (id: number) => {
    if (!confirm("¿Eliminar categoría?")) return;
    const r = await api<{ ok: boolean }>(`/api/admin/categories/${id}`, { method: "DELETE" });
    if (r?.ok) load();
  };

  return (
    <div className="space-y-6">
      {/* Header profesional con gradiente */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Tags className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Gestión de Categorías</h1>
        </div>
        <p className="text-emerald-100">Organiza y administra las categorías de productos</p>
        
        <div className="flex items-center gap-4 mt-4 text-emerald-100">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span className="text-sm">{items.length} {items.length === 1 ? 'categoría' : 'categorías'}</span>
          </div>
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            <span className="text-sm">Gestión activa</span>
          </div>
        </div>
      </div>

      {/* Formulario con diseño moderno */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              {editing ? 'Editar Categoría' : 'Nueva Categoría'}
            </h2>
          </div>
        </div>
        
        <div className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-500" />
                <label className="text-sm font-medium text-slate-700">Nombre de la Categoría</label>
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                placeholder="Ej. CELULARES, LAPTOPS, ROPA..."
              />
              <p className="text-xs text-slate-500">Usa nombres descriptivos en mayúsculas para mejor organización</p>
            </div>

            {/* Botones con diseño mejorado */}
            <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
              <button
                onClick={onSave}
                disabled={saving || !name.trim()}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {editing ? 'Actualizar' : 'Crear'} Categoría
              </button>
              
              <button 
                onClick={startNew} 
                className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2.5 rounded-lg font-medium transition-all duration-200"
              >
                <X className="w-4 h-4" /> 
                {editing ? 'Cancelar' : 'Limpiar'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla moderna de categorías */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Lista de Categorías</h2>
          <p className="text-sm text-slate-600 mt-1">
            {items.length} {items.length === 1 ? 'categoría registrada' : 'categorías registradas'}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100/80">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Grid3X3 className="w-3 h-3" />
                    ID
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Tag className="w-3 h-3" />
                    Categoría
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Cargando categorías...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center">
                    <div className="text-slate-400">
                      <Tags className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p className="text-lg font-medium text-slate-500">No hay categorías</p>
                      <p className="text-sm text-slate-400 mt-1">Comienza creando tu primera categoría de productos</p>
                    </div>
                  </td>
                </tr>
              )}
              {items.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition-colors duration-150">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-emerald-600">#{c.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center px-3 py-1.5 bg-emerald-100 text-emerald-800 text-sm font-semibold rounded-full">
                        <Tag className="w-3 h-3 mr-1" />
                        {c.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => startEdit(c)} 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium rounded-lg transition-colors duration-150"
                      >
                        <Edit3 className="w-3 h-3" />
                        Editar
                      </button>
                      <button 
                        onClick={() => onDelete(c.id)} 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-medium rounded-lg transition-colors duration-150"
                      >
                        <Trash2 className="w-3 h-3" />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
