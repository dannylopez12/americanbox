import { useEffect, useState } from "react";
import { Save, Loader2, Building2, MapPin, Phone, Globe, FileText } from "lucide-react";
import { api } from "../../lib/api";

type Company = {
  ruc: string;
  razon_social: string;
  nombre_comercial: string;
  casillero_direccion: string;
  codigo_postal: string;
  codigo_pais: string;
  siglas_courier: string;
  dir_matriz: string;
  dir_emisor: string;
  punto_emision: string;
  telefono_cel: string;
  telefono_conv: string;
  web_url: string;
  email: string;
  mision: string;
  vision: string;
  iva_percent: number;
  regimen_tributario: string;
};

const empty: Company = {
  ruc: "", razon_social: "", nombre_comercial: "",
  casillero_direccion: "", codigo_postal: "", codigo_pais: "EC",
  siglas_courier: "ABC", dir_matriz: "", dir_emisor: "", punto_emision: "",
  telefono_cel: "", telefono_conv: "", web_url: "", email: "",
  mision: "", vision: "", iva_percent: 15, regimen_tributario: "",
};

export default function AdminCompany() {
  const [form, setForm] = useState<Company>(empty);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const r = await api<{ ok: boolean; item: Company }>("/api/admin/company");
      if (r?.ok && r.item) {
        setForm({
          ruc: r.item.ruc || '',
          razon_social: r.item.razon_social || '',
          nombre_comercial: r.item.nombre_comercial || '',
          casillero_direccion: r.item.casillero_direccion || '',
          codigo_postal: r.item.codigo_postal || '',
          codigo_pais: r.item.codigo_pais || 'EC',
          siglas_courier: r.item.siglas_courier || 'ABC',
          dir_matriz: r.item.dir_matriz || '',
          dir_emisor: r.item.dir_emisor || '',
          punto_emision: r.item.punto_emision || '',
          telefono_cel: r.item.telefono_cel || '',
          telefono_conv: r.item.telefono_conv || '',
          web_url: r.item.web_url || '',
          email: r.item.email || '',
          mision: r.item.mision || '',
          vision: r.item.vision || '',
          iva_percent: Number(r.item.iva_percent) || 15,
          regimen_tributario: r.item.regimen_tributario || '',
        });
      } else {
        setForm(empty);
      }
      setLoading(false);
    })();
  }, []);

const onSave = async () => {
  setSaving(true);

  const payload = {
    ruc: form.ruc?.trim(),
    razon_social: form.razon_social?.trim(),
    nombre_comercial: form.nombre_comercial?.trim(),
    casillero_direccion: form.casillero_direccion?.trim(),
    codigo_postal: form.codigo_postal?.trim(),
    codigo_pais: form.codigo_pais?.trim(),
    siglas_courier: form.siglas_courier?.trim(),
    dir_matriz: form.dir_matriz?.trim(),
    dir_emisor: form.dir_emisor?.trim(),
    punto_emision: form.punto_emision?.trim(),
    telefono_cel: form.telefono_cel?.trim(),
    telefono_conv: form.telefono_conv?.trim(),
    web_url: form.web_url?.trim(),
    email: form.email?.trim(),
    mision: form.mision?.trim(),
    vision: form.vision?.trim(),
    iva_percent: Number(form.iva_percent ?? 15),
    regimen_tributario: form.regimen_tributario?.trim(),
  };

  const r = await api<{ ok: boolean }>(
    "/api/admin/company",
    { method: "PUT", json: payload }
  );

  setSaving(false);
  if (r?.ok) {
    alert("Guardado ✅");
  } else {
    alert("No se pudo guardar");
  }
};


  if (loading) return <div className="rounded-2xl border bg-white p-6 shadow-sm">Cargando…</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
          <Building2 className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Configuración de la Compañía</h1>
          <p className="text-sm text-slate-600">Gestiona la información de tu empresa y configuraciones del sistema</p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Información Básica */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Información Básica</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Field label="RUC:" v={form.ruc} onChange={v => setForm({ ...form, ruc: v })} />
            <Field label="Razón social:" v={form.razon_social} onChange={v => setForm({ ...form, razon_social: v })} />
            <Field label="Nombre Comercial:" v={form.nombre_comercial} onChange={v => setForm({ ...form, nombre_comercial: v })} />
            <Field label="Dirección del Establecimiento Matriz:" v={form.dir_matriz} onChange={v => setForm({ ...form, dir_matriz: v })} className="md:col-span-4" />
          </div>
        </div>

        {/* Información de Contacto */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Información de Ubicación</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Dirección del casillero:" v={form.casillero_direccion} onChange={v => setForm({ ...form, casillero_direccion: v })} className="md:col-span-2" />
            <Field label="Código postal:" v={form.codigo_postal} onChange={v => setForm({ ...form, codigo_postal: v })} />
            <Field label="Código país:" v={form.codigo_pais} onChange={v => setForm({ ...form, codigo_pais: v })} />
            <Field label="Siglas Courier:" v={form.siglas_courier} onChange={v => setForm({ ...form, siglas_courier: v })} />
          </div>
        </div>

        {/* Contacto */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Phone className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Información de Contacto</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            <Field label="Agente de Retención:" type="select" v="" onChange={() => {}} />
            <Field label="Régimen Tributario:" v={form.regimen_tributario} onChange={v => setForm({ ...form, regimen_tributario: v })} />
            <Field label="Teléfono celular:" v={form.telefono_cel} onChange={v => setForm({ ...form, telefono_cel: v })} />
            <Field label="Teléfono convencional:" v={form.telefono_conv} onChange={v => setForm({ ...form, telefono_conv: v })} />
          </div>
        </div>

        {/* Información Web */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Información Digital</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="Email:" v={form.email} onChange={v => setForm({ ...form, email: v })} type="email" />
            <Field label="Dirección de página web:" v={form.web_url} onChange={v => setForm({ ...form, web_url: v })} type="url" />
            <Field label="Misión:" v={form.mision} onChange={v => setForm({ ...form, mision: v })} type="textarea" className="md:col-span-2" />
            <Field label="Visión:" v={form.vision} onChange={v => setForm({ ...form, vision: v })} type="textarea" className="md:col-span-2" />
          </div>
        </div>

        {/* Configuración Fiscal */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Configuración Fiscal</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <Field label="Dirección del Emisor:" v={form.dir_emisor} onChange={v => setForm({ ...form, dir_emisor: v })} className="md:col-span-2" />
            <Field label="Punto de Emisión:" v={form.punto_emision} onChange={v => setForm({ ...form, punto_emision: v })} />
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-700">IVA %:</label>
              <Field label="" type="number" v={String(form.iva_percent)} onChange={v => setForm({ ...form, iva_percent: Number(v) })} className="w-20" />
            </div>
          </div>
        </div>



        {/* Botones */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar registro
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, v, onChange, type = "text", className = "",
}: { label: string; v: string; onChange: (v: string) => void; type?: string; className?: string }) {
  const fieldClass = `text-sm ${className}`;
  
  if (type === "select") {
    return (
      <label className={fieldClass}>
        <span className="block text-slate-700 font-medium mb-1">{label}</span>
        <select
          value={v}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">Seleccionar...</option>
          <option value="no">No</option>
          <option value="si">Sí</option>
        </select>
      </label>
    );
  }
  
  if (type === "file") {
    return (
      <label className={fieldClass}>
        <span className="block text-slate-700 font-medium mb-1">{label}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
          >
            Seleccionar archivo
          </button>
          <span className="text-sm text-slate-500">Sin archivos seleccionados</span>
        </div>
      </label>
    );
  }
  
  return (
    <label className={fieldClass}>
      <span className="block text-slate-700 font-medium mb-1">{label}</span>
      {type === "textarea" ? (
        <textarea
          value={v}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
      ) : (
        <input
          type={type}
          value={v}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      )}
    </label>
  );
}
