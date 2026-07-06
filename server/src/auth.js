import jwt from 'jsonwebtoken';
import db from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'cnb-asia-academy-2024-secret';

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) {
    return res.status(401).json({ error: '未登录' });
  }
  const token = header.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

// Middleware: user must be approved (used for action routes like submit work)
export function approvedUserMiddleware(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: '未登录' });
  }
  const user = db.prepare('SELECT status FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(401).json({ error: '用户不存在' });
  }
  if (user.status !== 'approved' && user.role !== 'admin') {
    return res.status(403).json({ error: '账号未审核通过，无法执行此操作' });
  }
  next();
}

export function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: '需要管理员权限' });
  }
  next();
}
