import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer } from "recharts";
import { ClipboardList, FilterX, Download, BarChart3 } from "lucide-react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.min.css";

import { api } from "../../lib/api";
import { ORDER_STATE_OPTIONS } from "../../constants/orderStates";

type IndicatorRow = {
  status: string;
  count: number;
};

type IndicatorResponse = {
  ok: boolean;
  rows: IndicatorRow[];
  total?: number;
};

export default function AdminOrderIndicatorReport() {
  const [dateRange, setDateRange] = useState("");
  const [initialStatus, setInitialStatus] = useState("prealerta");
  const [finalStatus, setFinalStatus] = useState("entregado");

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<IndicatorRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const total = useMemo(() => report.reduce((acc, row) => acc + row.count, 0), [report]);

  const chartData = useMemo(
    () =>
      report.map((row) => ({
        estado: row.status,
        pedidos: row.count,
      })),
    [report]
  );

  const loadReport = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params = new URLSearchParams();
      if (dateRange) params.set("date_range", dateRange);
      if (initialStatus) params.set("initial_status", initialStatus);
      if (finalStatus) params.set("final_status", finalStatus);
      const r = await api<IndicatorResponse>(`/api/admin/reports/orders/indicator?${params.toString()}`);
      if (!r?.ok) {
        setReport([]);
        setErrorMsg("No se pudo generar el reporte. Inténtalo más tarde.");
        return;
      }
      setReport(Array.isArray(r.rows) ? r.rows : []);
    } catch (error) {
      console.error("[AdminOrderIndicatorReport] load error", error);
      setReport([]);
      setErrorMsg("Error inesperado al cargar el reporte.");
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setDateRange("");
    setInitialStatus("prealerta");
    setFinalStatus("entregado");
    setReport([]);
    setErrorMsg(null);
  };

  const exportCsv = () => {
    if (!report.length) {
      alert("No hay datos para exportar.");
      return;
    }
    const headers = ["Estado", "Pedidos"];
    const rows = report.map((row) => [row.status, row.count]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `reporte_indicador_${Date.now()}.csv`);
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
            <ClipboardList className="w-5 h-5 text-blue-500" />
            Reporte indicador de pedidos
          </h2>
          <p className="text-sm text-slate-500">
            Mide el volumen de pedidos que avanzan entre dos estados específicos dentro de un rango de fechas.
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

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 space-y-4">
        <div className="grid gap-3 md:grid-cols-[repeat(3,minmax(0,1fr))]">
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
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              placeholder="Selecciona fechas"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Estado inicial:</label>
            <select
              value={initialStatus}
              onChange={(e) => setInitialStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {ORDER_STATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 block mb-1">Estado final:</label>
            <select
              value={finalStatus}
              onChange={(e) => setFinalStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {ORDER_STATE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-sm text-slate-500">
            {total > 0 ? `Total de pedidos contabilizados: ${total}` : "Genera el reporte para ver resultados."}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
            >
              <FilterX className="w-4 h-4" />
              Limpiar filtros
            </button>
            <button
              type="button"
              onClick={loadReport}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              disabled={loading}
            >
              <BarChart3 className="w-4 h-4" />
              Generar
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{errorMsg}</div>
        )}

        {!loading && !errorMsg && report.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
            <div className="rounded-xl border border-slate-200 p-4">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="estado" />
                  <YAxis allowDecimals={false} />
                  <RTooltip formatter={(value: number) => `${value} pedidos`} />
                  <Line type="monotone" dataKey="pedidos" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
              <h3 className="text-sm font-semibold text-slate-600 mb-2">Resumen</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                {report.map((row) => (
                  <li key={row.status} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 shadow-sm">
                    <span>{row.status}</span>
                    <span className="font-semibold">{row.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {loading && <div className="text-center text-sm text-slate-500 py-6">Generando reporte...</div>}
      </div>
    </section>
  );
}

