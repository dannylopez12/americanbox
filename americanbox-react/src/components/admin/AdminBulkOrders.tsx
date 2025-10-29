import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ClipboardList,
  Search,
  FilterX,
  CheckSquare,
  Square,
  ChevronDown,
  Download,
  CheckCircle2,
} from "lucide-react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.min.css";

import { api } from "../../lib/api";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";
import { ORDER_STATE_OPTIONS, type OrderStateOption } from "../../constants/orderStates";

type BulkOrderRow = {
  id: number;
  guide: string;
  provider_code?: string | null;
  register_date: string | null;
  client: string;
  current_status: string | null;
  weight_lbs?: number | null;
  total?: number | null;
};

type Pager = { page: number; limit: number; total: number; pages: number };

type StatusCatalogResponse = {
  value: string;
  label: string;
};

export default function AdminBulkOrders() {
  const [items, setItems] = useState<BulkOrderRow[]>([]);
  const [pager, setPager] = useState<Pager>({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [clientFilter, setClientFilter] = useState(""); // Nuevo filtro por cliente según reunión

  const [statusOptions, setStatusOptions] = useState<OrderStateOption[]>(ORDER_STATE_OPTIONS);
  const [newStatus, setNewStatus] = useState("");
  const [rowOverrides, setRowOverrides] = useState<Record<number, string>>({});
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [applying, setApplying] = useState(false);

  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const lastUpdatedLabel = lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "—";

  const allSelected = items.length > 0 && items.every((row) => selected.has(row.id));
  const selectedCount = selected.size;

  const loadStatuses = useCallback(async () => {
    try {
      const r = await api<{ ok: boolean; items: StatusCatalogResponse[] }>("/api/admin/orders/statuses");
      if (r?.ok && Array.isArray(r.items) && r.items.length > 0) {
        setStatusOptions(
          r.items.map((item) => ({
            value: item.value,
            label: item.label,
          }))
        );
        return;
      }
    } catch (error) {
      console.warn("[AdminBulkOrders] status catalog not available, fallback to defaults.");
    }
    // fallback already set with ORDER_STATE_OPTIONS
  }, []);

  useEffect(() => {
    void loadStatuses();
  }, [loadStatuses]);

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
        if (clientFilter.trim()) params.set("client", clientFilter.trim()); // Filtro por cliente según reunión

        const r = await api<{
          ok: boolean;
          items: BulkOrderRow[];
          page: number;
          limit: number;
          total: number;
          pages: number;
        }>(`/api/admin/orders/bulk?${params.toString()}`);

        if (r?.ok) {
          setItems(r.items);
          setPager({ page: r.page, limit: r.limit, total: r.total, pages: r.pages });
        } else {
          setItems([]);
          setPager((p) => ({ ...p, page: 1, total: 0, pages: 1 }));
        }
        setLastUpdated(Date.now());
      } catch (error) {
        console.error("[AdminBulkOrders] load error", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [q, dateRange, statusFilter, clientFilter, pager.limit]
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  useAutoRefresh(() => load(pager.page), {
    deps: [pager.page, q, dateRange, statusFilter, clientFilter],
    delay: 30_000,
  });

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(items.map((row) => row.id)));
  };

  const toggleItem = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearSelection = () => {
    setSelected(new Set());
    setRowOverrides({});
  };

  const clearFilters = () => {
    setQ("");
    setDateRange("");
    setStatusFilter("");
    setClientFilter(""); // Limpiar filtro por cliente
    void load(1);
  };

  const exportCsv = () => {
    if (!items.length) {
      alert("No hay registros para exportar.");
      return;
    }
    const headers = [
      "Id",
      "Guía",
      "Proveedor",
      "Cliente",
      "Fecha registro",
      "Estado actual",
      "Peso lbs",
      "Total",
    ];
    const rows = items.map((row) => [
      row.id,
      wrapCsv(row.guide),
      wrapCsv(row.provider_code),
      wrapCsv(row.client),
      wrapCsv(row.register_date),
      wrapCsv(getStatusLabel(row.current_status, statusOptions)),
      row.weight_lbs ?? "",
      row.total ?? "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `pedidos_masivos_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const onOverride = (id: number, status: string) => {
    setRowOverrides((prev) => {
      const next = { ...prev };
      if (!status) {
        delete next[id];
      } else {
        next[id] = status;
      }
      return next;
    });
  };

  const selectionPreview = useMemo(() => {
    if (!selectedCount) return "No hay pedidos seleccionados.";
    const names = items
      .filter((row) => selected.has(row.id))
      .slice(0, 3)
      .map((row) => row.guide);
    const extra = selectedCount - names.length;
    return `Seleccionados: ${names.join(", ")}${extra > 0 ? ` y ${extra} más` : ""}`;
  }, [items, selected, selectedCount]);

  const onApplyStatus = async () => {
    if (!selectedCount) {
      alert("Selecciona al menos un pedido.");
      return;
    }

    const updates = Array.from(selected).map((id) => ({
      order_id: id,
      status: rowOverrides[id] || newStatus,
    }));

    if (updates.some((u) => !u.status)) {
      alert("Define un nuevo estado para todos los pedidos seleccionados.");
      return;
    }

    setApplying(true);
    try {
      const r = await api<{ ok: boolean; updated?: number }>("/api/admin/orders/bulk/status", {
        method: "POST",
        json: { updates },
      });
      if (!r?.ok) throw new Error("No se pudo actualizar los pedidos.");
      clearSelection();
      await load(pager.page);
      alert(`${r.updated ?? updates.length} pedidos enviados a actualización.`);
    } catch (error: any) {
      alert(error?.message ?? "Ocurrió un error aplicando los estados.");
    } finally {
      setApplying(false);
    }
  };

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-sky-500" />
            Actualización masiva de pedidos
          </h2>
          <p className="text-sm text-slate-500">
            Busca por fecha o guía, selecciona los pedidos y aplica un nuevo estado en bloque. El tablero se
            refresca automáticamente cada 30 segundos.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por guía, proveedor o cliente..."
                  className="w-full sm:w-72 pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full sm:w-64 rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                <option value="">Todos los estados</option>
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              
              {/* Nuevo filtro por cliente según reunión */}
              <div className="relative">
                <input
                  value={clientFilter}
                  onChange={(e) => setClientFilter(e.target.value)}
                  placeholder="Filtrar por cliente..."
                  className="w-full sm:w-64 px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-400"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-end">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">
                  Buscar por rango de fechas:
                </label>
                <Flatpickr
                  options={{ mode: "range", dateFormat: "Y-m-d", showMonths: 2 }}
                  value={dateRange ? dateRange.split(" - ") : []}
                  onChange={(selected: Date[]) => {
                    if (!selected || selected.length === 0) return setDateRange("");
                    if (selected.length === 1) {
                      return setDateRange(selected[0].toISOString().slice(0, 10));
                    }
                    const a = selected[0].toISOString().slice(0, 10);
                    const b = selected[1].toISOString().slice(0, 10);
                    setDateRange(`${a} - ${b}`);
                  }}
                  className="w-full md:w-72 rounded-lg border border-slate-200 px-3 py-2"
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

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between rounded-xl bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleAll}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-white"
              >
                {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                {allSelected ? "Quitar selección" : "Seleccionar todos"}
              </button>
              <button
                type="button"
                onClick={clearSelection}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-white disabled:opacity-50"
                disabled={selectedCount === 0}
              >
                <FilterX className="w-4 h-4" />
                Limpiar selección
              </button>
              <span className="text-sm text-slate-600">{selectionPreview}</span>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
              >
                <option value="">Nuevo estado (opcional)</option>
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={onApplyStatus}
                disabled={applying || selectedCount === 0}
                className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                Aplicar cambios
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500">
            <span>
              Mostrando {items.length} de {pager.total} pedidos. Seleccionados: {selectedCount}.
            </span>
            <span>Última actualización: {lastUpdatedLabel}</span>
          </div>
        </div>

        <div className="border-t border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <Th>
                  <span className="sr-only">Seleccionar</span>
                </Th>
                <Th>Pedido</Th>
                <Th>Proveedor</Th>
                <Th>Cliente</Th>
                <Th>Fecha de registro</Th>
                <Th>Peso (lb)</Th>
                <Th>Total</Th>
                <Th>Estado actual</Th>
                <Th>Nuevo estado</Th>
                <Th>Acción</Th>
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
                      No se encontraron pedidos con los filtros seleccionados.
                    </div>
                  </Td>
                </tr>
              )}
              {items.map((row) => {
                const override = rowOverrides[row.id] ?? "";
                const currentStatusLabel = getStatusLabel(row.current_status, statusOptions);
                return (
                  <tr key={row.id} className="border-t hover:bg-slate-50">
                    <Td>
                      <button
                        type="button"
                        onClick={() => toggleItem(row.id)}
                        className="inline-flex items-center justify-center rounded-md border border-slate-300 px-2 py-1 hover:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                      >
                        {selected.has(row.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                      </button>
                    </Td>
                    <Td>
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-800">{row.guide}</span>
                        <span className="text-xs text-slate-500">ID #{row.id}</span>
                      </div>
                    </Td>
                    <Td>{row.provider_code ?? "—"}</Td>
                    <Td className="max-w-[200px] truncate">{row.client}</Td>
                    <Td>{formatDate(row.register_date)}</Td>
                    <Td>{row.weight_lbs ?? "—"}</Td>
                    <Td>{row.total != null ? formatCurrency(row.total) : "—"}</Td>
                    <Td>
                      <StatusBadge status={row.current_status} label={currentStatusLabel} />
                    </Td>
                    <Td>
                      <div className="relative">
                        <select
                          value={override}
                          onChange={(e) => onOverride(row.id, e.target.value)}
                          className="w-52 rounded-lg border border-slate-200 px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-sky-400"
                        >
                          <option value="">{newStatus ? `Usar "${getStatusLabel(newStatus, statusOptions)}"` : "—"}</option>
                          {statusOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      </div>
                    </Td>
                    <Td>
                      {/* Botón X para excluir individual según reunión */}
                      <button
                        type="button"
                        onClick={() => toggleItem(row.id)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400"
                        title={selected.has(row.id) ? "Incluir en actualización" : "Excluir de actualización"}
                      >
                        {selected.has(row.id) ? "✓" : "✕"}
                      </button>
                    </Td>
                  </tr>
                );
              })}
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
  return d.toLocaleDateString();
}

function formatCurrency(value: number | string): string {
  const num = typeof value === "string" ? Number(value) : value;
  if (!Number.isFinite(num)) return "—";
  return new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" }).format(num);
}

function getStatusLabel(status: string | null | undefined, options: OrderStateOption[]): string {
  if (!status) return "Sin estado";
  return options.find((opt) => opt.value === status)?.label ?? status;
}

function getStatusTone(status: string | null | undefined, options: OrderStateOption[]): OrderStateOption["tone"] {
  if (!status) return "slate";
  return options.find((opt) => opt.value === status)?.tone ?? "slate";
}

function StatusBadge({ status, label }: { status: string | null | undefined; label: string }) {
  const tone = getStatusTone(status, ORDER_STATE_OPTIONS);
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

