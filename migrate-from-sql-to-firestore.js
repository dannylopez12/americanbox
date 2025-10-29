// Script para migrar datos desde americanbox_export.sql a Firestore
// Lee los INSERT de las tablas principales y sube los datos a Firestore

require('dotenv').config({ path: '.env.migration' });
const fs = require('fs');
const path = require('path');

// ✅ API modular
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// Inicializar Firebase usando el archivo JSON de credenciales
const serviceAccountPath = 'americanbox-e368b-firebase-adminsdk-fbsvc-763442ab42.json';
if (!fs.existsSync(serviceAccountPath)) {
  console.error('❌ No se encontró el archivo de credenciales de Firebase');
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

console.log('🚀 Inicializando Firebase...');
const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id,
});
console.log('✅ Firebase inicializado\n');

// Usar la base de datos 'americanbox' como en deep-diagnose.js
const DATABASE_ID = 'americanbox';
const db = getFirestore(app, DATABASE_ID);

// Tablas a migrar: users, customers, orders, providers, addresses, company_settings
const TABLES = [
  'users',
  'customers',
  'orders',
  'providers',
  'addresses',
  'company_settings',
  'categories',
  'products',
  'complaints',
  'accounts_receivable',
  'invoices',
  'vouchers'
];

function parseInsertStatement(insertSql) {
  // Extraer columnas del INSERT INTO `table` (col1, col2, ...)
  const colsMatch = insertSql.match(/INSERT INTO `[^`]+` \(([^)]+)\)/i);
  if (!colsMatch) return { columns: [], rows: [] };

  const columns = colsMatch[1].split(',').map(c => c.replace(/`/g, '').trim());

  // Extraer el bloque VALUES
  const valuesMatch = insertSql.match(/VALUES\s*([\s\S]*?);/);
  if (!valuesMatch) return { columns, rows: [] };

  const valuesBlock = valuesMatch[1];

  // Separar las filas por '),\s*\n\s*\(' o '),\s*\('
  const rows = valuesBlock.split(/\),\s*\n\s*\(/).map(row => row.replace(/^\(|\)$/g, '').trim());

  // Parsear cada fila
  const parsedRows = rows.map(row => {
    const cols = [];
    let current = '';
    let inString = false;
    let parenDepth = 0;

    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      if (char === "'" && row[i - 1] !== '\\') inString = !inString;
      if (!inString) {
        if (char === '(') parenDepth++;
        if (char === ')') parenDepth--;
      }
      if (char === ',' && !inString && parenDepth === 0) {
        cols.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cols.push(current.trim());
    return cols;
  });

  return { columns, rows: parsedRows };
}

async function migrateTable(table, sqlContent) {
  console.log(`\n📦 Migrando tabla: ${table}`);

  // Buscar todos los INSERT INTO para esta tabla
  const insertRegex = new RegExp(`INSERT INTO \`${table}\` \\([^)]+\\) VALUES[\\s\\S]*?;`, 'gi');
  const inserts = sqlContent.match(insertRegex);

  if (!inserts || inserts.length === 0) {
    console.log(`⚠️  No se encontraron datos para ${table}`);
    return;
  }

  let totalRecords = 0;

  for (const insertSql of inserts) {
    const { columns, rows } = parseInsertStatement(insertSql);

    for (const row of rows) {
      const doc = {};

      columns.forEach((col, idx) => {
        let val = row[idx];
        if (val === 'NULL' || val === null) val = null;
        else if (typeof val === 'string' && /^'.*'$/.test(val)) val = val.slice(1, -1).replace(/\\'/g, "'").replace(/\\n/g, '\n');
        else if (typeof val === 'string' && !isNaN(val) && val !== '') val = Number(val);
        doc[col] = val;
      });

      // Usar id como ID de documento si existe
      const docId = doc.id || doc.customer_id || doc.order_id || undefined;
      if (docId) {
        await db.collection(table).doc(docId.toString()).set(doc);
      } else {
        await db.collection(table).add(doc);
      }
    }

    totalRecords += rows.length;
  }

  console.log(`✅ Migrados ${totalRecords} registros a ${table}`);
}

async function main() {
  const sqlPath = path.join(__dirname, 'americanbox-api', 'americanbox_export.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('❌ No se encontró el archivo americanbox_export.sql');
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlPath, 'utf8');

  for (const table of TABLES) {
    await migrateTable(table, sqlContent);
  }

  console.log('\n🎉 Migración desde SQL a Firestore completada.');
}

main().catch(e => {
  console.error('❌ Error en la migración:', e);
  process.exit(1);
});
