import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Download, FilterX, CalendarRange, Pencil, Trash2, Plus, X, Printer, Upload } from "lucide-react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.min.css";

import { api } from "../../lib/api";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import { ORDER_STATE_OPTIONS, type OrderStateOption } from "../../constants/orderStates";

type OrderRow = {
  id: number;
  guide: string;
  user_id: number;
  provider_id?: number | null;
  provider_code?: string | null;
  tracking_code?: string | null;
  client: string;
  register_date: string | null;
  comment?: string | null;
  weight_lbs?: number | null;
  status: string | null;
  total?: number | null;
  location?: string | null;
};

type Pager = { page: number; limit: number; total: number; pages: number };

export default function AdminOrders() {
  const [items, setItems] = useState<OrderRow[]>([]);
  const [pager, setPager] = useState<Pager>({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    guide: "",
    user_id: "",
    status: "Pre alerta",
    total: "",
    weight_lbs: "",
    provider_id: "",
    tracking_code: "",
    location: ""
  });
  const [showEditOrderModal, setShowEditOrderModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<OrderRow | null>(null);
  const [editOrderForm, setEditOrderForm] = useState({
    guide: "",
    user_id: "",
    status: "Pre alerta",
    total: "",
    weight_lbs: "",
    provider_id: "",
    tracking_code: "",
    location: ""
  });
  const [providers, setProviders] = useState<{id: number; tracking_code: string; name: string}[]>([]);
  const [locationSettings, setLocationSettings] = useState<{
    defaultLocation: string;
    locations: {
      miami: { name: string; value: string; address: string };
      doral: { name: string; value: string; address: string };
    }
  } | null>(null);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [bulkUploadFile, setBulkUploadFile] = useState<File | null>(null);
  const [bulkUploadLoading, setBulkUploadLoading] = useState(false);
  const [bulkUploadResults, setBulkUploadResults] = useState<{
    total: number;
    created: number;
    errors: string[];
  } | null>(null);

  const lastUpdatedLabel = lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "—";

  const stateOptions = useMemo<OrderStateOption[]>(() => ORDER_STATE_OPTIONS, []);

  const load = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(pager.limit));
        if (q.trim()) params.set("q", q.trim());
        if (dateRange) params.set("date_range", dateRange);
        if (statusFilter) params.set("status", statusFilter);

        const r = await api<{
          ok: boolean;
          items: OrderRow[];
          page: number;
          limit: number;
          total: number;
          pages: number;
        }>(`/api/admin/orders/list?${params.toString()}`);

        if (r?.ok) {
          setItems(r.items);
          setPager({ page: r.page, limit: r.limit, total: r.total, pages: r.pages });
        } else {
          setItems([]);
          setPager((p) => ({ ...p, page: 1, total: 0, pages: 1 }));
        }
        setLastUpdated(Date.now());
      } catch (error) {
        console.error("[AdminOrders] load error", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [q, dateRange, statusFilter, pager.limit]
  );

  const loadProviders = useCallback(async () => {
    try {
  const response = await api('/api.php/api/admin/providers');
      if (response?.ok && response.providers) {
        setProviders(response.providers);
      }
    } catch (error) {
      console.error('Error loading providers:', error);
    }
  }, []);

  const loadLocationSettings = useCallback(async () => {
    try {
      const response = await api<{
        ok: boolean; 
        data: {
          defaultLocation: string;
          locations: {
            miami: { name: string; value: string; address: string };
            doral: { name: string; value: string; address: string };
          }
        }
      }>('/api/admin/location-settings');
      if (response?.ok) {
        setLocationSettings(response.data);
      }
    } catch (error) {
      console.error('Error cargando configuraciones de ubicación:', error);
    }
  }, []);

  useEffect(() => {
    void load(1);
    void loadProviders();
    void loadLocationSettings();
  }, [load, loadProviders, loadLocationSettings]);

  useAutoRefresh(() => load(pager.page), {
    deps: [pager.page, q, dateRange, statusFilter],
    delay: 45_000,
  });

  const clearFilters = () => {
    setQ("");
    setDateRange("");
    setStatusFilter("");
    void load(1);
  };

  const handleEditOrder = (order: OrderRow) => {
    // Permitir edición independiente del estado (según reunión)
    console.log('Editando pedido:', order);
    setEditingOrder(order);
    setEditOrderForm({
      guide: order.guide,
      user_id: String(order.user_id),
      status: order.status || "Pre alerta",
      total: String(order.total || 0),
      weight_lbs: String(order.weight_lbs || ""),
      provider_id: String(order.provider_id || ""),
      tracking_code: order.tracking_code || "",
      location: order.location || ""
    });
    setShowEditOrderModal(true);
  };

  const deleteOrder = async (order: OrderRow) => {
    if (!confirm(`¿Estás seguro de eliminar el pedido ${order.guide}?`)) return;
    
    try {
  const response = await api(`/api.php/api/admin/orders/${order.id}`, { method: 'DELETE' });
      if (response?.ok) {
        alert('Pedido eliminado exitosamente');
        await load(pager.page);
      } else {
        alert('Error al eliminar el pedido');
      }
    } catch (error) {
      console.error('Error eliminando pedido:', error);
      alert('Error al eliminar el pedido');
    }
  };

  const createOrder = async () => {
    try {
  const response = await api('/api.php/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guide: newOrderForm.guide,
          user_id: parseInt(newOrderForm.user_id) || null,
          status: newOrderForm.status,
          total: parseFloat(newOrderForm.total) || 0,
          weight_lbs: parseFloat(newOrderForm.weight_lbs) || null,
          provider_id: parseInt(newOrderForm.provider_id) || null,
          tracking_code: newOrderForm.tracking_code || null,
          location: newOrderForm.location || null
        })
      });
      
      if (response?.ok) {
        alert('Pedido creado exitosamente');
        setShowNewOrderModal(false);
        setNewOrderForm({
          guide: "",
          user_id: "",
          status: "Pre alerta",
          total: "",
          weight_lbs: "",
          provider_id: "",
          tracking_code: "",
          location: ""
        });
        await load(1);
      } else {
        alert(response?.error || 'Error al crear el pedido');
      }
    } catch (error) {
      console.error('Error creando pedido:', error);
      alert('Error al crear el pedido');
    }
  };

  const updateOrder = async () => {
    if (!editingOrder) return;
    
    try {
  const response = await api(`/api.php/api/admin/orders/${editingOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guide: editOrderForm.guide,
          user_id: parseInt(editOrderForm.user_id) || null,
          status: editOrderForm.status,
          total: parseFloat(editOrderForm.total) || 0,
          weight_lbs: parseFloat(editOrderForm.weight_lbs) || null,
          provider_id: parseInt(editOrderForm.provider_id) || null,
          tracking_code: editOrderForm.tracking_code || null,
          location: editOrderForm.location || null
        })
      });
      
      if (response?.ok) {
        alert('Pedido actualizado exitosamente');
        setShowEditOrderModal(false);
        setEditingOrder(null);
        setEditOrderForm({
          guide: "",
          user_id: "",
          status: "Pre alerta",
          total: "",
          weight_lbs: "",
          provider_id: "",
          tracking_code: "",
          location: ""
        });
        await load(pager.page);
      } else {
        alert(response?.error || 'Error al actualizar el pedido');
      }
    } catch (error) {
      console.error('Error actualizando pedido:', error);
      alert('Error al actualizar el pedido');
    }
  };

  const printLabel = async (order: OrderRow) => {
    try {
  const response = await api(`/api.php/api/admin/orders/${order.id}/print-label`);
      if (response?.ok && response.html) {
        // Create a new window and write the HTML content
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(response.html);
          printWindow.document.close();
          printWindow.print();
        }
      } else {
        alert('Error al generar la etiqueta de impresión');
      }
    } catch (error) {
      console.error('Error printing label:', error);
      alert('Error al imprimir la etiqueta');
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkUploadFile) {
      alert('Por favor selecciona un archivo');
      return;
    }

    setBulkUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', bulkUploadFile);

      // Usar fetch directo porque api() no maneja FormData bien
      const response = await fetch('/api/admin/orders/bulk-upload', {
        method: 'POST',
        credentials: 'include', // Para incluir cookies de sesión
        body: formData
      });

      const result = await response.json();

      if (result.ok) {
        setBulkUploadResults(result.results);
        setBulkUploadFile(null);
        // Recargar la lista de pedidos
        await load(1);
        alert(`Carga completada: ${result.results.created}/${result.results.total} pedidos creados`);
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error en bulk upload:', error);
      alert('Error al procesar el archivo');
    } finally {
      setBulkUploadLoading(false);
    }
  };

  const exportCsv = () => {
    if (!items.length) {
      alert("No hay registros para exportar.");
      return;
    }
    const headers = [
      "ID",
      "Guía",
      "Proveedor",
      "Cliente",
      "Fecha registro",
      "Comentario",
      "Peso (lb)",
      "Estado",
      "Ubicación",
      "Total",
    ];
    const rows = items.map((row) => [
      row.id,
      wrapCsv(row.guide),
      wrapCsv(row.provider_code),
      wrapCsv(row.client),
      wrapCsv(row.register_date),
      wrapCsv(row.comment),
      row.weight_lbs ?? "",
      wrapCsv(getStateLabel(row.status, stateOptions)),
      wrapCsv(row.location === 'miami' ? 'Miami' : row.location === 'doral' ? 'Doral' : 'Por defecto'),
      row.total ?? "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `pedidos_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold">Listado de pedidos</h2>
          <p className="text-sm text-slate-500">
            Controla los pedidos con filtros por fecha, estado y búsqueda rápida. Las filas resaltan el estado actual
            para facilitar la lectura.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowNewOrderModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 text-white px-3 py-2 text-sm hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4" />
            Nuevo Registro
          </button>
          <button
            type="button"
            onClick={() => setShowBulkUploadModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-3 py-2 text-sm hover:bg-blue-700"
          >
            <Upload className="w-4 h-4" />
            Carga Masiva
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
          >
            <Download className="w-4 h-4" />
            Exportar
          </button>
        </div>
      </header>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="p-4 space-y-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por guía, cliente o comentario..."
                  className="w-full sm:w-80 pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-64 rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="">Todos los estados</option>
                {stateOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 flex items-center gap-1">
                  <CalendarRange className="w-4 h-4" />
                  Buscar por rango de fechas:
                </label>
                <Flatpickr
                  options={{ mode: "range", dateFormat: "Y-m-d", showMonths: 2 }}
                  value={dateRange ? dateRange.split(" - ") : []}
                  onChange={(selected: Date[]) => {
                    if (!selected || selected.length === 0) return setDateRange("");
                    if (selected.length === 1) return setDateRange(selected[0].toISOString().slice(0, 10));
                    const a = selected[0].toISOString().slice(0, 10);
                    const b = selected[1].toISOString().slice(0, 10);
                    setDateRange(`${a} - ${b}`);
                  }}
                  className="w-full sm:w-72 rounded-lg border border-slate-200 px-3 py-2"
                  placeholder="Selecciona fechas"
                />
              </div>
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
              >
                <FilterX className="w-4 h-4" />
                Limpiar filtros
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500">
            <span>
              Mostrando {items.length} de {pager.total} registros.
            </span>
            <span>Última actualización: {lastUpdatedLabel}</span>
          </div>
        </div>

        <div className="border-t border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <Th>No. Guía</Th>
                <Th>C. Proveedor</Th>
                <Th>Cliente</Th>
                <Th>F. Registro</Th>
                <Th>Comentario</Th>
                <Th>Peso lb</Th>
                <Th>Estado</Th>
                <Th>Ubicación</Th>
                <Th>Total</Th>
                <Th className="text-center">Opciones</Th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr className="border-t">
                  <Td colSpan={10}>
                    <div className="py-8 text-center text-slate-500">Cargando pedidos...</div>
                  </Td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr className="border-t">
                  <Td colSpan={10}>
                    <div className="py-8 text-center text-slate-500">
                      No hay pedidos con los filtros seleccionados.
                    </div>
                  </Td>
                </tr>
              )}
              {items.map((row) => (
                <tr key={row.id} className="border-t hover:bg-slate-50">
                  <Td>
                    <div className="flex flex-col">
                      <span className="font-semibold text-slate-800">{row.guide}</span>
                      <span className="text-xs text-slate-500">#{row.id}</span>
                    </div>
                  </Td>
                  <Td className="whitespace-nowrap">{row.provider_code ?? "—"}</Td>
                  <Td className="max-w-[200px] truncate">{row.client}</Td>
                  <Td>{formatDate(row.register_date)}</Td>
                  <Td className="max-w-[200px] truncate">{row.comment ?? "—"}</Td>
                  <Td>{row.weight_lbs ?? "—"}</Td>
                  <Td>
                    <StatusBadge status={row.status} options={stateOptions} />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      {row.location === 'miami' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
                          🏢 Miami
                        </span>
                      )}
                      {row.location === 'doral' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                          🏪 Doral
                        </span>
                      )}
                      {!row.location && (
                        <span className="text-slate-400 text-xs">Por defecto</span>
                      )}
                    </div>
                  </Td>
                  <Td>{row.total != null ? formatCurrency(row.total) : "—"}</Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditOrder(row)}
                        className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100"
                        title="Editar pedido"
                      >
                        <Pencil className="w-3 h-3" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => printLabel(row)}
                        className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                        title="Imprimir etiqueta"
                      >
                        <Printer className="w-3 h-3" />
                        Imprimir
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteOrder(row)}
                        className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                        title="Eliminar pedido"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Página {pager.page} de {pager.pages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => load(Math.max(1, pager.page - 1))}
              className="px-3 py-1.5 rounded-md border border-slate-200 disabled:opacity-50"
              disabled={pager.page <= 1 || loading}
            >
              Anterior
            </button>
            <span className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm">{pager.page}</span>
            <button
              onClick={() => load(Math.min(pager.pages, pager.page + 1))}
              className="px-3 py-1.5 rounded-md border border-slate-200 disabled:opacity-50"
              disabled={pager.page >= pager.pages || loading}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Nuevo Pedido */}
      {showNewOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Nuevo Pedido</h3>
                <button
                  onClick={() => setShowNewOrderModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); createOrder(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Número de Guía *
                  </label>
                  <input
                    type="text"
                    required
                    value={newOrderForm.guide}
                    onChange={(e) => setNewOrderForm(prev => ({ ...prev, guide: e.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Ingrese el número de guía"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    ID Usuario *
                  </label>
                  <input
                    type="number"
                    required
                    value={newOrderForm.user_id}
                    onChange={(e) => setNewOrderForm(prev => ({ ...prev, user_id: e.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="ID del usuario"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={newOrderForm.status}
                    onChange={(e) => setNewOrderForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {stateOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Total
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newOrderForm.total}
                    onChange={(e) => setNewOrderForm(prev => ({ ...prev, total: e.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Total del pedido"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Peso (lbs)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newOrderForm.weight_lbs}
                    onChange={(e) => setNewOrderForm(prev => ({ ...prev, weight_lbs: e.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Peso en libras"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Si no proporciona un total, se calculará automáticamente basado en el peso
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Proveedor
                  </label>
                  <select
                    value={newOrderForm.provider_id}
                    onChange={(e) => setNewOrderForm(prev => ({ ...prev, provider_id: e.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Seleccionar proveedor</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Código de Seguimiento
                  </label>
                  <input
                    type="text"
                    value={newOrderForm.tracking_code}
                    onChange={(e) => setNewOrderForm(prev => ({ ...prev, tracking_code: e.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Código de seguimiento (opcional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ubicación
                  </label>
                  <select
                    value={newOrderForm.location}
                    onChange={(e) => setNewOrderForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Por defecto ({locationSettings?.defaultLocation === 'miami' ? 'Miami' : 'Doral'})</option>
                    {locationSettings && Object.values(locationSettings.locations).map((loc) => (
                      <option key={loc.value} value={loc.value}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                  {locationSettings && newOrderForm.location && (
                    <p className="mt-1 text-xs text-slate-500">
                      📍 {locationSettings.locations[newOrderForm.location as 'miami' | 'doral']?.address}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewOrderModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md text-sm font-medium hover:bg-emerald-700"
                  >
                    Crear Pedido
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Editar Pedido */}
      {showEditOrderModal && editingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Editar Pedido #{editingOrder.guide}</h3>
                <button
                  onClick={() => setShowEditOrderModal(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={(e) => { e.preventDefault(); updateOrder(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Número de Guía *
                  </label>
                  <input
                    type="text"
                    required
                    value={editOrderForm.guide}
                    onChange={(e) => setEditOrderForm(prev => ({ ...prev, guide: e.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Ingrese el número de guía"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    ID Usuario *
                  </label>
                  <input
                    type="number"
                    required
                    value={editOrderForm.user_id}
                    onChange={(e) => setEditOrderForm(prev => ({ ...prev, user_id: e.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="ID del usuario"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Estado
                  </label>
                  <select
                    value={editOrderForm.status}
                    onChange={(e) => setEditOrderForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {stateOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Total
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editOrderForm.total}
                    onChange={(e) => setEditOrderForm(prev => ({ ...prev, total: e.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Total del pedido"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Peso (lbs)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editOrderForm.weight_lbs}
                    onChange={(e) => setEditOrderForm(prev => ({ ...prev, weight_lbs: e.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Peso en libras"
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    Si no proporciona un total, se calculará automáticamente basado en el peso
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Proveedor
                  </label>
                  <select
                    value={editOrderForm.provider_id}
                    onChange={(e) => setEditOrderForm(prev => ({ ...prev, provider_id: e.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Seleccionar proveedor</option>
                    {providers.map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Código de Seguimiento
                  </label>
                  <input
                    type="text"
                    value={editOrderForm.tracking_code}
                    onChange={(e) => setEditOrderForm(prev => ({ ...prev, tracking_code: e.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Código de seguimiento (opcional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Ubicación
                  </label>
                  <select
                    value={editOrderForm.location}
                    onChange={(e) => setEditOrderForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">Por defecto ({locationSettings?.defaultLocation === 'miami' ? 'Miami' : 'Doral'})</option>
                    {locationSettings && Object.values(locationSettings.locations).map((loc) => (
                      <option key={loc.value} value={loc.value}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                  {locationSettings && editOrderForm.location && (
                    <p className="mt-1 text-xs text-slate-500">
                      📍 {locationSettings.locations[editOrderForm.location as 'miami' | 'doral']?.address}
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditOrderModal(false)}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-md text-sm font-medium hover:bg-amber-700"
                  >
                    Actualizar Pedido
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Carga Masiva */}
      {showBulkUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Carga Masiva de Pedidos</h3>
                <button
                  onClick={() => {
                    setShowBulkUploadModal(false);
                    setBulkUploadFile(null);
                    setBulkUploadResults(null);
                  }}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-slate-700">Formato del archivo</h4>
                    <button
                      type="button"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = '/api/admin/orders/bulk-upload-template';
                        link.download = 'template_carga_masiva.xlsx';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200"
                    >
                      <Download className="w-3 h-3" />
                      Descargar Template
                    </button>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-md text-sm text-slate-600">
                    <p className="mb-2">El archivo Excel debe contener las siguientes columnas:</p>
                    <ul className="list-disc ml-4 space-y-1">
                      <li><strong>codigo_proveedor</strong>: Código del proveedor (opcional)</li>
                      <li><strong>cliente</strong>: Nombre del cliente (requerido)</li>
                      <li><strong>comentario</strong>: Comentario del pedido (opcional)</li>
                      <li><strong>peso_lbs</strong>: Peso en libras (opcional)</li>
                    </ul>
                    <p className="mt-2 text-xs text-slate-500">
                      Nota: El número de guía se genera automáticamente y el estado será "Pre alerta"
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Seleccionar archivo Excel
                  </label>
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      setBulkUploadFile(file || null);
                      setBulkUploadResults(null);
                    }}
                    className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {bulkUploadFile && (
                    <p className="mt-1 text-sm text-slate-600">
                      Archivo seleccionado: {bulkUploadFile.name}
                    </p>
                  )}
                </div>

                {bulkUploadResults && (
                  <div className="bg-slate-50 p-3 rounded-md">
                    <h4 className="font-medium text-slate-700 mb-2">Resultados de la carga</h4>
                    <div className="text-sm space-y-1">
                      <p>Total de filas procesadas: <strong>{bulkUploadResults.total}</strong></p>
                      <p className="text-green-600">Pedidos creados: <strong>{bulkUploadResults.created}</strong></p>
                      {bulkUploadResults.errors.length > 0 && (
                        <div className="mt-2">
                          <p className="text-red-600">Errores encontrados:</p>
                          <ul className="list-disc ml-4 max-h-32 overflow-y-auto text-xs text-red-600">
                            {bulkUploadResults.errors.slice(0, 10).map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                            {bulkUploadResults.errors.length > 10 && (
                              <li>... y {bulkUploadResults.errors.length - 10} errores más</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowBulkUploadModal(false);
                      setBulkUploadFile(null);
                      setBulkUploadResults(null);
                    }}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleBulkUpload}
                    disabled={!bulkUploadFile || bulkUploadLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bulkUploadLoading ? 'Procesando...' : 'Cargar Pedidos'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function wrapCsv(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(num);
}

function getStateLabel(status: string | null, options: OrderStateOption[]): string {
  if (!status) return "Sin estado";
  return options.find((opt) => opt.value === status)?.label ?? status;
}

function StatusBadge({ status, options }: { status: string | null; options: OrderStateOption[] }) {
  const label = getStateLabel(status, options);
  const tone = options.find((opt) => opt.value === status)?.tone ?? "slate";
  const classes = badgeByTone(tone);
  return <span className={["inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold", classes].join(" ")}>{label}</span>;
}

function badgeByTone(tone: OrderStateOption["tone"]) {
  switch (tone) {
    case "sky":
      return "bg-sky-100 text-sky-700";
    case "amber":
      return "bg-amber-100 text-amber-700";
    case "emerald":
      return "bg-emerald-100 text-emerald-700";
    case "violet":
      return "bg-violet-100 text-violet-700";
    case "rose":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
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

