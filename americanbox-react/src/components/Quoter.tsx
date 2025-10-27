import { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, Plus, Trash2 } from "lucide-react";

type Item = { id: number; nombre: string; peso: number; cantidad: number; precioPeso: number };

export default function Quoter() {
  const [items, setItems] = useState<Item[]>([]);
  const [id, setId] = useState(1);

  const add = () => {
    setItems((p) => [...p, { id, nombre: `Producto ${id}`, peso: 1, cantidad: 1, precioPeso: 4.99 }]);
    setId((n) => n + 1);
  };
  const removeAll = () => setItems([]);
  const upd = (rowId: number, patch: Partial<Item>) =>
    setItems((p) => p.map((x) => (x.id === rowId ? { ...x, ...patch } : x)));

  const total = items.reduce((a, it) => a + it.peso * it.cantidad * it.precioPeso, 0);

  return (
    <div className="container-xl py-10">
      <header className="text-center mb-6">
        <div className="mx-auto w-16 h-16 rounded-2xl grid place-items-center bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow">
          <Calculator className="w-8 h-8" />
        </div>
        <h1 className="mt-4 text-3xl md:text-4xl font-extrabold">Cotizador</h1>
        <p className="text-slate-500">Crea paquetes y obtén un estimado al instante.</p>
      </header>

      <div className="bg-white/80 backdrop-blur rounded-2xl border border-slate-200 shadow-lg p-4 md:p-6">
        <div className="flex flex-wrap gap-3 justify-between items-center">
          <div className="flex gap-3">
            <button onClick={add} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[--color-brand] text-slate-900 font-semibold shadow hover:shadow-md">
              <Plus className="w-4 h-4" /> Crear paquete
            </button>
            <button onClick={removeAll} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-600 text-white font-semibold shadow hover:shadow-md">
              <Trash2 className="w-4 h-4" /> Eliminar paquetes
            </button>
          </div>
          <div className="text-sm text-slate-600">
            Total: <span className="font-semibold text-slate-900">${total.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-[720px] w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-sm">
                <th className="px-4 py-3">Eliminar</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Precio por peso</th>
                <th className="px-4 py-3">Cantidad</th>
                <th className="px-4 py-3">Peso</th>
                <th className="px-4 py-3">Precio de envío</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={6}>
                    No hay paquetes. Crea uno con el botón “Crear paquete”.
                  </td>
                </tr>
              )}
              {items.map((it) => {
                const subtotal = it.peso * it.cantidad * it.precioPeso;
                return (
                  <motion.tr key={it.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="border-t">
                    <td className="px-4 py-3">
                      <button onClick={() => setItems((p) => p.filter((x) => x.id !== it.id))} className="text-rose-600 hover:underline">
                        Quitar
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        value={it.nombre}
                        onChange={(e) => upd(it.id, { nombre: e.target.value })}
                        className="w-full bg-transparent outline-none"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={it.precioPeso}
                        onChange={(e) => upd(it.id, { precioPeso: +e.target.value })}
                        className="w-28 bg-transparent outline-none"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={it.cantidad}
                        onChange={(e) => upd(it.id, { cantidad: +e.target.value })}
                        className="w-20 bg-transparent outline-none"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        step="0.01"
                        value={it.peso}
                        onChange={(e) => upd(it.id, { peso: +e.target.value })}
                        className="w-24 bg-transparent outline-none"
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold">${subtotal.toFixed(2)}</td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
