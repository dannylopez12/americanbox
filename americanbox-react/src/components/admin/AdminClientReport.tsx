import { useCallback, useEffect, useState } from "react";
import { Users, Search, FilterX, Download, Calendar } from "lucide-react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.min.css";

import { api } from "../../lib/api";
import { ORDER_STATE_OPTIONS } from "../../constants/orderStates";

type Client = {
  id: number;
  name: string;
  email: string;
  total_orders: number;
  last_order_date: string | null;
};

type Order = {
  id: number;
  guide: string;
  status: string;
  total: number | null;
  weight_lbs: number | null;
  location: string | null;
  register_date: string;
  client_id: number;
  client_name: string;
  client_email: string;
  provider_name: string | null;
  provider_code: string | null;
};

type ClientStats = {
  total_orders: number;
  pre_alerta: number;
  captado: number;
  despacho: number;
  en_proceso: number;
  entregado: number;
  total_amount: number;
  total_weight: number;
};

type ClientReportResponse = {
  ok: boolean;
  orders: Order[];
  stats: ClientStats;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
};

export default function AdminClientReport() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  
  const [loading, setLoading] = useState(false);
  const [clientSearch, setClientSearch] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Cargar lista de clientes
  const loadClients = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (clientSearch.trim()) params.set("q", clientSearch.trim());
      
      const response = await api<{ok: boolean; clients: Client[]}>(`/api/admin/reports/clients?${params.toString()}`);
      if (response?.ok) {
        setClients(response.clients);
      }
    } catch (error) {
      console.error('Error cargando clientes:', error);
    }
  }, [clientSearch]);

  // Cargar reporte del cliente seleccionado
  const loadClientReport = useCallback(async (page = 1) => {
    if (!selectedClient) return;
    
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("client_id", String(selectedClient.id));
      params.set("page", String(page));
      params.set("limit", String(pagination.limit));
      if (dateRange) params.set("date_range", dateRange);
      if (statusFilter) params.set("status", statusFilter);
      
      const response = await api<ClientReportResponse>(`/api/admin/reports/orders/by-client?${params.toString()}`);
      if (response?.ok) {
        setOrders(response.orders);
        setStats(response.stats);
        setPagination(response.pagination);
      }
    } catch (error) {
      console.error('Error cargando reporte del cliente:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedClient, dateRange, statusFilter, pagination.limit]);

  useEffect(() => {
    loadClients();
  }, [loadClients]);

  useEffect(() => {
    if (selectedClient) {
      loadClientReport(1);
    }
  }, [selectedClient, dateRange, statusFilter]);

  const clearFilters = () => {
    setDateRange("");
    setStatusFilter("");
  };

  const formatCurrency = (amount: number | null) => {
    if (amount == null) return "—";
    return new Intl.NumberFormat("es-EC", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("es-EC");
    } catch {
      return "—";
    }
  };

  const exportClientReport = () => {
    if (!orders.length || !selectedClient) return;

    const headers = [
      "ID",
      "Guía",
      "Estado", 
      "Total",
      "Peso (lbs)",
      "Ubicación",
      "Fecha registro",
      "Proveedor"
    ];
    
    const rows = orders.map((order) => [
      order.id,
      order.guide,
      order.status,
      order.total || "",
      order.weight_lbs || "",
      order.location === 'miami' ? 'Miami' : order.location === 'doral' ? 'Doral' : 'Por defecto',
      formatDate(order.register_date),
      order.provider_name || ""
    ]);
    
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `reporte_cliente_${selectedClient.name.replace(/\s+/g, '_')}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reportes por Cliente</h1>
            <p className="text-sm text-slate-600">Análisis detallado de pedidos por cliente específico</p>
          </div>
        </div>
      </div>

      {/* Selección de Cliente */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Seleccionar Cliente</h2>
        
        <div className="flex gap-4 mb-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar cliente por nombre o email..."
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-80 overflow-y-auto">
          {clients.map((client) => (
            <div
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedClient?.id === client.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">{client.name}</h3>
                  <p className="text-sm text-slate-600">{client.email}</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                    <span>{client.total_orders} pedidos</span>
                    {client.last_order_date && (
                      <span>Último: {formatDate(client.last_order_date)}</span>
                    )}
                  </div>
                </div>
                {selectedClient?.id === client.id && (
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                )}
              </div>
            </div>
          ))}
        </div>

        {clients.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No se encontraron clientes con los criterios de búsqueda
          </div>
        )}
      </div>

      {/* Reporte del Cliente Seleccionado */}
      {selectedClient && (
        <>
          {/* Estadísticas del Cliente */}
          {stats && (
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900">
                  Estadísticas de {selectedClient.name}
                </h2>
                <div className="text-sm text-slate-600">
                  {selectedClient.email}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-slate-900">{stats.total_orders}</div>
                  <div className="text-xs text-slate-600">Total Pedidos</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-700">{stats.pre_alerta}</div>
                  <div className="text-xs text-yellow-600">Pre alerta</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-700">{stats.captado}</div>
                  <div className="text-xs text-blue-600">Captado</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-700">{stats.despacho}</div>
                  <div className="text-xs text-purple-600">Despacho</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-700">{stats.en_proceso}</div>
                  <div className="text-xs text-orange-600">En proceso</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">{stats.entregado}</div>
                  <div className="text-xs text-green-600">Entregado</div>
                </div>
                <div className="text-center p-4 bg-emerald-50 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-700">{formatCurrency(stats.total_amount)}</div>
                  <div className="text-xs text-emerald-600">Total $</div>
                </div>
              </div>
            </div>
          )}

          {/* Filtros y Controles */}
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" />
                <Flatpickr
                  value={dateRange}
                  onChange={(dates: Date[]) => {
                    if (dates.length === 2) {
                      const start = dates[0].toISOString().split('T')[0];
                      const end = dates[1].toISOString().split('T')[0];
                      setDateRange(`${start} to ${end}`);
                    } else {
                      setDateRange("");
                    }
                  }}
                  options={{
                    mode: "range",
                    dateFormat: "Y-m-d",
                    placeholder: "Seleccionar rango de fechas"
                  }}
                  className="w-64 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos los estados</option>
                {ORDER_STATE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {(dateRange || statusFilter) && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 px-3 py-2 text-sm text-slate-600 hover:text-slate-900"
                >
                  <FilterX className="w-4 h-4" />
                  Limpiar filtros
                </button>
              )}

              <div className="flex-1"></div>

              <button
                onClick={exportClientReport}
                disabled={!orders.length}
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" />
                Exportar CSV
              </button>
            </div>

            {/* Tabla de Pedidos */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-700 uppercase">ID</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-700 uppercase">Guía</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-700 uppercase">Estado</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-700 uppercase">Total</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-700 uppercase">Peso</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-700 uppercase">Ubicación</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-700 uppercase">F. Registro</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-700 uppercase">Proveedor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {loading && (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                        Cargando pedidos del cliente...
                      </td>
                    </tr>
                  )}
                  {!loading && orders.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-3 py-8 text-center text-slate-500">
                        No se encontraron pedidos para este cliente con los filtros aplicados
                      </td>
                    </tr>
                  )}
                  {!loading && orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50">
                      <td className="px-3 py-2 text-sm text-slate-900">#{order.id}</td>
                      <td className="px-3 py-2 text-sm font-medium text-slate-900">{order.guide}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {order.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-900">{formatCurrency(order.total)}</td>
                      <td className="px-3 py-2 text-sm text-slate-900">{order.weight_lbs || "—"}</td>
                      <td className="px-3 py-2 text-sm">
                        {order.location === 'miami' && (
                          <span className="inline-flex items-center gap-1 text-xs text-blue-700">🏢 Miami</span>
                        )}
                        {order.location === 'doral' && (
                          <span className="inline-flex items-center gap-1 text-xs text-green-700">🏪 Doral</span>
                        )}
                        {!order.location && (
                          <span className="text-xs text-slate-400">Por defecto</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-sm text-slate-900">{formatDate(order.register_date)}</td>
                      <td className="px-3 py-2 text-sm text-slate-900">{order.provider_name || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-slate-600">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total} pedidos
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadClientReport(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="px-3 py-1 border border-slate-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1 text-sm text-slate-600">
                    Página {pagination.page} de {pagination.pages}
                  </span>
                  <button
                    onClick={() => loadClientReport(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="px-3 py-1 border border-slate-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}