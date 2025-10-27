export default function CTA() {
  return (
    <section className="bg-gray-900 text-white py-16">
      <div className="container-xl text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Comunícate con nosotros
        </h2>
        <p className="text-slate-300 mt-3 max-w-2xl mx-auto">
          Ponte en contacto con nosotros, queremos brindarte el mejor servicio posible.
        </p>

        {/* Botón WhatsApp */}
<a
  href="https://wa.me/5930963143856"
  target="_blank"
  rel="noreferrer"
  className="inline-flex items-center gap-2 mt-8 px-6 py-3 rounded-full
             border-2 border-[--color-brand] text-white bg-transparent
             hover:bg-[--color-brand] hover:text-white hover:scale-105 hover:shadow-lg hover:shadow-[--color-brand]/25
             transition-all duration-300 ease-out transform
             focus:outline-none focus:ring-2 focus:ring-[--color-brand]/40
             focus:ring-offset-2 focus:ring-offset-[--color-nav]
             active:scale-95"
>
  <svg
    width="18"
    height="18"
    viewBox="0 0 32 32"
    className="text-current"
    fill="currentColor"
  >
    <path d="M19.11 17.23c-.29-.15-1.71-.84-1.98-.94-.27-.1-.46-.15-.65.15s-.75.93-.92 1.12-.34.22-.63.07a9.91 9.91 0 0 1-2.91-1.8 10.8 10.8 0 0 1-2-2.5c-.21-.37 0-.57.15-.72s.33-.37.49-.56.21-.3.32-.5a.64.64 0 0 0 0-.61c-.08-.15-.65-1.57-.89-2.15s-.48-.5-.66-.5h-.56a1.09 1.09 0 0 0-.8.37A3.35 3.35 0 0 0 7 10.9a5.81 5.81 0 0 0 1.22 3.07 13.29 13.29 0 0 0 5.07 4.58 17.27 17.27 0 0 0 1.7.63 4.1 4.1 0 0 0 1.86.12 3.05 3.05 0 0 0 2-1.39 2.48 2.48 0 0 0 .18-1.39c-.08-.12-.27-.2-.52-.3Z" />
    <path d="M16.06 3.04a12.93 12.93 0 0 0-11.3 19.4L3 29l6.75-1.77A12.93 12.93 0 1 0 16.06 3.04Zm0 23.36a10.43 10.43 0 0 1-5.31-1.47l-.38-.23-4 .99 1.06-3.9-.25-.4A10.43 10.43 0 1 1 16.06 26.4Z" />
  </svg>
  <span className="font-medium">Enviar un mensaje</span>
</a>

        {/* Redes sociales (iconos estilo “brand” pulidos) */}
        <div className="mt-8 flex justify-center gap-4">
          {/* Facebook – estilo Bootstrap Icons */}
          <a
            href="https://www.facebook.com/americandreamshopec"
            target="_blank"
            aria-label="Facebook"
            className="group w-11 h-11 rounded-full bg-white/5 ring-1 ring-white/10 hover:bg-white hover:text-gray-900
                       flex items-center justify-center transition transform hover:-translate-y-0.5"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
              <path d="M22 12.06C22 6.49 17.52 2 12 2S2 6.49 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.41c0-2.5 1.49-3.88 3.77-3.88 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.91h-2.34v7.03C18.34 21.24 22 17.08 22 12.06z" />
            </svg>
          </a>

          {/* TikTok – trazos más limpios (inspirado en Simple Icons) */}
          <a
            href="https://www.tiktok.com/@americanboxcourier"
            target="_blank"
            aria-label="TikTok"
            className="group w-11 h-11 rounded-full bg-white/5 ring-1 ring-white/10 hover:bg-white hover:text-gray-900
                       flex items-center justify-center transition transform hover:-translate-y-0.5"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
              <path d="M21 8.63c-1.75-.08-3.16-.64-4.44-1.86v7.67a6.44 6.44 0 1 1-6.44-6.44c.22 0 .45.01.67.04V9.1a3.86 3.86 0 1 0 3.86 3.86V2.75h2.02a5.9 5.9 0 0 0 4.33 4.14v1.74Z" />
            </svg>
          </a>

          {/* Instagram – estilo clásico con marco */}
          <a
            href="https://www.instagram.com/americanbox_courier/"
            target="_blank"
            aria-label="Instagram"
            className="group w-11 h-11 rounded-full bg-white/5 ring-1 ring-white/10 hover:bg-white hover:text-gray-900
                       flex items-center justify-center transition transform hover:-translate-y-0.5"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
              <path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5Zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7Zm5 3.75A5.25 5.25 0 1 1 6.75 13 5.25 5.25 0 0 1 12 7.75Zm0 2A3.25 3.25 0 1 0 15.25 13 3.25 3.25 0 0 0 12 9.75Zm5.6-3.1a1.15 1.15 0 1 1-1.15 1.15 1.15 1.15 0 0 1 1.15-1.15Z" />
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
