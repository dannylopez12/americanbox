import { useEffect, useState } from "react";
import { Save, X, Edit3, Trash2, Loader2, Plus, Search, Package, Building2, MapPin, Hash, Users } from "lucide-react";
import { api } from "../../lib/api";

type Provider = { id: number; track_code: string; name: string; address: string };

export default function AdminProviders() {
  const [items, setItems] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<Provider | null>(null);
  const [form, setForm] = useState<Provider>({ id: 0, track_code: "", name: "", address: "" });
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const r = await api<{ ok: boolean; items: Provider[] }>("/api/admin/providers");
    setItems(r?.items ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const startNew = () => { setEditing(null); setForm({ id: 0, track_code: "", name: "", address: "" }); };
  const startEdit = (row: Provider) => { setEditing(row); setForm({ ...row }); };

// ✅ PROVIDERS
const onSave = async () => {
  if (!form.track_code?.trim() || !form.name?.trim()) return;

  setSaving(true);

  // OJO: usa 'tracking_code' (como en la BD/API), no 'track_code'
  const payload = {
    tracking_code: form.track_code.trim(),
    name: form.name.trim(),
    address: (form.address ?? "").trim(),
  };

  let ok = false;
  if (editing) {
    const r = await api<{ ok: boolean }>(
      `/api/admin/providers/${editing.id}`,
      { method: "PUT", json: payload }
    );
    ok = !!r?.ok;
  } else {
    const r = await api<{ ok: boolean }>(
      `/api/admin/providers`,
      { method: "POST", json: payload }
    );
    ok = !!r?.ok;
  }

  setSaving(false);
  if (ok) {
    await load();
    startNew();
  }
};


  const onDelete = async (id: number) => {
    if (!confirm("¿Eliminar proveedor?")) return;
    const r = await api<{ ok: boolean }>(`/api/admin/providers/${id}`, { method: "DELETE" });
    if (r?.ok) load();
  };

  const filtered = items.filter(p =>
    [p.track_code, p.name, p.address].join(" ").toLowerCase().includes(q.trim().toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header profesional */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Gestión de Proveedores</h1>
        </div>
        <p className="text-blue-100">Administra los proveedores y sus códigos de tracking</p>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4 text-blue-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="text-sm">{items.length} proveedores</span>
            </div>
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              <span className="text-sm">{filtered.length} mostrados</span>
            </div>
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-blue-200 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all"
              placeholder="Buscar proveedor..."
            />
          </div>
        </div>
      </div>

      {/* Formulario con diseño moderno */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              {editing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </h2>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Código de tracking */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Hash className="w-4 h-4 text-slate-500" />
                <label className="text-sm font-medium text-slate-700">Código de Tracking</label>
              </div>
              <input
                value={form.track_code}
                onChange={(e) => setForm({ ...form, track_code: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Ej: AMZ, DHL, FDX"
              />
            </div>

            {/* Nombre del proveedor */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-500" />
                <label className="text-sm font-medium text-slate-700">Nombre del Proveedor</label>
              </div>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Nombre completo del proveedor"
              />
            </div>

            {/* Dirección - span completo */}
            <div className="md:col-span-2 space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-500" />
                <label className="text-sm font-medium text-slate-700">Dirección</label>
              </div>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Dirección completa del proveedor"
              />
            </div>
          </div>

          {/* Botones con mejor diseño */}
          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-200">
            <button
              onClick={onSave}
              disabled={saving || !form.track_code.trim() || !form.name.trim()}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editing ? 'Actualizar' : 'Guardar'} Proveedor
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

      {/* Tabla moderna */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Lista de Proveedores</h2>
          <p className="text-sm text-slate-600 mt-1">
            {filtered.length} {filtered.length === 1 ? 'proveedor encontrado' : 'proveedores encontrados'}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100/80">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Hash className="w-3 h-3" />
                    ID
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Package className="w-3 h-3" />
                    Código
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3 h-3" />
                    Proveedor
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    Dirección
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
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-500">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Cargando proveedores...</span>
                    </div>
                  </td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="text-slate-400">
                      <Package className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      <p className="text-lg font-medium text-slate-500">No hay proveedores</p>
                      <p className="text-sm text-slate-400 mt-1">
                        {q.trim() ? 'No se encontraron resultados para tu búsqueda' : 'Comienza agregando tu primer proveedor'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors duration-150">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-blue-600">#{p.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="inline-flex items-center px-2.5 py-1.5 bg-purple-100 text-purple-800 text-xs font-semibold rounded-full">
                      {p.track_code}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{p.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600 max-w-xs truncate">{p.address || 'Sin dirección'}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => startEdit(p)} 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-sm font-medium rounded-lg transition-colors duration-150"
                      >
                        <Edit3 className="w-3 h-3" />
                        Editar
                      </button>
                      <button 
                        onClick={() => onDelete(p.id)} 
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
