const logos = [
  "/brands/1.png",  // Costco
  "/brands/2.png",  // Walmart
  "/brands/3.png",  // Sam's Club
  "/brands/4.png",  // Amazon
  "/brands/5.png",  // Best Buy
  "/brands/6.png",  // Target
  "/brands/7.png",  // eBay
  "/brands/8.png",  // Home Depot
  "/brands/9.png",  // TJ Maxx
  "/brands/imagen_2025-07-24_191431643.png", // American Box (o Temu, renómbrala si quieres)
  "/brands/imagen_2025-09-02_174515485.png", // Temu (o American Box, renómbrala si quieres)
  "/brands/shein.jpg", // SHEIN
];

export default function Clients() {
  return (
    <section id="clients" className="py-14 bg-white">
      <div className="container-xl mx-auto px-4">
        <p className="text-center text-xl md:text-2xl text-slate-800">
          Compra en línea en las mejores <b>tiendas internacionales</b> y recibe tus productos en <b>Ecuador</b>
        </p>

        <div className="mt-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-6 items-center justify-center">
          {logos.map((src) => (
            <div
              key={src}
              className="h-16 flex items-center justify-center opacity-80 hover:opacity-100 transition transform hover:scale-110 duration-300 ease-out bg-white rounded-xl shadow-sm hover:shadow-lg"
            >
              <img
                src={src}
                alt="logo tienda"
                className="max-h-full max-w-[80%] object-contain"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
