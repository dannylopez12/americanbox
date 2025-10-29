import { useState } from "react";
import { Building2, Tags, Package, Grid3X3 } from "lucide-react";
import AdminProviders from "./AdminProviders";
import AdminCategories from "./AdminCategories";

export default function AdminConfiguration() {
  const [activeTab, setActiveTab] = useState<'providers' | 'categories'>('providers');

  return (
    <div className="space-y-6">
      {/* Header unificado con tabs */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Grid3X3 className="w-8 h-8" />
          <h1 className="text-2xl font-bold">Configuración del Sistema</h1>
        </div>
        <p className="text-indigo-100 mb-6">Administra proveedores y categorías para una mejor organización</p>
        
        {/* Tabs profesionales */}
        <div className="flex space-x-1 bg-white/10 rounded-lg p-1 backdrop-blur-sm">
          <button
            onClick={() => setActiveTab('providers')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'providers'
                ? 'bg-white text-indigo-600 shadow-md'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Proveedores
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              activeTab === 'categories'
                ? 'bg-white text-indigo-600 shadow-md'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Tags className="w-4 h-4" />
            Categorías
          </button>
        </div>
      </div>

      {/* Contenido dinámico */}
      <div className="transition-all duration-300">
        {activeTab === 'providers' && <AdminProviders />}
        {activeTab === 'categories' && <AdminCategories />}
      </div>

      {/* Stats footer */}
      <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <Package className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Gestión Activa</p>
              <p className="text-lg font-semibold text-slate-900">Sistema Organizado</p>
            </div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full flex items-center justify-center">
              <Grid3X3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Configuración</p>
              <p className="text-lg font-semibold text-slate-900">Datos Estructurados</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}