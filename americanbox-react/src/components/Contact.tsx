export default function Contact() {
  return (
    <section id="contact" className="py-20 bg-white">
      <div className="container-xl grid lg:grid-cols-2 gap-8">
        {/* Left info cards */}
        <div className="space-y-6">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-center lg:text-left">
            CONTACTOS
          </h2>
          <div className="h-1 w-16 bg-[--color-brand] rounded-full lg:ml-0 mx-auto" />
          <p className="text-slate-600">
            Si necesitas soporte o más información, ponte en contacto con nosotros por correo
            electrónico o teléfono. Nuestro equipo está listo para ayudarte.
          </p>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-slate-50 p-6 border border-slate-200 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-full border-2 border-[--color-brand] flex items-center justify-center">
                📍
              </div>
              <h3 className="font-semibold mt-3">Dirección</h3>
              <p className="text-slate-600">—</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-6 border border-slate-200 hover:shadow-md transition">
              <div className="w-12 h-12 rounded-full border-2 border-[--color-brand] flex items-center justify-center">
                ✉️
              </div>
              <h3 className="font-semibold mt-3">Email</h3>
              <p className="text-slate-600">americanboxec@gmail.com</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-6 border border-slate-200 hover:shadow-md transition sm:col-span-2">
              <div className="w-12 h-12 rounded-full border-2 border-[--color-brand] flex items-center justify-center">
                📞
              </div>
              <h3 className="font-semibold mt-3">Teléfono</h3>
              <p className="text-slate-600">0963143856</p>
            </div>
          </div>
        </div>

        {/* Right form */}
        <form className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="grid sm:grid-cols-2 gap-4">
            <input className="input" placeholder="Ingrese un nombre" />
            <input className="input" placeholder="Ingrese un teléfono celular" />
            <input className="input sm:col-span-2" placeholder="Ingrese un email" />
            <input className="input sm:col-span-2" placeholder="Ingrese un asunto" />
            <textarea className="input sm:col-span-2" rows={4} placeholder="Ingrese un mensaje" />
          </div>
          <button
            type="button"
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[--color-brand] text-slate-900
                       font-semibold shadow hover:opacity-90 transition"
          >
            <span>✉️</span> Enviar comentario
          </button>
        </form>
      </div>
    </section>
  );
}
