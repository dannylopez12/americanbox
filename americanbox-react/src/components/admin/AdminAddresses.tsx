import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, MapPinned, PlusCircle, Pencil, Trash2, X, Save, Download, FilterX } from "lucide-react";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/flatpickr.min.css";

import { api } from "../../lib/api";
import { useAutoRefresh } from "../../hooks/useAutoRefresh";

type Address = {
  id: number;
  customer_id: number | null;
  customer_name: string;
  province: string | null;
  city: string | null;
  main_street: string | null;
  secondary_street: string | null;
  numbering: string | null;
  reference: string | null;
  notes?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

type Pager = { page: number; limit: number; total: number; pages: number };

type CustomerOption = {
  id: number;
  names: string;
  dni: string | null;
};

type AddressForm = {
  customer_id: number | "";
  province: string;
  city: string;
  main_street: string;
  secondary_street: string;
  numbering: string;
  reference: string;
  notes: string;
};

const emptyForm: AddressForm = {
  customer_id: "",
  province: "",
  city: "",
  main_street: "",
  secondary_street: "",
  numbering: "",
  reference: "",
  notes: "",
};

export default function AdminAddresses() {
  const [items, setItems] = useState<Address[]>([]);
  const [pager, setPager] = useState<Pager>({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [editing, setEditing] = useState<Address | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const lastUpdatedLabel = lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : "—";

  const loadCustomers = useCallback(async () => {
    try {
      const r = await api<{
        ok: boolean;
        items: CustomerOption[];
      }>("/api/admin/customers?limit=200&page=1");
      if (r?.ok && Array.isArray(r.items)) {
        setCustomers(r.items);
      }
    } catch (error) {
      console.error("[AdminAddresses] load customers error", error);
    }
  }, []);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const load = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(pager.limit));
        if (q.trim()) params.set("q", q.trim());
        if (cityFilter) params.set("city", cityFilter);
        if (dateRange) params.set("date_range", dateRange);

        const r = await api<{
          ok: boolean;
          items: Address[];
          page: number;
          limit: number;
          total: number;
          pages: number;
        }>(`/api/admin/addresses?${params.toString()}`);

        if (r?.ok) {
          setItems(r.items);
          setPager({ page: r.page, limit: r.limit, total: r.total, pages: r.pages });
        } else {
          setItems([]);
          setPager((p) => ({ ...p, page: 1, total: 0, pages: 1 }));
        }
        setLastUpdated(Date.now());
      } catch (error) {
        console.error("[AdminAddresses] load error", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [q, cityFilter, dateRange, pager.limit]
  );

  useEffect(() => {
    void load(1);
  }, [load]);

  useAutoRefresh(() => load(pager.page), {
    deps: [pager.page, q, cityFilter, dateRange],
    delay: 45_000,
  });

  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    items.forEach((addr) => {
      if (addr.city) set.add(addr.city);
    });
    return Array.from(set).sort();
  }, [items]);

  const clearFilters = () => {
    setQ("");
    setCityFilter("");
    setDateRange("");
    void load(1);
  };

  const exportCsv = () => {
    if (!items.length) {
      alert("No hay registros para exportar.");
      return;
    }

    const headers = [
      "Id",
      "Cliente",
      "Provincia",
      "Ciudad",
      "Calle principal",
      "Calle secundaria",
      "Numeración",
      "Referencia",
      "Notas",
      "Actualizado",
    ];
    const rows = items.map((addr) => [
      addr.id,
      wrapCsv(addr.customer_name),
      wrapCsv(addr.province),
      wrapCsv(addr.city),
      wrapCsv(addr.main_street),
      wrapCsv(addr.secondary_street),
      wrapCsv(addr.numbering),
      wrapCsv(addr.reference),
      wrapCsv(addr.notes),
      wrapCsv(addr.updated_at),
    ]);

    const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `direcciones_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (addr: Address) => {
    setEditing(addr);
    setForm({
      customer_id: addr.customer_id ?? "",
      province: addr.province ?? "",
      city: addr.city ?? "",
      main_street: addr.main_street ?? "",
      secondary_street: addr.secondary_street ?? "",
      numbering: addr.numbering ?? "",
      reference: addr.reference ?? "",
      notes: addr.notes ?? "",
    });
    setShowForm(true);
  };

  const onSave = async () => {
    if (!form.city.trim() || !form.main_street.trim()) {
      alert("Ciudad y calle principal son obligatorias.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        customer_id: form.customer_id === "" ? null : Number(form.customer_id),
        province: form.province.trim() || null,
        city: form.city.trim(),
        main_street: form.main_street.trim(),
        secondary_street: form.secondary_street.trim() || null,
        numbering: form.numbering.trim() || null,
        reference: form.reference.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (editing) {
  await api(`/api.php/api/admin/addresses/${editing.id}`, { method: "PUT", json: payload });
      } else {
  await api(`/api.php/api/admin/addresses`, { method: "POST", json: payload });
      }
      setShowForm(false);
      setForm(emptyForm);
      await load(editing ? pager.page : 1);
    } catch (error: any) {
      alert(error?.message ?? "No se pudo guardar la dirección.");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (addr: Address) => {
    if (!confirm(`¿Eliminar la dirección del cliente "${addr.customer_name}"?`)) return;
    setDeletingId(addr.id);
    try {
  await api(`/api.php/api/admin/addresses/${addr.id}`, { method: "DELETE" });
      await load(pager.page);
    } catch (error: any) {
      alert(error?.message ?? "No se pudo eliminar la dirección.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <MapPinned className="w-5 h-5 text-amber-500" />
            Direcciones
          </h2>
          <p className="text-sm text-slate-500">
            Gestiona las direcciones de entrega sin campos de latitud o longitud. La información se actualiza en
            tiempo real.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50"
            type="button"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600"
            type="button"
          >
            <PlusCircle className="w-4 h-4" />
            Nueva dirección
          </button>
        </div>
      </header>

      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="p-4 space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Buscar por cliente, calle, referencia..."
                  className="w-full sm:w-72 pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full sm:w-56 rounded-lg border border-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                <option value="">Todas las ciudades</option>
                {cityOptions.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-slate-500 gap-2">
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
                <Th>Cliente</Th>
                <Th>Provincia</Th>
                <Th>Ciudad</Th>
                <Th>Calle principal</Th>
                <Th>Calle secundaria</Th>
                <Th>Numeración</Th>
                <Th>Referencia</Th>
                <Th>Actualizado</Th>
                <Th className="text-center">Opciones</Th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr className="border-t">
                  <Td colSpan={10}>
                    <div className="py-8 text-center text-slate-500">Cargando direcciones...</div>
                  </Td>
                </tr>
              )}
              {!loading && items.length === 0 && (
                <tr className="border-t">
                  <Td colSpan={10}>
                    <div className="py-8 text-center text-slate-500">
                      No se encontraron direcciones con los filtros actuales.
                    </div>
                  </Td>
                </tr>
              )}
              {items.map((addr) => (
                <tr key={addr.id} className="border-t hover:bg-slate-50">
                  <Td>{addr.id}</Td>
                  <Td>
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-800 truncate">{addr.customer_name}</span>
                      {addr.customer_id && (
                        <span className="text-xs text-slate-500">ID cliente: {addr.customer_id}</span>
                      )}
                    </div>
                  </Td>
                  <Td>{addr.province ?? "—"}</Td>
                  <Td>{addr.city ?? "—"}</Td>
                  <Td className="max-w-[220px] truncate">{addr.main_street ?? "—"}</Td>
                  <Td className="max-w-[220px] truncate">{addr.secondary_street ?? "—"}</Td>
                  <Td>{addr.numbering ?? "—"}</Td>
                  <Td className="max-w-[160px] truncate">{addr.reference ?? "—"}</Td>
                  <Td>{formatDateTime(addr.updated_at ?? addr.created_at)}</Td>
                  <Td>
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(addr)}
                        className="inline-flex items-center justify-center rounded-md bg-amber-400/90 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-amber-400"
                        title="Editar dirección"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(addr)}
                        className="inline-flex items-center justify-center rounded-md bg-red-500/90 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-500 disabled:opacity-50"
                        title="Eliminar dirección"
                        disabled={deletingId === addr.id}
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

      {showForm && (
        <div className="fixed inset-0 z-40 bg-black/40 grid place-items-center p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl border border-slate-200">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {editing ? "Edición de una dirección" : "Nueva dirección"}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="p-2 rounded-md hover:bg-slate-100"
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Cliente">
                  <select
                    value={form.customer_id}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        customer_id: e.target.value === "" ? "" : Number(e.target.value),
                      }))
                    }
                    className="inp"
                  >
                    <option value="">— Selecciona un cliente —</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.names} {c.dni ? `(${c.dni})` : ""}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Provincia">
                  <input
                    className="inp"
                    value={form.province}
                    onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
                  />
                </Field>
                <Field label="Ciudad">
                  <input
                    className="inp"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    required
                  />
                </Field>
                <Field label="Calle principal">
                  <input
                    className="inp"
                    value={form.main_street}
                    onChange={(e) => setForm((f) => ({ ...f, main_street: e.target.value }))}
                    required
                  />
                </Field>
                <Field label="Calle secundaria">
                  <input
                    className="inp"
                    value={form.secondary_street}
                    onChange={(e) => setForm((f) => ({ ...f, secondary_street: e.target.value }))}
                  />
                </Field>
                <Field label="Numeración">
                  <input
                    className="inp"
                    value={form.numbering}
                    onChange={(e) => setForm((f) => ({ ...f, numbering: e.target.value }))}
                  />
                </Field>
                <Field label="Referencia">
                  <textarea
                    className="inp min-h-[96px]"
                    value={form.reference}
                    onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                  />
                </Field>
                <Field label="Notas internas">
                  <textarea
                    className="inp min-h-[96px]"
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    placeholder="Observaciones que ayuden al repartidor..."
                  />
                </Field>
              </div>
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
                className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 font-medium text-white hover:bg-amber-600 disabled:opacity-50"
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

function wrapCsv(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
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

