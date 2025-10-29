// src/components/admin/AdminDashboard.tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Menu, Users, Package, Tags, LogOut, Search,
  Home, Settings, FileText, Shield, CreditCard, ClipboardList,
  ChevronDown, ChevronRight, Store, Boxes, AlertTriangle, KeyRound, UserCog, MapPinned
} from "lucide-react";
import { api } from "../../lib/api";
import { useSession } from "../../hooks/useSession";
import AdminCategories from "./AdminCategories";
import AdminCompany from "./AdminCompany";
import AdminProducts from "./AdminProducts";
import AdminProviders from "./AdminProviders";
import AdminCustomers from "./AdminCustomers";
import AdminVouchers from "./AdminVouchers";
import AdminInvoices from "./AdminInvoices";
import AdminCreditNotes from "./AdminCreditNotes";
import AdminAccountsReceivable from "./AdminAccountsReceivable";
import AdminReceiptErrors from "./AdminReceiptErrors";
import AdminBulkOrders from "./AdminBulkOrders";
import AdminAddresses from "./AdminAddresses";
import AdminOrderStatuses from "./AdminOrderStatuses";
import AdminOrders from "./AdminOrders";
import AdminClaims from "./AdminClaims";
import AdminOrderIndicatorReport from "./AdminOrderIndicatorReport";
import AdminPackageReport from "./AdminPackageReport";
import AdminClientReport from "./AdminClientReport";
import AdminSecurityUsers from "./AdminSecurityUsers";
import AdminChangePassword from "./AdminChangePassword";
import AdminEditProfile from "./AdminEditProfile";

// Recharts
import {
  ResponsiveContainer,
  PieChart, Pie, Cell, Tooltip as RTooltip, Legend as RLegend,
  BarChart, CartesianGrid, XAxis, YAxis, Bar,
} from "recharts";

/* ===================== Tipos ===================== */
type AdminStats = {
  customers: number;
  products: number;
  addresses: number;
  categories: number;
  orderStats?: {
    prealerta: number;
    captado: number;
    viajando: number;
    aduana: number;
    esperaPago: number;
    pagoOk: number;
    entregado: number;
    totalOrders: number;
    totalAmount: number;
  };
};

type OrderRow = {
  id: number;
  guide: string;
  client: string;
  address: string;
  date: string;       // ISO
  total: number | string | null; // <- backend puede enviar string
  status: string;
};

type RevenueResp = { ok: boolean; labels: string[]; values: (number | string)[] };
type TopProductsResp = { ok: boolean; labels: string[]; values: (number | string)[] };

/* ===================== Utils ===================== */
const PIE_COLORS = ["#60a5fa", "#475569", "#f59e0b", "#34d399", "#a78bfa", "#ef4444"];

function ymToMes(ym: string) {
  const [, m] = ym.split("-").map(Number);
  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  return m && m >= 1 && m <= 12 ? meses[m - 1] : ym;
}

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function money(v: unknown): string {
  return num(v).toFixed(2);
}

/* ===================== Componente ===================== */
export default function AdminDashboard() {
  const { me, loading } = useSession();

  const location = useLocation();
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState<string>("dashboard");
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    administracion: true,
    facturacion: true,
    paqueteria: true,
    reportes: false,
    seguridad: false,
  });
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [q, setQ] = useState("");

  // charts state
  const [revLabels, setRevLabels] = useState<string[]>([]);
  const [revValues, setRevValues] = useState<number[]>([]);
  const [pieLabels, setPieLabels] = useState<string[]>([]);
  const [pieValues, setPieValues] = useState<number[]>([]);

  /* Guard: solo admin */
  useEffect(() => {
    if (!loading) {
      if (!me?.logged) {
        window.location.href = "/#login";
      } else if (me.role !== "admin") {
        window.location.href = "/client";
      }
    }
  }, [loading, me]);

  /* KPIs y pedidos */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const s = await api<{ ok: boolean; customers: number; products: number; addresses: number; categories: number; orderStats?: any }>("/api/admin/stats");
        const o = await api<{ ok: boolean; orders: OrderRow[] }>("/api/admin/orders?limit=10");

        if (!alive) return;
        if (s?.ok) setStats({ customers: s.customers, products: s.products, addresses: s.addresses, categories: s.categories, orderStats: s.orderStats });
        if (o?.ok) setOrders(o.orders);
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { alive = false; };
  }, []);

  /* Datos de gráficos */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await api<RevenueResp>("/api/admin/revenue/monthly");
        const p = await api<TopProductsResp>("/api/admin/products/top");
        if (!alive) return;

        if (r?.ok) {
          setRevLabels(r.labels);
          setRevValues(r.values.map(v => num(v)));
        }
        if (p?.ok) {
          setPieLabels(p.labels);
          setPieValues(p.values.map(v => num(v)));
        }
      } catch (e) {
        console.error(e);
      }
    })();
    return () => { alive = false; };
  }, []);

  /* Búsqueda en cliente */
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return orders;
    return orders.filter(o =>
      o.guide.toLowerCase().includes(term) ||
      o.client.toLowerCase().includes(term) ||
      o.address.toLowerCase().includes(term) ||
      o.status.toLowerCase().includes(term)
    );
  }, [q, orders]);

  /* Adaptadores recharts */
  const pieData = useMemo(
    () => pieLabels.map((name, i) => ({ name, value: pieValues[i] ?? 0 })),
    [pieLabels, pieValues]
  );
  const barData = useMemo(
    () => revLabels.map((ym, i) => ({ mes: ymToMes(ym), valor: revValues[i] ?? 0 })),
    [revLabels, revValues]
  );

  const toggleMenu = (key: string) => {
    setExpandedMenus(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Sync currentView with URL query param ?view=
  useEffect(() => {
    const sp = new URLSearchParams(location.search);
    const v = sp.get('view') || 'dashboard';
    setCurrentView(v);
  }, [location.search]);

  if (loading || !me?.logged || me.role !== "admin") return null;

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar */}
      <aside className={["bg-slate-900 text-slate-100 transition-all duration-300 ease-in-out", collapsed ? "w-16" : "w-64", "flex flex-col"].join(" ")}>
        <div className="h-14 flex items-center gap-2 px-3 border-b border-white/10">
          <img src="/logo-abox.png" className="h-7" />
          {!collapsed && <span className="font-semibold">American Box</span>}
        </div>

        <nav className="py-3 flex-1 space-y-1 overflow-y-auto">
          <SideItem
            icon={<Home className="w-4 h-4" />}
            text="Inicio"
            collapsed={collapsed}
            active={currentView === "dashboard"}
            onClick={() => navigate('?view=dashboard')}
          />

          {/* Menú con subcategorías: Administración */}
          <div>
            <button
              onClick={() => toggleMenu('administracion')}
              className={[
                "w-full flex items-center gap-3 px-3 py-2 text-left transition",
                "hover:bg-white/10 text-slate-100",
              ].join(" ")}
            >
              <span className="h-8 w-8 grid place-items-center rounded-md bg-white/10">
                <Settings className="w-4 h-4" />
              </span>
              {!collapsed && (
                <>
                  <span className="text-sm flex-1">Administración</span>
                  {expandedMenus.administracion ?
                    <ChevronDown className="w-4 h-4" /> :
                    <ChevronRight className="w-4 h-4" />
                  }
                </>
              )}
            </button>

            {!collapsed && expandedMenus.administracion && (
              <div className="ml-6 mt-1 space-y-1 border-l-2 border-white/10 pl-4">
                <SubMenuItem
                  icon={<Tags className="w-3.5 h-3.5" />}
                  text="Categorías"
                  active={currentView === "categories"}
                  onClick={() => navigate('?view=categories')}
                />
                <SubMenuItem
                  icon={<Store className="w-3.5 h-3.5" />}
                  text="Compañía"
                  active={currentView === "company"}
                  onClick={() => navigate('?view=company')}
                />
                <SubMenuItem
                  icon={<Package className="w-3.5 h-3.5" />}
                  text="Productos"
                  active={currentView === "products"}
                  onClick={() => navigate('?view=products')}
                />
                <SubMenuItem
                  icon={<Boxes className="w-3.5 h-3.5" />}
                  text="Proveedores"
                  active={currentView === "providers"}
                  onClick={() => navigate('?view=providers')}
                />
              </div>
            )}
          </div>

          {/* Menú con subcategorías: Facturación */}
          <div>
            <button
              onClick={() => toggleMenu('facturacion')}
              className={[
                "w-full flex items-center gap-3 px-3 py-2 text-left transition",
                "hover:bg-white/10 text-slate-100",
              ].join(" ")}
            >
              <span className="h-8 w-8 grid place-items-center rounded-md bg-white/10">
                <CreditCard className="w-4 h-4" />
              </span>
              {!collapsed && (
                <>
                  <span className="text-sm flex-1">Facturación</span>
                  {expandedMenus.facturacion ?
                    <ChevronDown className="w-4 h-4" /> :
                    <ChevronRight className="w-4 h-4" />
                  }
                </>
              )}
            </button>

            {!collapsed && expandedMenus.facturacion && (
              <div className="ml-6 mt-1 space-y-1 border-l-2 border-white/10 pl-4">
                <SubMenuItem
                  icon={<Users className="w-3.5 h-3.5" />}
                  text="Clientes"
                  active={currentView === "customers"}
                  onClick={() => navigate('?view=customers')}
                />
                <SubMenuItem
                  icon={<FileText className="w-3.5 h-3.5" />}
                  text="Comprobantes"
                  active={currentView === "vouchers"}
                  onClick={() => navigate('?view=vouchers')}
                />
                <SubMenuItem
                  icon={<CreditCard className="w-3.5 h-3.5" />}
                  text="Facturas"
                  active={currentView === "invoices"}
                  onClick={() => navigate('?view=invoices')}
                />
                <SubMenuItem
                  icon={<FileText className="w-3.5 h-3.5" />}
                  text="Notas de Crédito"
                  active={currentView === "credit_notes"}
                  onClick={() => navigate('?view=credit_notes')}
                />
                <SubMenuItem
                  icon={<ClipboardList className="w-3.5 h-3.5" />}
                  text="Cuentas por cobrar"
                  active={currentView === "accounts_receivable"}
                  onClick={() => navigate('?view=accounts_receivable')}
                />
                <SubMenuItem
                  icon={<Shield className="w-3.5 h-3.5" />}
                  text="Errores de Comprobantes"
                  active={currentView === "receipt_errors"}
                  onClick={() => navigate('?view=receipt_errors')}
                />
              </div>
            )}
          </div>

          {/* Paquetería */}
          <div>
            <button
              onClick={() => toggleMenu("paqueteria")}
              className={[
                "w-full flex items-center gap-3 px-3 py-2 text-left transition",
                "hover:bg-white/10 text-slate-100",
              ].join(" ")}
            >
              <span className="h-8 w-8 grid place-items-center rounded-md bg-white/10">
                <Package className="w-4 h-4" />
              </span>
              {!collapsed && (
                <>
                  <span className="text-sm flex-1">Paquetería</span>
                  {expandedMenus.paqueteria ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </>
              )}
            </button>
            {!collapsed && expandedMenus.paqueteria && (
              <div className="ml-6 mt-1 space-y-1 border-l-2 border-white/10 pl-4">
                <SubMenuItem
                  icon={<ClipboardList className="w-3.5 h-3.5" />}
                  text="Act. masiva de pedidos"
                  active={currentView === "bulk_orders"}
                  onClick={() => navigate("?view=bulk_orders")}
                />
                <SubMenuItem
                  icon={<MapPinned className="w-3.5 h-3.5" />}
                  text="Direcciones"
                  active={currentView === "addresses"}
                  onClick={() => navigate("?view=addresses")}
                />
                <SubMenuItem
                  icon={<ClipboardList className="w-3.5 h-3.5" />}
                  text="Estados de pedidos"
                  active={currentView === "order_statuses"}
                  onClick={() => navigate("?view=order_statuses")}
                />
                <SubMenuItem
                  icon={<Boxes className="w-3.5 h-3.5" />}
                  text="Pedidos"
                  active={currentView === "orders"}
                  onClick={() => navigate("?view=orders")}
                />
                <SubMenuItem
                  icon={<AlertTriangle className="w-3.5 h-3.5" />}
                  text="T. Reclamo"
                  active={currentView === "claims"}
                  onClick={() => navigate("?view=claims")}
                />
              </div>
            )}
          </div>

          {/* Reportes */}
          <div>
            <button
              onClick={() => toggleMenu("reportes")}
              className={[
                "w-full flex items-center gap-3 px-3 py-2 text-left transition",
                "hover:bg-white/10 text-slate-100",
              ].join(" ")}
            >
              <span className="h-8 w-8 grid place-items-center rounded-md bg-white/10">
                <FileText className="w-4 h-4" />
              </span>
              {!collapsed && (
                <>
                  <span className="text-sm flex-1">Reportes</span>
                  {expandedMenus.reportes ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </>
              )}
            </button>
            {!collapsed && expandedMenus.reportes && (
              <div className="ml-6 mt-1 space-y-1 border-l-2 border-white/10 pl-4">
                <SubMenuItem
                  icon={<ClipboardList className="w-3.5 h-3.5" />}
                  text="Indicador de pedidos"
                  active={currentView === "orders_indicator_report"}
                  onClick={() => navigate("?view=orders_indicator_report")}
                />
                <SubMenuItem
                  icon={<Package className="w-3.5 h-3.5" />}
                  text="Paquetes"
                  active={currentView === "packages_report"}
                  onClick={() => navigate("?view=packages_report")}
                />
                <SubMenuItem
                  icon={<Users className="w-3.5 h-3.5" />}
                  text="Reportes por Cliente"
                  active={currentView === "client_report"}
                  onClick={() => navigate("?view=client_report")}
                />
              </div>
            )}
          </div>          {/* Seguridad */}
          <div>
            <button
              onClick={() => toggleMenu("seguridad")}
              className={[
                "w-full flex items-center gap-3 px-3 py-2 text-left transition",
                "hover:bg-white/10 text-slate-100",
              ].join(" ")}
            >
              <span className="h-8 w-8 grid place-items-center rounded-md bg-white/10">
                <Shield className="w-4 h-4" />
              </span>
              {!collapsed && (
                <>
                  <span className="text-sm flex-1">Seguridad</span>
                  {expandedMenus.seguridad ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </>
              )}
            </button>
            {!collapsed && expandedMenus.seguridad && (
              <div className="ml-6 mt-1 space-y-1 border-l-2 border-white/10 pl-4">
                <SubMenuItem
                  icon={<Users className="w-3.5 h-3.5" />}
                  text="Usuarios"
                  active={currentView === "security_users"}
                  onClick={() => navigate("?view=security_users")}
                />
                <SubMenuItem
                  icon={<KeyRound className="w-3.5 h-3.5" />}
                  text="Cambiar password"
                  active={currentView === "change_password"}
                  onClick={() => navigate("?view=change_password")}
                />
                <SubMenuItem
                  icon={<UserCog className="w-3.5 h-3.5" />}
                  text="Editar perfil"
                  active={currentView === "edit_profile"}
                  onClick={() => navigate("?view=edit_profile")}
                />
              </div>
            )}
          </div>
        </nav>

        <div className="px-3 py-3 border-t border-white/10">
          <button
            onClick={async () => {
              await api("/api/logout", { method: "POST" });
              window.location.href = "/#login";
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-2"
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Salir</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-14 bg-orange-500 text-white flex items-center px-3 gap-3 shadow">
          <button
            onClick={() => setCollapsed(s => !s)}
            className="rounded-lg bg-white/10 hover:bg-white/20 p-2"
            title={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="ml-auto flex items-center gap-4">
            <span className="text-white/90 hidden sm:inline">Usuario: {me?.username ?? "admin"}</span>
            <span className="text-white/90 hidden sm:inline">Perfil: Administrador</span>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 md:p-6 space-y-6">
          {currentView === "dashboard" && (
            <>
              {/* KPIs */}
              <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard icon={<Users className="w-6 h-6" />} title="Clientes" value={stats?.customers ?? 0} />
                <KpiCard icon={<Package className="w-6 h-6" />} title="Productos" value={stats?.products ?? 0} />
                <KpiCard icon={<MapPinned className="w-6 h-6" />} title="Direcciones" value={stats?.addresses ?? 0} />
                <KpiCard icon={<Tags className="w-6 h-6" />} title="Categorías" value={stats?.categories ?? 0} />
              </section>

              {/* Estadísticas por Estado de Paquetes */}
              {stats?.orderStats && (
                <section className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <h2 className="text-lg font-semibold mb-4 text-slate-800">Estado de Paquetes</h2>
                  
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-4 rounded-lg">
                      <div className="text-2xl font-bold">{stats.orderStats.prealerta}</div>
                      <div className="text-yellow-100 text-sm">Pre Alerta</div>
                    </div>
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                      <div className="text-2xl font-bold">{stats.orderStats.captado}</div>
                      <div className="text-blue-100 text-sm">Captado en Agencia</div>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
                      <div className="text-2xl font-bold">{stats.orderStats.viajando}</div>
                      <div className="text-purple-100 text-sm">Despachado</div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
                      <div className="text-2xl font-bold">{stats.orderStats.aduana}</div>
                      <div className="text-orange-100 text-sm">En Aduana</div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 rounded-lg">
                      <div className="text-2xl font-bold">{stats.orderStats.esperaPago}</div>
                      <div className="text-red-100 text-sm">En Espera de Pago</div>
                    </div>
                    <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
                      <div className="text-2xl font-bold">{stats.orderStats.pagoOk}</div>
                      <div className="text-green-100 text-sm">Pago Aprobado</div>
                    </div>
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white p-4 rounded-lg">
                      <div className="text-2xl font-bold">{stats.orderStats.entregado}</div>
                      <div className="text-emerald-100 text-sm">Entregado</div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="font-medium">Total de Paquetes:</span>
                      <span className="text-xl font-bold text-slate-800">{stats.orderStats.totalOrders}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600 mt-2">
                      <span className="font-medium">Monto Total:</span>
                      <span className="text-xl font-bold text-emerald-600">${money(stats.orderStats.totalAmount)}</span>
                    </div>
                  </div>
                </section>
              )}

              {/* Últimos pedidos */}
              <section className="rounded-2xl bg-white shadow-sm border border-slate-200">
                <div className="p-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Los últimos 10 pedidos</h2>

                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      placeholder="Buscar por guía, cliente, estado..."
                      className="pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                </div>

                <div className="border-t border-slate-200 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <Th># Guía</Th>
                        <Th>Cliente</Th>
                        <Th>Dirección</Th>
                        <Th>Fecha de registro</Th>
                        <Th>Total</Th>
                        <Th>Estado</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 && (
                        <tr className="border-t">
                          <Td colSpan={6}><div className="py-8 text-center text-slate-500">No hay datos.</div></Td>
                        </tr>
                      )}
                      {filtered.map((o) => (
                        <tr key={o.id} className="border-t hover:bg-slate-50">
                          <Td className="font-medium">{o.guide}</Td>
                          <Td>{o.client}</Td>
                          <Td className="whitespace-nowrap">{o.address}</Td>
                          <Td className="whitespace-nowrap">{o.date}</Td>
                          <Td>${money(o.total)}</Td>
                          <Td className="whitespace-nowrap">{o.status}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Gráficos */}
              <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pie */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                  <h3 className="text-lg font-semibold mb-3">Los productos más enviados en pedidos</h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={110}>
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="#fff" strokeWidth={2} />
                        ))}
                      </Pie>
                      <RTooltip formatter={(v: unknown) => `${num(v)} envíos`} />
                      <RLegend />
                    </PieChart>
                  </ResponsiveContainer>
                  {pieData.length === 0 && <div className="text-sm text-slate-500 mt-3">Sin datos para mostrar.</div>}
                </div>

                {/* Barras */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4">
                  <h3 className="text-lg font-semibold mb-3">Recaudación por mes</h3>
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={barData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis />
                      <RTooltip formatter={(v: unknown) => `$${money(v)}`} />
                      <RLegend />
                      <Bar dataKey="valor" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                  {barData.length === 0 && <div className="text-sm text-slate-500 mt-3">Sin datos para mostrar.</div>}
                </div>
              </section>
            </>
          )}

          {/* Vistas de administración */}
          {currentView === "categories" && <AdminCategories />}
          {currentView === "company" && <AdminCompany />}
          {currentView === "products" && <AdminProducts />}
          {currentView === "providers" && <AdminProviders />}

          {/* Facturación */}
          {currentView === "customers" && <AdminCustomers />}
          {currentView === "vouchers" && <AdminVouchers />}
          {currentView === "invoices" && <AdminInvoices />}
          {currentView === "credit_notes" && <AdminCreditNotes />}
          {currentView === "accounts_receivable" && <AdminAccountsReceivable />}
          {currentView === "receipt_errors" && <AdminReceiptErrors />}

          {/* Paquetería */}
          {currentView === "bulk_orders" && <AdminBulkOrders />}
          {currentView === "addresses" && <AdminAddresses />}
          {currentView === "order_statuses" && <AdminOrderStatuses />}
          {currentView === "orders" && <AdminOrders />}
          {currentView === "claims" && <AdminClaims />}

          {/* Reportes */}
          {currentView === "orders_indicator_report" && <AdminOrderIndicatorReport />}
          {currentView === "packages_report" && <AdminPackageReport />}
          {currentView === "client_report" && <AdminClientReport />}

          {/* Seguridad */}
          {currentView === "security_users" && <AdminSecurityUsers />}
          {currentView === "change_password" && <AdminChangePassword />}
          {currentView === "edit_profile" && <AdminEditProfile />}
        </main>
      </div>
    </div>
  );
}

/* ===================== Subcomponentes ===================== */
function SideItem({
  icon,
  text,
  collapsed,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  text: string;
  collapsed: boolean;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full flex items-center gap-3 px-3 py-2 text-left transition",
        active ? "bg-white/10" : "hover:bg-white/10",
        "text-slate-100",
      ].join(" ")}
    >
      <span className={["h-8 w-8 grid place-items-center rounded-md", active ? "bg-white/20" : "bg-white/10"].join(" ")}>
        {icon}
      </span>
      {!collapsed && <span className="text-sm">{text}</span>}
    </button>
  );
}

function SubMenuItem({
  icon,
  text,
  active = false,
  onClick,
}: {
  icon: React.ReactNode;
  text: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full flex items-center gap-2 px-2 py-1.5 text-left transition rounded-md text-sm",
        active ? "bg-white/20 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white",
      ].join(" ")}
    >
      <span className="opacity-80">{icon}</span>
      <span>{text}</span>
    </button>
  );
}

function KpiCard({ icon, title, value }: { icon: React.ReactNode; title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 flex items-center gap-4 shadow-sm">
      <div className="h-12 w-12 grid place-items-center rounded-xl bg-amber-100 text-amber-700">
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500">{title}</p>
        <p className="text-2xl font-extrabold">{value}</p>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 text-left font-semibold">{children}</th>;
}

function Td({ children, className = "", colSpan }: { children: React.ReactNode; className?: string; colSpan?: number }) {
  return <td colSpan={colSpan} className={["px-3 py-2 align-middle text-slate-700", className].join(" ")}>{children}</td>;
}








