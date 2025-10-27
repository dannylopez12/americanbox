import { useState, useEffect } from "react";

const slides = [
  {
    image: "/1.png",
    title: "Envíos Internacionales",
    subtitle:
      "Ampliamos nuestras operaciones para ofrecer envíos internacionales seguros y confiables",
  },
  {
    image: "/2.png",
    title: "Embalaje Seguro",
    subtitle:
      "Embalamos tus productos de forma segura para garantizar que lleguen en perfectas condiciones",
  },
  {
    image: "/3.png",
    title: "Seguimiento en Tiempo Real",
    subtitle:
      "Ofrecemos seguimiento en tiempo real para que puedas rastrear tu paquete en cualquier momento",
  },
  {
    image: "/4.png",
    title: "Bienvenidos",
    subtitle:
      "Somos la empresa líder en el mercado para el traslado de compras por Internet y Envíos Internacionales",
  },
  {
    image: "/5.png",
    title: "Envío Express",
    subtitle:
      "Entregamos tus paquetes de forma rápida y eficiente con nuestro servicio de envío express.",
  },
  {
    image: "/6.png",
    title: "Cómo registrar tu casillero",
    subtitle:
      "Te ofrecemos casilleros donde podrás tener un control más eficiente de tus paquetes",
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const length = slides.length;

  // ⏳ autoplay cada 6s
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % length);
    }, 6000);
    return () => clearInterval(timer);
  }, [length]);

  const prevSlide = () => setCurrent((prev) => (prev - 1 + length) % length);
  const nextSlide = () => setCurrent((prev) => (prev + 1) % length);

  return (
    <section id="hero" className="-mt-16 pt-16 relative w-full h-[85vh] overflow-hidden">
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === current ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
          style={{
            backgroundImage: `url(${slide.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-20 h-full flex flex-col justify-center items-center text-center px-4">
            <h2 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
              {slide.title}
            </h2>
            <p className="mt-3 text-white/90 max-w-2xl">{slide.subtitle}</p>
            <a
              href="#about"
              className="mt-6 inline-block bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg text-white font-semibold shadow-lg transition"
            >
              Leer más
            </a>
          </div>
        </div>
      ))}

      {/* Flechas */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/40 rounded-full h-10 w-10 flex items-center justify-center text-white transition"
        aria-label="Anterior"
      >
        ❮
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-white/20 hover:bg-white/40 rounded-full h-10 w-10 flex items-center justify-center text-white transition"
        aria-label="Siguiente"
      >
        ❯
      </button>

      {/* Indicadores */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-30">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`h-2.5 w-2.5 rounded-full transition ${
              current === index ? "bg-red-600" : "bg-white/50 hover:bg-white/80"
            }`}
            aria-label={`Ir a slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
