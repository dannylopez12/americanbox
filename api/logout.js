module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🚪 Logout request received');

  try {
    // Aquí podríamos limpiar sesiones de base de datos si fuera necesario
    // Por ahora, solo respondemos con éxito

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    console.log('🚪 Logout successful');
    return res.status(200).json({ ok: true, message: 'Logged out successfully' });

  } catch (error) {
    console.error('🚪 Logout error:', error);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: 'Internal server error' });
  }
}