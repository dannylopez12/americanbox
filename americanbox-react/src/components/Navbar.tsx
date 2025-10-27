import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

type Item =
  | { label: string; kind: "route"; to: string }
  | { label: string; kind: "hash"; hash: string }; // ancla dentro de Home

const items: Item[] = [
  { label: "Inicio", kind: "route", to: "/" },
  { label: "Quienes Somos", kind: "hash", hash: "#about" },
  { label: "Videos", kind: "hash", hash: "#videos" },
  { label: "Tracking", kind: "route", to: "/Tracking" },
  
  { label: "Contactos", kind: "hash", hash: "#contact" },
  { label: "Registrarse", kind: "route", to: "/signin" },
  { label: "Iniciar Sesión", kind: "route", to: "/login/different" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // activo: ruta o hash actual
  const [activeHash, setActiveHash] = useState<string>(window.location.hash || "");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    const onHash = () => setActiveHash(window.location.hash || "");
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("hashchange", onHash);
    };
  }, []);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // suaviza scroll a anclas del Home aunque estés en otra ruta
  const goHash = async (hash: string) => {
    setMobileMenuOpen(false); // cerrar menú móvil
    if (location.pathname !== "/") {
      await navigate("/"); // vuelve a Home
      // pequeño delay para que exista el elemento destino
      requestAnimationFrame(() => {
        const el = document.querySelector(hash);
        el?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } else {
      const el = document.querySelector(hash);
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // actualiza hash visible
    history.replaceState(null, "", hash);
    setActiveHash(hash);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // clases base + activo/hover con amarillo sólido
  const baseBtn =
    "px-4 py-2 rounded-full text-sm md:text-[15px] font-medium transition-all duration-200 " +
    "text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[--color-brand]";
  const activeBtn =
    "bg-[--color-brand] shadow-[0_0_15px_4px_rgba(255,193,7,0.8)]"; // sólido, sin cambiar texto
  const hoverBtn =
    "hover:bg-[--color-brand] hover:shadow-[0_0_15px_4px_rgba(255,193,7,0.8)]";

  return (
    <header
      className={[
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled
          ? "bg-[#111827]/90 backdrop-blur-md shadow-sm"
          : "bg-gradient-to-b from-[#111827]/70 to-transparent",
      ].join(" ")}
    >
      <nav className="container-xl flex items-center justify-between py-3">
        {/* Logo */}
        <Link to="/" className="shrink-0" onClick={() => setActiveHash("")}>
          <img src="/logo-abox.png" alt="American Box" className="h-8" />
        </Link>

        {/* Desktop Menu */}
        <ul className="hidden lg:flex items-center gap-2 md:gap-3">
          {items.map((it) => {
            if (it.kind === "route") {
              return (
                <li key={`${it.kind}-${it.to}`}>
                  <NavLink
                    to={it.to}
                    className={({ isActive }) =>
                      [
                        baseBtn,
                        isActive ? activeBtn : hoverBtn,
                      ].join(" ")
                    }
                    onClick={closeMobileMenu}
                  >
                    {it.label}
                  </NavLink>
                </li>
              );
            }
            // hash
            const isActive = activeHash === it.hash && location.pathname === "/";
            return (
              <li key={`${it.kind}-${it.hash}`}>
                <button
                  type="button"
                  onClick={() => goHash(it.hash)}
                  className={[baseBtn, isActive ? activeBtn : hoverBtn].join(" ")}
                >
                  {it.label}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="lg:hidden p-2 rounded-md text-white hover:bg-white/10 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-[#111827]/95 backdrop-blur-md border-t border-white/10">
          <ul className="container-xl py-4 space-y-2">
            {items.map((it) => {
              if (it.kind === "route") {
                return (
                  <li key={`mobile-${it.kind}-${it.to}`}>
                    <NavLink
                      to={it.to}
                      className={({ isActive }) =>
                        [
                          "block w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-white",
                          isActive 
                            ? "bg-[--color-brand] shadow-[0_0_15px_4px_rgba(255,193,7,0.8)]" 
                            : "hover:bg-[--color-brand] hover:shadow-[0_0_15px_4px_rgba(255,193,7,0.8)]",
                        ].join(" ")
                      }
                      onClick={closeMobileMenu}
                    >
                      {it.label}
                    </NavLink>
                  </li>
                );
              }
              // hash
              const isActive = activeHash === it.hash && location.pathname === "/";
              return (
                <li key={`mobile-${it.kind}-${it.hash}`}>
                  <button
                    type="button"
                    onClick={() => goHash(it.hash)}
                    className={[
                      "block w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 text-white",
                      isActive 
                        ? "bg-[--color-brand] shadow-[0_0_15px_4px_rgba(255,193,7,0.8)]" 
                        : "hover:bg-[--color-brand] hover:shadow-[0_0_15px_4px_rgba(255,193,7,0.8)]",
                    ].join(" ")}
                  >
                    {it.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
}
