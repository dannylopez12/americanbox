// src/components/ClientDashboard.tsx
import { useEffect, useState, useCallback } from "react";
import {
  Package,
  FileText,
  MapPin,
  CreditCard,
  Settings,
  LogOut,
  Truck,
  User,
  Calculator,
  ClipboardList,
  HelpCircle,
  Search,
  Menu,
  X,
  Eye,
  RefreshCw,
  Lock,
  Edit,
  Phone,
  Mail,
  Calendar,
  MapPin as LocationIcon,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { api } from "../lib/api";

type MeResponse = {
  logged: boolean;
  role?: "admin" | "customer";
  username?: string | null;
  customer_id?: number | null;
};

type ClientStats = {
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

type Order = {
  id: number;
  guide: string;
  address: string;
  date: string;
  total: number;
  status: string;
};

type TrackingOrder = {
  id: number;
  guide: string;
  status: string;
  total: number;
  created_date: string;
  full_address: string;
  customer_name: string;
  phone: string;
  email: string;
};

type ClientProfile = {
  id: number;
  username: string;
  customer_id: number;
  names: string;
  email: string;
  phone: string;
  identification: string;
  member_since: string;
  addresses: Array<{
    id: number;
    address: string;
    city: string;
    state: string;
    zip_code: string;
  }>;
};

const emptyStats: ClientStats = {
  prealerta: 0,
  captado: 0,
  viajando: 0,
  aduana: 0,
  esperaPago: 0,
  pagoOk: 0,
  entregado: 0,
  totalOrders: 0,
  totalAmount: 0,
};

export default function ClientDashboard() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [stats, setStats] = useState<ClientStats>(emptyStats);
  const [orders, setOrders] = useState<Order[]>([]);
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [trackingGuide, setTrackingGuide] = useState('');
  const [trackingResult, setTrackingResult] = useState<TrackingOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'orders' | 'tracking' | 'profile' | 'change-password'>('dashboard');
  
  // Estados para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Sidebar overlay SIEMPRE controlado por el botón (PC y móvil)
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const m = await api<MeResponse>("/api/auth/me", { method: "GET" });
      if (!mounted) return;
      setMe(m);
      setSum(emptySummary); // TODO: reemplazar por GET /api/packages/summary
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Guard sencillo: si no hay sesión, manda al login
  if (!loading && !me?.logged) {
    window.location.href = "/#login";
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Topbar */}
      <header className="sticky top-0 z-40 bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow">
        <div className="container-xl py-3 flex items-center gap-4">
          {/* Botón hamburguesa SIEMPRE visible */}
          <button
            className="inline-flex items-center justify-center rounded-lg p-2 hover:bg-white/10"
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menú"
          >
            <Menu className="w-6 h-6" />
          </button>

          <img src="/logo-abox.png" className="h-8" alt="American Box" />
          <span className="font-semibold">Courier</span>

          <div className="ml-auto flex items-center gap-4">
            <span className="hidden sm:inline text-white/90">
              <User className="inline w-4 h-4 mr-1" />
              {me?.username ?? "Usuario"}
            </span>
            <button
              onClick={async () => {
                await api("/api/logout", { method: "POST" });
                window.location.href = "/#login";
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 hover:bg-white/20 transition"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Backdrop cuando el menú está abierto */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar overlay — aparece encima, NO reserva espacio a la izquierda */}
      <aside
        className={[
          "fixed top-0 left-0 h-full w-72 z-50",
          "bg-white shadow-xl border-r border-slate-200",
          "transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
          "flex flex-col",
        ].join(" ")}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-amber-100 grid place-items-center">
              <User className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold">{me?.username ?? "Cliente"}</p>
              <p className="text-xs text-slate-500">Perfil: Cliente</p>
            </div>
          </div>
          <button
            className="rounded-lg p-2 hover:bg-slate-100"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto">
          <Item icon={<Settings />} label="Cambiar password" />
          <Item icon={<Calculator />} label="Cotizador" />
          <Item icon={<User />} label="Editar perfil" />
          <Item icon={<CreditCard />} label="Facturas" />
          <Item icon={<MapPin />} label="Mis direcciones" />
          <Item icon={<ClipboardList />} label="Mis pedidos" />
          <Item icon={<FileText />} label="Notas de Crédito" />
          <Item icon={<HelpCircle />} label="T.Reclamo" />
          <Item icon={<Search />} active label="Tracking de pedidos" />
        </nav>
      </aside>

      {/* Contenido — SIEMPRE full width; “sube” porque el sidebar no ocupa columnas */}
      <main className="container-xl py-6 space-y-6">
        {/* Resumen de estados */}
        <section>
          <h2 className="text-lg font-semibold mb-3">Resumen de envíos</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <StatusCard title="Pre alerta, llega a bodega" count={sum.prealerta} />
            <StatusCard title="Captado en agencia - listo para viajar" count={sum.captado} />
            <StatusCard title="Despachado - viajando" count={sum.viajando} />
            <StatusCard title="En aduana - proceso de aduana" count={sum.aduana} />
            <StatusCard title="En espera de pago" count={sum.esperaPago} />
            <StatusCard title="Pago aprobado - coordinando entrega" count={sum.pagoOk} />
            <StatusCard title="Entregado" highlight count={sum.entregado} />
          </div>
        </section>

        {/* Tabla tracking */}
        <section className="rounded-2xl bg-white shadow-sm border border-slate-200">
          <div className="p-4 flex items-center justify-between">
            <h3 className="font-semibold">Tracking de pedidos</h3>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Buscar por guía, proveedor…"
                className="pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
          <div className="border-t border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <Th>Id</Th>
                    <Th>Pedido</Th>
                    <Th>Cliente</Th>
                    <Th>Fecha de registro</Th>
                    <Th>Descripción</Th>
                    <Th className="text-right pr-4">Acciones</Th>
                  </tr>
                </thead>
                <tbody>
                  {/* fila placeholder; reemplaza con data real */}
                  <tr className="border-t">
                    <Td>—</Td>
                    <Td>—</Td>
                    <Td>—</Td>
                    <Td>—</Td>
                    <Td>Sin datos</Td>
                    <Td className="text-right pr-4">
                      <button className="inline-flex items-center gap-1 text-amber-600 hover:underline">
                        <Truck className="w-4 h-4" /> Ver detalle
                      </button>
                    </Td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="p-4">
              <div className="rounded-lg bg-slate-50 p-4 text-slate-500 text-sm">
                No hay registros aún. Cuando registres paquetes aparecerán aquí.
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function Item({
  icon,
  label,
  active = false,
}: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={[
        "w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left transition",
        active ? "bg-amber-50 text-amber-700" : "hover:bg-slate-100 text-slate-700",
      ].join(" ")}
    >
      <span className="h-8 w-8 grid place-items-center rounded-lg bg-slate-100">
        {icon}
      </span>
      <span className="text-sm">{label}</span>
    </button>
  );
}

function StatusCard({
  title,
  count,
  highlight = false,
}: {
  title: string;
  count: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-2xl border shadow-sm p-4 flex items-center gap-4",
        highlight ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white",
      ].join(" ")}
    >
      <div
        className={[
          "h-12 w-12 grid place-items-center rounded-xl",
          highlight ? "bg-emerald-100" : "bg-amber-100",
        ].join(" ")}
      >
        <Package
          className={["w-6 h-6", highlight ? "text-emerald-700" : "text-amber-700"].join(" ")}
        />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <p className="text-2xl font-extrabold">{count}</p>
      </div>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={["px-3 py-2 text-left font-semibold", className].join(" ")}>{children}</th>;
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={["px-3 py-2 align-middle text-slate-700", className].join(" ")}>{children}</td>;
}
