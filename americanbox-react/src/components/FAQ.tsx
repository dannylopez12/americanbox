import { useState } from "react";
import type { KeyboardEvent } from "react";

const faqs = [
  {
    q: "¿Qué pasa si un pedido de cualquier plataforma es extraviado?",
    a: "En caso de que un paquete sea extraviado, si la compra es realizada por nosotros de manera personal, solicitamos el reclamo a la tienda y nosotros realizamos la devolución del artículo extraviado. En caso de hacer la compra usted mismo presentar la queja directamente a la tienda, para que le den solución.",
  },
  {
    q: "¿Qué días se hacen divisiones de paquetes?",
    a: "En American Box, hacemos divisiones de paquetes todos los días para que tu pedido llegue lo más rápido posible. Garantizamos las divisiones diarias de nuestros paquetes, asegurando rapidez y eficiencia en la entrega.",
  },
  {
    q: "¿Aceptan paquetes de clientes que viven en Estados Unidos?",
    a: "¡Por supuesto! Si vives en Estados Unidos, puedes dejarnos tus paquetes para envío en nuestra bodega ubicada en New Jersey. Contáctanos para más detalles o consulta sobre la dirección de nuestra bodega.",
  },
  {
    q: "¿Cuántos embarques de paquetes se realizan a la semana?",
    a: "Realizamos 2 embarques de paquetes a la semana, garantizando un servicio eficiente y confiable para nuestros clientes. Nuestro objetivo es asegurar que los envíos se gestionen de manera rápida y segura, optimizando los tiempos de entrega.",
  },
  {
    q: "¿Cuánto es el tiempo estimado de entrega que ofrecen?",
    a: "Una vez llegado a nuestras bodegas, el tiempo estimado de entrega que ofrecemos es de 5 a 8 días hábiles.",
  },
  {
    q: "¿Qué beneficios ofrecemos a los emprendedores como tu courier de confianza?",
    a: "Si eres emprendedor, tenemos beneficios para ti a solo $4,85 la libra (a partir de 80 libras mensuales). También ofrecemos etiquetado de paquetes con tu logo y nombre comercial, sistema logístico, sin mínimos ni máximos, divisiones todos los días y asesoramiento totalmente personalizado y gratuito.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  const toggle = (idx: number) => setOpen(open === idx ? null : idx);

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, idx: number) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle(idx);
    }
  };

  return (
    <section id="faq" className="bg-slate-50 py-20">
      <div className="container-xl">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight uppercase">
            Preguntas Frecuentes
          </h2>
          <div className="h-1 w-16 bg-[--color-brand] mx-auto mt-3 rounded-full" />
          <p className="mt-3 text-slate-600">
            Descubre las preguntas más frecuentes acerca de envíos, paquetes, peso y tipos de envío.
          </p>
        </div>

        <ul className="mt-10 divide-y divide-slate-200 bg-white rounded-2xl shadow-sm">
          {faqs.map((f, idx) => {
            const isOpen = open === idx;
            return (
              <li
                key={f.q}
                className={[
                  "group relative p-1 md:p-1",
                  "transition-all duration-200",
                  "hover:bg-slate-50/70 hover:shadow-md hover:-translate-y-[1px] rounded-xl",
                ].join(" ")}
              >
                {/* Barra lateral animada (hover/abierto) */}
                <span
                  className={[
                    "pointer-events-none absolute left-0 top-2 bottom-2 w-1 rounded-r-full",
                    "bg-[--color-brand]",
                    "opacity-0 scale-y-50 transition-all duration-300 origin-top",
                    isOpen ? "opacity-100 scale-y-100" : "group-hover:opacity-100 group-hover:scale-y-100",
                  ].join(" ")}
                />

                <button
                  className="w-full flex items-center justify-between text-left gap-3 rounded-lg px-4 py-4 md:px-5 md:py-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-brand] focus-visible:ring-offset-2"
                  onClick={() => toggle(idx)}
                  onKeyDown={(e) => onKey(e, idx)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${idx}`}
                >
                  <span
                    className={[
                      "font-medium md:text-lg transition-colors",
                      isOpen ? "text-[--color-brand]" : "text-slate-800 group-hover:text-[--color-brand]",
                    ].join(" ")}
                  >
                    {f.q}
                  </span>

                  {/* Ícono chevron con animación */}
                  <span
                    className={[
                      "transition-transform duration-300 text-slate-400",
                      "group-hover:scale-110 group-hover:text-[--color-brand]",
                      isOpen ? "rotate-180 text-[--color-brand]" : "",
                    ].join(" ")}
                    aria-hidden="true"
                  >
                    ▾
                  </span>
                </button>

                <div
                  id={`faq-panel-${idx}`}
                  className={[
                    "grid overflow-hidden transition-all duration-300 px-4 md:px-5",
                    isOpen ? "grid-rows-[1fr] opacity-100 pb-4 md:pb-5" : "grid-rows-[0fr] opacity-0",
                  ].join(" ")}
                >
                  <div className="min-h-0 text-slate-600">
                    {f.a}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
