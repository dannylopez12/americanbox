const xlsx = require('xlsx');
const path = require('path');

// Crear datos de ejemplo para el template
const templateData = [
  {
    'codigo_proveedor': 'AMAZON',
    'cliente': 'Juan Pérez',
    'comentario': 'Electrónicos - Tablet',
    'peso_lbs': 2.5
  },
  {
    'codigo_proveedor': 'EBAY',
    'cliente': 'María González',
    'comentario': 'Ropa - Vestidos',
    'peso_lbs': 1.2
  },
  {
    'codigo_proveedor': 'SHEIN',
    'cliente': 'Carlos López',
    'comentario': 'Zapatos deportivos',
    'peso_lbs': 3.0
  }
];

// Crear workbook
const workbook = xlsx.utils.book_new();

// Crear worksheet con los datos de ejemplo
const worksheet = xlsx.utils.json_to_sheet(templateData);

// Configurar ancho de columnas
const columnWidths = [
  { wch: 18 }, // codigo_proveedor
  { wch: 20 }, // cliente
  { wch: 25 }, // comentario
  { wch: 10 }  // peso_lbs
];
worksheet['!cols'] = columnWidths;

// Agregar worksheet al workbook
xlsx.utils.book_append_sheet(workbook, worksheet, 'Pedidos');

// Crear directorio si no existe
const templatesDir = path.join(__dirname, 'templates');
const fs = require('fs');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir);
}

// Guardar archivo
const filePath = path.join(templatesDir, 'template_carga_masiva.xlsx');
xlsx.writeFile(workbook, filePath);

console.log('✅ Template de carga masiva creado en:', filePath);
console.log('📋 El archivo contiene 3 ejemplos con el formato correcto:');
console.log('   - codigo_proveedor: Código del proveedor (AMAZON, EBAY, SHEIN, etc.)');
console.log('   - cliente: Nombre completo del cliente');
console.log('   - comentario: Descripción del pedido');
console.log('   - peso_lbs: Peso en libras (número decimal)');
console.log('');
console.log('🔧 Los campos obligatorios son:');
console.log('   - cliente (requerido)');
console.log('   - Los demás campos son opcionales');
console.log('');
console.log('⚡ Comportamiento automático:');
console.log('   - Número de guía: Se genera automáticamente (formato AB + timestamp)');
console.log('   - Estado: Se asigna "Pre alerta" por defecto');
console.log('   - Usuario: Se busca por nombre o se crea si no existe');
console.log('   - Proveedor: Se busca por código o nombre');