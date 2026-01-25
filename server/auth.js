// Simple auth middleware for protecting admin/api routes
function ensureAuth(req, res, next) {
  // If user is already authenticated, proceed
  if (req.session && req.session.user) {
    return next();
  }
  // Permit login path
  if (req.path === '/api/login' || req.path === '/login') {
    return next();
  }
  // Otherwise deny
  res.status(401).json({ error: 'Unauthorized' });
}

module.exports = { ensureAuth };
