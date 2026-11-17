// Importaciones
const jwt = require('jsonwebtoken');

// Middleware JWT
const verificarToken = (req, res, next) => {
    const cabecera = req.headers['authorization'] || '';
    const [tipo, token] = cabecera.split(' ');

    if (tipo !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Acceso denegado, falta el token' });
    }

    try {
        // Verificación del token
        req.cliente = jwt.verify(token, process.env.JWT_SECRETO);
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido o expirado' });
    }
};

// Exportación
module.exports = verificarToken;
