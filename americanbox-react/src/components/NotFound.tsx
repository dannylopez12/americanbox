export default function NotFound() {
  return (
    <div className="min-h-dvh grid place-items-center p-8 text-center">
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900">404</h1>
        <p className="mt-2 text-slate-600">Página no encontrada</p>
        <a href="/" className="inline-block mt-6 px-4 py-2 rounded-lg bg-slate-900 text-white">
          Volver al inicio
        </a>
      </div>
    </div>
  )
}
