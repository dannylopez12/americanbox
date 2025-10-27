// src/components/ClientDashboard.tsx
import { useEffect, useState } from "react";
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
  Calendar,
  MapPin as LocationIcon,
  TrendingUp,
  Clock,
  CheckCircle,
  Save,
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
  const [activeSection, setActiveSection] = useState<'dashboard' | 'orders' | 'tracking' | 'profile' | 'change-password' | 'complaints'>('dashboard');
  
  // Estados para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Estado del sidebar
  const [open, setOpen] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    loadMe();
  }, []);

  const loadMe = async () => {
    try {
      const response = await api<MeResponse>('/api/auth/me');
      if (response?.logged && response.role === 'customer') {
        setMe(response);
        loadClientStats();
        loadClientOrders();
        loadClientProfile();
      } else {
        window.location.href = '/#login';
      }
    } catch (error) {
      console.error('Error loading user:', error);
      window.location.href = '/#login';
    }
  };

  const loadClientStats = async () => {
    try {
      const response = await api<{ ok: boolean; stats: ClientStats }>('/api/client/stats');
      if (response?.ok) {
        setStats(response.stats);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadClientOrders = async () => {
    try {
      setLoading(true);
      const response = await api<{ ok: boolean; orders: Order[] }>('/api/client/orders?limit=5');
      if (response?.ok) {
        setOrders(response.orders);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClientProfile = async () => {
    try {
      const response = await api<{ ok: boolean; profile: ClientProfile }>('/api/client/profile');
      if (response?.ok) {
        setProfile(response.profile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleTracking = async () => {
    if (!trackingGuide.trim()) return;
    
    try {
      setLoading(true);
      const response = await api<{ ok: boolean; order: TrackingOrder }>(`/api/client/tracking/${trackingGuide}`);
      if (response?.ok) {
        setTrackingResult(response.order);
      } else {
        setTrackingResult(null);
        alert('No se encontró el pedido con esa guía');
      }
    } catch (error) {
      console.error('Error tracking order:', error);
      setTrackingResult(null);
      alert('Error buscando el pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Las contraseñas no coinciden' });
      return;
    }

    try {
      setPasswordLoading(true);
      setPasswordMessage(null);
      
      const response = await api('/api/client/change-password', {
        method: 'PUT',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });

      if (response?.ok) {
        setPasswordMessage({ type: 'success', text: 'Contraseña cambiada exitosamente' });
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setPasswordMessage({ type: 'error', text: response?.error || 'Error cambiando contraseña' });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordMessage({ type: 'error', text: 'Error cambiando contraseña' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      const response = await api('/api/client/profile', {
        method: 'PUT',
        body: JSON.stringify({
          names: profile.names,
          email: profile.email,
          phone: profile.phone,
          identification: profile.identification
        })
      });

      if (response?.ok) {
        alert('Perfil actualizado exitosamente');
      } else {
        alert('Error actualizando perfil');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error actualizando perfil');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pre alerta': return 'bg-blue-100 text-blue-800';
      case 'captado en agencia': return 'bg-purple-100 text-purple-800';
      case 'despachado': return 'bg-yellow-100 text-yellow-800';
      case 'en aduana': return 'bg-orange-100 text-orange-800';
      case 'en espera de pago': return 'bg-red-100 text-red-800';
      case 'pago aprobado': return 'bg-green-100 text-green-800';
      case 'entregado': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!me) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-slate-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 hover:bg-slate-100 transition"
              onClick={() => setOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-slate-800">AmericanBox - Cliente</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-slate-600">
              <User className="w-4 h-4" />
              <span>{me.username}</span>
            </div>
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

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
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
            <div className="h-10 w-10 rounded-full bg-blue-100 grid place-items-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold">{me?.username ?? "Cliente"}</p>
              <p className="text-xs text-slate-500">Dashboard Cliente</p>
            </div>
          </div>
          <button
            className="rounded-lg p-2 hover:bg-slate-100"
            onClick={() => setOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto">
          <NavItem 
            icon={<TrendingUp />} 
            label="Dashboard" 
            active={activeSection === 'dashboard'}
            onClick={() => { setActiveSection('dashboard'); setOpen(false); }}
          />
          <NavItem 
            icon={<Package />} 
            label="Mis Pedidos" 
            active={activeSection === 'orders'}
            onClick={() => { setActiveSection('orders'); setOpen(false); }}
          />
          <NavItem 
            icon={<Search />} 
            label="Tracking" 
            active={activeSection === 'tracking'}
            onClick={() => { setActiveSection('tracking'); setOpen(false); }}
          />
          <NavItem 
            icon={<User />} 
            label="Mi Perfil" 
            active={activeSection === 'profile'}
            onClick={() => { setActiveSection('profile'); setOpen(false); }}
          />
          <NavItem 
            icon={<Lock />} 
            label="Cambiar Contraseña" 
            active={activeSection === 'change-password'}
            onClick={() => { setActiveSection('change-password'); setOpen(false); }}
          />
          <NavItem 
            icon={<HelpCircle />} 
            label="Quejas y Sugerencias" 
            active={activeSection === 'complaints'}
            onClick={() => { setActiveSection('complaints'); setOpen(false); }}
          />
        </nav>
      </aside>

      {/* Main Content */}
      <main className="p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          {activeSection === 'dashboard' && (
            <DashboardSection stats={stats} orders={orders} loading={loading} getStatusColor={getStatusColor} />
          )}
          {activeSection === 'orders' && (
            <OrdersSection orders={orders} loading={loading} getStatusColor={getStatusColor} />
          )}
          {activeSection === 'tracking' && (
            <TrackingSection 
              trackingGuide={trackingGuide}
              setTrackingGuide={setTrackingGuide}
              trackingResult={trackingResult}
              handleTracking={handleTracking}
              loading={loading}
              getStatusColor={getStatusColor}
            />
          )}
          {activeSection === 'profile' && profile && (
            <ProfileSection 
              profile={profile}
              setProfile={setProfile}
              handleUpdateProfile={handleUpdateProfile}
              loading={loading}
            />
          )}
          {activeSection === 'change-password' && (
            <ChangePasswordSection 
              passwordData={passwordData}
              setPasswordData={setPasswordData}
              handleChangePassword={handleChangePassword}
              passwordLoading={passwordLoading}
              passwordMessage={passwordMessage}
            />
          )}
          {activeSection === 'complaints' && (
            <ComplaintsSection />
          )}
        </div>
      </main>
    </div>
  );
}

// Componentes auxiliares

function NavItem({ 
  icon, 
  label, 
  active = false, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
        active 
          ? "bg-blue-50 text-blue-700 font-medium" 
          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
      ].join(" ")}
    >
      <span className="text-current opacity-70">{icon}</span>
      <span className="text-sm">{label}</span>
    </button>
  );
}

function DashboardSection({ 
  stats, 
  orders, 
  loading, 
  getStatusColor 
}: { 
  stats: ClientStats; 
  orders: Order[]; 
  loading: boolean;
  getStatusColor: (status: string) => string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Mi Dashboard</h2>
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <Calendar className="w-4 h-4" />
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Pedidos" value={stats.totalOrders || 0} icon={<Package />} color="blue" />
        <StatsCard title="En Proceso" value={(stats.prealerta || 0) + (stats.captado || 0) + (stats.viajando || 0) + (stats.aduana || 0)} icon={<Clock />} color="yellow" />
        <StatsCard title="Entregados" value={stats.entregado || 0} icon={<CheckCircle />} color="green" />
        <StatsCard title="Total Gastado" value={`$${Number(stats.totalAmount || 0).toFixed(2)}`} icon={<CreditCard />} color="purple" />
      </div>

      {/* Estados detallados */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Estado de mis Pedidos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard title="Pre Alerta" count={stats.prealerta} />
          <StatusCard title="Captado" count={stats.captado} />
          <StatusCard title="Despachado" count={stats.viajando} />
          <StatusCard title="En Aduana" count={stats.aduana} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <StatusCard title="Esperando Pago" count={stats.esperaPago} />
          <StatusCard title="Pago Aprobado" count={stats.pagoOk} />
          <StatusCard title="Entregado" count={stats.entregado} highlight />
        </div>
      </div>

      {/* Pedidos recientes */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Pedidos Recientes</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <Th>Guía</Th>
                  <Th>Fecha</Th>
                  <Th>Estado</Th>
                  <Th>Total</Th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-100">
                    <Td className="font-medium">{order.guide}</Td>
                    <Td>{order.date}</Td>
                    <Td>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </Td>
                    <Td className="font-semibold">${Number(order.total || 0).toFixed(2)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-slate-500 py-8">No tienes pedidos aún</p>
        )}
      </div>
    </div>
  );
}

function OrdersSection({ 
  orders, 
  loading, 
  getStatusColor 
}: { 
  orders: Order[]; 
  loading: boolean;
  getStatusColor: (status: string) => string;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Mis Pedidos</h2>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <Th>Guía</Th>
                  <Th>Dirección</Th>
                  <Th>Fecha</Th>
                  <Th>Estado</Th>
                  <Th>Total</Th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-slate-100">
                    <Td className="font-medium">{order.guide}</Td>
                    <Td>{order.address}</Td>
                    <Td>{order.date}</Td>
                    <Td>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </Td>
                    <Td className="font-semibold">${Number(order.total || 0).toFixed(2)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-slate-500 py-8">No tienes pedidos aún</p>
        )}
      </div>
    </div>
  );
}

function TrackingSection({ 
  trackingGuide, 
  setTrackingGuide, 
  trackingResult, 
  handleTracking, 
  loading,
  getStatusColor 
}: {
  trackingGuide: string;
  setTrackingGuide: (guide: string) => void;
  trackingResult: TrackingOrder | null;
  handleTracking: () => void;
  loading: boolean;
  getStatusColor: (status: string) => string;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Tracking de Pedidos</h2>
      
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="max-w-md mx-auto space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Número de Guía
            </label>
            <input
              type="text"
              value={trackingGuide}
              onChange={(e) => setTrackingGuide(e.target.value)}
              placeholder="Ingresa tu número de guía"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={handleTracking}
            disabled={loading || !trackingGuide.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Buscar Pedido
          </button>
        </div>

        {trackingResult && (
          <div className="mt-8 border-t border-slate-200 pt-6">
            <h3 className="text-lg font-semibold mb-4">Información del Pedido</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-slate-700 mb-2">Detalles del Pedido</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Guía:</span>
                    <span className="font-medium">{trackingResult.guide}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Estado:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(trackingResult.status)}`}>
                      {trackingResult.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total:</span>
                    <span className="font-medium">${Number(trackingResult.total || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Fecha:</span>
                    <span className="font-medium">{trackingResult.created_date}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-slate-700 mb-2">Información de Entrega</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Cliente:</span>
                    <span className="font-medium">{trackingResult.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Dirección:</span>
                    <span className="font-medium text-right">{trackingResult.full_address}</span>
                  </div>
                  {trackingResult.phone && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Teléfono:</span>
                      <span className="font-medium">{trackingResult.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileSection({ 
  profile, 
  setProfile, 
  handleUpdateProfile, 
  loading 
}: {
  profile: ClientProfile;
  setProfile: (profile: ClientProfile) => void;
  handleUpdateProfile: () => void;
  loading: boolean;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Mi Perfil</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información Personal */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Información Personal</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre Completo
              </label>
              <input
                type="text"
                value={profile.names}
                onChange={(e) => setProfile({ ...profile, names: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Identificación
              </label>
              <input
                type="text"
                value={profile.identification}
                onChange={(e) => setProfile({ ...profile, identification: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleUpdateProfile}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar Cambios
            </button>
          </div>
        </div>

        {/* Información de la Cuenta */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold mb-4">Información de la Cuenta</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <User className="w-5 h-5 text-slate-600" />
              <div>
                <p className="font-medium">{profile.username}</p>
                <p className="text-xs text-slate-600">Nombre de usuario</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <Calendar className="w-5 h-5 text-slate-600" />
              <div>
                <p className="font-medium">{profile.member_since}</p>
                <p className="text-xs text-slate-600">Miembro desde</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
              <CreditCard className="w-5 h-5 text-slate-600" />
              <div>
                <p className="font-medium">ID: {profile.customer_id}</p>
                <p className="text-xs text-slate-600">ID de cliente</p>
              </div>
            </div>
          </div>

          {/* Direcciones */}
          {profile.addresses.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium text-slate-700 mb-2">Mis Direcciones</h4>
              <div className="space-y-2">
                {profile.addresses.map((address) => (
                  <div key={address.id} className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <LocationIcon className="w-4 h-4 text-slate-600 mt-1 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium">{address.address}</p>
                        <p className="text-slate-600">{address.city}, {address.state} {address.zip_code}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChangePasswordSection({ 
  passwordData, 
  setPasswordData, 
  handleChangePassword, 
  passwordLoading, 
  passwordMessage 
}: {
  passwordData: { currentPassword: string; newPassword: string; confirmPassword: string };
  setPasswordData: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) => void;
  handleChangePassword: () => void;
  passwordLoading: boolean;
  passwordMessage: { type: 'success' | 'error'; text: string } | null;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Cambiar Contraseña</h2>
      
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Contraseña Actual
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Confirmar Nueva Contraseña
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            {passwordMessage && (
              <div className={`p-3 rounded-lg ${passwordMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {passwordMessage.text}
              </div>
            )}
            
            <button
              onClick={handleChangePassword}
              disabled={passwordLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2"
            >
              {passwordLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Lock className="w-4 h-4" />
              )}
              Cambiar Contraseña
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ 
  title, 
  value, 
  icon, 
  color = 'blue' 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
  };

  return (
    <div className={`rounded-2xl border p-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="flex items-center gap-3">
        <div className="text-current opacity-70">{icon}</div>
        <div>
          <p className="text-sm font-medium opacity-70">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
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
        "rounded-xl border shadow-sm p-4 flex items-center gap-3",
        highlight ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white",
      ].join(" ")}
    >
      <div
        className={[
          "h-10 w-10 grid place-items-center rounded-lg",
          highlight ? "bg-emerald-100" : "bg-blue-100",
        ].join(" ")}
      >
        <Package
          className={["w-5 h-5", highlight ? "text-emerald-700" : "text-blue-700"].join(" ")}
        />
      </div>
      <div>
        <p className="text-sm font-medium text-slate-600">{title}</p>
        <p className="text-xl font-bold">{count}</p>
      </div>
    </div>
  );
}

function Th({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <th className={["px-3 py-3 text-left font-semibold text-slate-600 border-b border-slate-200", className].join(" ")}>{children}</th>;
}

// Tipos para quejas
type Complaint = {
  id: number;
  subject: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  admin_response?: string;
  created_at: string;
  updated_at?: string;
  order_guide?: string;
  admin_name?: string;
};

type ComplaintForm = {
  subject: string;
  message: string;
  order_id?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
};

function ComplaintsSection() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<ComplaintForm>({
    subject: '',
    message: '',
    priority: 'medium'
  });
  const [submitLoading, setSubmitLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cargar quejas al montar el componente
  useEffect(() => {
    loadComplaints();
  }, []);

  const loadComplaints = async () => {
    setLoading(true);
    try {
      const response = await api<{
        ok: boolean;
        items: Complaint[];
        total: number;
      }>('/api/client/complaints');
      
      if (response?.ok) {
        setComplaints(response.items || []);
      }
    } catch (error) {
      console.error('Error loading complaints:', error);
      setMessage({ type: 'error', text: 'Error al cargar las quejas' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim() || !formData.message.trim()) {
      setMessage({ type: 'error', text: 'El asunto y mensaje son requeridos' });
      return;
    }

    setSubmitLoading(true);
    try {
      const response = await api<{
        ok: boolean;
        message: string;
      }>('/api/client/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response?.ok) {
        setMessage({ type: 'success', text: 'Queja enviada correctamente' });
        setFormData({ subject: '', message: '', priority: 'medium' });
        setShowForm(false);
        loadComplaints(); // Recargar la lista
      } else {
        setMessage({ type: 'error', text: 'Error al enviar la queja' });
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      setMessage({ type: 'error', text: 'Error al enviar la queja' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in_progress': return 'En Proceso';
      case 'resolved': return 'Resuelta';
      case 'closed': return 'Cerrada';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'low': return 'Baja';
      case 'medium': return 'Media';
      case 'high': return 'Alta';
      case 'critical': return 'Crítica';
      default: return priority;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Quejas y Sugerencias</h2>
          <p className="text-slate-600">Envía tus quejas y sugerencias para mejorar nuestro servicio</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          Nueva Queja
        </button>
      </div>

      {/* Mensaje */}
      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      {/* Formulario de nueva queja */}
      {showForm && (
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Nueva Queja o Sugerencia</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">
                Asunto *
              </label>
              <input
                type="text"
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe brevemente tu queja o sugerencia"
                required
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1">
                Mensaje *
              </label>
              <textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe detalladamente tu queja o sugerencia"
                required
              />
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-slate-700 mb-1">
                Prioridad
              </label>
              <select
                id="priority"
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as ComplaintForm['priority'] }))}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="critical">Crítica</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitLoading ? 'Enviando...' : 'Enviar Queja'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-slate-500 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de quejas */}
      <div className="bg-white rounded-lg border border-slate-200">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Mis Quejas</h3>
        </div>
        
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2 text-slate-600">Cargando quejas...</span>
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-8">
              <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No tienes quejas registradas</p>
              <p className="text-sm text-slate-500">Haz clic en "Nueva Queja" para enviar tu primera queja o sugerencia</p>
            </div>
          ) : (
            <div className="space-y-4">
              {complaints.map((complaint) => (
                <div key={complaint.id} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                    <div>
                      <h4 className="font-medium text-slate-800">{complaint.subject}</h4>
                      <p className="text-sm text-slate-500">
                        Creada: {new Date(complaint.created_at).toLocaleDateString('es-ES', { 
                          day: '2-digit', 
                          month: '2-digit', 
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(complaint.status)}`}>
                        {getStatusText(complaint.status)}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(complaint.priority)}`}>
                        {getPriorityText(complaint.priority)}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-slate-700 text-sm mb-3">{complaint.message}</p>
                  
                  {complaint.admin_response && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">
                          Respuesta del Admin{complaint.admin_name && ` - ${complaint.admin_name}`}
                        </span>
                      </div>
                      <p className="text-sm text-blue-700">{complaint.admin_response}</p>
                    </div>
                  )}
                  
                  {complaint.order_guide && (
                    <div className="mt-3 text-xs text-slate-500">
                      Relacionado con orden: <span className="font-mono">{complaint.order_guide}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={["px-3 py-3 align-middle text-slate-700", className].join(" ")}>{children}</td>;
}