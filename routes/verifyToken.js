const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const token = req.header('auth-token');
  if (!token) return res.status(401).send('Acceso denegado');

  try {
    const verificado = jwt.verify(token, process.env.TOKEN_SECRET);
    req.user = verificado;
    next();
  } catch (err) {
    res.status(400).send('Token inválido');
  }
};