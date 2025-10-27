const services = [
  {
    title: "Casillero para Compras por Internet",
    text:
      "Ponemos a tu disposición un Casillero para hacer tus compras por Internet, sin costo adicional dispondrás de un Casillero para efectuar tus compras en Estados Unidos.",
    icon: "/services/1.png",
  },
  {
    title: "Envío y Recepción de paquetes",
    text:
      "Envía a clientes, familiares y amigos y recibe paquetes provenientes de Estados Unidos de forma segura.",
    icon: "/services/2.png",
  },
  {
    title: "Envío de Carga Comercial y Contenedores",
    text:
      "Para altos volúmenes y procesos de aduana completos. Incluye contenedores completos (FTL) y carga consolidada (LTL).",
    icon: "/services/3.png",
  },
  {
    title: "Servicio de Compra Asistida",
    text:
      "Compramos por ti cuando no cuentes con tarjeta internacional. Acompañamiento y gestión completa.",
    icon: "/services/4.png",
  },
  {
    title: "Servicio Bonded en USA",
    text:
      "Consolidación y tránsito de mercancías provenientes de distintos orígenes antes del envío a destino.",
    icon: "/services/5.png",
  },
  {
    title: "Paquetería Liviana",
    text:
      "Cajas desde 2 hasta 30 kg con entrega ágil a nivel nacional. En ciudades principales desde 24 horas.",
    icon: "/services/6.png",
  },
];

export default function Services() {
  return (
    <section id="services" className="py-16 bg-slate-50">
      <div className="container-xl">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-wide text-slate-800">
            SERVICIOS
          </h2>
          <div className="mx-auto mt-2 h-1 w-16 rounded bg-amber-400" />
          <p className="mt-4 max-w-3xl mx-auto text-slate-600">
            Ofrecemos diferentes servicios de courrier para facilitar tus envíos
            a nivel local e internacional según lo requiera el cliente.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <article
              key={s.title}
              className="
                group relative overflow-hidden rounded-2xl
                border border-slate-200 bg-white/70 backdrop-blur
                transition hover:-translate-y-1 hover:shadow-xl hover:border-amber-300
              "
            >
              {/* borde inferior animado */}
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <div className="p-6">
                <img
                  src={s.icon}
                  alt=""
                  className="h-20 w-20 mx-auto mb-4 transition-transform duration-300 group-hover:scale-110"
                />
                <h3 className="text-center font-semibold text-slate-800">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600 text-center leading-relaxed">
                  {s.text}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
