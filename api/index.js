const path = require('path');
const fs = require('fs');

// Cargar el servidor principal
const serverPath = path.join(__dirname, '..', 'americanbox-api', 'server.js');

// Verificar que el archivo existe
if (fs.existsSync(serverPath)) {
  module.exports = require(serverPath);
} else {
  module.exports = (req, res) => {
    res.status(500).json({ 
      error: 'Server file not found',
      path: serverPath 
    });
  };
}