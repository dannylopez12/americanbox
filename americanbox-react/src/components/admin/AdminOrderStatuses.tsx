import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Search, PlusCircle, Trash2, Pencil, X, Save } from "lucide-react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.min.css";

import { api } from "../../lib/api";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import { ORDER_STATE_OPTIONS, type OrderStateOption } from "../../constants/orderStates";

type OrderOption = {
  id: number;
  label: string;
  status: string | null;
};

type StatusRow = {
  id: number;
  order_id: number;
  status: string | null;
  description: string | null;
  created_at: string | null;
  created_by?: string | null;
};

type Pager = { page: number; limit: number; total: number; pages: number };

const emptyForm = { status: "", description: "" };

export default function AdminOrderStatuses() {
  const [orders, setOrders] = useState<OrderOption[]>([]);
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);

  const [items, setItems] = useState<StatusRow[]>([]);
  const [pager, setPager] = useState<Pager>({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);

  const [statusSearch, setStatusSearch] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<StatusRow | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const options = useMemo<OrderStateOption[]>(() => ORDER_STATE_OPTIONS, []);
  const lastUpdatedLabel = lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "—";

  const loadOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("limit", "100");
      if (orderSearch.trim()) params.set("q", orderSearch.trim());
      const r = await api<{ ok: boolean; orders: { id: number; guide: string; status: string | null }[] }>(
        `/api/admin/orders?${params.toString()}`
      );
      if (r?.ok && Array.isArray(r.orders)) {
        setOrders(
          r.orders.map((o) => ({
            id: o.id,
            label: `${o.guide}`,
            status: o.status ?? null,
          }))
        );
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("[AdminOrderStatuses] load orders", error);
    }
  }, [orderSearch]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (!selectedOrder && orders.length > 0) {
      setSelectedOrder(orders[0]?.id ?? null);
    }
  }, [orders, selectedOrder]);

  const loadStatuses = useCallback(
    async (page = 1) => {
      if (!selectedOrder) {
        setItems([]);
        return;
      }
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(pager.limit));
        if (statusSearch.trim()) params.set("q", statusSearch.trim());
        if (dateRange) params.set("date_range", dateRange);

        const r = await api<{
          ok: boolean;
          items: StatusRow[];
          page: number;
          limit: number;
          total: number;
          pages: number;
        }>(`/api/admin/orders/${selectedOrder}/statuses?${params.toString()}`);
        if (r?.ok) {
          setItems(r.items);
          setPager({ page: r.page, limit: r.limit, total: r.total, pages: r.pages });
        } else {
          setItems([]);
          setPager((p) => ({ ...p, page: 1, total: 0, pages: 1 }));
        }
        setLastUpdated(Date.now());
      } catch (error) {
        console.error("[AdminOrderStatuses] load statuses", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [selectedOrder, statusSearch, dateRange, pager.limit]
  );

  useEffect(() => {
    void loadStatuses(1);
  }, [loadStatuses]);

  useAutoRefresh(() => loadStatuses(pager.page), {
    deps: [pager.page, selectedOrder, statusSearch, dateRange],
    delay: 45_000,
    enabled: selectedOrder !== null,
  });

  const clearFilters = () => {
    setStatusSearch("");
    setDateRange("");
    void loadStatuses(1);
  };

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (row: StatusRow) => {
    setEditing(row);
    setForm({
      status: row.status ?? "",
      description: row.description ?? "",
    });
    setShowForm(true);
  };

  const onSave = async () => {
    if (!selectedOrder) return;
    if (!form.status) {
      alert("Selecciona un estado.");
      return;
    }
    setSaving(true);
    try {
      const payload = { status: form.status, description: form.description.trim() || null };
      if (editing) {
  await api(`/api.php/api/admin/orders/${selectedOrder}/statuses/${editing.id}`, { method: "PUT", json: payload });
      } else {
  await api(`/api.php/api/admin/orders/${selectedOrder}/statuses`, { method: "POST", json: payload });
      }
      setShowForm(false);
      setForm(emptyForm);
      await loadStatuses(editing ? pager.page : 1);
    } catch (error: any) {
      alert(error?.message ?? "No se pudo guardar el estado.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (row: StatusRow) => {
    if (!selectedOrder) return;
    if (!confirm("¿Eliminar este estado del pedido?")) return;
    setDeletingId(row.id);
    try {
  await api(`/api.php/api/admin/orders/${selectedOrder}/statuses/${row.id}`, { method: "DELETE" });
      await loadStatuses(pager.page);
    } catch (error: any) {
      alert(error?.message ?? "No se pudo eliminar.");
    } finally {
      setDeletingId(null);
    }
  };

  const generateNext = async () => {
    if (!selectedOrder) return;
    try {
      const r = await api<{ ok: boolean; status?: StatusRow }>(
        `/api/admin/orders/${selectedOrder}/statuses/next`,
        { method: "POST" }
      );
      if (!r?.ok) throw new Error("No se pudo generar el próximo estado.");
      await loadStatuses(1);
    } catch (error: any) {
      alert(error?.message ?? "No se pudo generar el próximo estado.");
    }
  };

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-500" />
            Estados de pedidos
          </h2>
          <p className="text-sm text-slate-500">
            Selecciona un pedido para revisar su historial de estados y registrar nuevas actualizaciones.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              placeholder="Buscar pedido..."
              className="w-full sm:w-72 pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
            />
          </div>
          <button
            type="button"
            onClick={() => void loadOrders()}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
          >
            Refrescar lista
          </button>
        </div>
      </header>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="p-4 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600">Pedido:</label>
              <select
                value={selectedOrder ?? ""}
                onChange={(e) => setSelectedOrder(e.target.value ? Number(e.target.value) : null)}
                className="w-full sm:w-[32rem] rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="">— Selecciona un pedido —</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label} · {getStateLabel(o.status, options)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={generateNext}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              disabled={!selectedOrder}
            >
              Generar próximo estado
            </button>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={statusSearch}
                  onChange={(e) => setStatusSearch(e.target.value)}
                  placeholder="Buscar en descripciones..."
                  className="w-full sm:w-80 pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Filtrar por fechas:
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
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
              >
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
                <Th>Id</Th>
                <Th>Estado</Th>
                <Th>Descripción</Th>
                <Th>Fecha de registro</Th>
                <Th>Registrado por</Th>
                <Th className="text-center">Opciones</Th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr className="border-t">
                  <Td colSpan={6}>
                    <div className="py-8 text-center text-slate-500">Cargando historial...</div>
                  </Td>
                </tr>
              )}
              {!loading && selectedOrder && items.length === 0 && (
                <tr className="border-t">
                  <Td colSpan={6}>
                    <div className="py-8 text-center text-slate-500">
                      Aún no hay estados registrados para este pedido.
                    </div>
                  </Td>
                </tr>
              )}
              {!selectedOrder && (
                <tr className="border-t">
                  <Td colSpan={6}>
                    <div className="py-8 text-center text-slate-500">
                      Selecciona un pedido para ver su historial.
                    </div>
                  </Td>
                </tr>
              )}
              {items.map((row) => (
                <tr key={row.id} className="border-t hover:bg-slate-50">
                  <Td>{row.id}</Td>
                  <Td>
                    <StatusBadge status={row.status} options={options} />
                  </Td>
                  <Td className="max-w-[280px] whitespace-pre-wrap text-slate-700">
                    {row.description ?? "—"}
                  </Td>
                  <Td>{formatDate(row.created_at)}</Td>
                  <Td>{row.created_by ?? "—"}</Td>
                  <Td>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="inline-flex items-center justify-center rounded-md bg-amber-400/90 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-amber-400"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(row)}
                        className="inline-flex items-center justify-center rounded-md bg-red-500/90 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
                        title="Eliminar"
                        disabled={deletingId === row.id}
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

        <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Página {pager.page} de {pager.pages}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadStatuses(Math.max(1, pager.page - 1))}
              className="px-3 py-1.5 rounded-md border border-slate-200 disabled:opacity-50"
              disabled={pager.page <= 1 || loading}
            >
              Anterior
            </button>
            <span className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm">{pager.page}</span>
            <button
              onClick={() => loadStatuses(Math.min(pager.pages, pager.page + 1))}
              className="px-3 py-1.5 rounded-md border border-slate-200 disabled:opacity-50"
              disabled={pager.page >= pager.pages || loading}
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
          disabled={!selectedOrder}
        >
          <PlusCircle className="w-4 h-4" />
          Nuevo registro
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-40 bg-black/40 grid place-items-center p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editing ? "Edición de un estado" : "Nuevo estado"}
              </h3>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-md hover:bg-slate-100" type="button">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <Field label="Estado actual">
                <select
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                  className="inp"
                >
                  <option value="">— Selecciona —</option>
                  {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Descripción">
                <textarea
                  className="inp min-h-[120px]"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Detalle para notificar al cliente..."
                />
              </Field>
            </div>
            <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-3 py-2 rounded-lg border border-slate-200"
                type="button"
                disabled={saving}
              >
                Cancelar
              </button>
              <button
                onClick={onSave}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
                type="button"
                disabled={saving}
              >
                <Save className="w-4 h-4" />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function getStateLabel(status: string | null, options: OrderStateOption[]): string {
  if (!status) return "Sin estado";
  return options.find((opt) => opt.value === status)?.label ?? status;
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
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

function Field({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={["flex flex-col gap-1 text-sm text-slate-600", className].join(" ")}>
      <span className="font-medium">{label}</span>
      {children}
    </label>
  );
}

