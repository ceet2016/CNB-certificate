import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db.js';
import { generateToken, authMiddleware } from '../auth.js';
import { getPublicKeyBase64, rsaDecrypt } from '../utils/rsa.js';
import { generateCaptcha, verifyCaptcha } from '../utils/captcha.js';
import {
  validateUsername, validateEmail, validatePassword, validateFullName,
  sanitize, checkIpRegistrationLimit, recordRegistrationAttempt, getClientIp,
  hasChinese, checkLoginRateLimit, recordLoginFailure, clearLoginFailures, getRemainingAttempts,
} from '../utils/validate.js';

const router = Router();

// --- RSA public key (for frontend encryption) ---
router.get('/public-key', (req, res) => {
  res.json({ publicKey: getPublicKeyBase64() });
});

// --- Captcha generation ---
router.get('/captcha', (req, res) => {
  const captcha = generateCaptcha();
  res.json(captcha);
});

// Register (requires captcha, IP rate limited, account pending approval)
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, full_name, captcha_id, captcha_answer } = req.body;

    // --- Verify captcha first ---
    if (!captcha_id || !captcha_answer) {
      return res.status(400).json({ error: '请输入验证码' });
    }
    if (!verifyCaptcha(captcha_id, captcha_answer)) {
      return res.status(400).json({ error: '验证码错误或已过期' });
    }

    // --- Sanitize inputs ---
    const cleanUsername = sanitize(username, 20);
    const cleanEmail = sanitize(email, 254).toLowerCase();
    const cleanFullName = sanitize(full_name, 30);

    // --- Validate inputs (validate original before truncation) ---
    const usernameCheck = validateUsername(username);
    if (!usernameCheck.valid) {
      return res.status(400).json({ error: usernameCheck.error });
    }

    const emailCheck = validateEmail(cleanEmail);
    if (!emailCheck.valid) {
      return res.status(400).json({ error: emailCheck.error });
    }

    // Password may be RSA-encrypted (frontend always encrypts)
    let plainPassword = password;
    if (typeof password === 'string' && password.length > 100) {
      // Likely RSA-encrypted
      try {
        plainPassword = rsaDecrypt(password);
      } catch {
        return res.status(400).json({ error: '密码解密失败，请重试' });
      }
    }

    const passwordCheck = validatePassword(plainPassword);
    if (!passwordCheck.valid) {
      return res.status(400).json({ error: passwordCheck.error });
    }

    const fullNameCheck = validateFullName(cleanFullName);
    if (!fullNameCheck.valid) {
      return res.status(400).json({ error: fullNameCheck.error });
    }

    // --- Check username/email uniqueness ---
    const exists = db.prepare('SELECT id FROM users WHERE username = ? OR email = ?').get(cleanUsername, cleanEmail);
    if (exists) {
      return res.status(409).json({ error: '用户名或邮箱已被注册' });
    }

    // --- IP rate limiting ---
    const clientIp = getClientIp(req);
    const ipCheck = checkIpRegistrationLimit(clientIp);
    if (!ipCheck.allowed) {
      return res.status(429).json({ error: ipCheck.error });
    }

    // --- Create user with status='pending' ---
    const hash = bcrypt.hashSync(plainPassword, 10);
    const result = db.prepare(`
      INSERT INTO users (username, email, password, full_name, status, registered_ip)
      VALUES (?, ?, ?, ?, 'pending', ?)
    `).run(cleanUsername, cleanEmail, hash, cleanFullName || cleanUsername, clientIp);

    recordRegistrationAttempt(clientIp);

    // Do NOT return a token — user must wait for admin approval
    res.json({
      message: '注册成功！您的账号需要管理员审核通过后才能登录，请耐心等待。',
      pending: true,
      username: cleanUsername,
    });
  } catch (e) {
    res.status(500).json({ error: '注册失败：' + e.message });
  }
});

// Login (RSA-encrypted password, requires captcha, checks account status, IP rate-limited)
router.post('/login', (req, res) => {
  try {
    const { username, password, encrypted, captcha_id, captcha_answer } = req.body;
    const clientIp = getClientIp(req);

    // --- 1. IP rate limit check (before anything else) ---
    const rateCheck = checkLoginRateLimit(clientIp);
    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: rateCheck.error,
        locked: true,
        retryAfter: rateCheck.retryAfter,
      });
    }

    // --- 2. Basic presence check ---
    if (!username || !password) {
      return res.status(400).json({ error: '请输入用户名和密码' });
    }

    // --- 3. Verify captcha ---
    if (!captcha_id || !captcha_answer) {
      return res.status(400).json({ error: '请输入验证码' });
    }
    if (!verifyCaptcha(captcha_id, captcha_answer)) {
      return res.status(400).json({ error: '验证码错误或已过期', captchaFailed: true });
    }

    // --- 4. Validate username format (length, no Chinese) ---
    if (typeof username !== 'string' || username.length > 254) {
      return res.status(400).json({ error: '用户名或邮箱长度不能超过254位' });
    }
    if (hasChinese(username)) {
      return res.status(400).json({ error: '用户名不能包含中文' });
    }

    // --- 5. Decrypt password if RSA-encrypted ---
    let plainPassword = password;
    if (encrypted) {
      try {
        plainPassword = rsaDecrypt(password);
      } catch {
        return res.status(401).json({ error: '密码解密失败，请重试' });
      }
    }

    // --- 6. Validate password format (max 36, no Chinese) ---
    if (typeof plainPassword !== 'string' || plainPassword.length > 36) {
      return res.status(400).json({ error: '密码长度不能超过36位' });
    }
    if (hasChinese(plainPassword)) {
      return res.status(400).json({ error: '密码不能包含中文' });
    }

    // --- 7. Look up user ---
    const cleanUsername = sanitize(username, 254);
    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(cleanUsername, cleanUsername.toLowerCase());
    if (!user) {
      recordLoginFailure(clientIp);
      const remaining = getRemainingAttempts(clientIp);
      const rateCheck2 = checkLoginRateLimit(clientIp);
      if (rateCheck2.locked) {
        return res.status(429).json({ error: rateCheck2.error, locked: true, retryAfter: rateCheck2.retryAfter });
      }
      return res.status(401).json({
        error: remaining > 0 ? `用户名或密码错误，还可尝试${remaining}次` : '登录失败次数过多，请稍后再试',
        remaining,
      });
    }

    // --- 8. Admin must use RSA encryption ---
    if (user.role === 'admin' && !encrypted) {
      return res.status(403).json({ error: '管理员登录需要加密传输', requireEncryption: true });
    }

    // --- 9. Compare password ---
    if (!bcrypt.compareSync(plainPassword, user.password)) {
      recordLoginFailure(clientIp);
      const remaining = getRemainingAttempts(clientIp);
      const rateCheck2 = checkLoginRateLimit(clientIp);
      if (rateCheck2.locked) {
        return res.status(429).json({ error: rateCheck2.error, locked: true, retryAfter: rateCheck2.retryAfter });
      }
      return res.status(401).json({
        error: remaining > 0 ? `用户名或密码错误，还可尝试${remaining}次` : '登录失败次数过多，请稍后再试',
        remaining,
      });
    }

    // --- 10. Password correct — clear IP failures ---
    clearLoginFailures(clientIp);

    // --- 11. Check account status ---
    if (user.status === 'pending') {
      return res.status(403).json({
        error: '您的账号正在审核中，请等待管理员审核通过后再登录',
        pending: true,
      });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({
        error: '您的注册申请已被拒绝，如有疑问请联系管理员',
        rejected: true,
      });
    }
    if (user.status !== 'approved') {
      return res.status(403).json({ error: '账号状态异常，请联系管理员' });
    }

    // --- 12. Return token ---
    const { password: _, ...userSafe } = user;
    const token = generateToken(user);
    res.json({ token, user: userSafe });
  } catch (e) {
    res.status(500).json({ error: '登录失败：' + e.message });
  }
});

// Get current user
router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, username, email, full_name, avatar, bio, role, status, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json({ user });
});

// Update profile
router.put('/profile', authMiddleware, (req, res) => {
  const { full_name, avatar, bio } = req.body;
  const cleanFullName = sanitize(full_name, 30);
  const cleanAvatar = sanitize(avatar, 500);
  const cleanBio = sanitize(bio, 500);

  const fullNameCheck = validateFullName(cleanFullName);
  if (!fullNameCheck.valid) {
    return res.status(400).json({ error: fullNameCheck.error });
  }

  db.prepare('UPDATE users SET full_name = ?, avatar = ?, bio = ? WHERE id = ?')
    .run(cleanFullName, cleanAvatar, cleanBio, req.user.id);
  const user = db.prepare('SELECT id, username, email, full_name, avatar, bio, role, status, created_at FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
});

export default router;
