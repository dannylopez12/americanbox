import { useEffect, useState } from "react";

const items = [
  {
    text:
      "Desde que empecé a usar este servicio los costos de mis envíos han disminuido bastante, además me facilita la búsqueda de guías para realizar el seguimiento de los pedidos de mis clientes. Lo recomiendo muchísimo.",
    name: "Alberto Torres",
    role: "Ingeniero Civil",
    avatar: "/testimonials/1.jpg", // coloca tus imágenes en /public/testimonials/
  },
  {
    text:
      "Excelentes precios en sobres y paquetería. El tiempo de respuesta es súper rápido. ¡Súper recomendados!",
    name: "Jhon Quispe",
    role: "Profesor de física",
    avatar: "/testimonials/2.jpg",
  },
  {
    text:
      "Cumplen con nuestras expectativas y ofrecen opciones que se adaptan al tiempo y valor de envío de los clientes.",
    name: "Miguel Palacios",
    role: "Diseñador gráfico",
    avatar: "/testimonials/3.jpg",
  },
];

export default function Testimonials() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % items.length), 6000);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="container-xl">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            TESTIMONIOS
          </h2>
          <div className="h-1 w-16 bg-[--color-brand] mx-auto mt-3 rounded-full" />
          <p className="mt-3 text-slate-600">¿Qué dicen nuestros clientes?</p>
        </div>

        <div className="mt-10 relative">
          {items.map((t, idx) => (
            <article
              key={t.name}
              className={`transition-all duration-700 rounded-2xl bg-slate-50 p-7 md:p-9 border border-slate-200
                         ${idx === i ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 absolute inset-0 pointer-events-none"}`}
            >
              <p className="text-slate-700 italic leading-relaxed">
                <span className="text-[--color-brand] text-2xl align-top mr-2">“</span>
                {t.text}
                <span className="text-[--color-brand] text-2xl align-top ml-2">”</span>
              </p>

              <div className="mt-6 flex items-center gap-4">
                <img
                  src={t.avatar}
                  className="w-16 h-16 rounded-full object-cover ring-4 ring-white shadow"
                />
                <div>
                  <h3 className="font-semibold text-lg">{t.name}</h3>
                  <p className="text-slate-500 text-sm">{t.role}</p>
                </div>
              </div>
            </article>
          ))}

          <div className="mt-6 flex justify-center gap-2">
            {items.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setI(idx)}
                className={`w-2.5 h-2.5 rounded-full transition
                           ${idx === i ? "bg-[--color-brand]" : "bg-slate-300 hover:bg-slate-400"}`}
                aria-label={`Ir al testimonio ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
