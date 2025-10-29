// Script para listar todas las tablas con INSERTS y la cantidad de registros en americanbox_export.sql
const fs = require('fs');
const path = require('path');

const sqlPath = path.join(__dirname, 'americanbox-api', 'americanbox_export.sql');
if (!fs.existsSync(sqlPath)) {
  console.error('❌ No se encontró el archivo americanbox_export.sql');
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, 'utf8');

// Buscar todos los bloques INSERT INTO
const insertRegex = /INSERT INTO `([^`]+)` \([^)]+\) VALUES\s*([\s\S]*?);/g;
const insertMap = {};

let match;
while ((match = insertRegex.exec(sql)) !== null) {
  const table = match[1];
  const valuesBlock = match[2];

  // Contar las filas en el bloque VALUES
  // Cada fila está separada por '),\s*\n\s*\(' o termina con ')'
  const rows = valuesBlock.split(/\),\s*\n\s*\(/);

  // Limpiar cada fila de espacios y paréntesis
  const cleanRows = rows.map(row => row.trim().replace(/^\(|\)$/g, '')).filter(row => row.length > 0);

  if (!insertMap[table]) insertMap[table] = 0;
  insertMap[table] += cleanRows.length;
}

console.log('Tablas con INSERTS y cantidad de registros:');
Object.entries(insertMap).forEach(([table, count]) => {
  console.log(`- ${table}: ${count} registros`);
});

console.log(`\nTotal de tablas con datos: ${Object.keys(insertMap).length}`);
