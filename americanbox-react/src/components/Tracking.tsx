import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Package, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { api } from "../lib/api";

type TrackingHistory = {
  fecha: string;
  estado: string;
  detalle: string;
  completed: boolean;
};

type TrackingResult = {
  guide: string;
  status: string;
  customer_name: string;
  address: string;
  total: number;
  created_date: string;
  history: TrackingHistory[];
};

export default function Tracking() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState<TrackingResult | null>(null);
  const [error, setError] = useState<string>("");

  const buscar = async () => {
    if (!query.trim()) {
      setError("Por favor ingresa un número de guía");
      return;
    }

    setLoading(true);
    setError("");
    setTrackingResult(null);

    try {
      const response = await api<{ ok: boolean; tracking?: TrackingResult; error?: string }>(`/api/tracking/${encodeURIComponent(query.trim())}`);
      
      if (response?.ok && response.tracking) {
        setTrackingResult(response.tracking);
      } else {
        setError(response?.error || "No se encontró información para esta guía");
      }
    } catch (error) {
      console.error('Error searching tracking:', error);
      setError("Error al buscar la información. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      buscar();
    }
  };

  const getStatusIcon = (status: string, completed: boolean) => {
    if (!completed) {
      return <Clock className="w-4 h-4 text-slate-400" />;
    }
    
    switch (status) {
      case 'Entregado':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'En espera de pago':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Package className="w-4 h-4 text-blue-500" />;
    }
  };

  const getStatusColor = (status: string, completed: boolean) => {
    if (!completed) {
      return "bg-slate-100 text-slate-600";
    }
    
    switch (status) {
      case 'Pre alerta':
        return "bg-blue-100 text-blue-700";
      case 'Captado en agencia':
        return "bg-purple-100 text-purple-700";
      case 'Despachado':
        return "bg-indigo-100 text-indigo-700";
      case 'En aduana':
        return "bg-orange-100 text-orange-700";
      case 'En espera de pago':
        return "bg-yellow-100 text-yellow-700";
      case 'Pago aprobado':
        return "bg-emerald-100 text-emerald-700";
      case 'Entregado':
        return "bg-green-100 text-green-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div className="container-xl py-10">
      <header className="text-center mb-6">
        <div className="mx-auto w-16 h-16 rounded-2xl grid place-items-center bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow">
          <Search className="w-8 h-8" />
        </div>
        <h1 className="mt-4 text-3xl md:text-4xl font-extrabold">Tracking</h1>
        <p className="text-slate-500">Consulta el estado de tu envío.</p>
      </header>

      <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-lg p-4 md:p-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ingresa el número de guía (ej: ECABC20250002)"
              className="w-full rounded-xl border border-slate-200 bg-white/70 py-3 pl-11 pr-4 outline-none focus:ring-2 focus:ring-amber-400"
              disabled={loading}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          </div>
          <button
            onClick={buscar}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[--color-brand] text-slate-900 font-semibold shadow hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Search className="w-4 h-4" /> 
            {loading ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Tracking Result Summary */}
        {trackingResult && (
          <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-xl">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Información del Pedido</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-blue-600 font-medium">Número de Guía:</span>
                <p className="font-semibold text-blue-900">{trackingResult.guide}</p>
              </div>
              <div>
                <span className="text-sm text-blue-600 font-medium">Cliente:</span>
                <p className="font-semibold text-blue-900">{trackingResult.customer_name}</p>
              </div>
              <div>
                <span className="text-sm text-blue-600 font-medium">Dirección:</span>
                <p className="font-semibold text-blue-900">{trackingResult.address}</p>
              </div>
              <div>
                <span className="text-sm text-blue-600 font-medium">Total:</span>
                <p className="font-semibold text-blue-900">${Number(trackingResult.total).toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tracking History */}
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-sm">
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Detalles</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {loading && (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <td className="px-4 py-5 text-slate-500" colSpan={3}>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin"></div>
                        Consultando información...
                      </div>
                    </td>
                  </motion.tr>
                )}
                {!loading && !trackingResult && !error && (
                  <tr>
                    <td className="px-4 py-6 text-center text-slate-500" colSpan={3}>
                      <div className="flex flex-col items-center gap-2">
                        <Package className="w-8 h-8 text-slate-300" />
                        <span>Ingresa un número de guía para consultar el estado de tu pedido</span>
                      </div>
                    </td>
                  </tr>
                )}
                {!loading && trackingResult &&
                  trackingResult.history.map((historyItem, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`border-t ${historyItem.completed ? 'bg-white' : 'bg-slate-50'}`}
                    >
                      <td className="px-4 py-3 font-medium">
                        {historyItem.fecha}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(historyItem.estado, historyItem.completed)}`}>
                          {getStatusIcon(historyItem.estado, historyItem.completed)}
                          {historyItem.estado}
                        </span>
                      </td>
                      <td className={`px-4 py-3 ${historyItem.completed ? 'text-slate-700' : 'text-slate-500'}`}>
                        {historyItem.detalle}
                        {!historyItem.completed && <span className="text-xs ml-2">(Pendiente)</span>}
                      </td>
                    </motion.tr>
                  ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
