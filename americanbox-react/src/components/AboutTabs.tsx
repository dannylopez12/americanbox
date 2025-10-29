import { useState } from "react";

const blocks = [
  {
    title: "Misión",
    text:
      "Nuestro compromiso es garantizar la seguridad e integridad de los valores de nuestros clientes, brindar una excelente asesoría y superar continuamente sus expectativas. Cada miembro de nuestra empresa trabaja con honestidad y está calificado para brindar a nuestros clientes la mejor atención.",
  },
  {
    title: "Visión",
    text:
      "Continuar siendo la empresa número uno del mercado en el transporte de compras por internet, y encomiendas, manteniendo a nuestros trabajadores comprometidos y capacitados con tecnología de punta para garantizar un servicio de calidad y con presencia en nuevos mercados.",
  },
  {
    title: "Acerca de nosotros",
    text:
      "Nuestra trayectoria en el mercado nacional nos ha brindado la experiencia suficiente para manejar los envíos de nuestros aliados comerciales. Nuestra eficacia, compromiso y liderazgo al momento de transportar carga sensible e importante para nuestros clientes nos hace la opción número en envíos en el país.",
  },
];

export default function AboutTabs() {
  const [active, setActive] = useState(0);

  return (
    <section id="about" className="py-16 bg-white">
      <div className="container-xl flex flex-col lg:flex-row gap-10 items-stretch">
        {/* Columna izquierda (recuadros de texto) */}
        <div className="flex flex-col justify-between space-y-6 w-full lg:w-1/2">
          {blocks.map((b, i) => {
            const isActive = active === i;
            return (
              <button
                key={b.title}
                onClick={() => setActive(i)}
                className={[
                  "w-full text-left rounded-xl p-5 transition flex-1",
                  "border-l-4",
                  isActive
                    ? "bg-amber-50/70 border-amber-400 shadow-sm"
                    : "border-transparent hover:bg-slate-50",
                ].join(" ")}
              >
                <h3
                  className={[
                    "text-lg font-semibold",
                    isActive ? "text-amber-600" : "text-slate-800",
                  ].join(" ")}
                >
                  {b.title}
                </h3>
                <p className="mt-2 text-slate-600 leading-relaxed text-sm">
                  {b.text}
                </p>
              </button>
            );
          })}
        </div>

        {/* Imagen derecha */}
        <div className="relative flex items-center justify-center h-[500px] lg:h-[550px] w-full lg:w-1/2">
          {[0, 1, 2].map((idx) => {
            const show = idx === active;
            const src = `/features-${idx + 1}.png`;
            return (
              <img
                key={src}
                src={src}
                alt=""
                className={[
                  "absolute inset-0 m-auto object-contain",
                  "transition-opacity duration-500",
                  show ? "opacity-100" : "opacity-0 pointer-events-none",
                  "max-h-full w-auto",
                ].join(" ")}
              />
            );
          })}
          <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-tr from-amber-400/10 via-transparent to-transparent blur-2xl" />
        </div>
      </div>
    </section>
  );
}
