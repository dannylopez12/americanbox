export default function Footer() {
  return (
    <footer className="mt-10">
      {/* franja superior con logo */}
      <div className="bg-slate-100 py-10">
        <div className="container-xl text-center">
          <img src="/logo-abox.png" alt="American Box" className="h-14 mx-auto" />
          <p className="text-slate-600 mt-2">AMERICAN-BOX S.A.S.</p>
        </div>
      </div>

      {/* barra inferior */}
      <div className="bg-slate-900 text-slate-200">
        <div className="container-xl py-6 flex items-center justify-between gap-6">
          <div className="text-sm">
            <div>
              © Copyright <strong>American Box</strong>. Todos los derechos reservados
            </div>
            <div className="mt-1">
              Programado by{" "}
              <a
                href="https://software.tecnomer.ec"
                target="_blank"
                rel="noreferrer"
                className="underline decoration-[--color-brand] hover:text-[--color-brand]"
              >
                Tecnomer
              </a>
            </div>
          </div>

          {/* Íconos sociales - mismo estilo que CTA */}
          <div className="flex items-center gap-3">
            {/* Facebook */}
            <a
              href="https://www.facebook.com/americandreamshopec"
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="group w-11 h-11 rounded-full bg-white/5 ring-1 ring-white/10 hover:bg-white hover:text-gray-900
                         flex items-center justify-center transition transform hover:-translate-y-0.5"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                <path d="M22 12.06C22 6.49 17.52 2 12 2S2 6.49 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.41c0-2.5 1.49-3.88 3.77-3.88 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.87h2.78l-.44 2.91h-2.34v7.03C18.34 21.24 22 17.08 22 12.06z" />
              </svg>
            </a>

            {/* TikTok */}
            <a
              href="https://www.tiktok.com/@americanboxcourier"
              target="_blank"
              rel="noreferrer"
              aria-label="TikTok"
              className="group w-11 h-11 rounded-full bg-white/5 ring-1 ring-white/10 hover:bg-white hover:text-gray-900
                         flex items-center justify-center transition transform hover:-translate-y-0.5"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
                <path d="M21 8.63c-1.75-.08-3.16-.64-4.44-1.86v7.67a6.44 6.44 0 1 1-6.44-6.44c.22 0 .45.01.67.04V9.1a3.86 3.86 0 1 0 3.86 3.86V2.75h2.02a5.9 5.9 0 0 0 4.33 4.14v1.74Z" />
              </svg>
            </a>

            {/* Instagram */}
            <a
              href="https://www.instagram.com/americanbox_courier/"
              target="_blank"
              rel="noreferrer"
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
      </div>

      {/* volver arriba */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-6 right-6 w-11 h-11 rounded-full bg-[--color-brand] text-slate-900 font-bold
                   shadow-lg hover:scale-105 transition"
        aria-label="Volver arriba"
        title="Volver arriba"
      >
        ↑
      </button>
    </footer>
  );
}
