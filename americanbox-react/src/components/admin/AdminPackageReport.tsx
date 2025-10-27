import { useCallback, useEffect, useState } from "react";
import { PackageSearch, Search, FilterX, Download } from "lucide-react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.min.css";

import { api } from "../../lib/api";

type PackageRow = {
  id: number;
  shipment_type: string;
  hawb: string;
  sender: string;
  recipient: string;
  recipient_id?: string | null;
  weight_kg?: number | null;
  fob_value?: number | null;
  description?: string | null;
  pieces?: number | null;
  sender_address?: string | null;
  recipient_address?: string | null;
  invoice_number?: string | null;
  register_date?: string | null;
};

type Pager = { page: number; limit: number; total: number; pages: number };

export default function AdminPackageReport() {
  const [items, setItems] = useState<PackageRow[]>([]);
  const [pager, setPager] = useState<Pager>({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const lastUpdatedLabel = lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "—";

  const load = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(pager.limit));
        if (q.trim()) params.set("q", q.trim());
        if (dateRange) params.set("date_range", dateRange);

        const r = await api<{
          ok: boolean;
          items: PackageRow[];
          page: number;
          limit: number;
          total: number;
          pages: number;
        }>(`/api/admin/reports/packages?${params.toString()}`);

        if (r?.ok) {
          setItems(r.items);
          setPager({ page: r.page, limit: r.limit, total: r.total, pages: r.pages });
        } else {
          setItems([]);
          setPager((p) => ({ ...p, page: 1, total: 0, pages: 1 }));
        }
        setLastUpdated(Date.now());
      } catch (error) {
        console.error("[AdminPackageReport] load error", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [q, dateRange, pager.limit]
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  const clearFilters = () => {
    setQ("");
    setDateRange("");
    void load(1);
  };

  const exportCsv = () => {
    if (!items.length) {
      alert("No hay datos para exportar.");
      return;
    }
    const headers = [
      "Tipo de envío",
      "HAWB",
      "Remitente",
      "Consignatario",
      "ID Consignatario",
      "Peso (kg)",
      "Valor FOB",
      "Descripción",
      "Piezas",
      "Dirección remitente",
      "Dirección consignatario",
      "Factura",
      "Fecha",
    ];
    const rows = items.map((row) => [
      wrapCsv(row.shipment_type),
      wrapCsv(row.hawb),
      wrapCsv(row.sender),
      wrapCsv(row.recipient),
      wrapCsv(row.recipient_id),
      row.weight_kg ?? "",
      row.fob_value ?? "",
      wrapCsv(row.description),
      row.pieces ?? "",
      wrapCsv(row.sender_address),
      wrapCsv(row.recipient_address),
      wrapCsv(row.invoice_number),
      wrapCsv(row.register_date),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `reporte_paquetes_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <PackageSearch className="w-5 h-5 text-indigo-500" />
            Reporte de paquetes
          </h2>
          <p className="text-sm text-slate-500">
            Consulta el detalle de paquetes enviados por rango de fechas. Incluye información logística y fiscal.
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
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por HAWB, remitente o consignatario..."
                  className="w-full sm:w-80 pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Fecha desde - hasta:</label>
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
                <Th>Tipo de envío</Th>
                <Th>HAWB</Th>
                <Th>Remitente</Th>
                <Th>Consignatario</Th>
                <Th>ID Consignatario</Th>
                <Th>Peso Kgs</Th>
                <Th>Valor FOB</Th>
                <Th>Descripción</Th>
                <Th>Piezas</Th>
                <Th>Dirección remitente</Th>
                <Th>Dirección consignatario</Th>
                <Th>Factura</Th>
                <Th>Fecha</Th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr className="border-t">
                  <Td colSpan={13}>
                    <div className="py-8 text-center text-slate-500">Cargando paquetes...</div>
                  </Td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr className="border-t">
                  <Td colSpan={13}>
                    <div className="py-8 text-center text-slate-500">
                      No hay paquetes para los filtros actuales.
                    </div>
                  </Td>
                </tr>
              )}
              {items.map((row) => (
                <tr key={row.id} className="border-t hover:bg-slate-50">
                  <Td>{row.shipment_type}</Td>
                  <Td>{row.hawb}</Td>
                  <Td>{row.sender}</Td>
                  <Td>{row.recipient}</Td>
                  <Td>{row.recipient_id ?? "—"}</Td>
                  <Td>{row.weight_kg ?? "—"}</Td>
                  <Td>{row.fob_value != null ? formatCurrency(row.fob_value) : "—"}</Td>
                  <Td className="max-w-[220px] truncate">{row.description ?? "—"}</Td>
                  <Td>{row.pieces ?? "—"}</Td>
                  <Td className="max-w-[200px] truncate">{row.sender_address ?? "—"}</Td>
                  <Td className="max-w-[200px] truncate">{row.recipient_address ?? "—"}</Td>
                  <Td>{row.invoice_number ?? "—"}</Td>
                  <Td>{formatDate(row.register_date)}</Td>
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
    </section>
  );
}

function wrapCsv(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

function formatDate(value: string | null | undefined): string {
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

