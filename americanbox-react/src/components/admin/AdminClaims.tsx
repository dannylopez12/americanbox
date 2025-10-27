import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Search, FilterX, MessageCircle, Send, Clock, CheckCircle, XCircle, User } from "lucide-react";
import { api } from "../../lib/api";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

type ComplaintRow = {
  id: number;
  subject: string;
  message: string;
  status: "pending" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "critical";
  admin_response?: string | null;
  created_at: string;
  updated_at?: string | null;
  customer_name: string;
  customer_email: string;
  order_guide?: string | null;
  admin_name?: string | null;
};

type Pager = { page: number; limit: number; total: number; pages: number };

const statusOptions = [
  { value: "", label: "Todos los estados" },
  { value: "pending", label: "Pendiente" },
  { value: "in_progress", label: "En progreso" },
  { value: "resolved", label: "Resuelta" },
  { value: "closed", label: "Cerrada" },
];

const priorityOptions = [
  { value: "", label: "Todas las prioridades" },
  { value: "low", label: "Baja" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
  { value: "critical", label: "Crítica" },
];

export default function AdminClaims() {
  const [items, setItems] = useState<ComplaintRow[]>([]);
  const [pager, setPager] = useState<Pager>({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const [showResponse, setShowResponse] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintRow | null>(null);
  const [responseText, setResponseText] = useState("");
  const [responseStatus, setResponseStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const lastUpdatedLabel = lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "—";

  const load = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(pager.limit));
        if (q.trim()) params.set("q", q.trim());
        if (statusFilter) params.set("status", statusFilter);
        if (priorityFilter) params.set("priority", priorityFilter);

        const r = await api<{
          ok: boolean;
          items: ComplaintRow[];
          page: number;
          limit: number;
          total: number;
          pages: number;
        }>(`/api/admin/complaints?${params.toString()}`);
        
        if (r?.ok) {
          setItems(r.items);
          setPager({ page: r.page, limit: r.limit, total: r.total, pages: r.pages });
          setLastUpdated(Date.now());
        } else {
          setItems([]);
          setPager((p) => ({ ...p, page: 1, total: 0, pages: 1 }));
        }
      } catch (error) {
        console.error("Error loading complaints:", error);
        setItems([]);
        setPager((p) => ({ ...p, page: 1, total: 0, pages: 1 }));
      } finally {
        setLoading(false);
      }
    },
    [pager.limit, q, statusFilter, priorityFilter]
  );

  useEffect(() => {
    load();
  }, [load]);

  useAutoRefresh(load, { delay: 30000 });

  const openResponse = (complaint: ComplaintRow) => {
    setSelectedComplaint(complaint);
    setResponseText(complaint.admin_response || "");
    setResponseStatus(complaint.status);
    setShowResponse(true);
  };

  const closeResponse = () => {
    setShowResponse(false);
    setSelectedComplaint(null);
    setResponseText("");
    setResponseStatus("");
  };

  const onSubmitResponse = async () => {
    if (!selectedComplaint || !responseText.trim()) {
      alert("La respuesta es requerida");
      return;
    }

    setSaving(true);
    try {
      const r = await api(`/api/admin/complaints/${selectedComplaint.id}/respond`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          response: responseText,
          status: responseStatus || selectedComplaint.status
        }),
      });
      
      if (r?.ok) {
        closeResponse();
        load(pager.page);
      } else {
        alert("Error al enviar respuesta");
      }
    } catch (error) {
      console.error(error);
      alert("Error al enviar respuesta");
    }
    setSaving(false);
  };

  const onUpdateStatus = async (complaintId: number, newStatus: string) => {
    try {
      const r = await api(`/api/admin/complaints/${complaintId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (r?.ok) {
        load(pager.page);
      } else {
        alert("Error al actualizar estado");
      }
    } catch (error) {
      console.error(error);
      alert("Error al actualizar estado");
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'in_progress': return <MessageCircle className="w-4 h-4" />;
      case 'resolved': return <CheckCircle className="w-4 h-4" />;
      case 'closed': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200';
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in_progress': return 'En Progreso';
      case 'resolved': return 'Resuelta';
      case 'closed': return 'Cerrada';
      default: return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return 'Baja';
      case 'medium': return 'Media';
      case 'high': return 'Alta';
      case 'critical': return 'Crítica';
      default: return priority;
    }
  };

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            Quejas y Sugerencias
          </h1>
          <p className="text-slate-600">
            Gestiona las quejas y sugerencias de los clientes
          </p>
          <p className="text-xs text-slate-500">
            Última actualización: {lastUpdatedLabel}
          </p>
        </div>
      </header>

      {/* Filtros */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar quejas..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {priorityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => {
              setQ("");
              setStatusFilter("");
              setPriorityFilter("");
            }}
            className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <FilterX className="w-4 h-4" />
            Limpiar
          </button>
        </div>
      </div>

      {/* Lista de quejas */}
      <div className="bg-white rounded-lg border border-slate-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-slate-600">Cargando quejas...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No se encontraron quejas</p>
            <p className="text-sm text-slate-500">Ajusta los filtros para ver más resultados</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {items.map((complaint) => (
              <div key={complaint.id} className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800 mb-1">
                          {complaint.subject}
                        </h3>
                        <p className="text-sm text-slate-600 mb-2">
                          <User className="inline w-4 h-4 mr-1" />
                          {complaint.customer_name} ({complaint.customer_email})
                        </p>
                        <p className="text-slate-700 text-sm">
                          {complaint.message}
                        </p>
                        {complaint.order_guide && (
                          <p className="text-xs text-slate-500 mt-2">
                            Orden relacionada: <span className="font-mono">{complaint.order_guide}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {complaint.admin_response && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Send className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-800">
                            Respuesta {complaint.admin_name && `de ${complaint.admin_name}`}
                          </span>
                        </div>
                        <p className="text-sm text-blue-700">{complaint.admin_response}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 lg:items-end">
                    <div className="flex gap-2">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(complaint.status)}`}>
                        {getStatusIcon(complaint.status)}
                        {getStatusText(complaint.status)}
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(complaint.priority)}`}>
                        {getPriorityText(complaint.priority)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-500">
                      <p>Creada: {new Date(complaint.created_at).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</p>
                      {complaint.updated_at && (
                        <p>Actualizada: {new Date(complaint.updated_at).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openResponse(complaint)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Send className="w-3 h-3" />
                        Responder
                      </button>
                      
                      <select
                        value={complaint.status}
                        onChange={(e) => onUpdateStatus(complaint.id, e.target.value)}
                        className="px-2 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="pending">Pendiente</option>
                        <option value="in_progress">En Progreso</option>
                        <option value="resolved">Resuelta</option>
                        <option value="closed">Cerrada</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Paginación */}
      {pager.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            Mostrando {((pager.page - 1) * pager.limit) + 1} a {Math.min(pager.page * pager.limit, pager.total)} de {pager.total} quejas
          </p>
          <div className="flex gap-1">
            <button
              onClick={() => load(pager.page - 1)}
              disabled={pager.page <= 1}
              className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            <span className="px-3 py-2 text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-lg">
              {pager.page} de {pager.pages}
            </span>
            <button
              onClick={() => load(pager.page + 1)}
              disabled={pager.page >= pager.pages}
              className="px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Modal de respuesta */}
      {showResponse && selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-semibold text-slate-800">
                Responder a: {selectedComplaint.subject}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Cliente: {selectedComplaint.customer_name}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Queja original */}
              <div className="bg-slate-50 rounded-lg p-4">
                <h4 className="font-medium text-slate-800 mb-2">Queja original:</h4>
                <p className="text-slate-700 text-sm">{selectedComplaint.message}</p>
              </div>

              {/* Campo de respuesta */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Respuesta *
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Escribe tu respuesta al cliente..."
                />
              </div>

              {/* Estado */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Cambiar estado
                </label>
                <select
                  value={responseStatus}
                  onChange={(e) => setResponseStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pendiente</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="resolved">Resuelta</option>
                  <option value="closed">Cerrada</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
              <button
                onClick={closeResponse}
                className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onSubmitResponse}
                disabled={saving || !responseText.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Enviando..." : "Enviar Respuesta"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}