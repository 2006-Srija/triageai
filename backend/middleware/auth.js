import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('Missing JWT_SECRET environment variable');
  process.exit(1);
}

/**
 * Verifies JWT and attaches req.user = { user_id, tenant_id, role, email, name }.
 * Every protected route must use this — tenant_id is extracted from the token,
 * NEVER from the request body or query params.
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      user_id: decoded.user_id,
      tenant_id: decoded.tenant_id,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware factory — returns middleware that checks req.user.role is in allowedRoles.
 * Must be used AFTER authenticate.
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: `Access denied. Required role: ${allowedRoles.join(' or ')}` });
    }
    next();
  };
}
