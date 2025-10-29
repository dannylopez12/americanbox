import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout() {
  const location = useLocation();

  // NO mostrar navbar/footer en dashboards
  const hideLayout =
    location.pathname.startsWith("/client") ||
    location.pathname.startsWith("/dashboard");

  return (
    <div className="font-sans bg-white text-slate-900 min-h-screen flex flex-col">
      {!hideLayout && <Navbar />}
      <main className="flex-1">
        <Outlet />
      </main>
      {!hideLayout && <Footer />}
    </div>
  );
}
