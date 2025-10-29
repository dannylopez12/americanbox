// Script para exportar la base de datos completa para producción
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Configuración de la base de datos local
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // Tu contraseña local
  database: 'americanbox', // Tu BD local
  port: 3306
};

async function exportDatabase() {
  let connection;
  
  try {
    console.log('🔗 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('📊 Obteniendo estructura de tablas...');
    
    // Obtener lista de tablas
    const [tables] = await connection.execute('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    let sqlDump = '';
    sqlDump += '-- Exportación de base de datos AmericanBox\n';
    sqlDump += `-- Generado el: ${new Date().toISOString()}\n`;
    sqlDump += '-- Configuración inicial\n\n';
    sqlDump += 'SET FOREIGN_KEY_CHECKS=0;\n';
    sqlDump += 'SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";\n';
    sqlDump += 'SET time_zone = "+00:00";\n\n';
    
    // Para cada tabla
    for (const tableName of tableNames) {
      console.log(`📋 Exportando tabla: ${tableName}`);
      
      // Obtener estructura de la tabla
      const [createTable] = await connection.execute(`SHOW CREATE TABLE \`${tableName}\``);
      sqlDump += `-- Estructura de tabla \`${tableName}\`\n`;
      sqlDump += `DROP TABLE IF EXISTS \`${tableName}\`;\n`;
      sqlDump += createTable[0]['Create Table'] + ';\n\n';
      
      // Obtener datos de la tabla
      const [rows] = await connection.execute(`SELECT * FROM \`${tableName}\``);
      
      if (rows.length > 0) {
        sqlDump += `-- Datos de tabla \`${tableName}\`\n`;
        
        // Obtener nombres de columnas
        const [columns] = await connection.execute(`SHOW COLUMNS FROM \`${tableName}\``);
        const columnNames = columns.map(col => `\`${col.Field}\``).join(', ');
        
        sqlDump += `INSERT INTO \`${tableName}\` (${columnNames}) VALUES\n`;
        
        const values = rows.map(row => {
          const rowValues = Object.values(row).map(value => {
            if (value === null) return 'NULL';
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
            if (value instanceof Date) return `'${value.toISOString().slice(0, 19).replace('T', ' ')}'`;
            return value;
          });
          return `(${rowValues.join(', ')})`;
        });
        
        sqlDump += values.join(',\n') + ';\n\n';
      }
    }
    
    sqlDump += 'SET FOREIGN_KEY_CHECKS=1;\n';
    
    // Guardar archivo
    const exportPath = path.join(__dirname, 'americanbox_export.sql');
    fs.writeFileSync(exportPath, sqlDump, 'utf8');
    
    console.log('✅ Exportación completada!');
    console.log(`📁 Archivo guardado en: ${exportPath}`);
    console.log(`📊 Total de tablas exportadas: ${tableNames.length}`);
    console.log('\n🚀 Pasos siguientes:');
    console.log('1. Sube este archivo SQL a phpMyAdmin en Hostinger');
    console.log('2. Importa la base de datos en tu BD de producción');
    console.log('3. Configura las variables de entorno en .env.production');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n🔧 Posibles soluciones:');
    console.log('1. Verifica que MySQL esté ejecutándose');
    console.log('2. Confirma las credenciales de la base de datos');
    console.log('3. Asegúrate de que la base de datos existe');
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Ejecutar exportación
exportDatabase();